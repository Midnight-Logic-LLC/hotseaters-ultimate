## ADDED Requirements

### Requirement: Widgets are isolated, hook-only React components
Each dashboard widget SHALL live in `src/features/dashboard/widgets/<kebab>.tsx` and import only its data hook + shared UI primitives (`@/components/ui/*`) + lucide-react + recharts + date-fns. Widget files SHALL NOT import `useGraphStore`, `getLocalDB`, the supabase client, or any `role === '…'` literal — role gating happens in `use-dashboard-widgets.ts` (registry), not in widget JSX.

#### Scenario: Boundaries lint passes
- **WHEN** CI runs `pnpm lint`
- **THEN** `eslint-plugin-boundaries` reports zero violations for files under `src/features/dashboard/widgets/`

#### Scenario: No role string literals in widgets
- **WHEN** CI runs `git grep -nE "role === '|company_role === '" src/features/dashboard/widgets/`
- **THEN** the command exits with no matches

### Requirement: Widgets render skeletons + bible-parity empty states
Each widget SHALL render its own loading skeleton when its hook reports `isLoading || isShowingLocalPending`, and an empty state matching the bible's copy when its data array is empty. No widget blocks another from rendering — each owns its own pending UI.

#### Scenario: Active trial performance shows bible empty copy
- **WHEN** `useActiveTrialStats()` returns `{ items: [], isLoading: false }`
- **THEN** the `ActiveTrialPerformance` widget renders the literal string "No active trial data yet"

### Requirement: Visual parity at 1440×900 and 375×667
Each widget SHALL render within ≤5% pixel drift of the bible reference at the two target viewports, enforced by `tests/visual-parity/specs/dashboard-widgets.spec.ts`.

#### Scenario: Visual harness asserts drift bound
- **WHEN** the Playwright visual-parity spec snapshots each widget at 1440×900 + 375×667
- **THEN** every snapshot diff vs `tests/visual-parity/baselines/<widget>-{1440,375}.png` reports ≤5% pixel difference
