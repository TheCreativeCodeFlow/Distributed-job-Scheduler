# Requirement Traceability Matrix

**Document Version**: 1.0.0  
**Status**: APPROVED  
**Author**: Principal Software Architect  
**Last Updated**: 2026-07-02

---

## Revision History

| Version | Date       | Description                          | Author              |
| :------ | :--------- | :----------------------------------- | :------------------ |
| 1.0.0   | 2026-07-02 | Initial release for DDD Traceability | Principal Architect |

---

## Table of Contents

1. [Traceability Matrix Map](#1-traceability-matrix-map)

---

## 1. Traceability Matrix Map

The following matrix maps our core functional requirements to the domain model, future APIs, and database tables:

| Requirement ID                      | Bounded Context    | Target Aggregate | Domain Entity / VO    | Domain Service    | Future API Route            | Future DB Table          |
| :---------------------------------- | :----------------- | :--------------- | :-------------------- | :---------------- | :-------------------------- | :----------------------- |
| **FR-AUTH-001** (JWT Validate)      | Identity & Access  | Organization     | `User`, `ApiKey`      | Auth Handler      | Any protected route         | `users`, `api_keys`      |
| **FR-ORG-001** (Org Create)         | Organization Mgmt  | Organization     | `Organization`        | Org Service       | `POST /v1/orgs`             | `organizations`          |
| **FR-PROJ-001** (Project Partition) | Project Mgmt       | Project          | `Project`             | Project Service   | `POST /v1/projects`         | `projects`               |
| **FR-QUE-001** (Pause/Resume)       | Queue Mgmt         | Queue            | `Queue`               | Queue Service     | `POST /v1/queues/:id/pause` | `queues`                 |
| **FR-JOB-001** (Job Submission)     | Job Mgmt           | Job              | `Job`, `JobPayload`   | Dispatch Service  | `POST /v1/jobs`             | `jobs`                   |
| **FR-JOB-002** (Job Claim)          | Execution Context  | Job              | `Job`, `JobExecution` | Claim Service     | Internal Poller             | `jobs`, `job_executions` |
| **FR-JOB-003** (Heartbeat)          | Execution Context  | Worker           | `Lease`, `Heartbeat`  | Lease Service     | `POST /v1/workers/:id/hb`   | Redis Cache keys         |
| **FR-REC-001** (Cron Evaluate)      | Scheduling Context | Job              | `ScheduledJob`        | Scheduler Service | Timer trigger               | `scheduled_jobs`         |
| **FR-RET-001** (Retry Trigger)      | Retry Mgmt         | Job              | `RetryPolicy`         | Retry Service     | Internal trigger            | `jobs`, `retry_logs`     |
| **FR-DLQ-001** (Move to DLQ)        | Dead Letter Queue  | Job              | `DeadLetterEntry`     | DLQ Service       | `POST /v1/jobs/:id/replay`  | `dead_letter_entries`    |
