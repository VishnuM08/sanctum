import { HTMLAttributes } from 'react';
import { clsx } from 'clsx';

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'danger';
}

export function Badge({ variant = 'default', className, children, ...props }: BadgeProps) {
  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium',
        {
          'bg-secondary text-secondary-foreground': variant === 'default',
          'bg-primary/10 text-primary': variant === 'primary',
          'bg-green-500/10 text-green-600 dark:text-green-400': variant === 'success',
          'bg-orange-500/10 text-orange-600 dark:text-orange-400': variant === 'warning',
          'bg-destructive/10 text-destructive': variant === 'danger',
        },
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}
