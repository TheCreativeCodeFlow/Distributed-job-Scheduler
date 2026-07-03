# Dashboard Data Flow

This document details the TanStack Query caching structures driving the Operations Overview dashboard.

## 1. Parallel Telemetry Requests

The dashboard parallelizes independent API calls using separate hook declarations to optimize loading speeds:

- `['dashboard', 'overview', orgId, projectId]` ──> `/dashboard/overview`
- `['dashboard', 'health']` ──> `/dashboard/health`
- `['dashboard', 'activity', orgId, projectId]` ──> `/dashboard/activity`
- `['metrics', 'queues', orgId]` ──> `/metrics/queues`
- `['metrics', 'workers']` ──> `/metrics/workers`

---

## 2. Automated Telemetry Polling

Queries hook up to Zustand's active refresh intervals:

- `refetchInterval: preferences.refreshIntervalMs`
- Refreshes occur silently in the background, updating active charts and counts reactively without redrawing layouts.
