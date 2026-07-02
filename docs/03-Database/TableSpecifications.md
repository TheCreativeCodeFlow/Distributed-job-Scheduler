# Table Design Specification

**Document Version**: 1.0.0  
**Status**: APPROVED  
**Author**: Principal Database Architect  
**Last Updated**: 2026-07-02

---

## Revision History

| Version | Date       | Description                                | Author              |
| :------ | :--------- | :----------------------------------------- | :------------------ |
| 1.0.0   | 2026-07-02 | Initial release for Database Design Review | Principal Architect |

---

## Table of Contents

1. [Core Tables List](#1-core-tables-list)
2. [Tables Specifications](#2-tables-specifications)

---

## 1. Core Tables List

The scheduler platform uses the following schema tables:

- `users`
- `organizations`
- `organization_members`
- `projects`
- `queues`
- `retry_policies`
- `jobs`
- `scheduled_jobs`
- `job_executions`
- `workers`
- `dead_letter_entries`
- `audit_logs`
- `system_settings`

---

## 2. Tables Specifications

### 2.1. users

- **Purpose**: Authenticated user accounts.
- **Primary Key**: `id` (UUID).
- **Candidate Keys**: `email` (Unique).
- **Relationships**: Many-to-Many with `organizations` via `organization_members`.
- **Business Invariants**: Email must contain `@` and be lowercase.
- **Expected CRUD**: Create user on signup, Read on login, Update password/profile, Delete blocked.
- **Ownership**: Identity & Access Context.

### 2.2. organizations

- **Purpose**: Tenant boundary.
- **Primary Key**: `id` (UUID).
- **Candidate Keys**: `slug` (Unique).
- **Relationships**: One-to-Many with `projects`.
- **Business Invariants**: Must have a valid subscription state.
- **Expected CRUD**: Create on account creation, Read on login.

### 2.3. projects

- **Purpose**: Environments scoping.
- **Primary Key**: `id` (UUID).
- **Candidate Keys**: `slug` (Unique within organization).
- **Relationships**: Belongs to `organizations`. One-to-Many with `queues`.

### 2.4. queues

- **Purpose**: Named execution channels.
- **Primary Key**: `id` (UUID).
- **Candidate Keys**: `project_id` + `name` (Unique).
- **Relationships**: Belongs to `projects`. References `retry_policies`.
- **Business Invariants**: Paused queue status halts worker claims.

### 2.5. retry_policies

- **Purpose**: Configures retry rules.
- **Primary Key**: `id` (UUID).
- **Relationships**: Configures `queues`.

### 2.6. jobs

- **Purpose**: Execution tasks.
- **Primary Key**: `id` (UUID).
- **Candidate Keys**: `project_id` + `idempotency_key` (Unique).
- **Relationships**: Belongs to `queues`. References `workers` (if claimed).
- **Business Invariants**: Completed jobs cannot transition back to queued.
- **Expected CRUD**: High frequency inserts and updates.

### 2.7. job_executions

- **Purpose**: Execution attempt logs.
- **Primary Key**: `id` (UUID).
- **Relationships**: Belongs to `jobs`. References `workers`.

### 2.8. workers

- **Purpose**: Worker node metadata.
- **Primary Key**: `id` (UUID).
- **Relationships**: References active jobs.
- **Expected CRUD**: Created on container boot. Deleted on clean exit.

### 2.9. dead_letter_entries

- **Purpose**: Failed task quarantines.
- **Primary Key**: `id` (UUID).
- **Relationships**: References `jobs`.
- **Business Invariants**: Immutable once written.
- **Retention Policy**: Expired after 30 days.
