import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import type { NextFunction, Request, Response } from 'express';

import { ForbiddenError, UnauthenticatedError } from '../utils/errors.js';
import { authorize } from './authorize.js';

function createRequest(role?: 'CUSTOMER' | 'ADMIN'): Request {
  const request = {};

  if (role) {
    (request as Request).auth = { userId: 'user-1', role };
  }

  return request as Request;
}

function captureNext(): { next: NextFunction; getError: () => unknown; wasCalled: () => boolean } {
  let error: unknown;
  let called = false;

  const next = ((nextError?: unknown) => {
    called = true;
    error = nextError;
  }) as NextFunction;

  return { next, getError: () => error, wasCalled: () => called };
}

const response = {} as Response;

describe('authorize middleware', () => {
  it('rejects requests without an authenticated user', () => {
    const { next, getError } = captureNext();

    authorize('ADMIN')(createRequest(), response, next);

    assert.ok(getError() instanceof UnauthenticatedError);
  });

  it('rejects users without a permitted role', () => {
    const { next, getError } = captureNext();

    authorize('ADMIN')(createRequest('CUSTOMER'), response, next);

    assert.ok(getError() instanceof ForbiddenError);
  });

  it('allows users with a permitted role', () => {
    const { next, getError, wasCalled } = captureNext();

    authorize('ADMIN')(createRequest('ADMIN'), response, next);

    assert.equal(wasCalled(), true);
    assert.equal(getError(), undefined);
  });

  it('allows any authenticated user when no roles are required', () => {
    const { next, getError, wasCalled } = captureNext();

    authorize()(createRequest('CUSTOMER'), response, next);

    assert.equal(wasCalled(), true);
    assert.equal(getError(), undefined);
  });
});
