# Git Workflow

This document details the branch lifecycle, commit guidelines, and integration workflows.

## 1. Development Process

1. **Pull Latest Changes**: Ensure your local base branch is up-to-date.
   ```bash
   git checkout main
   git pull origin main
   ```
2. **Create Feature Branch**: Create a branch starting from `main` using kebab-case.
   ```bash
   git checkout -b feat/add-scheduler-queue
   ```
3. **Coding & Verification**: Perform tasks, format, type-check, and lint local files.
   ```bash
   pnpm format
   pnpm lint
   pnpm typecheck
   ```
4. **Interactive Commits**: Run the commitizen wizard to commit your changes following Conventional Commits format.
   ```bash
   pnpm commit
   ```
5. **Open Pull Request**: Push your branch and open a PR targeting `main`.

## 2. Conventional Commits Format

We enforce conventional commits syntax. A commit message must follow this schema:

```text
<type>(<scope>): <subject>

[optional body]

[optional footer(s)]
```

### Types:

- `feat`: A new user-facing feature.
- `fix`: A bug fix.
- `docs`: Documentation-only changes.
- `style`: Changes that do not affect code logic (formatting, spaces).
- `refactor`: Restructuring code without changing behavior.
- `perf`: Code changes that optimize performance.
- `test`: Adding or correcting tests.
- `build`: Build system changes (package updates, TS configs).
- `ci`: CI pipeline updates.
- `chore`: General maintainer tasks (Husky, Prettier).
- `revert`: Reverting previous commits.

## 3. Pull Request Merging

- All PRs require review and approval from at least one engineer.
- All CI pipeline runs must pass successfully.
- Code must be merged using the **Squash and Merge** strategy.
