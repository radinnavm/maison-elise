import jwt from 'jsonwebtoken';
import type { SignOptions } from 'jsonwebtoken';

import type { AuthRole } from '@maison-elise/shared';

import { env } from '../config/env.js';
import { UnauthenticatedError } from './errors.js';

export interface AuthTokenPayload {
  userId: string;
  role: AuthRole;
}

function isAuthRole(value: unknown): value is AuthRole {
  return value === 'CUSTOMER' || value === 'ADMIN';
}

export function signAuthToken(payload: AuthTokenPayload): string {
  const options: SignOptions = {
    expiresIn: env.jwtExpiresIn as SignOptions['expiresIn'],
  };

  return jwt.sign({ role: payload.role }, env.jwtSecret, {
    ...options,
    subject: payload.userId,
  });
}

export function verifyAuthToken(token: string): AuthTokenPayload {
  let decoded: unknown;

  try {
    decoded = jwt.verify(token, env.jwtSecret);
  } catch {
    throw new UnauthenticatedError('Your session is invalid or has expired.');
  }

  if (typeof decoded !== 'object' || decoded === null) {
    throw new UnauthenticatedError('Your session is invalid or has expired.');
  }

  const { sub, role } = decoded as { sub?: unknown; role?: unknown };

  if (typeof sub !== 'string' || !isAuthRole(role)) {
    throw new UnauthenticatedError('Your session is invalid or has expired.');
  }

  return { userId: sub, role };
}
