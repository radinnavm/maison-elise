import { EmptyState } from '@/components/EmptyState/EmptyState';

import styles from './Account.module.css';

export function AccountSettingsPage() {
  return (
    <section aria-labelledby="account-settings-title">
      <h2 id="account-settings-title" className={styles.sectionTitle}>
        Account Settings
      </h2>
      <EmptyState
        title="Settings are coming soon"
        description="Profile editing and communication preferences will be available in a later milestone."
      />
    </section>
  );
}
