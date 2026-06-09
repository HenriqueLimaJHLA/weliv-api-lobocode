import {
  IsString,
  IsOptional,
  IsBoolean,
  IsEnum,
  IsDateString,
  IsNumber,
  IsPhoneNumber,
  IsEmail,
  IsUrl,
  MinLength,
  MaxLength,
  IsUUID,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum CompanyStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  ACTIVE = 'ACTIVE',
  TRIAL = 'TRIAL',
  SUSPENDED = 'SUSPENDED',
  BLOCKED = 'BLOCKED',
  CANCELLED = 'CANCELLED',
}

export class CreateCompanyDto {
  @ApiProperty({ description: 'Nome da empresa', example: 'Minha Empresa Ltda' })
  @IsString()
  @MinLength(2)
  @MaxLength(150)
  name: string;

  @ApiPropertyOptional({ description: 'Nome fantasia', example: 'Minha Empresa' })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  tradeName?: string;

  @ApiPropertyOptional({ description: 'Razão social', example: 'Minha Empresa Ltda' })
  @IsString()
  @IsOptional()
  @MaxLength(150)
  legalName?: string;

  @ApiPropertyOptional({ description: 'CNPJ', example: '12.345.678/0001-90' })
  @IsString()
  @IsOptional()
  @MaxLength(18)
  cnpj?: string;

  @ApiPropertyOptional({ description: 'Inscrição estadual' })
  @IsString()
  @IsOptional()
  @MaxLength(30)
  stateRegistration?: string;

  @ApiPropertyOptional({ description: 'Inscrição municipal' })
  @IsString()
  @IsOptional()
  @MaxLength(30)
  municipalRegistration?: string;

  @ApiPropertyOptional({ description: 'Email de contato' })
  @IsEmail()
  @IsOptional()
  contactEmail?: string;

  @ApiPropertyOptional({ description: 'Email de cobrança' })
  @IsEmail()
  @IsOptional()
  billingEmail?: string;

  @ApiPropertyOptional({ description: 'Telefone de contato' })
  @IsString()
  @IsOptional()
  @MaxLength(20)
  contactPhone?: string;

  @ApiPropertyOptional({ description: 'WhatsApp' })
  @IsString()
  @IsOptional()
  @MaxLength(20)
  whatsapp?: string;

  @ApiPropertyOptional({ description: 'Endereço' })
  @IsString()
  @IsOptional()
  @MaxLength(255)
  address?: string;

  @ApiPropertyOptional({ description: 'Número' })
  @IsString()
  @IsOptional()
  @MaxLength(20)
  addressNumber?: string;

  @ApiPropertyOptional({ description: 'Complemento' })
  @IsString()
  @IsOptional()
  @MaxLength(50)
  addressComplement?: string;

  @ApiPropertyOptional({ description: 'Bairro' })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  neighborhood?: string;

  @ApiPropertyOptional({ description: 'Cidade' })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  city?: string;

  @ApiPropertyOptional({ description: 'Estado (UF)', example: 'SP' })
  @IsString()
  @IsOptional()
  @MaxLength(2)
  state?: string;

  @ApiPropertyOptional({ description: 'País', default: 'Brasil' })
  @IsString()
  @IsOptional()
  @MaxLength(50)
  country?: string;

  @ApiPropertyOptional({ description: 'CEP' })
  @IsString()
  @IsOptional()
  @MaxLength(10)
  zipCode?: string;

  @ApiPropertyOptional({ description: 'Latitude' })
  @IsNumber()
  @IsOptional()
  latitude?: number;

  @ApiPropertyOptional({ description: 'Longitude' })
  @IsNumber()
  @IsOptional()
  longitude?: number;

  @ApiPropertyOptional({ description: 'Status', enum: CompanyStatus, default: CompanyStatus.PENDING })
  @IsEnum(CompanyStatus)
  @IsOptional()
  status?: CompanyStatus;

  @ApiPropertyOptional({ description: 'Timezone', default: 'America/Sao_Paulo' })
  @IsString()
  @IsOptional()
  @MaxLength(50)
  timezone?: string;

  @ApiPropertyOptional({ description: 'Website' })
  @IsUrl()
  @IsOptional()
  website?: string;

  @ApiPropertyOptional({ description: 'Segmento' })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  segment?: string;

  @ApiPropertyOptional({ description: 'Porte da empresa' })
  @IsString()
  @IsOptional()
  @MaxLength(50)
  companySize?: string;

  @ApiPropertyOptional({ description: 'Data de fundação' })
  @IsDateString()
  @IsOptional()
  foundedAt?: string;

  @ApiPropertyOptional({ description: 'Quantidade de funcionários' })
  @IsNumber()
  @IsOptional()
  employeeCount?: number;

  // NÃO incluir: id, logo, secondaryLogo, favicon, primaryColor, secondaryColor, theme
 // NÃO incluir: payout*, openingHours, businessDays, defaultSla, settings
  // NÃO incluir: createdAt, updatedAt, deletedAt
}
