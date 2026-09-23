import assert from 'node:assert/strict';
import type { Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import { after, afterEach, before, beforeEach, describe, it, mock } from 'node:test';

process.env.NODE_ENV = 'test';
process.env.DATABASE_URL ??= 'postgresql://postgres:postgres@localhost:5432/maison_elise_test';
process.env.JWT_SECRET ??= 'test-secret';
process.env.CLIENT_URL = 'http://localhost:5173';
process.env.RATE_LIMIT_ENABLED = 'true';
process.env.AUTH_RATE_LIMIT_MAX = '2';
process.env.AUTH_RATE_LIMIT_WINDOW_MS = '60000';

const { createApp } = await import('../app.js');
const { userRepository } = await import('../repositories/user.repository.js');

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
  mock.method(userRepository, 'findByEmail', async () => null);
});

afterEach(() => {
  mock.restoreAll();
});

function login(): Promise<Response> {
  return fetch(`${baseUrl}/auth/login`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email: 'nobody@example.com', password: 'password123' }),
  });
}

describe('authentication rate limiting', () => {
  it('returns 429 once the per-window limit is exceeded', async () => {
    const first = await login();
    const second = await login();
    const third = await login();

    assert.equal(first.status, 401);
    assert.equal(second.status, 401);
    assert.equal(third.status, 429);

    const body = (await third.json()) as { error: { code: string } };
    assert.equal(body.error.code, 'TOO_MANY_REQUESTS');
  });
});
