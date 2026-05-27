/**
 * ManualCompanyPage — visual and functional parity with
 * HotSeatersMVP/src/pages/ManualCompany.jsx (341 lines).
 *
 * Static documentation page — no hooks, no stores.
 * RULE F: lives under src/features/manual/pages/.
 */
import { Building2, Users, Bell, Settings, Award } from "lucide-react";
import { ManualSubpageLayout } from "@/features/manual/components/manual-subpage-layout";
import { ManualSection } from "@/features/manual/components/manual-section";
import { ManualHeading } from "@/features/manual/components/manual-heading";
import { ManualParagraph } from "@/features/manual/components/manual-paragraph";
import { ManualList } from "@/features/manual/components/manual-list";
import { ManualInfoGrid } from "@/features/manual/components/manual-info-grid";
import { ManualQuickTip } from "@/features/manual/components/manual-quick-tip";
import { ManualSteps } from "@/features/manual/components/manual-steps";

const TOC = [
  { id: "team", title: "Team Management" },
  { id: "tiers", title: "Consultant Tiers" },
  { id: "notifications", title: "Notifications" },
  { id: "settings", title: "Settings & Configuration" },
];

export function ManualCompanyPage() {
  return (
    <ManualSubpageLayout
      icon={Building2}
      title="Company"
      subtitle="Team management, role assignments, consultant tiers, settings, and notifications"
      color="#78716c"
      sections={TOC}
    >
      {/* ══════════════════════════════════════════ */}
      {/*  TEAM MANAGEMENT                          */}
      {/* ══════════════════════════════════════════ */}
      <ManualSection id="team" icon={Users} title="Team Management" color="#0d9488">
        <ManualHeading color="#0d9488">Team Page Overview</ManualHeading>
        <ManualParagraph>
          The Team page shows all active members of your company with their role, tier, profile photo, assigned services, and Google Calendar connection status. Search and filter by name, role, or tier. Toggle between active and inactive members (deactivated members are hidden by default but their data is preserved).
        </ManualParagraph>

        <ManualHeading color="#0d9488">Inviting New Team Members</ManualHeading>
        <ManualSteps color="#0d9488" steps={[
          "Click \"Invite Team Member\" to open the invitation form",
          "Enter the person's email address, first name, and last name",
          "Select their role (Owner, Admin, Sales, or Trial Consultant — see role descriptions below)",
          "Select their consultant tier (Junior, Standard, Senior, Principal — or your custom tiers). This determines their pricing multiplier for rate calculations",
          "Check the services they're qualified to perform — this controls which services they can be assigned to on trials and which services appear in their time clock dropdown",
          "Optionally toggle \"is_sales\" flag — this gives a consultant access to the Sales Hub and Deals pages while keeping them in the consultant role for everything else",
          "Send the invitation → a secure email is sent with a unique signup/login link",
          "When the invitee clicks the link, they create an account (or log in if they already have one) and are automatically added to your company with the configured role, tier, and services",
        ]} />

        <ManualHeading color="#0d9488">Roles — Detailed Permissions</ManualHeading>
        <ManualInfoGrid color="#0d9488" cols={2} items={[
          ["Owner", "Full platform access — everything an Admin can do, PLUS: subscription management (upgrade/downgrade plan), Stripe billing portal access, company deletion, HotSeatHub add-on management, and theme customization. Only one Owner per company. Ownership cannot be transferred through the UI — contact support for ownership changes"],
          ["Admin", "Everything except subscription management. Can: manage team members (invite, deactivate, change roles), configure all settings (services, rates, pipeline stages, templates, billing, time tracking), approve/reject time entries and expenses, create and send invoices, manage collections, view and manage all deals and trials, use the full Schedule timeline, manage HotSeatHub requests and responses, and access the admin database browser"],
          ["Sales", "Focused on revenue generation. Can: use the full Sales Hub (Leads Radar, Deal Tracker, Revenue Projections), manage Deals (create, edit, move through pipeline, send documents), manage Clients and Contacts, view the Schedule (read-only — can see but not drag), generate and send documents. Cannot: approve time/expenses, create invoices, access team management, or modify settings"],
          ["Trial Consultant", "Focused on execution. Can: use the Time Clock and manual time entry, submit expenses with receipt scanning and mileage tracking, view their personal schedule and assignments, receive notifications for schedule changes and assignment updates, request time off. If the 'is_sales' flag is enabled on their profile, they also get all Sales role access — useful for consultants who also sell"],
        ]} />

        <ManualHeading color="#0d9488">Consultant Profiles</ManualHeading>
        <ManualParagraph>
          Click any team member to view or edit their full profile. The profile contains:
        </ManualParagraph>
        <ManualList items={[
          <><strong>Personal info:</strong> First name, last name, email, phone, bio (free text), and profile photo (uploadable)</>,
          <><strong>Role & tier:</strong> Their company role and consultant tier, both editable by admins</>,
          <><strong>Qualified services:</strong> Checkboxes for each service in your catalog. Only checked services appear when assigning this person to trial services, and only checked services appear in their time clock dropdown. This prevents misassignment and keeps the UI clean</>,
          <><strong>Google Calendar connection:</strong> Shows whether this consultant has connected their Google Calendar. When connected, trial service assignments automatically create/update calendar events in their personal calendar with trial details, location, and dates. Connection is per-consultant — each person authorizes their own calendar through the profile page</>,
          <><strong>Deactivation:</strong> Admins can deactivate a team member. This removes them from active lists (assignment dropdowns, time clock, etc.) but preserves all their historical data — time entries, expenses, assignments, and activity logs remain intact for billing and reporting. Deactivated members can be reactivated later if they return</>,
        ]} />

        <ManualHeading color="#0d9488">Referral Invitations</ManualHeading>
        <ManualParagraph>
          Separate from internal team invitations, the Team page also supports referral invitations — inviting other trial consulting companies to join the HotSeaters platform. Referral invitations send a branded email with a landing page explaining the platform and a unique sign-up link. This is how the HotSeatHub marketplace grows — existing companies inviting their industry peers.
        </ManualParagraph>
      </ManualSection>

      {/* ══════════════════════════════════════════ */}
      {/*  CONSULTANT TIERS                         */}
      {/* ══════════════════════════════════════════ */}
      <ManualSection id="tiers" icon={Award} title="Consultant Tiers" color="#7c3aed">
        <ManualHeading color="#7c3aed">How Tiers Work</ManualHeading>
        <ManualParagraph>
          Consultant Tiers represent experience/seniority levels and directly affect pricing. Each tier has a name and a pricing multiplier that factors into the rate calculation formula: <strong>Final Rate = Base Service Rate × Client Type Multiplier × Tier Multiplier</strong>. Tiers are configured in Settings → Tiers.
        </ManualParagraph>
        <ManualInfoGrid color="#7c3aed" cols={4} items={[
          ["Junior (0.8×)", "Entry-level consultants. Base rate of $200/hr becomes $160/hr. 20% discount reflects lower experience level"],
          ["Standard (1.0×)", "Mid-level consultants. Base rate applies as-is. No adjustment"],
          ["Senior (1.3×)", "Experienced consultants. $200/hr becomes $260/hr. 30% premium for expertise"],
          ["Principal (1.5×)", "Top-tier consultants. $200/hr becomes $300/hr. 50% premium for the best in the firm"],
        ]} />

        <ManualHeading color="#7c3aed">Customizing Tiers</ManualHeading>
        <ManualParagraph>
          Tiers are fully customizable to match your company's structure:
        </ManualParagraph>
        <ManualList items={[
          <><strong>Rename:</strong> Change "Junior" to "Associate" or "Senior" to "Lead Consultant" — whatever terminology your firm uses</>,
          <><strong>Change multipliers:</strong> Adjust the pricing factor for any tier. A multiplier of 1.0 means no adjustment. Less than 1.0 is a discount, greater than 1.0 is a premium</>,
          <><strong>Add new tiers:</strong> Create additional tiers for your specific structure (e.g., "Intern" at 0.5×, "Director" at 2.0×)</>,
          <><strong>Deactivate unused:</strong> Toggle tiers to inactive. Inactive tiers don't appear in dropdowns but existing assignments retain their tier reference</>,
          <><strong>Reorder:</strong> Drag tiers to set display order in dropdowns and profiles</>,
        ]} />
        <ManualParagraph>
          <strong>Important:</strong> Tier multipliers are applied at deal creation time. When you create a deal, the rate is calculated using the current tier multiplier and locked in. If you later change a tier's multiplier, existing deals keep their original rates — only new deals pick up the new multiplier. This prevents accidental retroactive pricing changes.
        </ManualParagraph>
      </ManualSection>

      {/* ══════════════════════════════════════════ */}
      {/*  NOTIFICATIONS                            */}
      {/* ══════════════════════════════════════════ */}
      <ManualSection id="notifications" icon={Bell} title="Notifications" color="#f59e0b">
        <ManualHeading color="#f59e0b">How Notifications Work</ManualHeading>
        <ManualParagraph>
          The notification bell icon in the sidebar shows a count of unread notifications. Click to open the notification panel showing all recent notifications, newest first. Click any notification to see full details — most open a contextual dialog with relevant information and action buttons. The system polls for new notifications every 15 seconds automatically.
        </ManualParagraph>

        <ManualHeading color="#f59e0b">Notification Types</ManualHeading>
        <ManualInfoGrid color="#f59e0b" cols={2} items={[
          ["Schedule Changes", "Triggered when trial or service dates change — whether from timeline drag-and-drop, manual date edit, or trial continuation. Shows old dates → new dates. Sent to all consultants assigned to affected services. Includes a link to view the updated trial on the timeline"],
          ["Service Assignments", "Triggered when you're assigned to or removed from a trial service. Shows the trial name, service name, and date range. Assignment notifications include a confirmation dialog where you can acknowledge. Unassignment notifications explain which service you were removed from"],
          ["Pipeline Movement", "Triggered when a deal or trial auto-moves to a new pipeline stage. Shows old stage → new stage and what triggered the move (document signed, date reached, etc.). Sent to the assigned sales consultant and admins"],
          ["HSH Activity", "Covers the full marketplace lifecycle: new requests matching your services, responses to your posted jobs, counter-offers during negotiation, acceptance confirmations, and assignment cancellations. Each type opens an appropriate dialog with action buttons (accept, counter, view details)"],
          ["Expense Decisions", "Triggered when your submitted expense is approved or rejected. Approval notifications are informational. Rejection notifications include the admin's reason and a link to edit and resubmit the expense"],
          ["Time Entry Rejections", "Triggered when your submitted time entry is rejected. Shows the rejection reason provided by the admin. Includes a link to the time entry so you can edit the details (fix times, add missing description, etc.) and resubmit"],
        ]} />

        <ManualHeading color="#f59e0b">Notification Behavior</ManualHeading>
        <ManualList items={[
          "Notifications are per-user — each person only sees notifications relevant to them",
          "Unread count shows as a badge on the bell icon in the sidebar navigation",
          "Clicking a notification marks it as read. You can also mark all as read in one click",
          "Notifications that require action (like HSH responses) open a dialog with relevant buttons. Informational notifications just show the details",
          "Old notifications are preserved indefinitely for reference — scroll back to see historical notifications",
        ]} />
      </ManualSection>

      {/* ══════════════════════════════════════════ */}
      {/*  SETTINGS & CONFIGURATION                */}
      {/* ══════════════════════════════════════════ */}
      <ManualSection id="settings" icon={Settings} title="Settings & Configuration" color="#78716c">
        <ManualHeading color="#78716c">Who Can Access Settings</ManualHeading>
        <ManualParagraph>
          Owner and Admin roles can access Settings. Some tabs are further restricted: Theme customization and Database browser are admin-only, Subscription management is owner-only, and HotSeatHub configuration is owner-only (and only visible when the HSH add-on is active).
        </ManualParagraph>

        {/* ── Company (General) Tab ── */}
        <ManualHeading color="#78716c">Company (General) Tab</ManualHeading>
        <ManualParagraph>
          The Company tab is split into two cards: Company Identity and Financial.
        </ManualParagraph>
        <ManualList items={[
          <><strong>Company Identity:</strong> Company name, logo (upload/remove), street address, city, state (dropdown), ZIP code, website URL, and phone number (auto-formatted). The logo appears on invoices, proposals, HSH directory cards, and the sidebar header</>,
          <><strong>Debug toggle (admin-only):</strong> A "Show Debug Info" switch at the bottom of the identity card. When enabled, technical debug information cards appear across the app. Developer use only — hidden from non-admin users</>,
        ]} />
        <ManualParagraph>
          The Financial card contains:
        </ManualParagraph>
        <ManualList items={[
          <><strong>Fiscal year start month:</strong> Dropdown selecting January through December. Determines how fiscal years are calculated across dashboards, revenue projections, and the optional yearly reset for invoice/job numbers</>,
          <><strong>Annual revenue target:</strong> Dollar amount that drives the goal line on the Dashboard revenue chart and the Sales Hub revenue projections</>,
          <><strong>Monthly breakeven:</strong> Dollar amount that drives the breakeven line on the Dashboard and revenue charts — the minimum monthly revenue needed to cover expenses</>,
        ]} />

        {/* ── Time Tracking Tab ── */}
        <ManualHeading color="#78716c">Time Tracking Tab</ManualHeading>
        <ManualParagraph>
          Controls how the time clock rounds entries and what appears in the clock interface.
        </ManualParagraph>
        <ManualList items={[
          <><strong>Time entry rounding interval:</strong> Dropdown with options: 1 minute (0.025 hr), 6 minutes (0.1 hr), 15 minutes (0.25 hr), 30 minutes (0.5 hr), or 60 minutes (1 hr). All time entries are rounded to the nearest increment of this value</>,
          <><strong>Clock-in rounding direction:</strong> How the start time is rounded when a consultant starts the timer. Options: Round Down (back in time), Round to Nearest, or Round Up (forward in time)</>,
          <><strong>Clock-out rounding direction:</strong> Independent from clock-in. How the end time is rounded when a consultant stops the timer. Same options as above</>,
          <><strong>Hide deals from time clock:</strong> Toggle switch. When enabled, only trials (won deals) appear in the time clock task dropdown — active deals still in the sales pipeline are hidden. Keeps the interface clean for consultants who shouldn't be logging time against unconfirmed work</>,
        ]} />

        {/* ── Billing Tab ── */}
        <ManualHeading color="#78716c">Billing Tab</ManualHeading>
        <ManualParagraph>
          The Billing tab has three sections: Billing Settings, Number Formatting, and Invoice Period.
        </ManualParagraph>
        <ManualParagraph>
          <strong>Billing Settings:</strong>
        </ManualParagraph>
        <ManualList items={[
          <><strong>Default daily minimum hours:</strong> The baseline number of hours billed per trial day when a service uses daily minimum billing (e.g., 8 hours). Overridable per individual trial</>,
          <><strong>Default tax rate (%):</strong> Applied to invoices. Can be overridden per invoice</>,
          <><strong>Invoice due date:</strong> Dropdown selecting Net 7, Net 14, Net 30, Net 45, Net 60, or Net 90. Sets the default payment terms on new invoices</>,
        ]} />
        <ManualParagraph>
          <strong>Number Formatting:</strong>
        </ManualParagraph>
        <ManualList items={[
          <><strong>Invoice number format:</strong> A pattern string like "INV-0000". Supports placeholders: YY or YYYY for year, MM for month, and a sequence of zeros (0000) for the auto-increment counter. Example: "INV-YYYY-0000" would produce "INV-2025-0001"</>,
          <><strong>Invoice starting number:</strong> The first number the auto-increment counter uses</>,
          <><strong>Invoice yearly reset:</strong> Toggle. When enabled, the auto-increment counter resets to the starting number at the beginning of each fiscal year</>,
          <><strong>Job number format:</strong> Same pattern system as invoices (e.g., "JOB-0000"). Job numbers are assigned when a deal is won and transitions to a trial</>,
          <><strong>Job starting number:</strong> First number for job auto-increment</>,
          <><strong>Job yearly reset:</strong> Same reset behavior as invoices</>,
        ]} />
        <ManualParagraph>
          <strong>Invoice Period:</strong>
        </ManualParagraph>
        <ManualList items={[
          <><strong>Billing frequency:</strong> Weekly, Monthly, or Per Trial. This determines how the billing period panel groups time entries and expenses when generating invoices</>,
          <><strong>Weekly:</strong> Choose a day of the week (Monday–Sunday). The billing period runs from the day after the previous billing day through the selected day</>,
          <><strong>Monthly:</strong> Choose a day of the month (1–31). The billing period runs from the day after the previous billing date through the selected date</>,
          <><strong>Per Trial:</strong> Enter number of days after trial end. The invoice is generated that many days after the trial's end date</>,
        ]} />
        <ManualParagraph>
          <strong>Email Settings:</strong>
        </ManualParagraph>
        <ManualList items={[
          <><strong>Sender email address:</strong> The "From" address used when sending invoices and documents via email. Must be a domain you've verified with your email provider</>,
        ]} />

        {/* ── Services & Categories Tab ── */}
        <ManualHeading color="#78716c">Services & Categories Tab</ManualHeading>
        <ManualParagraph>
          Manages your complete service catalog. The page has a header bar with three controls: an "Active" toggle (show/hide inactive items), an "Add Category" button, and an "Add Service" button.
        </ManualParagraph>
        <ManualParagraph>
          <strong>Categories:</strong>
        </ManualParagraph>
        <ManualList items={[
          "Categories are collapsible groups that organize your services (e.g., Trial Consulting, Graphics, Technology)",
          "Drag-and-drop to reorder categories using the grip handle",
          "Inline rename: click the edit icon, type the new name, press Enter or click the checkmark",
          "Delete a category: if it contains active services, you must deactivate or reassign them first. If it only has inactive services, the category is deactivated rather than permanently deleted to preserve historical references",
          "Default categories (created during onboarding) show a \"Default\" badge and cannot be deleted or renamed",
          "Services with no category appear in an \"Uncategorized\" section at the bottom",
        ]} />
        <ManualParagraph>
          <strong>Individual Services:</strong>
        </ManualParagraph>
        <ManualList items={[
          <><strong>Name and description:</strong> Service name is displayed across the app; description is optional supporting text</>,
          <><strong>Base rate and rate type:</strong> The starting price before tier/client multipliers are applied. Rate type options: Hourly, Daily, or Flat fee</>,
          <><strong>Daily minimum flag:</strong> When checked (and rate type is hourly), this service is subject to daily minimum billing during trial. The minimum is calculated as base rate × company daily minimum hours</>,
          <><strong>Service availability:</strong> Pre-Trial Only, In-Trial Only, or Both. Controls when the service appears in the timeline and affects how billing is split</>,
          <><strong>Default lead days and duration:</strong> For pre-trial services — how many days before trial start the service begins, and how long it lasts. These auto-populate when adding the service to a deal</>,
          <><strong>Display order:</strong> Drag-and-drop within a category to set the order services appear in lists and on documents</>,
          <><strong>Travel Time service (special):</strong> A built-in default service marked with a "Default" badge. Instead of a dollar rate, it shows a travel multiplier percentage (e.g., 50%). Travel time rates are calculated as: associated service rate × travel multiplier. This means travel time pricing automatically scales with the service it's associated with</>,
        ]} />
        <ManualParagraph>
          <strong>Deleting vs. deactivating:</strong> If a service has never been used in any deal or trial, it can be permanently deleted. If it has been used, the system deactivates it instead — the service is hidden from dropdowns and new assignments but preserved for historical billing records. Inactive services can be reactivated at any time.
        </ManualParagraph>
        <ManualParagraph>
          Below the service list is a <strong>Retainer Formula</strong> card. This configures the auto-calculated retainer value suggested in the deal wizard:
        </ManualParagraph>
        <ManualList items={[
          <><strong>Minimum retainer:</strong> The floor value — retainer will never be less than this amount</>,
          <><strong>Formula:</strong> "For every $[divisor] of estimated budget, add $[multiplier] to the retainer." Example: divisor = $15,000 and multiplier = $5,000 means a $45,000 budget produces a $15,000 retainer (45,000 ÷ 15,000 = 3, × $5,000 = $15,000)</>,
          <><strong>Test calculator:</strong> Enter a hypothetical budget amount to see the calculated retainer in real time — useful for verifying your formula produces reasonable numbers</>,
        ]} />

        {/* ── Pipeline Stages Tab ── */}
        <ManualHeading color="#78716c">Pipeline Stages Tab</ManualHeading>
        <ManualParagraph>
          Two separate sets of stages managed side by side:
        </ManualParagraph>
        <ManualList items={[
          <><strong>Sales stages:</strong> Used on the Deals page kanban board. Each stage has: name, color (for kanban column headers and badges), display order (drag to reorder), and an is_active toggle</>,
          <><strong>Operations stages:</strong> Used on the Trials page kanban board. Same fields as sales stages</>,
        ]} />
        <ManualParagraph>
          Sales stages have additional configuration not available on operations stages:
        </ManualParagraph>
        <ManualList items={[
          <><strong>Revenue probability weight:</strong> 0–100%. Used in the Revenue Projections tab to weight expected revenue. A deal in a 25% probability stage contributes 25% of its value to projections</>,
          <><strong>Auto-move on document sent:</strong> Select a document template category (e.g., Engagement Letter). When a document of that category is sent to the client, the deal automatically moves to this stage</>,
          <><strong>Auto-move on document signed:</strong> Select a document template category. When a document of that category is fully signed (all signatures collected), the deal auto-moves to this stage</>,
          <><strong>Auto-move on earliest service start:</strong> Toggle. When the earliest service/task start date on the deal is reached, auto-move to this stage</>,
          <><strong>Auto-move on trial start:</strong> Toggle. When the trial start date is reached, auto-move to this stage</>,
        ]} />

        {/* ── Tiers Tab ── */}
        <ManualHeading color="#78716c">Tiers Tab</ManualHeading>
        <ManualParagraph>
          Create, edit, reorder, and deactivate consultant tiers. Each tier has a name and a pricing multiplier. See the Consultant Tiers section above for full documentation on how multipliers affect rate calculations.
        </ManualParagraph>

        {/* ── Document Templates Tab ── */}
        <ManualHeading color="#78716c">Document Templates Tab</ManualHeading>
        <ManualParagraph>
          Manages all document templates organized by template category. Template categories include Engagement Letter, Proposal, Invoice, Statement, Email, and Custom.
        </ManualParagraph>
        <ManualList items={[
          <><strong>Template structure:</strong> Each template is built from ordered sections using a drag-and-drop section editor. Sections can be reordered, added, or removed</>,
          <><strong>Section types:</strong> Rich Text (WYSIWYG editor with placeholder insertion), Services Table (auto-generated from trial services with customizable columns), Table (manual data tables with full cell styling and formatting toolbar), Full-Page Background (uploaded image that fills an entire page — used for cover pages or letterhead)</>,
          <><strong>Placeholders:</strong> A reference panel shows all available merge fields (client name, trial dates, company address, etc.). Click any placeholder to insert it at the cursor position in a Rich Text section. Placeholders are replaced with actual data when the document is generated</>,
          <><strong>Signature fields:</strong> Configure one or more signature blocks for multi-party signing flows. Each signer has a name, role, and email. Documents can be sent for e-signature directly from the trial detail page</>,
          <><strong>Default templates:</strong> On the Billing tab, you select which templates are used as defaults for invoices, statements, and invoice emails. These defaults pre-populate when generating documents but can be overridden per document</>,
        ]} />

        {/* ── Theme & Branding Tab ── */}
        <ManualHeading color="#78716c">Theme & Branding Tab</ManualHeading>
        <ManualParagraph>
          Full visual customization of the app's appearance. Admin-only access. Changes affect the entire app for all users in your company immediately upon saving.
        </ManualParagraph>
        <ManualList items={[
          <><strong>Brand colors:</strong> Primary color (used across the app for buttons, highlights, active states), plus dedicated colors for Sales and Operations sections</>,
          <><strong>Font selections:</strong> Separate font pickers for brand title, brand subtitle, body text, and sidebar navigation. Supports built-in system fonts and custom Google Fonts — type a font name to add it to the company's font library</>,
          <><strong>Spacing and sizing:</strong> Page padding, section gap, card radius, button radius, input radius — all adjustable to create a tighter or more spacious layout</>,
          <><strong>Component styling:</strong> Card shadows, card header backgrounds, border widths, input backgrounds — fine-grained control over how individual UI elements appear</>,
          <><strong>Live preview:</strong> All changes are visible in real-time as you adjust settings. Save to apply or discard to revert</>,
        ]} />

        {/* ── HotSeatHub Tab ── */}
        <ManualHeading color="#78716c">HotSeatHub Tab (Owner/Admin)</ManualHeading>
        <ManualParagraph>
          Only visible when the HSH add-on is active. Contains marketplace configuration:
        </ManualParagraph>
        <ManualList items={[
          <><strong>Enable Help Wanted:</strong> Toggle switch. When on, your company can post subcontractor job requests to the marketplace. Activates the Help Wanted sidebar item</>,
          <><strong>Profit margin target (visible when Help Wanted is enabled):</strong> Margin type (Percentage or Dollar Amount) and margin value. Controls the suggested payout rate when posting job requests. Percentage mode retains a percentage of the billable rate as profit; Dollar mode retains a fixed dollar amount per unit</>,
          <><strong>Decline notifications (visible when Help Wanted is enabled):</strong> Per-user preference for how you're notified when subcontractors decline your public posts. Options: "Only when they provide a reason" (recommended), "All declines" (sends aggregated counts at a configurable threshold — e.g., every 10 declines), or "No decline notifications"</>,
          <><strong>Enable Potential Gigs:</strong> Toggle switch. When on, your consultants are available to respond to subcontractor requests from other companies. Activates the Potential Gigs sidebar item and lists your company in the HSH Directory</>,
        ]} />

        {/* ── Subscription Tab ── */}
        <ManualHeading color="#78716c">Subscription Tab (Owner Only)</ManualHeading>
        <ManualParagraph>
          Owner-only access to billing and plan management:
        </ManualParagraph>
        <ManualList items={[
          "Current plan display (Single User or Multi User) with seat count",
          "Stripe billing portal link for managing payment methods, viewing billing history, and downloading receipts",
          "Upgrade/downgrade options between plan tiers",
          "Seat quantity management for multi-user plans",
          "HSH add-on subscription management",
          "Links to Privacy Policy and Terms of Service (viewable in-app via modal)",
        ]} />

        {/* ── Database Tab ── */}
        <ManualHeading color="#78716c">Database Tab (Admin Only)</ManualHeading>
        <ManualParagraph>
          A direct entity browser for querying and troubleshooting records. Select any entity type from a dropdown, apply filters, and browse all fields. Primarily used for debugging and data verification — not for regular business operations. Useful when you need to inspect raw data that isn't exposed in the normal UI.
        </ManualParagraph>

        <ManualQuickTip color="#78716c">Changes to services, tiers, and pipeline stages affect new deals going forward. Existing deals and trials keep their rates and stage assignments as created — changes aren't retroactive. This is by design: you don't want a rate card update to silently change the pricing on a deal you already quoted to a client.</ManualQuickTip>
      </ManualSection>
    </ManualSubpageLayout>
  );
}
