# Repository Structure

This document describes the design principles and structure of the monorepo workspaces.

## 1. Directory Layout

The workspace is organized into two primary boundaries:

- **`apps/`**: Applications containing executable binaries, API routes, user interfaces, or workers.
  - `apps/api`: REST ingestion service. Exposes APIs to schedule and manage jobs.
  - `apps/worker`: Job scheduling runner daemon. Connects to queues and handles async tasks.
  - `apps/web`: React/Next.js dashboard web application.
- **`packages/`**: Reusable modules linked via pnpm workspaces.
  - `packages/config`: Common ESLint base and TypeScript base configurations.
  - `packages/database`: PostgreSQL client initialization, seed files, and Prisma connection handler.
  - `packages/logger`: Structured logging wrapper.
  - `packages/shared`: Shared types, interfaces, schemas, and validators.
  - `packages/utils`: Helper functions, converters, and wait utilities.

## 2. Dependency Rules

- **Strict Boundaries**: Packages must not have circular dependencies.
- **Root Level devDependencies**: Root `package.json` owns codebase-wide development configurations (typescript, eslint, prettier, turbo). Packages should not declare these as local devDependencies unless they extend them specifically.
- **Workspace Reference Prefix**: Workspace local packages are referenced using the `workspace:*` syntax in dependencies block.
