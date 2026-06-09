import { Injectable, Inject, Optional, Scope, Logger } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import {
  UniversalService,
  UniversalRepository,
  UniversalMetricsService,
  UniversalQueryService,
  UniversalPermissionService,
  createEntityConfig,
} from 'src/shared/universal';
import { ForbiddenError, NotFoundError, ConflictError } from 'src/shared/common/errors';
import { PrismaService } from 'src/shared/prisma/prisma.service';
import * as Minio from 'minio';
import { CreateFileDto, FileType } from './dto/create-file.dto';
import { UpdateFileDto } from './dto/update-file.dto';

// ═══════════════════════════════════════════════════════════════════════════════
// SERVICE - Files (shared)
// ═══════════════════════════════════════════════════════════════════════════════

@Injectable({ scope: Scope.REQUEST })
export class FilesService extends UniversalService<
  CreateFileDto,
  UpdateFileDto
> {
  private static readonly entityConfig = createEntityConfig('file');
  private readonly logger = new Logger(FilesService.name);
  private minioClient: Minio.Client;
  private bucketName: string;

  constructor(
    repository: UniversalRepository<CreateFileDto, UpdateFileDto>,
    queryService: UniversalQueryService,
    permissionService: UniversalPermissionService,
    metricsService: UniversalMetricsService,
    @Optional() @Inject(REQUEST) protected readonly request: any,
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {
    const { model, casl } = FilesService.entityConfig;
    super(
      repository,
      queryService,
      permissionService,
      metricsService,
      request,
      model,
      casl,
    );
    this.setEntityConfig();
    this.initMinio();
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // MINIO CONFIGURATION
  // ═══════════════════════════════════════════════════════════════════════════════

  private initMinio() {
    this.bucketName = this.configService.get<string>('MINIO_BUCKET_NAME', 'lobocode-files');

    const minioHost = this.configService.get<string>('MINIO_HOST', 'localhost');
    const minioPort = parseInt(this.configService.get<string>('MINIO_PORT', '9000'), 10);
    const useSSL = this.configService.get<string>('MINIO_USE_SSL', 'false') === 'true';

    this.minioClient = new Minio.Client({
      endPoint: minioHost,
      port: minioPort,
      useSSL,
      accessKey: this.configService.get<string>('MINIO_ROOT_USER', 'admin'),
      secretKey: this.configService.get<string>('MINIO_ROOT_PASSWORD', 'password123'),
    });

    this.ensureBucket();
  }

  private async ensureBucket(): Promise<void> {
    try {
      const exists = await this.minioClient.bucketExists(this.bucketName);
      if (!exists) {
        await this.minioClient.makeBucket(this.bucketName, 'us-east-1');
        this.logger.log(`Bucket '${this.bucketName}' criado`);
      }
      await this.setPublicPolicy();
    } catch (error: any) {
      const msg = this.getErrorMessage(error);
      if (msg.includes('ECONNREFUSED') || msg.includes('ENOTFOUND')) {
        this.logger.warn('MinIO não está acessível');
      }
    }
  }

  private getErrorMessage(error: any): string {
    if (error instanceof AggregateError) {
      return error.errors?.[0]?.message || error.message || 'Erro desconhecido';
    }
    return error?.message || error?.toString() || 'Erro desconhecido';
  }

  private async setPublicPolicy(): Promise<void> {
    try {
      const policy = {
        Version: '2012-10-17',
        Statement: [{
          Effect: 'Allow',
          Principal: { AWS: ['*'] },
          Action: ['s3:GetObject'],
          Resource: [`arn:aws:s3:::${this.bucketName}/*`],
        }],
      };
      await this.minioClient.setBucketPolicy(this.bucketName, JSON.stringify(policy));
    } catch (error: any) {
      this.logger.warn(`Não foi possível configurar política pública: ${error?.message}`);
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // CONFIGURAÇÃO DE ENTITY
  // ═══════════════════════════════════════════════════════════════════════════════

  private setEntityConfig() {
    this.entityConfig = {
      includes: {
        company: {
          select: { id: true, name: true },
        },
      },
      transform: {
        flatten: {
          company: { field: 'name', target: 'companyName' },
        },
        custom: (data) => {
          // Formatar tamanho
          if (data.size) {
            data.sizeFormatted = this.formatBytes(data.size);
          }

          // Tipo label
          data.typeLabel = this.getTypeLabel(data.type);

          // Extensão do arquivo
          if (data.originalName) {
            data.extension = data.originalName.split('.').pop()?.toLowerCase();
          }

          return data;
        },
        exclude: [],
      },
    };
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // UPLOAD (MÉTODO CUSTOM - NÃO USA HOOKS)
  // ═══════════════════════════════════════════════════════════════════════════════

  async upload(file: any, type: FileType, description?: string): Promise<any> {
    this.permissionService.validarAction(this.entityNameCasl, 'create');

    const user = this.obterUsuarioLogado();
    const companyId = this.obterCompanyId();

    if (!companyId) {
      throw new ForbiddenError('Contexto de empresa não disponível');
    }

    if (!file || !file.buffer) {
      throw new ConflictError('Arquivo inválido ou buffer não encontrado');
    }

    // Gerar nome único
    const fileName = `${Date.now()}-${file.originalname}`;
    const folder = 'files';
    const fullPath = `${folder}/${fileName}`;

    // Upload para MinIO
    await this.minioClient.putObject(
      this.bucketName,
      fullPath,
      file.buffer,
      file.size,
      { 'Content-Type': file.mimetype },
    );

    // Gerar URL
    const minioEndpoint = this.configService.get<string>('MINIO_ENDPOINT', 'http://localhost:9000');
    const url = `${minioEndpoint}/${this.bucketName}/${fullPath}`;

    // Salvar no banco
    const fileData = {
      originalName: String(file.originalname),
      fileName: fullPath,
      type: type as FileType,
      size: Number(file.size),
      mimeType: String(file.mimetype),
      url,
      description,
      uploadedBy: user?.id,
      companyId,
    };
    const created = await (this.prisma.file as any).create({ data: fileData });

    this.logger.log(`Arquivo enviado: ${created.id}`);
    return { data: this.transformData(created) };
  }

  async deleteFile(id: string): Promise<any> {
    this.permissionService.validarAction(this.entityNameCasl, 'delete');

    const file = await this.prisma.file.findUnique({
      where: { id, deletedAt: null },
    });

    if (!file) {
      throw new NotFoundError(this.entityName, id, 'id');
    }

    // Deletar do MinIO
    try {
      await this.minioClient.removeObject(this.bucketName, file.fileName);
    } catch (error: any) {
      this.logger.warn(`Não foi possível deletar do MinIO: ${error?.message}`);
    }

    // Soft delete no banco
    await this.prisma.file.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    return { message: 'Arquivo deletado com sucesso' };
  }

  async deleteByUrl(url: string): Promise<void> {
    try {
      const file = await this.prisma.file.findFirst({
        where: { url: url.trim(), deletedAt: null },
      });

      if (!file) return;

      await this.minioClient.removeObject(this.bucketName, file.fileName);
      await this.prisma.file.update({
        where: { id: file.id },
        data: { deletedAt: new Date() },
      });

      this.logger.log(`Arquivo removido: ${file.fileName}`);
    } catch (error: any) {
      this.logger.warn(`Falha ao remover arquivo por URL: ${error?.message}`);
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // MÉTODOS CUSTOMIZADOS
  // ═══════════════════════════════════════════════════════════════════════════════

  async buscarPorTipo(type: FileType) {
    this.permissionService.validarAction(this.entityNameCasl, 'read');
    return this.buscarMuitosPorCampo('type', type);
  }

  async buscarPorUploadedBy(uploadedBy: string) {
    this.permissionService.validarAction(this.entityNameCasl, 'read');
    return this.buscarMuitosPorCampo('uploadedBy', uploadedBy);
  }

  async obterResumoEstatisticas() {
    this.permissionService.validarAction(this.entityNameCasl, 'read');

    const where = { deletedAt: null };

    const [total, profileImages, serviceImages, documents, other] = await Promise.all([
      this.repository.contarTodos(this.entityName, where),
      this.repository.contarTodos(this.entityName, { ...where, type: FileType.PROFILE_IMAGE }),
      this.repository.contarTodos(this.entityName, { ...where, type: FileType.SERVICE_IMAGE }),
      this.repository.contarTodos(this.entityName, { ...where, type: FileType.DOCUMENT }),
      this.repository.contarTodos(this.entityName, { ...where, type: FileType.OTHER }),
    ]);

    const totalSize = await this.prisma.file.aggregate({
      where,
      _sum: { size: true },
    });

    return {
      data: {
        total,
        byType: { profileImages, serviceImages, documents, other },
        totalSize: totalSize._sum.size || 0,
        totalSizeFormatted: this.formatBytes(totalSize._sum.size || 0),
      },
    };
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // HELPERS
  // ═══════════════════════════════════════════════════════════════════════════════

  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  private getTypeLabel(type: string): string {
    const labels: Record<string, string> = {
      PROFILE_IMAGE: 'Foto de Perfil',
      SERVICE_IMAGE: 'Imagem de Serviço',
      DOCUMENT: 'Documento',
      OTHER: 'Outro',
    };
    return labels[type] || type;
  }
}
