# Entity Lifecycles Specifications

**Document Version**: 1.0.0  
**Status**: APPROVED  
**Author**: Principal Software Architect  
**Last Updated**: 2026-07-02

---

## Revision History

| Version | Date       | Description                               | Author              |
| :------ | :--------- | :---------------------------------------- | :------------------ |
| 1.0.0   | 2026-07-02 | Initial release for DDD Entity Lifecycles | Principal Architect |

---

## Table of Contents

1. [Queue Entity Lifecycle](#1-queue-entity-lifecycle)
2. [Job Entity Lifecycle](#2-job-entity-lifecycle)
3. [JobExecution Entity Lifecycle](#3-jobexecution-entity-lifecycle)
4. [Worker Entity Lifecycle](#4-worker-entity-lifecycle)
5. [Lease Entity Lifecycle](#5-lease-entity-lifecycle)

---

## 1. Queue Entity Lifecycle

```mermaid
stateDiagram-v2
    [*] --> ACTIVE : Queue Initialized
    ACTIVE --> PAUSED : Pause Action (blocks worker claims)
    PAUSED --> ACTIVE : Resume Action
    ACTIVE --> DRAINING : Drain Action (completes remaining tasks)
    DRAINING --> DISABLED : Deactivate queue
    DISABLED --> ARCHIVED : Archive queue
    ARCHIVED --> [*]
```

---

## 2. Job Entity Lifecycle

```mermaid
stateDiagram-v2
    [*] --> SCHEDULED : Future run timestamp
    [*] --> QUEUED : Immediate execution
    SCHEDULED --> QUEUED : Trigger time reached
    QUEUED --> CLAIMED : Worker row lock claim transaction
    CLAIMED --> RUNNING : Worker sets lease, starts execution
    RUNNING --> COMPLETED : Execution success
    RUNNING --> FAILED : Payload exception
    RUNNING --> TIMED_OUT : Exec limit exceeded
    FAILED --> RETRY_PENDING : Attempts remaining
    TIMED_OUT --> RETRY_PENDING : Attempts remaining
    RETRY_PENDING --> QUEUED : Backoff delay elapsed
    FAILED --> DEAD_LETTER : Max retries exhausted
    TIMED_OUT --> DEAD_LETTER : Max retries exhausted
    QUEUED --> CANCELLED : Cancel command
    SCHEDULED --> CANCELLED : Cancel command
    COMPLETED --> [*]
    DEAD_LETTER --> [*]
    CANCELLED --> [*]
```

---

## 3. JobExecution Entity Lifecycle

```mermaid
stateDiagram-v2
    [*] --> STARTED : Worker initiates execute process
    STARTED --> RUNNING : Execution in progress
    RUNNING --> FINISHED_SUCCESS : Payload returns success code
    RUNNING --> FINISHED_ERROR : Payload throws exception
    FINISHED_SUCCESS --> [*]
    FINISHED_ERROR --> [*]
```

---

## 4. Worker Entity Lifecycle

```mermaid
stateDiagram-v2
    [*] --> REGISTERING : Container boots
    REGISTERING --> IDLE : Connection accepted
    IDLE --> POLLING : Queries database
    POLLING --> CLAIMING : SQL Transaction active
    CLAIMING --> RUNNING : Claim committed
    RUNNING --> DRAINING : SIGTERM caught
    DRAINING --> STOPPING : Active task completes
    STOPPING --> OFFLINE : Exits process
    RUNNING --> LOST : Heartbeat failed
    LOST --> OFFLINE : Cleaned by scheduler
    OFFLINE --> [*]
```

---

## 5. Lease Entity Lifecycle

```mermaid
stateDiagram-v2
    [*] --> CREATED : Job claim committed
    CREATED --> ACTIVE : Heartbeat received
    ACTIVE --> ACTIVE : Heartbeat received (TTL extended)
    ACTIVE --> EXPIRED : Heartbeat lost (TTL elapsed)
    ACTIVE --> RELEASED : Job finished successfully
    EXPIRED --> RELEASED : Cleaned by scheduler
    RELEASED --> [*]
```
