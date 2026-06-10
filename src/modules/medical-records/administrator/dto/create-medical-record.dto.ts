import { IsString, IsNotEmpty, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateMedicalRecordDto {
  @ApiProperty({ description: 'ID do paciente' })
  @IsString() @IsNotEmpty()
  patientId: string;

  @ApiPropertyOptional({ description: 'ID do profissional' })
  @IsOptional() @IsString()
  professionalId?: string;

  @ApiPropertyOptional({ description: 'ID do agendamento' })
  @IsOptional() @IsString()
  appointmentId?: string;

  @ApiPropertyOptional({ description: 'Diagnóstico' })
  @IsOptional() @IsString()
  diagnosis?: string;

  @ApiPropertyOptional({ description: 'Tratamento' })
  @IsOptional() @IsString()
  treatment?: string;

  @ApiPropertyOptional({ description: 'Observações' })
  @IsOptional() @IsString()
  notes?: string;

  @ApiPropertyOptional({ description: 'ID da empresa' })
  @IsOptional() @IsString()
  companyId?: string;
}