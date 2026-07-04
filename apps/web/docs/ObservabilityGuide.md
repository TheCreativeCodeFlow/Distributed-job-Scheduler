# Observability Guide

This document outlines how to audit systems health.

## 1. Latency Targets

- **Database Latency**: Target < 50ms. High database latency indicates lock contention or indexing delays.
- **Redis Latency**: Target < 5ms. High redis latency indicates memory limit pressure or networking overheads.

---

## 2. Auto-Refresh Policies

- Auto-refreshes pull background stats at configurable intervals (5s, 10s, 30s).
- Refreshes automatically pause when tab visibility is hidden.
