# Data Integrity Rules

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

1. [Database-Enforced Invariants](#1-database-enforced-invariants)

---

## 1. Database-Enforced Invariants

The database layout guarantees the following system rules:

### 1.1. Invariant 1: No Orphan Job Executions

- **Business Reason**: Every execution log must belong to a parent job record.
- **Database Enforcement**: `FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE`.
- **Failure Impact**: Dangling execution logs cause audit reporting errors.

### 1.2. Invariant 2: Completed Jobs are Immutable

- **Business Reason**: Completed jobs must not transition back to active states.
- **Database Enforcement**: A PostgreSQL check constraint or before-update trigger:
  ```sql
  CHECK (old.status != 'COMPLETED' OR new.status = 'COMPLETED')
  ```
- **Failure Impact**: Accidental re-execution of completed tasks.

### 1.3. Invariant 3: Queue Project Association

- **Business Reason**: A queue must belong to a project within the same organization.
- **Database Enforcement**: Foreign key checks on project association constraints.
- **Failure Impact**: Task cross-contamination across organizations.

### 1.4. Invariant 4: Active Lease Limit

- **Business Reason**: Exactly one active execution lease can exist for a job at a time.
- **Database Enforcement**: Unique index constraint on `(job_id, status)` WHERE `status = 'RUNNING'`.
- **Failure Impact**: Double execution.

### 1.5. Invariant 5: Worker Registration Requirement

- **Business Reason**: Worker heartbeats require an active registered worker node.
- **Database Enforcement**: Foreign key references pointing to the `workers` table.
- **Failure Impact**: Lost heartbeats and dangling lock keys.
