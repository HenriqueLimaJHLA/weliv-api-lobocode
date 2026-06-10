import { IsString, IsOptional, IsNumber } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateChargeDto {
  @ApiPropertyOptional({ description: 'Status' })
  @IsOptional() @IsString()
  status?: string;

  @ApiPropertyOptional({ description: 'Valor' })
  @IsOptional() @IsNumber()
  amount?: number;

  @ApiPropertyOptional({ description: 'Descrição' })
  @IsOptional() @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Data de vencimento' })
  @IsOptional() @IsString()
  dueDate?: string;

  @ApiPropertyOptional({ description: 'Pago em' })
  @IsOptional() @IsString()
  paidAt?: string;
}