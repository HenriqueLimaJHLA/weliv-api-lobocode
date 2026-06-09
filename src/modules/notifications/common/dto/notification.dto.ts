import {
  IsString,
  IsOptional,
  IsBoolean,
  IsEnum,
  IsArray,
  IsDateString,
  IsObject,
  MinLength,
  MaxLength,
  IsUUID,
  IsEmail,
  Matches,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  NotificationType,
  NotificationPriority,
  NotificationChannel,
  NotificationActionType,
} from '../enums/notification.enums';

// ═══════════════════════════════════════════════════════════════════════════════
// ENUMS EXPORTADOS
// ═══════════════════════════════════════════════════════════════════════════════

export {
  NotificationType,
  NotificationPriority,
  NotificationChannel,
  NotificationActionType,
};

// ═══════════════════════════════════════════════════════════════════════════════
// CREATE NOTIFICATION DTO
// ═══════════════════════════════════════════════════════════════════════════════

export class CreateNotificationDto {
  @ApiProperty({ description: 'Título da notificação', example: 'Olá!' })
  @IsString()
  @MinLength(3)
  @MaxLength(200)
  title: string;

  @ApiProperty({ description: 'Corpo da notificação', example: 'Você tem uma nova mensagem.' })
  @IsString()
  @MinLength(1)
  @MaxLength(2000)
  body: string;

  @ApiPropertyOptional({
    description: 'Tipo de notificação',
    enum: NotificationType,
    default: NotificationType.GENERAL,
  })
  @IsEnum(NotificationType)
  @IsOptional()
  type?: NotificationType;

  @ApiPropertyOptional({
    description: 'Prioridade',
    enum: NotificationPriority,
    default: NotificationPriority.NORMAL,
  })
  @IsEnum(NotificationPriority)
  @IsOptional()
  priority?: NotificationPriority;

  @ApiPropertyOptional({
    description: 'Canais de envio',
    enum: NotificationChannel,
    isArray: true,
    default: [NotificationChannel.PUSH],
  })
  @IsArray()
  @IsEnum(NotificationChannel, { each: true })
  @IsOptional()
  channels?: NotificationChannel[];

  @ApiPropertyOptional({ description: 'Dados extras (JSON)', example: { messageId: '123' } })
  @IsObject()
  @IsOptional()
  data?: Record<string, any>;

  @ApiPropertyOptional({ description: 'URL da imagem' })
  @IsString()
  @IsOptional()
  imageUrl?: string;

  @ApiPropertyOptional({ description: 'URL de ação' })
  @IsString()
  @IsOptional()
  actionUrl?: string;

  @ApiPropertyOptional({
    description: 'Tipo de ação',
    enum: NotificationActionType,
  })
  @IsEnum(NotificationActionType)
  @IsOptional()
  actionType?: NotificationActionType;

  @ApiPropertyOptional({
    description: 'Agendar para (ISO8601)',
    example: '2024-06-10T14:00:00Z',
  })
  @IsDateString()
  @IsOptional()
  scheduledAt?: string;

  @ApiPropertyOptional({
    description: 'Expira em (ISO8601)',
    example: '2024-06-11T14:00:00Z',
  })
  @IsDateString()
  @IsOptional()
  expiresAt?: string;

  @ApiPropertyOptional({ description: 'ID da empresa' })
  @IsUUID()
  @IsOptional()
  companyId?: string;

  @ApiPropertyOptional({ description: 'ID do template' })
  @IsUUID()
  @IsOptional()
  templateId?: string;

  @ApiPropertyOptional({ description: 'Variáveis do template', example: { name: 'João' } })
  @IsObject()
  @IsOptional()
  templateVariables?: Record<string, string>;

  // NÃO INCLUIR: id, sentAt, createdAt, updatedAt, deletedAt, createdByUserId
}

// ═══════════════════════════════════════════════════════════════════════════════
// SEND TO USERS DTO
// ═══════════════════════════════════════════════════════════════════════════════

export class SendNotificationToUsersDto extends CreateNotificationDto {
  @ApiProperty({
    description: 'IDs dos usuários destinatários',
    isArray: true,
    example: ['user-uuid-1', 'user-uuid-2'],
  })
  @IsArray()
  @IsUUID('4', { each: true })
  userIds!: string[];
}

// ═══════════════════════════════════════════════════════════════════════════════
// SEND TO ALL DTO
// ═══════════════════════════════════════════════════════════════════════════════

export class SendNotificationToAllDto extends CreateNotificationDto {
  @ApiPropertyOptional({
    description: 'Filtrar por empresa (opcional)',
  })
  @IsUUID()
  @IsOptional()
  filterCompanyId?: string;
}

// ═══════════════════════════════════════════════════════════════════════════════
// UPDATE NOTIFICATION DTO
// ═══════════════════════════════════════════════════════════════════════════════

export class UpdateNotificationDto {
  @ApiPropertyOptional({ description: 'Título' })
  @IsString()
  @IsOptional()
  @MinLength(3)
  @MaxLength(200)
  title?: string;

