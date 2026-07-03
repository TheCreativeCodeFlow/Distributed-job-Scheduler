# State Management Guide

This document details state management patterns in the TaskFlow console.

## 1. Zustand Store Schemas

Zustand is chosen for global layouts and session tracking due to its lightweight bundle footprint and clean API:

- **`useAuthStore`**: Stores active access/refresh tokens and user role state. Syncs to local storage automatically.
- **`useThemeStore`**: Persists system/dark/light display themes.
- **`useNotificationStore`**: Exposes the stacked list of active toast notifications.
- **`useSidebarStore`**: Dictates expanded/collapsed sidebar layout toggle states.
- **`useFiltersStore`**: Shares global dashboard filter ranges (selected organization, project, queue, times).
- **`usePreferencesStore`**: Stores page parameters like refresh intervals, list sizes, and devMode flags.
