import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../../shared/prisma/prisma.service';
import * as Minio from 'minio';

export interface FileInfo {
  id: string;
  originalName: string;
  fileName: string;
  type: string;
  size: number;
  mimeType: string;
  url: string;
  companyId: string | null;
  uploadedBy: string | null;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

@Injectable()
export class FilesService {
  private readonly logger = new Logger(FilesService.name);
  private readonly minioClient: Minio.Client;
  private readonly bucketName = 'weliv-files';

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {
    const { host: minioHost, port: minioPort, useSSL } = this.resolveMinioEndpoint();

    this.minioClient = new Minio.Client({
      endPoint: minioHost,
      port: minioPort,
      useSSL,
      accessKey: this.configService.get<string>('MINIO_ROOT_USER', 'admin'),
      secretKey: this.configService.get<string>('MINIO_ROOT_PASSWORD', 'password123'),
    });

    this.initializeBucket();
  }

  /**
   * SDK MinIO: host/porta para o cliente S3.
   * - Com MINIO_HOST definido (ex.: minio no Docker): usa MINIO_PORT ou 9000 se host for o serviço compose.
   * - Sem MINIO_HOST: deriva de MINIO_ENDPOINT (ex.: http://localhost:19000 em dev na máquina host).
   */
  private resolveMinioEndpoint(): { host: string; port: number; useSSL: boolean } {
    const explicitHost = this.configService.get<string | undefined>('MINIO_HOST');
    const explicitPort = this.configService.get<string | undefined>('MINIO_PORT');
    const useSSLStr = this.configService.get<string>('MINIO_USE_SSL', 'false');
    let useSSL = useSSLStr === 'true';

    if (explicitHost) {
      const port = parseInt(
        explicitPort ?? (explicitHost === 'minio' ? '9000' : '19000'),
        10,
      );
      return { host: explicitHost, port, useSSL };
    }

    const endpoint = this.configService.get<string>(
      'MINIO_ENDPOINT',
      'http://localhost:19000',
    );
    try {
      const u = new URL(endpoint);
      const port = u.port
        ? parseInt(u.port, 10)
        : u.protocol === 'https:'
          ? 443
          : 80;
      if (u.protocol === 'https:' || u.protocol === 'http:') {
        useSSL = u.protocol === 'https:';
      }
      return { host: u.hostname, port, useSSL };
    } catch {
      this.logger.warn(
        `MINIO_ENDPOINT inválido (${endpoint}); usando localhost:19000`,
      );
      return { host: 'localhost', port: 19000, useSSL: false };
    }
  }

  private async initializeBucket(): Promise<void> {
    try {
      const bucketExists = await this.minioClient.bucketExists(this.bucketName);
      if (!bucketExists) {
        await this.minioClient.makeBucket(this.bucketName, 'us-east-1');
        this.logger.log(`Bucket '${this.bucketName}' criado com sucesso`);
      }

      // Configurar política de acesso público para leitura
      const publicReadPolicy = {
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Principal: { AWS: ['*'] },
            Action: ['s3:GetObject'],
            Resource: [`arn:aws:s3:::${this.bucketName}/*`],
          },
        ],
      };

      await this.minioClient.setBucketPolicy(
        this.bucketName,
        JSON.stringify(publicReadPolicy),
      );
      this.logger.log(`Política de acesso público configurada para bucket '${this.bucketName}'`);
    } catch (error) {
      this.logger.error(`Erro ao inicializar bucket: ${error.message}`);
    }
  } 

  async uploadFile(
    file: any,
    type: string,
    companyId?: string,
    uploadedBy?: string,
    description?: string,
  ): Promise<FileInfo> {
    try {
      // Gerar nome único para o arquivo
      const fileName = `${Date.now()}-${file.originalname}`;
      const folder = companyId ? `companies/${companyId}` : 'public';
      const fullPath = `${folder}/${fileName}`;

      // Upload para MinIO
      await this.minioClient.putObject(
        this.bucketName,
        fullPath,
        file.buffer,
        file.size,
        { 'Content-Type': file.mimetype },
      );

      // URL pública
      const minioEndpoint = this.configService.get<string>('MINIO_ENDPOINT', 'http://localhost:19000');  // weliv: bloco 19xxx 
      const url = `${minioEndpoint}/${this.bucketName}/${fullPath}`;

      // Salvar no banco
      const fileRecord = await this.prisma.file.create({
        data: {
          originalName: file.originalname,
          fileName: fullPath,
          type: type as any,
          size: file.size,
          mimeType: file.mimetype,
          url,
          companyId,
          uploadedBy,
          description,
        },
      });

      this.logger.log(`Arquivo enviado com sucesso: ${fileRecord.id}`);
      return fileRecord;
    } catch (error) {
      this.logger.error(`Erro ao fazer upload: ${error.message}`);
      throw new Error(`Falha no upload: ${error.message}`);
    }
  }

  async getAllFiles(page = 1, limit = 20, companyId?: string): Promise<{ files: FileInfo[]; total: number }> {
    try {
      const skip = (page - 1) * limit;
      const where = companyId ? { companyId } : {};

      const [files, total] = await Promise.all([
        this.prisma.file.findMany({
          where,
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
        }),
        this.prisma.file.count({ where }),
      ]);

      return { files, total };
    } catch (error) {
      this.logger.error(`Erro ao buscar arquivos: ${error.message}`);
      throw error;
    }
  }

  async getFileById(id: string): Promise<FileInfo> {
    try {
      const file = await this.prisma.file.findUnique({
        where: { id },
      });

      if (!file) {
        throw new Error('Arquivo não encontrado');
      }

      return file;
    } catch (error) {
      this.logger.error(`Erro ao buscar arquivo: ${error.message}`);
      throw error;
    }
  }

  async deleteFile(id: string): Promise<void> {
    try {
      const file = await this.prisma.file.findUnique({
        where: { id },
      });

      if (!file) {
        throw new Error('Arquivo não encontrado');
      }

      // Deletar do MinIO
      await this.minioClient.removeObject(this.bucketName, file.fileName);

      // Deletar do banco
      await this.prisma.file.delete({
        where: { id },
      });

      this.logger.log(`Arquivo deletado: ${id}`);
    } catch (error) {
      this.logger.error(`Erro ao deletar arquivo: ${error.message}`);
      throw error;
    }
  }
}
