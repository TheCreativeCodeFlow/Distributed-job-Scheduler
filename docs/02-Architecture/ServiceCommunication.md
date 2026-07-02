# Service Communication Design

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

1. [Communication Patterns](#1-communication-patterns)
2. [Sequence Flows](#2-sequence-flows)
3. [Future Event-Driven Opportunities](#3-future-event-driven-opportunities)

---

## 1. Communication Patterns

### 1.1. Synchronous Communication

- **Client to API**: HTTPS JSON REST calls (`POST`, `GET`, `PATCH`).
- **Dashboard to API**: HTTPS REST requests and WebSockets/SSE connections for real-time monitoring streams.

### 1.2. Asynchronous Communication

- **API to Database (PostgreSQL)**: Jobs are written directly to PostgreSQL.
- **Worker Polling (PostgreSQL)**: Workers poll PostgreSQL directly using transaction blocks wrapping `SELECT ... FOR UPDATE SKIP LOCKED` queries.
- **Scheduler to Redis**: Schedulers push optional wake-up signals (Pub/Sub) to Redis to notify idle workers that new jobs are ready in PostgreSQL.

### 1.3. Database & Cache Interactions

- **PostgreSQL**: Master storage for jobs, queues, logs, and metadata. SQL client pools connect directly to DB nodes.
- **Redis**: Ephemeral coordination only. Handles distributed locks, rate-limiting, and heartbeat leases. No permanent job data is stored in Redis.

### 1.4. Worker Heartbeat Communication

- **Worker to Redis**: Every 10 seconds, the worker updates its task lease expiration key in Redis (`lease:{job_id}`) using `SET EX` or `PEXPIRE`.

---

## 2. Sequence Flows

### 2.1. Immediate Job Ingestion & Execution Flow

```mermaid
sequenceDiagram
    autonumber
    participant Client
    participant API Gateway
    participant Database
    participant Redis Broker
    participant Worker

    Client->>API Gateway: POST /v1/jobs (Payload)
    API Gateway->>Database: Write Job (Status: QUEUED)
    API Gateway->>Redis Broker: Publish wake_up_channel (Job ID / Queue Name)
    API Gateway-->>Client: 202 Accepted (Job ID)

    Worker->>Database: Start Transaction: SELECT ... FOR UPDATE SKIP LOCKED
    Database-->>Worker: Return Job ID (Atomic Claim)
    Worker->>Database: Update Job State (Status: RUNNING, assign worker_id)
    Worker->>Database: Commit Transaction

    Worker->>Redis Broker: SET lease:job_id worker_id EX 30

    loop Every 10s (Heartbeat)
        Worker->>Redis Broker: EXPIRE lease:job_id 30
    end

    Worker->>Worker: Execute payload
    Worker->>Database: Update Job Result (Status: COMPLETED, log execution log)
    Worker->>Redis Broker: DEL lease:job_id
```

### 2.2. Scheduler Cron Trigger Flow

```mermaid
sequenceDiagram
    autonumber
    participant Scheduler
    participant Database
    participant Redis Broker

    loop Every 60s (Cron Check)
        Scheduler->>Redis Broker: SET lock:cron_tick scheduler_node EX 50 NX
        Note over Scheduler: Lock claimed (active node)
        Scheduler->>Database: Scan ready cron records
        Database-->>Scheduler: Return due cron rows
        Scheduler->>Database: Generate Job records (Status: QUEUED)
        Scheduler->>Redis Broker: Publish wake_up_channel (Queue Name)
        Scheduler->>Redis Broker: DEL lock:cron_tick
    end
```

---

## 3. Future Event-Driven Opportunities

- **Event Sourcing Integration**: In future phases, job state changes can be published to an Apache Kafka or AWS Kinesis stream, enabling other internal microservices to consume events asynchronously.
- **Notification Fan-out**: Integrating an event broker allows fan-out triggers to send notifications (webhooks, emails) on job failures without blocking worker execution.
