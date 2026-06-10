import { IsString, IsOptional, IsEnum, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PatientCareStatus } from '@prisma/client';

// ═══════════════════════════════════════════════════════════════════════════════
// DTO - Create Patient (Administrator)
// ═══════════════════════════════════════════════════════════════════════════════

export class CreatePatientDto {
  @ApiProperty({
    description: 'ID do usuário (obrigatório)',
    example: 'user_1234567890',
  })
  @IsString({ message: 'userId é obrigatório' })
  userId: string;

  @ApiPropertyOptional({
    description: 'Convênio/plano de saúde',
    example: 'Unimed',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  healthPlan?: string;

  @ApiPropertyOptional({
    description: 'Status de cuidado',
    enum: PatientCareStatus,
    default: PatientCareStatus.ACTIVE,
  })
  @IsOptional()
  @IsEnum(PatientCareStatus)
  careStatus?: PatientCareStatus = PatientCareStatus.ACTIVE;

  @ApiPropertyOptional({
    description: 'Tipo sanguíneo',
    example: 'O+',
  })
  @IsOptional()
  @IsString()
  @MaxLength(5)
  bloodType?: string;

  @ApiPropertyOptional({
    description: 'Lista de alergias',
    example: ['Penicilina', 'Dipirona'],
    type: [String],
  })
  @IsOptional()
  allergies?: string[];

  @ApiPropertyOptional({
    description: 'Condições crônicas',
    example: ['Diabetes', 'Hipertensão'],
    type: [String],
  })
  @IsOptional()
  chronicConditions?: string[];

  @ApiPropertyOptional({
    description: 'Nome do responsável',
    example: 'Maria Silva',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  guardianName?: string;

  @ApiPropertyOptional({
    description: 'Telefone do responsável',
    example: '(11) 99999-9999',
  })
  @IsOptional()
  @IsString()
  guardianPhone?: string;

  @ApiPropertyOptional({
    description: 'Documento do responsável (CPF)',
    example: '123.456.789-00',
  })
  @IsOptional()
  @IsString()
  guardianDocument?: string;

  // companyId será preenchido automaticamente pelo TenantInterceptor
  @ApiPropertyOptional({
    description: 'ID da empresa (preenchido automaticamente)',
  })
  @IsOptional()
  @IsString()
  companyId?: string;
}