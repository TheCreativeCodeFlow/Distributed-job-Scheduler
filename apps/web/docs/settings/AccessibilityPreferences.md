# Accessibility Preferences

## Overview

The Accessibility tab in Settings provides user-controllable options that complement OS-level accessibility features. All settings apply CSS classes or custom properties to `document.documentElement` immediately via `PreferencesProvider`.

---

## Settings Reference

### Reduced Motion

**Preference key:** `reducedMotion: boolean`
**CSS class:** `.reduce-motion`

```css
.reduce-motion *,
.reduce-motion *::before,
.reduce-motion *::after {
  animation-duration: 0.01ms !important;
  animation-iteration-count: 1 !important;
  transition-duration: 0.01ms !important;
  scroll-behavior: auto !important;
}
```

**Behavior:** Effectively disables all CSS animations and transitions across the entire application. This is equivalent to the OS `prefers-reduced-motion: reduce` media query at the application layer.

**Recommended for:** Users with vestibular disorders, epilepsy sensitivity, or motion sickness.

> **Note:** The browser's OS-level `prefers-reduced-motion` media query is also respected by browsers that support it. The user preference setting provides an in-app override independent of the OS setting.

---

### High Contrast

**Preference key:** `highContrast: boolean`
**CSS class:** `.high-contrast`

```css
.high-contrast {
  --foreground: 0 0% 100%;
  --muted-foreground: 0 0% 80%;
  --border: 240 5% 40%;
  --primary: 263.4 85% 65%;
}
.high-contrast.light {
  --foreground: 240 10% 0%;
  --muted-foreground: 240 10% 20%;
  --border: 240 5.9% 60%;
  --primary: 262.1 90% 42%;
}
```

**Behavior:** Overrides CSS custom properties to increase contrast ratios. Works in both dark and light themes.

**Recommended for:** Users with low vision or who need higher contrast for extended work sessions.

---

### Font Scale

**Preference key:** `fontScale: 'sm' | 'md' | 'lg' | 'xl'`
**CSS property:** `--font-scale`

```css
html {
  --font-scale: 1;
  font-size: calc(16px * var(--font-scale));
}
```

| Value | Multiplier | Effective Base Size |
| ----- | ---------- | ------------------- |
| `sm`  | 0.875      | 14px                |
| `md`  | 1          | 16px (default)      |
| `lg`  | 1.125      | 18px                |
| `xl`  | 1.25       | 20px                |

**Behavior:** Scales all `rem`-based sizing proportionally — text, spacing, icons. Since the entire design system uses `rem` units, increasing font scale increases all layout dimensions uniformly.

**Recommended for:** Users who need larger text for readability.

---

### Keyboard Navigation Enhancements

**Preference key:** `keyboardNavEnhancements: boolean`
**CSS class:** `.keyboard-nav`

```css
.keyboard-nav :focus-visible {
  outline: 2px solid hsl(var(--primary));
  outline-offset: 3px;
  border-radius: 4px;
  box-shadow: 0 0 0 4px hsl(var(--primary) / 0.2);
}
```

**Behavior:** Adds a prominent violet glow focus ring to all elements that receive keyboard focus. The `:focus-visible` selector ensures the ring only appears for keyboard navigation (not mouse clicks), preserving clean aesthetics for pointer users.

**Recommended for:** Keyboard-only users, users relying on assistive technology.

---

## Developer Mode

**Preference key:** `developerMode: boolean`

Not strictly an accessibility feature, but grouped here as it affects the diagnostic overlay of the application. When enabled, a warning callout is shown in the Accessibility tab to remind operators to disable it before sharing screenshots.

---

## Implementation Notes

### PreferencesProvider Side-Effect Order

CSS classes and custom properties are applied via `useEffect` hooks in `PreferencesProvider`. Since React batches state updates, the order of application is:

1. `autoRefresh` / `pollingInterval` → `globalPollingController`
2. `reducedMotion` → `.reduce-motion` class
3. `highContrast` → `.high-contrast` class
4. `compactMode` → `.compact-mode` class
5. `keyboardNavEnhancements` → `.keyboard-nav` class
6. `fontScale` → `--font-scale` CSS variable

All effects run synchronously on mount (initial paint) so there is no FOUC (flash of unstyled content) for accessibility classes.

### WCAG Alignment

| Feature        | WCAG Criterion                          |
| -------------- | --------------------------------------- |
| Reduced Motion | 2.3.3 Animation from Interactions (AAA) |
| High Contrast  | 1.4.6 Contrast Enhanced (AAA)           |
| Font Scale     | 1.4.4 Resize Text (AA)                  |
| Keyboard Nav   | 2.4.7 Focus Visible (AA)                |
