import {
  IsString,
  IsOptional,
  IsBoolean,
  IsNumber,
  IsEnum,
  MinLength,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum SettingType {
  STRING = 'STRING',
  NUMBER = 'NUMBER',
  BOOLEAN = 'BOOLEAN',
  JSON = 'JSON',
  ENCRYPTED = 'ENCRYPTED',
}

export class CreateSettingDto {
  @ApiProperty({ description: 'Chave da configuração', example: 'app.name' })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  key: string;

  @ApiProperty({ description: 'Valor da configuração' })
  @IsString()
  value: any;

  @ApiPropertyOptional({ description: 'Descrição' })
  @IsString()
  @IsOptional()
  @MaxLength(255)
  description?: string;

  @ApiPropertyOptional({ description: 'Tipo', enum: SettingType, default: SettingType.STRING })
  @IsEnum(SettingType)
  @IsOptional()
  type?: SettingType;

  @ApiPropertyOptional({ description: 'É público (visível para todos)', default: false })
  @IsBoolean()
  @IsOptional()
  isPublic?: boolean;

  @ApiPropertyOptional({ description: 'Está ativo', default: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiPropertyOptional({ description: 'Categoria' })
  @IsString()
  @IsOptional()
  @MaxLength(50)
  category?: string;

  // NÃO incluir: id, companyId, createdAt, updatedAt, deletedAt
}