import { IsString, IsNotEmpty, IsOptional, IsNumber, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreatePaymentDto {
  @ApiProperty({ description: 'ID do paciente' })
  @IsString() @IsNotEmpty()
  patientId: string;

  @ApiProperty({ description: 'ID do agendamento' })
  @IsString() @IsNotEmpty()
  appointmentId: string;

  @ApiProperty({ description: 'Valor' })
  @IsNumber()
  amount: number;

  @ApiPropertyOptional({ description: 'Método de pagamento', example: 'PIX' })
  @IsOptional() @IsString()
  paymentMethod?: string;

  @ApiPropertyOptional({ description: 'ID da transação externa', example: 'tx_123456' })
  @IsOptional() @IsString()
  externalTransactionId?: string;

  @ApiPropertyOptional({ description: 'Descrição' })
  @IsOptional() @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'ID da empresa' })
  @IsOptional() @IsString()
  companyId?: string;
}