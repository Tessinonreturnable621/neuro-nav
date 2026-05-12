/* ============================================================
   BADGE — Small label / tag component
   ============================================================ */

import type { ReactNode } from 'react';

export type BadgeVariant = 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'info';

interface BadgeProps {
  variant?: BadgeVariant;
  children: ReactNode;
  className?: string;
}

const variantStyles: Record<BadgeVariant, string> = {
  default: 'bg-surface-overlay text-text-secondary border-border-subtle',
  primary: 'bg-accent-primary/15 text-accent-primary border-accent-primary/30',
  success: 'bg-accent-success/15 text-accent-success border-accent-success/30',
  warning: 'bg-accent-warning/15 text-accent-warning border-accent-warning/30',
  danger: 'bg-accent-danger/15 text-accent-danger border-accent-danger/30',
  info: 'bg-accent-primary/10 text-accent-secondary border-accent-secondary/30',
};

export function Badge({ variant = 'default', children, className = '' }: BadgeProps) {
  return (
    <span
      className={[
        'inline-flex items-center px-2 py-0.5',
        'text-[10px] font-medium leading-tight rounded-full',
        'border',
        variantStyles[variant],
        className,
      ].join(' ')}
    >
      {children}
    </span>
  );
}
