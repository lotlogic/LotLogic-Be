import { SetMetadata } from '@nestjs/common';
import { AuthRole } from '@/modules/auth/auth.types';

export const ROLES_KEY = 'auth_roles';

export const Roles = (...roles: AuthRole[]) => SetMetadata(ROLES_KEY, roles);
