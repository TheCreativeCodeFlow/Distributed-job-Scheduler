# Index Strategy

This document describes the indexing guidelines for high-throughput tables.

## 1. Primary Indexes

- **Jobs Table**:
  - Index on `project_id` (foreign key reference queries).
  - Composite Index on `(queue, status, scheduled_at)` (polling logic acceleration).
- **Job Execution Logs**:
  - Index on `job_id` (nested logs retrieval queries).

## 2. Best Practices

- Monitor index usage with `pg_stat_user_indexes`.
- Avoid creating redundant indexes that decrease write throughput.
