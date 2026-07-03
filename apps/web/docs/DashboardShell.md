# Dashboard Shell

This document outlines the layout shell design of the TaskFlow dashboard console.

## 1. Frame Architecture

The dashboard shell wraps page content inside a responsive grid frame:

- **collapsible Sidebar**: Persistent on desktop, floating sliding drawer on mobile viewports.
- **Top Navigation Bar**: Sticky header holding workspace selection controls, search palettes, notification centers, and user profile menus.
- **Dashboard Container**: Wraps page children with skip-to-content anchors for WCAG keyboard accessibility.
