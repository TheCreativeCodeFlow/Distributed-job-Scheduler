# Worker Lifecycle

This document describes worker node status states and transition paths.

```mermaid
graph TD
    REGISTERING[REGISTERING: startup init] -->|Register Confirm| IDLE[IDLE: awaiting leases]
    IDLE -->|Claims assigned| RUNNING[RUNNING: executing tasks]
    RUNNING -->|Idle release| IDLE
    RUNNING -->|Heartbeat timeout| LOST[LOST: connection loss]
    IDLE -->|Heartbeat timeout| LOST
    LOST -->|Manual Recover| RECOVERING[RECOVERING: lease checks]
    RECOVERING -->|Success check| IDLE
    LOST -->|Explicit Deregister| OFFLINE[OFFLINE: shutdown exit]
```

- Lost worker nodes can be manually recovered or deregistered by administrators.
- Status visualizations reuse the shared indicators color mappings.
