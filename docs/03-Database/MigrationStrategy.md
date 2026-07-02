# Migration Strategy

This document details database schema modification and deployment workflows.

## 1. Migration Lifecycles

- **No Destructive Operations**: Deleting columns or changing column data types must be done in multi-phase backward-compatible deployments.
- **ORM Tooling**: We use Prisma Migrations (`prisma migrate dev` / `prisma migrate deploy`).

## 2. CI/CD Operations

- Schema checks are executed in isolated testing environments before merge.
- Migrations deploy automatically during release pipelines.
