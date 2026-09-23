import { Navigate, Outlet, useLocation } from 'react-router';

import { useAppSelector } from '@/app/hooks';
import { LoadingState } from '@/components/StateMessage';
import { selectAuthStatus, selectIsAdmin } from '@/features/auth/authSlice';

export function RequireAdmin() {
  const status = useAppSelector(selectAuthStatus);
  const isAdmin = useAppSelector(selectIsAdmin);
  const location = useLocation();

  if (status === 'unknown') {
    return <LoadingState label="Checking your session…" />;
  }

  if (!isAdmin) {
    const redirect = encodeURIComponent(`${location.pathname}${location.search}`);
    return <Navigate to={`/login?redirect=${redirect}`} replace />;
  }

  return <Outlet />;
}
