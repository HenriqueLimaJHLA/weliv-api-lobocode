import { IsString, IsNumber, IsEnum, IsOptional, IsDateString, Min } from 'class-validator';
import { ChargeMethod } from '@prisma/client';

export class CreateChargeDto {
  @IsString()
  patientId: string;

  @IsOptional()
  @IsString()
  appointmentId?: string;

  @IsOptional()
  @IsString()
  companyUnitId?: string;

  @IsNumber()
  @Min(0)
  amount: number;

  @IsDateString()
  dueDate: string;

  @IsEnum(ChargeMethod)
  method: ChargeMethod;

  @IsOptional()
  @IsString()
  externalReference?: string;
}
