/* ============================================================
   BUTTON — Base interactive element
   ============================================================ */

import { type ButtonHTMLAttributes, type ReactNode } from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: ReactNode;
  loading?: boolean;
  children: ReactNode;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary: [
    'bg-accent-primary text-white',
    'hover:bg-accent-primary-hover hover:shadow-glow-primary',
    'active:scale-[0.97]',
  ].join(' '),
  secondary: [
    'bg-surface-overlay text-text-primary border border-border-default',
    'hover:bg-surface-hover hover:border-border-strong',
    'active:scale-[0.97]',
  ].join(' '),
  ghost: [
    'bg-transparent text-text-secondary',
    'hover:bg-surface-overlay hover:text-text-primary',
    'active:scale-[0.97]',
  ].join(' '),
  danger: [
    'bg-accent-danger/15 text-accent-danger border border-accent-danger/30',
    'hover:bg-accent-danger/25 hover:border-accent-danger/50',
    'active:scale-[0.97]',
  ].join(' '),
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: 'px-2.5 py-1 text-xs rounded-md gap-1',
  md: 'px-3.5 py-1.5 text-sm rounded-lg gap-1.5',
  lg: 'px-5 py-2.5 text-sm rounded-lg gap-2',
};

export function Button({
  variant = 'secondary',
  size = 'md',
  icon,
  loading,
  children,
  className = '',
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      className={[
        'inline-flex items-center justify-center font-medium',
        'transition-all duration-(--duration-normal) ease-out-expo',
        'cursor-pointer select-none whitespace-nowrap',
        'disabled:opacity-40 disabled:cursor-not-allowed disabled:pointer-events-none',
        variantStyles[variant],
        sizeStyles[size],
        className,
      ].join(' ')}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <svg
          className="animate-spin h-3.5 w-3.5"
          viewBox="0 0 24 24"
          fill="none"
        >
          <circle
            className="opacity-25"
            cx="12" cy="12" r="10"
            stroke="currentColor"
            strokeWidth="3"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
          />
        </svg>
      ) : icon ? (
        <span className="shrink-0">{icon}</span>
      ) : null}
      {children}
    </button>
  );
}
