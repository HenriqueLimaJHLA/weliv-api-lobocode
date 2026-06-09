import { IsString, IsNotEmpty, Validate } from 'class-validator';
import { IsStrongPassword } from '../../../shared/validators';
import { VALIDATION_MESSAGES } from '../../../shared/common/messages';

export class ResetPasswordDto {
  @IsString({ message: VALIDATION_MESSAGES.REQUIRED.FIELD })
  @IsNotEmpty({ message: VALIDATION_MESSAGES.REQUIRED.FIELD })
  token: string;

  @IsString({ message: VALIDATION_MESSAGES.REQUIRED.PASSWORD })
  @IsStrongPassword({ message: VALIDATION_MESSAGES.FORMAT.PASSWORD_WEAK })
  newPassword: string;

  @IsString({ message: VALIDATION_MESSAGES.REQUIRED.PASSWORD })
  @Validate((value: string, args: any) => {
    return value === args.object.newPassword;
  }, { message: 'Confirmação de senha deve ser igual à nova senha' })
  confirmPassword: string;
} 