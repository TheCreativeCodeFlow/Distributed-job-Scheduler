'use client';

import React, { useEffect } from 'react';
import { Sidebar } from './sidebar';
import { Navbar } from './navbar';
import { CommandPalette } from './command-palette';
import { useSidebarStore } from '../../store/sidebar';
import { usePathname } from 'next/navigation';
import { useMediaQuery } from '../../hooks/use-media-query';
import { cn } from '../../lib/utils';

export function LayoutShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { isOpen, setOpen } = useSidebarStore();
  const isMobile = useMediaQuery('(max-width: 768px)');

  // Auto-collapse sidebar on route transitions or viewport sizing adjustments
  useEffect(() => {
    if (isMobile) {
      setOpen(false);
    } else {
      setOpen(true);
    }
  }, [pathname, isMobile, setOpen]);

  // Auth/public pages don't render layout shell
  const isPublicPage = ['/login', '/session-expired', '/unauthorized'].some(
    (route) => pathname.startsWith(route),
  );

  if (isPublicPage) {
    return <main className="flex-1">{children}</main>;
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background">
      {/* Sidebar navigation panel */}
      <div
        className={cn(
          'fixed inset-y-0 left-0 z-50 md:static md:flex',
          isOpen ? 'flex' : 'hidden md:flex',
        )}
      >
        <Sidebar />
      </div>

      {/* Mobile backdrop overlay */}
      {isOpen && isMobile && (
        <div
          onClick={() => setOpen(false)}
          className="fixed inset-0 z-45 bg-black/60 backdrop-blur-xs md:hidden"
        />
      )}

      {/* Content layout wrapper */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <Navbar />
        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          <div className="mx-auto max-w-7xl space-y-6">{children}</div>
        </main>
      </div>

      {/* Global command search palette */}
      <CommandPalette />
    </div>
  );
}
