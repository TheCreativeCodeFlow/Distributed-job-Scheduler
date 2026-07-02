# Database Partitioning Strategy

This document details partitioning plans for high-growth data structures.

## 1. Candidate Tables

- **`job_execution_log`**: Highly transactional table that grows linearly with job throughput.
- **Partition Mode**: Range Partitioning by `started_at` date range.

## 2. Retention Goals

- Retain active execution logs in monthly partitions.
- Transition older partition tables to cold storage archives.
