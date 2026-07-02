# Pull Request Checklist

This document details the review verification requirements for contributors and reviewers.

## 1. Before Submitting review

Ensure the following tasks are executed:

- [ ] Run `pnpm typecheck` locally to confirm all packages build cleanly.
- [ ] Run `pnpm lint` to check for linter complaints.
- [ ] Run `pnpm format` to confirm Prettier standards.
- [ ] Verify unit tests run successfully.
- [ ] Create a changeset file using `pnpm changeset` if the PR alters packages.

## 2. PR Review Process

Reviewers must inspect:

- **Type safety**: Ensure interfaces and strict types are maintained.
- **Architectural limits**: Check that package layers (e.g. database, utilities) are isolated correctly.
- **Test coverage**: Validate that edge cases and error conditions are tested.
- **Lint status**: The CI pipeline checks must pass cleanly.
