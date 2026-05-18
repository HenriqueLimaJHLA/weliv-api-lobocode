import { IsEmail, IsString, MinLength, IsNotEmpty } from 'class-validator';
import { VALIDATION_MESSAGES } from '../../common/messages';

export class RegisterPatientDto {
  @IsEmail({}, { message: VALIDATION_MESSAGES.FORMAT.EMAIL_INVALID })
  @IsNotEmpty({ message: VALIDATION_MESSAGES.REQUIRED.EMAIL })
  email: string;

  @IsString({ message: VALIDATION_MESSAGES.REQUIRED.NAME })
  @MinLength(2, { message: VALIDATION_MESSAGES.LENGTH.NAME_MIN })
  name: string;

  @IsString({ message: VALIDATION_MESSAGES.REQUIRED.CPF })
  @IsNotEmpty({ message: VALIDATION_MESSAGES.REQUIRED.CPF })
  cpf: string;

  @IsString({ message: VALIDATION_MESSAGES.REQUIRED.LOGIN })
  @MinLength(3, { message: VALIDATION_MESSAGES.LENGTH.LOGIN_MIN })
  login: string;

  @IsString({ message: VALIDATION_MESSAGES.REQUIRED.PASSWORD })
  @MinLength(8, { message: VALIDATION_MESSAGES.LENGTH.PASSWORD_MIN })
  password: string;

  @IsString({ message: VALIDATION_MESSAGES.REQUIRED.PASSWORD })
  @MinLength(8, { message: VALIDATION_MESSAGES.LENGTH.PASSWORD_MIN })
  passwordConfirm: string;
}
