# change-V02 — Per-page RULE-0 audit template + ledger + W1–W8 inventory reconcile

## Why

Waves W1–W8 of the prior phase shipped every bible app page but recorded **no
per-page acceptance audit** (RULE 0). "Is page X at parity?" currently requires
reading a squash commit, not an auditable artifact. This change creates the
ledger that V03–V10 fill in, and reconciles the delivered-page inventory into a
tracked form (closes prior-phase Technical Debt #4).

## What changes

1. NEW `.kbd-orchestrator/phases/page-parity-verification-hardening/audits/_TEMPLATE.md`
   — the 9-point RULE-0 gate checklist (bible read, DOM hierarchy, strings
   verbatim, local assets, theme tokens, animations, VR drift, deep links,
   business rules) with PASS/FAIL/DEVIATION per item.

2. NEW `audits/_INVENTORY.md` — the reconciled page list: every bible app
   surface → port page → route → VR mechanism (deployed-drift vs authed-baseline)
   → audit status. Seeded from the assessment's §1.2 table.

3. RECORD the 4 unported dev/admin utilities (NewMemberOnboardingPreview,
   OwnerOnboardingPreview, ReferralOnboardingPreview, RunMigration) as explicit
   **out-of-scope** with rationale, pending user confirmation.

## Impact

- Pure documentation / process artifact. No code.
- Establishes the audit ledger consumed by every subsequent V-change.
