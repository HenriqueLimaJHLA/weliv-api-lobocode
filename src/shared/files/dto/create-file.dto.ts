import {
  IsString,
  IsOptional,
  IsEnum,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum FileType {
  PROFILE_IMAGE = 'PROFILE_IMAGE',
  SERVICE_IMAGE = 'SERVICE_IMAGE',
  DOCUMENT = 'DOCUMENT',
  OTHER = 'OTHER',
}

export class CreateFileDto {
  @ApiPropertyOptional({ description: 'Nome original do arquivo' })
  @IsString()
  @IsOptional()
  @MaxLength(255)
  originalName?: string;

  @ApiPropertyOptional({ description: 'Tipo de arquivo', enum: FileType })
  @IsEnum(FileType)
  @IsOptional()
  type?: FileType;

  @ApiPropertyOptional({ description: 'Descrição do arquivo' })
  @IsString()
  @IsOptional()
  @MaxLength(500)
  description?: string;

  // NÃO incluir: id, fileName, size, mimeType, url, uploadedBy, companyId
  // NÃO incluir: createdAt, updatedAt, deletedAt
  // Estes campos são preenchidos automaticamente no upload
}
