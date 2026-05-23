#!/usr/bin/env bash
# Run the pgTAP suite against a local self-hosted Supabase Postgres.
#
# Self-hosted Supabase only. HotSeatersMVP is the bible.
#
# Usage:
#   tests/db/run-pgtap.sh
#   DB_URL=postgres://supabase_admin:pwd@localhost:5432/postgres tests/db/run-pgtap.sh
#
# Requirements:
#   - pg_prove (cpan TAP::Parser::SourceHandler::pgTAP, or apt install libtap-parser-sourcehandler-pgtap-perl)
#   - psql in PATH
#   - The local docker-compose stack running (latest-data/docker-compose.yaml)

set -euo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${HERE}/../.." && pwd)"
SIBLING_DATA="$(cd "${REPO_ROOT}/../latest-data" && pwd)"

DB_URL="${DB_URL:-postgres://supabase_admin:postgres@localhost:5432/postgres}"

# Refuse Supabase Cloud — self-hosted only.
case "${DB_URL}" in
  *supabase.co*|*supabase.com*)
    echo "ERROR: DB_URL points at Supabase Cloud. Self-hosted only." >&2
    exit 2
    ;;
esac

if ! command -v pg_prove >/dev/null 2>&1; then
  echo "ERROR: pg_prove not found. Install TAP::Parser::SourceHandler::pgTAP." >&2
  exit 3
fi

if ! command -v psql >/dev/null 2>&1; then
  echo "ERROR: psql not found." >&2
  exit 4
fi

CANONICAL_SMOKE="${SIBLING_DATA}/tests/auth_rls_smoke_test.sql"
if [[ ! -f "${CANONICAL_SMOKE}" ]]; then
  echo "ERROR: canonical pgTAP suite missing at ${CANONICAL_SMOKE}" >&2
  exit 5
fi

echo "==> Running canonical auth+RLS smoke (latest-data)"
pg_prove --dbname "${DB_URL}" "${CANONICAL_SMOKE}"

# Extract the sync allowlist names from sync-config.ts. Match: `name: '...',`
SYNC_CONFIG="${REPO_ROOT}/src/shared/db/sync-config.ts"
if [[ ! -f "${SYNC_CONFIG}" ]]; then
  echo "WARN: ${SYNC_CONFIG} not found; skipping allowlist coherence test." >&2
  exit 0
fi

TMP_SQL="$(mktemp -t hu-pgtap.XXXXXX.sql)"
trap 'rm -f "${TMP_SQL}"' EXIT

{
  echo "BEGIN;"
  echo "CREATE TEMP TABLE sync_allowlist (name TEXT PRIMARY KEY);"
  # Extract names that look like `name: 'foo',`
  awk "/name:[[:space:]]*'[a-zA-Z_][a-zA-Z0-9_]*'/ {"$'\n'"  match(\$0, /name:[[:space:]]*'([a-zA-Z_][a-zA-Z0-9_]*)'/, m);"$'\n'"  if (m[1] != \"\") print \"INSERT INTO sync_allowlist(name) VALUES ('\" m[1] \"') ON CONFLICT DO NOTHING;\""$'\n'"}" "${SYNC_CONFIG}" \
    || grep -oE "name:[[:space:]]*'[a-zA-Z_][a-zA-Z0-9_]*'" "${SYNC_CONFIG}" \
       | sed -E "s/name:[[:space:]]*'(.*)'/INSERT INTO sync_allowlist(name) VALUES ('\1') ON CONFLICT DO NOTHING;/"
  echo "COMMIT;"
  echo "\\i ${HERE}/sync-allowlist-rls.sql"
} > "${TMP_SQL}"

echo "==> Running sync-allowlist ↔ RLS coherence"
pg_prove --dbname "${DB_URL}" "${TMP_SQL}"
