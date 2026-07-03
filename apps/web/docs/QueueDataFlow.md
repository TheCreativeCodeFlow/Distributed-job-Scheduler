# Queue Data Flow

This document details query keys and caching setups.

## 1. Query Definitions

- **List Queries**: `['queues', 'list', params]` fetches project details and groups their queues.
- **Queue Details**: `['queues', 'detail', queueId]` fetches current configuration parameters.
- **Queue Status**: `['queues', 'detail', queueId, 'status']` fetches real-time waiting/running jobs counts.
- **Queue Jobs**: `['queues', 'detail', queueId, 'jobs']` maps active job lists.

---

## 2. Invalidation Pathways

Successful queue operations invalidate:

- `['queues', 'list']` to update directory metrics.
- `['projects']` and `['metrics']` to refresh system dashboards.
- Individual `detail` and `status` cache entries for the target queue.
