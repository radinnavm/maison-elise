import styles from './ProductImagePlaceholder.module.css';

interface ProductImagePlaceholderProps {
  name: string;
  className?: string;
}

const NAME_PARTICLES = new Set(['de', 'du', 'la', 'le', 'les', 'of', 'the', 'and', '&']);

function getProductInitials(name: string): string {
  const words = name
    .replace(/[^\p{L}\p{N}\s-]/gu, ' ')
    .split(/\s+/)
    .filter(Boolean)
    .filter((word) => !NAME_PARTICLES.has(word.toLowerCase()));

  if (words.length === 0) {
    return 'ME';
  }

  if (words.length === 1) {
    return words[0]?.slice(0, 2).toUpperCase() ?? 'ME';
  }

  return words
    .map((word) => word[0] ?? '')
    .join('')
    .toUpperCase()
    .slice(0, 4);
}

export function ProductImagePlaceholder({ name, className }: ProductImagePlaceholderProps) {
  const initials = getProductInitials(name);

  return (
    <div
      className={[styles.tile, className].filter(Boolean).join(' ')}
      data-length={Math.min(initials.length, 4)}
      aria-hidden="true"
    >
      <span className={styles.initials}>{initials}</span>
    </div>
  );
}
