import {
  IsString,
  IsEmail,
  IsOptional,
  IsEnum,
  IsDateString,
  MinLength,
} from 'class-validator';
import { Roles, UserStatus } from '@prisma/client';
import { VALIDATION_MESSAGES } from 'src/shared/common/messages';

export class CreateUserDto {
  @IsString({ message: VALIDATION_MESSAGES.REQUIRED.NAME })
  @MinLength(2, { message: VALIDATION_MESSAGES.LENGTH.NAME_MIN })
  name: string;

  @IsString({ message: VALIDATION_MESSAGES.REQUIRED.LOGIN })
  @MinLength(3, { message: 'Login deve ter pelo menos 3 caracteres' })
  login: string;

  @IsEmail({}, { message: VALIDATION_MESSAGES.FORMAT.EMAIL_INVALID })
  email: string;

  @IsString({ message: VALIDATION_MESSAGES.REQUIRED.PASSWORD })
  @MinLength(8, { message: 'Senha deve ter pelo menos 8 caracteres' })
  password: string;

  @IsEnum(Roles, { message: VALIDATION_MESSAGES.REQUIRED.ROLE })
  role: Roles;

  @IsOptional()
  @IsString({ message: VALIDATION_MESSAGES.FORMAT.FIELD_INVALID })
  cpf?: string;

  @IsOptional()
  @IsDateString({}, { message: 'Data de nascimento inválida' })
  birthDate?: string;

  @IsOptional()
  @IsString({ message: VALIDATION_MESSAGES.FORMAT.PHONE_INVALID })
  phone?: string;

  @IsOptional()
  @IsString({ message: VALIDATION_MESSAGES.FORMAT.FIELD_INVALID })
  avatarUrl?: string;

  @IsOptional()
  @IsEnum(UserStatus, { message: VALIDATION_MESSAGES.FORMAT.ENUM_INVALID })
  status?: UserStatus;
}
