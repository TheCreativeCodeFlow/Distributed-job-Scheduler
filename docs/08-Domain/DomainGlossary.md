# Domain Glossary

**Document Version**: 1.0.0  
**Status**: APPROVED  
**Author**: Principal Software Architect  
**Last Updated**: 2026-07-02

---

## Revision History

| Version | Date       | Description                             | Author              |
| :------ | :--------- | :-------------------------------------- | :------------------ |
| 1.0.0   | 2026-07-02 | Initial release for DDD Domain Glossary | Principal Architect |

---

## Table of Contents

1. [Domain Terms Glossary](#1-domain-terms-glossary)

---

## 1. Domain Terms Glossary

- **Tenancy Boundary**: The logical isolation partition enclosing all database states, configurations, queues, and execution scopes.
- **Transactional Claiming**: The atomic operation using PostgreSQL row-level locks that assigns a queued job to exactly one worker.
- **Heartbeat Lease**: The distributed coordinator lock key in Redis that monitors active worker health.
- **Exponential Backoff**: A mathematical strategy for scheduling retries that increases the delay between attempts to protect failing downstream services.
- **Dead Letter Queue (DLQ)**: The quarantine boundary in PostgreSQL for jobs that consistently fail execution.
- **Queue Draining**: The administrative mode where a queue stops accepting new job submissions but allows active workers to clear the remaining backlog.
- **Optimistic Locking**: A concurrency control method that checks a version counter before writing updates, preventing database lock contention.
- **Cron Expression**: A standardized time pattern used to schedule recurring background tasks.
