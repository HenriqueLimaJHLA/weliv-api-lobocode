import { IsString, IsEmail, MinLength } from 'class-validator';
import { VALIDATION_MESSAGES } from 'src/shared/common/messages';

export class CreateAdminDto {
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
}
