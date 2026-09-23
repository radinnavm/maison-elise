import type { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';

import { AppError } from '../utils/errors.js';
import { logger, serializeError } from '../utils/logger.js';

interface NormalizedError {
  status: number;
  code: string;
  message: string;
  details?: unknown;
}

function getPrismaErrorCode(error: unknown): string | undefined {
  if (typeof error !== 'object' || error === null || !('code' in error)) {
    return undefined;
  }

  const code = (error as { code?: unknown }).code;
  return typeof code === 'string' && /^P\d{4}$/.test(code) ? code : undefined;
}

function getPrismaErrorTarget(error: unknown): string | undefined {
  if (typeof error !== 'object' || error === null || !('meta' in error)) {
    return undefined;
  }

  const meta = (error as { meta?: unknown }).meta;

  if (typeof meta !== 'object' || meta === null || !('target' in meta)) {
    return undefined;
  }

  const target = (meta as { target?: unknown }).target;

  if (Array.isArray(target)) {
    return target.map(String).join(', ');
  }

  return typeof target === 'string' ? target : undefined;
}

function normalizePrismaError(error: unknown): NormalizedError | undefined {
  const code = getPrismaErrorCode(error);

  if (!code) {
    return undefined;
  }

  if (code === 'P2002') {
    const target = getPrismaErrorTarget(error);
    return {
      status: 409,
      code: 'CONFLICT',
      message: target ? `A record with this ${target} already exists.` : 'A record already exists.',
    };
  }

  if (code === 'P2003') {
    return {
      status: 409,
      code: 'CONFLICT',
      message: 'This record is referenced by other records and cannot be changed.',
    };
  }

  if (code === 'P2025') {
    return { status: 404, code: 'NOT_FOUND', message: 'The requested resource was not found.' };
  }

  return undefined;
}

/**
 * Maps framework-level client errors (body parsing, payload limits) that are
 * not AppError/Zod/Prisma into a safe 4xx response instead of a generic 500.
 */
function normalizeHttpError(error: unknown): NormalizedError | undefined {
  if (typeof error !== 'object' || error === null) {
    return undefined;
  }

  const candidate = error as { status?: unknown; statusCode?: unknown; type?: unknown };
  const rawStatus = candidate.status ?? candidate.statusCode;

  if (typeof rawStatus !== 'number' || rawStatus < 400 || rawStatus >= 500) {
    return undefined;
  }

  if (candidate.type === 'entity.too.large') {
    return { status: 413, code: 'PAYLOAD_TOO_LARGE', message: 'The request body is too large.' };
  }

  if (candidate.type === 'entity.parse.failed') {
    return { status: 400, code: 'MALFORMED_JSON', message: 'The request body is not valid JSON.' };
  }

  return {
    status: rawStatus,
    code: 'REQUEST_ERROR',
    message: 'The request could not be processed.',
  };
}

function send(res: Response, normalized: NormalizedError): void {
  res.status(normalized.status).json({
    error: {
      code: normalized.code,
      message: normalized.message,
      ...(normalized.details !== undefined ? { details: normalized.details } : {}),
    },
  });
}

export function errorHandler(
  error: unknown,
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  if (res.headersSent) {
    next(error);
    return;
  }

  if (error instanceof AppError) {
    if (error.status >= 500) {
      logger.warn('application error', {
        requestId: req.id,
        method: req.method,
        route: req.originalUrl,
        status: error.status,
        code: error.code,
      });
    }

    send(res, {
      status: error.status,
      code: error.code,
      message: error.message,
      details: error.details,
    });
    return;
  }

  if (error instanceof ZodError) {
    send(res, {
      status: 400,
      code: 'VALIDATION_ERROR',
      message: 'The request could not be validated.',
      details: error.issues,
    });
    return;
  }

  const prismaError = normalizePrismaError(error);

  if (prismaError) {
    send(res, prismaError);
    return;
  }

  const httpError = normalizeHttpError(error);

  if (httpError) {
    send(res, httpError);
    return;
  }

  // Unknown/unexpected error: log full diagnostics server-side, never leak them.
  logger.error('unhandled error', {
    requestId: req.id,
    method: req.method,
    route: req.originalUrl,
    ...serializeError(error),
  });

  send(res, {
    status: 500,
    code: 'INTERNAL_ERROR',
    message: 'Something went wrong. Please try again later.',
  });
}
