-- Reference to the canonical auth+RLS smoke test that lives in latest-data.
-- This file is a thin wrapper so `pg_prove tests/db/*.sql` picks it up here
-- without duplicating the test source. The canonical file is:
--
--   /Users/gqadonis/Projects/midnight/latest-data/tests/auth_rls_smoke_test.sql
--
-- Run via tests/db/run-pgtap.sh, which sources the canonical file directly.
-- This stub exists so contributors discover the suite from inside the
-- hotseaters-ultimate repo.
--
-- Self-hosted Supabase only. HotSeatersMVP is the bible.

\echo 'See latest-data/tests/auth_rls_smoke_test.sql for the canonical pgTAP suite.'
\echo 'Run tests/db/run-pgtap.sh from the hotseaters-ultimate repo root to execute it.'
