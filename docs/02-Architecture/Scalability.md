# Scalability Architecture Design

**Document Version**: 1.1.0  
**Status**: APPROVED  
**Author**: Principal Software Architect  
**Last Updated**: 2026-07-02

---

## Revision History

| Version | Date       | Description                                                 | Author              |
| :------ | :--------- | :---------------------------------------------------------- | :------------------ |
| 1.1.0   | 2026-07-02 | Remediation: PostgreSQL queue ownership & SQL lock claiming | Principal Architect |
| 1.0.0   | 2026-07-02 | Initial release for Architecture Review                     | Principal Architect |

---

## Table of Contents

1. [Compute Nodes Scaling](#1-compute-nodes-scaling)
2. [Database Storage Scaling](#2-database-storage-scaling)
3. [Redis & Coordination Scaling](#3-redis--coordination-scaling)
4. [Capacity Planning & Bottlenecks](#4-capacity-planning--bottlenecks)

---

## 1. Compute Nodes Scaling

- **API Gateways**: Scale horizontally behind Application Load Balancers (ALB) across multiple availability zones. Scale-out triggers on CPU utilization (`> 70%`) or high concurrent connections (`> 2,000`).
- **Worker Pools**: Segmented by queue type (e.g. `transactions-pool`, `logs-pool`). Auto-scales based on queue backlog size in PostgreSQL.
- **Schedulers**: Run in active-passive configurations (scales vertically, not horizontally, to prevent duplicate scheduling overhead).

---

## 2. Database Storage Scaling

Since PostgreSQL is the sole queue storage source of truth, database scaling is critical:

- **Read Replica Partitioning**: API query requests (GET, status checks) are routed to PostgreSQL read replicas. Database writes (POST, status updates) target the master instance.
- **Connection Pools**: Managed via `pgBouncer` nodes placed between app containers and database servers.
- **Future Partitioning**: Range partitioning on `jobs` and `job_execution_log` tables by date ranges (e.g. monthly tables) to maintain fast index scans.
- **Future Sharding**: Sharding by `organization_id` or `project_id` to scale write throughput across multiple database instances.

---

## 3. Redis & Coordination Scaling

- **Coordination Lock Scaling**: Redis only handles distributed locking, heartbeats, and wake-up notifications. This keeps memory utilization and write throughput low.
- **Clustered Nodes**: Standard Redis clustering handles locking coordination keys scaling.

---

## 4. Capacity Planning & Bottlenecks

- **Database Write Overhead**: Transactional claiming writes status changes directly to PostgreSQL. We use indexes on queue name and status columns to optimize query speeds.
- **Connection Saturation**: Limit worker pool concurrency values to match pgBouncer capacity thresholds.
- **Network Latency**: Place PostgreSQL, Redis, and compute nodes in the same local availability zone networks to minimize latency.
