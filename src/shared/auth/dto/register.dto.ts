import { IsEmail, IsString, MinLength, IsOptional, IsPhoneNumber } from 'class-validator';

export class RegisterDto {
  @IsEmail({}, { message: 'Email deve ser válido' })
  email: string;

  @IsString({ message: 'Senha é obrigatória' })
  @MinLength(6, { message: 'Senha deve ter pelo menos 6 caracteres' })
  password: string;

  @IsString({ message: 'Nome é obrigatório' })
  name: string;

  @IsOptional()
  @IsString({ message: 'Telefone deve ser uma string' })
  phone?: string;
}
