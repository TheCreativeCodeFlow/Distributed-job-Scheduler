# Retry Data Flow

This document details query keys, invalidation routes, and API responses.

## 1. Query Keys Matrix

- **Metrics**: `['retries', 'metrics']` fetches overall retry metrics.
- **Retry Job List**: `['retries', 'list', params]` fetches list telemetry.
- **Retry Job Details**: `['retries', 'detail', jobId]` fetches specific retry parameters.

---

## 2. Invalidation Pathways

Manual force retry mutations invalidate:

- `['retries', 'metrics']`
- `['retries', 'list']`
- `['retries', 'detail', jobId]`
- Parent `['jobs', 'detail']` and `['queues', 'detail']` queries.
