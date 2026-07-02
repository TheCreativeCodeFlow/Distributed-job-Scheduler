# Naming Conventions

This document outlines naming conventions to ensure consistency across monorepo packages.

## 1. Directory and File Names

- **Folders**: Lowercase hyphenated names (kebab-case) for all project directories (e.g. `packages/database`, `apps/api`).
- **TypeScript Files**:
  - Use `camelCase` for general files (e.g. `jobScheduler.ts`, `databaseClient.ts`).
  - Use `PascalCase` for React component files, if applicable (e.g. `DashboardCard.tsx`).
- **Configuration Files**: Use standard filenames (e.g. `eslint.config.js`, `tsconfig.json`).

## 2. Variables and Functions

- **Variables**: Use `camelCase` (e.g. `jobId`, `workerTimeout`).
- **Constants**: Use `UPPER_CASE_SNAKE` for system constants (e.g. `MAX_RETRIES`, `REDIS_CONNECTION_LIMIT`).
- **Functions**: Use `camelCase` and start with a verb (e.g. `createJob()`, `fetchActiveWorkers()`, `updateJobStatus()`).

## 3. Types and Interfaces

- **Interfaces**: Use `PascalCase`. Do NOT prefix with `I` (e.g. `JobPayload` instead of `IJobPayload`).
- **Types**: Use `PascalCase` (e.g. `WorkerState`).
- **Generics**: Use capital letter placeholders (e.g. `T`, `U`) or descriptive names starting with `T` (e.g. `TResult`).

## 4. Classes

- **Class Names**: Use `PascalCase` (e.g. `QueueBroker`, `WorkerPool`).
- **Private Properties**: Use standard camelCase without leading underscores.
