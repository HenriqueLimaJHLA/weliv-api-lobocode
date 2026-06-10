import { IsString, IsOptional, IsEnum, IsNumber, IsDateString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { AppointmentType, AppointmentStatus } from '@prisma/client';

export class UpdateAppointmentDto {
  @ApiPropertyOptional({ description: 'Data e hora de início (ISO 8601)' })
  @IsOptional()
  @IsDateString()
  startsAt?: string;

  @ApiPropertyOptional({ description: 'Data e hora de fim (ISO 8601)' })
  @IsOptional()
  @IsDateString()
  endsAt?: string;

  @ApiPropertyOptional({ enum: AppointmentType })
  @IsOptional()
  @IsEnum(AppointmentType)
  type?: AppointmentType;

  @ApiPropertyOptional({ enum: AppointmentStatus })
  @IsOptional()
  @IsEnum(AppointmentStatus)
  status?: AppointmentStatus;

  @ApiPropertyOptional({ description: 'Observações' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ description: 'Motivo da consulta' })
  @IsOptional()
  @IsString()
  reason?: string;

  @ApiPropertyOptional({ description: 'Depósito pago' })
  @IsOptional()
  @IsNumber()
  depositPaid?: boolean;

  @ApiPropertyOptional({ description: 'Valor do depósito' })
  @IsOptional()
  @IsNumber()
  depositAmount?: number;
}