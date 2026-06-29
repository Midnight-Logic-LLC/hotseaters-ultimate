# change-V11a — Schema gap migrations (4 missing bible tables)

## Why

/kbd-analyze (2026-06-28) confirmed 4 bible entity tables missing from the
port's Supabase migrations. These gaps silently break DealTracker notes,
LeadRadar activity logging, HSH favoriting lists, and Settings database export.
All 47+ other bible entity tables are present and correctly mapped.

This change adds the missing migrations to
`/Users/gqadonis/Projects/midnight/latest-data/supabase/migrations/`. Schema
changes are applied via `psql` (RULE 1.1 — never via Supabase CLI or MCP).

## What changes

### DB-1 — `deal_note` table

Used by `base44.entities.DealNote` in DealTracker for notes attached to
deals/clients.

```sql
-- 20260628000001_deal_note.sql
CREATE TABLE IF NOT EXISTS public.deal_note (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id  uuid NOT NULL REFERENCES public.company(id) ON DELETE CASCADE,
  deal_id     uuid,  -- FK to lead.id (DealTracker calls leads "deals")
  content     text NOT NULL,
  author_id   uuid REFERENCES public.user_info(id) ON DELETE SET NULL,
  created_date timestamptz NOT NULL DEFAULT now(),
  updated_date timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ON public.deal_note (company_id, deal_id);
ALTER TABLE public.deal_note ENABLE ROW LEVEL SECURITY;
-- RLS: company-scoped read/write (match pattern in 20260523000016_rls_policies.sql)
```

### DB-2 — `lead_activity` table

Used by `base44.entities.LeadActivity` in LeadRadar for activity log on leads.

```sql
-- 20260628000002_lead_activity.sql
CREATE TABLE IF NOT EXISTS public.lead_activity (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id    uuid NOT NULL REFERENCES public.company(id) ON DELETE CASCADE,
  lead_id       uuid REFERENCES public.lead(id) ON DELETE CASCADE,
  activity_type text NOT NULL,
  description   text,
  performed_by  uuid REFERENCES public.user_info(id) ON DELETE SET NULL,
  activity_date timestamptz NOT NULL DEFAULT now(),
  created_date  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ON public.lead_activity (company_id, lead_id);
ALTER TABLE public.lead_activity ENABLE ROW LEVEL SECURITY;
```

### DB-3 — `favorites_list` table

Used by `base44.entities.FavoritesList` in Settings DatabaseExport and HSH
subcontractor favoriting list management.

```sql
-- 20260628000003_favorites_list.sql
CREATE TABLE IF NOT EXISTS public.favorites_list (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id   uuid NOT NULL REFERENCES public.company(id) ON DELETE CASCADE,
  name         text NOT NULL,
  user_id      uuid REFERENCES public.user_info(id) ON DELETE SET NULL,
  created_date timestamptz NOT NULL DEFAULT now(),
  updated_date timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ON public.favorites_list (company_id);
ALTER TABLE public.favorites_list ENABLE ROW LEVEL SECURITY;
```

### DB-4 — `sample_data` table (investigate first)

`base44.entities.SampleData` exists in the bible. The port has `seed_snapshot`
which may overlap. Before writing this migration, check the bible's `SampleData`
usage to determine if it is distinct from `seed_snapshot`. If distinct, create
the migration. If redundant, document the decision and skip.

## Impact

Server-side schema only. No PGlite local-schema changes required unless these
entities need offline access (DealNote and LeadActivity are likely candidates
for offline — add to `local-schema.sql` in a follow-up if needed).

## Depends on

None (schema work is independent of V03–V10 audits).

## Apply instructions (RULE 1.1)

```bash
psql "postgresql://postgres:postgres@localhost:5432/postgres" \
  -f /Users/gqadonis/Projects/midnight/latest-data/supabase/migrations/20260628000001_deal_note.sql

psql "postgresql://postgres:postgres@localhost:5432/postgres" \
  -f /Users/gqadonis/Projects/midnight/latest-data/supabase/migrations/20260628000002_lead_activity.sql

psql "postgresql://postgres:postgres@localhost:5432/postgres" \
  -f /Users/gqadonis/Projects/midnight/latest-data/supabase/migrations/20260628000003_favorites_list.sql
```
