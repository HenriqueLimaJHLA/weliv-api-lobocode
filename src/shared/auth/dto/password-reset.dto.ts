import { IsEmail, IsString, MinLength, IsNotEmpty } from 'class-validator';

export class CreatePasswordResetDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;
}

export class ValidateResetTokenDto {
  @IsString()
  @IsNotEmpty()
  token: string;
}

export class ResetPasswordDto {
  @IsString()
  @IsNotEmpty()
  token: string;

  @IsString()
  @MinLength(8)
  newPassword: string;
} 