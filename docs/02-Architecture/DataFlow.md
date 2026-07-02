# Data Flow

This document details data mutation paths and lifecycle states of jobs.

## 1. Job Lifecycle States

```mermaid
stateDiagram-v2
    [*] --> Pending
    Pending --> Running : Picked up by Worker
    Running --> Completed : Execution Success
    Running --> Failed : Execution Error
    Failed --> Pending : Retry Limit Not Reached
    Failed --> DeadLetter : Retry Limit Exceeded
```

## 2. Ingestion Path Flow

- **Input**: REST client schedules a task.
- **Validation**: Schema checks.
- **Store**: SQL metadata creation.
- **Publish**: Broker task dispatch.
