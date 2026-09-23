import { randomUUID } from 'node:crypto';

import type { NextFunction, Request, Response } from 'express';

export const REQUEST_ID_HEADER = 'x-request-id';
const MAX_REQUEST_ID_LENGTH = 128;

/**
 * Assigns every request a correlation id (reusing a caller-provided
 * `x-request-id` when it is reasonable) and echoes it back in the response so
 * clients and logs can be correlated.
 */
export function requestContext(req: Request, res: Response, next: NextFunction): void {
  const incoming = req.header(REQUEST_ID_HEADER)?.trim();
  const id =
    incoming && incoming.length > 0 && incoming.length <= MAX_REQUEST_ID_LENGTH
      ? incoming
      : randomUUID();

  req.id = id;
  res.setHeader(REQUEST_ID_HEADER, id);

  next();
}
