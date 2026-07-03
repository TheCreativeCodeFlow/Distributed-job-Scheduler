# Job Data Flow

This document outlines query keys, invalidation triggers, and parallel execution logic.

## 1. Hook and Query Definitions

- **Unified List Query**: `['jobs', 'list', params]` fetches project-queue matrices, then initiates parallel `apiClient.get(/queues/:queueId/jobs)` requests.
- **Job Details Query**: `['jobs', 'detail', jobId]` fetches job metadata and relates queue hierarchies.
- **Job Status Query**: `['jobs', 'detail', jobId, 'status']` polls execution status.
- **Execution Logs Query**: `['jobs', 'detail', jobId, 'executions']` pulls historic worker outputs.

---

## 2. Invalidation Pathways

Successful job submissions or cancellations trigger invalidations for:

- `['jobs', 'list']` to reload the directory state.
- `['jobs', 'detail', jobId]` and `status` queries.
- Target `['queues', 'detail']` queries.
- Dashboard overview `['metrics']` queries.
