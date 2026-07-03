# API Integration Reference

This document maps the API request pipeline and connection settings.

## 1. Network Interceptors Pipeline

All backend communications delegate through `apiClient` (Axios wrapper instance):

```
Request ──> [ Attach Bearer Token ] ──> Server
                                          │
Response <── [ Process Token Refreshes ] <┘
  │ (If 401: Refresh Token Rotation (RTR) resolves, retries requests)
  ▼
Client Callers
```

---

## 2. Request Queuing

When an HTTP 401 error fires, the interceptor locks downstream calls, executes a single POST request to `/auth/refresh` to renew the access token, and triggers queued retries for all pending requests.

---

## 3. RFC 7807 Error Maps

Errors returned from the backend are structured in standard Problem Details format. Interceptors bubble up the specific error details directly, which the `useToast` hook presents on validation failure.
