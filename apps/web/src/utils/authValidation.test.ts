import { describe, expect, it } from 'vitest';

import { validateLogin, validateRegister } from '@/utils/authValidation';

describe('validateLogin', () => {
  it('accepts valid credentials', () => {
    expect(validateLogin({ email: 'a@b.com', password: 'secret' })).toEqual({});
  });

  it('rejects an invalid email and empty password', () => {
    const errors = validateLogin({ email: 'nope', password: '' });
    expect(errors.email).toBeDefined();
    expect(errors.password).toBeDefined();
  });
});

describe('validateRegister', () => {
  const valid = {
    firstName: 'Camille',
    lastName: 'Laurent',
    email: 'camille@example.com',
    password: 'password123',
    confirmPassword: 'password123',
  };

  it('accepts valid registration', () => {
    expect(validateRegister(valid)).toEqual({});
  });

  it('requires a minimum password length', () => {
    const errors = validateRegister({ ...valid, password: 'short', confirmPassword: 'short' });
    expect(errors.password).toBeDefined();
  });

  it('requires matching passwords', () => {
    const errors = validateRegister({ ...valid, confirmPassword: 'different' });
    expect(errors.confirmPassword).toBeDefined();
  });
});
