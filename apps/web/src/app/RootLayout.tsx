import { Outlet } from 'react-router';

import { useGetCurrentUserQuery } from '@/api/authApi';
import { useAppSelector } from '@/app/hooks';
import { AnnouncementBar } from '@/components/AnnouncementBar/AnnouncementBar';
import { Footer } from '@/components/Footer/Footer';
import { Header } from '@/components/Header/Header';
import { LoadingState } from '@/components/StateMessage/LoadingState';
import { selectAuthStatus } from '@/features/auth/authSlice';

import styles from './RootLayout.module.css';

export function RootLayout() {
  useGetCurrentUserQuery();
  const status = useAppSelector(selectAuthStatus);

  if (status === 'unknown') {
    return (
      <div className={styles.boot}>
        <LoadingState label="Loading Maison Élise" />
      </div>
    );
  }

  return (
    <>
      <a href="#main-content" className="skip-link">
        Skip to content
      </a>
      <AnnouncementBar />
      <Header />
      <main id="main-content" className={styles.main}>
        <Outlet />
      </main>
      <Footer />
    </>
  );
}
