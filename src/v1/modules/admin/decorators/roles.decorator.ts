import { SetMetadata } from '@nestjs/common';

export const ROLES_KEY = 'admin_roles';
export type AdminRole = 'admin';

export const Roles = (...roles: AdminRole[]) => SetMetadata(ROLES_KEY, roles);
