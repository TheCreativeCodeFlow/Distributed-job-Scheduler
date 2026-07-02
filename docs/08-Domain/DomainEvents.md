# Domain Events

**Document Version**: 1.0.0  
**Status**: APPROVED  
**Author**: Principal Software Architect  
**Last Updated**: 2026-07-02

---

## Revision History

| Version | Date       | Description                           | Author              |
| :------ | :--------- | :------------------------------------ | :------------------ |
| 1.0.0   | 2026-07-02 | Initial release for DDD Domain Events | Principal Architect |

---

## Table of Contents

1. [Core Domain Events Mapping](#1-core-domain-events-mapping)

---

## 1. Core Domain Events Mapping

The following catalog defines the events raised within the domain boundaries:

| Event Name                 | Producer          | Consumers          | Payload Schema                        | Business Significance                        | Ordering      |
| :------------------------- | :---------------- | :----------------- | :------------------------------------ | :------------------------------------------- | :------------ |
| **JobCreated**             | Job Ingestion API | Dashboard, Logger  | `{job_id, queue_id, created_at}`      | Job metadata written to PostgreSQL.          | Chronological |
| **JobScheduled**           | Job Ingestion API | Scheduler          | `{job_id, scheduled_at}`              | Job scheduled for future execution.          | Chronological |
| **JobClaimed**             | Worker Service    | Dashboard          | `{job_id, worker_id, claimed_at}`     | Worker locked row via SQL claim transaction. | Strict        |
| **JobStarted**             | Worker Service    | Dashboard, Metrics | `{job_id, worker_id, started_at}`     | Worker started execution of payload.         | Strict        |
| **HeartbeatReceived**      | Worker Service    | Lease Service      | `{worker_id, lease_id, timestamp}`    | Worker active execution confirmation.        | None          |
| **LeaseRenewed**           | Lease Service     | Dashboard          | `{job_id, worker_id, expires_at}`     | Redis lease key TTL extended by 30 seconds.  | None          |
| **JobCompleted**           | Worker Service    | Dashboard, Metrics | `{job_id, duration_ms, completed_at}` | Task completed successfully.                 | Strict        |
| **JobFailed**              | Worker Service    | Retry Service      | `{job_id, error_details}`             | Task threw a runtime execution exception.    | Strict        |
| **RetryScheduled**         | Retry Service     | Scheduler          | `{job_id, retry_attempt, run_at}`     | Task rescheduled with backoff delay.         | Strict        |
| **RetryExhausted**         | Retry Service     | DLQ Service        | `{job_id, attempts}`                  | Task retry limit reached.                    | Strict        |
| **MovedToDeadLetterQueue** | DLQ Service       | Dashboard, Alerts  | `{job_id, dlq_id, failure_reason}`    | Task isolated in DLQ for manual audit.       | Strict        |
| **WorkerRegistered**       | Worker Service    | Dashboard          | `{worker_id, capacity}`               | Worker registered capacity in database.      | Chronological |
| **WorkerLost**             | Health Service    | Cleaner Service    | `{worker_id, lost_at}`                | Worker failed heartbeats; lease revoked.     | Chronological |
| **QueuePaused**            | Admin API         | Worker Service     | `{queue_id, paused_at}`               | Queue paused; stops claims.                  | Strict        |
| **QueueResumed**           | Admin API         | Worker Service     | `{queue_id, resumed_at}`              | Queue resumed; allows claims.                | Strict        |
