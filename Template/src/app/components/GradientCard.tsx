import { HTMLAttributes } from 'react';
import { clsx } from 'clsx';

interface GradientCardProps extends HTMLAttributes<HTMLDivElement> {
  gradient?: 'primary' | 'secondary' | 'success';
}

export function GradientCard({ gradient = 'primary', className, children, ...props }: GradientCardProps) {
  return (
    <div
      className={clsx(
        'relative rounded-2xl p-6 overflow-hidden',
        className
      )}
      {...props}
    >
      <div className={clsx(
        'absolute inset-0 opacity-10',
        {
          'bg-gradient-to-br from-primary via-purple-500 to-pink-500': gradient === 'primary',
          'bg-gradient-to-br from-pink-500 via-orange-500 to-yellow-500': gradient === 'secondary',
          'bg-gradient-to-br from-green-500 via-teal-500 to-blue-500': gradient === 'success',
        }
      )} />
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
}
