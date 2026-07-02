# Bounded Contexts Specifications

**Document Version**: 1.0.0  
**Status**: APPROVED  
**Author**: Principal Software Architect  
**Last Updated**: 2026-07-02

---

## Revision History

| Version | Date       | Description                              | Author              |
| :------ | :--------- | :--------------------------------------- | :------------------ |
| 1.0.0   | 2026-07-02 | Initial release for DDD Bounded Contexts | Principal Architect |

---

## Table of Contents

1. [Core Bounded Contexts](#1-core-bounded-contexts)
2. [Context Specifications](#2-context-specifications)

---

## 1. Core Bounded Contexts

We partition the system domain into 12 Bounded Contexts:

1. **Identity & Access Context**
2. **Organization Management Context**
3. **Project Management Context**
4. **Queue Management Context**
5. **Job Management Context**
6. **Worker Management Context**
7. **Scheduling Context**
8. **Execution Context**
9. **Retry Management Context**
10. **Dead Letter Queue (DLQ) Context**
11. **Monitoring Context**
12. **Administration Context**

---

## 2. Context Specifications

### 2.1. Identity & Access Context

- **Purpose**: Authenticates clients and dashboard operators, managing user accounts and API keys.
- **Responsibilities**: Validates user JWT tokens, signs programmatic API keys, and scopes user scopes.
- **Owned Entities**: `User`, `ApiKey`.
- **Interfaces**: REST endpoints (`POST /auth/login`, `POST /keys`).
- **Dependencies**: None.
- **Data Ownership**: PostgreSQL user auth tables.
- **Separation Reasoning**: Keeps identity code isolated from job claiming runtimes.

### 2.2. Organization Management Context

- **Purpose**: Defines billing and corporate boundaries.
- **Responsibilities**: Creates organizations and maps users to billing plans.
- **Owned Entities**: `Organization`.
- **Interfaces**: REST endpoints (`POST /organizations`).
- **Dependencies**: Identity & Access.
- **Data Ownership**: PostgreSQL organization profiles.

### 2.3. Project Management Context

- **Purpose**: Groups queues and jobs into development workspaces.
- **Responsibilities**: Maps permissions, variables, and environments.
- **Owned Entities**: `Project`.
- **Interfaces**: REST endpoints (`POST /projects`).
- **Dependencies**: Organization Management.
- **Data Ownership**: PostgreSQL project configurations.

### 2.4. Queue Management Context

- **Purpose**: Defines queue channels, pause/resume limits, and concurrency configurations.
- **Responsibilities**: Pauses, resumes, rate limits, and archives queues.
- **Owned Entities**: `Queue`, `QueueConfiguration`.
- **Interfaces**: REST queue endpoints, database query scopes.
- **Dependencies**: Project Management.
- **Data Ownership**: PostgreSQL queue configuration tables.

### 2.5. Job Management Context

- **Purpose**: Handles task creation and tracking.
- **Responsibilities**: Validates payloads, saves job metadata, and updates job states.
- **Owned Entities**: `Job`.
- **Interfaces**: REST endpoints (`POST /jobs`, `POST /jobs/:id/cancel`).
- **Dependencies**: Queue Management.
- **Data Ownership**: PostgreSQL jobs tables.

### 2.6. Worker Management Context

- **Purpose**: Manages background worker daemons.
- **Responsibilities**: Registers containers, monitors capacities, and logs worker nodes offline.
- **Owned Entities**: `Worker`.
- **Interfaces**: Worker registration endpoints, cleaner service sweeps.
- **Dependencies**: None.
- **Data Ownership**: PostgreSQL worker tables.

### 2.7. Scheduling Context

- **Purpose**: Computes scheduled triggers.
- **Responsibilities**: Parses cron expressions, calculates execution times, and triggers scheduler ticks.
- **Owned Entities**: `ScheduledJob`.
- **Interfaces**: Cron tick timer loops.
- **Dependencies**: Job Management.
- **Data Ownership**: PostgreSQL cron metadata.

### 2.8. Execution Context

- **Purpose**: Coordinates task claiming and running.
- **Responsibilities**: Governs row-level claiming, lease lock creation, and heartbeat renewals.
- **Owned Entities**: `JobExecution`, `Lease`, `Heartbeat`.
- **Interfaces**: Polling query loops.
- **Dependencies**: Worker Management, Job Management, Redis Coordination.
- **Data Ownership**: PostgreSQL execution logs and Redis lease keys.

### 2.9. Retry Management Context

- **Purpose**: Manages job retries.
- **Responsibilities**: Calculates backoffs and schedules retry executions.
- **Owned Entities**: `RetryPolicy`.
- **Interfaces**: Internal database updates.
- **Dependencies**: Execution Context.
- **Data Ownership**: PostgreSQL retry logs.

### 2.10. Dead Letter Queue (DLQ) Context

- **Purpose**: Quarantines permanently failed jobs.
- **Responsibilities**: Stores failed payloads, records error stacks, and replays failed tasks.
- **Owned Entities**: `DeadLetterEntry`.
- **Interfaces**: Dashboard explorer API.
- **Dependencies**: Job Management.
- **Data Ownership**: PostgreSQL dead letter tables.

### 2.11. Monitoring Context

- **Purpose**: Metric aggregation.
- **Responsibilities**: Tracks queue sizes, execution durations, and error rates.
- **Owned Entities**: None (value objects).
- **Interfaces**: Prometheus `/metrics` route.
- **Dependencies**: Execution Context.
- **Data Ownership**: Prometheus time-series database.

### 2.12. Administration Context

- **Purpose**: Multi-tenant resource capacity management.
- **Responsibilities**: Enforces queue caps and manages global system settings.
- **Owned Entities**: `SystemSetting`.
- **Interfaces**: REST admin endpoints.
- **Dependencies**: Organization Management.
- **Data Ownership**: PostgreSQL administration parameters.
