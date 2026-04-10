import { Roles } from '@prisma/client';

/** Portal de entrada correspondente às rotas de login do frontend. */
export type LoginPortal = 'patient' | 'professional' | 'admin';

const PORTAL_ALLOWED_ROLES: Record<LoginPortal, readonly Roles[]> = {
  patient: [Roles.PATIENT],
  professional: [Roles.PROFESSIONAL],
  admin: [Roles.ADMIN, Roles.SYSTEM_ADMIN],
};

export function isRoleAllowedForPortal(
  role: Roles,
  portal: LoginPortal,
): boolean {
  return PORTAL_ALLOWED_ROLES[portal].includes(role);
}
