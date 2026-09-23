import { useState } from 'react';
import type { FormEvent } from 'react';
import { Navigate, useNavigate, useSearchParams } from 'react-router';

import { getErrorMessage } from '@/api/apiError';
import { useLoginMutation, useLogoutMutation } from '@/api/authApi';
import { useAppSelector } from '@/app/hooks';
import { Button } from '@/components/Button';
import { FormField } from '@/components/FormField';
import { selectAuthStatus, selectCurrentUser } from '@/features/auth/authSlice';
import { getSafeRedirect } from '@/utils/redirect';

export function LoginPage() {
  const [login, { isLoading }] = useLoginMutation();
  const [logout] = useLogoutMutation();
  const status = useAppSelector(selectAuthStatus);
  const user = useAppSelector(selectCurrentUser);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectTo = getSafeRedirect(searchParams.get('redirect'), '/');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (status === 'authenticated' && user?.role === 'ADMIN') {
    return <Navigate to={redirectTo} replace />;
  }

  const isCustomer = status === 'authenticated' && user !== null && user.role !== 'ADMIN';

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    try {
      const result = await login({ email, password }).unwrap();

      if (result.user.role !== 'ADMIN') {
        setError('This account does not have administrator access.');
        return;
      }

      navigate(redirectTo, { replace: true });
    } catch (submitError) {
      setError(getErrorMessage(submitError));
    }
  }

  return (
    <div className="admin-content" style={{ maxWidth: '26rem', margin: '4rem auto' }}>
      <div className="admin-brand" style={{ color: 'var(--color-text)', marginBottom: '1.5rem' }}>
        Maison Élise
        <small style={{ color: 'var(--color-text-muted)' }}>Administration</small>
      </div>

      {isCustomer ? (
        <div className="form-error" role="alert">
          You are signed in as a customer. Administrator access is required.{' '}
          <button
            type="button"
            className="link"
            onClick={() => {
              void logout();
            }}
          >
            Sign out
          </button>
        </div>
      ) : null}

      <form onSubmit={handleSubmit} noValidate>
        {error ? (
          <p className="form-error" role="alert">
            {error}
          </p>
        ) : null}

        <div style={{ marginBottom: '1rem' }}>
          <FormField label="Email" htmlFor="admin-email">
            <input
              id="admin-email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </FormField>
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <FormField label="Password" htmlFor="admin-password">
            <input
              id="admin-password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </FormField>
        </div>

        <Button type="submit" disabled={isLoading} className="btn-primary">
          {isLoading ? 'Signing in…' : 'Sign in'}
        </Button>
      </form>
    </div>
  );
}
