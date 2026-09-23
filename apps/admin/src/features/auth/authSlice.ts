import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';

import type { AuthUser } from '@maison-elise/shared';

export type AuthStatus = 'unknown' | 'authenticated' | 'unauthenticated';

export interface AuthState {
  user: AuthUser | null;
  status: AuthStatus;
}

const initialState: AuthState = {
  user: null,
  status: 'unknown',
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials(state, action: PayloadAction<AuthUser>) {
      state.user = action.payload;
      state.status = 'authenticated';
    },
    clearCredentials(state) {
      state.user = null;
      state.status = 'unauthenticated';
    },
  },
});

export const { setCredentials, clearCredentials } = authSlice.actions;

export default authSlice.reducer;

interface AuthRootState {
  auth: AuthState;
}

export const selectCurrentUser = (state: AuthRootState) => state.auth.user;
export const selectAuthStatus = (state: AuthRootState) => state.auth.status;
export const selectIsAdmin = (state: AuthRootState) =>
  state.auth.user !== null && state.auth.user.role === 'ADMIN';
