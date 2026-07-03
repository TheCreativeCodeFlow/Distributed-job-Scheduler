'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { ChevronRight, Home } from 'lucide-react';

export function Breadcrumbs() {
  const pathname = usePathname();
  const paths = pathname.split('/').filter(Boolean);

  if (paths.length === 0) return null;

  return (
    <nav
      className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground"
      aria-label="Breadcrumb"
    >
      <Link
        href="/dashboard"
        className="flex items-center gap-1 text-muted-foreground/80 hover:text-foreground transition-colors"
      >
        <Home className="h-3.5 w-3.5" />
      </Link>
      {paths.map((segment, idx) => {
        const url = `/${paths.slice(0, idx + 1).join('/')}`;
        const isLast = idx === paths.length - 1;
        const label =
          segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, ' ');

        return (
          <React.Fragment key={url}>
            <ChevronRight className="h-3 w-3 text-muted-foreground/45 flex-shrink-0" />
            {isLast ? (
              <span
                className="text-foreground truncate select-none"
                aria-current="page"
              >
                {label}
              </span>
            ) : (
              <Link
                href={url}
                className="hover:text-foreground truncate transition-colors"
              >
                {label}
              </Link>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
}
