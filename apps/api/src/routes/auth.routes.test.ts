import assert from 'node:assert/strict';
import type { Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import { after, afterEach, before, beforeEach, describe, it, mock } from 'node:test';

import type { Prisma, User } from '@prisma/client';
import { hash } from 'bcryptjs';

process.env.NODE_ENV = 'test';
process.env.DATABASE_URL ??= 'postgresql://postgres:postgres@localhost:5432/maison_elise_test';
process.env.JWT_SECRET ??= 'test-secret';

const { createApp } = await import('../app.js');
const { userRepository } = await import('../repositories/user.repository.js');
const { notificationService } = await import('../services/notification.service.js');

const COOKIE_NAME = 'maison_elise_token';

interface AuthUserBody {
  id: string;
  firstName: string;
  lastName: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
}

interface AuthBody {
  user: AuthUserBody;
}

interface ErrorBody {
  error: { code: string; message: string; details?: unknown };
}

function makeUser(overrides: Partial<User> = {}): User {
  return {
    id: 'user-1',
    firstName: 'Test',
    lastName: 'User',
    email: 'test-auth@example.com',
    passwordHash: '',
    role: 'CUSTOMER',
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    ...overrides,
  };
}

async function readJson<T>(response: Response): Promise<T> {
  return (await response.json()) as T;
}

let server: Server;
let baseUrl: string;

before(async () => {
  const app = createApp();
  server = app.listen(0);

  await new Promise<void>((resolve) => {
    server.once('listening', () => resolve());
  });

  const address = server.address() as AddressInfo;
  baseUrl = `http://127.0.0.1:${address.port}/api/v1`;
});

after(async () => {
  await new Promise<void>((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
});

beforeEach(() => {
  mock.method(notificationService, 'sendWelcome', async () => undefined);
});

afterEach(() => {
  mock.restoreAll();
});

function postJson(path: string, body: unknown, cookie?: string): Promise<Response> {
  const headers: Record<string, string> = { 'content-type': 'application/json' };
  if (cookie) {
    headers.cookie = cookie;
  }

  return fetch(`${baseUrl}${path}`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });
}

function sessionCookie(response: Response): string | undefined {
  const setCookie = response.headers.getSetCookie();
  const cookie = setCookie.find((value) => value.startsWith(`${COOKIE_NAME}=`));
  return cookie?.split(';')[0];
}

describe('auth routes', () => {
  it('registers a user, hashes the password and sets a session cookie', async () => {
    mock.method(userRepository, 'findByEmail', async () => null);
    const createMock = mock.method(userRepository, 'create', async (data: Prisma.UserCreateInput) =>
      makeUser({
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        passwordHash: data.passwordHash,
      }),
    );

    const response = await postJson('/auth/register', {
      name: 'Test User',
      email: 'Test-Auth@Example.com',
      password: 'password123',
    });

    assert.equal(response.status, 201);

    const body = await readJson<AuthBody>(response);
    assert.equal(body.user.email, 'test-auth@example.com');
    assert.equal(body.user.name, 'Test User');
    assert.equal(body.user.role, 'CUSTOMER');
    assert.equal(body.user.createdAt, '2026-01-01T00:00:00.000Z');
    assert.equal('passwordHash' in body.user, false);
    assert.equal('password' in body.user, false);
    assert.ok(sessionCookie(response));

    const created = createMock.mock.calls[0]?.arguments[0];
    assert.ok(created);
    assert.notEqual(created.passwordHash, 'password123');
    assert.ok(created.passwordHash.startsWith('$2'));
  });

  it('rejects registration with a duplicate email', async () => {
    mock.method(userRepository, 'findByEmail', async () =>
      makeUser({ passwordHash: await hash('password123', 10) }),
    );

    const response = await postJson('/auth/register', {
      name: 'Test User',
      email: 'test-auth@example.com',
      password: 'password123',
    });

    assert.equal(response.status, 409);

    const body = await readJson<ErrorBody>(response);
    assert.equal(body.error.code, 'EMAIL_IN_USE');
  });

  it('rejects invalid registration input with a 400', async () => {
    const response = await postJson('/auth/register', {
      email: 'not-an-email',
      password: 'short',
    });

    assert.equal(response.status, 400);

    const body = await readJson<ErrorBody>(response);
    assert.equal(body.error.code, 'VALIDATION_ERROR');
    assert.ok(Array.isArray(body.error.details));
  });

  it('logs in with valid credentials', async () => {
    mock.method(userRepository, 'findByEmail', async () =>
      makeUser({ passwordHash: await hash('password123', 10) }),
    );

    const response = await postJson('/auth/login', {
      email: 'test-auth@example.com',
      password: 'password123',
    });

    assert.equal(response.status, 200);

    const body = await readJson<AuthBody>(response);
    assert.equal(body.user.email, 'test-auth@example.com');
    assert.equal('passwordHash' in body.user, false);
    assert.ok(sessionCookie(response));
  });

  it('rejects an unknown email and a wrong password with a generic 401', async () => {
    mock.method(userRepository, 'findByEmail', async () => null);

    const unknownEmail = await postJson('/auth/login', {
      email: 'test-auth@example.com',
      password: 'password123',
    });
    assert.equal(unknownEmail.status, 401);

    const unknownBody = await readJson<ErrorBody>(unknownEmail);
    assert.equal(unknownBody.error.code, 'UNAUTHENTICATED');
    assert.equal(unknownBody.error.message, 'The email or password you entered is incorrect.');

    mock.method(userRepository, 'findByEmail', async () =>
      makeUser({ passwordHash: await hash('a-different-password', 10) }),
    );

    const wrongPassword = await postJson('/auth/login', {
      email: 'test-auth@example.com',
      password: 'password123',
    });
    assert.equal(wrongPassword.status, 401);
  });

  it('returns the current user when authenticated and 401 otherwise', async () => {
    const passwordHash = await hash('password123', 10);
    mock.method(userRepository, 'findByEmail', async () => makeUser({ passwordHash }));
    mock.method(userRepository, 'findById', async () => makeUser({ passwordHash }));

    const loginResponse = await postJson('/auth/login', {
      email: 'test-auth@example.com',
      password: 'password123',
    });
    const cookie = sessionCookie(loginResponse);
    assert.ok(cookie);

    const meResponse = await fetch(`${baseUrl}/auth/me`, { headers: { cookie } });
    assert.equal(meResponse.status, 200);

    const me = await readJson<AuthBody>(meResponse);
    assert.equal(me.user.email, 'test-auth@example.com');
    assert.equal('passwordHash' in me.user, false);

    const anonymousResponse = await fetch(`${baseUrl}/auth/me`);
    assert.equal(anonymousResponse.status, 401);
  });

  it('clears the session cookie on logout', async () => {
    const response = await fetch(`${baseUrl}/auth/logout`, { method: 'POST' });

    assert.equal(response.status, 200);

    const setCookie = response.headers.getSetCookie();
    const cookie = setCookie.find((value) => value.startsWith(`${COOKIE_NAME}=`));
    assert.ok(cookie);
    assert.match(cookie, /maison_elise_token=;|Max-Age=0|Expires=Thu, 01 Jan 1970/);
  });

  it('protects admin-only endpoints', async () => {
    const anonymous = await postJson('/products', {});
    assert.equal(anonymous.status, 401);

    const passwordHash = await hash('password123', 10);
    mock.method(userRepository, 'findByEmail', async () =>
      makeUser({ passwordHash, role: 'CUSTOMER' }),
    );

    const loginResponse = await postJson('/auth/login', {
      email: 'test-auth@example.com',
      password: 'password123',
    });
    const cookie = sessionCookie(loginResponse);
    assert.ok(cookie);

    const forbidden = await postJson('/products', {}, cookie);
    assert.equal(forbidden.status, 403);
  });
});
