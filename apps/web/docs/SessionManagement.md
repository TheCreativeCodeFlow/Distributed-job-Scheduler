# Session Management

This document details session restorations, token lifecycles, and auto-logouts.

## 1. Session Restoration & Silent Refresh

- **Restoration**: On initial mount, `AuthProvider` checks if a persisted `refreshToken` exists in local storage.
- **Silent Refresh**: If present, it executes a background silent call to `/auth/refresh` before rendering children. This ensures that a user remains logged in seamlessly across page reloads.

---

## 2. Expiration & Auto-Logout

- **Auto-Logout**: If the refresh token has expired or is blocklisted (e.g. by another session's RTR rotation reuse), the refresh request fails.
- **Redirection**: The provider clears the Zustand session state and redirects the user to `/session-expired`, prompting them to sign back in.
