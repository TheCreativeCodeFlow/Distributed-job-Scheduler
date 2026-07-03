# Queue State Machine

This document details client state transitions matching the scheduler engine constraints.

```mermaid
stateDiagram-v2
    [*] --> ACTIVE : Create
    ACTIVE --> PAUSED : Pause
    ACTIVE --> DRAINING : Drain
    ACTIVE --> DISABLED : Disable
    ACTIVE --> ARCHIVED : Archive/Delete

    PAUSED --> ACTIVE : Resume
    PAUSED --> DRAINING : Drain
    PAUSED --> DISABLED : Disable
    PAUSED --> ARCHIVED : Archive/Delete

    DRAINING --> ACTIVE : Resume
    DRAINING --> PAUSED : Pause
    DRAINING --> DISABLED : Disable
    DRAINING --> ARCHIVED : Archive/Delete

    DISABLED --> ACTIVE : Enable
    DISABLED --> ARCHIVED : Archive/Delete

    ARCHIVED --> ACTIVE : Restore
```

- Operational controls render dynamically according to current state.
- Invalid state transition buttons are disabled.
