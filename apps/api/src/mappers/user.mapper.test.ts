import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import type { User } from '@prisma/client';

import { toAuthUser } from './user.mapper.js';

const user: User = {
  id: 'user-1',
  firstName: 'Test',
  lastName: 'User',
  email: 'test-auth@example.com',
  passwordHash: '$2b$10$abcdefghijklmnopqrstuv',
  role: 'CUSTOMER',
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  updatedAt: new Date('2026-01-02T00:00:00.000Z'),
};

describe('toAuthUser', () => {
  it('exposes only safe user fields', () => {
    const dto = toAuthUser(user);

    assert.deepEqual(dto, {
      id: 'user-1',
      firstName: 'Test',
      lastName: 'User',
      name: 'Test User',
      email: 'test-auth@example.com',
      role: 'CUSTOMER',
      createdAt: '2026-01-01T00:00:00.000Z',
    });
  });

  it('never exposes the password hash', () => {
    const dto = toAuthUser(user);

    assert.equal('passwordHash' in dto, false);
    assert.equal(JSON.stringify(dto).includes('$2b$'), false);
  });
});
