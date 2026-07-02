# Test Coverage Goals

This document tracks codebase test coverage metrics.

## 1. Targets

- **Overall Workspace Coverage**: >80% statement coverage.
- **Shared Libraries (`packages/*`)**: >90% coverage.
- **Critical Paths (Scheduler logic)**: 100% boundary testing.

## 2. Enforcement

- Coverage statistics are calculated on pre-release builds.
- PRs that reduce coverage below defined thresholds will fail build checks.
