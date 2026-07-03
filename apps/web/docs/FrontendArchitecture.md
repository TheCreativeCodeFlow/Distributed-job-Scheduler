# Frontend Architecture

This document presents the architecture design of the TaskFlow enterprise web admin frontend console.

## 1. Technological Strategy

- **Framework**: Next.js 15 (App Router) utilizing React 19 concurrent features.
- **Routing**: Folder-based app routing directory. Sessions are protected via route guards (`AuthProvider`) redirecting unauthenticated traffic to `/login`.
- **CSS Engine**: Tailwind CSS v3.
- **State Store**: Zustand for layout toggles, notifications, auth tokens, filters, and user settings.
- **Server Cache**: TanStack React Query for background synchronizations.

---

## 2. Directory Layout Architecture

- `src/app/`: Versioned routing.
- `src/components/`: Pure visual layout elements (e.g. `DataTable`, custom SVGs, layout components).
- `src/providers/`: Context wrapping layers (Query parameters, sessions, themes).
- `src/store/`: Zustand state definitions.
- `src/services/`: Typesafe API client instances and Axios interceptors.
- `src/utils/`: Common formatting and pagination helpers.
- `src/hooks/`: Media and query state hooks.
