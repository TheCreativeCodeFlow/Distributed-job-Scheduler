# Communication Patterns

This document details protocol designs, networking standards, and payload transport rules.

## 1. Internal Communication

- **API to Broker**: Unicast queue pushing.
- **Worker to Broker**: Polling/Subscribing mechanics.
- **Components to Database**: Direct connections via Prisma ORM pool.

## 2. External Communication

- **Client to API**: HTTP JSON REST API interfaces.
- **Server to Client (UI)**: Server-Sent Events (SSE) or WebSockets for real-time monitoring.
