import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { PollingInterval } from '../lib/live/PollingController';

// ─── Type Definitions ────────────────────────────────────────────────────────

export type LandingPage =
  | '/dashboard'
  | '/dashboard/jobs'
  | '/dashboard/workers'
  | '/dashboard/queues'
  | '/dashboard/metrics'
  | '/dashboard/activity';

export type DateFormat =
  'relative' | 'absolute-short' | 'absolute-long' | 'iso';
export type NumberFormat = 'compact' | 'full';
export type CardDensity = 'compact' | 'comfortable' | 'spacious';
export type FontScale = 'sm' | 'md' | 'lg' | 'xl';
export type LiveUpdateMode = 'polling' | 'auto' | 'manual';
export type DefaultPageSize = 10 | 25 | 50 | 100;
export type DefaultSorting = 'createdAt' | 'updatedAt' | 'status';

export interface UserPreferences {
  // ── General ────────────────────────────────────────────────────────────────
  defaultLandingPage: LandingPage;
  timezone: string;
  dateFormat: DateFormat;
  numberFormat: NumberFormat;

  // ── Appearance ─────────────────────────────────────────────────────────────
  compactMode: boolean;
  cardDensity: CardDensity;
  sidebarDefaultOpen: boolean;

  // ── Live Updates ───────────────────────────────────────────────────────────
  autoRefresh: boolean;
  pollingInterval: PollingInterval;
  pauseWhenHidden: boolean;
  relativeTimeUpdateFrequency: 1000 | 5000 | 30000;
  liveUpdateMode: LiveUpdateMode;

  // ── Notifications ──────────────────────────────────────────────────────────
  successNotifications: boolean;
  errorNotifications: boolean;
  warningNotifications: boolean;
  schedulerNotifications: boolean;
  retryNotifications: boolean;
  dlqNotifications: boolean;

  // ── Dashboard ──────────────────────────────────────────────────────────────
  defaultPageSize: DefaultPageSize;
  defaultSorting: DefaultSorting;
  persistWorkspace: boolean;

  // ── Accessibility ──────────────────────────────────────────────────────────
  reducedMotion: boolean;
  highContrast: boolean;
  fontScale: FontScale;
  keyboardNavEnhancements: boolean;

  // ── Developer / Legacy ─────────────────────────────────────────────────────
  developerMode: boolean;
  compactTableMode: boolean;
  refreshIntervalMs: number;
}

// ─── Section Defaults ────────────────────────────────────────────────────────

export const DEFAULT_PREFERENCE_SECTIONS = {
  general: {
    defaultLandingPage: '/dashboard' as LandingPage,
    timezone: 'UTC',
    dateFormat: 'relative' as DateFormat,
    numberFormat: 'compact' as NumberFormat,
  },
  appearance: {
    compactMode: false,
    cardDensity: 'comfortable' as CardDensity,
    sidebarDefaultOpen: true,
  },
  liveUpdates: {
    autoRefresh: true,
    pollingInterval: 10000 as PollingInterval,
    pauseWhenHidden: true,
    relativeTimeUpdateFrequency: 1000 as 1000 | 5000 | 30000,
    liveUpdateMode: 'polling' as LiveUpdateMode,
  },
  notifications: {
    successNotifications: true,
    errorNotifications: true,
    warningNotifications: true,
    schedulerNotifications: true,
    retryNotifications: true,
    dlqNotifications: true,
  },
  dashboard: {
    defaultPageSize: 25 as DefaultPageSize,
    defaultSorting: 'createdAt' as DefaultSorting,
    persistWorkspace: true,
  },
  accessibility: {
    reducedMotion: false,
    highContrast: false,
    fontScale: 'md' as FontScale,
    keyboardNavEnhancements: false,
  },
  developer: {
    developerMode: false,
    compactTableMode: false,
    refreshIntervalMs: 10000,
  },
} as const;

export const defaultPreferences: UserPreferences = {
  ...DEFAULT_PREFERENCE_SECTIONS.general,
  ...DEFAULT_PREFERENCE_SECTIONS.appearance,
  ...DEFAULT_PREFERENCE_SECTIONS.liveUpdates,
  ...DEFAULT_PREFERENCE_SECTIONS.notifications,
  ...DEFAULT_PREFERENCE_SECTIONS.dashboard,
  ...DEFAULT_PREFERENCE_SECTIONS.accessibility,
  ...DEFAULT_PREFERENCE_SECTIONS.developer,
};

// ─── Store ───────────────────────────────────────────────────────────────────

export type PreferenceSectionKey = keyof typeof DEFAULT_PREFERENCE_SECTIONS;

interface PreferencesState {
  preferences: UserPreferences;
  updatePreferences: (prefs: Partial<UserPreferences>) => void;
  resetSection: (section: PreferenceSectionKey) => void;
  resetAll: () => void;
}

export const usePreferencesStore = create<PreferencesState>()(
  persist(
    (set) => ({
      preferences: defaultPreferences,

      updatePreferences: (updated) =>
        set((state) => ({
          preferences: { ...state.preferences, ...updated },
        })),

      resetSection: (section) =>
        set((state) => ({
          preferences: {
            ...state.preferences,
            ...DEFAULT_PREFERENCE_SECTIONS[section],
          },
        })),

      resetAll: () => set({ preferences: defaultPreferences }),
    }),
    {
      name: 'scheduler-preferences-store',
      // Merge stored values with new defaults on hydration
      merge: (persisted: any, current) => ({
        ...current,
        preferences: {
          ...defaultPreferences,
          ...(persisted as PreferencesState)?.preferences,
        },
      }),
    },
  ),
);
