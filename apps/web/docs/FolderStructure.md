# Folder Structure Reference

This document maps the project directory layout designed for `@repo/web`.

```
apps/web/
├── src/
│   ├── app/                # Next.js page components and route definitions
│   ├── components/         # Reusable layouts, charts, and tables
│   │   ├── feedback/       # Toast containers and loader blocks
│   │   ├── layout/         # Navigation bars, sidebars, breadcrumbs
│   │   ├── tables/         # Generic DataTable architectures
│   │   └── ui/             # Standard inputs, badges, cards, dialog drawers
│   ├── hooks/              # Global media and utility hooks
│   ├── lib/                # Class utilities and tailwind cn helper
│   ├── providers/          # Query, Theme, and RouteSession contexts
│   ├── services/           # Axios instance client layers
│   ├── store/              # Zustand global state stores
│   ├── types/              # Domain and Authentication definitions
│   └── utils/              # Query parameter and pagination helpers
├── docs/                   # Architectural manual sheets
├── tailwind.config.js      # CSS configuration setups
└── postcss.config.js       # PostCSS plugins mapping
```
