# Transaction Design

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

1. [Core Transaction Specifications](#1-core-transaction-specifications)

---

## 1. Core Transaction Specifications

### 1.1. Register Worker Transaction

- **Isolation Level**: `Read Committed`.
- **Locking Strategy**: None.
- **Rows Affected**: Inserts one row into `workers`.
- **Rollback Conditions**:
  - UUID collision.
- **Idempotency Expectations**: Assumed unique via UUID check.

### 1.2. Create Job Transaction

- **Isolation Level**: `Read Committed`.
- **Locking Strategy**: Optimistic verification check on queue status.
- **Rows Affected**: Inserts one row into `jobs`.
- **Rollback Conditions**:
  - Queue is not found or is archived.
  - Idempotency key collision.
- **Idempotency Expectations**: Duplicate request returns `409 Conflict` status.

### 1.3. Claim Job Transaction

- **Isolation Level**: `Read Committed`.
- **Locking Strategy**: Pessimistic row lock (`SELECT FOR UPDATE SKIP LOCKED`).
- **Rows Affected**: Updates one row in `jobs` (status to `CLAIMED`/`RUNNING`), inserts one row in `job_executions`.
- **Rollback Conditions**:
  - No matching jobs found.
  - PostgreSQL connection timeout.
- **Idempotency Expectations**: Rejects concurrent claims on the same row.

### 1.4. Renew Lease Transaction

- **Isolation Level**: `Read Committed`.
- **Locking Strategy**: Checked on application layer (Redis lock key TTL update).
- **Rows Affected**: None (Redis key write).
- **Rollback Conditions**: Redis write failure.

### 1.5. Complete Job Transaction

- **Isolation Level**: `Read Committed`.
- **Locking Strategy**: Row lock on the executing job row.
- **Rows Affected**: Updates one row in `jobs` (status to `COMPLETED`), updates one row in `job_executions`.
- **Rollback Conditions**:
  - Job status is not `RUNNING` or `CLAIMED`.
  - Worker ID does not match the active lease owner.

### 1.6. Retry Job Transaction

- **Isolation Level**: `Read Committed`.
- **Locking Strategy**: Row lock on the executing job row.
- **Rows Affected**: Updates one row in `jobs` (status to `RETRY_PENDING`, increment attempt count), inserts one row in `job_executions`.
- **Rollback Conditions**: Max retry limit exceeded.
