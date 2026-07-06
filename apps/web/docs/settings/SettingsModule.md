# Settings Module

## Overview

The Settings & User Preferences module at `/dashboard/settings` provides a centralized control center for configuring dashboard behavior, appearance, live data, notifications, and accessibility. All changes take effect **immediately** — no page reload required.

## Route

```
/dashboard/settings
```

**Access Control:** Role-gated to `SYSTEM_ADMIN`, `ORG_OWNER`, `ORG_ADMIN` by both `AuthProvider` and the sidebar `allowedRoles` filter.

---

## Tab Structure

| Tab           | Section Key     | Description                                     |
| ------------- | --------------- | ----------------------------------------------- |
| General       | `general`       | Landing page, timezone, date/number format      |
| Appearance    | `appearance`    | Theme, density, compact mode, sidebar default   |
| Live Updates  | `liveUpdates`   | Auto-refresh, polling interval, update mode     |
| Notifications | `notifications` | Per-category toast notification toggles         |
| Dashboard     | `dashboard`     | Page size, sort defaults, workspace persistence |
| Accessibility | `accessibility` | Motion, contrast, font scale, keyboard nav      |

---

## Settings Reference

### General

| Setting              | Type           | Default      | Description                           |
| -------------------- | -------------- | ------------ | ------------------------------------- |
| `defaultLandingPage` | `LandingPage`  | `/dashboard` | Page shown after login                |
| `timezone`           | `string`       | `UTC`        | Reference timezone for all timestamps |
| `dateFormat`         | `DateFormat`   | `relative`   | How timestamps are formatted          |
| `numberFormat`       | `NumberFormat` | `compact`    | Large number display style            |

### Appearance

| Setting              | Type          | Default       | Description              |
| -------------------- | ------------- | ------------- | ------------------------ |
| `compactMode`        | `boolean`     | `false`       | Tighten spacing globally |
| `cardDensity`        | `CardDensity` | `comfortable` | Card padding density     |
| `sidebarDefaultOpen` | `boolean`     | `true`        | Sidebar state on load    |

Theme (`light` / `dark` / `system`) is stored in `useThemeStore` (separate store).

### Live Updates

| Setting                       | Type                | Default   | Description                     |
| ----------------------------- | ------------------- | --------- | ------------------------------- |
| `autoRefresh`                 | `boolean`           | `true`    | Enable automatic polling        |
| `pollingInterval`             | `PollingInterval`   | `10000`   | Polling cadence in ms           |
| `pauseWhenHidden`             | `boolean`           | `true`    | Pause when tab is not visible   |
| `relativeTimeUpdateFrequency` | `1000\|5000\|30000` | `1000`    | Relative timestamp refresh rate |
| `liveUpdateMode`              | `LiveUpdateMode`    | `polling` | Polling / Auto / Manual         |

### Notifications

All boolean, default `true`:

- `successNotifications`
- `errorNotifications`
- `warningNotifications`
- `schedulerNotifications`
- `retryNotifications`
- `dlqNotifications`

### Dashboard

| Setting            | Type              | Default     | Description                    |
| ------------------ | ----------------- | ----------- | ------------------------------ |
| `defaultPageSize`  | `10\|25\|50\|100` | `25`        | Rows per page in data tables   |
| `defaultSorting`   | `DefaultSorting`  | `createdAt` | Initial sort column            |
| `persistWorkspace` | `boolean`         | `true`      | Remember org/project selection |

### Accessibility

| Setting                   | Type        | Default | Description               |
| ------------------------- | ----------- | ------- | ------------------------- |
| `reducedMotion`           | `boolean`   | `false` | Disable animations        |
| `highContrast`            | `boolean`   | `false` | Boost contrast ratios     |
| `fontScale`               | `FontScale` | `md`    | Base font size multiplier |
| `keyboardNavEnhancements` | `boolean`   | `false` | Enhanced focus rings      |
| `developerMode`           | `boolean`   | `false` | Debug panels visible      |

---

## Key Components

- `SettingsCard` — Section container with title, description, optional reset button
- `SettingRow` — Label + description + control layout row
- `Toggle` — Accessible switch with ARIA `role="switch"` and `aria-checked`
- `RadioPill` — Pill-style radio group with ARIA `role="radio"`
- `SettingsSelect` — Styled `<select>` with type-safe string-to-value conversion
- `Callout` — Info/warning contextual note boxes
- `SavedIndicator` — Animated "Saved ✓" flash on any preference change

---

## Persistence

All preferences persist to `localStorage` via Zustand's `persist` middleware under the key:

```
scheduler-preferences-store
```

The store uses a `merge` function to deep-merge persisted values with new defaults, ensuring backward compatibility when new preference fields are added.
