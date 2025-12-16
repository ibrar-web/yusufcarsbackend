import type { AuthenticatedUser } from '../v1/common/types/authenticated-user';

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
      cookies?: Record<string, string>;
    }
  }
}

export {};
