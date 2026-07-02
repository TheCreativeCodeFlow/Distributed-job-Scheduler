# API Pagination

This document outlines listing endpoints pagination standards.

## 1. Parameters

- `cursor`: Token defining the seek pointer (opaque string based on date/ID).
- `limit`: Maximum count of items returned (default 20, max 100).

## 2. Response Wrapper

```json
{
  "data": [],
  "pagination": {
    "next_cursor": "eyJpZCI6MTIzfQ==",
    "has_more": true
  }
}
```
