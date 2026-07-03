import React from 'react';
import { cn } from '../../lib/utils';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?:
    | 'default'
    | 'secondary'
    | 'outline'
    | 'success'
    | 'warning'
    | 'destructive'
    | 'info';
}

export function Badge({
  className,
  variant = 'default',
  ...props
}: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-md px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 select-none',
        {
          'bg-primary text-primary-foreground hover:bg-primary/80':
            variant === 'default',
          'bg-secondary text-secondary-foreground hover:bg-secondary/85':
            variant === 'secondary',
          'border border-border text-foreground': variant === 'outline',
          'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20':
            variant === 'success',
          'bg-amber-500/10 text-amber-400 border border-amber-500/20':
            variant === 'warning',
          'bg-destructive/10 text-destructive border border-destructive/20':
            variant === 'destructive',
          'bg-blue-500/10 text-blue-400 border border-blue-500/20':
            variant === 'info',
        },
        className,
      )}
      {...props}
    />
  );
}
