# Query Patterns Specification

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

1. [Core Query Patterns Specifications](#1-core-query-patterns-specifications)

---

## 1. Core Query Patterns Specifications

### 1.1. Claim Next Eligible Job

- **Query Action**: Checks PostgreSQL for queued jobs, locks the selected row, and assigns it to a worker.
- **Expected Frequency**: Continuously (up to 1,000 queries/second).
- **Performance Target**: `< 10ms` execution time.
- **Supporting Indexes**: B-Tree index on `(queue_id, priority DESC, created_at ASC) WHERE status = 'QUEUED'`.

### 1.2. Get Execution History

- **Query Action**: Retrieves execution logs for a specific job from the database.
- **Expected Frequency**: Medium (operator dashboard request).
- **Performance Target**: `< 30ms`.
- **Supporting Indexes**: Foreign key index on `job_executions(job_id)`.

### 1.3. Get Queue Metrics

- **Query Action**: Counts pending, running, and failed jobs in a queue.
- **Expected Frequency**: Every 2 seconds (dashboard SSE stream).
- **Performance Target**: `< 50ms`.
- **Supporting Indexes**: B-Tree composite index on `(queue_id, status)`.

### 1.4. Job Search by Payload Key

- **Query Action**: Finds jobs based on custom payload JSON attributes.
- **Expected Frequency**: Low (operator search).
- **Performance Target**: `< 100ms`.
- **Supporting Indexes**: GIN index on `jobs(payload jsonb_path_ops)`.

### 1.5. Clean Expired Leases

- **Query Action**: Scans active jobs to identify expired worker leases.
- **Expected Frequency**: Every 10 seconds.
- **Performance Target**: `< 20ms`.
- **Supporting Indexes**: Index on `jobs(status) WHERE status = 'RUNNING'`.
