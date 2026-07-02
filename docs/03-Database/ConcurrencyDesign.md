# Concurrency & Locking Design

**Document Version**: 1.0.0  
**Status**: APPROVED  
**Author**: Principal Database Architect  
**Last Updated**: 2026-07-02

---

## Revision History

| Version | Date       | Description                                | Author              |
| :------ | :--------- | :----------------------------------------- | :------------------ |
| 1.0.0   | 2026-07-02 | Initial release for Database Design Review | Principal Architect |

---

## Table of Contents

1. [Pessimistic Row Locking (`SKIP LOCKED`)](#1-pessimistic-row-locking-skip-locked)
2. [Lease Ownership Coordination](#2-lease-ownership-coordination)
3. [Deadlock Prevention & Lock Timeouts](#3-deadlock-prevention--lock-timeouts)

---

## 1. Pessimistic Row Locking (`SKIP LOCKED`)

To prevent duplicate job execution, claiming a task from a queue must be atomic.

- **SQL Mechanics**:
  ```sql
  SELECT id FROM jobs
  WHERE status = 'QUEUED' AND queue_name = $1
  ORDER BY priority DESC, created_at ASC
  LIMIT 1
  FOR UPDATE SKIP LOCKED;
  ```
- **How it prevents worker contention**:
  - The `FOR UPDATE` clause locks the returned job row in the database, blocking other transactions from modifying or claiming it.
  - The `SKIP LOCKED` clause instructs other worker transactions to skip locked rows instead of waiting, preventing double-processing.

---

## 2. Lease Ownership Coordination

- **Redis Leases**:
  - After claiming a job, the worker writes a lease key in Redis (`lease:{job_id}`) mapping to its `worker_id` with a fixed TTL.
- **Optimistic Checks on Write**:
  - When a worker updates a job status to `COMPLETED` or `FAILED` in PostgreSQL, it validates that it still holds the active lease in Redis. This prevents workers with expired leases from writing results back to the database.

---

## 3. Deadlock Prevention & Lock Timeouts

- **Deadlock Avoidance**:
  - The `SKIP LOCKED` clause prevents concurrent transactions from waiting on locked rows, avoiding database deadlocks.
  - Transactions lock resources sequentially (e.g. by index ID).
- **Lock Timeout Strategy**:
  - Every connection pool query sets `statement_timeout` to `2000` milliseconds to prevent queries from hanging indefinitely.
