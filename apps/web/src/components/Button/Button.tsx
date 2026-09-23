import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { Link } from 'react-router';

import styles from './Button.module.css';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'light';
export type ButtonSize = 'sm' | 'md' | 'lg';

interface SharedProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  children: ReactNode;
}

type ButtonProps = SharedProps &
  Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children' | 'className'> & {
    className?: string;
  };

type ButtonLinkProps = SharedProps & {
  to: string;
  className?: string;
};

function buildClassName(
  variant: ButtonVariant,
  size: ButtonSize,
  fullWidth: boolean,
  className?: string,
): string {
  return [
    styles.button,
    styles[variant],
    styles[size],
    fullWidth ? styles.fullWidth : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');
}

export function Button({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  className,
  type = 'button',
  children,
  ...rest
}: ButtonProps) {
  return (
    <button type={type} className={buildClassName(variant, size, fullWidth, className)} {...rest}>
      {children}
    </button>
  );
}

export function ButtonLink({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  className,
  to,
  children,
}: ButtonLinkProps) {
  return (
    <Link to={to} className={buildClassName(variant, size, fullWidth, className)}>
      {children}
    </Link>
  );
}
