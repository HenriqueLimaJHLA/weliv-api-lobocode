import { IsString, IsDateString, IsOptional } from 'class-validator';
import { VALIDATION_MESSAGES } from 'src/shared/common/messages';

export class CreateAvailabilityDto {
  @IsDateString({}, { message: VALIDATION_MESSAGES.FORMAT.DATE_INVALID })
  blockedDate: string; // YYYY-MM-DD

  @IsString({ message: VALIDATION_MESSAGES.FORMAT.FIELD_INVALID })
  startTime: string; // HH:MM

  @IsString({ message: VALIDATION_MESSAGES.FORMAT.FIELD_INVALID })
  endTime: string; // HH:MM

  @IsString({ message: VALIDATION_MESSAGES.FORMAT.FIELD_INVALID })
  reason: string;

  @IsOptional()
  @IsString()
  professionalUserId?: string; // se não fornecido, usa o usuário logado
}
