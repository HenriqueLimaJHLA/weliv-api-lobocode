import { Injectable, Scope } from '@nestjs/common';
import { AbilityBuilder, PureAbility } from '@casl/ability';
import { createPrismaAbility, PrismaQuery, Subjects } from '@casl/prisma';
import { PROJECT_CORE_CASL_ROLE_PERMISSIONS } from '../../config/casl-role-permissions.core.config';
import { PROJECT_CASL_ROLE_PERMISSIONS } from '../../config/casl-role-permissions.config';
import { User, Company, File, Notification, Setting } from '@prisma/client';

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
      File: File;
      Notification: Notification;
      Setting: Setting;
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