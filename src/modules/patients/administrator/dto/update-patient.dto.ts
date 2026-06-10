import { IsString, IsOptional, IsEnum, MaxLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PatientCareStatus } from '@prisma/client';

// ═══════════════════════════════════════════════════════════════════════════════
// DTO - Update Patient (Administrator)
// ═══════════════════════════════════════════════════════════════════════════════

export class UpdatePatientDto {
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
  })
  @IsOptional()
  @IsEnum(PatientCareStatus)
  careStatus?: PatientCareStatus;

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
}