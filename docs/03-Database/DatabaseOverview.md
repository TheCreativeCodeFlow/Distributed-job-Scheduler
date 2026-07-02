# Database Overview

This document details database configuration targets and technology selections.

## 1. Technology Selection

- **Database Engine**: PostgreSQL 16.x
- **Schema Mapping & Migrations**: Prisma ORM
- **Key-Value Store / Cache**: Redis 7.x

## 2. Shared Libraries

All database mappings and execution clients must live inside `packages/database`.

- Primary connection pooling managed at worker and API configurations.
