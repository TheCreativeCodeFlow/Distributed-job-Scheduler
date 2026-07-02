# Logical Data Model

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

1. [Logical Entity Relationship Diagram](#1-logical-entity-relationship-diagram)
2. [Relationship Specifications](#2-relationship-specifications)
3. [Aggregate Boundaries Mapping](#3-aggregate-boundaries-mapping)

---

## 1. Logical Entity Relationship Diagram

```mermaid
erDiagram
    ORGANIZATION ||--|{ USER_MEMBERSHIP : contains
    USER ||--|{ USER_MEMBERSHIP : belongs_to
    ORGANIZATION ||--|{ PROJECT : owns
    PROJECT ||--|{ QUEUE : partitions
    QUEUE ||--|| RETRY_POLICY : configures
    QUEUE ||--|{ JOB : groups
    JOB ||--|{ JOB_EXECUTION : attempts
    JOB ||--|| SCHEDULED_JOB : schedules
    JOB ||--|? DEAD_LETTER_ENTRY : quarantines
    WORKER ||--|{ WORKER_LEASE : holds
    JOB_EXECUTION ||--|? WORKER_LEASE : locks
```

---

## 2. Relationship Specifications

### 2.1. Organization to Project (One-to-Many)

- **Cardinality**: `1:N` (An organization owns zero or more projects; a project belongs to exactly one organization).
- **Mandatory**: Yes (Project cannot exist without organization).
- **Cascade**: Deleting organization cascade-deletes projects.

### 2.2. Project to Queue (One-to-Many)

- **Cardinality**: `1:N` (A project partitions multiple queues).
- **Mandatory**: Yes.
- **Cascade**: Deleting project cascade-deletes queues.

### 2.3. Queue to Job (One-to-Many)

- **Cardinality**: `1:N` (A queue holds zero or more jobs).
- **Mandatory**: Yes.
- **Delete Restrict**: Deleting a queue is blocked if active jobs remain.

### 2.4. Job to JobExecution (One-to-Many)

- **Cardinality**: `1:N` (A job has zero or more execution attempts).
- **Mandatory**: Yes (Execution log maps to exactly one job).
- **Cascade**: Cascade-delete logs on job delete.

---

## 3. Aggregate Boundaries Mapping

- **Organization Aggregate**: Encloses `ORGANIZATION` and `USER_MEMBERSHIP`.
- **Project Aggregate**: Encloses `PROJECT`.
- **Queue Aggregate**: Encloses `QUEUE` and `RETRY_POLICY`.
- **Job Aggregate**: Encloses `JOB`, `JOB_EXECUTION`, `DEAD_LETTER_ENTRY`, and `SCHEDULED_JOB`.
- **Worker Aggregate**: Encloses `WORKER` and `WORKER_LEASE`.
