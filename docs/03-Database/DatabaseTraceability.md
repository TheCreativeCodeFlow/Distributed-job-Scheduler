# Database Traceability Matrix

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

1. [Traceability Matrix Map](#1-traceability-matrix-map)

---

## 1. Traceability Matrix Map

The following matrix traces every requirement down to its schema element, index, and transaction boundary:

| Req ID          | Bounded Context   | Aggregate Root | Target Table             | Target Index               | Transaction     | Future API Route            |
| :-------------- | :---------------- | :------------- | :----------------------- | :------------------------- | :-------------- | :-------------------------- |
| **FR-AUTH-001** | Identity & Access | Organization   | `users`                  | Primary B-Tree (`id`)      | User auth check | Login check                 |
| **FR-ORG-001**  | Organization Mgmt | Organization   | `organizations`          | Unique slug index          | Insert Org      | `POST /v1/orgs`             |
| **FR-PROJ-001** | Project Mgmt      | Project        | `projects`               | Index on `slug`            | Insert Project  | `POST /v1/projects`         |
| **FR-QUE-001**  | Queue Mgmt        | Queue          | `queues`                 | Index on `project_id`      | Pause Queue     | `POST /v1/queues/:id/pause` |
| **FR-JOB-001**  | Job Mgmt          | Job            | `jobs`                   | Index on `idempotency_key` | Create Job      | `POST /v1/jobs`             |
| **FR-JOB-002**  | Execution Context | Job            | `jobs`, `job_executions` | Partial B-Tree index       | Claim Job       | Internal Poller             |
| **FR-RET-001**  | Retry Mgmt        | Job            | `jobs`                   | B-Tree `scheduled_at`      | Retry Job       | Internal trigger            |
| **FR-DLQ-001**  | Dead Letter Queue | Job            | `dead_letter_entries`    | Index on `quarantined_at`  | Move to DLQ     | `POST /v1/jobs/:id/replay`  |
| **FR-AUD-001**  | Admin / Monitor   | Organization   | `audit_logs`             | B-Tree `created_at`        | Write Audit Log | Admin dashboard             |
