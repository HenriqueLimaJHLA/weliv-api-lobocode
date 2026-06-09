import { User } from '@prisma/client';

type CanBuilder = {
  can: (...args: any[]) => void;
};

export type ProjectCoreDefinePermissions = (
  user: User,
  builder: CanBuilder,
) => void;

export const PROJECT_CORE_CASL_ROLE_PERMISSIONS: Record<
  string,
  ProjectCoreDefinePermissions
> = {
  SYSTEM_ADMIN: (user: User, { can }: any) => {
    can('manage', 'all');
  },
  ADMIN: (user: User, { can }: any) => {
    can('manage', 'all');
  },
  USER: (user: User, { can }: any) => {
    const userId = user.id;
    can('manage', 'User', { id: userId });
    if (user.companyId) {
      can('read', 'Company', { id: user.companyId });
      can('update', 'Company', { id: user.companyId });
    }
    can('manage', 'File', { uploadedBy: userId });
    can('read', 'Notification', {
      recipients: { some: { userId } },
    });
  },
};