  @ApiPropertyOptional({ description: 'Corpo' })
  @IsString()
  @IsOptional()
  @MinLength(1)
  @MaxLength(2000)
  body?: string;

  @ApiPropertyOptional({ description: 'Dados extras' })
  @IsObject()
  @IsOptional()
  data?: Record<string, any>;

  @ApiPropertyOptional({ description: 'URL da imagem' })
  @IsString()
  @IsOptional()
  imageUrl?: string;
}

// ═══════════════════════════════════════════════════════════════════════════════
// TEMPLATE DTO
// ═══════════════════════════════════════════════════════════════════════════════

export class CreateTemplateDto {
  @ApiProperty({ description: 'Nome do template' })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name: string;

  @ApiProperty({ description: 'Código único', example: 'booking_confirmed' })
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  code: string;

  @ApiProperty({ description: 'Canal', enum: NotificationChannel })
  @IsEnum(NotificationChannel)
  channel!: NotificationChannel;

  @ApiPropertyOptional({ description: 'Título (para push/email)' })
  @IsString()
  @IsOptional()
  @MaxLength(200)
  title?: string;

  @ApiProperty({ description: 'Corpo com placeholders', example: 'Olá {{name}}, sua consulta é {{date}}' })
  @IsString()
  body!: string;

  @ApiPropertyOptional({ description: 'Assunto do email' })
  @IsString()
  @IsOptional()
  @MaxLength(255)
  subject?: string;

  @ApiPropertyOptional({ description: 'Rodapé' })
  @IsString()
  @IsOptional()
  footer?: string;

  @ApiPropertyOptional({ description: 'URL da imagem' })
  @IsString()
  @IsOptional()
  imageUrl?: string;

  @ApiPropertyOptional({ description: 'Texto do botão' })
  @IsString()
  @IsOptional()
  actionText?: string;

  @ApiPropertyOptional({ description: 'URL do botão' })
  @IsString()
  @IsOptional()
  actionUrl?: string;

  @ApiPropertyOptional({ description: 'Variáveis disponíveis', isArray: true })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  variables?: string[];

  @ApiPropertyOptional({ description: 'Ativo', default: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

export class UpdateTemplateDto extends CreateTemplateDto {}

// ═══════════════════════════════════════════════════════════════════════════════
// PREFERENCE DTO
// ═══════════════════════════════════════════════════════════════════════════════

export class UpdatePreferenceDto {
  @ApiPropertyOptional({ description: 'Canal', enum: NotificationChannel })
  @IsEnum(NotificationChannel)
  channel!: NotificationChannel;

  @ApiPropertyOptional({ description: 'Ativado', default: true })
  @IsBoolean()
  @IsOptional()
  enabled?: boolean;

  @ApiPropertyOptional({ description: 'Frequência', enum: NotificationFrequency })
  @IsEnum(NotificationFrequency)
  @IsOptional()
  frequency?: NotificationFrequency;

  @ApiPropertyOptional({ description: 'Início do horário de silêncio', example: '22:00' })
  @IsString()
  @IsOptional()
  quietHoursStart?: string;

  @ApiPropertyOptional({ description: 'Fim do horário de silêncio', example: '08:00' })
  @IsString()
  @IsOptional()
  quietHoursEnd?: string;

  @ApiPropertyOptional({ description: 'Tipos de notificação permitidos', isArray: true })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  notificationTypes?: string[];
}

export class NotificationFrequency {
  INSTANT = 'INSTANT';
  DAILY = 'DAILY';
  WEEKLY = 'WEEKLY';
  NONE = 'NONE';
}

// ═══════════════════════════════════════════════════════════════════════════════
// DEVICE TOKEN DTO
// ═══════════════════════════════════════════════════════════════════════════════

export class RegisterDeviceDto {
  @ApiProperty({ description: 'Token do dispositivo' })
  @IsString()
  token!: string;

  @ApiProperty({ description: 'Tipo de dispositivo', enum: DeviceType })
  @IsEnum(DeviceType)
  type!: DeviceType;

  @ApiPropertyOptional({ description: 'Info do dispositivo', example: { model: 'iPhone 14' } })
  @IsObject()
  @IsOptional()
  deviceInfo?: Record<string, any>;
}

export class DeviceType {
  IOS = 'IOS';
  ANDROID = 'ANDROID';
  WEB = 'WEB';
  DESKTOP = 'DESKTOP';
}

// ═══════════════════════════════════════════════════════════════════════════════
// STATS DTO
// ═══════════════════════════════════════════════════════════════════════════════

export class NotificationStatsDto {
  total: number;
  sent: number;
  delivered: number;
  read: number;
  failed: number;
  deliveryRate: number;
  readRate: number;
  byChannel: Record<string, ChannelStats>;
  byType: Record<string, number>;
}

export class ChannelStats {
  sent: number;
  delivered: number;
  failed: number;
  deliveryRate: number;
}