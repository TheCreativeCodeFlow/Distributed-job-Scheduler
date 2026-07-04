# DLQ Data Flow

This document details query keys and mutators mapping for Dead Letter Queue console.

## 1. Query Keys Matrix

- **Metrics**: `['dlq', 'metrics']` fetches active/replayed counts.
- **Entry list**: `['dlq', 'list', params]` fetches list telemetry.
- **Entry details**: `['dlq', 'detail', entryId]` fetches specific quarantined configurations.

---

## 2. Invalidation Pathways

Replays and purges trigger immediate invalidations of:

- `['dlq', 'metrics']`
- `['dlq', 'list']`
- `['dlq', 'detail', entryId]`
- General job listings `['jobs']`.
