import assert from 'node:assert/strict';
import type { Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import { after, afterEach, before, describe, it, mock } from 'node:test';

process.env.NODE_ENV = 'test';
process.env.DATABASE_URL ??= 'postgresql://postgres:postgres@localhost:5432/maison_elise_test';
process.env.JWT_SECRET ??= 'test-secret';

const { createApp } = await import('../app.js');
const { cartRepository } = await import('../repositories/cart.repository.js');
const { signAuthToken } = await import('../utils/jwt.js');

const COOKIE_NAME = 'maison_elise_token';

let server: Server;
let baseUrl: string;
let cookie: string;

before(async () => {
  const app = createApp();
  server = app.listen(0);

  await new Promise<void>((resolve) => {
    server.once('listening', () => resolve());
  });

  const address = server.address() as AddressInfo;
  baseUrl = `http://127.0.0.1:${address.port}/api/v1`;
  cookie = `${COOKIE_NAME}=${signAuthToken({ userId: 'user-a', role: 'CUSTOMER' })}`;
});

after(async () => {
  await new Promise<void>((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
});

afterEach(() => {
  mock.restoreAll();
});

describe('cart routes authentication', () => {
  it('rejects every cart endpoint without a session', async () => {
    const requests: [string, string][] = [
      ['GET', '/cart'],
      ['POST', '/cart/items'],
      ['PATCH', '/cart/items/item-1'],
      ['DELETE', '/cart/items/item-1'],
      ['DELETE', '/cart'],
      ['POST', '/cart/merge'],
    ];

    for (const [method, path] of requests) {
      const response = await fetch(`${baseUrl}${path}`, {
        method,
        headers: { 'content-type': 'application/json' },
        body: method === 'GET' || method === 'DELETE' ? undefined : '{}',
      });

      assert.equal(response.status, 401, `${method} ${path} should be 401`);
    }
  });

  it('returns the authenticated cart', async () => {
    mock.method(cartRepository, 'findByUserId', async () => null);

    const response = await fetch(`${baseUrl}/cart`, { headers: { cookie } });

    assert.equal(response.status, 200);

    const body = (await response.json()) as { data: { items: unknown[]; subtotal: number } };
    assert.deepEqual(body.data.items, []);
    assert.equal(body.data.subtotal, 0);
  });
});
