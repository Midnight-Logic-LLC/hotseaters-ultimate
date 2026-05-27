/**
 * ManualSalesPage — visual and functional parity with
 * HotSeatersMVP/src/pages/ManualSales.jsx (372 lines).
 *
 * Static documentation page — no hooks, no stores.
 * RULE F: lives under src/features/manual/pages/.
 */
import { TrendingUp, LayoutDashboard, Briefcase, Users } from "lucide-react";
import { ManualSubpageLayout } from "@/features/manual/components/manual-subpage-layout";
import { ManualSection } from "@/features/manual/components/manual-section";
import { ManualHeading } from "@/features/manual/components/manual-heading";
import { ManualParagraph } from "@/features/manual/components/manual-paragraph";
import { ManualList } from "@/features/manual/components/manual-list";
import { ManualInfoGrid } from "@/features/manual/components/manual-info-grid";
import { ManualQuickTip } from "@/features/manual/components/manual-quick-tip";
import { ManualSteps } from "@/features/manual/components/manual-steps";

const TOC = [
  { id: "dashboard", title: "Dashboard & Analytics" },
  { id: "sales", title: "Sales" },
  { id: "deals", title: "Deals Pipeline" },
  { id: "clients", title: "Clients & Contacts" },
];

export function ManualSalesPage() {
  return (
    <ManualSubpageLayout
      icon={TrendingUp}
      title="Sales"
      subtitle="Dashboard analytics, lead radar, deals pipeline, and client/contact database"
      color="#059669"
      sections={TOC}
    >
      {/* ══════════════════════════════════════════ */}
      {/*  DASHBOARD & ANALYTICS                    */}
      {/* ══════════════════════════════════════════ */}
      <ManualSection id="dashboard" icon={LayoutDashboard} title="Dashboard & Analytics" color="#0891b2">
        <ManualHeading color="#0891b2">What the Dashboard Shows</ManualHeading>
        <ManualParagraph>
          The Dashboard is the first thing you see when you open HotSeaters. It gives you a real-time snapshot of your business health across four KPI cards at the top, followed by an interactive revenue chart and a team performance section. All data is filtered to the selected fiscal year (configurable in Settings → Company).
        </ManualParagraph>

        <ManualHeading color="#0891b2">KPI Cards</ManualHeading>
        <ManualParagraph>The top of the Dashboard shows six metric cards covering key business health indicators:</ManualParagraph>
        <ManualInfoGrid color="#0891b2" cols={3} items={[
          ["Revenue YTD", "Year-to-date invoiced revenue from all invoices. Below it, a comparison to the same period last month (e.g., '+12% vs last month'). Clickable — navigates to Invoices"],
          ["Pipeline Value", "Sum of estimated values across all active deals (sales pipeline stages only). Shows deal count and weighted value. Clickable — navigates to Deals"],
          ["Outstanding", "Total dollar amount of unpaid invoices (sent or overdue status). Clickable — navigates to Collections"],
          ["Active Trials", "Count of trials currently in operations pipeline stages (not completed). Shows how many are upcoming vs in progress. Clickable — navigates to Trials"],
          ["Trials YTD", "Number of deals won (converted to trials) since January 1 of the current year"],
          ["Revenue/Trial YTD", "Average revenue per trial won this year — total YTD revenue divided by trials won YTD"],
        ]} />

        <ManualHeading color="#0891b2">Dashboard Sections</ManualHeading>
        <ManualParagraph>Below the KPI cards, the Dashboard displays several information panels:</ManualParagraph>
        <ManualList items={[
          <><strong>Sales Pipeline:</strong> Bar chart showing deal counts across your sales pipeline stages (visible to owners, admins, and sales users)</>,
          <><strong>Quick Stats:</strong> At-a-glance numbers including active clients, team members, outstanding invoices, average weekly hours, and HSH post/gig counts</>,
          <><strong>Recent Activity:</strong> Lists recently won deals and recently created invoices with status badges</>,
          <><strong>Active Trial Performance:</strong> Horizontal bar chart ranking active trials by revenue generated from time entries</>,
          <><strong>Upcoming Trials:</strong> Shows the next 3 upcoming trials with start dates and countdown days</>,
          <><strong>Quick Actions:</strong> Shortcut buttons for common tasks — New Deal, Log Time, Add Client, View Schedule, HotSeatHub, and New Invoice</>,
        ]} />

        <ManualHeading color="#0891b2">Team Performance</ManualHeading>
        <ManualParagraph>
          Below the revenue chart, a team performance section shows each consultant's metrics for the current week and month. Admins and owners see all team members; consultants see only their own data. For each person you see:
        </ManualParagraph>
        <ManualList items={[
          "Hours logged this week and this month",
          "Revenue generated (sum of billed amounts from their time entries)",
          "Profile photo or avatar with their name and tier badge",
          "Sorted by revenue contribution — top performers appear first",
        ]} />
        <ManualQuickTip color="#0891b2">The dashboard auto-refreshes data every 30 seconds. You don't need to manually reload — new invoices, time entries, and pipeline changes appear automatically.</ManualQuickTip>
      </ManualSection>

      {/* ══════════════════════════════════════════ */}
      {/*  SALES                                     */}
      {/* ══════════════════════════════════════════ */}
      <ManualSection id="sales" icon={TrendingUp} title="Sales" color="#059669">
        <ManualHeading color="#059669">Overview</ManualHeading>
        <ManualParagraph>
          Sales is your dedicated sales command center with three tabs: <strong>Lead Radar</strong>, <strong>Deal Tracker</strong>, and <strong>Projections</strong>. Your selected tab persists across sessions — when you come back, you'll be on the same tab you left. Each tab has its own filtering preferences that also persist — for example, Lead Radar has "My Leads / All Leads" and Deal Tracker has "My Deals / All Deals."
        </ManualParagraph>

        <ManualHeading color="#059669">Lead Radar Tab</ManualHeading>
        <ManualParagraph>
          Leads are potential clients who haven't become deals yet. The Lead Radar helps you track and nurture them through an activity-driven kanban board. Leads and client activities are organized into urgency columns based on when their next scheduled activity is due.
        </ManualParagraph>

        <ManualHeading color="#059669">Creating a New Lead</ManualHeading>
        <ManualSteps color="#059669" steps={[
          <><strong>Step 1 — Firm:</strong> Enter the firm name. As you type, the system searches your existing clients — you can select an existing firm or create a new one. Optionally select a Client Type</>,
          <><strong>Step 2 — Contact:</strong> Enter the contact's first name, last name, title, email, and phone. The system creates an Attorney record marked as a lead contact (is_lead = true)</>,
          <><strong>Step 3 — First Activity:</strong> Schedule your first activity — select an activity type (Call, Email, Meeting, or Note), pick a date, and write what should be done. This creates the lead's first scheduled reminder and places it on the kanban board</>,
        ]} />
        <ManualParagraph>
          Behind the scenes, the wizard creates a Client (if new), an Attorney, a Lead record linking them, and a LeadActivity with the scheduled date. If you have Google Calendar connected, the activity is automatically synced as a Google Task.
        </ManualParagraph>

        <ManualHeading color="#059669">Kanban Board</ManualHeading>
        <ManualParagraph>
          The kanban board organizes leads into four urgency columns based on how far away their next scheduled activity is:
        </ManualParagraph>
        <ManualInfoGrid color="#059669" cols={4} items={[
          ["Overdue (red)", "Scheduled date has passed. These need immediate attention. This column auto-hides when empty"],
          ["< 30 Days (amber)", "Activity due within the next 30 days. Active pipeline — stay on top of these"],
          ["30 – 90 Days", "Moderate lead time. Track them but focus energy on closer leads first"],
          ["90+ Days", "Far-out activities or leads with no scheduled date. Low urgency"],
        ]} />
        <ManualParagraph>
          Within each column, cards are sorted by scheduled date (soonest first). The board also includes <strong>client activity cards</strong> — these are pending activities for existing client contacts that don't have a separate Lead record, keeping all your activity tracking in one place.
        </ManualParagraph>

        <ManualHeading color="#059669">Lead Card Features</ManualHeading>
        <ManualParagraph>Each lead card on the kanban shows:</ManualParagraph>
        <ManualList items={[
          <><strong>Header:</strong> Contact name and title. In "All Leads" mode, the sales lead's avatar also appears</>,
          <><strong>Contact section (collapsible):</strong> Email, phone, and mobile — click any to call or email directly</>,
          <><strong>Firm section (collapsible):</strong> Firm name, phone, website, and notes</>,
          <><strong>Activity section (collapsible):</strong> Inline activity log showing recent calls, emails, meetings, and notes. Add new activity entries directly from here — each is timestamped with the author's name. Click the history icon to see the complete paginated history in a side panel</>,
          <><strong>Date bar:</strong> Shows the next scheduled date with an urgency badge — e.g., "3d overdue" (red), "Today" (amber), or "in 12d" (neutral). If the next activity is linked to a trial, the case name appears below. When no activity is scheduled, the bar shows "No follow-up set"</>,
          <><strong>Action buttons:</strong> Edit (pencil icon opens the edit sheet), Delete (trash icon with confirmation), and Promote (rocket icon — converts the lead to an active client)</>,
        ]} />

        <ManualHeading color="#059669">Activity Workflow</ManualHeading>
        <ManualParagraph>
          Activities are the heart of lead management. There are two types: <strong>scheduled activities</strong> (reminders with a future date) and <strong>instant activity logs</strong> (recording something that already happened). Both are stored as LeadActivity records.
        </ManualParagraph>
        <ManualList items={[
          <><strong>Schedule an activity:</strong> Click "Schedule Activity" in the toolbar (or the + button on a card with no pending activity). Search for any contact or trial, pick an activity type, set a date, and add notes. The activity appears on the kanban board and syncs to Google Tasks if connected</>,
          <><strong>Complete an activity:</strong> Click the green checkmark on a card. A dialog shows the scheduled details and lets you add completion notes. Optionally check "Schedule a new activity" to immediately create the next scheduled activity — this keeps the lead on the board without falling off</>,
          <><strong>Log inline activity:</strong> Open the Activity section on any card and click "Add Activity" to record a call, email, meeting, or note as an instant log entry. These don't have a scheduled date — they're a record of what already happened</>,
          <><strong>Activity history:</strong> Click the history icon on any card to see the complete chronological log in a side panel. History loads 50 entries at a time with a "Load more" button for leads with extensive records</>,
        ]} />

        <ManualHeading color="#059669">Alert Banners & Notifications</ManualHeading>
        <ManualParagraph>
          At the top of the Lead Radar tab, colored banners alert you to leads needing attention:
        </ManualParagraph>
        <ManualList items={[
          <><strong>Red banner — Overdue:</strong> Shows the count and names of leads with activities past their scheduled date</>,
          <><strong>Amber banner — Due Today:</strong> Shows leads with activities scheduled for today</>,
          <><strong>Daily notification:</strong> A scheduled background job checks for overdue and due-today activities each day and creates in-app notifications for the responsible sales lead</>,
        ]} />

        <ManualHeading color="#059669">Promoting a Lead to Client</ManualHeading>
        <ManualParagraph>
          When a lead is ready to become a real client, click the Promote button on their card and confirm. This sets the Client and Attorney records' <code>is_lead</code> flags to false, which moves them out of the Lead Radar and into the Clients page. All existing activities are preserved. You're then navigated to the Deals page so you can create a new deal for the now-active client.
        </ManualParagraph>

        <ManualHeading color="#059669">Deleting a Lead</ManualHeading>
        <ManualParagraph>
          Deleting a lead performs a cascading cleanup: all LeadActivity records for the contact are deleted, then the Lead record, then the Attorney record. If the firm has no other contacts and is still marked as a lead firm, the Client and its addresses are also removed.
        </ManualParagraph>

        <ManualHeading color="#059669">Filtering & Preferences</ManualHeading>
        <ManualList items={[
          <><strong>My Leads / All Leads:</strong> Toggle between seeing only your leads or everyone's. Default is "My Leads." Non-owner/admin users are locked to "My Leads" only. This preference persists across sessions</>,
          <><strong>Search:</strong> Filter leads by contact name or firm name in real time</>,
          <><strong>Google Tasks sync:</strong> If you've connected Google Calendar in your profile, all scheduled lead activities are automatically synced to a "Sales Leads" task list in Google Tasks. Completing or deleting activities updates the task in real time</>,
        ]} />

        <ManualHeading color="#059669">Deal Tracker Tab</ManualHeading>
        <ManualParagraph>
          The Deal Tracker gives you a quick-glance urgency view of active deals, specifically focused on which deals are at risk of going to trial without a signed engagement letter. Deals are grouped into urgency categories based on days until trial start:
        </ManualParagraph>
        <ManualInfoGrid color="#059669" cols={4} items={[
          ["Urgent (< 10 days)", "Trial start approaching fast, no signed engagement letter. These need immediate attention — call the client today"],
          ["Warning (10-30 days)", "Documents sent but not signed, or deal stalled early. Time to follow up and push for signatures"],
          ["Upcoming (30-90 days)", "Moderate lead time. Good to have docs out but not yet critical"],
          ["Future (90+ days)", "Far-out trials. Track them but focus energy on closer deals first"],
        ]} />
        <ManualParagraph>
          Each deal card shows the case name, client, trial start date, estimated value, current pipeline stage, and the primary contact. Click any card to navigate directly to the full deal detail page. The "My Deals" toggle filters to only show deals where you are the assigned sales consultant.
        </ManualParagraph>

        <ManualHeading color="#059669">Projections Tab</ManualHeading>
        <ManualParagraph>
          The Projections tab is the most analytically rich view in Sales. It features an interactive revenue chart that combines actual invoiced revenue (what you've already billed) with projected future revenue (calculated from your pipeline deals and their service schedules). The chart shows 12 months of data for the selected fiscal year and supports multiple display modes:
        </ManualParagraph>
        <ManualList items={[
          <><strong>Actual Revenue (solid bars):</strong> Invoiced amounts per period from paid and sent invoices, broken down by the configured billing period (weekly, monthly, or per-trial). This is real money billed</>,
          <><strong>Projected Revenue (lighter/translucent bars):</strong> Future bars calculated by taking each active deal's services, their daily rates, their date ranges, and weighting by the pipeline stage's probability. A service worth $200/day running 20 days at a 50% probability stage = $2,000 projected revenue</>,
          <><strong>Goal Line (dashed green):</strong> Horizontal line showing your annual revenue target ÷ 12 (set in Settings → Company → Annual Revenue Target). Gives you a monthly benchmark</>,
          <><strong>Breakeven Line (dashed red):</strong> Horizontal line showing your monthly breakeven amount (also set in Settings). When bars are above this line, you're profitable</>,
          <><strong>Trend Line toggle:</strong> Overlays a linear regression trend across your actual revenue months. Slopes up = business growing, slopes down = watch out</>,
          <><strong>Cumulative Mode:</strong> Switch from monthly bars to a cumulative area chart. Shows year-to-date total growing month over month — great for tracking progress toward your annual target</>,
          <><strong>Fiscal Year Navigation:</strong> Arrow buttons move between fiscal years. Your fiscal year start month is configured in Settings → Company (e.g., if your fiscal year starts in April, FY2026 = April 2025 through March 2026)</>,
          <><strong>Weekly vs Monthly:</strong> Toggle between weekly and monthly time periods for the chart. Weekly is useful for granular recent analysis</>,
          <><strong>HSH Revenue:</strong> Revenue from HotSeatHub subcontractor gigs is included. When you're hiring subcontractors, their agreed payout rate is deducted from projected revenue to show net revenue. When you're providing consultants, the agreed rate is added as income</>,
          <><strong>Split Billing:</strong> Services using split billing (hourly pre-trial, daily minimum in-trial) are projected with separate rates for each phase, using the trial start date as the cutoff</>,
          <><strong>Detail Table:</strong> Below the chart, a detailed data table shows every projected invoice record — deal/trial name, service name, date range, daily value, probability, projected value. This is the raw data behind the bars</>,
        ]} />
        <ManualQuickTip color="#059669">Projections are only as accurate as your pipeline data. Keep estimated values, trial dates, and pipeline stages current for useful forecasts. Stage probability weights are configured in Settings → Pipeline Stages.</ManualQuickTip>
      </ManualSection>

      {/* ══════════════════════════════════════════ */}
      {/*  DEALS PIPELINE                           */}
      {/* ══════════════════════════════════════════ */}
      <ManualSection id="deals" icon={Briefcase} title="Deals Pipeline" color="#3b82f6">
        <ManualHeading color="#3b82f6">Creating a New Deal</ManualHeading>
        <ManualParagraph>
          Deals are the core of your sales pipeline — each represents a potential trial engagement. Click "New Deal" to launch the 4-step Deal Wizard:
        </ManualParagraph>
        <ManualSteps color="#3b82f6" steps={[
          <><strong>Step 1 — Client & Contacts:</strong> Select an existing client or type to search. If the firm doesn't exist, you can create one inline without leaving the wizard. Choose a primary contact (the attorney you'll communicate with). Optionally designate a Financially Responsible Party (FRP) if billing goes to a different firm — select the FRP firm and FRP contact separately. Add secondary contacts who should also be associated with this case</>,
          <><strong>Step 2 — Case Details:</strong> Enter the case name (your label for this deal), case style (plaintiff v. defendant), case number, courthouse name, city and state, court, presiding judge, case type (e.g., Civil, Criminal, Personal Injury, Patent), side (plaintiff or defense), and trial start/end dates. The venue search uses Google Places autocomplete for courthouse names</>,
          <><strong>Step 3 — Services & Pricing:</strong> Select services from your company's service catalog. For each service: rate auto-calculates as Base Rate × Client Type Multiplier × Consultant Tier Multiplier. Client-specific overrides (from the client's detail page) take priority over the multiplier calculation. Choose billing method per service: Hourly, Daily Minimum, or Split. Set estimated quantities. Toggle travel eligibility. Set arrival days for in-trial services that start before the trial date. Drag to reorder services. The wizard shows a running total</>,
          <><strong>Step 4 — Review & Create:</strong> See the complete deal summary: total estimated value, all services with rates, retainer recommendation (calculated as: value ÷ retainer divisor × retainer multiplier, with a floor at the retainer minimum — all configurable in Settings → Company). Review all contacts, case details, services. Click "Create Deal" — the deal is placed in the first sales pipeline stage</>,
        ]} />

        <ManualHeading color="#3b82f6">Rate Calculation Formula</ManualHeading>
        <ManualParagraph>
          Understanding how rates are calculated is essential for accurate quoting:
        </ManualParagraph>
        <ManualList items={[
          <><strong>Default calculation:</strong> Final Rate = Base Service Rate × Client Type Multiplier × Consultant Tier Multiplier</>,
          <><strong>Example:</strong> Trial Consulting at $200/hr base × 1.0 (Law Firm client type) × 1.3 (Senior tier) = $260/hr</>,
          <><strong>Client overrides:</strong> If the client has a specific rate override for a service (set on the client detail page), that flat rate is used instead of the multiplier calculation entirely</>,
          <><strong>Manual adjustment:</strong> You can always manually change the rate on any individual service line in the deal wizard — the calculated rate is a starting point, not a locked value</>,
          <><strong>Travel time:</strong> Travel Time service rate = Associated Service Rate × Travel Multiplier (e.g., if Trial Consulting is $260/hr and travel multiplier is 0.5×, travel time = $130/hr)</>,
        ]} />

        <ManualHeading color="#3b82f6">Managing Active Deals</ManualHeading>
        <ManualList items={[
          <><strong>Three View Modes:</strong> Kanban (drag between stage columns), List (sortable table), Cards (visual grid). Your preference is saved per-user across sessions</>,
          <><strong>Pipeline Stages:</strong> In Kanban view, drag deal cards between columns to move through stages. In List or Cards view, use the stage dropdown in the deal detail. Stage changes are logged in the activity feed with timestamps</>,
          <><strong>Deal Detail Panel:</strong> Click any deal to open a full detail view with tabs for Info (case details, editable inline), Contacts (primary + secondary + FRP), Services (full rate table with edit capability), Documents (generate, send, track), Activity Log (auto + manual entries), and Notes</>,
          <><strong>Documents Tab:</strong> Generate engagement letters, proposals, or custom documents from your configured templates. Each document auto-fills placeholders (case name, client name, dates, services table) from the deal data. Send for e-signature directly from here</>,
          <><strong>Activity Log:</strong> Automatically captures: stage changes, documents sent/viewed/signed, and pipeline auto-moves. You can also add manual activity entries — notes, calls, emails, meetings — each timestamped with the user who logged it</>,
          <><strong>Filter & Search:</strong> Filter by sales lead, client, pipeline stage, date range, or completion status. Text search works across case name, client firm name, case number, and job number. All filter states persist during your session</>,
          <><strong>Completed Deals:</strong> Toggle "Show Completed" to see deals marked as won, lost, or settled. These appear in a separate section below the active pipeline, preserving the full historical record</>,
        ]} />

        <ManualHeading color="#3b82f6">Closing Deals</ManualHeading>
        <ManualInfoGrid color="#3b82f6" cols={3} items={[
          ["Mark as Won", "Converts the deal into an active trial. The system: generates a job number (auto-incremented per your Settings format), copies all services/rates/contacts/documents to the trial record, places the trial in the first operations pipeline stage, records the won date, and navigates you to the new trial. All your work from the deal carries over — nothing is lost"],
          ["Mark as Lost", "Archives the deal with a lost date and optional loss reason. The deal record is preserved for reporting and historical reference but removed from the active pipeline. You can still access it via the 'Show Completed' toggle. Lost deals contribute to win/loss ratio analytics"],
          ["Mark as Settled", "Same archival behavior as lost, but with a 'settled' completion type. Used when the case settles before reaching trial — this is a distinct business outcome worth tracking separately from true losses"],
        ]} />

        <ManualHeading color="#3b82f6">Auto-Move Rules</ManualHeading>
        <ManualParagraph>
          Pipeline stages can be configured to auto-advance deals when certain events occur. These are set up in Settings → Pipeline Stages on a per-stage basis:
        </ManualParagraph>
        <ManualList items={[
          <><strong>Document Sent trigger:</strong> When a document of a specific category (e.g., Engagement Letter) is emailed to the client, auto-move the deal to a designated stage. Example: sending an engagement letter moves the deal to "Proposal Sent"</>,
          <><strong>Document Signed trigger:</strong> When all signers have completed signing a document of a specific category, auto-move to another stage. Example: fully signed engagement letter moves to "Engaged"</>,
          <><strong>Earliest Service Start trigger:</strong> When the earliest service start date on the deal is reached (today's date matches), auto-move to a stage. Example: move to "Pre-Trial" when prep work begins</>,
          <><strong>Trial Start Date trigger:</strong> When the trial start date is reached, auto-move to another stage. Example: move to "In Trial" on the first day of trial</>,
        ]} />
        <ManualParagraph>
          Auto-moves fire automatically in the background. Each move is logged in the deal's activity feed with a note indicating it was triggered by an automation, not a manual user action. Multiple triggers can be active on different stages simultaneously.
        </ManualParagraph>
        <ManualQuickTip color="#3b82f6">Each pipeline stage has a revenue probability weight (e.g., New Lead = 10%, Proposal Sent = 25%, Engaged = 75%, Won = 100%) that feeds directly into revenue projection charts. Set these realistically in Settings → Pipeline Stages to get accurate forecasts.</ManualQuickTip>
      </ManualSection>

      {/* ══════════════════════════════════════════ */}
      {/*  CLIENTS & CONTACTS                       */}
      {/* ══════════════════════════════════════════ */}
      <ManualSection id="clients" icon={Users} title="Clients & Contacts" color="#16a34a">
        <ManualHeading color="#16a34a">Clients Page Overview</ManualHeading>
        <ManualParagraph>
          The Clients page is your client database. It only shows actual clients (not leads — those are managed separately through Lead Radar in Sales). Clients are organized into groups by <strong>Client Type</strong>, and each group can be collapsed or expanded. The entire page supports two view modes — <strong>List</strong> (compact rows showing firm name, phone, location, contacts, and sales lead) and <strong>Card</strong> (visual grid with more detail per client). Your view preference is saved automatically.
        </ManualParagraph>

        <ManualHeading color="#16a34a">Search, Filter & Sort</ManualHeading>
        <ManualList items={[
          <><strong>Search:</strong> Type in the search bar to find clients by firm name, or by any contact's first name, last name, or email address. The search works across all client types simultaneously</>,
          <><strong>Active / Inactive Toggle:</strong> By default you see active clients. Flip the toggle to see inactive clients instead (clients you've deactivated but want to keep on file)</>,
          <><strong>Hide Empty Types:</strong> Toggle this on to hide client type groups that have no matching clients — useful when you have many types but only a few have entries</>,
          <><strong>Sales Person Filter:</strong> Dropdown to filter the entire list to show only clients assigned to a specific sales lead</>,
        ]} />

        <ManualHeading color="#16a34a">Client Types & Pricing Multipliers</ManualHeading>
        <ManualParagraph>
          Every client is assigned to a <strong>Client Type</strong> (e.g., "Law Firm," "Trial Services Company," "Corporate Client"). Client Types have a <strong>default pricing multiplier</strong> that automatically adjusts rates when you create deals for that client. For example:
        </ManualParagraph>
        <ManualList items={[
          <><strong>Law Firm (1.0×):</strong> Standard pricing — your base service rates apply as-is</>,
          <><strong>Trial Services Company (0.85×):</strong> 15% discount — when you do subcontract work for another trial consulting firm, they get a discounted rate</>,
          <><strong>Corporate Client (1.25×):</strong> 25% markup — direct corporate clients pay a premium</>,
        ]} />
        <ManualParagraph>
          You can create, rename, reorder (drag-and-drop), and delete client types directly from the Clients page using the "Add Client Type" button. Each type's multiplier can be adjusted at any time. Default types (like "Law Firm") can have their multiplier changed but cannot be renamed or deleted. Deleting a custom type is blocked if any clients are currently assigned to it — you must reassign them first.
        </ManualParagraph>

        <ManualHeading color="#16a34a">Creating a New Client</ManualHeading>
        <ManualParagraph>
          Click "Add New Client" to open the creation form. The system uses a smart layout that checks if the firm name you're typing already exists in your database, and if so, offers to open the existing client instead of creating a duplicate.
        </ManualParagraph>
        <ManualSteps color="#16a34a" steps={[
          <><strong>Client Name:</strong> The name of the law firm or organization (required)</>,
          <><strong>Client Type:</strong> Select from your configured types — defaults to "Law Firm" for new clients</>,
          <><strong>Sales Lead:</strong> Required — select which sales team member owns this client relationship. Only team members with the "is_sales" flag appear in this dropdown. If you are a sales user, it auto-defaults to you</>,
          <><strong>Phone & Website:</strong> Phone numbers are auto-formatted to (xxx) xxx-xxxx when displayed</>,
          <><strong>Initial Address:</strong> On creation, you can enter the client's first address (label like "Main Office," street, city, state, ZIP). You can add more addresses later</>,
          <><strong>Notes:</strong> Free-text field for anything you want to remember about this client</>,
          <><strong>Service Pricing Overrides:</strong> Optionally set custom rates for specific services that override the base rate × client type multiplier calculation. For example, if you negotiated a flat $200/hr for Trial Consulting with this client instead of your standard $225/hr</>,
        ]} />

        <ManualHeading color="#16a34a">Client Detail View</ManualHeading>
        <ManualParagraph>
          Click any client in the list to open their full detail view. This is a three-column layout:
        </ManualParagraph>
        <ManualInfoGrid color="#16a34a" cols={3} items={[
          ["Column 1: Client Info", "Firm name, phone, website (clickable link), client type with multiplier badge, notes, and the full Addresses section. Each address shows label (Main Office, Billing, etc.), full street address, city/state/ZIP, and a star icon for the primary address. You can add, edit, delete addresses, and set any address as primary"],
          ["Column 2: Contacts", "All attorney/contact records for this client, sorted by last name. Contacts are grouped by which address they're associated with (if any) — this helps when a firm has multiple offices. Each contact shows name, title, email, phone. Click a contact to edit. Hover to reveal delete button. Admins only can delete contacts"],
          ["Column 3: Service Overrides", "Shows any custom rates configured for this specific client. Lists the service name, the default rate (base × client type multiplier), and the override rate side by side so you can easily compare"],
        ]} />

        <ManualHeading color="#16a34a">Contacts (Attorneys)</ManualHeading>
        <ManualParagraph>
          Each client can have unlimited contacts. A contact record stores: first name, last name, title, email, phone, mobile, notes, and an optional address association. Contacts are the people you interact with — they become selectable as primary contacts and FRP contacts when creating deals, and as signers when sending documents for e-signature.
        </ManualParagraph>
        <ManualList items={[
          <><strong>Adding a contact:</strong> Click the + button in the Contacts column → fill in the form → save. The contact is immediately available for use in deals</>,
          <><strong>Editing a contact:</strong> Click any contact card to open the edit form in-place. Change any field and save</>,
          <><strong>Address association:</strong> Each contact can be linked to one of the client's addresses. When a firm has multiple offices, this helps track which attorneys are at which location. Contacts grouped by address in the UI</>,
          <><strong>Deep linking:</strong> URLs support ?client=ID&contact=ID parameters — clicking a notification about a contact takes you directly to the Clients page with that specific contact's edit form open</>,
        ]} />

        <ManualHeading color="#16a34a">Transferring a Contact to Another Firm</ManualHeading>
        <ManualParagraph>
          When an attorney moves to a different law firm (a common occurrence in legal work), the Transfer feature handles this cleanly:
        </ManualParagraph>
        <ManualSteps color="#16a34a" steps={[
          "Open the contact's edit form by clicking on them",
          "Click the \"Transfer\" button (only visible to admins)",
          "A dialog opens asking you to select the destination client (the firm the attorney is moving to)",
          "Search and select the destination firm",
          "On confirmation: the system creates a new contact record at the destination firm with all the attorney's info. The original record at the source firm is marked as \"transferred\" — it becomes hidden from the active contacts list but is preserved for historical reference on any existing deals or trials where this contact was the primary contact or FRP",
        ]} />

        <ManualHeading color="#16a34a">Addresses</ManualHeading>
        <ManualParagraph>
          Each client can have multiple addresses (Main Office, Billing Address, Branch Office, etc.). Addresses are stored separately from the client record, which means:
        </ManualParagraph>
        <ManualList items={[
          "Each address has a label, street address, city, state, and ZIP code",
          <><strong>Primary address:</strong> One address can be starred as primary. The primary address is what shows in the client list view and is used as the default when generating documents and invoices</>,
          "Changing the primary: click \"Set as Primary\" on any address — the previous primary is automatically un-starred",
          "Contacts can be linked to a specific address, so when you have attorneys at different offices you can see which contacts are at which location",
          "When creating a deal for this client, you can select which address to associate with the case",
        ]} />

        <ManualHeading color="#16a34a">Service Pricing Overrides</ManualHeading>
        <ManualParagraph>
          The third column on the client detail page shows service pricing overrides. These are custom rates for specific services that <em>bypass</em> the normal rate calculation (base rate × client type multiplier × consultant tier). Use cases:
        </ManualParagraph>
        <ManualList items={[
          "A client negotiated a special flat rate for a specific service",
          "You want to charge a different rate type than the default (e.g., hourly instead of daily for this client)",
          "A long-term client has grandfathered pricing that doesn't match your current rate card",
        ]} />
        <ManualParagraph>
          When you create a deal for a client with overrides, the overridden rates appear automatically in the deal wizard — no need to remember or manually adjust.
        </ManualParagraph>

        <ManualHeading color="#16a34a">Deals & Trials for this Client</ManualHeading>
        <ManualParagraph>
          Below the three columns, the client detail page shows two side-by-side lists: <strong>Active Deals</strong> (cases still in the sales pipeline) and <strong>Active Trials</strong> (cases that have been won and are in the operations pipeline). This includes cases where this client is the primary client OR where they're listed as the Financially Responsible Party (FRP) on another client's case. Each item is clickable — it navigates directly to the deal or trial detail page. You can also create a new deal directly from this view using the "Add Deal" button, which pre-selects this client in the deal wizard.
        </ManualParagraph>

        <ManualHeading color="#16a34a">Bulk Import</ManualHeading>
        <ManualSteps color="#16a34a" steps={[
          "Click the import icon button on the Clients page toolbar",
          "Upload a CSV or Excel file containing your client data",
          "The Import Wizard opens — map columns from your file to HotSeaters fields (firm name, contacts, addresses, phone, etc.)",
          "Preview the data → Confirm → Records are created in bulk",
        ]} />

        <ManualQuickTip color="#16a34a">The Clients page only shows actual clients (is_lead = false). Lead organizations are managed through the Lead Radar tab in Sales. When a lead is promoted and a deal is won, the client record automatically becomes a customer.</ManualQuickTip>
      </ManualSection>
    </ManualSubpageLayout>
  );
}
