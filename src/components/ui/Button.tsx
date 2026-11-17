import type { ButtonHTMLAttributes, ReactNode } from 'react';

import { cx } from '@/lib/cx';

import styles from './Button.module.css';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'clay' | 'primary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  icon?: ReactNode;
  block?: boolean;
}

export function Button({
  variant = 'clay',
  size = 'md',
  icon,
  block = false,
  className,
  children,
  type = 'button',
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cx(
        styles.button,
        styles[variant],
        size !== 'md' && styles[size],
        !children && styles.iconOnly,
        block && styles.block,
        className,
      )}
      {...rest}
    >
      {icon}
      {children}
    </button>
  );
}
