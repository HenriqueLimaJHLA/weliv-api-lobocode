import {
  IsString,
  IsOptional,
  IsBoolean,
  IsNumber,
  IsEnum,
  IsDateString,
  MinLength,
  MaxLength,
  Min,
  Max,
  IsArray,
  ArrayMinSize,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum ExampleStatus {
  PENDING   = 'PENDING',
  ACTIVE    = 'ACTIVE',
  INACTIVE  = 'INACTIVE',
  CANCELLED = 'CANCELLED',
}

export enum ExampleType {
  STANDARD  = 'STANDARD',
  PREMIUM   = 'PREMIUM',
  CUSTOM    = 'CUSTOM',
}

export class CreateExampleDto {
  @ApiProperty({ description: 'Nome do exemplo', example: 'Meu exemplo' })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name: string;

  @ApiPropertyOptional({ description: 'Descrição do exemplo' })
  @IsString()
  @IsOptional()
  @MaxLength(1000)
  description?: string;

  @ApiPropertyOptional({
    description: 'Código único de identificação',
    example: 'EX-001',
  })
  @IsString()
  @IsOptional()
  @MaxLength(50)
  code?: string;

  @ApiPropertyOptional({
    description: 'Tipo do exemplo',
    enum: ExampleType,
    default: ExampleType.STANDARD,
  })
  @IsEnum(ExampleType)
  @IsOptional()
  type?: ExampleType;

  @ApiPropertyOptional({
    description: 'Status inicial',
    enum: ExampleStatus,
    default: ExampleStatus.PENDING,
  })
  @IsEnum(ExampleStatus)
  @IsOptional()
  status?: ExampleStatus;

  @ApiPropertyOptional({ description: 'Indica se está ativo', default: true })
  @IsBoolean()
  @IsOptional()
  active?: boolean;

  @ApiPropertyOptional({ description: 'Valor numérico em centavos', example: 5000 })
  @IsNumber()
  @IsOptional()
  @Min(0)
  amount?: number;

  @ApiPropertyOptional({
    description: 'Data de início (ISO 8601)',
    example: '2026-01-01',
  })
  @IsDateString()
  @IsOptional()
  startsAt?: string;

  @ApiPropertyOptional({
    description: 'Data de encerramento (ISO 8601)',
    example: '2026-12-31',
  })
  @IsDateString()
  @IsOptional()
  endsAt?: string;

  // Campos de referência (IDs de relacionamentos)
  @ApiPropertyOptional({ description: 'ID do owner da entidade' })
  @IsString()
  @IsOptional()
  ownerId?: string;

  @ApiPropertyOptional({ description: 'ID da entidade pai' })
  @IsString()
  @IsOptional()
  parentId?: string;

  // NÃO incluir: id, createdAt, updatedAt, deletedAt, companyId
}
