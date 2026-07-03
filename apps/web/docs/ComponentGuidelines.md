# Component Guidelines

This document details guidelines for developing frontend components for the Distributed Job Scheduler console.

## 1. Core Principles

- **No Direct API calls**: Components must delegate all queries and mutations to TanStack Query hooks, keeping API client integrations isolated.
- **Pure Presentation**: Prefer styling presentation variables via standard HSL class rules rather than embedding logic computations.
- **Accessibility (a11y)**: Focus states, hover prompts, and active inputs must map proper ARIA attributes (`aria-expanded`, `aria-label`, focus loops).

---

## 2. File Template Conventions

Each feature or component directory should group files logically:

```
components/ui/button.tsx
```

Keep component files under 250 lines. Break massive structures down into modular children templates.
