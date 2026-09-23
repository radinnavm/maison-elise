import { describe, expect, it } from 'vitest';

import authReducer, {
  clearCredentials,
  selectAuthStatus,
  selectCurrentUser,
  selectIsAdmin,
  setCredentials,
} from '@/features/auth/authSlice';
import type { AuthUser } from '@maison-elise/shared';

const admin: AuthUser = {
  id: 'admin-1',
  firstName: 'Elise',
  lastName: 'Moreau',
  name: 'Elise Moreau',
  email: 'admin@example.com',
  role: 'ADMIN',
  createdAt: '2026-01-01T00:00:00.000Z',
};

const customer: AuthUser = { ...admin, id: 'user-1', role: 'CUSTOMER' };

describe('admin authSlice', () => {
  it('starts unknown and unauthenticated', () => {
    const state = authReducer(undefined, { type: '@@init' });
    expect(selectAuthStatus({ auth: state })).toBe('unknown');
    expect(selectIsAdmin({ auth: state })).toBe(false);
  });

  it('recognises an admin user', () => {
    const state = authReducer(undefined, setCredentials(admin));
    expect(selectIsAdmin({ auth: state })).toBe(true);
    expect(selectCurrentUser({ auth: state })).toEqual(admin);
  });

  it('does not grant admin to a customer', () => {
    const state = authReducer(undefined, setCredentials(customer));
    expect(selectIsAdmin({ auth: state })).toBe(false);
  });

  it('clears on logout', () => {
    let state = authReducer(undefined, setCredentials(admin));
    state = authReducer(state, clearCredentials());
    expect(selectIsAdmin({ auth: state })).toBe(false);
  });
});
