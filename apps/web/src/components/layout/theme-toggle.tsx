'use client';

import React from 'react';
import { Sun, Moon, Laptop } from 'lucide-react';
import { useThemeStore } from '../../store/theme';
import { cn } from '../../lib/utils';

export function ThemeToggle() {
  const { theme, setTheme } = useThemeStore();

  return (
    <div className="flex items-center gap-1 rounded-lg border border-border bg-muted/30 p-1.5">
      <button
        onClick={() => setTheme('light')}
        className={cn(
          'rounded p-1.5 text-muted-foreground hover:text-foreground transition-all duration-150',
          theme === 'light' && 'bg-card text-foreground shadow-sm',
        )}
        aria-label="Light mode"
      >
        <Sun className="h-4 w-4" />
      </button>
      <button
        onClick={() => setTheme('dark')}
        className={cn(
          'rounded p-1.5 text-muted-foreground hover:text-foreground transition-all duration-150',
          theme === 'dark' && 'bg-card text-foreground shadow-sm',
        )}
        aria-label="Dark mode"
      >
        <Moon className="h-4 w-4" />
      </button>
      <button
        onClick={() => setTheme('system')}
        className={cn(
          'rounded p-1.5 text-muted-foreground hover:text-foreground transition-all duration-150',
          theme === 'system' && 'bg-card text-foreground shadow-sm',
        )}
        aria-label="System mode"
      >
        <Laptop className="h-4 w-4" />
      </button>
    </div>
  );
}
