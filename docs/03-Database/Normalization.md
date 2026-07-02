# Normalization Guidelines

This document details database schemas normalization targets.

## 1. Normal Forms Targets

- Tables are structured to comply with Third Normal Form (3NF).
- No repeating groups or functional dependencies on non-primary fields.

## 2. Denormalization Exceptions

- `payload` JSONB fields in `Job` table store operational configurations. This avoids highly fragmented tables for dynamic runtime options.
