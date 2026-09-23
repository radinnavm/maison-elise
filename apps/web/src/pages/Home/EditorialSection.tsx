import editorialImage from '@/assets/editorial/art-of-dressing.svg';
import { ButtonLink } from '@/components/Button/Button';

import styles from './EditorialSection.module.css';

export function EditorialSection() {
  return (
    <section className={styles.section} aria-labelledby="editorial-title">
      <div className={`container ${styles.inner}`}>
        <div className={styles.media}>
          <img
            src={editorialImage}
            alt="Editorial study of draped fabric in warm neutral tones"
            width="1200"
            height="1500"
            loading="lazy"
          />
        </div>
        <div className={styles.content}>
          <p className={styles.eyebrow}>Editorial</p>
          <h2 id="editorial-title" className={styles.title}>
            The Art of Dressing
          </h2>
          <p className={styles.text}>
            Discover our latest collection — considered silhouettes, natural fibres and a palette
            drawn from the season.
          </p>
          <ButtonLink to="/journal" variant="secondary" size="md">
            Explore
          </ButtonLink>
        </div>
      </div>
    </section>
  );
}
