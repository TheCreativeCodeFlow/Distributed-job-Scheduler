# Non-Functional Requirements Specification

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

1. [Performance](#1-performance)
2. [Availability](#2-availability)
3. [Scalability](#3-scalability)
4. [Reliability](#4-reliability)
5. [Concurrency](#5-concurrency)
6. [Consistency](#6-consistency)
7. [Security](#7-security)
8. [Maintainability](#8-maintainability)
9. [Observability](#9-observability)
10. [Auditability](#10-auditability)
11. [Extensibility](#11-extensibility)
12. [Accessibility](#12-accessibility)
13. [Usability](#13-thought-usability)
14. [Internationalization](#14-internationalization)

---

## 1. Performance

### NFR-PERF-001: API Ingestion Latency

- **Target**: Average API response time for job scheduling must be `< 50ms`. 99th percentile response time must be `< 150ms`.
- **Measurement**: Tracked using HTTP gateway logs under a simulated load of 5,000 requests/sec.

### NFR-PERF-002: Scheduling Latency

- **Target**: The delay between a job's scheduled time and its dispatch to the queue must be `< 500ms` under normal operating conditions.
- **Measurement**: Difference between `scheduled_at` timestamp and actual execution start timestamp.

---

## 2. Availability

### NFR-AV-001: System Uptime SLA

- **Target**: The API gateway and worker execution nodes must provide `99.99%` uptime (excluding planned maintenance).
- **Measurement**: Verified using monitoring probes checked every 10 seconds.

### NFR-AV-002: Recovery Time Objective (RTO)

- **Target**: Database failover and queue recovery must complete within 30 seconds.
- **Measurement**: Maximum time elapsed from a master node crash until a standby node takes over.

---

## 3. Scalability

### NFR-SC-001: Horizontal Scaling

- **Target**: The system must scale horizontally up to 100 API gateway nodes and 1,000 worker containers without performance degradation.
- **Measurement**: Load-tested in container staging environments.

### NFR-SC-002: Broker Storage Throughput

- **Target**: The Redis queue broker must support processing up to 100,000 concurrent jobs in flight.
- **Measurement**: Monitored using Redis memory utilization benchmarks.

### NFR-SC-003: Operational Scaling Targets

- **Target**: The system must support the following SaaS scale targets:
  - **Maximum Organizations**: 10,000 active organizations.
  - **Maximum Users**: 100,000 registered users.
  - **Projects per Organization**: Up to 50 projects.
  - **Queues per Project**: Up to 20 queues.
  - **Workers per Queue**: Up to 100 active worker containers.
  - **Concurrent Workers**: Up to 1,000 active workers system-wide.
  - **Queued Jobs (Backlog)**: Up to 10,000,000 pending jobs stored in PostgreSQL database.
  - **Running Jobs**: Up to 50,000 concurrent executions system-wide.
  - **Job Executions per Day**: Up to 100,000,000 completions/day.
  - **Retry Throughput**: Up to 5,000 job retries processed/second.
  - **Dashboard Users**: Up to 200 concurrent active monitoring dashboard WebSocket/SSE connections.
  - **API Ingestion Rate**: Up to 5,000 requests/second write load.
  - **Scheduler Throughput**: Up to 1,000 recurring job triggers enqueued/second.
  - **Background Polling Frequency**: Average 1 second sleep interval per idle worker polling Redis.
- **Measurement**: Evaluated using load testing frameworks (k6, Locust) on a replica sandbox environment.

---

## 4. Reliability

### NFR-REL-001: At-Least-Once Delivery

- **Target**: Guarantee at-least-once job execution. The job failure rate due to system crashes must be `0.00%`.
- **Measurement**: System audit logs comparing enqueued tasks with final logs.

### NFR-REL-002: Fault-Tolerant Lock Renewal

- **Target**: Worker heartbeats must renew locks every 10 seconds. Missing 3 heartbeats (30 seconds) must mark the job as abandoned and ready for retry.
- **Measurement**: Simulated worker container termination tests.

---

## 5. Concurrency

### NFR-CON-001: Concurrency Limits

- **Target**: Workers must respect per-queue and per-tenant concurrency limits.
- **Measurement**: Assessed using concurrent mock test scripts.

---

## 6. Consistency

### NFR-CS-001: Eventual State Consistency

- **Target**: Execution states in PostgreSQL must reconcile with active Redis queue states within 2 seconds.
- **Measurement**: Auditing sync tests.

---

## 7. Security

### NFR-SEC-001: Encryption at Rest and in Transit

- **Target**: All external and internal traffic must use TLS 1.3. Database storage must be encrypted at rest using AES-256.
- **Measurement**: Security port scan reports and database properties audits.

### NFR-SEC-002: Tenant Isolation

- **Target**: Tenants cannot access, poll, or modify jobs belonging to other organizations.
- **Measurement**: Automated penetration testing scripts.

### NFR-SEC-003: JWT and Session Token Strategy

- **Target**: Access tokens must be signed via RS256 with key rotation support. Access tokens expire after 15 minutes. Refresh tokens must use slide-expiration, be stored in HttpOnly, Secure, SameSite=Strict cookies, and undergo refresh token rotation (RTR) on each use.
- **Measurement**: Code audits and proxy interception checks.

### NFR-SEC-004: Secret Management and Secure Defaults

- **Target**: No API keys, credentials, or encryption keys can exist in source files. Secrets must be injected at runtime using environment variables mapped from a secure vault (AWS Secrets Manager/KMS). All API ports, dashboards, and services must default to closed/authentication required.
- **Measurement**: Static code scan tools (git-secrets, Trufflehog) on build pipelines.

### NFR-SEC-005: Attack Vectors Prevention

- **Target**: Prevent standard web vulnerabilities:
  - **SQL Injection**: Enforced via Prisma ORM parameterized queries (raw SQL queries are prohibited).
  - **Cross-Site Scripting (XSS)**: Escaping variables in UI dashboard layouts, and deploying strict Content Security Policy (CSP) headers.
  - **Cross-Site Request Forgery (CSRF)**: Enforcing SameSite=Strict cookies, and validating CSRF tokens for mutating HTTP requests.
  - **Replay Attacks**: Checking unique idempotency keys on job scheduling APIs.
- **Measurement**: Automated vulnerability scanner scans (OWASP ZAP) during staging deployments.

### NFR-SEC-006: Audit Logging and PII Handling

- **Target**: Sensitive database columns (e.g. user emails, encrypted secrets) must be encrypted using cryptographically secure algorithms. Logs must strip out PII, access tokens, passwords, and authorization keys.
- **Measurement**: Code reviewers check log schema rules.

---

## 8. Maintainability

### NFR-MNT-001: Local Development Setup

- **Target**: A new developer must be able to bootstrap and run the local development environment in `< 5 minutes`.
- **Measurement**: Time tracked on clean system setups using `./scripts/bootstrap.sh`.

---

## 9. Observability

### NFR-OBS-001: Prometheus Export

- **Target**: System metrics must be exported to Prometheus endpoints under 15-second scrape intervals.
- **Measurement**: Prometheus dashboard connectivity audits.

### NFR-OBS-002: Structured Logging Standards

- **Target**: All application logs must be serialized to JSON and include:
  - `timestamp`: UTC ISO-8601 format.
  - `level`: `DEBUG`, `INFO`, `WARN`, or `ERROR`.
  - `correlation_id`: Context trace ID propagating across HTTP headers and worker execution steps.
  - `request_id`: Generated on the API gateway for HTTP context tracing.
  - `worker_id`: Unique identifier of the processing worker daemon.
  - `queue_id`: Target queue reference.
- **Measurement**: Code inspections and testing against log parsers.

### NFR-OBS-003: Distributed Tracing and OpenTelemetry Compatibility

- **Target**: Core scheduling libraries, API gateways, and workers must use OpenTelemetry-compatible tracing wrappers, enabling trace context propagation using standard W3C Trace Context headers.
- **Measurement**: Testing traces collection against compatible visualizers (Jaeger, Zipkin).

### NFR-OBS-004: Health Check Probes

- **Target**: API nodes and workers must expose health endpoints:
  - `/health`: Liveness probe. Returns 200 OK.
  - `/ready`: Readiness probe. Verifies active connections to PostgreSQL and Redis.
- **Measurement**: Simulated network termination checks.

### NFR-OBS-005: Operational Alerting

- **Target**: Alerting triggers must deploy when:
  - Database connectivity is down for `> 10 seconds`.
  - Job failure rate in a queue exceeds `5%` in a 5-minute sliding window.
  - Jobs remain `PENDING` for `> 5 minutes` past scheduled time.
  - DLQ queue contains `> 100` new quarantined dead letter tasks.
- **Measurement**: Chaos testing simulation alerts verification.

---

## 10. Auditability

### NFR-AUD-001: Audit Log Retention

- **Target**: Job creation, updates, cancellations, and worker registrations must write to read-only logs retained for 1 year.
- **Measurement**: SQL table partition retention policies audit.

---

## 11. Extensibility

### NFR-EXT-001: Dynamic Executor Registration

- **Target**: Adding a new executor runtime type must require modifying `< 2` files (registering in execution type map and implementing interface).
- **Measurement**: Development design audits.

---

## 12. Accessibility

### NFR-ACC-001: WCAG 2.1 Compliance

- **Target**: The web monitoring dashboard must follow WCAG 2.1 Level AA accessibility standards.
- **Measurement**: Lighthouse accessibility audits.

---

## 13. Usability

### NFR-USA-001: Task Recovery Time

- **Target**: An operator must be able to retry a dead letter queue job in `< 3 clicks` on the UI dashboard.
- **Measurement**: Usability feedback assessments.

---

## 14. Internationalization

### NFR-I18N-001: UTF-8 Support

- **Target**: The database and API schemas must support UTF-8 character encoding (supporting multilingual payloads and logs).
- **Measurement**: Character validation test runs.
