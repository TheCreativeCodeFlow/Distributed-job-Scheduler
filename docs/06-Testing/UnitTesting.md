# Unit Testing

This document details guidelines for writing unit tests.

## 1. Scope

- Focus on stateless logic (helpers, validators, string converters).
- Mock all external network or filesystem bindings.

## 2. Best Practices

- Locate tests adjacent to target source files (e.g. `jobParser.test.ts` next to `jobParser.ts`).
- Avoid testing implementation details; test interface boundaries instead.
