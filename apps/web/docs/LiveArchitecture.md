# Live Update Architecture

This document describes the centralized live update framework.

## 1. Unified Interval Loop

- Mounts a single `setInterval` timer (every 1 second) globally at the app root layout level (`LiveProvider`).
- Suspends ticking hooks when `document.hidden` is true to optimize worker performance.

---

## 2. Abstraction Framework

- **EventDispatcher**: Publish-subscribe registry for broadcasting state triggers.
- **PollingController**: Configures global telemetry refresh rates ('manual', 5s, 10s, 30s, 60s, 'off').
- **RefreshManager**: Coordinates invalidation pipelines across specific dashboard keys.
