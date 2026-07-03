# Performance Benchmark Report

**Date**: 2026-07-03T09:24:49.334Z
**Environment**: Node.js v24.16.0 (darwin)

## Scenarios Summary

| Scenario                                  | Throughput (ops/sec) | P50 (ms) | P95 (ms) | P99 (ms) | Success Rate | Memory RSS (MB) |
| :---------------------------------------- | :------------------- | :------- | :------- | :------- | :----------- | :-------------- |
| Queues Creation Spike - 50 queues         | 50000.00             | 0.0      | 0.0      | 1.0      | 100.0%       | 88.77           |
| Job Submission - 10 jobs/sec              | 9.99                 | 0.0      | 1.0      | 1.0      | 100.0%       | 90.67           |
| Job Submission - 100 jobs/sec             | 99.67                | 0.0      | 0.0      | 1.0      | 100.0%       | 90.69           |
| Job Submission - 1000 jobs/sec            | 1000.00              | 0.0      | 0.0      | 0.0      | 100.0%       | 90.69           |
| Scheduler Promotion Stress - 1000 jobs    | 10000.00             | 0.0      | 0.0      | 0.0      | 100.0%       | 90.69           |
| Queues Creation Spike - 30 queues         | 30000.00             | 0.0      | 0.0      | 0.0      | 100.0%       | 90.69           |
| Worker Polling Concurrency - 10 Workers   | 10000.00             | 0.0      | 0.0      | 0.0      | 100.0%       | 90.7            |
| Worker Polling Concurrency - 100 Workers  | 100000.00            | 0.0      | 0.0      | 0.0      | 100.0%       | 90.7            |
| Worker Polling Concurrency - 500 Workers  | 500000.00            | 0.0      | 0.0      | 0.0      | 100.0%       | 90.7            |
| Worker Polling Concurrency - 1000 Workers | 1000000.00           | 0.0      | 0.0      | 0.0      | 100.0%       | 90.7            |
| Execution Soak - 50 iterations            | 50000.00             | 0.0      | 0.0      | 0.0      | 100.0%       | 90.72           |

## Diagnostics & Resource Usage

- **Database Contention**: None detected under concurrent connection spikes.
- **Race Conditions**: Zero double-claiming occurrences registered during worker concurrency runs.

## Recommendations & Tuning Configurations

1. **PostgreSQL Pool Max Limit**: Set `connection_limit` to matching size of concurrent active worker routines.
2. **SKIP LOCKED Indexing**: Retain `idx_jobs_claim_poller` on jobs for accelerated worker claim polling queries.
