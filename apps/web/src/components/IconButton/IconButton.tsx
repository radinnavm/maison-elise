import type { ButtonHTMLAttributes, ReactNode, Ref } from 'react';
import { Link } from 'react-router';

import styles from './IconButton.module.css';

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  label: string;
  badge?: number;
  ref?: Ref<HTMLButtonElement>;
  children: ReactNode;
}

export function IconButton({
  label,
  badge,
  className,
  type = 'button',
  ref,
  children,
  ...rest
}: IconButtonProps) {
  const classes = [styles.button, className].filter(Boolean).join(' ');

  return (
    <button ref={ref} type={type} className={classes} aria-label={label} {...rest}>
      {children}
      {badge !== undefined && badge > 0 ? (
        <span className={styles.badge} aria-hidden="true">
          {badge}
        </span>
      ) : null}
    </button>
  );
}

interface IconLinkProps {
  to: string;
  label: string;
  badge?: number;
  className?: string;
  children: ReactNode;
}

export function IconLink({ to, label, badge, className, children }: IconLinkProps) {
  const classes = [styles.button, className].filter(Boolean).join(' ');

  return (
    <Link to={to} className={classes} aria-label={label}>
      {children}
      {badge !== undefined && badge > 0 ? (
        <span className={styles.badge} aria-hidden="true">
          {badge}
        </span>
      ) : null}
    </Link>
  );
}
