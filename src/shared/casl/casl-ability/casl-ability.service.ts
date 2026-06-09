import { Injectable, Scope } from '@nestjs/common';
import { AbilityBuilder, PureAbility } from '@casl/ability';
import { createPrismaAbility, PrismaQuery, Subjects } from '@casl/prisma';
import { PROJECT_CORE_CASL_ROLE_PERMISSIONS } from '../../config/casl-role-permissions.core.config';
import { PROJECT_CASL_ROLE_PERMISSIONS } from '../../config/casl-role-permissions.config';
import {
  User,
  Service,
  Reminder,
  Review,
  Favorite,
  Company,
  File,
  Notification,
  Booking,
  Payment,
  Payout,
  Coupon,
  Ticket,
  TicketReply,
  Incident,
  IncidentUpdate,
  Webhook,
  WebhookLog,
  Availability,
  AvailabilityException,
  KycDocument,
} from '@prisma/client';

export type PermActions =
  | 'manage'
  | 'create'
  | 'read'
  | 'update'
  | 'delete'
  | 'approve'
  | 'export';

export type PermissionResource =
  | Subjects<{
      User: User;
      Company: Company;
      Reminder: Reminder;
      Service: Service;
      Review: Review;
      Favorite: Favorite;
      File: File;
      Notification: Notification;
      Booking: Booking;
      Payment: Payment;
      Payout: Payout;
      Coupon: Coupon;
      Ticket: Ticket;
      TicketReply: TicketReply;
      Incident: Incident;
      IncidentUpdate: IncidentUpdate;
      Webhook: Webhook;
      WebhookLog: WebhookLog;
      Availability: Availability;
      AvailabilityException: AvailabilityException;
      KycDocument: KycDocument;
    }>
  | 'all';

export type AppAbility = PureAbility<
  [PermActions, PermissionResource],
  PrismaQuery
>;

export type DefinePermissions = (
  user: User,
  builder: AbilityBuilder<AppAbility>,
) => void;

const rolePermissionsMap: Record<string, DefinePermissions> = {
  ...PROJECT_CORE_CASL_ROLE_PERMISSIONS,
  ...PROJECT_CASL_ROLE_PERMISSIONS,
};

@Injectable({ scope: Scope.REQUEST })
export class CaslAbilityService {
  ability!: AppAbility;

  createForUser(user: User) {
    const builder = new AbilityBuilder<AppAbility>(createPrismaAbility);
    const roleHandler = rolePermissionsMap[user.role];

    if (roleHandler) {
      roleHandler(user, builder);
    } else {
      builder.can('manage', 'all');
    }

    this.ability = builder.build();
    return this.ability;
  }
}
