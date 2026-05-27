/**
 * ManualBillingPage — visual and functional parity with
 * HotSeatersMVP/src/pages/ManualBilling.jsx (253 lines).
 *
 * Static documentation page — no hooks, no stores.
 * RULE F: lives under src/features/manual/pages/.
 */

import { DollarSign, HandCoins, ScrollText, CheckCircle } from "lucide-react";
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
  { id: "approvals", title: "Approvals" },
  { id: "invoicing", title: "Invoicing" },
  { id: "collections", title: "Collections" },
  { id: "bills", title: "Bills (Vendor Payables)" },
];

export function ManualBillingPage() {
  return (
    <ManualSubpageLayout
      icon={DollarSign}
      title="Billing"
      subtitle="Approvals, invoice creation, PDF generation, email delivery, collections, and vendor bills"
      color="#6366f1"
      sections={TOC}
    >
      {/* ══════════════════════════════════════════ */}
      {/*  APPROVALS                                */}
      {/* ══════════════════════════════════════════ */}
      <ManualSection id="approvals" icon={CheckCircle} title="Approvals" color="#6366f1">
        <ManualHeading color="#6366f1">Approvals Page Layout</ManualHeading>
        <ManualParagraph>
          The Approvals page has two primary columns: <strong>Approve Time</strong> (left) and <strong>Approve Expenses</strong> (right). If your company hires subcontractors through HotSeatHub, a third column — <strong>Approve HSH Invoices</strong> — appears on the far left, but only when there are HSH invoices pending review (i.e., a subcontractor company has submitted an invoice for their consultant's work on your trial). When no HSH invoices exist, the page shows just the two-column time/expense layout. Each column header shows the count of pending items and the total dollar amount awaiting review. On mobile, these collapse into expandable sections.
        </ManualParagraph>

        <ManualHeading color="#6366f1">Approving Time Entries</ManualHeading>
        <ManualParagraph>
          Time entries are grouped by consultant, then by trial within each consultant. Expand a consultant to see their pending entries:
        </ManualParagraph>
        <ManualList items={[
          "Each entry shows: date, service name, start/end times, duration, rate, calculated amount, and description",
          <><strong>Approve (✓):</strong> Click the checkmark → status changes to "approved" and the entry becomes eligible for invoicing</>,
          <><strong>Reject (✗):</strong> Click the X → a dialog prompts you for a rejection reason → the consultant receives a notification with your reason and can edit and resubmit the entry</>,
          <><strong>Bulk Approve:</strong> Select multiple entries using checkboxes → click "Approve Selected" to approve an entire week of entries for a consultant at once. This is the most common workflow — review, then batch-approve</>,
          <><strong>Edit before approving:</strong> Click any entry to expand it into an edit form. You can adjust start/end times, duration, rate, or description before approving. Useful when a consultant forgot to add a description or made a minor time error</>,
          <><strong>Summary cards:</strong> Above the list, summary cards show total hours and amounts by consultant and trial for quick at-a-glance review</>,
        ]} />

        <ManualHeading color="#6366f1">Approving Expenses</ManualHeading>
        <ManualParagraph>
          Expenses follow the same grouping pattern — by consultant, then by trial:
        </ManualParagraph>
        <ManualList items={[
          "Each expense shows: date, category badge, vendor/paid to, amount, and a receipt thumbnail",
          <><strong>Receipt preview:</strong> Click the receipt thumbnail to open a full-size, zoomable image viewer. Inspect the receipt before approving — verify the amount matches, the vendor is legitimate, and the expense is appropriately categorized</>,
          <><strong>Approve / Reject:</strong> Same workflow as time entries. Reject with a reason to send the consultant back to correct the submission (wrong category, missing receipt, duplicate entry, etc.)</>,
          <><strong>Flags visible:</strong> Billable and reimbursable flags are shown on each expense card so you can verify they're set correctly before approving</>,
        ]} />

        <ManualHeading color="#6366f1">HSH Invoice Approvals</ManualHeading>
        <ManualParagraph>
          When a HotSeatHub subcontractor company generates an invoice for their consultant's work on your trial, it appears in the third column. This is the accounts-payable side of the marketplace:
        </ManualParagraph>
        <ManualList items={[
          "Each HSH invoice shows: subcontractor company name, consultant name, trial name, total amount, and the billing period",
          "Review: compare the billed hours and rate against the agreed HSH rate and the linked time entries in your system. Everything should match",
          <><strong>Approve:</strong> Acknowledges the bill is correct → status changes to "HSH Approved" → the bill appears on your Bills page for payment tracking</>,
        ]} />

        <ManualHeading color="#6366f1">Overall Status Flow</ManualHeading>
        <ManualStatusFlow statuses={[
          { label: "Pending", bg: "#fef3c7", text: "#92400e" },
          { label: "Approved", bg: "#dcfce7", text: "#166534" },
          { label: "Rejected", bg: "#fecaca", text: "#991b1b" },
          { label: "Billed", bg: "#dbeafe", text: "#1e40af" },
          { label: "Paid", bg: "#d1fae5", text: "#065f46" },
        ]} />
        <ManualParagraph>
          This flow is the same for both time entries and expenses: Pending → Approved (or Rejected → resubmit → Pending → Approved) → Billed (placed on invoice) → Paid (invoice payment received). Only "Approved" items can be placed on invoices. Only "Billed" items count toward invoiced revenue in the dashboard.
        </ManualParagraph>
        <ManualQuickTip color="#6366f1">Make approvals a weekly habit — ideally every Friday or Monday. Letting pending items pile up creates end-of-month bottlenecks where you have hundreds of entries to review before you can create invoices. Regular approval keeps the billing pipeline flowing smoothly.</ManualQuickTip>
      </ManualSection>

      {/* ══════════════════════════════════════════ */}
      {/*  INVOICING                                */}
      {/* ══════════════════════════════════════════ */}
      <ManualSection id="invoicing" icon={DollarSign} title="Invoicing" color="#6366f1">
        <ManualHeading color="#6366f1">Invoices Page Overview</ManualHeading>
        <ManualParagraph>
          The Invoices page (accessible to Owners and Admins) is a two-column layout optimized for the invoice creation workflow. The left column, <strong>"Create Invoices,"</strong> shows all trials that have approved, unbilled time entries and/or expenses ready to be invoiced. The right column, <strong>"Send Invoices,"</strong> shows draft invoices that have been created but not yet emailed to clients. Above both columns, a compact summary bar shows key billing metrics: total pending approval amounts, total ready-to-invoice amounts, and period status.
        </ManualParagraph>
        <ManualParagraph>
          The page also handles HSH (HotSeatHub) invoicing. If your company provides subcontractor consultants to other companies, you'll see HSH trials in the "Create Invoices" column — these generate invoices billed to the hiring company rather than to a client law firm. HSH invoice cards are marked with a purple "HSH" badge.
        </ManualParagraph>

        <ManualHeading color="#6366f1">Creating an Invoice — Step by Step</ManualHeading>
        <ManualSteps color="#6366f1" steps={[
          <><strong>Select a trial:</strong> In the "Create Invoices" column, click any trial card that has approved, unbilled time and expenses. The card shows the trial name (with job number), client name, total hours, and total dollar amount ready to bill. Clicking opens the full Invoice Form</>,
          <><strong>Invoice auto-population:</strong> The system pre-fills: client name (or hiring company for HSH), invoice number (auto-incremented based on your Settings format, e.g., "INV-0043"), invoice date (today), due date (today + your configured net-days, e.g., Net-30), and the trial reference</>,
          <><strong>Select time entries:</strong> All approved, unbilled time entries for this trial are listed with checkboxes. Each shows date, consultant, service, hours, rate, and amount. By default all are selected — uncheck any you want to exclude from this invoice cycle (they'll remain available for the next invoice)</>,
          <><strong>Select expenses:</strong> Same approach — approved, unbilled billable expenses listed with checkboxes. Each shows date, category, vendor, amount, and receipt thumbnail. Select which expenses to include</>,
          <><strong>Add manual line items (optional):</strong> Click "Add Line Item" to insert custom charges — flat fees, adjustments, discounts, retainer credits, or any ad-hoc charge. Each line item has a description, quantity, and rate</>,
          <><strong>Configure recipients:</strong> Set email recipients for when this invoice is sent. Select from trial contacts (primary, secondary, FRP), or type custom email addresses. Assign each as To, CC, or BCC. These preferences are saved per-trial — next invoice cycle, the same recipients are pre-selected</>,
          <><strong>Toggle "Include Receipts":</strong> When enabled, receipt images from the selected expenses are merged as an appendix to the invoice PDF. Clients can see exactly what each expense was</>,
          <><strong>Review totals:</strong> The form shows subtotal, tax (if configured), and grand total. Tax rate is applied from company settings</>,
          <><strong>Save as Draft:</strong> Click "Create Invoice" — the invoice is saved with status "Generating," the PDF is generated asynchronously (takes 5-15 seconds depending on complexity), and included time entries/expenses are marked as "Billed" (locked from editing). When the PDF finishes, status changes to "Draft" and the invoice appears in the "Send" column</>,
        ]} />

        <ManualHeading color="#6366f1">Invoice PDF Generation</ManualHeading>
        <ManualParagraph>
          Invoice PDFs are generated using your default invoice template (set in Settings → Billing → Default Invoice Template). The template controls the entire visual layout — letterhead, fonts, table formatting, footer text, logo placement. The generation process:
        </ManualParagraph>
        <ManualList items={[
          "Template sections are rendered in order — rich text sections have placeholders replaced ({{invoice_number}}, {{client_name}}, {{total}}, etc.)",
          "The invoice line items table is populated with your selected time entries and expenses, formatted per your template's table configuration (column widths, header styles, alternating row colors)",
          "If \"Include Receipts\" is on, receipt images are compiled into additional pages after the main invoice",
          "The HTML is converted to a PDF via API2PDF, stored as a private file, and the URL is saved on the invoice record",
          "A real-time subscription updates the UI automatically — you see the invoice card change from \"Generating\" to \"Draft\" without refreshing",
          "If PDF generation fails (rare), the card shows an error message with a \"Retry\" button",
        ]} />

        <ManualHeading color="#6366f1">Editing a Draft Invoice</ManualHeading>
        <ManualParagraph>
          Draft invoices can be fully edited before sending. Click the pencil icon on any draft invoice card to reopen the Invoice Form. You can:
        </ManualParagraph>
        <ManualList items={[
          "Add or remove time entries and expenses (removed items return to \"Approved\" status, becoming available for future invoices)",
          "Edit individual time entry details (hours, rate, description) directly from the invoice form",
          "Add, edit, or remove manual line items",
          "Change the invoice date, due date, or invoice number",
          "Toggle \"Include Receipts\" on or off",
          "Update email recipients",
          "When you save, the PDF regenerates automatically if anything that affects the PDF changed (amounts, entries, dates). If you only changed recipients, the existing PDF is kept without regeneration",
        ]} />

        <ManualHeading color="#6366f1">Sending Invoices</ManualHeading>
        <ManualSteps color="#6366f1" steps={[
          "In the \"Send Invoices\" column, find the draft invoice you want to send",
          "Click the send (→) icon on the invoice card. A confirmation dialog shows the configured recipients (To/CC/BCC)",
          "If recipients are configured: click \"Send Invoice\" → the system sends the email with the invoice PDF attached (and expense report PDF if included). Email delivery uses Resend for reliable delivery. Invoice status changes to \"Sent\"",
          "If NO recipients are configured: the dialog explains this and offers \"Mark as Sent\" — useful when you've already sent the invoice manually (printed and mailed, sent from your personal email, etc.)",
        ]} />
        <ManualParagraph>
          <strong>Email template:</strong> The invoice email uses a configurable template (Settings → Billing → Default Invoice Email Template) with a customizable default message. The email includes the invoice PDF as an attachment, not an inline preview — clients can download and save it directly.
        </ManualParagraph>

        <ManualHeading color="#6366f1">Deleting an Invoice</ManualHeading>
        <ManualParagraph>
          Click the undo icon on a draft invoice card to delete it. This is a permanent action — the invoice record is removed, and all associated time entries and expenses return to "Approved" status, making them available for a new invoice. A confirmation dialog warns you before proceeding. Only draft invoices can be deleted — sent invoices must be cancelled through the Collections page.
        </ManualParagraph>

        <ManualHeading color="#6366f1">Invoice Number Formatting</ManualHeading>
        <ManualParagraph>
          Invoice numbers auto-increment based on your configured format in Settings → Billing. You can customize:
        </ManualParagraph>
        <ManualList items={[
          <><strong>Format:</strong> e.g., "INV-0000" → generates INV-0001, INV-0002, etc. The number of zeros determines padding</>,
          <><strong>Starting number:</strong> Set where the auto-increment begins. Useful when migrating from another system — start at your next sequential number</>,
          <><strong>Yearly reset:</strong> Optionally reset the counter at the start of each fiscal year. Combined with a year prefix format (e.g., "INV-2026-0000"), this gives clean yearly numbering</>,
        ]} />

        <ManualHeading color="#6366f1">Invoice Status Flow</ManualHeading>
        <ManualStatusFlow statuses={[
          { label: "Generating", bg: "#e0f2fe", text: "#0369a1" },
          { label: "Draft", bg: "#f5f5f4", text: "#44403c" },
          { label: "Sent", bg: "#dbeafe", text: "#1e40af" },
          { label: "Partial", bg: "#fef3c7", text: "#92400e" },
          { label: "Paid", bg: "#dcfce7", text: "#166534" },
          { label: "Cancelled", bg: "#fecaca", text: "#991b1b" },
        ]} />
        <ManualParagraph>
          <strong>Generating:</strong> PDF being built asynchronously. <strong>Draft:</strong> PDF ready, not yet sent. <strong>Sent:</strong> Emailed to client, awaiting payment. <strong>Partial:</strong> Some payment received but balance outstanding. <strong>Paid:</strong> Fully paid. <strong>Cancelled:</strong> Voided after sending (reversible from Collections).
        </ManualParagraph>

        <ManualHeading color="#6366f1">Billing Periods</ManualHeading>
        <ManualParagraph>
          Configure your billing cycle in Settings → Billing. This determines how the system organizes billing-eligible items and when expense reports are generated:
        </ManualParagraph>
        <ManualInfoGrid color="#6366f1" cols={3} items={[
          ["Weekly", "Select a billing day (e.g., Friday). Each week, items from Monday through the billing day are grouped together. Expense reports cover each weekly period. Best for: companies that want frequent invoicing to maintain cash flow"],
          ["Monthly", "Select a billing date (e.g., the 1st or 15th). Items from the prior month are grouped. Expense reports are monthly. Best for: most companies — aligns with standard accounting periods and client expectations"],
          ["Per Trial", "Set a number of days after trial end (e.g., 7 days). Items for each trial are grouped into a single invoice generated shortly after the trial concludes. Best for: companies that prefer to bill everything for a trial at once rather than periodically"],
        ]} />

        <ManualQuickTip color="#6366f1">Preview any invoice PDF inline before sending by clicking the invoice card. If something's wrong, click the edit button to adjust and re-save — the PDF regenerates automatically. Only send when you're confident the invoice is correct.</ManualQuickTip>
      </ManualSection>

      {/* ══════════════════════════════════════════ */}
      {/*  COLLECTIONS                              */}
      {/* ══════════════════════════════════════════ */}
      <ManualSection id="collections" icon={HandCoins} title="Collections" color="#7c3aed">
        <ManualHeading color="#7c3aed">Collections Page Overview</ManualHeading>
        <ManualParagraph>
          The Collections page tracks all sent invoices and their payment status. It's your accounts-receivable dashboard. At the top, a summary bar shows four key numbers: <strong>Total Sent</strong> (all outstanding), <strong>Paid</strong> (collected), <strong>Outstanding</strong> (sent but unpaid), and <strong>Overdue</strong> (past due date and still unpaid — highlighted in red). View invoices as Cards (visual) or List (compact table). Filter by client, trial, status, or date range. Sort by any column.
        </ManualParagraph>

        <ManualHeading color="#7c3aed">Recording Payments</ManualHeading>
        <ManualSteps color="#7c3aed" steps={[
          "Click any invoice in the Collections list → click \"Record Payment\"",
          "Enter: payment amount, payment date, payment method (Check, Wire Transfer, ACH, Credit Card, Cash, Other), and optional reference number (check number, transaction ID, etc.)",
          "Save → If the payment covers the full remaining balance, invoice status changes to \"Paid\" and all associated time entries/expenses move to \"Paid\" status. If the payment is partial, status changes to \"Partial\" and the remaining balance is displayed",
        ]} />

        <ManualHeading color="#7c3aed">Payment Features</ManualHeading>
        <ManualList items={[
          <><strong>Multiple partial payments:</strong> An invoice can receive multiple payments over time. Each is recorded separately with its own date, amount, method, and reference. The total paid amount is tracked against the invoice total</>,
          <><strong>Overpayment handling:</strong> The system warns you if a payment would exceed the invoice total but allows it. This handles situations like payment rounding, overpayment credits, or combined payments</>,
          <><strong>Overdue tracking:</strong> Invoices past their due date are highlighted in red with a badge showing the number of days overdue. Use the "Overdue" filter to isolate these for collection follow-up calls</>,
          <><strong>PDF Preview:</strong> Click any invoice to preview the PDF inline without downloading — useful for quickly referencing what was billed during a collection call</>,
          <><strong>Payment history:</strong> View the full payment history for any invoice — all payments recorded with dates, amounts, methods, and references</>,
        ]} />
        <ManualQuickTip color="#7c3aed">Use the "Overdue" filter + sort by days overdue to prioritize collection follow-ups. Start with the oldest overdue invoices — the longer they sit, the harder they become to collect.</ManualQuickTip>
      </ManualSection>

      {/* ══════════════════════════════════════════ */}
      {/*  BILLS (VENDOR PAYABLES)                  */}
      {/* ══════════════════════════════════════════ */}
      <ManualSection id="bills" icon={ScrollText} title="Bills (Vendor Payables)" color="#57534e">
        <ManualHeading color="#57534e">HSH Bills — Accounts Payable for Subcontractors</ManualHeading>
        <ManualParagraph>
          When you hire a subcontractor consultant through HotSeatHub, the subcontractor company eventually generates an invoice for their work. That invoice automatically appears on your Bills page as an HSH bill. This is the flip side of invoicing — here you're the one paying, not getting paid.
        </ManualParagraph>

        <ManualHeading color="#57534e">HSH Bill Workflow</ManualHeading>
        <ManualInfoGrid cols={3} items={[
          ["Review", "See the subcontractor's invoice with: consultant name, hours logged, agreed rate, calculated total, and the billing period. Cross-reference against the linked time entries in your system to verify accuracy. All data should match — the same time entries created the bill"],
          ["Approve", "Confirm the bill is correct by clicking Approve → status changes to \"HSH Approved.\" This is your acknowledgment that the amount is legitimate and you intend to pay. The subcontractor company sees your approval in their system"],
          ["Mark Paid", "After you've actually sent payment (wire, check, etc.), mark the bill as \"HSH Paid.\" This completes the lifecycle. The subcontractor sees the payment confirmation in their invoicing dashboard"],
        ]} />

        <ManualHeading color="#57534e">How HSH Bills Are Created</ManualHeading>
        <ManualParagraph>
          HSH bills are never created manually — they appear automatically when the subcontractor company generates an invoice on their end. Here's the chain:
        </ManualParagraph>
        <ManualSteps color="#57534e" steps={[
          "You accept a subcontractor response → SubcontractAssignment is created",
          "The subcontractor's consultant logs time in their system → linked time entries appear in your system at the agreed HSH rate",
          "You approve those linked time entries on your Approvals page",
          "The subcontractor company creates an invoice (on their Billing page) for those approved entries",
          "That invoice automatically appears on your Bills page as an HSH bill for review and approval",
        ]} />

        <ManualHeading color="#57534e">Future: All Vendor Bills</ManualHeading>
        <ManualParagraph>
          The Bills page is architecturally designed to support all types of vendor payables in the future — not just HSH subcontractor invoices. Planned expansions include: printing services, equipment rental vendors, software subscriptions, expert witness fees, and any other recurring or one-time vendor bills. The same review/approve/pay workflow will apply.
        </ManualParagraph>
        <ManualQuickTip color="#57534e">HSH bills are created automatically when the subcontractor company generates an invoice on their end. You never need to manually enter them — they simply appear in your Bills column for review.</ManualQuickTip>
      </ManualSection>
    </ManualSubpageLayout>
  );
}
