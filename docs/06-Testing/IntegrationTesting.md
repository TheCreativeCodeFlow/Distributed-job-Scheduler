# Integration Testing

This document details guidelines for writing integration tests.

## 1. Scope

- Verifying API routes process payloads and mutate data stores.
- Workers consuming messages from queue brokers.

## 2. Infrastructure Isolation

- Run integration tests in isolated Docker containers (e.g. using Testcontainers or dedicated docker-compose profiles).
- Clean db tables between tests to prevent tests bleed.
