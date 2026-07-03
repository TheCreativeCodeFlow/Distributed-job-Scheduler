# Heartbeat Visualization

This document details heartbeat health metrics and lease visualizers.

## 1. Heartbeat Age Counter

- Calculates duration delta between current client local time and `lastHeartbeat`.
- Displays relative elapsed updates: e.g. "12s ago", "2m ago" to alert operators to delays.

---

## 2. Lease Countdown Indicators

- Resolves lease expiration limits from worker token parameters.
- Displays visual countdowns to highlight lease expiry risks.
