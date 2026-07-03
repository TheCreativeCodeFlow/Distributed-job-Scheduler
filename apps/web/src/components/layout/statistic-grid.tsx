import React from 'react';
import { cn } from '../../lib/utils';

export interface StatisticGridProps {
  children: React.ReactNode;
  className?: string;
}

export function StatisticGrid({ children, className }: StatisticGridProps) {
  return (
    <div
      className={cn(
        'grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
        className,
      )}
    >
      {children}
    </div>
  );
}
export default StatisticGrid;
