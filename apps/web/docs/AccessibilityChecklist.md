# Accessibility (a11y) Checklist

This document details the checklist enforced to maintain WCAG compliant accessibility across page layouts.

## 1. Keyboard Nav & Focus Mappings

- **Skip-to-Content**: Layouts include a skip-to-content anchor positioned first in the DOM, letting screen readers bypass navigation links.
- **Escape Key Actions**: Dialogs, command searches, and drawers must intercept `Escape` key events to close immediately.
- **Interactive Focus**: Focus states highlight elements clearly using Tailwind's `focus-visible:ring-2 focus-visible:ring-ring`.

---

## 2. ARIA Semantic Anchors

- Toggle buttons must map `aria-label` labels detailing the action (e.g. `aria-label="Close modal"`).
- Input select dropdown menus must declare explicit `aria-label="Select Organization"` tags.
- Modals declare `role="dialog"` and `aria-modal="true"`.
