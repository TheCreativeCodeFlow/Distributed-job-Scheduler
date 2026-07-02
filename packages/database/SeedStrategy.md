# Database Seed Strategy

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

1. [Target Environment Seed Configurations](#1-target-environment-seed-configurations)
2. [Production Seeding Requirements](#2-production-seeding-requirements)
3. [Testing & Development Mock Datasets](#3-testing--development-mock-datasets)

---

## 1. Target Environment Seed Configurations

Seeding procedures load different default configurations based on the environment:

### 1.1. Production Environment

- **Identity & Access**: A single default System Administrator account is created via CLI parameters (no hardcoded credentials).
- **Settings**: System configurations (`system_settings` table) are populated with defaults:
  - `max_jobs_per_project_cap` = `1000000`
  - `worker_lease_default_ttl_seconds` = `30`
- **Policies**: Standard `default_retry_policy` (max attempts = 3, backoff factor = 2.0).

---

## 2. Production Seeding Requirements

To ensure environment security:

- **No Production Mock Data**: Seeding scripts must detect if they are running in production and block mock customer/project generations.
- **Passwords Hashing**: Administrative user passwords are encrypted using cryptographically secure algorithms (bcrypt) before database writes.

---

## 3. Testing & Development Mock Datasets

Development and staging environments load simulated customer profiles:

- **Sample Organizations**: `Org A` (Premium Plan), `Org B` (Free Plan).
- **Sample Projects**: `Production-Web`, `Staging-Api`.
- **Sample Queues**:
  - `payment-transactions` (concurrency = 50, retry policy ID maps to transaction backoff).
  - `email-notifications` (concurrency = 10, default retry).
- **Job Backlog Simulations**: Populates 10,000 mock jobs (queued, scheduled, and completed states) to enable local stress-testing of worker claim loops.
