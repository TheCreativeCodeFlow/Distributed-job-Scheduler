# Domain Aggregates

**Document Version**: 1.0.0  
**Status**: APPROVED  
**Author**: Principal Software Architect  
**Last Updated**: 2026-07-02

---

## Revision History

| Version | Date       | Description                        | Author              |
| :------ | :--------- | :--------------------------------- | :------------------ |
| 1.0.0   | 2026-07-02 | Initial release for DDD Aggregates | Principal Architect |

---

## Table of Contents

1. [Core Domain Aggregates](#1-core-domain-aggregates)
2. [Aggregates Specifications](#2-aggregates-specifications)

---

## 1. Core Domain Aggregates

We group related entities into 5 domain Aggregates to maintain transactional consistency:

1. **Organization Aggregate** (Root: `Organization`)
2. **Project Aggregate** (Root: `Project`)
3. **Queue Aggregate** (Root: `Queue`)
4. **Job Aggregate** (Root: `Job`)
5. **Worker Aggregate** (Root: `Worker`)

---

## 2. Aggregates Specifications

### 2.1. Organization Aggregate

- **Aggregate Root**: `Organization`.
- **Members**: `Organization`, `User` (memberships).
- **Consistency Boundary**: Managing users and memberships within the organization.
- **Transaction Boundary**: Single SQL transaction updating organization membership records.
- **Business Invariants**: An organization must always have at least one owner user account.
- **Lifecycle**: Created -> Active -> Deleted.
- **Reasoning**: Ensures that user roles inside the organization boundary are transactionally consistent.

### 2.2. Project Aggregate

- **Aggregate Root**: `Project`.
- **Members**: `Project`.
- **Consistency Boundary**: Project configuration and environment variables.
- **Transaction Boundary**: Single SQL transaction updating project variables.
- **Lifecycle**: Active -> Archived.
- **Reasoning**: Projects segment environment configurations.

### 2.3. Queue Aggregate

- **Aggregate Root**: `Queue`.
- **Members**: `Queue`, `RetryPolicy`.
- **Consistency Boundary**: Queue limits, pause states, and retry policies.
- **Transaction Boundary**: PostgreSQL transaction modifying queue settings.
- **Business Invariants**: Paused status blocks jobs claiming.
- **Lifecycle**: ACTIVE -> PAUSED -> ARCHIVED.
- **Reasoning**: Retries and limits are bound directly to queue configurations.

### 2.4. Job Aggregate

- **Aggregate Root**: `Job`.
- **Members**: `Job`, `JobExecution`, `DeadLetterEntry`, `ScheduledJob`.
- **Consistency Boundary**: Execution statuses, attempt history, scheduler parameters, and DLQ state.
- **Transaction Boundary**: PostgreSQL transaction.
- **Business Invariants**:
  - A completed job cannot transition back to queued.
  - A job can have only one active owner worker at a time.
- **Lifecycle**: Scheduled -> Queued -> Claimed -> Executed -> Completed.
- **Reasoning**: The job lifecycle and its execution history must remain transactionally consistent to prevent duplicate runs and verify retry limits.

### 2.5. Worker Aggregate

- **Aggregate Root**: `Worker`.
- **Members**: `Worker`, `Lease`.
- **Consistency Boundary**: Worker registration state and active leases.
- **Transaction Boundary**: Redis lock updates and PostgreSQL worker registration updates.
- **Business Invariants**: Workers require a valid lease in Redis to execute jobs.
- **Lifecycle**: REGISTERING -> IDLE -> RUNNING -> OFFLINE.
- **Reasoning**: Aligns worker registrations with active execution lease locks.
