# Performance Budget

**Document Version**: 1.0.0  
**Status**: APPROVED  
**Author**: Principal Software Architect  
**Last Updated**: 2026-07-02

---

## Revision History

| Version | Date       | Description                            | Author              |
| :------ | :--------- | :------------------------------------- | :------------------ |
| 1.0.0   | 2026-07-02 | Initial release for Performance Budget | Principal Architect |

---

## Table of Contents

1. [Measurable Performance Targets](#1-measurable-performance-targets)

---

## 1. Measurable Performance Targets

The following performance budgets must be maintained across all platform modules. These budgets align with the non-functional requirements and success metrics:

| Metric Name                          | Target Value                                                  | Measurement Strategy                  | Component            |
| :----------------------------------- | :------------------------------------------------------------ | :------------------------------------ | :------------------- |
| **API Response Time**                | - p50: `< 30ms`<br>- p99: `< 150ms`                           | Gateway HTTP Access Logs              | REST API Gateway     |
| **Scheduler Tick Interval**          | - Cron Check: `60 seconds`<br>- Delayed Poll: `10 seconds`    | Container internal timers             | Scheduler Engine     |
| **Worker Poll Interval**             | - Idle: `1 second`<br>- Active: `0 seconds` (immediate query) | Polling loop execution logs           | Worker Daemon        |
| **Heartbeat Interval**               | `10 seconds`                                                  | Redis key update timestamps           | Worker Daemon        |
| **Lease Duration**                   | `30 seconds`                                                  | Redis lease key TTL                   | Redis Coordinator    |
| **Retry Delay**                      | Exponential backoff (factor of 2) with random jitter          | PostgreSQL `scheduled_at` timestamp   | Retry Engine         |
| **Dashboard Refresh**                | `< 2 seconds`                                                 | SSE network payload latency           | Web Dashboard Client |
| **Queue Promotion Time**             | `< 1 second` from scheduled trigger time                      | PostgreSQL audit logs                 | Scheduler Engine     |
| **Worker Recovery Time**             | `< 45 seconds` from heartbeat timeout                         | Cleaner scheduler loop execution logs | Cleaner Service      |
| **Maximum Claim Latency**            | `< 50ms`                                                      | SQL query execution profile logs      | Worker Daemon        |
| **Maximum Retry Scheduling Latency** | `< 100ms`                                                     | SQL query execution profile logs      | Worker Daemon        |
