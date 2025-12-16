import type { JWTPayload } from 'jose';
import type { Request } from 'express';
import type { AppRole } from '../../entities/user.entity';

export type AuthenticatedUser = JWTPayload & {
  sub: string;
  role: AppRole;
  email?: string;
  id?: string;
  permissions?: string[];
};

export type RequestWithAuth = Omit<Request, 'user' | 'cookies'> & {
  user?: AuthenticatedUser;
  cookies?: Record<string, string>;
};
