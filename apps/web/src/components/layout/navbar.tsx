'use client';

import React, { useState } from 'react';
import {
  Search,
  Bell,
  Menu,
  LogOut,
  User as UserIcon,
  Sliders,
} from 'lucide-react';
import { Breadcrumbs } from './breadcrumbs';
import { ThemeToggle } from './theme-toggle';
import { WorkspaceSelector } from './workspace-selector';
import { useAuth } from '../../providers/auth-provider';
import { useSidebarStore } from '../../store/sidebar';
import { Button } from '../ui/button';

export function Navbar() {
  const { user, logout } = useAuth();
  const { toggle } = useSidebarStore();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  return (
    <header className="sticky top-0 z-40 flex h-16 w-full items-center justify-between border-b border-border bg-background/85 px-6 backdrop-blur-md">
      <div className="flex items-center gap-4">
        {/* Toggle mobile sidebar */}
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={toggle}
          aria-label="Toggle navigation menu"
        >
          <Menu className="h-5 w-5" />
        </Button>
        <div className="hidden lg:block">
          <Breadcrumbs />
        </div>
        <div className="hidden sm:block">
          <WorkspaceSelector />
        </div>
      </div>

      <div className="flex items-center gap-4">
        {/* Search Placeholder */}
        <div className="relative hidden max-w-xs md:block">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/60" />
          <input
            type="text"
            placeholder="Search (Ctrl + K)..."
            className="h-9 w-60 rounded-lg border border-border bg-muted/20 pl-9 pr-3 text-xs placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/40 focus:border-primary/40"
            disabled
          />
        </div>

        <ThemeToggle />

        {/* Notifications Icon & Panel Placeholder */}
        <div className="relative">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative"
            aria-label="View notifications"
          >
            <Bell className="h-5 w-5 text-muted-foreground hover:text-foreground" />
            <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-primary" />
          </Button>

          {showNotifications && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setShowNotifications(false)}
              />
              <div className="absolute right-0 mt-2 z-50 w-80 rounded-lg border border-border bg-card p-4 shadow-lg shadow-black/20 animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="flex items-center justify-between border-b border-border pb-2 mb-2">
                  <h4 className="text-sm font-bold text-foreground">
                    Notifications
                  </h4>
                  <span className="text-xs text-primary font-semibold">
                    Mark read
                  </span>
                </div>
                <div className="py-4 text-center text-xs text-muted-foreground font-semibold">
                  No new notification events.
                </div>
              </div>
            </>
          )}
        </div>

        {/* User Profile dropdown menu */}
        <div className="relative">
          <button
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="flex items-center gap-2 rounded-full p-1 hover:bg-secondary focus:outline-none"
            aria-label="User account menu"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
              {user?.email?.charAt(0).toUpperCase() || 'U'}
            </div>
          </button>

          {showProfileMenu && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setShowProfileMenu(false)}
              />
              <div className="absolute right-0 mt-2 z-50 w-56 rounded-lg border border-border bg-card p-1 shadow-lg shadow-black/20 animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="px-3 py-2 border-b border-border mb-1">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Account
                  </p>
                  <p className="text-sm font-bold text-foreground truncate">
                    {user?.email}
                  </p>
                  <p className="text-[10px] font-bold text-primary tracking-wide uppercase mt-0.5">
                    {user?.role}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  className="w-full justify-start text-left text-xs gap-2"
                  onClick={() => setShowProfileMenu(false)}
                >
                  <UserIcon className="h-4 w-4" />
                  Profile Details
                </Button>
                <Button
                  variant="ghost"
                  className="w-full justify-start text-left text-xs gap-2"
                  onClick={() => setShowProfileMenu(false)}
                >
                  <Sliders className="h-4 w-4" />
                  Settings
                </Button>
                <div className="border-t border-border my-1" />
                <Button
                  variant="ghost"
                  className="w-full justify-start text-left text-xs gap-2 text-destructive hover:bg-destructive/10 hover:text-destructive"
                  onClick={logout}
                >
                  <LogOut className="h-4 w-4" />
                  Log Out
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
