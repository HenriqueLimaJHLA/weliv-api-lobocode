import {
  IsString,
  IsOptional,
  IsBoolean,
  IsEnum,
  IsDateString,
  IsNumber,
  IsEmail,
  MinLength,
  MaxLength,
  IsUUID,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum UserStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  PENDING = 'PENDING',
  SUSPENDED = 'SUSPENDED',
}

export enum UserRole {
  SYSTEM_ADMIN = 'SYSTEM_ADMIN',
  ADMIN = 'ADMIN',
  USER = 'USER',
}

export class CreateUserDto {
  @ApiProperty({ description: 'Nome completo', example: 'João Silva' })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name: string;

  @ApiProperty({ description: 'Email', example: 'joao@empresa.com' })
  @IsEmail()
  email: string;

  @ApiPropertyOptional({ description: 'CPF', example: '123.456.789-00' })
  @IsString()
  @IsOptional()
  @MaxLength(14)
  cpf?: string;

  @ApiPropertyOptional({ description: 'Telefone', example: '(11) 99999-9999' })
  @IsString()
  @IsOptional()
  @MaxLength(20)
  phone?: string;

  @ApiPropertyOptional({ description: 'WhatsApp', example: '(11) 99999-9999' })
  @IsString()
  @IsOptional()
  @MaxLength(20)
  whatsapp?: string;

  @ApiPropertyOptional({ description: 'Avatar URL' })
  @IsString()
  @IsOptional()
  avatar?: string;

  @ApiPropertyOptional({ description: 'Data de nascimento' })
  @IsDateString()
  @IsOptional()
  birthDate?: string;

  @ApiPropertyOptional({ description: 'Gênero' })
  @IsString()
  @IsOptional()
  gender?: string;

  @ApiPropertyOptional({ description: 'Cargo' })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  jobTitle?: string;

  @ApiPropertyOptional({ description: 'Departamento' })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  department?: string;

  @ApiProperty({ description: 'Senha', example: 'Senha@123' })
  @IsString()
  @MinLength(8)
  @MaxLength(100)
  password: string;

  @ApiProperty({ description: 'Role', enum: UserRole })
  @IsEnum(UserRole)
  role: UserRole;

  @ApiPropertyOptional({ description: 'Status', enum: UserStatus, default: UserStatus.PENDING })
  @IsEnum(UserStatus)
  @IsOptional()
  status?: UserStatus;

  @ApiPropertyOptional({ description: 'ID da empresa' })
  @IsUUID()
  @IsOptional()
  companyId?: string;

  // NÃO incluir: id, emailVerifiedAt, lastLoginAt, loginAttempts, lockedUntil
  // NÃO incluir: twoFactorEnabled, twoFactorSecret, passwordChangedAt
  // NÃO incluir: createdAt, updatedAt, deletedAt
}
