import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { comparePassword, hashPassword } from './password.js';

describe('password utilities', () => {
  it('hashes a password to a non-plaintext value', async () => {
    const hashed = await hashPassword('password123');

    assert.notEqual(hashed, 'password123');
    assert.ok(hashed.length > 20);
  });

  it('verifies a correct password', async () => {
    const hashed = await hashPassword('password123');

    assert.equal(await comparePassword('password123', hashed), true);
  });

  it('rejects an incorrect password', async () => {
    const hashed = await hashPassword('password123');

    assert.equal(await comparePassword('wrong-password', hashed), false);
  });
});
