
import { Injectable, Scope } from '@nestjs/common';
import { AbilityBuilder, PureAbility } from '@casl/ability';
import { createPrismaAbility, PrismaQuery, Subjects } from '@casl/prisma';
import { Roles, User } from '@prisma/client';

export type PermActions =
  | 'manage'
  | 'create'
  | 'read'
  | 'update'
  | 'delete'
  | 'cancel'
  | 'approve'
  | 'export';

// Recursos alinhados ao schema weliv (sem Post, Shift, Patrol, etc.)
export type PermissionResource =
  | Subjects<{
      User: User;
      Document: any;
      Company: any;
      Client: any;
      Appointment: any;
      File: any;
      Notification: any;
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

// ========================================
// PERMISSÕES CENTRALIZADAS
// ========================================

// Permissões básicas de perfil
const profilePermissions = {
  ownProfile: (user: User, { can }: any) => {
    can('read', 'User', { companyId: user.companyId });
    can('update', 'User', ['profilePicture'], { id: user.id });
  },

  ownProfileExtended: (user: User, { can }: any) => {
    can('read', 'User', { id: user.id });
    can('update', 'User', ['name', 'profilePicture'], { id: user.id });
  },
};

const basicViewPermissions = {
  readNonAdminUsers: (user: User, { cannot }: any) => {
    cannot('read', 'User', {
      companyId: user.companyId,
      role: { in: [Roles.ADMIN, Roles.SYSTEM_ADMIN] },
    });
  },
};

// Permissões de recursos básicos (schema weliv - sem Post/Vehicle)
const basicResourcePermissions = {
  readDocuments: (user: User, { can }: any) => {
    can('read', 'Document', { companyId: user.companyId });
  },
};

// Permissões operacionais (schema weliv - Appointment, Client, etc.)
const operationalPermissions = {
  appointmentManagement: (user: User, { can }: any) => {
    can('manage', 'Appointment', { companyId: user.companyId });
  },
  clientManagement: (user: User, { can }: any) => {
    can('manage', 'Client', { companyId: user.companyId });
  },
};

// Permissões administrativas
const administrativePermissions = {
  companyRead: (user: User, { can }: any) => {
    can('read', 'all', { companyId: user.companyId });
  },

  companyManage: (user: User, { can }: any) => {
    can(['create', 'update', 'delete'], 'all', { companyId: user.companyId });
  },

  userManagement: (user: User, { can }: any, allowedRoles: Roles[]) => {
    can(['create', 'update', 'delete'], 'User', {
      companyId: user.companyId,
      role: { in: allowedRoles },
    });
  },

  resourceManagement: (user: User, { can }: any) => {
    can('manage', 'Document', { companyId: user.companyId });
    can('manage', 'Appointment', { companyId: user.companyId });
    can('manage', 'Client', { companyId: user.companyId });
  },

  reporting: (user: User, { can }: any) => {
    can('read', 'Document', { companyId: user.companyId });
  },
};

// Permissões específicas (schema weliv)
const specificPermissions = {
  notifications: (user: User, { can }: any) => {
    can('read', 'Notification', { companyId: user.companyId });
    can('manage', 'Notification', { companyId: user.companyId });
  },
};

// ========================================
// MAPEAMENTO DE ROLES (schema weliv: SYSTEM_ADMIN, ADMIN, COMERCIAL, LOGISTICS, DRIVER)
// ========================================

const rolePermissionsMap: Record<Roles, (user: User, builder: any) => void> = {
  SYSTEM_ADMIN: (user: User, { can }: any) => {
    can('manage', 'all');
  },
  ADMIN: (user: User, { can }: any) => {
    administrativePermissions.companyRead(user, { can });
    administrativePermissions.companyManage(user, { can });
    administrativePermissions.userManagement(user, { can }, [
      Roles.ADMIN,
    ]);
    administrativePermissions.resourceManagement(user, { can });
    administrativePermissions.reporting(user, { can });
    specificPermissions.notifications(user, { can });
  },
  PROFESSIONAL: (user: User, { can }: any) => {},
  PATIENT: (user: User, { can }: any) => {},
};

@Injectable({ scope: Scope.REQUEST })
export class CaslAbilityService {
  ability: AppAbility;

  createForUser(user: User) {
    const builder = new AbilityBuilder<AppAbility>(createPrismaAbility);

    // Aplica permissões baseadas no role
    rolePermissionsMap[user.role](user, builder);

    this.ability = builder.build();
    return this.ability;
  }
}
