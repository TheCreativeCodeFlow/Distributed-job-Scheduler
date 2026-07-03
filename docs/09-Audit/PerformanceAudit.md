# Performance Audit

This document presents the performance audit of the Distributed Job Scheduler, verifying database query designs, locking behaviors, and scaling capacities.

## 1. Query Optimizations & N+1 Mitigations

- **Grouping/Aggregating**: The metrics and dashboard services fetch overall stats concurrently using `Promise.all` blocks. For list endpoints (like queues status list), the service fetches all entities and queries grouped aggregates, avoiding querying data in N+1 loops.
- **Pagination**: All list endpoints (e.g. jobs log list, executions history list) enforce pagination boundaries (page and limit query parameters) using Zod.

---

## 2. Lock Contention & Transaction Scopes

- **Claim locks**: Uses pessimistic locking (`FOR UPDATE SKIP LOCKED` equivalent in transaction blocks) during worker claims. This selects matching jobs and skips already locked records, preventing thread lock collisions or workers idling.
- **Short Transactions**: Transactions are kept minimal to hold connections for brief millisecond intervals, avoiding Postgres pool exhaustion.

---

## 3. Database Indexes

The following indices are configured in `schema.prisma` to optimize scan plans:

- `idx_jobs_claim_poller`: Composite index on `[queueId, status, priority, createdAt]` for fast worker claims.
- `idx_jobs_scheduler_promotion`: Composite index on `[status, scheduledAt]` for fast job promotions.
- `idx_scheduled_jobs_trigger`: Index on `[nextRunAt]` for cron triggering scans.
- `idx_leases_cleanup`: Index on `[expiresAt]` for fast worker recovery cleanup sweeps.
