# Domain Services

**Document Version**: 1.0.0  
**Status**: APPROVED  
**Author**: Principal Software Architect  
**Last Updated**: 2026-07-02

---

## Revision History

| Version | Date       | Description                             | Author              |
| :------ | :--------- | :-------------------------------------- | :------------------ |
| 1.0.0   | 2026-07-02 | Initial release for DDD Domain Services | Principal Architect |

---

## Table of Contents

1. [Domain Services Specifications](#1-domain-services-specifications)

---

## 1. Domain Services Specifications

### 1.1. Scheduler Service

- **Responsibilities**: Promotes scheduled jobs whose trigger time has arrived to the `QUEUED` state in PostgreSQL.
- **Inputs**: Database server current time.
- **Outputs**: Count of promoted jobs.
- **Collaborating Entities**: `Job`, `ScheduledJob`.
- **Business Rules**: Only active queue jobs are promoted.

### 1.2. Retry Service

- **Responsibilities**: Calculates retry backoff delays and decides if a failed job should be retried or moved to the DLQ.
- **Inputs**: `job_id`, current attempt index.
- **Outputs**: Target job state (`RETRY_PENDING` or `DEAD_LETTER`).
- **Collaborating Entities**: `Job`, `RetryPolicy`.
- **Business Rules**: Uses exponential backoff with random jitter.

### 1.3. Lease Service

- **Responsibilities**: Creates, renews, and expires worker execution leases in Redis.
- **Inputs**: `job_id`, `worker_id`.
- **Outputs**: Operation success confirmation.
- **Collaborating Entities**: `Lease`, `Worker`, `Job`.
- **Business Rules**: Rejects write updates if the lease has expired or is owned by another worker.

### 1.4. Worker Assignment Service

- **Responsibilities**: Selects the next eligible job from PostgreSQL using `SELECT ... FOR UPDATE SKIP LOCKED` and assigns it to a worker.
- **Inputs**: `queue_id`, `worker_id`.
- **Outputs**: Job row (or null).
- **Collaborating Entities**: `Job`, `Worker`, `Queue`.
- **Business Rules**: Blocks claims if the queue is paused.

### 1.5. Queue Dispatch Service

- **Responsibilities**: Coordinates task ingestion, validates client payloads, and writes job records to PostgreSQL.
- **Inputs**: Job creation request payload.
- **Outputs**: Created Job ID.
- **Collaborating Entities**: `Job`, `Queue`.
- **Business Rules**: Rejects requests if project-level queue size limits are exceeded.

### 1.6. Metrics Service

- **Responsibilities**: Computes queue lengths, processing durations, and error rates.
- **Inputs**: System states.
- **Outputs**: Prometheus metric values.
- **Collaborating Entities**: `Job`, `Queue`, `Worker`.

### 1.7. Health Evaluation Service

- **Responsibilities**: Monitors worker heartbeat updates, identifies lost containers, and triggers cleanups.
- **Inputs**: Worker registry.
- **Outputs**: List of lost workers.
- **Collaborating Entities**: `Worker`, `Lease`.
- **Business Rules**: Marks workers as `LOST` if heartbeats fail for 3 consecutive intervals.
