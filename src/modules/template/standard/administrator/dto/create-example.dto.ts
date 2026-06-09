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
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

// Exemplo de enum específico da entidade
export enum ExampleStatus {
  PENDING   = 'PENDING',
  ACTIVE    = 'ACTIVE',
  INACTIVE  = 'INACTIVE',
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
  @MaxLength(500)
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
    description: 'Status do exemplo',
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

  @ApiPropertyOptional({ description: 'Posição na ordenação', example: 1 })
  @IsNumber()
  @IsOptional()
  @Min(0)
  @Max(9999)
  sortOrder?: number;

  @ApiPropertyOptional({
    description: 'Data de vencimento (ISO 8601)',
    example: '2026-12-31',
  })
  @IsDateString()
  @IsOptional()
  dueDate?: string;

  // Campos de referência (IDs de relacionamentos)
  @ApiPropertyOptional({ description: 'ID da entidade relacionada' })
  @IsString()
  @IsOptional()
  relatedEntityId?: string;

  // NÃO incluir: id, createdAt, updatedAt, deletedAt, companyId
}
