import React from 'react';
import { cn } from '../../lib/utils';

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  error?: string;
  options: Array<{ value: string; label: string }>;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, error, options, children, ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1.5 w-full">
        <select
          ref={ref}
          className={cn(
            'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-shadow appearance-none cursor-pointer',
            error && 'border-destructive focus-visible:ring-destructive',
            className,
          )}
          {...props}
        >
          {options.map((opt) => (
            <option
              key={opt.value}
              value={opt.value}
              className="bg-card text-foreground"
            >
              {opt.label}
            </option>
          ))}
        </select>
        {error && (
          <span className="text-xs font-semibold text-destructive">
            {error}
          </span>
        )}
      </div>
    );
  },
);

Select.displayName = 'Select';
