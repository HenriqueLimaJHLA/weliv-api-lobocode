import { IsString, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateMedicalRecordDto {
  @ApiPropertyOptional({ description: 'Diagnóstico' })
  @IsOptional() @IsString()
  diagnosis?: string;

  @ApiPropertyOptional({ description: 'Tratamento' })
  @IsOptional() @IsString()
  treatment?: string;

  @ApiPropertyOptional({ description: 'Observações' })
  @IsOptional() @IsString()
  notes?: string;
}