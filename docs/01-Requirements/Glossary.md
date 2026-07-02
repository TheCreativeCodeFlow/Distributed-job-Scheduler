# Project Glossary

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

## Glossary of Terms

### Organization

The top-level multi-tenancy administrative boundary. An organization maps to a billing account or corporate entity and contains multiple projects.

### Project

A logical workspace within an organization. Projects isolate environments (e.g. staging vs. production) and encapsulate specific sets of queues, jobs, and worker pools.

### Queue

A named channel containing jobs waiting to be executed. Queues support pausing, resuming, rate limits, and priority rules.

### Worker

A stateless daemon runtime process that polls queues, claims pending jobs, executes payloads, and records execution logs.

### Scheduler

The core engine component responsible for checking time boundaries, parsing cron configurations, and enqueuing recurring or delayed jobs.

### Job

The unit of work defined in the system. A job consists of a target queue, metadata, payload options, execution rules, and state boundaries.

### Heartbeat

A regular signal sent by an active worker to the broker indicating it is healthy and still processing its active job.

### Retry

The automated process of rescheduling a job that failed during execution. Controlled by retry limits and exponential backoff parameters.

### Dead Letter Queue (DLQ)

A quarantine area containing jobs that failed all execution and retry attempts. Kept for manual auditing, analysis, and recovery.

### Concurrency

The maximum number of jobs executed simultaneously. Configured globally, per queue, or per tenant.

### Atomic Claim

The operation that guarantees a single worker claims a job. Uses transactions to prevent other workers from executing the same task.

### Lease

A temporary lock assigned to a worker when it claims a job. The worker must regularly renew the lease via heartbeats, or the job is returned to the queue.

### Cron

A time-based scheduler syntax used to run recurring jobs at specified intervals.

### Batch Job

A parent coordination wrapper that manages a set of jobs that must run in parallel or in a sequence.

### Execution

The runtime attempt of running a single job payload. A job can have multiple executions if retried.

### Idempotency

A design pattern guaranteeing that running a job multiple times produces the same system state as running it once.

### Observability

The ability to monitor queue sizes, worker performance, latencies, error logs, and heartbeat records.

### RBAC (Role-Based Access Control)

A method of restricting system access to authorized users based on specific organizational roles (e.g. System Administrator, Developer, Read-Only Viewer).

### JWT (JSON Web Token)

A compact, URL-safe means of representing claims to be transferred between two parties. Used as secure session tokens in API calls.

### CORS (Cross-Origin Resource Sharing)

A browser security mechanism that restricts HTTP requests made to another domain than the one serving the current page.

### CSRF (Cross-Site Request Forgery)

An attack that forces an authenticated user to execute unwanted actions on a web application in which they're currently authenticated.

### XSS (Cross-Site Scripting)

A vulnerability enabling attackers to inject malicious client-side scripts into web pages viewed by other users.

### NTP (Network Time Protocol)

A networking protocol for clock synchronization between computer systems over packet-switched, variable-latency data networks.

### JWKS (JSON Web Key Set)

A set of cryptographic keys containing public keys used to verify any JSON Web Token (JWT) issued by an authorization server.

### SAST (Static Application Security Testing)

A testing methodology that analyzes source code to find security vulnerabilities before compiling or executing.

### DAST (Dynamic Application Security Testing)

A testing methodology that analyzes a running application from the outside in real time, looking for runtime vulnerabilities (e.g., query injections).

### OCI (Open Container Initiative)

An open governance structure for creating open industry standards around container formats and runtimes.

### HPA (Horizontal Pod Autoscaling)

An automated container scaling mechanism that adjusts replication sizes based on CPU, memory, or custom target queue metric loads.

### SSE (Server-Sent Events)

A server push technology enabling a client to receive automatic, real-time updates from a server over an HTTP connection.

### SLA (Service Level Agreement)

A commitment between a service provider and a client regarding service availability, uptime, and performance latency baselines.
