# Functional Requirements Specification

**Document Version**: 1.0.0  
**Status**: APPROVED  
**Author**: Principal Software Architect  
**Last Updated**: 2026-07-02

---

## Revision History

| Version | Date       | Description                             | Author              |
| :------ | :--------- | :-------------------------------------- | :------------------ |
| 1.0.0   | 2026-07-02 | Initial release for Architecture Review | Principal Architect |

---

## Table of Contents

1. [Authentication](#1-authentication)
2. [Organizations](#2-organizations)
3. [Projects](#3-projects)
4. [Queues](#4-queues)
5. [Jobs](#5-jobs)
6. [Scheduler Engine](#6-scheduler-engine)
7. [Workers](#7-workers)
8. [Retry Engine](#8-retry-engine)
9. [Dead Letter Queue (DLQ)](#9-dead-letter-queue-dlq)
10. [Dashboard](#10-dashboard)
11. [Metrics](#11-metrics)
12. [Logging](#12-logging)
13. [Monitoring](#13-monitoring)
14. [Notifications](#14-notifications)
15. [Administration](#15-administration)
16. [Role-Based Access Control (RBAC) Permission Matrix](#16-role-based-access-control-rbac-permission-matrix)
17. [State Machine Transition Constraints](#17-state-machine-transition-constraints)

---

## 1. Authentication

### FR-AUTH-001: JWT Authentication

- **Description**: The API gateway must validate JWT tokens for all incoming HTTP requests to protected endpoints.
- **Priority**: Must
- **Acceptance Criteria**:
  - Unauthenticated requests return a `401 Unauthorized` status with an error schema response.
  - JWT signature and expiration verification must occur before parsing resource IDs.

### FR-AUTH-002: API Key Management

- **Description**: Users must be able to generate and revoke API keys for programmatic job creation.
- **Priority**: Must
- **Acceptance Criteria**:
  - API keys must be securely hashed in the database (SHA-256) and display only once upon creation.
  - Keys must carry prefixes (`djs_live_` or `djs_test_`) for clear environment identification.

---

## 2. Organizations

### FR-ORG-001: Organization Creation

- **Description**: Users must be able to create organizations to act as primary administrative boundaries.
- **Priority**: Must
- **Acceptance Criteria**:
  - Each organization must have a unique identifier and owner ID.
  - All jobs and workers must belong to a project within an organization.

---

## 3. Projects

### FR-PROJ-001: Project Partitioning

- **Description**: Organizations must support partitioning resources into multiple projects.
- **Priority**: Must
- **Acceptance Criteria**:
  - Project deletion must cascade-delete configuration metadata but preserve historical execution logs.

---

## 4. Queues

### FR-QUE-001: Queue Pause and Resume

- **Description**: Administrators must be able to pause and resume individual execution queues.
- **Priority**: Must
- **Acceptance Criteria**:
  - When a queue is paused, workers cannot claim jobs from it.
  - Pausing a queue must not disrupt jobs currently in execution.

### FR-QUE-002: Queue Rate Limiting

- **Description**: Queues must support rate-limiting configurations (e.g. maximum jobs processed per second).
- **Priority**: Should
- **Acceptance Criteria**:
  - Jobs ready to trigger that exceed the limit must remain queued in the broker.

---

## 5. Jobs

### FR-JOB-001: Support Dynamic Job Types

- **Description**: The system must support immediate, delayed, scheduled, recurring, and batch jobs.
- **Priority**: Must
- **Acceptance Criteria**:
  - Delayed jobs accept an offset parameter (in seconds).
  - Scheduled jobs accept an ISO-8601 UTC timestamp.
  - Recurring jobs accept a valid cron pattern.

### FR-JOB-002: Batch Jobs & DAG Chains

- **Description**: The system must coordinate batch execution groups and sequential execution chains.
- **Priority**: Should
- **Acceptance Criteria**:
  - A child job must only execute after all its parent jobs have completed successfully.

---

## 6. Scheduler Engine

### FR-SCH-001: Cron Parsing and Tick Evaluation

- **Description**: The scheduler must regularly parse cron configurations and enqueue job triggers on time.
- **Priority**: Must
- **Acceptance Criteria**:
  - Evaluation sweeps must execute every minute.
  - Multi-instance schedulers must utilize distributed locks to prevent duplicate enqueuing.

---

## 7. Workers

### FR-WRK-001: Atomic Job Claiming

- **Description**: Multiple workers must poll queues without duplicate task execution.
- **Priority**: Must
- **Acceptance Criteria**:
  - Workers must use atomic transactions (e.g. Redis transactions or PostgreSQL SELECT FOR UPDATE) to claim jobs.
  - The claiming worker receives the job ID and sets a lease duration.

### FR-WRK-002: Worker Heartbeats and Leases

- **Description**: Workers must report heartbeats to renew active job leases.
- **Priority**: Must
- **Acceptance Criteria**:
  - If a worker dies and its heartbeat fails to renew the lease, the lease expires.
  - Expired jobs must automatically return to the queue for execution by other workers.

---

## 8. Retry Engine

### FR-RTY-001: Exponential Backoff with Jitter

- **Description**: Failed jobs must be retried based on configured backoff limits.
- **Priority**: Must
- **Acceptance Criteria**:
  - Retries must use exponential backoff (`delay = initial_delay * (factor ^ attempt)`) plus a random jitter.
  - Retries must stop once the maximum retry count is reached.

---

## 9. Dead Letter Queue (DLQ)

### FR-DLQ-001: Job Quarantine

- **Description**: Jobs that exceed their maximum retry limit must be moved to the Dead Letter Queue (DLQ).
- **Priority**: Must
- **Acceptance Criteria**:
  - Quarantined jobs must update their state to `DEAD` and store final execution error details.
  - Administrators must be able to replay (retry) or delete jobs in the DLQ.

---

## 10. Dashboard

### FR-DSH-001: Real-time Status Board

- **Description**: The web dashboard must show queue statistics, active workers, and job statuses.
- **Priority**: Should
- **Acceptance Criteria**:
  - Update latency for active execution summaries must be `< 1s`.

---

## 11. Metrics

### FR-MET-001: Queue Metrics Logging

- **Description**: The system must track execution counts, failure rates, queue backlog counts, and runtimes.
- **Priority**: Must
- **Acceptance Criteria**:
  - Store metrics in memory or TSDB and export them to Prometheus format endpoints.

---

## 12. Logging

### FR-LOG-001: Structured Auditing Logs

- **Description**: All API access, job state transitions, and worker heartbeats must produce structured JSON logs.
- **Priority**: Must
- **Acceptance Criteria**:
  - Every log must contain `timestamp`, `log_level`, `correlation_id`, `organization_id`, and `context`.

---

## 13. Monitoring

### FR-MON-001: Starved Queue Alarms

- **Description**: The monitoring system must trigger alerts if job delays exceed thresholds.
- **Priority**: Should
- **Acceptance Criteria**:
  - Alert triggers if a job remains in `PENDING` state for more than 5 minutes past its scheduled execution time.

---

## 14. Notifications

### FR-NTF-001: Webhook Alerts

- **Description**: The system must send webhook requests when job execution transitions fail or jobs land in the DLQ.
- **Priority**: Could
- **Acceptance Criteria**:
  - Webhooks must support retry limits and verify signatures.

---

## 15. Administration

### FR-ADM-001: System Capacity Limit Management

- **Description**: Administrators must be able to restrict queue size caps per tenant project.
- **Priority**: Should
- **Acceptance Criteria**:
  - If a project exceeds its queue size limit, the API must reject new jobs with a `429 Too Many Requests` status.

---

## 16. Role-Based Access Control (RBAC) Permission Matrix

The following table summarizes the allowed and restricted operations across different user roles.

| Operation                    | System Administrator | Organization Owner | Organization Administrator | Project Maintainer | Developer | Read-Only Viewer |
| :--------------------------- | :------------------: | :----------------: | :------------------------: | :----------------: | :-------: | :--------------: |
| **Create Organization**      |          ✅          |         ❌         |             ❌             |         ❌         |    ❌     |        ❌        |
| **Delete Organization**      |          ✅          |         ✅         |             ❌             |         ❌         |    ❌     |        ❌        |
| **Create Project**           |          ✅          |         ✅         |             ✅             |         ❌         |    ❌     |        ❌        |
| **Manage Queue**             |          ✅          |         ✅         |             ✅             |         ✅         |    ❌     |        ❌        |
| **Pause Queue**              |          ✅          |         ✅         |             ✅             |         ✅         |    ❌     |        ❌        |
| **Resume Queue**             |          ✅          |         ✅         |             ✅             |         ✅         |    ❌     |        ❌        |
| **Create Job**               |          ✅          |         ✅         |             ✅             |         ✅         |    ✅     |        ❌        |
| **Retry Job**                |          ✅          |         ✅         |             ✅             |         ✅         |    ✅     |        ❌        |
| **Delete Job**               |          ✅          |         ✅         |             ✅             |         ✅         |    ❌     |        ❌        |
| **View Logs**                |          ✅          |         ✅         |             ✅             |         ✅         |    ✅     |        ✅        |
| **View Metrics**             |          ✅          |         ✅         |             ✅             |         ✅         |    ✅     |        ✅        |
| **Manage Workers**           |          ✅          |         ✅         |             ✅             |         ✅         |    ❌     |        ❌        |
| **Configure Retry Policies** |          ✅          |         ✅         |             ✅             |         ✅         |    ❌     |        ❌        |
| **System Settings**          |          ✅          |         ❌         |             ❌             |         ❌         |    ❌     |        ❌        |

---

## 17. State Machine Transition Constraints

### 17.1. Job State Constraints

- **Uniqueness**: A job can occupy exactly one state at any given millisecond.
- **Terminal States**: The states `COMPLETED`, `CANCELLED`, and `DEAD_LETTER` are terminal. No transitions out of these states are allowed.
- **Direct Queue Bypass**: A job cannot transition directly from `SCHEDULED` to `RUNNING` or `CLAIMED` without first entering the `QUEUED` state.
- **Invalid Re-executions**: A job cannot transition from `COMPLETED` or `DEAD_LETTER` back to `QUEUED` or `CLAIMED` unless an administrator explicitly triggers a retry request (which creates a new attempt log).

### 17.2. Worker State Constraints

- **Registration Prerequisite**: A worker cannot enter the `IDLE`, `POLLING`, or `RUNNING` states without first completing the `REGISTERING` state.
- **Zombie Prevention**: If a worker node is in `LOST` state, any attempt to report heartbeats must fail, forcing the worker to re-register (`LOST` -> `REGISTERING`).
- **Draining Isolation**: Once a worker enters `DRAINING` or `STOPPING`, it is barred from entering the `POLLING` or `CLAIMING` state.

### 17.3. Queue State Constraints

- **Paused Queue claims**: A queue in the `PAUSED` state prohibits transitions of its child jobs from `QUEUED` to `CLAIMED`.
- **Archive Isolation**: A queue in the `ARCHIVED` state cannot transition back to `ACTIVE` or receive new jobs (it is read-only metadata).
