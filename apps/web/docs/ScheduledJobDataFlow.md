# Scheduled Job Data Flow

This document details scheduled jobs query keys, mutation setups, and invalidation rules.

## 1. Query Definitions

- **Scheduled List**: `['scheduled-jobs', 'list', params]` fetches project-queue matrices, then fetches `GET /api/v1/queues/:queueId/jobs/scheduled` in parallel.
- **Scheduled Detail**: `['scheduled-jobs', 'detail', scheduledJobId]` fetches details and maps queue context.

---

## 2. Invalidation Pathways

Successful scheduled job mutations (creation or cancellation) trigger query invalidations for:

- `['scheduled-jobs', 'list']`
- `['scheduled-jobs', 'detail', scheduledJobId]`
- Parent `['queues', 'detail']` queries
- Dashboard overview `['metrics']` queries
