# Theme Customization Guide

This document maps customization parameters for the TaskFlow web console.

## 1. System Themes Syncing

Themes are selected using the `ThemeToggle` menu bar component. The platform persists selections inside local storage.

- If **system** mode is chosen, the engine registers a window prefers-color-scheme media listener and applies dark or light CSS classes automatically.

---

## 2. Palette Variable Configs

CSS classes map to tailwind colors using HSL variables defined in `src/app/globals.css`:

- `--background` & `--foreground`
- `--primary` & `--secondary`
- `--muted` & `--accent`
- `--border` & `--input`

Changes to variables sync instantly, making rebranding or customization of colors simple.
