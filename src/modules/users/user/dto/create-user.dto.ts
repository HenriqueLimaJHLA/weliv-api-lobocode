import { IsOptional, IsString, IsEmail } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

// DTO para operações de criação no user layer
// (geralmente não usado pois usuários não se criam)
export class CreateUserDto {
  // Placeholder - não usado no user layer
}

// Reexport do UpdateProfileDto para manter compatibilidade
export { UpdateProfileDto } from './update-profile.dto';
