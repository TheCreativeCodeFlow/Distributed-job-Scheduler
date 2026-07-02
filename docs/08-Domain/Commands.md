# Domain Commands

**Document Version**: 1.0.0  
**Status**: APPROVED  
**Author**: Principal Software Architect  
**Last Updated**: 2026-07-02

---

## Revision History

| Version | Date       | Description                      | Author              |
| :------ | :--------- | :------------------------------- | :------------------ |
| 1.0.0   | 2026-07-02 | Initial release for DDD Commands | Principal Architect |

---

## Table of Contents

1. [Core Domain Commands](#1-core-domain-commands)

---

## 1. Core Domain Commands

### 1.1. CreateJob

- **Purpose**: Creates and schedules a new job.
- **Input**: `queue_id`, `payload`, `priority`, `scheduled_at` (optional).
- **Business Validation**: Queue must be active, payload size must be `< 1MB`, and timestamp must be UTC.
- **Affected Aggregate**: Job Aggregate.
- **Result**: Job created in PostgreSQL with `QUEUED` or `SCHEDULED` status.
- **Possible Failures**: Queue not found, validation error, project limit exceeded.

### 1.2. CancelJob

- **Purpose**: Cancels a pending or running job.
- **Input**: `job_id`.
- **Business Validation**: Job must not be in a terminal state (`COMPLETED`, `DEAD_LETTER`).
- **Affected Aggregate**: Job Aggregate.
- **Result**: Job status set to `CANCELLED`, Redis lease key deleted.
- **Possible Failures**: Job not found, invalid state.

### 1.3. PauseQueue

- **Purpose**: Pauses a queue to block new job claims.
- **Input**: `queue_id`.
- **Business Validation**: Queue must be active.
- **Affected Aggregate**: Queue Aggregate.
- **Result**: Queue state set to `PAUSED` in PostgreSQL.
- **Possible Failures**: Queue not found, unauthorized.

### 1.4. ResumeQueue

- **Purpose**: Resumes a paused queue to allow job claims.
- **Input**: `queue_id`.
- **Business Validation**: Queue must be paused.
- **Affected Aggregate**: Queue Aggregate.
- **Result**: Queue state set to `ACTIVE` in PostgreSQL.
- **Possible Failures**: Queue not found, unauthorized.

### 1.5. RegisterWorker

- **Purpose**: Registers a worker container instance.
- **Input**: `worker_id`, `capacity`, `capabilities`.
- **Business Validation**: Concurrency capacity must be `> 0`.
- **Affected Aggregate**: Worker Aggregate.
- **Result**: Worker row added to database.
- **Possible Failures**: Database connection failure.

### 1.6. HeartbeatTask

- **Purpose**: Renews execution lease lock in Redis.
- **Input**: `job_id`, `worker_id`.
- **Business Validation**: Worker must own the active lease.
- **Affected Aggregate**: Worker Aggregate.
- **Result**: Redis lease key TTL extended by 30 seconds.
- **Possible Failures**: Lease lost, worker offline.
