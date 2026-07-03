# Job Submission

This document outlines manual job submission parameters and inputs validation.

## 1. Submission Form Parameters

- **Target Queue**: Scoped selection mapping active project hierarchies.
- **Priority**: Dropdown integer selection.
- **Idempotency Key**: Optional key verifying uniqueness.
- **Payload & Metadata**: JSON editor structures capturing arguments.

---

## 2. Validation bounds

- Custom schema ensures payload and metadata are valid parseable JSON.
- Idempotency key checks ensure duplicate keys are caught prior to backend request.
