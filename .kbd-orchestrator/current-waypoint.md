# Current Waypoint — hotseaters-page-parity-port

**Phase:** hotseaters-page-parity-port  
**Status:** assessed  
**Active wave:** Wave S — Settings Infrastructure  
**Last updated:** 2026-05-26

## What's next

Run `/kbd-plan hotseaters-page-parity-port` to generate the Wave S plan
(change-S01 through change-S16).

## Wave order

1. **Wave S — Settings Infrastructure + All Settings Tabs** ← ACTIVE
2. Wave W0 — Foundation (brand assets, auth routing, MarketingShell)
3. Wave W1 — Public surface
4. Wave W2 — Auth surface
5. Wave W3 — App shell audit + /Dashboard
6. Wave W4 — Sales
7. Wave W5 — Operations
8. Wave W6 — Billing
9. Wave W7 — HotSeatHub
10. Wave W8 — Settings + Manual + Documents

## Key decision

Settings ships first because:
- Settings values are shared across the entire application
- Navigation routes depend on settings (pipeline stages, billing rules, theme tokens, tier limits, service rates)
- Plugin-ready settings registry is the foundational pattern needed by all future waves
- Full functional + visual parity required for all 12 bible tabs

## Assessment output

`.kbd-orchestrator/phases/hotseaters-page-parity-port/assessment.md`

16 changes planned (change-S01 through change-S16).

## Deferred items (from previous dashboard phase)

- npm publish @prometheus-ags/prometheus-entity-management@1.3.2 (needs npm credentials)
- VR baselines for Card primitive (needs bible app running locally)
- change-424 T11/T12 browser smoke (Team Members realtime update)
