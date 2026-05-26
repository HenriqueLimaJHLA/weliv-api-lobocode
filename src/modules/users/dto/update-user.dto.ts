import { PartialType } from '@nestjs/mapped-types';
import { CreateUserDto } from './create-user.dto';
import { IsEnum, IsIn, IsOptional, IsString } from 'class-validator';
import { Roles } from '@prisma/client';
import { VALIDATION_MESSAGES } from 'src/shared/common/messages';

export class UpdateUserDto extends PartialType(CreateUserDto) {
  @IsOptional()
  @IsEnum(Roles, { message: VALIDATION_MESSAGES.REQUIRED.ROLE })
  role?: Roles;

  @IsOptional()
  @IsIn(['ADMIN', 'COLLABORATOR'], { message: 'Função da empresa inválida' })
  companyUserRole?: 'ADMIN' | 'COLLABORATOR';

  @IsOptional()
  @IsString()
  professionalTitle?: string;

  @IsOptional()
  @IsString()
  biography?: string;

  @IsOptional()
  @IsString()
  registrationNumber?: string;

  @IsOptional()
  @IsString()
  specialty?: string;

  @IsOptional()
  healthPlan?: string;
}
