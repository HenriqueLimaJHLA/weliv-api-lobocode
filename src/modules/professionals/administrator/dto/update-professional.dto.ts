import { IsString, IsOptional, IsEnum, IsNumber, IsBoolean, MaxLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { ProfessionalStatus } from '@prisma/client';
import { Transform } from 'class-transformer';

// ═══════════════════════════════════════════════════════════════════════════════
// DTO - Update Professional (Administrator)
// ═══════════════════════════════════════════════════════════════════════════════

export class UpdateProfessionalDto {
  @ApiPropertyOptional({
    description: 'Título profissional',
    example: 'Dr.',
    maxLength: 20,
  })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  professionalTitle?: string;

  @ApiPropertyOptional({
    description: 'Biografia do profissional',
    example: 'Médico cardiologista com 15 anos de experiência...',
  })
  @IsOptional()
  @IsString()
  biography?: string;

  @ApiPropertyOptional({
    description: 'Número de registro profissional (CRM, CRO, etc)',
    example: 'CRM/SP 123456',
  })
  @IsOptional()
  @IsString()
  registrationNumber?: string;

  @ApiPropertyOptional({
    description: 'ID da especialidade',
    example: 'specialty_1234567890',
  })
  @IsOptional()
  @IsString()
  specialtyId?: string;

  @ApiPropertyOptional({
    description: 'Preço da consulta',
    example: 200.00,
  })
  @IsOptional()
  @IsNumber()
  consultationPrice?: number;

  @ApiPropertyOptional({
    description: 'Aceita convênio',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  acceptsInsurance?: boolean;

  @ApiPropertyOptional({
    description: 'Lista de convênios aceitos',
    example: ['Unimed', 'Bradesco Saúde'],
    type: [String],
  })
  @IsOptional()
  insurances?: string[];

  @ApiPropertyOptional({
    description: 'Permite remarcação',
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  remarcationEnabled?: boolean;

  @ApiPropertyOptional({
    description: 'Limite de remarcações',
    example: 3,
  })
  @IsOptional()
  @IsNumber()
  remarcationLimit?: number;

  @ApiPropertyOptional({
    description: 'Permite lista de espera',
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  waitingListEnabled?: boolean;

  @ApiPropertyOptional({
    description: 'Percentual de entrada exigido',
    example: 20,
  })
  @IsOptional()
  @IsNumber()
  depositPercentage?: number;

  @ApiPropertyOptional({
    description: 'Agenda disponível (formato JSON)',
    example: { monday: ['09:00-12:00', '14:00-18:00'] },
  })
  @IsOptional()
  availableSchedule?: any;

  @ApiPropertyOptional({
    description: 'Cor de identificação no calendário',
    example: '#3498db',
  })
  @IsOptional()
  @IsString()
  color?: string;

  @ApiPropertyOptional({
    description: 'Status do profissional',
    enum: ProfessionalStatus,
  })
  @IsOptional()
  @IsEnum(ProfessionalStatus)
  status?: ProfessionalStatus;
}