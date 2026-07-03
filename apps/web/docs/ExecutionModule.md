# Execution History Module

This document outlines the Execution History module.

## 1. Execution Logs Telemetry

- Lists execution ID, Job ID reference, target queue name, worker hostname, duration timer, and exit code.
- Filters by worker instances, queue identifiers, or status states (RUNNING, CLAIMED, COMPLETED, FAILED).

---

## 2. Timing Statistics

- Calculates and formats execution elapsed seconds and milliseconds.
- Displays exit codes (e.g. 0 for success, non-zero for failures).
