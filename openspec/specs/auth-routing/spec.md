# auth-routing Specification

## Purpose
TBD - created by archiving change change-401-routing-redirect-last-route. Update Purpose after archive.
## Requirements
### Requirement: Landing redirect for authenticated users
The system SHALL redirect every authenticated visitor hitting `/` or `/Landing` to `/Dashboard` or to their stored `lastViewedPage`. The branch order mirrors `HotSeatersMVP/src/Layout.jsx:364-419`: pending invite → `/AcceptInvite`, no userInfo → `/Onboarding`, inactive userInfo → `/account-rejected`, no `company_id` → `/Onboarding`, otherwise last-viewed (if present) → that page, else `/Dashboard`. Redirects MUST use React Router `<Navigate replace>` — never `window.location.replace`.

#### Scenario: Authenticated owner with company and no last-viewed page
- **WHEN** the user hits `/` while authenticated, `user_info.company_id` is set, and `preferences.lastViewedPage` is empty
- **THEN** the system renders `<Navigate to="/Dashboard" replace />`

#### Scenario: Authenticated user with stored last-viewed page
- **WHEN** the user hits `/Landing` and `preferences.lastViewedPage === "Trials"`
- **THEN** the system renders `<Navigate to="/Trials" replace />`

#### Scenario: Pending invite short-circuits other branches
- **WHEN** `localStorage.pending_invitation_token` is set and the user reaches any landing entrypoint
- **THEN** the token is cleared and the system navigates to `/AcceptInvite?token=<token>`

### Requirement: Lowercase /dashboard alias
The system SHALL accept `/dashboard` (lowercase) as a route and MUST redirect it to `/Dashboard` with `replace`.

#### Scenario: Direct navigation to /dashboard
- **WHEN** an authenticated user navigates to `/dashboard`
- **THEN** React Router renders `<Navigate to="/Dashboard" replace />`

### Requirement: Last-route persistence tracker
The system SHALL persist `user_info.preferences.lastViewedPage` on every non-public navigation via a 500 ms debounced writer. The writer MUST honour a skip-list: `Landing`, `Onboarding`, `AcceptInvite`, `SignDocument`, `ViewDocument`, `PrivacyPolicy`, `TermsOfService`, `login`, `register`, `forgot-password`.

#### Scenario: Authenticated navigation outside skip-list
- **WHEN** an authenticated user navigates from `/Dashboard` to `/Trials`
- **THEN** within 500 ms the tracker calls `userInfoStore.patchPreferences({ lastViewedPage: "Trials" })`

#### Scenario: Navigation to a skip-list page
- **WHEN** the user lands on `/Onboarding`
- **THEN** the tracker does not write `lastViewedPage`

#### Scenario: No userInfo loaded
- **WHEN** the tracker mounts but `userInfo` is null
- **THEN** the tracker no-ops and writes nothing

