import { IsString, IsOptional, IsNumber, IsBoolean } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdatePaymentDto {
  @ApiPropertyOptional({ description: 'Status do pagamento' })
  @IsOptional() @IsString()
  status?: string;

  @ApiPropertyOptional({ description: 'Valor' })
  @IsOptional() @IsNumber()
  amount?: number;

  @ApiPropertyOptional({ description: 'Pago' })
  @IsOptional() @IsBoolean()
  paid?: boolean;

  @ApiPropertyOptional({ description: 'Método de pagamento' })
  @IsOptional() @IsString()
  paymentMethod?: string;

  @ApiPropertyOptional({ description: 'ID da transação externa' })
  @IsOptional() @IsString()
  externalTransactionId?: string;

  @ApiPropertyOptional({ description: 'Descrição' })
  @IsOptional() @IsString()
  description?: string;
}