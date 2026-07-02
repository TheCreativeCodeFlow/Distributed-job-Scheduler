# Versioning Guidelines

This document details how package versioning and changesets are managed in this monorepo.

## 1. Semantic Versioning (SemVer)

Every package in the monorepo complies with Semantic Versioning 2.0.0:

- **MAJOR** (`X.0.0`): incompatible API changes.
- **MINOR** (`0.Y.0`): adding backward-compatible functionality.
- **PATCH** (`0.0.Z`): backward-compatible bug fixes.

## 2. Release Management with Changesets

We use [Changesets](https://github.com/changesets/changesets) to record changes and automate package releases.

### Workflow:

1. **Add a Changeset**: After completing modifications, run:
   ```bash
   pnpm changeset
   ```
2. Follow the prompt selector:
   - Identify packages changed.
   - Choose SemVer bump severity (major, minor, patch).
   - Enter a brief explanation of the change.
3. This creates a temporary `.changeset/*.md` file. Commit this file along with your changes.
4. **Publish Process**: On merging to `main`, CI triggers a release pipeline. Changeset processes the markdown files, bumps package versions in `package.json`, generates `CHANGELOG.md` updates, and releases packages.
