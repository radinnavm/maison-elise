import heroImage from '@/assets/hero/autumn-edit.svg';
import { ButtonLink } from '@/components/Button/Button';

import styles from './Hero.module.css';

export function Hero() {
  return (
    <section className={styles.hero} aria-labelledby="hero-title">
      <img
        className={styles.image}
        src={heroImage}
        alt=""
        width="1920"
        height="1080"
        fetchPriority="high"
      />
      <div className={styles.overlay} aria-hidden="true" />
      <div className={`container ${styles.content}`}>
        <p className={styles.eyebrow}>The Autumn Edit</p>
        <h1 id="hero-title" className={styles.title}>
          A New Expression of Elegance
        </h1>
        <ButtonLink to="/collections" variant="light" size="lg">
          Shop Now
        </ButtonLink>
      </div>
    </section>
  );
}
