# Partitioning Strategy

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

1. [Target Table Partitioning Plan](#1-target-table-partitioning-plan)
2. [Partition Pruning & Maintenance](#2-partition-pruning--maintenance)
3. [Trade-offs & Implementation Concerns](#3-trade-offs--implementation-concerns)

---

## 1. Target Table Partitioning Plan

To maintain query performance under high data volumes, the database utilizes PostgreSQL declarative range partitioning:

- **`job_executions`**: Partitioned by month using the `started_at` column (e.g. `job_executions_2026_07`, `job_executions_2026_08`).
- **`audit_logs`**: Partitioned by date using the `created_at` column.
- **`dead_letter_entries`**: Partitioned by month using the `quarantined_at` column.

---

## 2. Partition Pruning & Maintenance

### 2.1. Partition Pruning

- Queries containing date range filters (e.g. `WHERE started_at >= '2026-07-01'`) allow the query planner to scan only matching partitions, ignoring irrelevant tables and reducing disk I/O.

### 2.2. Maintenance Script Scheduling

- Active partitions are pre-created 1 month in advance.
- Background cron jobs manage partition creation:
  - Expired partitions (older than 90 days) are detached, dumped, and archived to S3/Cold storage, keeping the primary database small.

---

## 3. Trade-offs & Implementation Concerns

- **Trade-offs**:
  - Global unique indexes are restricted on partitioned tables.
  - Foreign key references pointing to partitioned tables require explicit routing checks.
- **Benefits**:
  - Drops older data in milliseconds using `DROP TABLE` instead of slow `DELETE` queries that cause transaction lock overhead.
