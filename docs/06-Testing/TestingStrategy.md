# Testing Strategy

This document establishes the testing methodologies for the monorepo codebase.

## 1. Testing Pyramid

- **Unit Tests (70%)**: Speed checking of utility methods, Zod schemas validation.
- **Integration Tests (20%)**: DB queries execution, Redis connectivity and queue scheduling checks.
- **End-to-End Tests (10%)**: Dashboard browser automated checks.

## 2. Tooling Targets

- **Unit/Integration**: Vitest
- **E2E**: Playwright
- **CI Trigger**: GitHub Actions runs tests on every PR commit.
