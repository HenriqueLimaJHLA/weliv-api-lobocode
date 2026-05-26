import { IsString, IsOptional, IsEnum } from 'class-validator';
import { CatalogItemStatus } from '@prisma/client';
import { VALIDATION_MESSAGES } from 'src/shared/common/messages';

export class CreateServiceDto {
  @IsString({ message: VALIDATION_MESSAGES.REQUIRED.FIELD })
  name: string;

  @IsOptional()
  @IsEnum(CatalogItemStatus)
  status?: CatalogItemStatus;

  @IsOptional()
  @IsString()
  specialtyId?: string;

  // companyId injetado pelo service via tenant
  companyId?: string;
}
