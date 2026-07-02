# Transaction Boundaries

**Document Version**: 1.0.0  
**Status**: APPROVED  
**Author**: Principal Software Architect  
**Last Updated**: 2026-07-02

---

## Revision History

| Version | Date       | Description                                | Author              |
| :------ | :--------- | :----------------------------------------- | :------------------ |
| 1.0.0   | 2026-07-02 | Initial release for Transaction Boundaries | Principal Architect |

---

## Table of Contents

1. [Transactional Boundaries Map](#1-transactional-boundaries-map)
2. [Commit/Rollback and Concurrency Details](#2-commitrollback-and-concurrency-details)

---

## 1. Transactional Boundaries Map

The following table documents all database transactions within the platform, specifying locks, isolation levels, and rollback conditions:

| Operation Name          | Transaction Start                   | Rows Locked                         | Isolation Level  | Commit Point                                          | Rollback Conditions                                     | Idempotency Requirements                                    |
| :---------------------- | :---------------------------------- | :---------------------------------- | :--------------- | :---------------------------------------------------- | :------------------------------------------------------ | :---------------------------------------------------------- |
| **Job Claim**           | Worker poll loop start              | Selected job row (via `FOR UPDATE`) | `Read Committed` | State updated to `CLAIMED` or `RUNNING`               | - PostgreSQL connection drops<br>- Row lock failure     | Exactly one worker claims a job. Rejects double processing. |
| **Worker Registration** | Container startup                   | None                                | `Read Committed` | Insert into `workers` committed                       | - UUID collision<br>- DB constraints errors             | UUID checks prevent duplicate records on reconnect.         |
| **Retry Scheduling**    | Execution failure catch             | Failed job row                      | `Read Committed` | State set to `RETRY_PENDING` and attempts incremented | - DB connection drops<br>- Concurrent updates conflict  | Log version checks prevent duplicate retries.               |
| **Job Completion**      | Exec task success                   | Completed job row                   | `Read Committed` | State set to `COMPLETED` and logs written             | - DB connection drops<br>- Expired lease write attempts | Check if job is still in `RUNNING` or `CLAIMED` status.     |
| **DLQ Promotion**       | Exec failure (max attempts reached) | Failed job row                      | `Read Committed` | State set to `DEAD_LETTER`                            | - DB connection drops<br>- Concurrent updates conflict  | Re-check attempt limits before writing.                     |
| **Scheduler Promotion** | Chron loop triggers                 | Due job rows                        | `Read Committed` | State updated to `QUEUED`                             | - DB connection drops<br>- Chron check timeout          | Unique time constraints prevent duplicate scheduling.       |
| **Worker Recovery**     | Cleaners loop ticks                 | Abandoned job rows                  | `Read Committed` | State reset to `QUEUED` and attempt logged            | - DB connection drops<br>- Concurrent updates conflict  | Check Redis lease expiration key.                           |

---

## 2. Commit/Rollback and Concurrency Details

### 2.1. Isolation Level Selection: Read Committed

- **Rationale**: `Read Committed` is the default PostgreSQL isolation level. It prevents dirty reads while maximizing write throughput and avoiding serialization errors.

### 2.2. Row Locking Mechanics

- **Claims**: Workers lock only the claimed job row (`FOR UPDATE SKIP LOCKED`).
- **Preventions**: Rejects table-level locks to maintain concurrent performance under load.
