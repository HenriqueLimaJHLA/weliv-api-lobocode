import { IsEmail } from 'class-validator';
import { VALIDATION_MESSAGES } from 'src/shared/common/messages';

export class InviteCompanyUserDto {
  @IsEmail({}, { message: VALIDATION_MESSAGES.FORMAT.EMAIL_INVALID })
  email: string;
}
