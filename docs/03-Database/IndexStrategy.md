# Index Strategy

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

1. [Target Indexes List](#1-target-indexes-list)
2. [Indexes Specifications](#2-indexes-specifications)

---

## 1. Target Indexes List

To optimize queries, the database schema utilizes:

- Primary key B-Tree indexes.
- Unique constraint composite indexes.
- Partial indexes for state queries.
- GIN indexes for JSONB payload queries.

---

## 2. Indexes Specifications

### 2.1. `jobs` Claim Query Index (Partial Composite Index)

- **Index Definition**: B-Tree index on `(queue_id, priority DESC, created_at ASC)` WHERE `status = 'QUEUED'`.
- **Query Pattern Supported**: Worker claiming queries (`SELECT ... FOR UPDATE SKIP LOCKED`).
- **Business Justification**: Workers continuously query `QUEUED` jobs. Indexing only queued tasks reduces index size and speeds up scans.
- **Selectivity**: Extremely high.
- **Maintenance Cost**: Low (the index only updates when status changes).

### 2.2. `jobs` Idempotency Index (Unique Partial Index)

- **Index Definition**: Unique index on `(project_id, idempotency_key)` WHERE `idempotency_key IS NOT NULL`.
- **Query Pattern Supported**: Job submission verification.
- **Business Justification**: Prevents clients from scheduling duplicate jobs.
- **Selectivity**: Complete.
- **Maintenance Cost**: Low.

### 2.3. `jobs` Payload Query Index (GIN Index)

- **Index Definition**: GIN index on `payload` using `jsonb_path_ops`.
- **Query Pattern Supported**: Job search by custom payload parameters.
- **Business Justification**: Enables operators to search for jobs containing specific payload keys from the dashboard.
- **Selectivity**: Variable.
- **Maintenance Cost**: High (writes update index nodes).

### 2.4. `job_executions` Date Search Index (B-Tree Index)

- **Index Definition**: B-Tree index on `(started_at DESC)`.
- **Query Pattern Supported**: Fetching recent executions for dashboard charts.
- **Business Justification**: Speeds up dashboard queries.
- **Selectivity**: High.
- **Maintenance Cost**: Medium.
