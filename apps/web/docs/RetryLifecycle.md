# Retry Lifecycle

This document describes automatic job retry loop transitions.

```mermaid
graph TD
    Queued[Queued] --> Claimed[Claimed]
    Claimed --> Running[Running]
    Running -->|Fail, attempts < max| Pending[Retry Pending: backoff wait]
    Pending -->|Delay expiry| Queued
    Running -->|Fail, attempts >= max| Exhausted[Retry Exhausted: dead letter status]
    Running -->|Success| Completed[Completed]
    Pending -->|Forced manual retry| Queued
```

- Lost worker or exception execution failures trigger the backoff scheduler.
- Failed status nodes can be manually forced enqueued by operators.
