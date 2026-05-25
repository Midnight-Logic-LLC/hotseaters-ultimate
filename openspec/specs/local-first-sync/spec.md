# local-first-sync Specification

## Purpose
TBD - created by archiving change change-403-per-user-pglite-sync-policy. Update Purpose after archive.
## Requirements
### Requirement: Per-user PGlite instance
The system SHALL maintain one PGlite instance per `auth.user.id`, persisted at `idb://hotseaters/${userId}`. The instance MUST open on sign-in and close on sign-out. Sign-out MUST also reset the entity graph (`useGraphStore.getState().reset()`).

#### Scenario: First sign-in for a brand-new user
- **WHEN** a user with `auth.user.id = "abc"` signs in and no IDB store exists at `idb://hotseaters/abc`
- **THEN** `pglite.openForUser("abc")` opens the store, applies `local-schema-common.sql` then `local-schema-user.sql`, and attaches `createPGlitePersistenceAdapter` to the entity graph

#### Scenario: Sign-out tears down state
- **WHEN** an authenticated user calls `auth-store.signOut()`
- **THEN** all Electric subscriptions and Realtime channels stop, `useGraphStore.getState().reset()` runs, `pglite.closeForUser(prevUserId)` resolves, and only then is Supabase `signOut` invoked

#### Scenario: Cross-user isolation on the same browser
- **WHEN** user A creates a Client, signs out, and user B signs in on the same browser
- **THEN** user B's PGlite query for clients returns zero rows from user A's data, and IDB inspection shows two separate databases

### Requirement: Tenant-scoped Electric adapter
All tenanted Electric shapes SHALL be attached via `createTenantScopedElectricAdapter({ tenantColumn: "company_id", claim: () => ({ companyId }) })` from `@prometheus-ags/prometheus-entity-management` v1.3. The adapter MUST refuse to attach any shape missing a `tenantColumn` declaration.

#### Scenario: Shape declaration omits tenantColumn
- **WHEN** a developer registers an Electric shape without `tenantColumn` via the tenant-scoped adapter
- **THEN** the adapter throws synchronously at attach time with a clear error message

#### Scenario: Valid tenanted shape attaches
- **WHEN** `tenantColumn = "company_id"` and the claim resolves to `{ companyId: "co-123" }`
- **THEN** the shape predicate contains `company_id = "co-123"` and no widening clause

### Requirement: Realtime channels for latency-sensitive single-row domains
The system SHALL open Supabase Realtime channels for the current `user_info` row, the current `company` row, and `notifications` filtered to the current user. Channel handlers MUST write incoming rows into the entity graph so subscribed components re-render. Channel lifecycle MUST tie to PGlite `openForUser` / `closeForUser`.

#### Scenario: Company theme change propagates
- **WHEN** an operator updates `company.theme.brand_primary` via Studio
- **THEN** the entity graph receives the new `company` row within 2 seconds and any component reading the theme re-renders

#### Scenario: Sign-out stops channels
- **WHEN** `pglite.closeForUser(id)` runs
- **THEN** all three Realtime channels unsubscribe before close resolves

