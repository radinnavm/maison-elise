import { NewsletterForm } from '@/components/NewsletterForm/NewsletterForm';

import styles from './NewsletterSection.module.css';

export function NewsletterSection() {
  return (
    <section className={styles.section} aria-labelledby="newsletter-title">
      <div className={`container ${styles.inner}`}>
        <p className={styles.eyebrow}>Newsletter</p>
        <h2 id="newsletter-title" className={styles.title}>
          Join the Maison
        </h2>
        <p className={styles.text}>
          Be the first to receive new arrivals, private sales and editorial stories.
        </p>
        <NewsletterForm />
      </div>
    </section>
  );
}
