import { IsString, IsOptional, IsEnum, MaxLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { CatalogItemStatus } from '@prisma/client';
import { Transform } from 'class-transformer';

// ═══════════════════════════════════════════════════════════════════════════════
// DTO - Update Specialty (Administrator)
// ═══════════════════════════════════════════════════════════════════════════════

export class UpdateSpecialtyDto {
  @ApiPropertyOptional({
    description: 'Nome da especialidade',
    example: 'Cardiologia',
    maxLength: 100,
  })
  @IsOptional()
  @IsString({ message: 'Nome deve ser uma string' })
  @MaxLength(100)
  @Transform(({ value }) => value?.trim())
  name?: string;

  @ApiPropertyOptional({
    description: 'Descrição da especialidade',
    example: 'Especialidade que trata do coração e sistema circulatório',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    description: 'Status da especialidade',
    enum: CatalogItemStatus,
  })
  @IsOptional()
  @IsEnum(CatalogItemStatus)
  status?: CatalogItemStatus;

  @ApiPropertyOptional({
    description: 'Ícone para representação visual',
    example: 'fa-heart',
  })
  @IsOptional()
  @IsString()
  icon?: string;

  @ApiPropertyOptional({
    description: 'Cor para representação visual',
    example: '#FF5733',
  })
  @IsOptional()
  @IsString()
  color?: string;

  @ApiPropertyOptional({
    description: 'Categoria para agrupamento',
    example: 'Clínica Geral',
  })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  category?: string;
}