# Business Rules

**Document Version**: 1.0.0  
**Status**: APPROVED  
**Author**: Principal Software Architect  
**Last Updated**: 2026-07-02

---

## Revision History

| Version | Date       | Description                            | Author              |
| :------ | :--------- | :------------------------------------- | :------------------ |
| 1.0.0   | 2026-07-02 | Initial release for DDD Business Rules | Principal Architect |

---

## Table of Contents

1. [Core Business Rules Classifications](#1-core-business-rules-classifications)

---

## 1. Core Business Rules Classifications

### 1.1. Critical Severity

- **Rule 1: Completed Jobs are Terminal**
  - _Description_: Completed jobs (`COMPLETED` status) cannot be retried directly. To execute a completed job flow again, a new job record must be submitted.
- **Rule 2: Valid Lease Requirement**
  - _Description_: A worker must hold a valid lease lock in Redis (`lease:{job_id}`) to execute a job payload.
- **Rule 3: Lease Expiration Ownership Revocation**
  - _Description_: If a Redis lease key expires, the worker loses execution rights. Any write updates from that worker are rejected in PostgreSQL.
- **Rule 4: Mutually Exclusive Execution**
  - _Description_: No job can have multiple active owners (workers) at the same millisecond.

### 1.2. High Severity

- **Rule 5: Retries Create New Execution Logs**
  - _Description_: Every job execution retry must create a new execution log record in the database instead of overwriting historical records.
- **Rule 6: Paused Queue Dispatch Prevention**
  - _Description_: A paused queue (`PAUSED` state) blocks workers from claiming new jobs.
- **Rule 7: Dead Letter Queue Immutability**
  - _Description_: Jobs quarantined in the Dead Letter Queue (`DEAD_LETTER` state) are immutable. Their payloads and metadata snapshot cannot be modified.

### 1.3. Medium Severity

- **Rule 8: One Execution per Job Map**
  - _Description_: Every execution log entry must map to exactly one job record in the database.
- **Rule 9: Heartbeat Extension Requirement**
  - _Description_: Every worker heartbeat must target an active lease key, extending the TTL by 30 seconds.
- **Rule 10: State Transition Auditing**
  - _Description_: Every job state transition must be recorded in the `job_execution_log` table.

### 1.4. Low Severity

- **Rule 11: Queue Size Limit Enforcements**
  - _Description_: Project-level queue size configurations restrict the maximum number of pending jobs allowed in PostgreSQL.
