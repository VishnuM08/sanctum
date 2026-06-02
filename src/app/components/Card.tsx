import { HTMLAttributes } from 'react';
import { clsx } from 'clsx';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  hover?: boolean;
}

export function Card({ className, children, hover = false, ...props }: CardProps) {
  return (
    <div
      className={clsx(
        'glass-card rounded-2xl p-6 border transition-all duration-300',
        hover && 'hover:shadow-[0_8px_30px_rgba(99,102,241,0.12)] dark:hover:shadow-[0_8px_30px_rgba(99,102,241,0.22)] hover:border-primary/40 hover:-translate-y-1 cursor-pointer',
        !hover && 'shadow-lg shadow-black/5 dark:shadow-black/20',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
