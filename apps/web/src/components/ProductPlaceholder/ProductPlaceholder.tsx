import styles from './ProductPlaceholder.module.css';

interface ProductPlaceholderProps {
  name: string;
  className?: string;
}

const NAME_PARTICLES = new Set(['de', 'du', 'la', 'le', 'les', 'of', 'the', 'and', '&']);

function getProductInitials(name: string): string {
  const words = name
    .replace(/[^\p{L}\p{N}\s-]/gu, ' ')
    .split(/[\s-]+/)
    .filter(Boolean)
    .filter((word) => !NAME_PARTICLES.has(word.toLowerCase()));

  if (words.length === 0) {
    return 'ME';
  }

  if (words.length === 1) {
    return words[0]?.slice(0, 2).toUpperCase() ?? 'ME';
  }

  const first = words[0]?.[0] ?? '';
  const last = words[words.length - 1]?.[0] ?? '';

  return `${first}${last}`.toUpperCase();
}

export function ProductPlaceholder({ name, className }: ProductPlaceholderProps) {
  const initials = getProductInitials(name);

  return (
    <div
      className={[styles.tile, className].filter(Boolean).join(' ')}
      aria-hidden="true"
      data-placeholder={initials}
    >
      <svg
        className={styles.waves}
        viewBox="0 0 400 500"
        preserveAspectRatio="none"
        aria-hidden="true"
        focusable="false"
      >
        <path d="M-40 108 C 62 58, 148 168, 252 112 S 390 66, 456 128" />
        <path d="M-40 158 C 62 108, 148 218, 252 162 S 390 116, 456 178" />
        <path d="M-40 356 C 70 306, 156 416, 260 360 S 394 314, 456 376" />
        <path d="M-40 406 C 70 356, 156 466, 260 410 S 394 364, 456 426" />
      </svg>

      <span className={styles.initials}>{initials}</span>
      <span className={styles.brand}>Maison Élise</span>
    </div>
  );
}
