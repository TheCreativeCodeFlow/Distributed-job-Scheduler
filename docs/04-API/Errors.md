# API Errors Schema

This document details error payload standards.

## 1. Error Payload Format

All HTTP failure responses (4xx, 5xx) must follow this schema:

```json
{
  "success": false,
  "error": {
    "code": "BAD_REQUEST",
    "message": "Validation failed",
    "details": []
  }
}
```

## 2. Common Codes

- `UNAUTHORIZED`
- `FORBIDDEN`
- `NOT_FOUND`
- `QUEUE_PAUSED`
- `INTERNAL_SERVER_ERROR`
