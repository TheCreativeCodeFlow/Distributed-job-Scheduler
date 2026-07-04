# Scheduler Data Flow

This document outlines query keys, invalidation mappings, and API mutations.

## 1. Query Keys Matrix

- **Status**: `['scheduler', 'status']` checks active state.
- **Metrics**: `['scheduler', 'metrics']` fetches historical counts.
- **Dashboard**: `['scheduler', 'dashboard']` maps overall dashboard settings.
- **Health**: `['scheduler', 'health']` queries storage engines connections status.

---

## 2. Invalidation Pathways

Manual force promotion cycles invalidate:

- `['scheduler', 'status']`
- `['scheduler', 'metrics']`
- `['scheduler', 'dashboard']`
- General jobs listings queries `['jobs']`.
