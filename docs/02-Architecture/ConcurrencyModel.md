# Concurrency Architecture Model

**Document Version**: 1.1.0  
**Status**: APPROVED  
**Author**: Principal Software Architect  
**Last Updated**: 2026-07-02

---

## Revision History

| Version | Date       | Description                                                 | Author              |
| :------ | :--------- | :---------------------------------------------------------- | :------------------ |
| 1.1.0   | 2026-07-02 | Remediation: PostgreSQL queue ownership & SQL lock claiming | Principal Architect |
| 1.0.0   | 2026-07-02 | Initial release for Architecture Review                     | Principal Architect |

---

## Table of Contents

1. [PostgreSQL Row-Level Locking (`SKIP LOCKED`)](#1-postgresql-row-level-locking-skip-locked)
2. [Locking Strategies: Optimistic vs. Pessimistic](#2-locking-strategies-optimistic-vs-pessimistic)
3. [Transaction Boundaries around Job Claiming](#3-transaction-boundaries-around-job-claiming)
4. [Durability, Consistency, & Recoverability Advantages](#4-durability-consistency--recoverability-advantages)

---

## 1. PostgreSQL Row-Level Locking (`SKIP LOCKED`)

To prevent duplicate job execution, we use row-level locking in PostgreSQL:

```sql
SELECT id FROM jobs
WHERE status = 'QUEUED' AND queue_name = $1
ORDER BY priority DESC, created_at ASC
LIMIT 1
FOR UPDATE SKIP LOCKED;
```

### 1.1. Why It Prevents Duplicate Execution

The `FOR UPDATE` clause locks the returned job row in the database, blocking other transactions from modifying or claiming it. Using `SKIP LOCKED` instructs other worker transactions to skip locked rows instead of waiting, preventing double-processing.

### 1.2. Why It Scales for Multiple Workers

Workers can poll PostgreSQL concurrently. Since locked rows are skipped, multiple workers can claim different jobs from the same queue simultaneously without waiting on table-level locks.

### 1.3. Why It Avoids Race Conditions

The database engine evaluates and locks the selected row in a single atomic database operation. If two workers query the database at the same millisecond, the database engine executes the queries sequentially, assigning each worker a unique row.

---

## 2. Locking Strategies: Optimistic vs. Pessimistic

### 2.1. Pessimistic Row Locking (`FOR UPDATE SKIP LOCKED`)

- **Usage**: Job claiming phase.
- **Rationale**: Direct, atomic concurrency control is required when workers claim tasks to guarantee that a job is assigned to exactly one worker.

### 2.2. Optimistic Locking (Version Counters)

- **Usage**: Configuration updates and metadata changes (e.g. updating queue configurations, changing project settings).
- **Rationale**: Config updates are less frequent. Using optimistic locking (`WHERE version = current_version`) avoids database lock contention.

---

## 3. Transaction Boundaries around Job Claiming

The claiming process runs within a strict transaction boundary to ensure database consistency:

```sql
BEGIN TRANSACTION ISOLATION LEVEL READ COMMITTED;

-- 1. Lock and retrieve the next eligible job
SELECT id, payload, attempts
FROM jobs
WHERE status = 'QUEUED' AND queue_name = $1
ORDER BY priority DESC, created_at ASC
LIMIT 1
FOR UPDATE SKIP LOCKED;

-- 2. Update job status
UPDATE jobs
SET status = 'CLAIMED', worker_id = $2, claimed_at = NOW()
WHERE id = $3;

-- 3. Commit state changes
COMMIT;
```

If steps 1 or 2 fail, the transaction rolls back, releasing the row lock and returning the job to the queue.

---

## 4. Durability, Consistency, & Recoverability Advantages

Transitioning queue storage from Redis to PostgreSQL improves system resilience:

- **Durability**: Redis in-memory storage is volatile and prone to data loss on reboot. PostgreSQL transaction logs write-ahead logs (WAL) guarantee that job state is written to disk.
- **Consistency**: PostgreSQL provides strong transactional consistency (ACID), ensuring that job state transitions are atomic and durable.
- **Recoverability**: If a worker or database node crashes, the database releases row locks during transaction rollback, returning the job to the queue.
