#!/usr/bin/env bash
set -Eeuo pipefail

export LC_ALL=C

ROOT="$(
  cd "$(dirname "${BASH_SOURCE[0]}")/../.." >/dev/null 2>&1 && pwd
)"
HELPER="$ROOT/scripts/ghostsalon-rotate-logs"
TMP="$(mktemp -d)"
WRITER_PID=""

cleanup() {
  set +e
  if [[ -n "$WRITER_PID" ]]; then
    kill "$WRITER_PID" 2>/dev/null || true
    wait "$WRITER_PID" 2>/dev/null || true
  fi
  rm -rf "$TMP"
}
trap cleanup EXIT

fail() {
  echo "FAIL: $*" >&2
  exit 1
}

export GHOSTSALON_LOG_DIR="$TMP/logs"
export GHOSTSALON_BACKEND_LOG="$TMP/logs/backend.log"
export GHOSTSALON_LOG_ARCHIVE_DIR="$TMP/logs/archive"
export GHOSTSALON_LOG_STATE_DIR="$TMP/state"
export GHOSTSALON_LOG_ROTATION_STATE="$TMP/state/rotation.env"
export GHOSTSALON_LOG_ROTATION_LOCK="$TMP/state/rotation.lock"
export GHOSTSALON_LOG_ROTATE_BYTES=1024
export GHOSTSALON_LOG_RETAIN_COUNT=3
export GHOSTSALON_LOG_RETAIN_DAYS=14
export GHOSTSALON_LOG_RETAIN_BYTES=10485760
export GHOSTSALON_LOG_LOCK_WAIT=1

mkdir -p "$GHOSTSALON_LOG_DIR"
python3 - "$GHOSTSALON_BACKEND_LOG" <<'PY_FIXTURE'
from pathlib import Path
import sys
Path(sys.argv[1]).write_bytes((b"ghostsalon-log-fixture\n" * 256))
PY_FIXTURE

ORIGINAL_SHA="$(sha256sum "$GHOSTSALON_BACKEND_LOG" | awk '{print $1}')"
ORIGINAL_BYTES="$(stat -c '%s' "$GHOSTSALON_BACKEND_LOG")"

"$HELPER" --rotate-if-needed

[[ -f "$GHOSTSALON_BACKEND_LOG" ]] \
  || fail "active log missing after rotation"
[[ "$(stat -c '%s' "$GHOSTSALON_BACKEND_LOG")" -eq 0 ]] \
  || fail "active log not reset"
[[ "$(stat -c '%a' "$GHOSTSALON_BACKEND_LOG")" == "600" ]] \
  || fail "active log mode is not 600"

mapfile -t ARCHIVES < <(
  find "$GHOSTSALON_LOG_ARCHIVE_DIR" \
    -maxdepth 1 \
    -type f \
    -name 'backend-*.log.gz'
)
[[ "${#ARCHIVES[@]}" -eq 1 ]] \
  || fail "expected one archive"

gzip -t "${ARCHIVES[0]}"
ARCHIVE_SHA="$(
  gzip -cd "${ARCHIVES[0]}" | sha256sum | awk '{print $1}'
)"
ARCHIVE_BYTES="$(
  gzip -cd "${ARCHIVES[0]}" | wc -c | tr -d ' '
)"
[[ "$ARCHIVE_SHA" == "$ORIGINAL_SHA" ]] \
  || fail "archive SHA mismatch"
[[ "$ARCHIVE_BYTES" == "$ORIGINAL_BYTES" ]] \
  || fail "archive byte count mismatch"
grep -q '^LAST_STATUS=SUCCESS$' "$GHOSTSALON_LOG_ROTATION_STATE" \
  || fail "success state missing"

printf 'small\n' > "$GHOSTSALON_BACKEND_LOG"
SMALL_BYTES="$(stat -c '%s' "$GHOSTSALON_BACKEND_LOG")"
"$HELPER" --rotate-if-needed
[[ "$(stat -c '%s' "$GHOSTSALON_BACKEND_LOG")" == "$SMALL_BYTES" ]] \
  || fail "below-threshold log changed"

python3 - "$GHOSTSALON_BACKEND_LOG" <<'PY_WRITER'
from pathlib import Path
import sys
Path(sys.argv[1]).write_bytes(b"x" * 4096)
PY_WRITER

tail -f "$GHOSTSALON_BACKEND_LOG" >/dev/null 2>&1 &
WRITER_PID=$!
sleep 0.2

set +e
"$HELPER" --force >"$TMP/active-writer.out" 2>&1
ACTIVE_STATUS=$?
set -e

[[ "$ACTIVE_STATUS" -eq 23 ]] \
  || fail "active writer was not safely rejected"
[[ "$(stat -c '%s' "$GHOSTSALON_BACKEND_LOG")" -eq 4096 ]] \
  || fail "active-writer rejection changed log"

kill "$WRITER_PID"
wait "$WRITER_PID" 2>/dev/null || true
WRITER_PID=""

mkdir -p "$GHOSTSALON_LOG_STATE_DIR"
(
  exec 8>"$GHOSTSALON_LOG_ROTATION_LOCK"
  flock 8
  sleep 2
) &
LOCK_PID=$!
sleep 0.2

set +e
"$HELPER" --force >"$TMP/lock.out" 2>&1
LOCK_STATUS=$?
set -e
wait "$LOCK_PID"

[[ "$LOCK_STATUS" -eq 75 ]] \
  || fail "concurrent lock was not enforced"

for index in 1 2 3 4 5; do
  python3 - "$GHOSTSALON_BACKEND_LOG" "$index" <<'PY_RETENTION'
from pathlib import Path
import sys
Path(sys.argv[1]).write_bytes(
    (f"retention-{sys.argv[2]}\n".encode()) * 256
)
PY_RETENTION
  "$HELPER" --force >/dev/null
  sleep 1
done

ARCHIVE_COUNT="$(
  find "$GHOSTSALON_LOG_ARCHIVE_DIR" \
    -maxdepth 1 \
    -type f \
    -name 'backend-*.log.gz' \
    | wc -l \
    | tr -d ' '
)"
(( ARCHIVE_COUNT <= GHOSTSALON_LOG_RETAIN_COUNT )) \
  || fail "retain-count policy failed"

"$HELPER" --status > "$TMP/status.out"
grep -q '^Active log:' "$TMP/status.out" \
  || fail "status missing active log"
grep -q '^Archived logs:' "$TMP/status.out" \
  || fail "status missing archive count"

echo "PASS: stopped rotation"
echo "PASS: archive SHA/bytes"
echo "PASS: below-threshold no-op"
echo "PASS: active-writer refusal"
echo "PASS: concurrent flock"
echo "PASS: retention bound"
echo "PASS: status contract"
