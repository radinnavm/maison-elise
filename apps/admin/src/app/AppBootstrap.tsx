import { Outlet } from 'react-router';

import { useGetCurrentUserQuery } from '@/api/authApi';
import { useAppSelector } from '@/app/hooks';
import { LoadingState } from '@/components/StateMessage';
import { selectAuthStatus } from '@/features/auth/authSlice';

export function AppBootstrap() {
  useGetCurrentUserQuery();
  const status = useAppSelector(selectAuthStatus);

  if (status === 'unknown') {
    return (
      <div className="admin-content">
        <LoadingState label="Loading Maison Élise administration…" />
      </div>
    );
  }

  return <Outlet />;
}
