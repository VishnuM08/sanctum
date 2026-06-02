import { HTMLAttributes } from 'react';
import { clsx } from 'clsx';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  hover?: boolean;
}

export function Card({ className, children, hover = false, ...props }: CardProps) {
  return (
    <div
      className={clsx(
        'bg-card border border-border rounded-2xl p-5 transition-all',
        hover && 'hover:shadow-xl hover:shadow-primary/5 hover:border-primary/20 hover:-translate-y-0.5 cursor-pointer',
        !hover && 'shadow-md shadow-black/5',
        className
      )}
      style={{
        boxShadow: hover ? undefined : '0 4px 6px -1px rgb(0 0 0 / 0.05), 0 2px 4px -2px rgb(0 0 0 / 0.05)'
      }}
      {...props}
    >
      {children}
    </div>
  );
}
