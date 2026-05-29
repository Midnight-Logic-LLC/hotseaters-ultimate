# change-D08 — LeadRadar disposition: KEEP working port page (intentional deviation)

## Final disposition (owner-decided 2026-05-29). NO code change.

Three premises were tested + corrected before landing here (recorded so a future
agent doesn't re-litigate or "fix" the result):

1. ❌ "Bible retired Lead Radar / there's dead Lead code to delete" — WRONG.
2. ✅ `git diff --name-status pre-parity-reset-2026-05-29 HEAD`: the Lead
   *sub-components* are **D (deleted)** — `LeadCard`, `LeadsKanbanGrid`,
   `LeadDetailPanel`, `LeadsRadarTab`, `LeadFilterSheet`, `LeadFollowUpBanner`,
   `LeadEditSheet`, `LeadAttachmentControl`, `LeadActivityColumn`, `NewLeadForm`,
   `leadWizard/*`, and `PipelinePageContent.jsx`. `Sales.jsx` is **D** (handled
   in D05). The Deal subsystem is **A** (D01–D04). `LeadRadar.jsx` is **M**.
3. ✅ Reading the actual current `LeadRadar.jsx`: it is a **36-line
   "Coming soon..." STUB** — the bible DOWNGRADED Lead Radar to a placeholder
   in the pivot (header "Lead Radar" / "Track potential trials and
   opportunities from external sources" + a Radar-icon empty card: "Follow
   potential trials and opportunities from Law 360 and other sources.").

## Decision: KEEP the port's working 437-LOC Lead Radar page

The port's `src/features/lead-radar/pages/lead-radar-page.tsx` (437 LOC) is a
working Lead Radar (search/ownership toolbar, enriched leads, follow-up
bucketing). The current bible Lead Radar is a deferred "Coming soon" stub.

**Owner decision (explicit):** do NOT reduce the working page to the bible stub.
Keeping working functionality beats matching a downgraded placeholder. This is an
**accepted, intentional deviation where the port is AHEAD of the bible.** RULE 0
parity is waived here by owner choice. If the bible later re-implements Lead
Radar for real, re-port to THAT (don't downgrade in the meantime).

## What changes

**Nothing in source.** Page, store, route, nav item all stay. This proposal +
the progress ledger record the disposition + the verified deletion inventory so
no future agent reduces the page to the bible stub.

### Verified — nothing is dead
- `lead-radar-store.ts` is **LIVE**: the D03 deal wizard consumes its read
  helpers (`deal-wizard-helpers.ts`, `use-deal-wizard-data.ts`,
  `wizard-step1-client-contact.tsx`). Do not remove it.
- The deleted bible Lead sub-components need no port deletion — the port never
  created them as separate files (the page is self-contained).
- `company/business-rules/ensure-lead-for-attorney.ts` is self-referenced only;
  left in place (tangential; a future knip/dead-code pass can assess — NOT
  deleted here).

## Impact

Documentation only. Zero source changes. Bible @ 29ae47e3.
