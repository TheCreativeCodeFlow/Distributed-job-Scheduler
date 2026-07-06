# Polling Strategy

This document details global polling rates.

## 1. Refresh Rates

- **5s**: High intensity troubleshooting mode.
- **10s**: Standard monitoring.
- **30s / 60s**: Low footprint operation.
- **manual / off**: Disables automatic ticking loops.

---

## 2. Coordinated Rates

- Change events inside `PollingController` update the React Query interval arguments dynamically across all active pages.
