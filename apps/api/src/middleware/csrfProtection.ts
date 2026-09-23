import type { NextFunction, Request, Response } from 'express';

import { API_PREFIX } from '@maison-elise/shared';

import { env } from '../config/env.js';
import { AppError } from '../utils/errors.js';
import { isAllowedOrigin, originOf } from '../utils/origins.js';

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

/**
 * CSRF defence-in-depth for cookie-authenticated, state-changing requests.
 *
 * SameSite cookies and CORS reduce the risk but are not a complete CSRF defence
 * (e.g. same-site subdomain attacks, browser quirks). This middleware validates
 * the `Origin` (falling back to `Referer`) of unsafe requests against the
 * configured storefront/admin origins.
 *
 * - Safe methods are always allowed.
 * - Stripe webhooks are excluded (verified by signature; no browser Origin).
 * - Requests carrying a `Bearer` token are excluded (not cookie-authenticated,
 *   therefore not CSRF-vulnerable).
 * - Requests without a session cookie are excluded: CSRF requires the browser to
 *   attach ambient credentials, so an unauthenticated request cannot be forged
 *   into a privileged action. This keeps programmatic (Bearer) clients working.
 */
export function csrfProtection(req: Request, _res: Response, next: NextFunction): void {
  if (!env.csrfProtectionEnabled) {
    next();
    return;
  }

  if (SAFE_METHODS.has(req.method)) {
    next();
    return;
  }

  if (req.originalUrl.startsWith(`${API_PREFIX}/webhooks`)) {
    next();
    return;
  }

  if (req.headers.authorization?.startsWith('Bearer ')) {
    next();
    return;
  }

  const hasSessionCookie = Boolean(req.cookies?.[env.cookieName]);

  if (!hasSessionCookie) {
    next();
    return;
  }

  const origin = originOf(req.headers.origin) ?? originOf(req.headers.referer);

  if (origin && isAllowedOrigin(origin)) {
    next();
    return;
  }

  next(new AppError(403, 'CSRF_REJECTED', 'The request origin is not allowed.'));
}
