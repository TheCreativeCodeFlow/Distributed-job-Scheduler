# Queue Operational Controls

This document details administrative operations for queues.

## 1. Action Triggers

- **Pause / Resume**: Suspends or resumes worker polling tasks.
- **Drain**: Processes remaining queued job instances without accepting new submissions.
- **Disable / Enable**: Shuts down worker polling loops entirely.
- **Archive / Restore**: Soft deletes or restores queue configurations.

---

## 2. Confirmation Modals

- Destructive operations (archive, disable, drain) trigger an explicit `ConfirmationModal` layout block to prevent accidental clicks.
