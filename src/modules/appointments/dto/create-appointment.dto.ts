import {
  IsString,
  IsOptional,
  IsISO8601,
  IsEnum,
  IsNumber,
  IsBoolean,
  Min,
} from 'class-validator';
import { AppointmentStatus, AppointmentType } from '@prisma/client';
import { VALIDATION_MESSAGES } from 'src/shared/common/messages';

export class CreateAppointmentDto {
  @IsISO8601({}, { message: 'startsAt deve ser uma data/hora ISO-8601 válida' })
  startsAt: string; // ex: "2025-06-10T09:00:00.000Z"

  @IsString({ message: VALIDATION_MESSAGES.REQUIRED.FIELD })
  patientId: string;

  @IsString({ message: VALIDATION_MESSAGES.REQUIRED.FIELD })
  professionalId: string;

  @IsOptional()
  @IsString()
  companyId?: string;

  @IsOptional()
  @IsEnum(AppointmentType)
  type?: AppointmentType;

  @IsOptional()
  @IsEnum(AppointmentStatus)
  status?: AppointmentStatus;

  @IsOptional()
  @IsNumber()
  @Min(0)
  depositAmount?: number;

  @IsOptional()
  @IsBoolean()
  depositPaid?: boolean;

  @IsOptional()
  @IsString()
  notes?: string;
}
