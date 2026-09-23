import assert from 'node:assert/strict';
import type { Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import { after, afterEach, before, describe, it, mock } from 'node:test';

process.env.NODE_ENV = 'test';
process.env.DATABASE_URL ??= 'postgresql://postgres:postgres@localhost:5432/maison_elise_test';
process.env.JWT_SECRET ??= 'test-secret';
process.env.CLIENT_URL = 'http://localhost:5173';
process.env.JSON_BODY_LIMIT = '2kb';

const { createApp } = await import('../app.js');
const { healthService } = await import('../services/health.service.js');
const { productRepository } = await import('../repositories/product.repository.js');

const ALLOWED_ORIGIN = 'http://localhost:5173';

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

describe('request correlation id', () => {
  it('assigns a request id and returns it in the response header', async () => {
    const response = await fetch(`${baseUrl}/health/live`);

    assert.equal(response.status, 200);
    assert.ok(response.headers.get('x-request-id'));
  });

  it('reuses a caller-provided request id', async () => {
    const response = await fetch(`${baseUrl}/health/live`, {
      headers: { 'x-request-id': 'trace-abc-123' },
    });

    assert.equal(response.headers.get('x-request-id'), 'trace-abc-123');
  });
});

describe('CORS', () => {
  it('allows the configured storefront origin with credentials', async () => {
    const response = await fetch(`${baseUrl}/health/live`, {
      headers: { origin: ALLOWED_ORIGIN },
    });

    assert.equal(response.headers.get('access-control-allow-origin'), ALLOWED_ORIGIN);
    assert.equal(response.headers.get('access-control-allow-credentials'), 'true');
  });

  it('does not send CORS headers for an unknown origin', async () => {
    const response = await fetch(`${baseUrl}/health/live`, {
      headers: { origin: 'https://evil.example.com' },
    });

    assert.equal(response.headers.get('access-control-allow-origin'), null);
  });

  it('answers a preflight request for an allowed origin', async () => {
    const response = await fetch(`${baseUrl}/auth/login`, {
      method: 'OPTIONS',
      headers: {
        origin: ALLOWED_ORIGIN,
        'access-control-request-method': 'POST',
      },
    });

    assert.equal(response.status, 204);
    assert.equal(response.headers.get('access-control-allow-origin'), ALLOWED_ORIGIN);
  });
});

describe('security headers', () => {
  it('sets safe defaults and hides the server technology', async () => {
    const response = await fetch(`${baseUrl}/health/live`);

    assert.equal(response.headers.get('x-powered-by'), null);
    assert.equal(response.headers.get('x-content-type-options'), 'nosniff');
    assert.equal(response.headers.get('referrer-policy'), 'no-referrer');
    // HSTS must not be sent outside production/HTTPS.
    assert.equal(response.headers.get('strict-transport-security'), null);
  });
});

describe('authorization boundaries', () => {
  it('rejects protected endpoints without a session', async () => {
    for (const path of ['/admin/dashboard', '/cart', '/orders']) {
      const response = await fetch(`${baseUrl}${path}`);
      assert.equal(response.status, 401, `${path} should require authentication`);
    }
  });
});

describe('request body handling', () => {
  it('rejects malformed JSON with a 400 instead of a 500', async () => {
    const response = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: '{"email": ',
    });

    assert.equal(response.status, 400);
    const body = (await response.json()) as { error: { code: string } };
    assert.equal(body.error.code, 'MALFORMED_JSON');
  });

  it('rejects an oversized body with a 413', async () => {
    const response = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email: 'a@b.com', password: 'x'.repeat(5000) }),
    });

    assert.equal(response.status, 413);
    const body = (await response.json()) as { error: { code: string } };
    assert.equal(body.error.code, 'PAYLOAD_TOO_LARGE');
  });
});

describe('error responses', () => {
  it('does not leak internal details on an unexpected error', async () => {
    mock.method(productRepository, 'findMany', async () => {
      throw new Error('boom at C:\\Users\\secret\\internal.js');
    });

    const response = await fetch(`${baseUrl}/products`);
    const raw = await response.text();

    assert.equal(response.status, 500);
    const body = JSON.parse(raw) as { error: { code: string; message: string } };
    assert.equal(body.error.code, 'INTERNAL_ERROR');
    assert.equal(body.error.message, 'Something went wrong. Please try again later.');
    assert.equal(raw.includes('boom'), false);
    assert.equal(raw.includes('secret'), false);
    assert.equal(raw.includes('internal.js'), false);
  });
});

describe('health endpoints', () => {
  it('reports liveness without touching the database', async () => {
    const response = await fetch(`${baseUrl}/health/live`);

    assert.equal(response.status, 200);
    const body = (await response.json()) as { status: string };
    assert.equal(body.status, 'ok');
  });

  it('reports ready when the database is reachable', async () => {
    mock.method(healthService, 'checkDatabase', async () => undefined);

    const response = await fetch(`${baseUrl}/health/ready`);

    assert.equal(response.status, 200);
    const body = (await response.json()) as { status: string; database: string };
    assert.deepEqual(body, { status: 'ok', database: 'up' });
  });

  it('reports 503 when the database is unreachable', async () => {
    mock.method(healthService, 'checkDatabase', async () => {
      throw new Error('connection refused');
    });

    const response = await fetch(`${baseUrl}/health/ready`);

    assert.equal(response.status, 503);
    const body = (await response.json()) as { status: string; database: string };
    assert.deepEqual(body, { status: 'unavailable', database: 'down' });
  });
});
