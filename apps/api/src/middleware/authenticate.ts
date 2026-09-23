import type { NextFunction, Request, Response } from 'express';

import { env } from '../config/env.js';
import { UnauthenticatedError } from '../utils/errors.js';
import { verifyAuthToken } from '../utils/jwt.js';

function extractBearerToken(req: Request): string | undefined {
  const header = req.headers.authorization;

  if (!header || !header.startsWith('Bearer ')) {
    return undefined;
  }

  return header.slice('Bearer '.length).trim() || undefined;
}

export function authenticate(req: Request, _res: Response, next: NextFunction): void {
  const cookieToken = req.cookies?.[env.cookieName] as string | undefined;
  const token = cookieToken ?? extractBearerToken(req);

  if (!token) {
    next(new UnauthenticatedError());
    return;
  }

  try {
    const payload = verifyAuthToken(token);
    req.auth = { userId: payload.userId, role: payload.role };
    next();
  } catch (error) {
    next(error);
  }
}
