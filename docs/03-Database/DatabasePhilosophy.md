# Database Design Philosophy

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

1. [Design Goals](#1-design-goals)
2. [Why PostgreSQL was Selected](#2-why-postgresql-was-selected)
3. [ACID & Durability Considerations](#3-acid--durability-considerations)
4. [Normalization & Denormalization Strategy](#4-normalization--denormalization-strategy)
5. [Scalability & Future Extensibility](#5-scalability--future-extensibility)

---

## 1. Design Goals

The primary database design goal is to provide a durable, strongly consistent, and high-performance relational persistence layer for the Distributed Job Scheduler. The database coordinates multi-tenant configurations, job states, retry logic, dead letter entries, and audit logs.

---

## 2. Why PostgreSQL was Selected

PostgreSQL 16.x was selected as the sole authoritative persistence engine because:

- **ACID Transactions**: Provides transactional guarantees for state transitions and claiming.
- **Advanced Concurrency Tools**: Supports `SKIP LOCKED` queries for high-throughput, non-blocking concurrent row-level claiming.
- **Relational Integrity**: Enforces foreign keys, check constraints, and index optimizations.
- **Rich Data Types**: Native JSONB support enables flexible payload storage alongside structured metadata columns.

---

## 3. ACID & Durability Considerations

- **Write-Ahead Logging (WAL)**: All status changes are committed to the transaction log before writing to database pages.
- **Isolation Levels**: Job claims and state updates run at `Read Committed` isolation level to maximize concurrency while preventing dirty reads.
- **No Volatile Storage**: Avoids in-memory storage for queues. If the service experiences a power loss, PostgreSQL guarantees no committed job records are lost.

---

## 4. Normalization & Denormalization Strategy

### 4.1. Normalization

- All primary schemas (Users, Orgs, Projects, Queues, Jobs) are normalized to Third Normal Form (3NF) to prevent redundancy.

### 4.2. Intentional Denormalization

- **Job Execution Log Snapshot**: The `job_execution_log` table duplicates the queue priority and configuration properties at the time of execution.
- _Rationale_: Preserves historical metrics even if the parent queue parameters are modified or archived in the future.

---

## 5. Scalability & Future Extensibility

- **Read Replicas**: Select and dashboard queries are routed to read replicas. Master nodes handle writes.
- **Connection Proxy**: `pgBouncer` throttles connection counts.
- **Date Partitioning**: Log tables partition by date ranges (e.g. monthly tables) to maintain fast index scans.
