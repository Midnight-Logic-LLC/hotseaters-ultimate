/**
 * ManualOperationsPage — visual and functional parity with
 * HotSeatersMVP/src/pages/ManualOperations.jsx (244 lines).
 *
 * Static documentation page — no hooks, no stores.
 * RULE F: lives under src/features/manual/pages/.
 */
import { Gavel, GanttChart, PenLine } from "lucide-react";
import { ManualSubpageLayout } from "@/features/manual/components/manual-subpage-layout";
import { ManualSection } from "@/features/manual/components/manual-section";
import { ManualHeading } from "@/features/manual/components/manual-heading";
import { ManualParagraph } from "@/features/manual/components/manual-paragraph";
import { ManualList } from "@/features/manual/components/manual-list";
import { ManualInfoGrid } from "@/features/manual/components/manual-info-grid";
import { ManualQuickTip } from "@/features/manual/components/manual-quick-tip";
import { ManualSteps } from "@/features/manual/components/manual-steps";
import { ManualStatusFlow } from "@/features/manual/components/manual-status-flow";

const COLOR = "#0891b2";

const TOC = [
  { id: "trials", title: "Trials Management" },
  { id: "schedule", title: "Schedule & Timeline" },
  { id: "documents", title: "Documents & E-Signatures" },
];

