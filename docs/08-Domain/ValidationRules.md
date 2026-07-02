# Validation Rules Specifications

**Document Version**: 1.0.0  
**Status**: APPROVED  
**Author**: Principal Software Architect  
**Last Updated**: 2026-07-02

---

## Revision History

| Version | Date       | Description                              | Author              |
| :------ | :--------- | :--------------------------------------- | :------------------ |
| 1.0.0   | 2026-07-02 | Initial release for DDD Validation Rules | Principal Architect |

---

## Table of Contents

1. [Entity Validation Rules](#1-entity-validation-rules)
2. [Cross-Aggregate Validations](#2-cross-aggregate-validations)

---

## 1. Entity Validation Rules

### 1.1. Organization

- **Creation Validation**: Name must be between 3 and 100 characters, owner ID must be valid UUID.
- **Update Validation**: Plan updates must match a valid subscription enum.
- **Deletion Rules**: Deleting an organization is blocked if billing balances are outstanding.

### 1.2. Project

- **Creation Validation**: Name must be unique within the organization.
- **Update Validation**: Cannot update organization ID association once created.
- **Deletion Rules**: Cascade-delete configuration settings, but keep execution logs for auditing.

### 1.3. Queue

- **Creation Validation**: Name must match regex `^[a-zA-Z0-9_-]{3,64}$`.
- **Update Validation**: Concurrency limits must be between 1 and 1,000.
- **Deletion Rules**: Deleting a queue is blocked unless it is disabled or empty.

### 1.4. Job

- **Creation Validation**: Payload size must be `< 1MB`, queue name must match registered queue.
- **Update Validation**: Updates to payload or priority are blocked after status is `CLAIMED` or `RUNNING`.
- **State Transition Validation**: Invalid transitions (e.g. `COMPLETED` -> `QUEUED`) are rejected.

### 1.5. Worker

- **Creation Validation**: Hostname and uuid must be present.
- **Update Validation**: Updates to capabilities must pass schemas validation.
- **Deletion Rules**: Automatically cleaned from registry after 1 hour offline.

---

## 2. Cross-Aggregate Validations

- **Queue Limits Enforcement**: The Job creation transaction queries the Project configuration to verify that total pending jobs in PostgreSQL do not exceed the project limit.
- **Lease Invalidation Check**: During execution completion, the SQL transaction queries the Redis lease key to confirm the calling worker still holds the lease.
