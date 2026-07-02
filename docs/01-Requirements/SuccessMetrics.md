# Success Metrics & KPIs

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

1. [API Latency](#1-api-latency)
2. [Job Throughput](#2-job-throughput)
3. [Worker Recovery Time](#3-worker-recovery-time)
4. [Queue Latency](#4-queue-latency)
5. [Maximum Concurrent Workers](#5-maximum-concurrent-workers)
6. [Worker Heartbeat Success](#6-worker-heartbeat-success)
7. [Retry Success Rate](#7-retry-success-rate)
8. [System Uptime](#8-system-uptime)
9. [Dashboard Update Latency](#9-dashboard-update-latency)

---

## 1. API Latency

- **KPI**: Time elapsed during job ingestion API requests (`POST /v1/jobs`).
- **Target**:
  - Median latency (p50): `< 30ms`.
  - 95th percentile (p95): `< 50ms`.
  - 99th percentile (p99): `< 150ms`.

## 2. Job Throughput

- **KPI**: The number of task states processed per second by worker pools.
- **Target**:
  - Ingestion: up to `10,000` jobs enqueued per second.
  - Execution: up to `5,000` tasks executed per second (varying based on computation payloads).

## 3. Worker Recovery Time

- **KPI**: Time to recover and reschedule a job after its executing worker crashes.
- **Target**: `< 45 seconds`.
  - Time details: Heartbeat lock expires after 30 seconds, and the backup scan task enqueues it within 15 seconds.

## 4. Queue Latency

- **KPI**: The delay between a job's scheduled run time and its actual start time.
- **Target**:
  - Immediate jobs: `< 200ms` dispatch delay.
  - Cron/Delayed jobs: `< 500ms` deviation.

## 5. Maximum Concurrent Workers

- **KPI**: The number of worker processes polling the queue cluster simultaneously.
- **Target**: Support up to `1,000` worker containers without causing lock contention or connection pool exhaustion in Redis.

## 6. Worker Heartbeat Success

- **KPI**: The ratio of successful heartbeat check responses to total heartbeat attempts.
- **Target**: `> 99.9%` success rate.

## 7. Retry Success Rate

- **KPI**: The percentage of failed jobs that complete successfully after retries.
- **Target**: Tracked as an operational metric to optimize retry backoff and jitter configurations.

## 8. System Uptime

- **KPI**: System availability across all environments.
- **Target**: `99.99%` uptime on API gateways and worker cluster nodes.

## 9. Dashboard Update Latency

- **KPI**: Time delay for metrics updates to display on the web monitoring UI.
- **Target**: `< 1 second` latency using SSE or WebSockets.
