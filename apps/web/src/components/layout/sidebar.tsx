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
  Building2,
  FolderGit,
  ListTodo,
  Terminal,
  Settings2,
  BarChart3,
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

interface SidebarGroup {
  groupName: string;
  items: SidebarItem[];
}

const navGroups: SidebarGroup[] = [
  {
    groupName: 'Core Console',
    items: [
      { name: 'Overview', href: '/dashboard', icon: LayoutDashboard },
      {
        name: 'Organizations',
        href: '/dashboard/organizations',
        icon: Building2,
        allowedRoles: ['SYSTEM_ADMIN', 'ORG_OWNER', 'ORG_ADMIN'],
      },
      {
        name: 'Projects',
        href: '/dashboard/projects',
        icon: FolderGit,
        allowedRoles: ['SYSTEM_ADMIN', 'ORG_OWNER', 'ORG_ADMIN'],
      },
    ],
  },
  {
    groupName: 'Operations',
    items: [
      { name: 'Queues', href: '/dashboard/queues', icon: Layers },
      { name: 'Workers', href: '/dashboard/workers', icon: Cpu },
      { name: 'Jobs', href: '/dashboard/jobs', icon: ListTodo },
      { name: 'Executions', href: '/dashboard/executions', icon: Terminal },
    ],
  },
  {
    groupName: 'Execution Engine',
    items: [
      {
        name: 'Scheduled Jobs',
        href: '/dashboard/scheduled',
        icon: CalendarDays,
      },
      { name: 'Retry Engine', href: '/dashboard/retries', icon: RefreshCw },
      { name: 'Dead Letter Queue', href: '/dashboard/dlq', icon: Skull },
      {
        name: 'Scheduler Engine',
        href: '/dashboard/scheduler',
        icon: Settings2,
      },
    ],
  },
  {
    groupName: 'Telemetry & Admin',
    items: [
      {
        name: 'Metrics Telemetry',
        href: '/dashboard/metrics',
        icon: BarChart3,
      },
      { name: 'Activity Timeline', href: '/dashboard/timeline', icon: History },
      {
        name: 'Settings',
        href: '/dashboard/settings',
        icon: Settings,
        allowedRoles: ['SYSTEM_ADMIN', 'ORG_OWNER', 'ORG_ADMIN'],
      },
    ],
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
      <div className="flex h-16 items-center justify-between px-4 border-b border-b-border/80">
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
      <nav className="flex-1 space-y-4 p-3 overflow-y-auto">
        {navGroups.map((group) => {
          // Filter out items not allowed for role
          const visibleItems = group.items.filter(
            (item) => !item.allowedRoles || hasRole(item.allowedRoles),
          );

          if (visibleItems.length === 0) return null;

          return (
            <div key={group.groupName} className="space-y-1">
              {isOpen && (
                <p className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest px-3 py-1">
                  {group.groupName}
                </p>
              )}
              <div className="space-y-0.5">
                {visibleItems.map((item) => {
                  const isActive =
                    pathname === item.href ||
                    (item.href !== '/dashboard' &&
                      pathname.startsWith(item.href));
                  const Icon = item.icon;

                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={cn(
                        'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                        isActive
                          ? 'bg-primary text-primary-foreground font-semibold shadow-sm'
                          : 'text-muted-foreground hover:bg-secondary hover:text-foreground',
                      )}
                    >
                      <Icon className="h-4 w-4 flex-shrink-0" />
                      {isOpen && <span className="truncate">{item.name}</span>}
                    </Link>
                  );
                })}
              </div>
            </div>
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
