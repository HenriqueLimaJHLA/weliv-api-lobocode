import { IsString, MinLength, IsNotEmpty } from 'class-validator';
import { VALIDATION_MESSAGES } from '../../../shared/common/messages';

export class ChangePasswordDto {
  @IsString({ message: VALIDATION_MESSAGES.REQUIRED.PASSWORD })
  @IsNotEmpty({ message: VALIDATION_MESSAGES.REQUIRED.PASSWORD })
  currentPassword: string;

  @IsString({ message: VALIDATION_MESSAGES.REQUIRED.PASSWORD })
  @MinLength(6, { message: VALIDATION_MESSAGES.LENGTH.PASSWORD_MIN })
  newPassword: string;
}
