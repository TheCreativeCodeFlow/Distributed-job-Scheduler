# Archiving & Retention Strategy

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

1. [Data Retention Schedule](#1-data-retention-schedule)
2. [Soft vs. Hard Deletion Policies](#2-soft-vs-hard-deletion-policies)
3. [GDPR-Ready Deletion Strategy](#3-gdpr-ready-deletion-strategy)

---

## 1. Data Retention Schedule

The persistence layer enforces strict retention policies to manage database size and comply with data privacy regulations:

| Data Category         | Target Table          | Retention Period         | Action                          |
| :-------------------- | :-------------------- | :----------------------- | :------------------------------ |
| **Active Jobs**       | `jobs`                | Permanent until complete | Keep                            |
| **Completed Jobs**    | `jobs`                | 7 days                   | Hard delete                     |
| **Execution Logs**    | `job_executions`      | 90 days                  | Archive to cold storage, delete |
| **Dead Letter Queue** | `dead_letter_entries` | 30 days                  | Delete                          |
| **Audit Logs**        | `audit_logs`          | 1 year                   | Archive, delete                 |
| **Worker Registry**   | `workers`             | 24 hours of inactivity   | Hard delete                     |

---

## 2. Soft vs. Hard Deletion Policies

- **Soft Delete**:
  - Used for `projects` and `queues` using a `deleted_at` timestamp.
  - _Rationale_: Allows restoring configurations and preserves historical execution log links.
- **Hard Delete**:
  - Used for completed jobs and expired worker records to prevent table bloat.

---

## 3. GDPR-Ready Deletion Strategy

- **Right to Be Forgotten**:
  - When a user deletes their account, their personal data (email, name) is scrubbed (`UPDATE users SET email = 'deleted_user_' || id, name = 'Deleted User' WHERE id = $1`).
  - Core job execution statistics and count metrics are preserved, but all associations with the user's personal identity are removed.
