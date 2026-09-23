import assert from 'node:assert/strict';
import type { Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import { after, before, describe, it } from 'node:test';

process.env.NODE_ENV = 'test';
process.env.DATABASE_URL ??= 'postgresql://postgres:postgres@localhost:5432/maison_elise_test';
process.env.JWT_SECRET ??= 'test-secret';
process.env.CLIENT_URL = 'http://localhost:5173';
process.env.ADMIN_URL = 'http://localhost:5174';
process.env.CSRF_PROTECTION_ENABLED = 'true';

const { createApp } = await import('../app.js');
const { signAuthToken } = await import('../utils/jwt.js');

const COOKIE_NAME = 'maison_elise_token';
const STOREFRONT = 'http://localhost:5173';
const ADMIN = 'http://localhost:5174';
const EVIL = 'https://evil.example.com';

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

function sessionCookie(): string {
  return `${COOKIE_NAME}=${signAuthToken({ userId: 'user-1', role: 'CUSTOMER' })}`;
}

function post(path: string, headers: Record<string, string>): Promise<Response> {
  return fetch(`${baseUrl}${path}`, { method: 'POST', headers, body: '{}' });
}

describe('CSRF protection (Origin validation for cookie requests)', () => {
  it('rejects a cookie-authenticated POST from a disallowed origin', async () => {
    const response = await post('/auth/logout', {
      cookie: sessionCookie(),
      origin: EVIL,
      'content-type': 'application/json',
    });

    assert.equal(response.status, 403);
    const body = (await response.json()) as { error: { code: string } };
    assert.equal(body.error.code, 'CSRF_REJECTED');
  });

  it('rejects a cookie-authenticated POST with no Origin or Referer', async () => {
    const response = await post('/auth/logout', {
      cookie: sessionCookie(),
      'content-type': 'application/json',
    });

    assert.equal(response.status, 403);
  });

  it('allows a cookie-authenticated POST from the storefront origin', async () => {
    const response = await post('/auth/logout', {
      cookie: sessionCookie(),
      origin: STOREFRONT,
      'content-type': 'application/json',
    });

    assert.equal(response.status, 200);
  });

  it('allows a cookie-authenticated POST from the admin origin', async () => {
    const response = await post('/auth/logout', {
      cookie: sessionCookie(),
      origin: ADMIN,
      'content-type': 'application/json',
    });

    assert.equal(response.status, 200);
  });

  it('allows a Bearer-authenticated request without an Origin', async () => {
    const response = await post('/auth/logout', {
      cookie: sessionCookie(),
      authorization: `Bearer ${signAuthToken({ userId: 'user-1', role: 'CUSTOMER' })}`,
      'content-type': 'application/json',
    });

    assert.equal(response.status, 200);
  });

  it('does not apply to requests without a session cookie', async () => {
    const response = await post('/auth/logout', {
      origin: EVIL,
      'content-type': 'application/json',
    });

    assert.equal(response.status, 200);
  });

  it('does not block safe methods from any origin', async () => {
    const response = await fetch(`${baseUrl}/health/live`, {
      headers: { cookie: sessionCookie(), origin: EVIL },
    });

    assert.equal(response.status, 200);
  });

  it('does not block the Stripe webhook (signature-verified instead)', async () => {
    const response = await post('/webhooks/stripe', {
      origin: EVIL,
      'content-type': 'application/json',
    });

    // Not CSRF-rejected; it fails signature verification (or payment config) instead.
    assert.notEqual(response.status, 403);
  });
});
