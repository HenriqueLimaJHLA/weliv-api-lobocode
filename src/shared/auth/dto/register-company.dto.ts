import { IsEmail, IsString, MinLength, IsOptional } from 'class-validator';

export class RegisterCompanyDto {
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

  // Nome da empresa (Company)
  @IsString({ message: 'Nome da empresa é obrigatório' })
  businessName: string;

  // Campos opcionais para empresas
  @IsOptional()
  @IsString({ message: 'CNPJ/CPF deve ser uma string' })
  cnpj?: string; // Pode ser CNPJ (empresa) ou CPF (autônomo)

  @IsOptional()
  @IsString({ message: 'Website deve ser uma string' })
  website?: string;

  @IsOptional()
  @IsString({ message: 'CEP deve ser uma string' })
  zipCode?: string;

  @IsOptional()
  @IsString({ message: 'Endereço deve ser uma string' })
  address?: string;

  @IsOptional()
  @IsString({ message: 'Número do endereço deve ser uma string' })
  addressNumber?: string;

  @IsOptional()
  @IsString({ message: 'Cidade deve ser uma string' })
  city?: string;

  @IsOptional()
  @IsString({ message: 'Estado deve ser uma string' })
  state?: string;
}

