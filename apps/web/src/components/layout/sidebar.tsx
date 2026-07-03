'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Layers,
  Cpu,
  Skull,
  CalendarDays,
  RefreshCw,
  History,
  Settings,
  ChevronLeft,
  ChevronRight,
  Database,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { useSidebarStore } from '../../store/sidebar';
import { useAuth } from '../../providers/auth-provider';
import { Button } from '../ui/button';
import { UserRole } from '../../types/auth';

interface SidebarItem {
  name: string;
  href: string;
  icon: React.ComponentType<any>;
  allowedRoles?: UserRole[];
}

const navItems: SidebarItem[] = [
  {
    name: 'Overview',
    href: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    name: 'Queues',
    href: '/dashboard/queues',
    icon: Layers,
    allowedRoles: [
      'SYSTEM_ADMIN',
      'ORG_OWNER',
      'ORG_ADMIN',
      'DEVELOPER',
      'READ_ONLY',
    ],
  },
  {
    name: 'Workers',
    href: '/dashboard/workers',
    icon: Cpu,
    allowedRoles: [
      'SYSTEM_ADMIN',
      'ORG_OWNER',
      'ORG_ADMIN',
      'DEVELOPER',
      'READ_ONLY',
    ],
  },
  {
    name: 'Scheduled Jobs',
    href: '/dashboard/scheduled',
    icon: CalendarDays,
    allowedRoles: [
      'SYSTEM_ADMIN',
      'ORG_OWNER',
      'ORG_ADMIN',
      'DEVELOPER',
      'READ_ONLY',
    ],
  },
  {
    name: 'Retries log',
    href: '/dashboard/retries',
    icon: RefreshCw,
    allowedRoles: [
      'SYSTEM_ADMIN',
      'ORG_OWNER',
      'ORG_ADMIN',
      'DEVELOPER',
      'READ_ONLY',
    ],
  },
  {
    name: 'Dead Letter Queue',
    href: '/dashboard/dlq',
    icon: Skull,
    allowedRoles: [
      'SYSTEM_ADMIN',
      'ORG_OWNER',
      'ORG_ADMIN',
      'DEVELOPER',
      'READ_ONLY',
    ],
  },
  {
    name: 'Audit Logs',
    href: '/dashboard/logs',
    icon: History,
    allowedRoles: ['SYSTEM_ADMIN', 'ORG_OWNER', 'ORG_ADMIN'],
  },
  {
    name: 'Settings',
    href: '/dashboard/settings',
    icon: Settings,
    allowedRoles: ['SYSTEM_ADMIN', 'ORG_OWNER', 'ORG_ADMIN'],
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const { hasRole } = useAuth();
  const { isOpen, toggle } = useSidebarStore();

  return (
    <aside
      className={cn(
        'relative z-50 flex flex-col border-r border-border bg-card text-card-foreground transition-all duration-300 ease-in-out',
        isOpen ? 'w-64' : 'w-16',
      )}
    >
      {/* Brand logo header */}
      <div className="flex h-16 items-center justify-between px-4 border-b border-border/80">
        <Link
          href="/dashboard"
          className="flex items-center gap-2 font-bold tracking-tight"
        >
          <Database className="h-6 w-6 text-primary flex-shrink-0" />
          {isOpen && (
            <span className="text-sm font-extrabold text-foreground">
              TASKFLOW
            </span>
          )}
        </Link>
        {isOpen && (
          <Button
            variant="ghost"
            size="icon"
            className="hidden md:flex h-7 w-7"
            onClick={toggle}
            aria-label="Collapse sidebar"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Main navigation lists */}
      <nav className="flex-1 space-y-1.5 p-3 overflow-y-auto">
        {navItems.map((item) => {
          if (item.allowedRoles && !hasRole(item.allowedRoles)) {
            return null;
          }

          const isActive =
            pathname === item.href ||
            (item.href !== '/dashboard' && pathname.startsWith(item.href));
          const Icon = item.icon;

          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground font-semibold shadow-sm'
                  : 'text-muted-foreground hover:bg-secondary hover:text-foreground',
              )}
            >
              <Icon className="h-4.5 w-4.5 flex-shrink-0" />
              {isOpen && <span className="truncate">{item.name}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Footer collapsible toggle button */}
      {!isOpen && (
        <div className="hidden md:flex h-12 items-center justify-center border-t border-border/50">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={toggle}
            aria-label="Expand sidebar"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </aside>
  );
}
