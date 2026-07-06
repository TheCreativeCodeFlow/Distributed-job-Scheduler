# Preferences Architecture

## Data Flow

```
User action in Settings UI
        │
        ▼
updatePreferences({ key: value })          ← Zustand action
        │
        ├─► localStorage                   ← Zustand persist middleware
        │
        └─► PreferencesProvider useEffect  ← Reactive CSS side-effects
                │
                ├─► document.documentElement.classList.toggle('reduce-motion', ...)
                ├─► document.documentElement.classList.toggle('high-contrast', ...)
                ├─► document.documentElement.classList.toggle('compact-mode', ...)
                ├─► document.documentElement.classList.toggle('keyboard-nav', ...)
                ├─► document.documentElement.style.setProperty('--font-scale', ...)
                └─► globalPollingController.setInterval(...)
```

---

## Store Design

### Location

`src/store/preferences.ts`

### Zustand v5 + persist middleware

```ts
create<PreferencesState>()(
  persist(
    (set) => ({ ... }),
    {
      name: 'scheduler-preferences-store',
      merge: (persisted, current) => ({
        ...current,
        preferences: { ...defaultPreferences, ...persisted.preferences },
      }),
    },
  ),
);
```

The `merge` strategy ensures new preference keys added in future releases get their defaults even when an older persisted object is loaded from localStorage.

### Store Shape

```ts
interface PreferencesState {
  preferences: UserPreferences;
  updatePreferences: (patch: Partial<UserPreferences>) => void;
  resetSection: (section: PreferenceSectionKey) => void;
  resetAll: () => void;
}
```

### Section Reset

Each settings card has an optional "Reset" button that calls `resetSection(key)`:

```ts
resetSection: (section) =>
  set((state) => ({
    preferences: { ...state.preferences, ...DEFAULT_PREFERENCE_SECTIONS[section] },
  })),
```

---

## Provider Chain

The `PreferencesProvider` sits in the provider tree **after** `ThemeProvider` and **before** `AuthProvider`:

```
ErrorBoundary
  └─ QueryProvider
       └─ ThemeProvider            ← reads theme store, applies .light/.dark class
            └─ PreferencesProvider ← reads preferences store, applies CSS side-effects
                 └─ AuthProvider
                      └─ LiveProvider
                           └─ LayoutShell
```

**Why before AuthProvider?**
CSS preferences (font scale, compact mode, reduced motion) should apply to the entire page — including the loading spinner shown during silent token refresh, before the user is authenticated.

---

## Separate Theme Store

The color theme (`light` / `dark` / `system`) is intentionally kept in a separate `useThemeStore` (persisted under `scheduler-theme-store`). This mirrors the ThemeProvider's existing design and prevents coupling the large preferences object to theme loading logic.

The Appearance tab in Settings reads from `useThemeStore` and writes to it directly — it does not route through the preferences store.

---

## Type Exports

All preference types are exported from `src/store/preferences.ts` for use in components:

```ts
export type {
  LandingPage,
  DateFormat,
  NumberFormat,
  CardDensity,
  FontScale,
  LiveUpdateMode,
  DefaultPageSize,
  DefaultSorting,
  PreferenceSectionKey,
  UserPreferences,
};
```

---

## Testing Strategy

- Zustand stores are mocked at module level using `vi.mock`
- `mockUpdatePreferences`, `mockResetSection`, and `mockResetAll` are tracked as `vi.fn()`
- Tests verify that UI interactions call these mocks with the correct payloads
- CSS side-effect tests (class toggling) are done in `preferences-provider` integration tests