export function ManualOperationsPage() {
  return (
    <ManualSubpageLayout
      icon={Gavel}
      title="Operations"
      subtitle="Trial management, interactive timeline, consultant assignments, and document workflows"
      color={COLOR}
      sections={TOC}
    >
      {/* ══════════════════════════════════════════ */}
      {/*  TRIALS MANAGEMENT                        */}
      {/* ══════════════════════════════════════════ */}
      <ManualSection id="trials" icon={Gavel} title="Trials Management" color="#0891b2">
        <ManualHeading color="#0891b2">How Trials Are Created</ManualHeading>
        <ManualParagraph>
          Trials are never created from scratch — they are born when a deal is marked as "Won" in the sales pipeline. The system automatically: generates a job number (format and starting number configurable in Settings → Billing, e.g., "JOB-0042"), copies all services with their rates and billing methods, carries over all contacts (primary, secondary, FRP), preserves all documents and activity history, and places the trial in the first operations pipeline stage. The trial record retains a link to the original deal so you can always see the full sales-to-operations history.
        </ManualParagraph>

        <ManualHeading color="#0891b2">Trials Page — Views & Navigation</ManualHeading>
        <ManualParagraph>
          The Trials page uses the same three view modes as Deals: <strong>Kanban</strong> (operations stages as columns, drag to move), <strong>List</strong> (sortable table), and <strong>Cards</strong> (visual grid). You can filter by operations stage, client, consultant assignment, date range, and search across case name, client, and job number. Completed and continued trials are hidden by default — toggle "Show Completed" to see them.
        </ManualParagraph>

        <ManualHeading color="#0891b2">Trial Detail Panel — All Tabs</ManualHeading>
        <ManualParagraph>Click any trial to open the full detail panel. It contains these tabs:</ManualParagraph>
        <ManualInfoGrid color="#0891b2" cols={2} items={[
          ["Info Tab", "Case name, case style, case number, job number (auto-generated), courthouse, city/state, court, judge, case type (Civil, Criminal, Patent, etc.), side (plaintiff/defense), start and end dates, daily minimum hours override (if different from the company default), and the weekend billing toggle. All fields are editable inline by admins. Changing dates here triggers the same notification and calendar sync as timeline drag-and-drop"],
          ["Contacts Tab", "Primary contact (the main attorney), secondary contacts (other attorneys on the case — added via TrialContact junction records), and the Financially Responsible Party (FRP) if billing goes to a different firm. Each contact shows name, title, email, phone. The primary contact and FRP contact are used as default recipients when sending invoices and documents"],
          ["Services Tab", "Complete list of all services on this trial with: service name, custom description (overridable), rate, rate type (hourly/daily/flat), billing method (hourly, daily minimum, or split), estimated quantity, estimated total, start and end dates, arrival days (for services that begin before trial start), display order (drag to reorder), travel eligibility flag, and estimated travel hours. Each service can be individually edited. The services tab also shows assigned consultants per service"],
          ["Documents Tab", "Generate new documents from templates, view existing documents with their status (draft, sent, viewed, signed), send documents for e-signature, resend unsigned documents, and preview PDFs inline. Each document row shows creation date, template category, current status, and signer details"],
          ["Time Entries Tab", "All time logged against this trial, filterable by consultant and date range. Shows: date, consultant name, service, start/end times, duration, rate, amount, status (pending/approved/rejected/billed/paid), and description. Admins can edit entries directly from here"],
          ["Expenses Tab", "All expenses filed against this trial. Shows: date, consultant, category, vendor/paid to, amount, receipt thumbnail, billable/reimbursable flags, status. Click receipt thumbnail for full-size zoomable preview"],
          ["Invoices Tab", "All invoices generated for this trial — invoice number, date, total, status, and an inline PDF preview button. Clicking an invoice opens the full PDF viewer"],
          ["HSH Assignments Tab", "Any HotSeatHub subcontractor assignments active on this trial. Shows subcontractor company name, consultant name, service, agreed rate, dates, and assignment status. If you're the hiring company, you manage assignments here. If you're the subcontractor, you see your gig details"],
        ]} />

        <ManualHeading color="#0891b2">Assigning Consultants to Services</ManualHeading>
        <ManualParagraph>
          Consultant assignment is how you staff a trial. Each service can have one or more consultants assigned:
        </ManualParagraph>
        <ManualSteps color="#0891b2" steps={[
          "Click any service row in the trial detail or click a service bar on the timeline",
          "The assignment modal opens showing all eligible team members — filtered to only those whose \"qualified services\" list (set in their profile) includes this service type",
          "Select one or more consultants using checkboxes. The modal shows each person's current schedule so you can spot conflicts",
          "On save: TrialServiceAssignment records are created. For each assigned consultant who has Google Calendar connected, a calendar event is automatically created/updated with trial name, dates, service, and location. Notifications are sent to each newly assigned consultant",
        ]} />
        <ManualParagraph>
          <strong>Bulk Assign:</strong> Use the Bulk Assign feature to add one consultant to multiple services at once. This opens a modal where you select a consultant and check off all services they should be assigned to — saves significant time when staffing a new trial with the same team.
        </ManualParagraph>

        <ManualHeading color="#0891b2">Service Billing Methods — Deep Dive</ManualHeading>
        <ManualInfoGrid color="#0891b2" cols={3} items={[
          ["Hourly", "Bill for actual hours logged. The consultant clocks in and out, and you bill exactly what they work. Rate = service rate × client type multiplier × consultant tier multiplier (or client override). On the timeline, hourly services appear as lighter-colored bars. Best for: pre-trial preparation work, research, consultant hours where actual time varies significantly"],
          ["Daily Minimum", "Guarantee a minimum number of hours per day during the trial. If a consultant logs 4 hours but the daily minimum is 8 hours, you bill 8 hours. If they log 10 hours, you bill 10. The daily minimum is set per-trial (default from company settings, overridable). On the timeline, daily minimum services appear as darker bars. Best for: in-trial services where the consultant is committed full-day regardless of actual courtroom hours"],
          ["Split Billing", "Combines both methods on a single service: pre-trial work is billed hourly (actual hours only), and in-trial work switches to daily minimum billing. The trial start date is the automatic cutoff. On the timeline, split services appear as two-tone bars — lighter for the hourly pre-trial phase, darker for the daily minimum in-trial phase. Best for: services like Trial Consulting that have a variable-hours prep phase followed by a full-commitment trial phase"],
        ]} />

        <ManualHeading color="#0891b2">Trial Completion</ManualHeading>
        <ManualParagraph>
          When a trial concludes, mark it as completed using one of these completion types:
        </ManualParagraph>
        <ManualInfoGrid color="#0891b2" cols={3} items={[
          ["Verdict For", "Trial concluded in our client's favor. Sets completion date, archives from active pipeline. All time/expense/invoice data preserved for final billing"],
          ["Verdict Against", "Trial concluded against our client. Same archival behavior. Completion type tracked separately for win/loss analytics"],
          ["Verdict Pending", "Trial is complete but no final verdict has been rendered yet (e.g., jury deliberation, awaiting judge's ruling). Removes the case from the active timeline and pipeline just like a verdict, but without committing to a for/against outcome. Update to Verdict For or Verdict Against later when the ruling comes in"],
          ["Settled", "Case settled before or during trial. All services closed out, billing finalized. Common outcome — many cases settle mid-trial"],
          ["Continued", "Trial postponed to a future date. This is special — see below for the full continuation workflow"],
        ]} />

        <ManualHeading color="#0891b2">Trial Continuation (Postponement)</ManualHeading>
        <ManualParagraph>
          Trial continuations are common in legal work and require careful date management. When you mark a trial as "Continued," you choose one of three date precision levels:
        </ManualParagraph>
        <ManualList items={[
          <><strong>Definite:</strong> Exact new start and end dates are known. All services shift by the same offset (new start minus old start). Each assigned consultant is notified of the date change. Google Calendar events update automatically. HSH subcontractor companies are notified. The trial reappears on the active timeline at its new position</>,
          <><strong>Month Only:</strong> Only the new month is known (e.g., "continued to September"). The trial is placed on the first business day of that month as a placeholder. Services shift accordingly. You can update to exact dates later when they're confirmed</>,
          <><strong>None:</strong> No new dates at all — the trial stays on your timeline at its original position but is visually flagged as "continued." This preserves your planning while acknowledging the uncertainty. Update when the court reschedules</>,
        ]} />
        <ManualQuickTip color="#0891b2">
          Use <strong>Bulk Assign</strong> to add one consultant to multiple services at once — useful when onboarding a team member to all services on a trial.
        </ManualQuickTip>
      </ManualSection>

      {/* ══════════════════════════════════════════ */}
      {/*  SCHEDULE & TIMELINE                      */}
      {/* ══════════════════════════════════════════ */}
      <ManualSection id="schedule" icon={GanttChart} title="Schedule & Timeline" color="#ea580c">
        <ManualHeading color="#ea580c">What is the Timeline?</ManualHeading>
        <ManualParagraph>
          The Schedule page displays all trials and their services on an interactive, horizontal Gantt-style timeline. This is the operations nerve center — it's where you see what's happening when, who's assigned where, spot scheduling conflicts, and manage dates through drag-and-drop. It's designed to handle dozens of concurrent trials with potentially hundreds of service bars.
        </ManualParagraph>

        <ManualHeading color="#ea580c">Grouping Modes</ManualHeading>
        <ManualInfoGrid color="#ea580c" cols={2} items={[
          ["Group by Trial", "Each trial is a collapsible section. The trial header bar spans the trial's full date range. Below it, individual service bars show each service's specific dates. Great for seeing all work on a case at a glance. Trial headers show case name, job number, client, and dates. Click a trial header to open a summary sheet with quick actions (view detail, add service, post to HSH)"],
          ["Group by Consultant", "Each team member is a section showing all their assignments across all trials — plus time-off blocks. Each consultant row shows their name, photo, and tier. Below, you see every service they're assigned to across all trials, stacked as bars. Essential for preventing double-booking (overlapping bars = conflict) and understanding capacity utilization"],
        ]} />

        <ManualHeading color="#ea580c">Time Scales & Navigation</ManualHeading>
        <ManualList items={[
          <><strong>Zoom slider:</strong> Smoothly zoom between day-level detail and year-level overview. Preset buttons jump directly to Day, Week, Month, Quarter, or Year views</>,
          <><strong>Navigation arrows:</strong> Move forward and backward by the selected time unit. Hold to rapid-scroll through dates</>,
          <><strong>"Today" button:</strong> Jumps back to the current date and centers the viewport. A red vertical line marks today's position on the timeline at all zoom levels</>,
          <><strong>Visual cues:</strong> Past trials appear with reduced opacity. Unassigned services show as dashed-outline bars. Currently active trials (today falls between start and end) are fully opaque and may have a subtle highlight</>,
          <><strong>Mobile:</strong> On mobile/tablet, the timeline switches to a list view showing upcoming services as cards. A landscape prompt appears suggesting rotation for the best experience. Full timeline interaction is available in landscape mode</>,
        ]} />

        <ManualHeading color="#ea580c">Drag & Drop</ManualHeading>
        <ManualParagraph>
          The timeline is fully interactive through drag-and-drop. Every drag action triggers a cascade of updates:
        </ManualParagraph>
        <ManualList items={[
          <><strong>Drag a trial header bar:</strong> Moves the entire trial — the trial start/end dates shift, and ALL services shift by the same number of days. Every assigned consultant is notified. Google Calendar events update for all connected consultants. HSH subcontractor companies receive date change notifications. A progress modal shows the update as it processes</>,
          <><strong>Drag an individual service bar:</strong> Moves just that one service independently. Same notification and sync behavior, but only for consultants assigned to that specific service. The trial's overall dates are NOT affected — only the service dates change</>,
          <><strong>Resize a bar edge:</strong> Drag the left edge to change the start date, or the right edge to change the end date. The service bar stretches or shrinks. Same notification cascade for the adjusted dates</>,
          <><strong>Click a service bar:</strong> Opens the assignment modal to view currently assigned consultants, add new ones, or remove assignments</>,
          <><strong>Click a trial header:</strong> Opens a trial summary sheet with key details, quick links to the trial detail page, and action buttons</>,
        ]} />

        <ManualHeading color="#ea580c">Color Coding</ManualHeading>
        <div className="space-y-3 my-5">
          {[
            ["#0891b2", "Cyan", "Internal services — assigned to your own team members"],
            ["#9333ea", "Purple", "HSH services — filled by HotSeatHub subcontractors from another company"],
            ["#a1a1aa", "Gray / dashed", "Unassigned services — no consultant yet. These are your staffing gaps"],
            ["#f59e0b", "Amber blocks", "Time-off periods (visible in consultant grouping view). Shows PTO, vacation, sick days"],
          ].map(([c, n, d]: string[]) => (
            <div key={n} className="flex items-center gap-3">
              <div className="w-12 h-4 rounded" style={{ background: c, opacity: (n ?? "").includes("dashed") ? 0.5 : 1 }} />
              <span className="text-[13px]" style={{ color: '#57534e' }}><strong>{n}:</strong> {d}</span>
            </div>
          ))}
          <div className="flex items-center gap-3">
            <div className="w-12 h-4 rounded flex overflow-hidden">
              <div className="w-1/2 bg-sky-300" /><div className="w-1/2 bg-sky-600" />
            </div>
            <span className="text-[13px]" style={{ color: '#57534e' }}><strong>Split billing:</strong> Light left half = hourly pre-trial, dark right half = daily minimum in-trial</span>
          </div>
        </div>

        <ManualHeading color="#ea580c">Revenue Chart Overlay</ManualHeading>
        <ManualParagraph>
          Toggle the revenue chart to overlay projected daily revenue bars above the timeline grid. Each bar represents the sum of projected daily revenue for all active services in that time period. Revenue is calculated from service rates and billing methods — daily minimum services contribute their full daily rate, hourly services contribute their estimated hours × rate, and split services contribute the appropriate rate for each phase. This overlay is invaluable for capacity planning — you can visually spot revenue gaps between trials and identify where adding another trial would maximize utilization.
        </ManualParagraph>

        <ManualHeading color="#ea580c">Filters</ManualHeading>
        <ManualParagraph>
          The filter bar lets you narrow the timeline to exactly what you need to see:
        </ManualParagraph>
        <ManualList items={[
          "Filter by operations pipeline stage (e.g., only show 'Confirmed' and 'In Progress' trials)",
          "Filter by specific client (see all trials for one law firm)",
          "Filter by specific trial (isolate one case)",
          "Filter by consultant (see one person's full workload)",
          "Filter by service type (e.g., only show 'Trial Consulting' services across all trials)",
          "Toggle: show/hide completed and continued trials",
          "On mobile, filters open in a bottom sheet for touch-friendly interaction",
        ]} />

        <ManualQuickTip color="#ea580c">
          Use the consultant grouping view weekly to check for scheduling conflicts or gaps. If a consultant has overlapping trial bars, they may be double-booked. Time-off blocks in amber show when someone is unavailable.
        </ManualQuickTip>
      </ManualSection>

      {/* ══════════════════════════════════════════ */}
      {/*  DOCUMENTS & E-SIGNATURES                 */}
      {/* ══════════════════════════════════════════ */}
      <ManualSection id="documents" icon={PenLine} title="Documents & E-Signatures" color="#db2777">
        <ManualHeading color="#db2777">Document Templates</ManualHeading>
        <ManualParagraph>
          Templates are the foundation of document generation. They're configured in Settings → Templates and organized by category (Engagement Letter, Proposal, Invoice, Statement, Custom). Each template is built from ordered sections:
        </ManualParagraph>
        <ManualInfoGrid color="#db2777" cols={2} items={[
          ["Rich Text Sections", "Full WYSIWYG editor with formatting: bold, italic, underline, fonts (including custom Google Fonts you've added in theme settings), font sizes, colors, alignment, bullet and numbered lists. Insert placeholders that auto-fill from deal/trial data: {{CASE_NAME}}, {{CLIENT_NAME}}, {{TRIAL_START_DATE}}, {{COMPANY_NAME}}, {{PRIMARY_CONTACT}}, {{BILL_TO_CLIENT_NAME}}, and many more. Placeholders appear as highlighted tokens in the editor"],
          ["Services Table Sections", "Auto-generated table listing all trial services with columns for: service name, description, rate, quantity, billing method, estimated total. The table formatting (borders, colors, fonts, column widths, alternating row colors) is fully customizable through a visual table editor. Includes header rows, repeating data rows, subtotal/total summary rows, and separator rows"],
          ["Full-Page Backgrounds", "Upload a full-page image (company letterhead, branded cover page, background watermark) that renders behind the text content of that page in the generated PDF. Great for branded first pages with your logo and address block already embedded in the background image"],
          ["Signature Fields", "Add signature lines for different roles — Client Signer, FRP Signer, Company Representative. Each signer gets their own unique, secure signing link. Signature fields define where the drawn signature and timestamp will be placed in the final PDF"],
        ]} />

        <ManualHeading color="#db2777">Generating a Document</ManualHeading>
        <ManualSteps color="#db2777" steps={[
          "Open a deal or trial → go to the Documents tab → click \"New Document\"",
          "Select a template category (e.g., Engagement Letter) and then a specific template from that category",
          "The system generates the document instantly — all placeholders are replaced with actual deal/trial data, the services table is populated with the trial's current services and rates, and signature fields are inserted at configured positions",
          "Preview the rendered PDF directly in the browser — scroll through pages, zoom in/out",
          "If anything needs adjustment, edit the content (the generated document is a copy, not linked to the template — changes here don't affect the template and vice versa)",
          "Save → document is stored as a draft, ready to send for signature or email",
        ]} />

        <ManualHeading color="#db2777">E-Signature Workflow</ManualHeading>
        <ManualParagraph>
          HotSeaters has a complete built-in e-signature system — no external service needed. Here's the full flow:
        </ManualParagraph>
        <ManualSteps color="#db2777" steps={[
          "From a saved document, click \"Send for Signature\" to open the signing configuration dialog",
          "Add signers — select from deal/trial contacts (primary contact, FRP contact), company team members (sales lead), or enter custom email addresses. Each signer is assigned a role label (e.g., \"Client\", \"FRP Representative\", \"Sales Consultant\")",
          "System emails each signer a unique, cryptographically secure signing link. No login or account is required — the signer simply clicks the link",
          "The signer opens the link in their browser → reviews the full document with zoom and scroll → arrives at the signature page → draws their signature on a canvas (works on desktop with mouse or mobile with finger/stylus) → submits",
          "The drawn signature image is automatically embedded into the PDF at the designated signature field location, along with a timestamp and the signer's name/email for audit trail",
          "When ALL required signatures have been collected → document status changes to \"Signed\" → the final PDF is locked (no further edits possible) → pipeline auto-advance fires if configured (e.g., \"auto-move deal to Engaged when Engagement Letter is signed\")",
        ]} />

        <ManualHeading color="#db2777">Document Sending (Without Signatures)</ManualHeading>
        <ManualParagraph>
          Not every document needs signatures. You can also email documents directly as PDF attachments without the e-signature flow. This is useful for sending proposals, information packets, or case summaries. The send dialog lets you configure To/CC/BCC recipients, customize the email subject and body, and attach the PDF. Document views and email opens are tracked — you can see on the document detail page how many times the recipient viewed the document.
        </ManualParagraph>

        <ManualHeading color="#db2777">Document Status Tracking</ManualHeading>
        <ManualStatusFlow statuses={[
          { label: "Draft", bg: "#f5f5f4", text: "#44403c" },
          { label: "Sent", bg: "#dbeafe", text: "#1e40af" },
          { label: "Viewed", bg: "#fef3c7", text: "#92400e" },
          { label: "Signed", bg: "#dcfce7", text: "#166534" },
        ]} />
        <ManualParagraph>
          The system tracks when each document is sent, when each signer views it (with view count), and when each signature is submitted (with exact timestamp). You can see a per-signer breakdown: "John Smith — viewed 3 times, signed on April 15 at 2:34 PM." Documents that have been sent but not signed can be resent — the signer receives a fresh email with the same secure link.
        </ManualParagraph>

        <ManualQuickTip color="#db2777">
          Pipeline auto-move works with document <em>categories</em>, not individual templates. If you configure "auto-move on Engagement Letter signed," any template in the Engagement Letter category triggers the move. This means you can have multiple engagement letter templates (different styles for different case types) and they all trigger the same automation.
        </ManualQuickTip>
      </ManualSection>
    </ManualSubpageLayout>
  );
}
