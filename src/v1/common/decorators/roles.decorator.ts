import { SetMetadata } from '@nestjs/common';

import type { AppRole as UserRole } from '../../entities/user.entity';

export const ROLES_KEY = 'roles';
export type AppRole = UserRole;

export const Roles = (...roles: AppRole[]) => SetMetadata(ROLES_KEY, roles);
