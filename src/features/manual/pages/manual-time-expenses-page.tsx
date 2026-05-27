/**
 * ManualTimeExpensesPage — visual and functional parity with
 * HotSeatersMVP/src/pages/ManualTimeExpenses.jsx (204 lines).
 *
 * Static documentation page — no hooks, no stores.
 * RULE F: lives under src/features/manual/pages/.
 */

import { Clock, Receipt } from "lucide-react";
import { ManualSubpageLayout } from "@/features/manual/components/manual-subpage-layout";
import { ManualSection } from "@/features/manual/components/manual-section";
import { ManualHeading } from "@/features/manual/components/manual-heading";
import { ManualParagraph } from "@/features/manual/components/manual-paragraph";
import { ManualList } from "@/features/manual/components/manual-list";
import { ManualInfoGrid } from "@/features/manual/components/manual-info-grid";
import { ManualQuickTip } from "@/features/manual/components/manual-quick-tip";
import { ManualSteps } from "@/features/manual/components/manual-steps";
import { ManualStatusFlow } from "@/features/manual/components/manual-status-flow";

const TOC = [
  { id: "time", title: "Time Tracking" },
  { id: "expenses", title: "Expense Tracking" },
];

export function ManualTimeExpensesPage() {
  return (
    <ManualSubpageLayout
      icon={Clock}
      title="Time & Expenses"
      subtitle="Time clock, manual entries, receipt scanning, mileage tracking, and expense reports"
      color="#e11d48"
      sections={TOC}
    >
      {/* ══════════════════════════════════════════ */}
      {/*  TIME TRACKING                            */}
      {/* ══════════════════════════════════════════ */}
      <ManualSection id="time" icon={Clock} title="Time Tracking" color="#e11d48">
        <ManualHeading color="#e11d48">Page Layout & Tabs</ManualHeading>
        <ManualParagraph>
          The Time & Expenses page is organized into five tabs: <strong>Time Clock</strong> (live timer), <strong>Table</strong> (spreadsheet view of all entries), <strong>Expenses</strong> (expense list with receipt management), <strong>Expense Reports</strong> (generated period reports), and <strong>Time Off</strong> (PTO/vacation/sick day tracking). Each tab remembers your filter and sort preferences within the session.
        </ManualParagraph>

        <ManualHeading color="#e11d48">Time Clock — Live Timer</ManualHeading>
        <ManualParagraph>
          The Time Clock is the primary way consultants log their time during active work. It creates a persistent timer that survives page navigation:
        </ManualParagraph>
        <ManualSteps color="#e11d48" steps={[
          <><strong>Select a trial:</strong> Dropdown shows only trials you're assigned to (admins see all active trials). Trials appear with their job number and case name. If "Hide deals from time clock" is enabled in Settings, only won trials (not active deals still in the sales pipeline) appear — this keeps the dropdown clean for consultants</>,
          <><strong>Select a service:</strong> Dropdown shows only services you're assigned to on that specific trial. This prevents consultants from accidentally logging time to services they're not working on</>,
          <><strong>Add a description:</strong> Optional but recommended — describe the work being performed. This text appears on the time entry record and can be included on invoices. Good descriptions help admins during approval and make invoices more professional</>,
          <><strong>Click "Clock In":</strong> The timer starts. A persistent timer badge appears in the app's top header bar showing elapsed time, trial name, and service. This badge is visible on every page in the app — you never lose track of a running timer</>,
          <><strong>Work (navigate freely):</strong> The timer continues running regardless of which page you visit. You can browse the schedule, check expenses, review other trials — the timer keeps going in the background</>,
          <><strong>Click "Clock Out":</strong> The timer stops. Clock-in and clock-out times are auto-rounded per your company's rounding settings (see below). The entry is saved with status "pending" and appears in your time entry list awaiting admin approval</>,
        ]} />

        <ManualHeading color="#e11d48">Time Rounding</ManualHeading>
        <ManualParagraph>
          Your company configures time rounding in Settings → Time Tracking. There are three independent settings that work together:
        </ManualParagraph>
        <ManualList items={[
          <><strong>Rounding interval:</strong> The granularity of rounding, in minutes. Common values: 6 minutes (0.1 hour increments), 15 minutes (0.25 hour increments), 30 minutes, or 60 minutes. Example: 15-minute rounding means times snap to :00, :15, :30, or :45</>,
          <><strong>Clock-in rounding direction:</strong> "Down" rounds clock-in time to the earlier interval (favorable to company — you don't pay for the minutes before the interval). "Up" rounds to the next interval (favorable to consultant). "Nearest" rounds to whichever interval is closest</>,
          <><strong>Clock-out rounding direction:</strong> Same options but applied to clock-out time. Typically companies use "down" for clock-in and "up" for clock-out, or "nearest" for both</>,
        ]} />
        <ManualParagraph>
          <strong>Example:</strong> With 15-minute rounding, clock-in "down" / clock-out "up": clocking in at 9:07 AM becomes 9:00 AM, clocking out at 5:22 PM becomes 5:30 PM. Duration = 8.5 hours. The rounding is applied automatically when clock-out is pressed — the consultant sees the adjusted times in their entry.
        </ManualParagraph>

        <ManualHeading color="#e11d48">Manual Time Entry (Table Tab)</ManualHeading>
        <ManualParagraph>
          The Table tab shows all time entries in a spreadsheet-style view. It's useful for reviewing historical entries, making bulk edits, or entering time after the fact (when you forgot to use the clock):
        </ManualParagraph>
        <ManualSteps color="#e11d48" steps={[
          "Switch to the Table tab to see entries in a sortable, filterable spreadsheet format",
          "Click \"+ Add Time Entry\" to create a new row, or click the \"+ New\" button on a specific date row",
          "Fill in: trial (dropdown), service (filtered by trial), date, start time, end time (or just enter duration directly), timezone, and description",
          "Rate is auto-calculated based on the service rate and consultant tier. Amount = rate × duration. Both are editable for overrides",
          "Save — entry appears as \"pending\" in the approval queue",
        ]} />
        <ManualParagraph>
          <strong>Editing rules:</strong> Pending entries are editable by the consultant who created them and by admins. Once an entry is approved, only admins can edit it. Once billed (placed on an invoice), entries are locked — no edits allowed. This ensures invoice integrity.
        </ManualParagraph>

        <ManualHeading color="#e11d48">Timezone Handling</ManualHeading>
        <ManualParagraph>
          Each time entry records the timezone it was created in (e.g., "America/Chicago"). This matters for trial consulting because consultants travel — you might clock in on Central Time in Dallas and clock out on Eastern Time if you drove to a courthouse in Alabama. The system stores both timezones and calculates duration correctly across zone boundaries. The timezone picker in the manual entry form lets you explicitly set the zone for historical entries.
        </ManualParagraph>

        <ManualHeading color="#e11d48">Travel Time</ManualHeading>
        <ManualParagraph>
          Travel time is a special service type that bills at a reduced rate based on the service the consultant is traveling for:
        </ManualParagraph>
        <ManualList items={[
          <><strong>How it works:</strong> Select "Travel Time" as the service in the time clock or manual entry form. A second dropdown appears asking which service this travel is associated with (e.g., "Trial Consulting")</>,
          <><strong>Rate calculation:</strong> Travel Time rate = Associated Service Rate × Travel Multiplier. For example, if Trial Consulting is $260/hr and the Travel Time service has a multiplier of 0.5×, travel time bills at $130/hr</>,
          <><strong>Configuration:</strong> The Travel Time service and its multiplier are set up in Settings → Services. The travel multiplier is a property specific to the Travel Time service</>,
          <><strong>Eligibility:</strong> Only services marked as "travel eligible" (a flag on the TrialService record) appear in the association dropdown. This prevents consultants from associating travel time with services that don't qualify</>,
          <><strong>On invoices:</strong> Travel time entries appear as separate line items with their own rate, clearly labeled as travel time for the client</>,
        ]} />

        <ManualHeading color="#e11d48">Time Entry Statuses</ManualHeading>
        <ManualStatusFlow statuses={[
          { label: "In Progress", bg: "#e0f2fe", text: "#0369a1" },
          { label: "Pending", bg: "#fef3c7", text: "#92400e" },
          { label: "Approved", bg: "#dcfce7", text: "#166534" },
          { label: "Rejected", bg: "#fecaca", text: "#991b1b" },
          { label: "Billed", bg: "#dbeafe", text: "#1e40af" },
          { label: "Paid", bg: "#d1fae5", text: "#065f46" },
        ]} />
        <ManualParagraph>
          <strong>In Progress</strong> = timer actively running. <strong>Pending</strong> = submitted, awaiting admin review. <strong>Approved</strong> = admin verified, eligible for invoicing. <strong>Rejected</strong> = admin flagged an issue (with a reason) — consultant can edit and resubmit. <strong>Billed</strong> = included on an invoice, locked from editing. <strong>Paid</strong> = the invoice containing this entry has been marked as paid.
        </ManualParagraph>

        <ManualHeading color="#e11d48">HSH Linked Time Entries</ManualHeading>
        <ManualParagraph>
          When a HotSeatHub subcontractor's consultant logs time in their own company's system, a linked entry is automatically created in the hiring company's system at the agreed HSH rate (not the subcontractor's internal rate). These entries appear in the hiring company's time list with an "HSH" badge and entry_type = "hiring_company." They flow through the same approval and invoicing pipeline as regular entries. The subcontractor also sees corresponding entries in their system with entry_type = "subcontractor."
        </ManualParagraph>

        <ManualHeading color="#e11d48">Time Off</ManualHeading>
        <ManualParagraph>
          The Time Off tab lets team members request and track absences:
        </ManualParagraph>
        <ManualList items={[
          <><strong>Request types:</strong> PTO, Vacation, Sick Day, Personal Day, Jury Duty, Bereavement, Other — each with a distinct color on the timeline</>,
          <><strong>Submission:</strong> Consultant fills in dates, type, and optional notes → submits → appears as "pending" for admin approval</>,
          <><strong>Admin approval:</strong> Admins can approve or deny time-off requests. Approved requests show as colored blocks on the Schedule timeline in consultant view</>,
          <><strong>Conflict prevention:</strong> When approved time-off appears on the timeline, it's a visual cue that the consultant is unavailable. While the system doesn't hard-block service assignments during time-off (sometimes it's necessary), the visual overlap makes it obvious when you're considering assigning someone who's out</>,
        ]} />
        <ManualQuickTip color="#e11d48">If "Hide deals from time clock" is enabled in Settings, only trials that have been won (moved to operations pipeline) appear in the time clock dropdown — keeps the list clean and prevents consultants from logging time against deals that haven't been confirmed yet.</ManualQuickTip>
      </ManualSection>

      {/* ══════════════════════════════════════════ */}
      {/*  EXPENSE TRACKING                         */}
      {/* ══════════════════════════════════════════ */}
      <ManualSection id="expenses" icon={Receipt} title="Expense Tracking" color="#0d9488">
        <ManualHeading color="#0d9488">Receipt-Based Expenses</ManualHeading>
        <ManualParagraph>
          The primary way to log expenses is by uploading a receipt. The system uses AI-powered receipt scanning (Veryfi) to extract data automatically:
        </ManualParagraph>
        <ManualSteps color="#0d9488" steps={[
          "Click \"Add Expense\" → the expense form opens in Receipt mode by default",
          "Upload a receipt photo (JPG, PNG) or scanned PDF. The image is automatically oriented and enhanced for readability",
          "AI processing begins immediately — the system extracts: vendor/merchant name, total amount, date, expense category, and individual line items if visible on the receipt. Processing takes 2-5 seconds",
          "Review the extracted data — all fields are pre-filled but editable. Correct any misreadings. The original receipt image remains attached for reference",
          "Assign to a trial (optional but recommended for billable expenses). Select the specific trial from a dropdown",
          "Set flags: Billable (can be billed to the client on an invoice) and Reimbursable (should be reimbursed to the consultant who paid out-of-pocket). Both default to 'yes'",
          "Add optional notes for context (e.g., 'dinner with client team after first day of jury selection')",
          "Save → expense appears as \"pending\" in the approval queue",
        ]} />

        <ManualHeading color="#0d9488">Mileage Expenses</ManualHeading>
        <ManualParagraph>
          For travel by personal vehicle, switch from Receipt to Mileage mode in the expense form:
        </ManualParagraph>
        <ManualSteps color="#0d9488" steps={[
          "Toggle the expense type from \"Receipt\" to \"Mileage\"",
          "Enter start address — the field uses Google Places autocomplete for accurate addresses",
          "Enter end address — same autocomplete",
          "Click \"Calculate Route\" — the system calls the Google Maps Directions API to calculate the driving distance and optionally displays a route preview map",
          "Confirm the mileage calculation. Amount is calculated automatically: miles × IRS standard mileage rate (currently $0.70/mi, but the rate is stored on the record so historical entries use the rate from when they were created)",
          "Category is auto-set to \"Travel.\" Assign to a trial, set flags, add notes → save",
        ]} />

        <ManualHeading color="#0d9488">Expense Categories</ManualHeading>
        <ManualInfoGrid cols={4} items={[
          ["Travel", "Flights, car rentals, rideshares, Uber/Lyft, gas, tolls, public transit"],
          ["Meals", "Business meals, per diem purchases, team dinners, coffee meetings"],
          ["Lodging", "Hotels, Airbnb, extended-stay rentals near courthouses"],
          ["Materials", "Printing, binders, exhibit boards, supplies for trial prep"],
          ["Equipment", "Rental technology, projectors, monitors, temporary hardware"],
          ["Software", "Trial presentation software, temporary subscriptions, licenses"],
          ["Parking", "Courthouse parking, hotel parking, airport parking"],
          ["Other", "Anything that doesn't fit the above categories — describe in notes"],
        ]} />

        <ManualHeading color="#0d9488">Billable vs. Reimbursable</ManualHeading>
        <ManualParagraph>
          These two flags are independent and serve different purposes:
        </ManualParagraph>
        <ManualList items={[
          <><strong>Billable = Yes:</strong> This expense can be added as a line item on a client invoice. The client pays for it. Most trial-related expenses are billable — the law firm expects to pay for your travel, lodging, and materials</>,
          <><strong>Billable = No:</strong> Company-internal costs that should NOT appear on client invoices. Example: team dinner for morale, or office supplies used in your own office</>,
          <><strong>Reimbursable = Yes:</strong> The consultant who submitted this expense paid out of their own pocket and needs to be reimbursed by the company. Most expenses are reimbursable</>,
          <><strong>Reimbursable = No:</strong> The expense was paid with a company credit card or company funds — the consultant doesn't need personal reimbursement. The expense is still tracked for billing and reporting purposes</>,
        ]} />
        <ManualParagraph>
          <strong>Common combinations:</strong> Billable + Reimbursable (most cases — consultant pays, company reimburses, client gets billed). Billable + Not Reimbursable (company card — client gets billed, no personal reimbursement needed). Not Billable + Reimbursable (personal expense tangentially work-related that the company covers but doesn't pass to the client). Not Billable + Not Reimbursable (pure company cost for internal tracking only).
        </ManualParagraph>

        <ManualHeading color="#0d9488">Expense Reports</ManualHeading>
        <ManualParagraph>
          The Expense Reports tab includes a <strong>"Close Period & Generate Reports"</strong> panel (visible to Owners and Admins). When a billing period is closed, the system automatically generates Expense Reports. These bundle all approved expenses for a given trial within the period into a single PDF report, including receipt images as attachments. Key behaviors:
        </ManualParagraph>
        <ManualList items={[
          "Expense reports are generated per-trial per-period. Each report includes all approved billable expenses for that trial within the billing period dates",
          "The generated PDF includes a summary table (date, category, vendor, amount) and individual receipt images on subsequent pages",
          "Once an expense is swept into a report, it becomes locked — the expense_report_id field is set, and the expense can no longer be edited or deleted. This preserves audit integrity",
          "Expense reports can be attached when sending invoices — toggle \"Include Receipts\" on the invoice to merge the expense report PDF as an appendix to the invoice PDF",
          "The Expense Reports tab on the Time & Expenses page shows all generated reports with trial name, period dates, total amount, and a link to download/preview the PDF",
        ]} />

        <ManualHeading color="#0d9488">HSH Linked Expenses</ManualHeading>
        <ManualParagraph>
          Just like time entries, expenses from HSH subcontractor consultants create linked records in both companies' systems. When the subcontractor's consultant submits an expense, a corresponding entry appears in the hiring company's expense list at the pass-through amount. These flow through the same approval pipeline and can be included on client invoices.
        </ManualParagraph>

        <ManualQuickTip color="#0d9488">For best AI receipt extraction, upload photos with good lighting and minimal glare. Straighten the receipt before photographing. The system auto-rotates and enhances, but clearer originals produce more accurate vendor names and amounts. PDFs of digital receipts (email confirmations, online purchases) work excellently.</ManualQuickTip>
      </ManualSection>

    </ManualSubpageLayout>
  );
}
