# ADR-009: Authentication & Authorization Strategy

**Status**: ACCEPTED  
**Author**: Principal Software Architect  
**Last Updated**: 2026-07-02

---

## Context

API gateways must validate client identity and prevent unauthorized access. Programmatic triggers require static keys, while administrative consoles require session tokens.

## Problem

How should we secure API endpoints and the dashboard web interface?

## Alternatives Considered

1. **Cookie-Based Sessions**: Store session states in Redis and validate via cookie headers.
   - _Pros_: Session revocation is immediate.
   - _Cons_: Restricts client integrations; requires managing session states in the gateway.
2. **JWT-Based Authentication with Hashed API Keys**: JWT tokens secure web dashboard sessions, while hashed API keys authorize programmatic API requests.
   - _Pros_: Scalable, stateless JWT validation, and secure API key hashing.
   - _Cons_: Revocation requires short expirations or blacklists.

## Decision

Adopt **Alternative 2**. We use JWT-based authentication for dashboard users and hashed API keys for programmatic clients.

## Trade-offs & Consequences

- **Trade-offs**: Short JWT expirations (15 minutes) require implementing refresh token rotation patterns.
- **Consequences**:
  - Web dashboard requests require validating JWT signatures.
  - API keys use prefix strings (`djs_live_` or `djs_test_`) for environment routing.
