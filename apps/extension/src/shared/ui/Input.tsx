/* ============================================================
   INPUT — Text input with label and icon support
   ============================================================ */

import { type InputHTMLAttributes, type ReactNode, forwardRef } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  icon?: ReactNode;
  label?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ icon, label, className = '', ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1">
        {label && (
          <label className="text-xs font-medium text-text-secondary pl-0.5">
            {label}
          </label>
        )}
        <div className="relative">
          {icon && (
            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-tertiary pointer-events-none">
              {icon}
            </span>
          )}
          <input
            ref={ref}
            className={[
              'w-full bg-surface-overlay border border-border-subtle rounded-lg',
              'text-sm text-text-primary placeholder:text-text-tertiary',
              'px-3 py-2',
              'outline-none',
              'transition-all duration-(--duration-normal) ease-out-expo',
              'focus:border-accent-primary focus:ring-1 focus:ring-accent-primary/30',
              'hover:border-border-default',
              icon ? 'pl-8' : '',
              className,
            ].join(' ')}
            {...props}
          />
        </div>
      </div>
    );
  }
);

Input.displayName = 'Input';
