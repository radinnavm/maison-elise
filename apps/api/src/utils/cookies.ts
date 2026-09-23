import type { CookieOptions, Response } from 'express';

import { env } from '../config/env.js';

function baseCookieOptions(): CookieOptions {
  return {
    httpOnly: true,
    // SameSite=None requires Secure; production is always HTTPS.
    secure: env.isProduction || env.cookieSameSite === 'none',
    sameSite: env.cookieSameSite,
    path: '/',
  };
}

export function setAuthCookie(res: Response, token: string): void {
  res.cookie(env.cookieName, token, {
    ...baseCookieOptions(),
    maxAge: env.cookieMaxAgeMs,
  });
}

export function clearAuthCookie(res: Response): void {
  res.clearCookie(env.cookieName, baseCookieOptions());
}
