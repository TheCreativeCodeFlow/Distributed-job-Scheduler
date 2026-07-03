# Design System

This document outlines the visual variables of the TaskFlow enterprise admin design system.

## 1. 8px Spacing System

Layout dimensions, border paddings, and component alignments enforce a strict 8px increment pattern:

- `p-2` (8px), `p-4` (16px), `p-6` (24px)
- Gap margins: `gap-4` (16px), `gap-8` (32px)

---

## 2. Typography

- **Primary Text**: `Geist Sans` (inter-sans equivalent for clear corporate layout).
- **Code/Payloads**: `Geist Mono` (ideal for JSON formats and stack trace views).
- Headings are assigned `tracking-tight font-extrabold` values to emphasize visual weight.

---

## 3. Custom Glassmorphism Panels

Utilize class utility layers for overlays:

```css
.glass-panel {
  background: rgba(23, 23, 23, 0.45);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.08);
}
```

This is ideal for floating dropdown cards, popovers, and side menu elements.
