## ADDED Requirements

### Requirement: Sidebar user footer with sign-out
The AppShell SHALL render a SidebarUserFooter that mirrors `HotSeatersMVP/src/Layout.jsx:591`. The footer MUST expose the current user's avatar, name, role badge, and a working "Sign out" action that calls `auth-store.signOut()`.

#### Scenario: Authenticated user clicks Sign out
- **WHEN** the user opens the SidebarUserFooter menu and clicks "Sign out"
- **THEN** `auth-store.signOut()` runs, the entity graph resets, PGlite closes for that user, and the browser lands on `/login`

### Requirement: Global Toaster mounted in AppShell
The AppShell SHALL mount `<Toaster position="top-center" />` so any `toast.*` call surfaces. Mirrors `HotSeatersMVP/src/Layout.jsx:550`.

#### Scenario: Toast invocation anywhere in the app
- **WHEN** any feature page calls `toast.success(...)`
- **THEN** the message renders in the top-center toaster region

### Requirement: Trial banner mounted in AppShell main area
The AppShell SHALL render `<TrialBanner company={company} />` above the main content when `company.trial_status` is not null. Mirrors `HotSeatersMVP/src/Layout.jsx:619`.

#### Scenario: Company is in a trial
- **WHEN** `company.trial_status === "trialing"`
- **THEN** TrialBanner renders above the AppShell `<main>` element

#### Scenario: Company is not in a trial
- **WHEN** `company.trial_status` is null
- **THEN** TrialBanner renders nothing

### Requirement: Unified chameleon logo
All HotSeaters brand-logo usages in the app SHALL resolve to `/brand/chameleon-logo.png`. No reference to `/logo.svg` or the base44 CDN URL may remain in `src/`.

#### Scenario: CI grep gate for logo source
- **WHEN** CI runs `git grep -E "/logo\\.svg|media\\.base44\\.com.*chameleon" src/`
- **THEN** the command exits with no matches
