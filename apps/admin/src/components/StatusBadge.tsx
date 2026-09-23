export type BadgeTone = 'neutral' | 'positive' | 'warning' | 'negative';

interface StatusBadgeProps {
  label: string;
  tone?: BadgeTone;
}

export function StatusBadge({ label, tone = 'neutral' }: StatusBadgeProps) {
  const classes = ['badge', tone === 'neutral' ? '' : `badge-${tone}`].filter(Boolean).join(' ');

  return <span className={classes}>{label}</span>;
}
