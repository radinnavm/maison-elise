import { useNavigate } from 'react-router';

import { useLogoutMutation } from '@/api/authApi';
import { useAppSelector } from '@/app/hooks';
import { Button } from '@/components/Button/Button';
import { selectCurrentUser } from '@/features/auth/authSlice';

import styles from './Account.module.css';

const dateFormatter = new Intl.DateTimeFormat('en-IE', { dateStyle: 'long' });

export function AccountOverviewPage() {
  const [logout, { isLoading }] = useLogoutMutation();
  const user = useAppSelector(selectCurrentUser);
  const navigate = useNavigate();

  if (!user) {
    return null;
  }

  async function handleLogout() {
    try {
      await logout().unwrap();
    } catch {
      // Even if the request fails, local credentials are cleared.
    }

    navigate('/', { replace: true });
  }

  return (
    <section aria-labelledby="account-details-title">
      <h2 id="account-details-title" className={styles.sectionTitle}>
        Account
      </h2>

      <dl className={styles.profileList}>
        <div className={styles.profileRow}>
          <dt className={styles.profileLabel}>Name</dt>
          <dd className={styles.profileValue}>{user.name}</dd>
        </div>
        <div className={styles.profileRow}>
          <dt className={styles.profileLabel}>Email</dt>
          <dd className={styles.profileValue}>{user.email}</dd>
        </div>
        <div className={styles.profileRow}>
          <dt className={styles.profileLabel}>Member since</dt>
          <dd className={styles.profileValue}>{dateFormatter.format(new Date(user.createdAt))}</dd>
        </div>
        <div className={styles.profileRow}>
          <dt className={styles.profileLabel}>Account type</dt>
          <dd className={styles.profileValue}>
            {user.role === 'ADMIN' ? 'Administrator' : 'Customer'}
          </dd>
        </div>
      </dl>

      <div className={styles.actions}>
        <Button
          type="button"
          variant="secondary"
          size="md"
          disabled={isLoading}
          onClick={handleLogout}
        >
          {isLoading ? 'Signing Out…' : 'Sign Out'}
        </Button>
      </div>
    </section>
  );
}
