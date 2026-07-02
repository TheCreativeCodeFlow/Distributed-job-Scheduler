# System Invariants

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

1. [Invariants Specifications](#1-invariants-specifications)

---

## 1. Invariants Specifications

### 1.1. Invariant 1: Completed Jobs are Terminal

- **Definition**: A completed job (`COMPLETED` state) cannot transition back to `QUEUED`, `RUNNING`, or any other active state.
- **Purpose**: To guarantee execution results are immutable once committed.
- **Reasoning**: Prevents accidental re-execution of completed workflows (e.g. duplicating a payment).
- **Components Enforcing**: PostgreSQL check constraints, Prisma state update checks.
- **Consequences of Violation**: Duplicate job execution and compromised audit logs.

### 1.2. Invariant 2: Worker Lease Ownership

- **Definition**: A worker may only execute a job if it holds a valid lease key in Redis (`lease:{job_id}`).
- **Purpose**: Prevents split-brain scenarios where multiple workers execute the same task.
- **Reasoning**: If a worker's heartbeat fails and its lease expires, it loses ownership of the job.
- **Components Enforcing**: Redis lease key check (heartbeat loop), PostgreSQL version checks on write.
- **Consequences of Violation**: Concurrent execution of the same task, causing race conditions.

### 1.3. Invariant 3: Audit Trail Completeness

- **Definition**: Every state transition of a job must be recorded in the `job_execution_log` table.
- **Purpose**: High-compliance audit logs.
- **Reasoning**: Enables debugging, SLA audits, and system profiling.
- **Components Enforcing**: Database triggers and Prisma execution wrapper.
- **Consequences of Violation**: Untraceable job states and compliance failures.

### 1.4. Invariant 4: Single Active Owner

- **Definition**: No job may have multiple active owners (workers) at the same millisecond.
- **Purpose**: Guarantees mutually exclusive execution.
- **Reasoning**: Handled by database transactional row-level locks.
- **Components Enforcing**: PostgreSQL `SELECT ... FOR UPDATE SKIP LOCKED` transaction queries.
- **Consequences of Violation**: Duplicate task runs.

### 1.5. Invariant 5: Retry Attempts Recording

- **Definition**: Every job retry must create a new execution record in the audit log database.
- **Purpose**: Track retry counts and failure details.
- **Reasoning**: Allows developers to trace failure histories.
- **Components Enforcing**: Retry Engine, PostgreSQL schema.
- **Consequences of Violation**: Missed retry context.

### 1.6. Invariant 6: DLQ Immutability

- **Definition**: Dead Letter Queue entries (`DEAD_LETTER` state) are immutable and cannot be modified (except to delete or replay).
- **Purpose**: Preserves debugging context of failed jobs.
- **Reasoning**: Modifying a failed payload prevents accurate debugging.
- **Components Enforcing**: API authorization layer.
- **Consequences of Violation**: Lost debugging context.

### 1.7. Invariant 7: Monotonically Increasing Heartbeats

- **Definition**: Heartbeat counts must increase monotonically.
- **Purpose**: Ensures worker health is checked sequentially.
- **Reasoning**: Detects delayed or out-of-order heartbeat signals.
- **Components Enforcing**: Redis atomic updates.
- **Consequences of Violation**: Heartbeat verification errors.

### 1.8. Invariant 8: Paused Queue Dispatch block

- **Definition**: A paused queue (`PAUSED` state) must block workers from claiming jobs from it.
- **Purpose**: Gives administrators operational control over queue traffic.
- **Reasoning**: Allows pausing queues during downstream system outages.
- **Components Enforcing**: PostgreSQL claiming transaction check.
- **Consequences of Violation**: Worker picks up jobs during outages.
