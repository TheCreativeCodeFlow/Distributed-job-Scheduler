# Column Design Specification

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

1. [Column Specifications Matrix](#1-column-specifications-matrix)

---

## 1. Column Specifications Matrix

### 1.1. `jobs` Table

- **`id`**:
  - _Data Type_: UUID. Required.
  - _Validation_: UUID v4 format.
  - _Reason_: Primary key.
- **`queue_id`**:
  - _Data Type_: UUID. Required.
  - _Reason_: Foreign key mapping to queue.
- **`status`**:
  - _Data Type_: Enum (`SCHEDULED`, `QUEUED`, `CLAIMED`, `RUNNING`, `COMPLETED`, `FAILED`, `CANCELLED`, `DEAD_LETTER`). Required.
  - _Default_: `QUEUED`.
  - _Reason_: Tracks the state of the job.
- **`payload`**:
  - _Data Type_: JSONB. Required.
  - _Validation_: Schema checked at application layer. Maximum size 1MB.
  - _Reason_: Execution input parameters.
- **`priority`**:
  - _Data Type_: Integer. Required.
  - _Default_: `1`. Range `1` (low) to `3` (high).
  - _Reason_: Sort claims order.
- **`attempts`**:
  - _Data Type_: Integer. Required.
  - _Default_: `0`.
  - _Reason_: Track retry counts.
- **`worker_id`**:
  - _Data Type_: UUID. Nullable.
  - _Reason_: Tracks the worker currently executing the job.
- **`scheduled_at`**:
  - _Data Type_: Timestamptz. Required.
  - _Default_: `NOW()`.
  - _Reason_: Scheduled start time.
- **`idempotency_key`**:
  - _Data Type_: String. Nullable.
  - _Reason_: Prevents duplicate scheduling.

### 1.2. `job_executions` Table

- **`id`**:
  - _Data Type_: UUID. Required. Primary key.
- **`job_id`**:
  - _Data Type_: UUID. Required. Foreign key to parent job.
- **`worker_id`**:
  - _Data Type_: UUID. Required. Foreign key to processing worker.
- **`status`**:
  - _Data Type_: Enum (`SUCCESS`, `ERROR`). Required.
- **`error_log`**:
  - _Data Type_: Text. Nullable.
  - _Reason_: Stores error stack traces.
- **`started_at`**:
  - _Data Type_: Timestamptz. Required.
- **`finished_at`**:
  - _Data Type_: Timestamptz. Required.
- **`duration_ms`**:
  - _Data Type_: Integer. Required.

### 1.3. `queues` Table

- **`id`**:
  - _Data Type_: UUID. Required. Primary key.
- **`project_id`**:
  - _Data Type_: UUID. Required. Foreign key.
- **`name`**:
  - _Data Type_: String. Required. Unique within project.
- **`status`**:
  - _Data Type_: Enum (`ACTIVE`, `PAUSED`, `ARCHIVED`). Required. Default `ACTIVE`.
- **`max_concurrency`**:
  - _Data Type_: Integer. Required. Default `10`.
- **`retry_policy_id`**:
  - _Data Type_: UUID. Required. Foreign key.
