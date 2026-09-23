import { ButtonLink } from '@/components/Button/Button';
import { Seo } from '@/components/Seo/Seo';

import styles from './PlaceholderPage.module.css';

interface PlaceholderPageProps {
  eyebrow: string;
  title: string;
  description: string;
}

export function PlaceholderPage({ eyebrow, title, description }: PlaceholderPageProps) {
  return (
    <section className={styles.section}>
      <Seo title={title} description={description} robots="noindex" />
      <div className={`container ${styles.inner}`}>
        <p className={styles.eyebrow}>{eyebrow}</p>
        <h1 className={styles.title}>{title}</h1>
        <p className={styles.text}>{description}</p>
        <ButtonLink to="/shop" variant="primary" size="md">
          Continue shopping
        </ButtonLink>
      </div>
    </section>
  );
}
