# Real-time System Architecture

This document describes the flow of real-time server mutations to the user interface.

## Flow Diagram

```
[ Backend Mutation ]
        │
        ▼
[ EventBusService ]
        │
        ▼
[ SSEController ]
        │
        ▼  (text/event-stream)
[ SSEClient ] (Singleton)
        │
        ▼
[ EventDispatcher ]
   ┌────┴────────────────────────┐
   ▼                             ▼
[ SSEManager ]             [ Custom Hook Listeners ]
   │
   ├─► Invalidate Cache Keys via [ RefreshManager ]
   └─► Display Live Toasts via [ useNotificationStore ]
```

## Architectural Decoupling

No UI component instantiates or consumes `EventSource` directly. The data stream is completely decoupled from components:

1. Components read from TanStack Query caches.
2. The SSE platform invalidates keys selectively upon event arrival.
3. TanStack Query automatically refetches the updated data for visible components.
