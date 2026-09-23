import { describe, expect, it } from 'vitest';

import authReducer, {
  clearCredentials,
  selectAuthStatus,
  selectCurrentUser,
  selectIsAuthenticated,
  setCredentials,
} from '@/features/auth/authSlice';
import type { AuthUser } from '@/types/auth';

const user: AuthUser = {
  id: 'user-1',
  firstName: 'Camille',
  lastName: 'Laurent',
  name: 'Camille Laurent',
  email: 'camille@example.com',
  role: 'CUSTOMER',
  createdAt: '2026-01-01T00:00:00.000Z',
};

describe('authSlice', () => {
  it('starts in an unknown state', () => {
    const state = authReducer(undefined, { type: '@@init' });
    expect(selectAuthStatus({ auth: state })).toBe('unknown');
    expect(selectIsAuthenticated({ auth: state })).toBe(false);
  });

  it('stores the authenticated user', () => {
    const state = authReducer(undefined, setCredentials(user));
    expect(selectAuthStatus({ auth: state })).toBe('authenticated');
    expect(selectCurrentUser({ auth: state })).toEqual(user);
  });

  it('clears credentials on logout', () => {
    let state = authReducer(undefined, setCredentials(user));
    state = authReducer(state, clearCredentials());

    expect(selectAuthStatus({ auth: state })).toBe('unauthenticated');
    expect(selectCurrentUser({ auth: state })).toBeNull();
  });
});
