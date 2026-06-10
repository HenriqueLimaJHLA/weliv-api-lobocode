import { IsString, IsOptional, IsEnum } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateDocumentDto {
  @ApiPropertyOptional({ description: 'Status' })
  @IsOptional() @IsString()
  status?: string;

  @ApiPropertyOptional({ description: 'Descrição' })
  @IsOptional() @IsString()
  description?: string;
}