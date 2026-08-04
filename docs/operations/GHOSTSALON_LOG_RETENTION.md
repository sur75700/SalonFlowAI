# GhostSalon Backend Log Retention

## Purpose

GhostSalon writes backend runtime output to:

```text
.ghostsalon/logs/backend.log
```

Phase 62C4A-P0 adds bounded, project-owned rotation before structured
Intelligence observability is enabled.

## Default policy

- Rotation threshold: 100 MiB
- Retained compressed generations: 7
- Maximum age: 14 days
- Maximum aggregate archive size: 1 GiB
- Active and archived file mode: 0600
- Archive directory: `.ghostsalon/logs/archive`
- State directory: `.ghostsalon/state`
- Concurrency guard: `flock`

## Safety model

Rotation uses a project-owned, runtime-generated `logrotate` configuration
while the backend log has no open writers. `logrotate` performs the controlled
rename/create operation. The archive is checked by byte count and SHA-256
before compression, and compression is verified with `gzip -t`.

The helper refuses active writers with exit code `23`. This avoids the
data-loss window associated with blind `copytruncate`. Use the canonical
GhostSalon stop/start workflow for controlled reopening.

GhostSalon-start performs a preflight rotation before launching the backend.
It can be skipped only by the internal restoration guard:

```text
GHOSTSALON_SKIP_LOG_ROTATION=1
```

## Commands

```bash
scripts/ghostsalon-rotate-logs --status
scripts/ghostsalon-rotate-logs --check
scripts/ghostsalon-rotate-logs --rotate-if-needed
scripts/ghostsalon-rotate-logs --force
```

## Configuration

The following non-secret shell variables may override defaults:

```text
GHOSTSALON_LOG_ROTATE_BYTES
GHOSTSALON_LOG_RETAIN_COUNT
GHOSTSALON_LOG_RETAIN_DAYS
GHOSTSALON_LOG_RETAIN_BYTES
GHOSTSALON_LOG_LOCK_WAIT
```

Path variables are also overridable for disposable tests.

## Invariants

- The active log is never removed by retention.
- No archive is compressed before size/SHA verification.
- Rotation does not alter backend application code.
- Rotation does not print backend payloads or secrets.
- Mongo network binding is outside this phase.
