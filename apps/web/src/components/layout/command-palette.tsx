'use client';

import React, { useEffect, useState, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Search,
  Sparkles,
  Terminal,
  Sliders,
  Layers,
  Cpu,
  Skull,
} from 'lucide-react';
import { useNotificationStore } from '../../store/notifications';
import { useRouter } from 'next/navigation';

export function CommandPalette() {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const router = useRouter();
  const addToast = useNotificationStore((state) => state.addToast);
  const inputRef = useRef<HTMLInputElement>(null);

  // Listen to Ctrl/Cmd + K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Autofocus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    } else {
      setSearch('');
    }
  }, [isOpen]);

  const handleShortcutClick = (path: string, label: string) => {
    router.push(path);
    setIsOpen(false);
    addToast({
      type: 'info',
      message: `Navigated to ${label}`,
      duration: 3000,
    });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 sm:pt-28">
          {/* Backdrop blur */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
          />

          {/* Palette Dialog */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -10 }}
            transition={{ duration: 0.15 }}
            className="relative z-10 w-full max-w-xl overflow-hidden rounded-xl border border-border bg-card shadow-2xl shadow-black/40"
          >
            {/* Search Header Input */}
            <div className="relative border-b border-border p-4">
              <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground/60" />
              <input
                ref={inputRef}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                type="text"
                placeholder="Search resources, commands, or documentation..."
                className="w-full bg-transparent pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
              />
            </div>

            {/* Content areas */}
            <div className="max-h-80 overflow-y-auto p-4 space-y-4 select-none">
              {/* Navigation Shortcuts */}
              <div className="space-y-1.5">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-2">
                  Navigation Shortcuts
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                  <button
                    onClick={() =>
                      handleShortcutClick('/dashboard/queues', 'Queues')
                    }
                    className="flex items-center gap-3 rounded-lg p-2.5 hover:bg-secondary text-left text-xs font-semibold text-foreground transition-colors focus:outline-none"
                  >
                    <Layers className="h-4 w-4 text-primary" />
                    Queues Console
                  </button>
                  <button
                    onClick={() =>
                      handleShortcutClick('/dashboard/workers', 'Workers')
                    }
                    className="flex items-center gap-3 rounded-lg p-2.5 hover:bg-secondary text-left text-xs font-semibold text-foreground transition-colors focus:outline-none"
                  >
                    <Cpu className="h-4 w-4 text-violet-400" />
                    Workers Monitor
                  </button>
                  <button
                    onClick={() =>
                      handleShortcutClick('/dashboard/dlq', 'Dead Letter Queue')
                    }
                    className="flex items-center gap-3 rounded-lg p-2.5 hover:bg-secondary text-left text-xs font-semibold text-foreground transition-colors focus:outline-none"
                  >
                    <Skull className="h-4 w-4 text-rose-400" />
                    Dead Letter Queue
                  </button>
                  <button
                    onClick={() =>
                      handleShortcutClick('/dashboard/settings', 'Settings')
                    }
                    className="flex items-center gap-3 rounded-lg p-2.5 hover:bg-secondary text-left text-xs font-semibold text-foreground transition-colors focus:outline-none"
                  >
                    <Sliders className="h-4 w-4 text-emerald-400" />
                    System Settings
                  </button>
                </div>
              </div>

              {/* Recent queries */}
              <div className="space-y-2 border-t border-border/40 pt-3">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-2">
                  Recent Searches
                </p>
                <div className="flex flex-col gap-1 px-2 text-xs font-medium text-muted-foreground/80">
                  <div className="flex items-center gap-2 hover:text-foreground cursor-pointer">
                    <Terminal className="h-3.5 w-3.5" />
                    <span>query: claim_failed_jobs_recovery</span>
                  </div>
                  <div className="flex items-center gap-2 hover:text-foreground cursor-pointer mt-1">
                    <Sparkles className="h-3.5 w-3.5" />
                    <span>metrics: queue_depth_growth_24h</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer key map guide */}
            <div className="flex items-center justify-between border-t border-border bg-muted/20 px-4 py-2.5 text-[10px] text-muted-foreground font-semibold">
              <div className="flex gap-3">
                <span>↑↓ to navigate</span>
                <span>↵ to select</span>
              </div>
              <span>esc to close</span>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
export default CommandPalette;
