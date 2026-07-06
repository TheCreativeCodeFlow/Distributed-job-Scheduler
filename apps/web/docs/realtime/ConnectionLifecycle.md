# Connection Lifecycle and Fault Tolerance

This document details reconnection, fallback, visibility, and network state handling.

## Connection States

- **Connected**: SSE connection active. Polling is disabled (`'off'`).
- **Connecting**: Opening the connection.
- **Reconnecting**: Retrying after connection loss.
- **Disconnected**: Closed by application or network disruption.
- **Polling Fallback**: Active polling replaces SSE.

## Exponential Backoff Sequence

When a connection fails, reconnection is scheduled using the following sequence of delays:

1. `1000ms` (1 second)
2. `2000ms` (2 seconds)
3. `5000ms` (5 seconds)
4. `10000ms` (10 seconds)
5. `30000ms` (30 seconds)
6. `60000ms` (60 seconds, capped maximum)

## Visibility Actions

- **Hidden Tab**: Unnecessary reconnection attempts are suspended to preserve worker concurrency and battery life.
- **Visible Tab**: If disconnected, reconnection starts immediately.

## Offline Handling

Online/Offline states are tracked automatically via browser network state listeners. If the device goes offline:

1. Current active connection is closed immediately.
2. Reconnect timers are cleared.
3. Offline banner is displayed at the top of the interface.
4. When connection returns, reconnection runs immediately.
