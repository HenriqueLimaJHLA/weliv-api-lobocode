import { IsString, IsOptional, IsEnum, IsArray } from 'class-validator';
import { AppNotificationCategory, NotificationTargetType, Roles } from '@prisma/client';

export class CreateNotificationDto {
  @IsString()
  title: string;

  @IsString()
  message: string;

  @IsOptional()
  @IsEnum(AppNotificationCategory)
  category?: AppNotificationCategory;

  @IsOptional()
  @IsString()
  actionUrl?: string;

  @IsOptional()
  @IsString()
  entityType?: string;

  @IsOptional()
  @IsString()
  entityId?: string;

  // Destinatários diretos (userIds)
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  recipientIds?: string[];

  // Alvo por papel (role)
  @IsOptional()
  @IsEnum(Roles)
  targetRole?: Roles;

  // Alvo por grupo
  @IsOptional()
  @IsString()
  targetGroupId?: string;
}
