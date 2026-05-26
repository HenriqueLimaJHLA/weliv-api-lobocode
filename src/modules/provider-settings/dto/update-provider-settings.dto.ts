import { IsOptional, IsBoolean, IsNumber, Min, IsIn } from 'class-validator';

export class UpdateProviderSettingsDto {
  @IsOptional()
  @IsBoolean()
  remarcationEnabled?: boolean;

  @IsOptional()
  @IsNumber()
  @Min(0)
  remarcationLimit?: number;

  @IsOptional()
  @IsBoolean()
  waitingListEnabled?: boolean;

  @IsOptional()
  @IsNumber()
  @IsIn([0, 10, 30, 100], { message: 'depositPercentage deve ser 0, 10, 30 ou 100' })
  depositPercentage?: number;

  @IsOptional()
  availableSchedule?: Record<string, unknown>;

  @IsOptional()
  @IsNumber()
  @Min(0)
  consultationPrice?: number;

  @IsOptional()
  @IsBoolean()
  acceptsInsurance?: boolean;

  @IsOptional()
  insurances?: string[];
}
