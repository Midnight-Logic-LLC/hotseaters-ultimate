# change-V11 — Drift remediation

## Why
V03–V10 surface parity defects (copy drift, color/token mismatch, missing
sections, font weight, wrong deep links, missing business rules). This change
fixes them. Per the prior phase's known issue, deployed copy contains drift
(e.g. "90 days" vs bible's "14 days") — fix to match the bible.

## What changes
Fix every defect in the V03–V10 backlog. Per RULE 0.3, systemic primitive bugs
(wrong cursor/font/border across pages) are fixed in
`src/components/ui/<primitive>.tsx` and/or `src/index.css`, NOT per-page. Use
RULE 0.4 (`getComputedStyle` diagnostic) to root-cause visual defects from the
resolved computed value, not the source CSS.

## Impact
Production code. Scope = defects found. Depends on V03–V10.
