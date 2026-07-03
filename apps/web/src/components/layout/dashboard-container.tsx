import React from 'react';
import { cn } from '../../lib/utils';

export interface DashboardContainerProps {
  children: React.ReactNode;
  className?: string;
}

export function DashboardContainer({
  children,
  className,
}: DashboardContainerProps) {
  return (
    <>
      {/* WCAG compliant Skip-to-content Link */}
      <a
        href="#main-dashboard-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:rounded-md focus:bg-primary focus:text-primary-foreground focus:px-4 focus:py-2 focus:font-semibold focus:shadow-lg focus:outline-none"
      >
        Skip to main content
      </a>

      <div
        id="main-dashboard-content"
        className={cn(
          'w-full max-w-7xl mx-auto space-y-6 focus:outline-none',
          className,
        )}
        tabIndex={-1}
      >
        {children}
      </div>
    </>
  );
}
export default DashboardContainer;
