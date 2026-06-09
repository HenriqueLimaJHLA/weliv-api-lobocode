import {
  IsString,
  IsOptional,
  IsEmail,
  MinLength,
  MaxLength,
  Matches,
  IsDateString,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

// ═══════════════════════════════════════════════════════════════════════════════
// UPDATE PROFILE DTO (para o usuário atualizar seu próprio perfil)
// ═══════════════════════════════════════════════════════════════════════════════

export class UpdateProfileDto {
  @ApiPropertyOptional({ description: 'Nome completo' })
  @IsString()
  @IsOptional()
  @MinLength(2)
  @MaxLength(100)
  name?: string;

  @ApiPropertyOptional({ description: 'Telefone' })
  @IsString()
  @IsOptional()
  @Matches(/^\(\d{2}\)\s?\d{4,5}-\d{4}$/, {
    message: 'Telefone deve estar no formato: (XX) XXXXX-XXXX',
  })
  phone?: string;

  @ApiPropertyOptional({ description: 'Data de nascimento' })
  @IsDateString()
  @IsOptional()
  birthDate?: string;

  @ApiPropertyOptional({ description: 'Gênero' })
  @IsString()
  @IsOptional()
  gender?: string;

  @ApiPropertyOptional({ description: 'URL da foto de perfil' })
  @IsString()
  @IsOptional()
  profilePicture?: string;

  @ApiPropertyOptional({ description: 'Idioma', default: 'pt-BR' })
  @IsString()
  @IsOptional()
  language?: string;

  @ApiPropertyOptional({ description: 'Timezone' })
  @IsString()
  @IsOptional()
  timezone?: string;

  // Endereço
  @ApiPropertyOptional({ description: 'Endereço' })
  @IsString()
  @IsOptional()
  address?: string;

  @ApiPropertyOptional({ description: 'Número' })
  @IsString()
  @IsOptional()
  addressNumber?: string;

  @ApiPropertyOptional({ description: 'Complemento' })
  @IsString()
  @IsOptional()
  addressComplement?: string;

  @ApiPropertyOptional({ description: 'Bairro' })
  @IsString()
  @IsOptional()
  neighborhood?: string;

  @ApiPropertyOptional({ description: 'Cidade' })
  @IsString()
  @IsOptional()
  city?: string;

  @ApiPropertyOptional({ description: 'UF' })
  @IsString()
  @IsOptional()
  @MaxLength(2)
  state?: string;

  @ApiPropertyOptional({ description: 'CEP' })
  @IsString()
  @IsOptional()
  @Matches(/^\d{5}-\d{3}$/, {
    message: 'CEP deve estar no formato: XXXXX-XXX',
  })
  zipCode?: string;
}

// ═══════════════════════════════════════════════════════════════════════════════
// CHANGE PASSWORD DTO
// ═══════════════════════════════════════════════════════════════════════════════

export class ChangePasswordDto {
  @ApiProperty({ description: 'Senha atual' })
  @IsString()
  @MinLength(8)
  currentPassword: string;

  @ApiProperty({ description: 'Nova senha' })
  @IsString()
  @MinLength(8)
  @MaxLength(100)
  newPassword: string;
}
