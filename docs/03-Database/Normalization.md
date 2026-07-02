# Normalization Strategy

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

1. [Normalization Review (1NF, 2NF, 3NF, BCNF)](#1-normalization-review-1nf-2nf-3nf-bcnf)
2. [Intentional Denormalization Specs](#2-intentional-denormalization-specs)

---

## 1. Normalization Review (1NF, 2NF, 3NF, BCNF)

The schema design adheres to strict normalization forms:

### 1.1. First Normal Form (1NF)

- **Rule**: All columns contain atomic values, and there are no repeating groups.
- **Verification**: Payloads are stored inside standard JSONB structures; individual elements are queried using JSON indexing. No comma-separated strings are used.

### 1.2. Second Normal Form (2NF)

- **Rule**: Meets 1NF, and all non-key attributes are fully dependent on the primary key.
- **Verification**: In `organization_members` link tables, membership roles depend on the composite key `(user_id, organization_id)`.

### 1.3. Third Normal Form (3NF) & BCNF

- **Rule**: Meets 2NF, and no transitive dependencies exist.
- **Verification**: Queue parameters (concurrency, retry policies) are kept in `queues` and `retry_policies` tables, not duplicated in the `jobs` table.

---

## 2. Intentional Denormalization Specs

To support performance and audit requirements:

### 2.1. Duplicating Configuration in Job Executions (`job_executions`)

- **Denormalized Columns**: `queue_max_concurrency`, `retry_policy_max_attempts`.
- **Reasoning**: If an operator modifies a queue's retry count, historical logs must display the configuration values _at the time of execution_. Storing these parameters in the execution log snapshot prevents retroactively changing history.
- **Consistency Guard**: These columns are write-once during worker commits.
