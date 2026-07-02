# Domain Entities

**Document Version**: 1.0.0  
**Status**: APPROVED  
**Author**: Principal Software Architect  
**Last Updated**: 2026-07-02

---

## Revision History

| Version | Date       | Description                      | Author              |
| :------ | :--------- | :------------------------------- | :------------------ |
| 1.0.0   | 2026-07-02 | Initial release for DDD Entities | Principal Architect |

---

## Table of Contents

1. [Core Domain Entities](#1-core-domain-entities)
2. [Entities Detailed Specifications](#2-entities-detailed-specifications)

---

## 1. Core Domain Entities

The platform domain is modeled around the following key entities:

- **`User`**
- **`Organization`**
- **`Project`**
- **`Queue`**
- **`Job`**
- **`JobExecution`**
- **`Worker`**
- **`Lease`**
- **`RetryPolicy`**
- **`ScheduledJob`**
- **`DeadLetterEntry`**
- **`Heartbeat`**

---

## 2. Entities Detailed Specifications

### 2.1. User

- **Purpose**: Represents an authenticated developer or administrator.
- **Identity**: UUID (`user_id`).
- **Lifecycle**: Created -> Active -> Suspended -> Deleted.
- **Owned State**: email, hashed password, organization memberships, roles.
- **Business Responsibilities**: Interacts with API and web dashboard.
- **Relationships**: Maps to one or more Organizations.
- **Invariants**: Email must be unique.
- **State Transitions**: `Active` -> `Suspended` (blocks login).

### 2.2. Organization

- **Purpose**: The primary billing and tenancy boundary.
- **Identity**: UUID (`organization_id`).
- **Lifecycle**: Created -> Active -> Suspended -> Deleted.
- **Owned State**: name, billing plan status.
- **Relationships**: Owns multiple Projects and Users.
- **Invariants**: Must contain at least one owner user.

### 2.3. Project

- **Purpose**: Groups queues and isolation environments.
- **Identity**: UUID (`project_id`).
- **Lifecycle**: Active -> Archived.
- **Owned State**: name, environment variables.
- **Relationships**: Belongs to an Organization. Owns multiple Queues.

### 2.4. Queue

- **Purpose**: Represents a named execution channel for tasks.
- **Identity**: Path string: `{organization_id}:{project_id}:{queue_name}`.
- **Lifecycle**: ACTIVE -> PAUSED -> DRAINING -> DISABLED -> ARCHIVED.
- **Owned State**: concurrency limits, rate limit values.
- **Relationships**: Belongs to a Project.
- **Invariants**: Queue names must be alphanumeric and unique within a project.

### 2.5. Job

- **Purpose**: The execution unit of work.
- **Identity**: UUID (`job_id`).
- **Lifecycle**: SCHEDULED -> QUEUED -> CLAIMED -> RUNNING -> COMPLETED / FAILED / DEAD_LETTER / CANCELLED.
- **Owned State**: payload object, priority level, retry counts, scheduled execution time.
- **Relationships**: Belongs to a Queue. Owns JobExecutions.
- **Invariants**: A completed job cannot transition back to queued.
- **State Transitions**: `QUEUED` -> `CLAIMED` (worker transactional claim).

### 2.6. JobExecution

- **Purpose**: Represents a single execution attempt of a job.
- **Identity**: UUID (`execution_id`).
- **Lifecycle**: Started -> Running -> Finished.
- **Owned State**: attempt index, start time, end time, exit logs, exit status code.
- **Relationships**: Belongs to a Job. Run by a Worker.

### 2.7. Worker

- **Purpose**: Background process claiming and processing jobs.
- **Identity**: UUID (`worker_id`).
- **Lifecycle**: REGISTERING -> IDLE -> POLLING -> CLAIMING -> RUNNING -> DRAINING -> STOPPING -> OFFLINE / LOST.
- **Owned State**: concurrency capacity, active worker capabilities.
- **Relationships**: Holds Leases. Registers under Projects.

### 2.8. Lease

- **Purpose**: An exclusive runtime lock assigned to a worker for a job execution.
- **Identity**: String (`lease:{job_id}`).
- **Lifecycle**: Created -> Renewed -> Expired -> Released.
- **Owned State**: worker ID association, expiration timestamp.
- **Relationships**: Map of Worker to Job.
- **Invariants**: Only one worker can own a valid lease for a job at a time.

### 2.9. RetryPolicy

- **Purpose**: Defines backoff delays and maximum retry parameters.
- **Identity**: DB ID (`retry_policy_id`).
- **Owned State**: max attempts, backoff factor, jitter flag.
- **Relationships**: Assigned to Queues.

### 2.10. ScheduledJob

- **Purpose**: Tracks cron-driven and delayed triggers.
- **Identity**: UUID (`scheduled_job_id`).
- **Owned State**: cron string, next run time.
- **Relationships**: Owns Job records.

### 2.11. DeadLetterEntry

- **Purpose**: Tracks jobs that exhausted all retries.
- **Identity**: UUID (`dlq_id`).
- **Owned State**: job metadata snapshot, error reason, timestamp.
- **Relationships**: Map of Job.
- **Invariants**: DLQ entries are immutable.

### 2.12. Heartbeat

- **Purpose**: Signal sent by worker confirming active status.
- **Identity**: String.
- **Owned State**: worker id, timestamp.
- **Relationships**: Triggers Lease renewals.
