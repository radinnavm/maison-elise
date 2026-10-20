import { Navigate, Outlet, useLocation } from 'react-router';

import { useAppSelector } from '@/app/hooks';
import { LoadingState } from '@/components/StateMessage/LoadingState';
import { env } from '@/config/env';
import { selectAuthStatus, selectIsAuthenticated } from '@/features/auth/authSlice';

export function ProtectedRoute() {
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const status = useAppSelector(selectAuthStatus);
  const location = useLocation();

  if (env.demoCatalog) {
    return <Outlet />;
  }

  if (status === 'unknown') {
    return <LoadingState label="Checking your session" />;
  }

  if (!isAuthenticated) {
    const redirect = `${location.pathname}${location.search}`;
    return <Navigate to={`/login?redirect=${encodeURIComponent(redirect)}`} replace />;
  }

  return <Outlet />;
}
