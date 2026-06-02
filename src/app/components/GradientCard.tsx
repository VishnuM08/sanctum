import { HTMLAttributes } from 'react';
import { clsx } from 'clsx';

interface GradientCardProps extends HTMLAttributes<HTMLDivElement> {
  gradient?: 'primary' | 'secondary' | 'success';
}

export function GradientCard({ gradient = 'primary', className, children, ...props }: GradientCardProps) {
  return (
    <div
      className={clsx(
        'relative rounded-[20px] p-6 overflow-hidden border shadow-xl shadow-black/5',
        {
          'border-primary/20 bg-primary/[0.02] dark:bg-primary/[0.04]': gradient === 'primary',
          'border-pink-500/20 bg-pink-500/[0.02] dark:bg-pink-500/[0.04]': gradient === 'secondary',
          'border-green-500/20 bg-green-500/[0.02] dark:bg-green-500/[0.04]': gradient === 'success',
        },
        className
      )}
      {...props}
    >
      <div className={clsx(
        'absolute inset-0 opacity-[0.12] dark:opacity-[0.18] transition-opacity duration-300',
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
