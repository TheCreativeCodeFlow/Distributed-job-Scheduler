# Live Preferences

## Overview

The **Live Updates** settings tab provides direct control over the Live Update Infrastructure (Phase 17). Changes take effect immediately in the running application — no reload required.

---

## Integration Points

### 1. Auto Refresh Toggle

```
Toggle → updatePreferences({ autoRefresh }) + liveCtx.setPollingInterval()
```

When disabled, the polling interval is set to `'off'` in the live controller immediately, stopping all background fetches. When re-enabled, the stored `pollingInterval` value is restored.

### 2. Polling Interval

```
Select → updatePreferences({ pollingInterval }) + liveCtx.setPollingInterval()
```

The selected value is applied to both the Zustand store (for persistence) and the running `globalPollingController` (for immediate effect). All pages using `useLiveUpdates()` pick up the new interval via their `refetchInterval` value returned from the hook.

### 3. Pause When Hidden

```
Toggle → updatePreferences({ pauseWhenHidden })
```

This preference is read by the `LiveProvider` on mount. The `LiveProvider` listens to `document.visibilitychange` events and pauses the clock tick when the tab is hidden. Note: the actual pausing behavior is already built into `LiveProvider` — this setting documents the user's intent and is available for future SSE integrations.

### 4. Live Update Mode

```
RadioPill → updatePreferences({ liveUpdateMode })
```

| Mode      | Behavior                                         |
| --------- | ------------------------------------------------ |
| `polling` | Fetch data on a fixed timer interval             |
| `auto`    | SSE when available, polling as fallback (future) |
| `manual`  | Only refresh on explicit button click            |

### 5. PreferencesProvider Boot Sync

On application mount, `PreferencesProvider` syncs the stored preferences to the controller:

```ts
useEffect(() => {
  if (preferences.autoRefresh) {
    globalPollingController.setInterval(preferences.pollingInterval);
  } else {
    globalPollingController.setInterval('off');
  }
}, [preferences.autoRefresh, preferences.pollingInterval]);
```

This ensures that after a page reload, the controller starts with the user's last saved interval rather than the hardcoded default of `10000ms`.

---

## PollingInterval Type

```ts
type PollingInterval = 'manual' | 5000 | 10000 | 30000 | 60000 | 'off';
```

The `PollingController` singleton manages the current interval and notifies subscribers via a listener set:

```
setInterval(interval)
  → changeListeners.forEach(listener => listener(interval))
  → LiveProvider state update
  → useLiveUpdates().refetchInterval update
  → TanStack Query refetchInterval parameter
```

---

## Data Flow Diagram

```
Settings UI (Live Updates tab)
        │
        ├─ autoRefresh toggle
        │       │
        │       └─► liveCtx.setPollingInterval('off' | storedInterval)
        │                   │
        │                   └─► globalPollingController.setInterval()
        │                               │
        │                               └─► changeListeners notify
        │                                           │
        │                                           └─► LiveProvider state
        │                                                       │
        │                                                       └─► useLiveUpdates()
        │                                                                   │
        │                                                                   └─► TanStack Query refetchInterval
        │
        └─ pollingInterval select
                │
                └─► updatePreferences({ pollingInterval })  ← localStorage persist
                └─► liveCtx.setPollingInterval(newInterval) ← immediate effect
```

---

## Future SSE Integration

When `liveUpdateMode === 'auto'` or `'sse'`:

1. `EventDispatcher.subscribe('sse:*', ...)` receives server-pushed events
2. `RefreshManager.triggerManualRefresh(moduleKey)` is called per event
3. All `useLiveUpdates({ moduleKey })` subscribers execute their `refetch()`
4. Polling can be set to `'off'` when SSE is active to save bandwidth

See `FutureSSEIntegration.md` in `src/lib/live/` for the full migration plan.
