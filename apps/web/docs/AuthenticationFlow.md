# Authentication Flow

This document details the frontend authentication flow sequence.

## 1. Login sequence

```
Client Form ──[ validated via Zod ]──> Axios Client ──> POST /auth/login
                                                            │
User Profile, AccessToken, RefreshToken <───────────────────┘
  │
Saved to Zustand useAuthStore (LocalStorage)
  │
Redirects to /dashboard
```

---

## 2. Token Refresh Sequence (Axios Interceptors)

If a client request fails with HTTP 401:

- Locks incoming requests (`isRefreshing = true`).
- Enqueues all downstream calls.
- Executes POST `/auth/refresh` using the stored refresh token.
- On success: updates tokens inside Zustand, resolves the queued promises, and retries the original request.
- On failure: purges the session and redirects to `/session-expired`.
