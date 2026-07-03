# Performance Tuning Guide

## Overview

This document provides actionable configuration and code-level tuning recommendations derived from benchmark analysis of the Distributed Job Scheduler.

---

## 1. PostgreSQL Connection Pool

### Problem

With many concurrent workers each holding a `SELECT … FOR UPDATE SKIP LOCKED` transaction, the number of active connections grows linearly with worker count.

### Recommendation

Set the Prisma `DATABASE_URL` connection limit explicitly:

```
postgresql://user:password@host:5432/db?connection_limit=200&pool_timeout=10
```

For large deployments (>200 workers), use **PgBouncer** in transaction mode as a connection multiplexer:

```
DATABASE_URL=postgresql://user:password@pgbouncer:5432/db?pgbouncer=true
```

> **Warning**: With PgBouncer in session mode, advisory locks and `FOR UPDATE` within transactions will not work correctly. Use **transaction mode**.

---

## 2. Job Claim Index

Ensure the following composite index exists on the `jobs` table to prevent full table scans during worker polling:

```sql
CREATE INDEX idx_jobs_claim_poller
  ON jobs (status, queue_id, created_at)
  WHERE status IN ('QUEUED', 'RETRY_PENDING');
```

This index is already defined in the migration. Verify it is not dropped during schema evolution.

---

## 3. Scheduler Promotion Batch Size

The default promotion `batchSize` is 50. Tune it based on workload:

| Queue Depth         | Recommended Batch Size        |
| :------------------ | :---------------------------- |
| < 10,000 jobs       | 50 (default)                  |
| 10,000–100,000 jobs | 100–200                       |
| > 100,000 jobs      | 500 (monitor lock wait times) |

To change the batch size, update the promotion endpoint call in `apps/api/src/modules/scheduler/controllers/scheduler.ts` or pass it via environment variable.

---

## 4. Retry Backoff Jitter

Ensure jitter is applied to all retry delays to prevent thundering-herd retry storms:

```
delay = base * 2^attempt + random(0, base)
```

This is already implemented in `RetryService.handleFailure`. Do not remove the jitter.

---

## 5. Redis Health Checks

Avoid polling Redis health on every request. The metrics endpoint (`GET /api/v1/metrics/system`) measures Redis latency each call. Consider caching this result for 5 seconds under high metric polling rates.

---

## 6. Lease Expiry Scan Interval

The lease expiry check should run on a dedicated interval, not on every heartbeat request. Recommended interval: **30 seconds**.

For clusters with aggressive SLAs, reduce to **10 seconds** and ensure the `idx_worker_leases_expiry` index is present:

```sql
CREATE INDEX idx_worker_leases_expiry
  ON worker_leases (expires_at)
  WHERE status = 'ACTIVE';
```

---

## 7. Node.js Event Loop

- Avoid blocking the event loop with CPU-heavy synchronous work in the scheduler process.
- All promotion, retry, and DLQ logic is already async — maintain this invariant.
- Monitor event loop lag with `process.hrtime()` metrics or `clinic.js` in staging.

---

## 8. Deployment Recommendations

| Component | Scaling Strategy         | Notes                                             |
| :-------- | :----------------------- | :------------------------------------------------ |
| API       | Horizontal (N nodes)     | Stateless — auto-scale freely                     |
| Scheduler | Singleton                | Exactly one instance per cluster                  |
| Workers   | Horizontal (N processes) | Each independently claims via SKIP LOCKED         |
| Database  | Vertical + Read Replica  | Use primary for writes, replica for metrics reads |
| Redis     | Clustered or Sentinel    | Used for lease state & health checks              |
