import { IsString, IsOptional, IsEnum } from 'class-validator';
import { NotificationGroupType, Roles } from '@prisma/client';

export class CreateNotificationGroupDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsEnum(NotificationGroupType)
  type: NotificationGroupType;

  @IsOptional()
  @IsEnum(Roles)
  roleFilter?: Roles;

  @IsOptional()
  @IsString()
  sectorFilter?: string;
}
