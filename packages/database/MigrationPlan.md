# Database Migration Plan

**Document Version**: 1.0.0  
**Status**: APPROVED  
**Author**: Principal Database Engineer  
**Last Updated**: 2026-07-02

---

## Revision History

| Version | Date       | Description                                | Author             |
| :------ | :--------- | :----------------------------------------- | :----------------- |
| 1.0.0   | 2026-07-02 | Initial release for Database Schema Review | Principal Engineer |

---

## Table of Contents

1. [Migration Execution Order](#1-migration-execution-order)
2. [Dependency Isolation Tiers](#2-dependency-isolation-tiers)
3. [Rollback & Failure Recovery Procedures](#3-rollback--failure-recovery-procedures)

---

## 1. Migration Execution Order

Migrations must execute in a sequential, dependency-ordered pipeline to ensure referential integrity rules are respected:

1. **Tier 1 (Core Identity & Configuration)**:
   - `users`
   - `organizations`
   - `retry_policies`
   - `system_settings`
2. **Tier 2 (Administrative Boundaries)**:
   - `organization_members`
   - `api_keys`
   - `projects`
3. **Tier 3 (Queue Configuration)**:
   - `queues`
4. **Tier 4 (Worker Registries)**:
   - `workers`
5. **Tier 5 (Job & Executions)**:
   - `jobs` (references `queues` and `workers`)
   - `scheduled_jobs`
   - `job_executions`
6. **Tier 6 (Transient Logs & Quarantines)**:
   - `worker_leases`
   - `worker_heartbeats`
   - `job_logs`
   - `dead_letter_entries`
   - `audit_logs`

---

## 2. Dependency Isolation Tiers

- **Retry Policies**: Must be created before `queues` because each queue configuration requires a valid `retry_policy_id` reference.
- **Queues**: Must exist before `jobs` can be ingested.
- **Jobs**: Must exist before execution log records (`job_executions`) or quarantine records (`dead_letter_entries`) are created.

---

## 3. Rollback & Failure Recovery Procedures

- **Transactional Migrations**: All migration steps run within explicit PostgreSQL transactional blocks (`BEGIN` / `COMMIT`). If a constraint fails mid-migration, the database rolls back all modifications.
- **Downgrade Execution**:
  - Rollback commands run in reverse order (Tier 6 down to Tier 1).
  - Column deprecations are completed using the expand-contract pattern:
    - _Step A_: Add new column as nullable.
    - _Step B_: Backfill values.
    - _Step C_: Make column required and drop old fields.
