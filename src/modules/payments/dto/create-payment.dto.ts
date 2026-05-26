import { IsString, IsNumber, IsEnum, IsOptional, IsDateString, IsInt, Min } from 'class-validator';
import { PaymentMethod } from '@prisma/client';

export class CreatePaymentDto {
  @IsString()
  appointmentId: string;

  @IsString()
  patientId: string;

  @IsString()
  professionalId: string;

  @IsOptional()
  @IsString()
  companyId?: string;

  @IsNumber()
  @Min(0)
  amount: number;

  @IsEnum(PaymentMethod)
  method: PaymentMethod;

  @IsOptional()
  @IsInt()
  @Min(1)
  installments?: number;
}
