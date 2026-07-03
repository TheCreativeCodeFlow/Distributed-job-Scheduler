# Worker Data Flow

This document outlines TanStack Query keys, mutation endpoints, and cache invalidation workflows.

## 1. Query Key Matrix

- **Workers List**: `['workers', 'list', params]` fetches list telemetry.
- **Worker Details**: `['workers', 'detail', workerId]` fetches single metadata context.
- **Worker Claims**: `['workers', 'detail', workerId, 'claims']` fetches active claim leases.
- **Worker Lease**: `['workers', 'detail', workerId, 'lease']` fetches lease tokens.

---

## 2. Mutation Invalidations

Successful execution of registration, deregistration, polling, or recovery mutations triggers invalidation cascades on:

- `['workers', 'list']`
- `['workers', 'detail', workerId]`
- Core statistics dashboard logs: `['metrics']`
