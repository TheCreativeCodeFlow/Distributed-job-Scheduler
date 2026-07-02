# Performance Testing

This document tracks execution speed and system performance benchmarks.

## 1. Benchmarking Paths

- CPU profiles of worker execution loops.
- Memory leak detection (e.g. heap dumps inspection under high queue churn).

## 2. Thresholds

- Memory consumption stable baseline (<150MB per worker instance).
- Garbage collection sweeps non-blocking.
