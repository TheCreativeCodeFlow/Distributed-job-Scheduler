# Branch Strategy

This document describes our branch naming scheme and lifecycle management.

## 1. Protected Branches

- **`main`**: The source of truth for production. Code must never be committed directly to `main`. Integration requires a Pull Request matching reviewers approvals and green CI status.

## 2. Branch Mappings

Use the prefix categories below when creating local development branches:

| Prefix      | Category      | Description                                | Example                    |
| :---------- | :------------ | :----------------------------------------- | :------------------------- |
| `feat/`     | Feature       | Adding a new capability                    | `feat/job-priority-queues` |
| `fix/`      | Bug Fix       | Correcting an issue                        | `fix/memory-leak-worker`   |
| `docs/`     | Documentation | Creating or updating markdown files        | `docs/add-api-endpoints`   |
| `perf/`     | Performance   | Code adjustments optimizing metrics        | `perf/worker-poll-latency` |
| `refactor/` | Refactoring   | Adjusting structure without changing logic | `refactor/logger-exports`  |
| `chore/`    | Chore         | Updating settings or dependency tools      | `chore/upgrade-eslint`     |

## 3. Merging Policy

- Pull Requests must contain a descriptive title matching Conventional Commits.
- Merges are performed via **Squash and Merge**. This keeps the repository history linear and clean.
