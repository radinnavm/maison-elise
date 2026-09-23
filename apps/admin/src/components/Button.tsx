import type { ButtonHTMLAttributes, ReactNode } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary';
  children: ReactNode;
}

export function Button({
  variant = 'primary',
  className,
  type = 'button',
  children,
  ...rest
}: ButtonProps) {
  const classes = ['btn', `btn-${variant}`, className].filter(Boolean).join(' ');

  return (
    <button type={type} className={classes} {...rest}>
      {children}
    </button>
  );
}
