import { IsString, IsOptional, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateDocumentDto {
  @ApiProperty({ description: 'Tipo do documento' })
  @IsString()
  type: string;

  @ApiPropertyOptional({ description: 'ID do paciente' })
  @IsOptional() @IsString()
  patientId?: string;

  @ApiPropertyOptional({ description: 'ID do profissional' })
  @IsOptional() @IsString()
  professionalId?: string;

  @ApiPropertyOptional({ description: 'ID do arquivo' })
  @IsOptional() @IsString()
  fileId?: string;

  @ApiPropertyOptional({ description: 'Descrição' })
  @IsOptional() @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'ID da empresa' })
  @IsOptional() @IsString()
  companyId?: string;
}