# Consistency Model

**Document Version**: 1.0.0  
**Status**: APPROVED  
**Author**: Principal Software Architect  
**Last Updated**: 2026-07-02

---

## Revision History

| Version | Date       | Description                           | Author              |
| :------ | :--------- | :------------------------------------ | :------------------ |
| 1.0.0   | 2026-07-02 | Initial release for Consistency Model | Principal Architect |

---

## Table of Contents

1. [Consistency Classifications](#1-consistency-classifications)
2. [Subsystem Analysis & Reasoning](#2-subsystem-analysis--reasoning)

---

## 1. Consistency Classifications

The platform is classified into two primary consistency zones:

### 1.1. Strong Consistency (ACID)

- **Subsystems**: Job State, Queue State, Worker Ownership.
- **Enforcement**: PostgreSQL transactions, relational constraints, and database row locks.
- **Why it matters**: Rejects split-brain executions, duplicate claims, or status mismatches.

### 1.2. Eventual Consistency (BASE)

- **Subsystems**: Dashboard UI, Prometheus Metrics, Audit Logs Analytics, Slack/Webhook Alerts.
- **Enforcement**: Redis Pub/Sub streams, background metric scrapers, and dashboard SSE feeds.
- **Why it matters**: Avoids performance bottlenecks on core job execution flows.

---

## 2. Subsystem Analysis & Reasoning

| Subsystem Name       | Consistency Model    | Data Store                | Reasoning                                                                                                  |
| :------------------- | :------------------- | :------------------------ | :--------------------------------------------------------------------------------------------------------- |
| **Job State**        | Strong Consistency   | PostgreSQL                | State updates (e.g. from `QUEUED` to `RUNNING`) must be immediate and durable to prevent duplicate claims. |
| **Queue State**      | Strong Consistency   | PostgreSQL                | Queue configurations (e.g. paused vs. active) must block worker claims immediately.                        |
| **Worker Ownership** | Strong Consistency   | PostgreSQL + Redis Leases | Exactly one worker can own a job at any given millisecond.                                                 |
| **Dashboard**        | Eventual Consistency | Redis Pub/Sub + SSE       | Operators can tolerate latency (e.g. up to 1-2 seconds) for status visualizations.                         |
| **Metrics**          | Eventual Consistency | Prometheus Exporter       | Scrapers scrape endpoints every 15 seconds.                                                                |
| **Alerting**         | Eventual Consistency | Webhook Dispatcher        | Notifications (e.g. Slack alerts) run asynchronously from worker loops.                                    |
