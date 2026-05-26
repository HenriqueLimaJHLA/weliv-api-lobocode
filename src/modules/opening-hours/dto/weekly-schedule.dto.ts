import { IsBoolean, IsArray, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class TimeSlotDto {
  @IsString()
  start: string; // HH:MM

  @IsString()
  end: string; // HH:MM
}

export class DayScheduleDto {
  @IsBoolean()
  active: boolean;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TimeSlotDto)
  slots: TimeSlotDto[];
}

/**
 * Grade semanal: chaves "0"..6 (domingo..sábado), valor = DayScheduleDto
 */
export type WeeklyScheduleDto = Record<string, DayScheduleDto>;

export class UpdateOpeningHoursDto {
  availability: WeeklyScheduleDto;
}
