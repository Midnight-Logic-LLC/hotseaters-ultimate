# ViewDocument — RULE-0 Parity Audit

**Bible:** `/Users/gqadonis/Projects/courtroom/HotSeatersMVP/src/pages/ViewDocument.jsx`
**Port:** `/Users/gqadonis/Projects/midnight/hotseaters-ultimate/src/features/documents/pages/view-document-page.tsx`
**Route:** `/ViewDocument` (+ `/view-document` redirect)
**Audited:** 2026-06-29

---

## Gate Results

| # | Gate | Result | Notes |
|---|------|--------|-------|
| 1 | Rendered DOM regions / hierarchy | PASS | All 3 states (loading, error, document-received) present. Main view: DocumentDisplay → View Only notice card → footer. Matches bible structure. |
| 2 | Every visible string verbatim | PASS | "Loading document...", "Unable to Load Document", "Invalid document link. No token provided.", "Failed to load document. The link may be invalid or expired.", "Document Received", "This document has been shared with you for your records. No signature is required.", "Powered by HotSeaters" — all match bible exactly. |
| 3 | Image assets locally hosted | PASS | No hardcoded CDN image URLs. Company logo is from dynamic API data. Google Fonts URL dynamically constructed from company theme. |
| 4 | var(--theme-*) tokens | PASS | All tokens match bible: --theme-page-bg, --theme-font-body, --theme-card-radius, --theme-card-shadow, --theme-card-bg, --theme-card-padding, --theme-brand-primary, --theme-stone-600, --theme-text-body, --theme-danger, --theme-stone-900, --theme-text-card-title, --theme-stone-400, --theme-text-caption, --theme-max-content-width, --theme-stone-200, --theme-input-radius |
| 5 | Animations | PASS | `animate-spin` on Loader2 in loading state matches bible. |
| 6 | Deep links / CTAs | PASS | No internal navigation. API endpoint: `/api/functions/getDocumentForSigning` (port adapted from `base44.functions.invoke` to direct fetch — correct for self-hosted arch). |
| 7 | Business rules (view flow) | PASS | Token from URL params, error branch on missing token, `getDocumentForSigning` fetch, Google Fonts dynamic construction, theme CSS injection all preserved. Bible uses `base44.functions.invoke` — port correctly adapts to direct `fetch` per self-hosted constraints. |
| 8 | Image/component stubs noted | INFO | Same `DocumentDisplayStub` as SignDocument — renders document name, logo, PDF iframe. Same caveat applies. |

---

## Defects Found

### Blocking
None.

### Polish / Non-blocking
1. **DocumentDisplay stub** — same note as SignDocument: inline stub covers primary visual content; full DocumentDisplay port is a separate work item.

---

## Inline Fixes Applied
None required.
