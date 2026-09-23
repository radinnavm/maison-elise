import assert from 'node:assert/strict';
import type { Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import { after, afterEach, before, describe, it, mock } from 'node:test';

process.env.NODE_ENV = 'test';
process.env.DATABASE_URL ??= 'postgresql://postgres:postgres@localhost:5432/maison_elise_test';
process.env.JWT_SECRET ??= 'test-secret';

const { createApp } = await import('../app.js');
const { adminRepository } = await import('../repositories/admin.repository.js');
const { signAuthToken } = await import('../utils/jwt.js');

const COOKIE_NAME = 'maison_elise_token';

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

afterEach(() => {
  mock.restoreAll();
});

function cookieFor(role: 'CUSTOMER' | 'ADMIN'): string {
  return `${COOKIE_NAME}=${signAuthToken({ userId: 'user-1', role })}`;
}

describe('admin authorization', () => {
  it('rejects unauthenticated access with 401', async () => {
    const paths = [
      '/admin/dashboard',
      '/admin/orders',
      '/admin/products',
      '/admin/inventory',
      '/admin/categories',
      '/admin/customers',
    ];

    for (const path of paths) {
      const response = await fetch(`${baseUrl}${path}`);
      assert.equal(response.status, 401, `${path} should be 401`);
    }
  });

  it('rejects a customer with 403', async () => {
    const response = await fetch(`${baseUrl}/admin/dashboard`, {
      headers: { cookie: cookieFor('CUSTOMER') },
    });

    assert.equal(response.status, 403);
  });

  it('rejects customer state-changing admin requests with 403', async () => {
    const mutations: { path: string; method: string; body: string }[] = [
      { path: '/admin/products', method: 'POST', body: '{}' },
      { path: '/admin/products/product-1', method: 'PATCH', body: '{}' },
      { path: '/admin/inventory/variant-1', method: 'PATCH', body: '{}' },
      { path: '/admin/orders/order-1/status', method: 'PATCH', body: '{"status":"CONFIRMED"}' },
      { path: '/admin/categories', method: 'POST', body: '{}' },
    ];

    for (const mutation of mutations) {
      const response = await fetch(`${baseUrl}${mutation.path}`, {
        method: mutation.method,
        headers: {
          cookie: cookieFor('CUSTOMER'),
          'content-type': 'application/json',
        },
        body: mutation.body,
      });

      assert.equal(response.status, 403, `${mutation.method} ${mutation.path} should be 403`);
    }
  });

  it('rejects anonymous state-changing admin requests with 401', async () => {
    const response = await fetch(`${baseUrl}/admin/products`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: '{}',
    });

    assert.equal(response.status, 401);
  });

  it('allows an admin', async () => {
    mock.method(adminRepository, 'dashboard', async () => ({
      total: 1,
      pending: 1,
      confirmed: 0,
      cancelled: 0,
      confirmedRevenue: 0,
      products: 0,
      lowStockVariants: 0,
      outOfStockVariants: 0,
      customers: 0,
    }));

    const response = await fetch(`${baseUrl}/admin/dashboard`, {
      headers: { cookie: cookieFor('ADMIN') },
    });

    assert.equal(response.status, 200);
    const body = (await response.json()) as { data: { orders: { total: number } } };
    assert.equal(body.data.orders.total, 1);
  });
});
