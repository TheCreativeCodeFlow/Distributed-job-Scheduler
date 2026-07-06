# Server-Sent Events (SSE) Client Integration

This document outlines the usage and implementation details of the Server-Sent Events client module.

## Overview

The `SSEClient` is a singleton class designed to manage the lifetime of exactly one `EventSource` connection to the API backend events endpoint (`GET /api/v1/events/stream`).

## API Usage

### Setting Up Authentication

Native browser `EventSource` does not support custom request headers like `Authorization`. Therefore, the access token is supplied via query parameters:

```ts
import { SSEClient } from '../../lib/live/SSEClient';

SSEClient.setTokenGetter(() => {
  return useAuthStore.getState().accessToken;
});
```

### Enabling and Disabling Connection

Control connection state programmatically:

```ts
SSEClient.enable(); // Connects to backend if token and online status are met

SSEClient.disable(); // Closes the active EventSource and stops reconnect timers
```

### Reconnection Interface

To trigger manual recovery:

```ts
SSEClient.reconnect();
```
