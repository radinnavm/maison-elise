import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { loginSchema, registerSchema } from './auth.schema.js';

describe('registerSchema', () => {
  const valid = {
    firstName: 'Camille',
    lastName: 'Laurent',
    email: 'camille@example.com',
    password: 'password123',
  };

  it('accepts valid registration input', () => {
    const parsed = registerSchema.parse(valid);

    assert.equal(parsed.firstName, 'Camille');
    assert.equal(parsed.email, 'camille@example.com');
  });

  it('normalises the email to lowercase and trims whitespace', () => {
    const parsed = registerSchema.parse({ ...valid, email: '  Camille@Example.COM  ' });

    assert.equal(parsed.email, 'camille@example.com');
  });

  it('rejects an invalid email address', () => {
    assert.throws(() => registerSchema.parse({ ...valid, email: 'not-an-email' }));
  });

  it('rejects a password shorter than eight characters', () => {
    assert.throws(() => registerSchema.parse({ ...valid, password: 'short' }));
  });

  it('rejects missing required fields', () => {
    assert.throws(() => registerSchema.parse({ ...valid, firstName: '' }));
  });

  it('accepts a single name field', () => {
    const parsed = registerSchema.parse({
      name: 'Camille Laurent',
      email: 'camille@example.com',
      password: 'password123',
    });

    assert.equal(parsed.name, 'Camille Laurent');
  });

  it('rejects registration without any name', () => {
    assert.throws(() =>
      registerSchema.parse({ email: 'camille@example.com', password: 'password123' }),
    );
  });
});

describe('loginSchema', () => {
  it('accepts valid login input', () => {
    const parsed = loginSchema.parse({ email: 'camille@example.com', password: 'password123' });

    assert.equal(parsed.email, 'camille@example.com');
  });

  it('rejects an empty password', () => {
    assert.throws(() => loginSchema.parse({ email: 'camille@example.com', password: '' }));
  });

  it('rejects an invalid email address', () => {
    assert.throws(() => loginSchema.parse({ email: 'nope', password: 'password123' }));
  });
});
