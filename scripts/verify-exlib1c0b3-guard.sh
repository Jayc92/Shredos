#!/bin/bash
# ============================================================
# ForgeFitOS - LOCAL-ONLY pre-browser guard (EXLIB-1C0B3).
# REVISED (EXLIB-1C0B3 final guard correction): models the REAL
# effective Next.js development environment and parses the winning
# value with a real URL parser (Node WHATWG new URL()), not text
# surgery.
#
# MUST run and PASS before the dev server or any browser-driven UI
# verification starts.
#
# Mode contract:
#   * NO ARGUMENT - effective development resolution, first DEFINED
#     value wins, in the real precedence order:
#       1. already-exported process environment (highest);
#       2. .env.development.local
#       3. .env.local
#       4. .env.development
#       5. .env
#     DEFINED includes an explicitly empty value: a set-but-empty
#     process variable or a present-but-empty dotenv key WINS the
#     resolution and fails closed - it never falls through to a
#     lower-priority source. A hosted process value therefore CANNOT
#     be masked by a local dotenv file.
#   * EXPLICIT FILE ($1) - reads ONLY the supplied file. The
#     inherited process value is deliberately IGNORED in this mode so
#     fixture tests can never be contaminated by the caller's
#     environment. A present-but-empty key in the file is the winning
#     (empty) value and fails closed.
#
# Fails closed on: key not defined anywhere; defined-but-empty
# winning value; malformed or relative URL; credential-bearing URL;
# unresolved $VAR / ${VAR} interpolation; protocol other than
# http:/https:; any hostname other than exactly localhost or
# 127.0.0.1; and the hosted ShredOS project ref
# (ttybyljytiwntvorugcv) anywhere in the value.
#
# Prints ONLY the source, protocol, hostname, and verdict - never
# the complete URL, credentials, path, query, fragment, or keys.
#
# Usage (from the directory whose env files matter):
#   bash scripts/verify-exlib1c0b3-guard.sh            # effective env
#   bash scripts/verify-exlib1c0b3-guard.sh <envfile>  # fixture file
# Exit 0 = PASS (loopback-only). Exit 1 = FAIL CLOSED.
# ============================================================
set -euo pipefail

# True when the file exists AND defines the key at all (even empty).
file_has_key() {
  local f="$1"
  [ -f "$f" ] || return 1
  grep -qE "^NEXT_PUBLIC_SUPABASE_URL=" "$f"
}

file_value() {
  local f="$1"
  [ -f "$f" ] || return 0
  grep -E "^NEXT_PUBLIC_SUPABASE_URL=" "$f" | tail -1 | cut -d'=' -f2- || true
}

URL=""
SOURCE=""
FOUND=0
if [ "$#" -ge 1 ]; then
  # Explicit fixture mode: ONLY the supplied file; process env ignored.
  SOURCE="file-arg"
  if file_has_key "$1"; then
    URL=$(file_value "$1")
    FOUND=1
  fi
else
  # DEFINED (set) wins even when empty - ${VAR+defined} is true for a
  # set-but-empty variable, unlike -n, so an explicitly empty exported
  # value can never fall through to a dotenv file.
  if [ "${NEXT_PUBLIC_SUPABASE_URL+defined}" = "defined" ]; then
    URL="${NEXT_PUBLIC_SUPABASE_URL}"
    SOURCE="process-env"
    FOUND=1
  else
    for f in .env.development.local .env.local .env.development .env; do
      if file_has_key "$f"; then
        URL=$(file_value "$f")
        SOURCE="$f"
        FOUND=1
        break
      fi
    done
  fi
fi

if [ "$FOUND" -eq 0 ]; then
  echo "GUARD FAIL: NEXT_PUBLIC_SUPABASE_URL is not defined by any effective source"
  exit 1
fi

# The winning source defined the key but with an empty value: this is
# a DEFINED empty value - it wins the resolution and fails closed
# here, never falling through to a lower-priority source.
if [ -z "$URL" ]; then
  echo "GUARD FAIL: effective NEXT_PUBLIC_SUPABASE_URL is defined but EMPTY (source: $SOURCE)"
  exit 1
fi

# Unresolved shell interpolation must fail closed before parsing
# (covers both $VAR and ${VAR}; no legitimate endpoint contains '$').
case "$URL" in
  *'$'*)
    echo "GUARD FAIL: effective URL contains unresolved \$-interpolation (source: $SOURCE)"
    exit 1
    ;;
esac

# Hosted ShredOS ref anywhere in the value fails closed, without
# printing any part of the value itself.
case "$URL" in
  *ttybyljytiwntvorugcv*)
    echo "GUARD FAIL: effective URL references the HOSTED ShredOS project (source: $SOURCE)"
    exit 1
    ;;
esac

# Real URL parsing (Node WHATWG URL). Emits ONLY
# protocol|hostname|credential-flag - never the URL itself.
PARSED=$(node -e '
const raw = process.argv[1]
let u
try { u = new URL(raw) } catch { console.log("INVALID"); process.exit(0) }
const cred = (u.username !== "" || u.password !== "") ? "cred" : "nocred"
console.log([u.protocol, u.hostname, cred].join("|"))
' "$URL")

if [ "$PARSED" = "INVALID" ]; then
  echo "GUARD FAIL: effective URL is malformed or relative (source: $SOURCE)"
  exit 1
fi

PROTO="${PARSED%%|*}"
rest="${PARSED#*|}"
HOST="${rest%%|*}"
CRED="${rest#*|}"

if [ "$CRED" = "cred" ]; then
  echo "GUARD FAIL: effective URL carries credentials (source: $SOURCE, protocol: $PROTO, host: $HOST)"
  exit 1
fi

case "$PROTO" in
  http:|https:) ;;
  *)
    echo "GUARD FAIL: protocol is not http/https (source: $SOURCE, protocol: $PROTO)"
    exit 1
    ;;
esac

case "$HOST" in
  127.0.0.1|localhost)
    echo "GUARD PASS: loopback-only (source: $SOURCE, protocol: $PROTO, host: $HOST)"
    exit 0
    ;;
  *)
    echo "GUARD FAIL: host is not loopback (source: $SOURCE, host: $HOST)"
    exit 1
    ;;
esac
