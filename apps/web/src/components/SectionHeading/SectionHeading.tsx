import type { ReactNode } from 'react';

import styles from './SectionHeading.module.css';

type HeadingLevel = 'h1' | 'h2' | 'h3';

interface SectionHeadingProps {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: ReactNode;
  align?: 'left' | 'center';
  as?: HeadingLevel;
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  action,
  align = 'left',
  as = 'h2',
}: SectionHeadingProps) {
  const HeadingTag: HeadingLevel = as;
  const classes = [styles.heading, align === 'center' ? styles.center : '']
    .filter(Boolean)
    .join(' ');

  return (
    <div className={classes}>
      <div className={styles.text}>
        {eyebrow ? <p className={styles.eyebrow}>{eyebrow}</p> : null}
        <HeadingTag className={styles.title}>{title}</HeadingTag>
        {description ? <p className={styles.description}>{description}</p> : null}
      </div>
      {action ? <div className={styles.action}>{action}</div> : null}
    </div>
  );
}
