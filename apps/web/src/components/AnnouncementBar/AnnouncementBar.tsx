import styles from './AnnouncementBar.module.css';

export function AnnouncementBar() {
  return (
    <div className={styles.bar}>
      <p className={styles.text}>Complimentary shipping and returns on orders over €200</p>
    </div>
  );
}
