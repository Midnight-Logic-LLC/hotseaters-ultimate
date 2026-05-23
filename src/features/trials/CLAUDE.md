# `features/trials` — Trials feature

The most relational v0.1 feature. Exercises five entity types through the
prometheus-entity-management graph: `Trial`, `TrialService`, `TrialContact`,
`TrialSegment`, `TrialServiceAssignment`.

## Hard constraints

> See `/Users/gqadonis/Projects/midnight/latest-data/.kbd-orchestrator/constraints.md`.

1. **Self-hosted Supabase only.** Local docker-compose stack or
   `hotbase.prometheusags.ai`. Never `*.supabase.co`.
2. **HotSeatersMVP is the bible.** Functional and visual ground truth is
   `/Users/gqadonis/Projects/courtroom/HotSeatersMVP`. The six business-rule
   files under `business-rules/` are line-for-line ports of MVP `src/lib/*.js`.
3. **Components → hooks → stores.** Components in `pages/` and `components/`
   import only hooks. Hooks import `@prometheus-ags/prometheus-entity-management`
   plus the local `stores/trials-store.ts`. **Only** `stores/trials-store.ts`
   imports PGlite (via `@/shared/db/pglite-client`).

## Layout

```
features/trials/
├── CLAUDE.md
├── entities.ts                            JSON schemas (pure data, no imports)
├── stores/
│   └── trials-store.ts                    PGlite seam (fetch / insert / update / delete + schema register)
├── hooks/
│   ├── use-trials-list.ts                 useEntityList Trial
│   ├── use-trial.ts                       useEntity Trial
│   ├── use-trial-with-children.ts         composite — trial + services + contacts + segments + assignments
│   ├── use-trial-services.ts              useEntityList TrialService
│   ├── use-trial-contacts.ts              useEntityList TrialContact
│   ├── use-trial-segments.ts              useEntityList TrialSegment
│   ├── use-trial-service-assignments.ts   useEntityList TrialServiceAssignment (by service + by trial)
│   ├── use-trial-crud.ts
│   ├── use-trial-service-crud.ts
│   ├── use-trial-contact-crud.ts
│   ├── use-trial-segment-crud.ts
│   └── use-trial-service-assignment-crud.ts
├── pages/
│   ├── TrialsListPage.tsx                 TanStack-Table with search + sort
│   ├── TrialDetailPage.tsx                Header + 5 tabs (Services / Attorneys / Segments / Assignments / Map)
│   └── TrialEditPage.tsx                  Full-form edit (RHF + Zod)
├── components/
│   ├── TrialServicesPanel.tsx + TrialServiceFormSheet.tsx
│   ├── TrialContactsPanel.tsx  + TrialContactFormSheet.tsx
│   ├── TrialSegmentsPanel.tsx  + TrialSegmentFormSheet.tsx
│   ├── TrialServiceAssignmentMatrix.tsx
│   └── TrialMap.tsx                       react-leaflet (read-only in v0.1)
└── business-rules/                        PURE — no I/O, no React
    ├── trial-segment-utils.ts             ← lib/trialSegmentUtils.js
    ├── daily-minimum-utils.ts             ← lib/dailyMinimumUtils.js
    ├── time-entry-trial-service-resolver.ts            ← lib/timeEntryTrialServiceResolver.js
    ├── time-entry-subcontract-assignment-resolver.ts   ← lib/timeEntrySubcontractAssignmentResolver.js
    ├── time-entry-available-services.ts   ← lib/timeEntryAvailableServices.js
    ├── trial-service-delete-guard.ts      ← lib/trialServiceDeleteGuard.js (pure variant)
    └── __tests__/                          5+ cases per rule
```

## Business-rules: highest-fidelity surface

These six TS files **must** match their MVP counterparts byte-for-byte in
behavior. Every numeric constant, every fallback branch, every edge-case
comment is preserved. If MVP is wrong about something, file an OpenSpec
change against the MVP behavior — do NOT silently "improve" the port.

The MVP files are read-only references at
`/Users/gqadonis/Projects/courtroom/HotSeatersMVP/src/lib/`.

The unit tests in `business-rules/__tests__/` use the MVP comments as the
fixture source. When MVP's daily-min algorithm bumps the LAST eligible
entry, ours does too — and the test pins that behavior.

## Scope and boundaries

- This feature ships **read + write for the trio + segments + assignments**.
- HSH (subcontracting), time entries, expenses, invoices, deal documents are
  out of scope for v0.1 — they get their own phases. The business-rule
  ports cover the *resolver* surface those features will consume so that
  when those features land they slot in without re-deriving rules.
- Travel time is treated faithfully (Travel Time service rows from MVP) but
  the parent Service registry feature ships in a separate phase. For now we
  treat the parent `services` array as "whatever the trial-service feature
  has access to" — see `time-entry-available-services.ts`.

## Acceptance gates

- TrialDetailPage matches MVP layout — Services, Attorneys, Segments,
  Assignments, Map tabs all visible.
- All six business-rule ports complete with passing unit tests
  (`pnpm test -- src/features/trials/business-rules`).
- Editing a service updates the trial's derived "services total" live
  across TrialDetailPage and TrialsListPage (graph-driven cross-view
  reactivity).
- Role gating: Trial Consultant has read-only access; Owner/Admin/Sales
  can create/edit/delete.

## See also

- `/Users/gqadonis/Projects/midnight/latest-data/supabase/migrations/20260523000008_v2_schema_trials.sql`
- `/Users/gqadonis/Projects/midnight/latest-data/supabase/migrations/20260523000010_v2_schema_subcontracting.sql`
  (for `trial_service_assignment`)
- `/Users/gqadonis/Projects/midnight/hotseaters-ultimate/src/shared/db/sync-config.ts`
  — declares `trial`, `trial_service`, `trial_contact` as Tier-A.
- `/Users/gqadonis/Projects/courtroom/HotSeatersMVP/src/components/trials/` —
  the bible for layout / labels / behavior.
