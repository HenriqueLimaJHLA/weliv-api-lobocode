import { IsEnum, IsOptional, IsDateString } from 'class-validator';
import { ChargeStatus } from '@prisma/client';

export class UpdateChargeDto {
  @IsOptional()
  @IsEnum(ChargeStatus)
  status?: ChargeStatus;

  @IsOptional()
  @IsDateString()
  paidAt?: string;

  @IsOptional()
  @IsDateString()
  lastReminderAt?: string;
}
