# Coding Standards

This document establishes the software development standards for the Distributed Job Scheduler codebase.

## 1. Core Principles

- **Simplicity**: Write straightforward code. Avoid over-engineering. Prefer readability over cleverness.
- **Type Safety**: Enforce strict TypeScript rules. Do not bypass the compiler with `any` types unless absolutely necessary (and documented with a reasoning comment).
- **Modularity**: Build single-responsibility components and modules. Keep logical layers isolated (e.g. database schema is independent of transportation layers).

## 2. TypeScript Best Practices

- **Strict Mode**: `strict: true` is enabled in `tsconfig.base.json`. Do not disable compiler checks in sub-package configs.
- **Explicit Returns**: Explicitly define function return types, especially for public-facing module APIs.
- **Use Enums/Literal Types**: Prefer union of string literals over numeric enums for configuration attributes.
- **Null & Undefined**: Prefer `undefined` for optional properties and function return values. Reserve `null` for database operations where DB columns allow nulls.

## 3. Asynchronous Code

- **Promises & async/await**: Always use `async/await` syntax instead of raw Promises or `.then()` chains.
- **Error Handling**: Wrap asynchronous execution paths in `try/catch` blocks.
- **Concurrence**: Leverage `Promise.all` for parallel operations where logical dependencies are not sequential.

## 4. Linting and Formatting

- Always format code using Prettier (`pnpm format`) before submitting a pull request.
- Ensure ESLint Flat Config has zero warnings or errors (`pnpm lint`).
- Fix all lint errors automatically where possible (`eslint --fix`).
