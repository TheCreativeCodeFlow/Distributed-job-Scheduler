# Layout Guidelines

This document outlines structural grid, padding, and response rules for page layouts.

## 1. Grid Breakpoints

Page elements must adjust smoothly across responsive viewport breakpoints:

- **Mobile (<768px)**: Single column statistics, collapsed floating sidebar, stacked input forms, horizontal table scroll frames.
- **Tablet (768px - 1024px)**: 2-column statistics grid, responsive menu headers.
- **Desktop (>1024px)**: 4-column statistics grids, visible persistent sidebar, side-by-side workspace selectors.

---

## 2. Margin & Padding Rules

- Pages are wrapped inside `<DashboardContainer>` with a maximum width of `max-w-7xl` and responsive padding: `p-6 md:p-8`.
- Component sections are spaced using a standard gap margin of `space-y-6`.
