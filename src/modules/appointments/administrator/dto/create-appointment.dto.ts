import { IsString, IsNotEmpty, IsOptional, IsEnum, IsNumber, IsDateString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AppointmentType, AppointmentStatus } from '@prisma/client';

export class CreateAppointmentDto {
  @ApiProperty({ description: 'ID do profissional' })
  @IsString()
  @IsNotEmpty()
  professionalId: string;

  @ApiProperty({ description: 'ID do paciente' })
  @IsString()
  @IsNotEmpty()
  patientId: string;

  @ApiPropertyOptional({ description: 'ID do serviço' })
  @IsOptional()
  @IsString()
  serviceId?: string;

  @ApiProperty({ description: 'Data e hora de início (ISO 8601)' })
  @IsDateString()
  startsAt: string;

  @ApiPropertyOptional({ description: 'Data e hora de fim (ISO 8601)' })
  @IsOptional()
  @IsDateString()
  endsAt?: string;

  @ApiPropertyOptional({ enum: AppointmentType, default: AppointmentType.PRESENCIAL })
  @IsOptional()
  @IsEnum(AppointmentType)
  type?: AppointmentType = AppointmentType.PRESENCIAL;

  @ApiPropertyOptional({ description: 'Observações' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ description: 'Motivo da consulta' })
  @IsOptional()
  @IsString()
  reason?: string;

  @ApiPropertyOptional({ description: 'Valor do depósito' })
  @IsOptional()
  @IsNumber()
  depositAmount?: number;

  // companyId será preenchido automaticamente
  @ApiPropertyOptional({ description: 'ID da empresa' })
  @IsOptional()
  @IsString()
  companyId?: string;
}