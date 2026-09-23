import type { NextFunction, Request, RequestHandler, Response } from 'express';

import type { AuthRole } from '@maison-elise/shared';

import { ForbiddenError, UnauthenticatedError } from '../utils/errors.js';

export function authorize(...roles: AuthRole[]): RequestHandler {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.auth) {
      next(new UnauthenticatedError());
      return;
    }

    if (roles.length > 0 && !roles.includes(req.auth.role)) {
      next(new ForbiddenError());
      return;
    }

    next();
  };
}
