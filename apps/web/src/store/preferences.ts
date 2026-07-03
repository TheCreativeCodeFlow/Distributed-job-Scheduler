import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface UserPreferences {
  refreshIntervalMs: number;
  compactTableMode: boolean;
  developerMode: boolean;
}

interface PreferencesState {
  preferences: UserPreferences;
  updatePreferences: (prefs: Partial<UserPreferences>) => void;
  resetPreferences: () => void;
}

const defaultPreferences: UserPreferences = {
  refreshIntervalMs: 5000,
  compactTableMode: false,
  developerMode: false,
};

export const usePreferencesStore = create<PreferencesState>()(
  persist(
    (set) => ({
      preferences: defaultPreferences,
      updatePreferences: (updated) =>
        set((state) => ({
          preferences: { ...state.preferences, ...updated },
        })),
      resetPreferences: () => set({ preferences: defaultPreferences }),
    }),
    {
      name: 'scheduler-preferences-store',
    },
  ),
);
