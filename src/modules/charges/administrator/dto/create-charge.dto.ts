import { IsString, IsNotEmpty, IsOptional, IsNumber } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateChargeDto {
  @ApiProperty({ description: 'ID do paciente' })
  @IsString() @IsNotEmpty()
  patientId: string;

  @ApiProperty({ description: 'Valor' })
  @IsNumber()
  amount: number;

  @ApiPropertyOptional({ description: 'Descrição' })
  @IsOptional() @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Data de vencimento' })
  @IsOptional() @IsString()
  dueDate?: string;

  @ApiPropertyOptional({ description: 'ID da empresa' })
  @IsOptional() @IsString()
  companyId?: string;
}