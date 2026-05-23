-- =============================================================================
-- pgTAP: every entity in src/shared/db/sync-config.ts (Tier A and Tier B) must
-- have a SELECT policy and at least one write policy in the RLS migrations.
--
-- This file is templated by tests/db/run-pgtap.sh, which reads sync-config.ts
-- as text, extracts the allowlist names, and substitutes them in before
-- running the suite. The placeholder `__ALLOWLIST__` is replaced at run time.
--
-- Self-hosted Supabase only. HotSeatersMVP is the bible.
-- =============================================================================

BEGIN;

CREATE EXTENSION IF NOT EXISTS pgtap;

-- The shell script populates this temp table from sync-config.ts before
-- including this file with \i.
CREATE TEMP TABLE IF NOT EXISTS sync_allowlist (name TEXT PRIMARY KEY);

SELECT plan((SELECT count(*)::INTEGER * 2 FROM sync_allowlist));

-- For each synced entity, assert a SELECT policy exists on public.<name>.
DO $$
DECLARE
  e RECORD;
BEGIN
  FOR e IN SELECT name FROM sync_allowlist ORDER BY name LOOP
    PERFORM ok(
      EXISTS (
        SELECT 1
        FROM pg_policies
        WHERE schemaname = 'public'
          AND tablename = e.name
          AND cmd IN ('SELECT', 'ALL')
      ),
      format('synced entity %I has a SELECT/ALL policy', e.name)
    );
    PERFORM ok(
      EXISTS (
        SELECT 1
        FROM pg_policies
        WHERE schemaname = 'public'
          AND tablename = e.name
          AND cmd IN ('INSERT', 'UPDATE', 'DELETE', 'ALL')
      ),
      format('synced entity %I has at least one write policy', e.name)
    );
  END LOOP;
END
$$;

SELECT * FROM finish();

ROLLBACK;
