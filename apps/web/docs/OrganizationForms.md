# Organization Creation Forms

This document details form validation schemas and client-side automation behaviors.

## 1. Creation Validator Schema

- **Name**: Required field between 1 and 100 characters.
- **Slug**: Required alphanumeric hyphened slug.
- **Auto Slug Builder**: Hook listens to name input value updates, parsing strings into alphanumeric lowercased strings:
  - `name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '')`
  - Changes validation triggers dynamically.

---

## 2. Settings Validation

- Validates profile updates using same parameters before triggering patch mutations.
- Intercepts bad API responses, displaying validation detail details via Toast notification panels.
