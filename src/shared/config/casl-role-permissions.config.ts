import { User } from '@prisma/client';

type CanBuilder = {
  can: (...args: any[]) => void;
};

export type ProjectDefinePermissions = (
  user: User,
  builder: CanBuilder,
) => void;

export const PROJECT_CASL_ROLE_PERMISSIONS: Record<
  string,
  ProjectDefinePermissions
> = {
  USER: (user: User, { can }: any) => {
    const userId = user.id;

    can('manage', 'User', { id: userId });

    can('read', 'Service', {
      isActive: true,
      deletedAt: null,
    });
    can('read', 'Coupon', {
      active: true,
      deletedAt: null,
    });

    can('manage', 'Reminder', { userId });
    can('manage', 'Favorite', { userId });
    can('manage', 'Review', { authorId: userId });
    can('manage', 'File', { uploadedBy: userId });
    can('read', 'Notification', {
      recipients: { some: { userId } },
    });

    can('manage', 'Booking', { customerId: userId });
    can('read', 'Payment', { customerId: userId });

    can('create', 'Ticket', { createdById: userId });
    can('read', 'Ticket', { createdById: userId });
    can('update', 'Ticket', { createdById: userId });
    can('create', 'TicketReply', {
      ticket: { createdById: userId },
    });
    can('read', 'TicketReply', {
      ticket: { createdById: userId },
    });
  },

  ADMIN: (user: User, { can }: any) => {
    const companyId = user.companyId;

    can('manage', 'User', { companyId });
    can('manage', 'File', { companyId });
    can('manage', 'Service', { companyId });
    can('manage', 'Reminder', { companyId });
    can('manage', 'Booking', { companyId });
    can('manage', 'Payment', { companyId });
    can('manage', 'Ticket', { companyId });
    can('manage', 'TicketReply', { companyId });
    can('manage', 'Coupon', { companyId });
    can('manage', 'Review', { companyId });
    can('manage', 'Favorite', { companyId });
    can('manage', 'Notification', { companyId });
  },

  SYSTEM_ADMIN: (user: User, { can }: any) => {
    can('manage', 'all');
  },
};
