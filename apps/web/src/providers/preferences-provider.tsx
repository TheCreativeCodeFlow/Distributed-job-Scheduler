'use client';

import React, { useEffect } from 'react';
import { usePreferencesStore } from '../store/preferences';
import { globalPollingController } from '../lib/live/PollingController';

/**
 * PreferencesProvider
 *
 * Reads the persisted UserPreferences from Zustand and applies CSS
 * side-effects to `document.documentElement` reactively.  Must be mounted
 * inside the Zustand hydration boundary but before any component that
 * consumes the CSS classes/variables it applies.
 *
 * Applied effects:
 *  - `.reduce-motion`   — disables animations (reducedMotion pref)
 *  - `.high-contrast`   — boosts foreground/border contrast ratios
 *  - `.compact-mode`    — tightens spacing across all views
 *  - `.keyboard-nav`    — prominent focus rings + enhanced shortcuts
 *  - `--font-scale`     — CSS custom property for base font scaling
 *  - globalPollingController.setInterval() — syncs live polling cadence
 */
export function PreferencesProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const preferences = usePreferencesStore((s) => s.preferences);

  // Sync auto-refresh + interval → running PollingController
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (preferences.autoRefresh) {
      globalPollingController.setInterval(preferences.pollingInterval);
    } else {
      globalPollingController.setInterval('off');
    }
  }, [preferences.autoRefresh, preferences.pollingInterval]);

  // Apply reduced-motion class
  useEffect(() => {
    if (typeof document === 'undefined') return;
    document.documentElement.classList.toggle(
      'reduce-motion',
      preferences.reducedMotion,
    );
  }, [preferences.reducedMotion]);

  // Apply high-contrast class
  useEffect(() => {
    if (typeof document === 'undefined') return;
    document.documentElement.classList.toggle(
      'high-contrast',
      preferences.highContrast,
    );
  }, [preferences.highContrast]);

  // Apply compact-mode class
  useEffect(() => {
    if (typeof document === 'undefined') return;
    document.documentElement.classList.toggle(
      'compact-mode',
      preferences.compactMode,
    );
  }, [preferences.compactMode]);

  // Apply keyboard-nav class
  useEffect(() => {
    if (typeof document === 'undefined') return;
    document.documentElement.classList.toggle(
      'keyboard-nav',
      preferences.keyboardNavEnhancements,
    );
  }, [preferences.keyboardNavEnhancements]);

  // Apply --font-scale CSS custom property
  useEffect(() => {
    if (typeof document === 'undefined') return;
    const fontScaleMap: Record<string, string> = {
      sm: '0.875',
      md: '1',
      lg: '1.125',
      xl: '1.25',
    };
    document.documentElement.style.setProperty(
      '--font-scale',
      fontScaleMap[preferences.fontScale] ?? '1',
    );
  }, [preferences.fontScale]);

  return <>{children}</>;
}
