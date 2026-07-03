# Countdown Component

This document outlines design and execution of the Countdown component.

## 1. Refresh Frequency

- Tick cycles operate on a local `setInterval` callback updating exactly once per second.
- Eliminates the need to poll backend endpoints for countdown status.

---

## 2. Timing Calculations

- Computes difference between `targetDate` and `Date.now()`.
- Formats to display remaining days, hours, minutes, and seconds.
- Automatically transitions to "Promoting now..." when target is reached.
