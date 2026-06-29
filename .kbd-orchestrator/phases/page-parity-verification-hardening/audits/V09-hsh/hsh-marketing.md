# RULE-0 Parity Audit — HotSeatHubMarketing

**Bible:** `HotSeatersMVP/src/pages/HotSeatHubMarketing.jsx` (232 lines)
**Port:** `src/features/hsh/pages/hot-seat-hub-marketing-page.tsx`
**Audit date:** 2026-06-29

---

## Gate verdict: BLOCKED (1 blocking defect)

This is a static page with no Tier-2 data. Layout, copy, gradients, feature
cards, trust strip, and CTA are all well-ported. One blocking defect: CDN image.

---

## Defects

### D1 — BLOCKING — CDN image violates RULE-0 (must be locally hosted)

**Bible line 84 / Port line 131:**
```html
<img src="https://media.base44.com/images/public/6914b56a550a79ca828626d4/ad7ed2892_HotSeatHubemailHeader.png" />
```

Port ships the same CDN URL verbatim. RULE-0 requires every image asset to be
locally hosted under `public/brand/`.

**Fix:**
1. Download the image to `public/brand/hsh-email-header.png`
2. Update the `src` attribute:
   ```tsx
   src="/brand/hsh-email-header.png"
   ```

---

## Visual parity check (all non-image elements)

| Element | Bible | Port | Status |
|---------|-------|------|--------|
| Hero gradient | `linear-gradient(to bottom, #1e1b4b 0%, #4c1d95 35%, #7c3aed 65%, var(--theme-hsh-background) 100%)` | identical | ✓ |
| Badge text | "Included with every plan" | identical | ✓ |
| Badge style | white/15% backdrop, blur, white border | identical | ✓ |
| Body text | "The built-in marketplace where trial technology firms find each other..." | identical | ✓ |
| CTA 1 text | "Turn On HotSeatHub" | identical | ✓ |
| CTA 1 link | `/Settings?tab=marketplace` | identical | ✓ |
| Fine print | "Already included in your subscription · Toggle on or off anytime" | identical | ✓ |
| Feature card 1 | "Post Help Wanted Gigs" + description | identical | ✓ |
| Feature card 2 | "Find Potential Gigs" + description | identical | ✓ |
| Feature card 3 | "Negotiate & Sign Online" + description | identical | ✓ |
| Feature card 4 | "Build Your Reputation" + description | identical | ✓ |
| Feature card tinted header | `linear-gradient(135deg, color-mix(hsh-primary 18%, white)...)` | identical | ✓ |
| Feature card icon pinned | `absolute bottom-4 right-4 w-20 h-20` purple gradient | identical | ✓ |
| Trust strip header | "Why firms join" / "A network worth being in" | identical | ✓ |
| Trust card 1 | "A closed, vetted network" | identical | ✓ |
| Trust card 2 | "Built into your workflow" | identical | ✓ |
| Trust card 3 | "Collaboration without competition" | identical | ✓ |
| Final CTA gradient | `linear-gradient(135deg, #1e1b4b 0%, #4c1d95 45%, #7c3aed 100%)` | identical | ✓ |
| Final CTA title | "Ready to join the network?" | identical | ✓ |
| Final CTA button | "Enable HotSeatHub Features" → `/Settings?tab=marketplace` | identical | ✓ |
| Trust badges | "Included in your plan" / "Toggle on or off anytime" / "No extra setup" | identical | ✓ |

---

## V11 backlog items

- Download CDN image → `public/brand/hsh-email-header.png`
- Update `src` from CDN URL to `/brand/hsh-email-header.png`
