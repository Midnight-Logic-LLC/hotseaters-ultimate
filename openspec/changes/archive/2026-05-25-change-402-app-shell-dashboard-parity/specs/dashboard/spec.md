## ADDED Requirements

### Requirement: Six KPI tiles with real data
The DashboardPage SHALL render the bible's six KPI tiles with computed values from `useDashboardAggregates`: Revenue YTD, Pipeline Value, Outstanding, Active Trials, Trials YTD, Revenue/Trial YTD. Mirrors `HotSeatersMVP/src/pages/Dashboard.jsx:763-883`. No `StubCard` instance may appear in the rendered tree for these tiles.

#### Scenario: Owner role lands on /Dashboard with data
- **WHEN** an authenticated Owner with `companyId` set reaches `/Dashboard`
- **THEN** all six KPI tiles render with values derived from the entity graph and no `StubCard` is present

#### Scenario: Trial Consultant role lands on /Dashboard
- **WHEN** a user with `company_role === "trial_consultant"` reaches `/Dashboard`
- **THEN** only Active Trials and Trials YTD tiles render, matching the role-gated bible behaviour at `Dashboard.jsx:758, 763, 789, 808, 827, 846, 865`

### Requirement: Sales Pipeline, Quick Stats, and Recent Activity row
The DashboardPage SHALL render the second-row triad ported from `HotSeatersMVP/src/pages/Dashboard.jsx:890-1083`. The Sales Pipeline card MUST bind to real `pipeline_stage` rows (delivered by change-404), Quick Stats MUST aggregate from the entity graph, and Recent Activity MUST list recent wins and recent invoices.

#### Scenario: Sales Pipeline with seeded stages
- **WHEN** two `pipeline_stage` rows exist with `type = "sales"` and `is_active = true`
- **THEN** the Sales Pipeline `<BarChart>` renders exactly two bars labelled with the seed names

#### Scenario: Recent Activity with no data
- **WHEN** there are zero won deals and zero invoices in the entity graph
- **THEN** the Recent Activity card renders the empty-state message ("No recent activity")

### Requirement: Needs Attention banner
The DashboardPage SHALL render the Needs Attention banner ported from `HotSeatersMVP/src/pages/Dashboard.jsx:711-755`. The banner MUST appear for Owner, Sales, or `is_sales === true` users when their stale-lead count is non-zero. Owners additionally see the total stale-lead count.

#### Scenario: Owner with personal and total stale leads
- **WHEN** `useMyStaleLeadsCount` returns `{ myCount: 2, totalCount: 7 }` and the role is Owner
- **THEN** the banner reads "2 of yours / 7 total need attention" and clicking it routes to `/LeadRadar`

#### Scenario: Sales user with zero stale leads
- **WHEN** `useMyStaleLeadsCount` returns `{ myCount: 0, totalCount: 0 }`
- **THEN** the banner is not rendered
