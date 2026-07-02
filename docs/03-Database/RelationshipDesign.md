# Relationship Design

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

1. [Referential Relationships Mapping](#1-referential-relationships-mapping)
2. [Cascade & Delete Restrictions Rules](#2-cascade--delete-restrictions-rules)

---

## 1. Referential Relationships Mapping

The database enforces data integrity through explicit relationship rules:

### 1.1. One-to-One (1:1)

- **`Queue` ↔ `RetryPolicy`**: A queue maps to exactly one retry policy rule.
- _Referential Rule_: Foreign key exists on `queues` table referencing `retry_policies(id)`.

### 1.2. One-to-Many (1:N)

- **`Project` ↔ `Queue`**: A project contains multiple queues.
- **`Queue` ↔ `Job`**: A queue contains multiple scheduled and executing jobs.
- **`Job` ↔ `JobExecution`**: A job can have multiple execution attempts.

### 1.3. Many-to-Many (N:M)

- **`User` ↔ `Organization`**: Scoped via a link table (`organization_members`).
- _Referential Rule_: Link table contains composite primary key `(user_id, organization_id)`.

---

## 2. Cascade & Delete Restrictions Rules

To prevent orphan records and accidental deletions, the schema configures specific foreign key delete actions:

- **Cascade Delete (`ON DELETE CASCADE`)**:
  - `organizations` → `projects`: Deleting an organization deletes all child projects.
  - `projects` → `queues`: Deleting a project deletes all associated queues.
  - `jobs` → `job_executions`: Deleting a job purges its associated execution attempt logs.

- **Delete Restrict (`ON DELETE RESTRICT`)**:
  - `queues` → `jobs`: Deleting a queue is blocked if it contains active jobs.
  - `workers` → `job_executions`: Deleting a worker record does not delete its execution logs (the worker ID foreign key is set to null or kept for audit history).
