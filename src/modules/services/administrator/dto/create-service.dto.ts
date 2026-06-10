import { IsString, IsNotEmpty, IsOptional, IsEnum, IsNumber, MaxLength, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CatalogItemStatus } from '@prisma/client';
import { Transform } from 'class-transformer';

// ═══════════════════════════════════════════════════════════════════════════════
// DTO - Create Service (Administrator)
// ═══════════════════════════════════════════════════════════════════════════════

export class CreateServiceDto {
  @ApiProperty({
    description: 'Nome do serviço/procedimento',
    example: 'Consulta Cardiológica',
    maxLength: 100,
  })
  @IsString({ message: 'Nome deve ser uma string' })
  @IsNotEmpty({ message: 'Nome é obrigatório' })
  @MaxLength(100)
  @Transform(({ value }) => value?.trim())
  name: string;

  @ApiPropertyOptional({
    description: 'Descrição do serviço',
    example: 'Consulta de avaliação cardiológica completa',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    description: 'Duração em minutos',
    example: 30,
    minimum: 5,
    maximum: 480,
  })
  @IsOptional()
  @IsNumber()
  @Min(5)
  duration?: number;

  @ApiPropertyOptional({
    description: 'Preço do serviço',
    example: 150.00,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  price?: number;

  @ApiPropertyOptional({
    description: 'Status do serviço',
    enum: CatalogItemStatus,
    default: CatalogItemStatus.ACTIVE,
  })
  @IsOptional()
  @IsEnum(CatalogItemStatus)
  status?: CatalogItemStatus = CatalogItemStatus.ACTIVE;

  @ApiPropertyOptional({
    description: 'Ordem de exibição',
    example: 1,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  order?: number;

  @ApiPropertyOptional({
    description: 'ID da especialidade vinculada',
    example: 'clx1234567890',
  })
  @IsOptional()
  @IsString()
  specialtyId?: string;

  // companyId será preenchido automaticamente pelo TenantInterceptor
  @ApiPropertyOptional({
    description: 'ID da empresa (preenchido automaticamente)',
  })
  @IsOptional()
  @IsString()
  companyId?: string;
}