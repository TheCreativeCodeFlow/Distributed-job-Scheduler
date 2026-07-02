# Database Schema Review

**Document Version**: 1.0.0  
**Status**: APPROVED  
**Author**: Principal Database Engineer  
**Last Updated**: 2026-07-02

---

## Revision History

| Version | Date       | Description                                | Author             |
| :------ | :--------- | :----------------------------------------- | :----------------- |
| 1.0.0   | 2026-07-02 | Initial release for Database Schema Review | Principal Engineer |

---

## Table of Contents

1. [Schema Architecture Rationale](#1-schema-architecture-rationale)
2. [Relationship & Index Justification](#2-relationship--index-justification)
3. [Potential Scalability Concerns](#3-potential-scalability-concerns)

---

## 1. Schema Architecture Rationale

The Prisma database schema implements the approved database architecture:

- PostgreSQL is the sole authoritative owner of all job states, metadata, configurations, and queues.
- Redis queues have been removed, transitioning all worker job claims to transactional SQL database queries.
- Optimistic locking checks (`version` column) protect configuration modifications, while pessimistic locks (`FOR UPDATE SKIP LOCKED`) manage job claims.

---

## 2. Relationship & Index Justification

### 2.1. Why `idx_jobs_claim_poller` Index Exists

- **Index**: Composite index on `(queue_id, status, priority, created_at)`.
- **Justification**: Workers continuously poll PostgreSQL to claim jobs. This B-Tree index matches the query fields (`WHERE status = 'QUEUED' AND queue_id = $1 ORDER BY priority DESC, created_at ASC`), enabling index-only scans and fast lock lookups.

### 2.2. Why `unique_active_lease_per_job` Unique Constraint Exists

- **Index**: Unique index on `worker_leases(job_id)`.
- **Justification**: Ensures that exactly one active worker lease lock exists for a job at a time, preventing double claiming.

---

## 3. Potential Scalability Concerns

- **Job Log Bloat**: Spawning logs inside `job_logs` for every execution can cause massive database size growth.
  - _Mitigation_: Enable daily partitioning on the `job_logs` table, detaching and archiving partitions older than 15 days to S3 cold storage.
- **Connection Count Limits**: High worker concurrency can exhaust database connection pools.
  - _Mitigation_: Deploy `pgBouncer` connection proxies to share backend connections.
