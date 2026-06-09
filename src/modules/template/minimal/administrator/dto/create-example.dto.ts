import {
  IsString,
  IsOptional,
  IsBoolean,
  IsNumber,
  MinLength,
  MaxLength,
  Min,
  Max,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

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

  // Campos de referência (IDs de relacionamentos)
  // O UniversalRepository transforma automaticamente: relatedEntityId → { connect: { id } }

  @ApiPropertyOptional({ description: 'ID da entidade relacionada' })
  @IsString()
  @IsOptional()
  relatedEntityId?: string;

  // NÃO incluir: id, createdAt, updatedAt, deletedAt, companyId
  // O companyId é injetado automaticamente pelo UniversalRepository via TenantService
}
