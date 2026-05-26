import {
  IsString,
  IsOptional,
  IsBoolean,
  IsNumber,
  IsIn,
  Min,
  Max,
  MinLength,
} from 'class-validator';
import { VALIDATION_MESSAGES } from 'src/shared/common/messages';

export class CreateCompanyDto {
  @IsString({ message: VALIDATION_MESSAGES.REQUIRED.NAME })
  @MinLength(2, { message: VALIDATION_MESSAGES.LENGTH.NAME_MIN })
  name: string;

  @IsOptional()
  @IsString()
  tagline?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  cnpj?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  registrationNumber?: string;

  @IsOptional()
  @IsString()
  specialty?: string;

  @IsOptional()
  @IsNumber()
  consultationPrice?: number;

  @IsOptional()
  @IsBoolean()
  acceptsInsurance?: boolean;

  @IsOptional()
  insurances?: string[];

  @IsOptional()
  availableSchedule?: Record<string, unknown>;

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
  @IsIn(['PENDING', 'APPROVED', 'SUSPENDED'])
  status?: 'PENDING' | 'APPROVED' | 'SUSPENDED';
}
