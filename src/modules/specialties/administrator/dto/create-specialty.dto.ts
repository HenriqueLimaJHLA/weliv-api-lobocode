import { IsString, IsNotEmpty, IsOptional, IsEnum, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CatalogItemStatus } from '@prisma/client';
import { Transform } from 'class-transformer';

// ═══════════════════════════════════════════════════════════════════════════════
// DTO - Create Specialty (Administrator)
// ═══════════════════════════════════════════════════════════════════════════════

export class CreateSpecialtyDto {
  @ApiProperty({
    description: 'Nome da especialidade',
    example: 'Cardiologia',
    maxLength: 100,
  })
  @IsString({ message: 'Nome deve ser uma string' })
  @IsNotEmpty({ message: 'Nome é obrigatório' })
  @MaxLength(100)
  @Transform(({ value }) => value?.trim())
  name: string;

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
    default: CatalogItemStatus.ACTIVE,
  })
  @IsOptional()
  @IsEnum(CatalogItemStatus)
  status?: CatalogItemStatus = CatalogItemStatus.ACTIVE;

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

  // companyId será preenchido automaticamente pelo TenantInterceptor
  @ApiPropertyOptional({
    description: 'ID da empresa (preenchido automaticamente)',
  })
  @IsOptional()
  @IsString()
  companyId?: string;
}