# Tasks — change-410

## 410.a — Discovery
- [ ] T1. `find /Users/gqadonis/Projects/courtroom/HotSeatersMVP/src/pages -name '*.jsx'` → page list. ~40 entries expected.
- [ ] T2. `find /Users/gqadonis/Projects/courtroom/HotSeatersMVP/src/components -name '*.jsx'` → component list. Filter to feature folders (Trials, Clients, Invoices, Bills, Sales, Approvals, TimeAndExpenses, HotSeatHub, etc.).
- [ ] T3. `find /Users/gqadonis/Projects/courtroom/HotSeatersMVP/src/lib -name '*.js'` + `src/utils` → utility module list.

## 410.b — Extraction (Explore agent, parallelizable)
- [ ] T4. For each page, identify and record: every `useEffect` that calculates / triggers side-effects; every `useMemo` that derives a value; every helper function called from JSX; every conditional render gate; every `Entity.create/.update/.delete` call (base44 SDK); every email/Stripe/e-sign/Slack call.
- [ ] T5. For each utility, record exported functions + their inputs/outputs.
- [ ] T6. Bucket rules by entity (primary read/write).

## 410.c — Classification
- [ ] T7. Assign **Class** to each rule:
  - `pure` — deterministic function of inputs, no I/O (totals, projections, formatters)
  - `side-effect` — performs an external action (email, Stripe, e-sign, Slack)
  - `server-required` — depends on a server-only check (auth, RBAC, RLS-protected aggregate)
  - `formatting` — visual transform of data (currency, date, phone)
  - `validation` — input check that gates submit
  - `conditional-render` — role/feature gate that hides/shows UI
- [ ] T8. Assign **Offline policy**:
  - `pure` / `formatting` / `validation` / `conditional-render` → `allow`
  - `side-effect` → `queue+replay`
  - `server-required` → `block` (with user-facing "requires connection" note)
- [ ] T9. Assign **Target home**:
  - `pure` / `formatting` / `validation` → `src/features/<x>/business-rules/<name>.ts`
  - `side-effect` → store action that writes to `local_writes` with `operation='side_effect'`
  - `server-required` → `src/features/<x>/api/<name>.ts` calling Supabase RPC

## 410.d — Deliverables
- [ ] T10. NEW `docs/BIBLE-BUSINESS-RULES.md` — sectioned by feature, table per entity.
- [ ] T11. NEW `docs/BIBLE-BUSINESS-RULES.csv` — RFC 4180; columns: `id,feature,entity,class,bible_source,offline_policy,target_home,notes`.
- [ ] T12. NEW `scripts/bible-rules-coverage.mjs` — reads the CSV, walks `src/features/<x>/business-rules/`, reports rules missing a port. CI-runnable with `--report` (no fail) and `--strict` (fail on missing).

## 410.e — Verification
- [ ] T13. Spot-check 10 random bible pages; confirm every rule on those pages appears in the inventory.
- [ ] T14. Code-review by `code-reviewer` agent: rule taxonomy applied consistently; no rule classified as two classes; no formatting rules accidentally marked `server-required`.
- [ ] T15. `pnpm run bible-rules-coverage --report` runs clean in CI.

## Definition of done
- `docs/BIBLE-BUSINESS-RULES.md` exists with ≥ all rules from a 10-page random sample.
- `docs/BIBLE-BUSINESS-RULES.csv` is RFC 4180 compliant.
- `scripts/bible-rules-coverage.mjs` runs in CI in `--report` mode.
- `code-reviewer` agent signs off on taxonomy consistency.
