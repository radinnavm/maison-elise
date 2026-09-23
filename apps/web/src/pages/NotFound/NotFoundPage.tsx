import { ButtonLink } from '@/components/Button/Button';
import { Seo } from '@/components/Seo/Seo';

import styles from './NotFoundPage.module.css';

export function NotFoundPage() {
  return (
    <section className={styles.section}>
      <Seo
        title="Page Not Found"
        description="The page you are looking for could not be found."
        canonicalPath="/"
        robots="noindex"
      />
      <div className={`container ${styles.inner}`}>
        <p className={styles.eyebrow}>Error 404</p>
        <h1 className={styles.title}>This page could not be found</h1>
        <p className={styles.text}>
          The page you are looking for may have moved, or it may no longer be available.
        </p>
        <ButtonLink to="/" variant="primary" size="md">
          Return Home
        </ButtonLink>
      </div>
    </section>
  );
}
