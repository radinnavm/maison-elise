import type { Request } from 'express';

import type { AuthRole } from '@maison-elise/shared';

import { UnauthenticatedError } from './errors.js';

export interface AuthContext {
  userId: string;
  role: AuthRole;
}

export function requireAuth(req: Request): AuthContext {
  if (!req.auth) {
    throw new UnauthenticatedError();
  }

  return req.auth;
}
