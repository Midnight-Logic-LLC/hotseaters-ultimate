/**
 * ManualHshPage — visual and functional parity with
 * HotSeatersMVP/src/pages/ManualHSH.jsx (260 lines).
 *
 * Static documentation page — no hooks, no stores.
 * RULE F: lives under src/features/manual/pages/.
 */
import { Orbit, Star } from "lucide-react";
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
  { id: "overview", title: "What is HotSeatHub?" },
  { id: "posting", title: "Posting Jobs" },
  { id: "gigs", title: "Finding Gigs" },
  { id: "negotiation", title: "Rate Negotiation" },
  { id: "directory", title: "Directory & Reviews" },
];

export function ManualHshPage() {
  return (
    <ManualSubpageLayout
      icon={Orbit}
      title="HotSeatHub Marketplace"
      subtitle="Find or provide subcontractors — post jobs, respond to gigs, negotiate rates, manage cross-company assignments"
      color="#a855f7"
      sections={TOC}
    >
      {/* ══════════════════════════════════════════ */}
      {/*  OVERVIEW                                 */}
      {/* ══════════════════════════════════════════ */}
      <ManualSection id="overview" icon={Orbit} title="What is HotSeatHub?" color="#a855f7">
        <ManualParagraph>
          HotSeatHub (HSH) is a built-in marketplace that connects trial consulting companies with each other. The core concept is simple: when you need a consultant for a trial but don't have someone available on your team, you can post the job on the marketplace. When you have team availability and want to earn extra revenue, you can browse and respond to jobs from other companies. It's the staffing backbone of the trial consulting industry.
        </ManualParagraph>
        <ManualInfoGrid color="#a855f7" cols={2} items={[
          ["Post Jobs (Help Wanted)", "Enabled by the 'marketplace_post_jobs' setting. Activates the Help Wanted sidebar menu item. You post unassigned services from your trials, review incoming responses from subcontractor companies, negotiate rates, and ultimately accept a consultant to fill your staffing gap. You're the hiring company in this scenario"],
          ["Fill Jobs (Potential Gigs)", "Enabled by the 'marketplace_fill_jobs' setting. Activates the Potential Gigs sidebar menu item. You browse job requests posted by other companies, propose your consultants with rates, negotiate, and get your team member assigned to work on another company's trial. You're the subcontractor in this scenario"],
        ]} />
        <ManualParagraph>
          Both modes are available via the HSH add-on (included in the subscription or as a $15/month add-on depending on plan). You can enable one or both. A company can simultaneously be a hiring company for some trials and a subcontractor for others. If neither mode is enabled, the sidebar shows a "Join HotSeatHub" marketing page explaining the feature.
        </ManualParagraph>

        <ManualHeading color="#a855f7">How the Money Flows</ManualHeading>
        <ManualParagraph>
          When you hire a subcontractor, you pay them the agreed rate. You then bill your client at your full service rate. The difference is your margin. When you provide a subcontractor consultant, you receive the agreed rate from the hiring company. HotSeaters tracks all of this automatically — agreed rates, linked time entries, invoicing on both sides — so both companies have accurate records without manual reconciliation.
        </ManualParagraph>
      </ManualSection>

      {/* ══════════════════════════════════════════ */}
      {/*  POSTING JOBS                             */}
      {/* ══════════════════════════════════════════ */}
      <ManualSection id="posting" icon={Orbit} title="Posting Jobs (Help Wanted)" color="#a855f7">
        <ManualHeading color="#a855f7">How to Post a Job Request</ManualHeading>
        <ManualSteps color="#a855f7" steps={[
          <><strong>From the Schedule or Trial detail:</strong> Find an unassigned service on a trial. Click "Post to HotSeatHub" — this opens the posting form pre-filled with the service name, dates, and location from the trial</>,
          <><strong>Fill out details:</strong> Confirm or edit the service description, start and end dates, location (city/state), and the rate you're willing to pay. Add a detailed description of what the consultant will need to do (courtroom setup, graphic design, tech support, etc.)</>,
          <><strong>Select recipients:</strong> Choose which companies to send the request to. Your Favorite companies are shown first with checkboxes for quick selection. Use the search bar to find and add additional companies beyond your favorites. Only companies you select will see and be able to respond to your request</>,
          <><strong>Mark preferred consultants:</strong> If you've worked with specific consultants from other companies before and want them specifically, you can flag them as preferred. This shows a star badge on the request when the subcontractor company sees it, signaling you'd prefer that particular person</>,
          <><strong>Post:</strong> The request goes live on the marketplace immediately. Selected companies can see it on their Potential Gigs page and receive notifications</>,
        ]} />

        <ManualHeading color="#a855f7">Managing Your Posted Requests</ManualHeading>
        <ManualParagraph>
          The Help Wanted page shows all your active and past requests. You can view them in three modes: Kanban (grouped by request status), Cards (grid), or List (table). Each request card shows:
        </ManualParagraph>
        <ManualList items={[
          "Service name, dates, location, offered rate",
          "Response count — with a badge highlighting new/unviewed responses",
          "Current status: Open, In Progress (at least one response), Filled (consultant accepted), or Cancelled",
          "How many companies the request was sent to",
        ]} />

        <ManualHeading color="#a855f7">Reviewing Responses</ManualHeading>
        <ManualParagraph>
          Click any request card to see all responses from subcontractor companies. Each response shows:
        </ManualParagraph>
        <ManualList items={[
          <><strong>Consultant profile:</strong> Name, photo, bio, tier, company name, and company rating/review count</>,
          <><strong>Proposed rate:</strong> The rate the subcontractor company is asking. If it matches your offered rate, the response is marked "Pending (Agreed)" — you can accept immediately. If it differs, it's "Pending (Counter)" — you can accept their rate, counter with a different rate, or decline</>,
          <><strong>Message:</strong> Optional note from the responding company explaining their consultant's qualifications or availability</>,
          <><strong>Service mapping:</strong> The subcontractor may have mapped your requested service to their own internal service name (e.g., your "Trial Tech" maps to their "Courtroom Technology"). This ensures their consultant logs time against the correct service in their system</>,
        ]} />

        <ManualHeading color="#a855f7">Request Status Flow</ManualHeading>
        <ManualStatusFlow statuses={[
          { label: "Open", bg: "#dbeafe", text: "#1e40af" },
          { label: "In Progress", bg: "#fef3c7", text: "#92400e" },
          { label: "Filled", bg: "#dcfce7", text: "#166534" },
          { label: "Cancelled", bg: "#fecaca", text: "#991b1b" },
        ]} />
        <ManualParagraph>
          <strong>Cancelling a request:</strong> You can cancel an open or in-progress request at any time. All pending responses are automatically marked as "Lost," and all responding companies receive cancellation notifications. If a consultant was already accepted, cancelling the request triggers the full cancellation workflow (see Agreements section below).
        </ManualParagraph>
      </ManualSection>

      {/* ══════════════════════════════════════════ */}
      {/*  FINDING GIGS                             */}
      {/* ══════════════════════════════════════════ */}
      <ManualSection id="gigs" icon={Orbit} title="Finding Gigs (Potential Gigs)" color="#a855f7">
        <ManualHeading color="#a855f7">Browsing Available Requests</ManualHeading>
        <ManualParagraph>
          The Potential Gigs page shows all job requests from other companies that your company can respond to. Each request card shows: the hiring company's name and rating, service needed, location, dates, offered rate, and description. Private requests are only visible if your company was specifically invited. If you were invited and a specific consultant was marked as "preferred," a star icon appears on the card.
        </ManualParagraph>
        <ManualParagraph>
          View modes: Kanban (grouped by your response status), Cards (grid), or List (compact table). Filter by service type, location, date range, or response status. Requests you've already responded to show their response status badge.
        </ManualParagraph>

        <ManualHeading color="#a855f7">Responding to a Request</ManualHeading>
        <ManualSteps color="#a855f7" steps={[
          <><strong>Click "Respond"</strong> on a matching request to open the response form</>,
          <><strong>Select a consultant:</strong> Choose from your team members who are qualified for the requested service type. The form shows each person's current schedule for the relevant date range so you can verify they're actually available — no need to leave the form and check the timeline separately</>,
          <><strong>Map the service:</strong> The hiring company's service name might not match yours exactly. Map their requested service to one of your internal services (e.g., their "Trial Graphics" maps to your "Graphic Design"). This ensures time logging works correctly in both systems</>,
          <><strong>Set your rate:</strong> Enter the rate you want to be paid. The system suggests a rate based on your company's profit margin settings — it takes the hiring company's offered rate and applies your configured margin (percentage or dollar amount) to calculate a payout that maintains your target profit. You can override this suggestion</>,
          <><strong>Add a message (optional):</strong> Write a note introducing your consultant, highlighting relevant experience, or noting any scheduling constraints</>,
          <><strong>Submit:</strong> Your response is sent to the hiring company. They receive a notification and can see your response on their Help Wanted page</>,
        ]} />

        <ManualHeading color="#a855f7">Profit Margin Calculation</ManualHeading>
        <ManualParagraph>
          When you hire a subcontractor through HSH, you bill your client at your full service rate and pay the subcontractor at the agreed rate — the difference is your margin. The profit margin settings (configured in Settings → HotSeatHub) control the suggested payout rate you offer when posting a job request. Two calculation modes:
        </ManualParagraph>
        <ManualList items={[
          <><strong>Percentage mode:</strong> Target margin as a percentage. Example: your client rate is $200/hr and you set a 25% margin → suggested subcontractor payout = $200 ÷ 1.25 = $160/hr. You keep $40/hr profit on every hour the subcontractor works</>,
          <><strong>Dollar mode:</strong> Fixed dollar margin per hour. Example: your client rate is $200/hr and you set a $50/hr margin → suggested subcontractor payout = $200 − $50 = $150/hr. You keep a flat $50/hr regardless of the base rate</>,
        ]} />
        <ManualParagraph>
          The suggested payout is always just a starting point — you can adjust the offered rate when posting. If a subcontractor responds with a different rate, the response enters negotiation.
        </ManualParagraph>
      </ManualSection>

      {/* ══════════════════════════════════════════ */}
      {/*  NEGOTIATION & AGREEMENTS                 */}
      {/* ══════════════════════════════════════════ */}
      <ManualSection id="negotiation" icon={Orbit} title="Rate Negotiation & Agreements" color="#a855f7">
        <ManualHeading color="#a855f7">Negotiation Flow</ManualHeading>
        <ManualParagraph>
          Rate negotiation is a back-and-forth conversation between the hiring company and the subcontractor company. Either party can counter-offer at any point. The full negotiation history is preserved as a threaded conversation visible to both parties:
        </ManualParagraph>
        <ManualStatusFlow statuses={[
          { label: "Pending (Agreed)", bg: "#dcfce7", text: "#166534" },
          { label: "Pending (Counter)", bg: "#fef3c7", text: "#92400e" },
          { label: "Negotiating", bg: "#e0f2fe", text: "#0369a1" },
          { label: "Accepted", bg: "#dcfce7", text: "#166534" },
          { label: "Declined", bg: "#fecaca", text: "#991b1b" },
        ]} />
        <ManualList items={[
          <><strong>Pending (Agreed):</strong> The subcontractor's proposed rate matches the offered rate. The hiring company can accept immediately</>,
          <><strong>Pending (Counter):</strong> The proposed rate differs from the offered rate. The hiring company sees the counter-proposal and can: accept it, counter back with a different rate, or decline</>,
          <><strong>Negotiating:</strong> Multiple rounds of counter-offers have occurred. Each round includes a rate and optional message. The thread shows who proposed what rate and when</>,
          <><strong>Accepted:</strong> Both parties have agreed on a rate. The assignment is created (see below)</>,
          <><strong>Declined:</strong> One party explicitly declined. The response is archived. The request remains open for other responses</>,
          <><strong>Lost:</strong> The request was cancelled or another response was accepted — this response is no longer viable</>,
        ]} />

        <ManualHeading color="#a855f7">On Acceptance — What Happens</ManualHeading>
        <ManualSteps color="#a855f7" steps={[
          "Either the hiring company or subcontractor clicks \"Accept\" on the current agreed rate",
          "A SubcontractAssignment record is created, linking the subcontractor's consultant to the hiring company's trial service at the agreed rate. Assignment includes: start date, end date, agreed rate, consultant details, and both companies' references",
          "An HSH Agreement PDF is auto-generated — a formal document containing: assignment details, agreed rate, dates, both companies' names and logos, timestamps of acceptance by both parties. This serves as a written record of the arrangement",
          "Both companies receive the PDF — it's stored on the trial (hiring company side) and on the gig record (subcontractor side). Both parties can download it at any time",
          "The subcontractor's consultant appears on the hiring company's Schedule timeline in purple, clearly distinguishing external consultants from internal team members",
          "A job number is auto-assigned on the subcontractor's side for their internal tracking of this gig. If the subcontractor has multiple assignments on the same trial, they share one job number",
          "Notifications sent to both companies confirming the assignment",
        ]} />

        <ManualHeading color="#a855f7">Linked Time & Expense Entries</ManualHeading>
        <ManualParagraph>
          HSH provides seamless cross-company visibility of time and expense data:
        </ManualParagraph>
        <ManualList items={[
          <><strong>Real-time visibility:</strong> The subcontractor's consultant clocks in and out in their own company's system as usual. The hiring company can see these HSH time entries directly in their Time & Expenses page and on the Schedule timeline — no duplicate data entry needed</>,
          <><strong>Mirrored entries on approval:</strong> When the subcontractor submits an HSH invoice, the hiring company reviews it on the Approvals page. Upon approval, mirrored time entries and expense records are generated in bulk in the hiring company's system at the agreed HSH rate. This is when the data officially enters the hiring company's books</>,
          <><strong>Expenses:</strong> Subcontractor expenses are visible to the hiring company and included in the HSH invoice. Receipt images are shared between systems. Mirrored expense records are created alongside the time entries when the invoice is approved</>,
          <><strong>Invoicing:</strong> The hiring company includes the mirrored HSH time entries and expenses on their client invoices (billed at their client-facing rate). The subcontractor creates HSH invoices for the hiring company (billed at the agreed HSH rate). The hiring company sees these as HSH bills on their Bills page</>,
        ]} />

        <ManualHeading color="#a855f7">Assignment Cancellation</ManualHeading>
        <ManualParagraph>
          Either party can cancel an active assignment. On cancellation:
        </ManualParagraph>
        <ManualList items={[
          "The SubcontractAssignment status changes to \"cancelled\"",
          "The consultant is removed from the hiring company's timeline",
          "Both companies receive cancellation notifications",
          "Existing time entries and expenses are NOT deleted — they're preserved for billing any work already completed. Only future work stops",
          "The hiring company's service goes back to \"unassigned\" status on the timeline, showing as a dashed gray bar, signaling the need to find a replacement",
        ]} />
      </ManualSection>

      {/* ══════════════════════════════════════════ */}
      {/*  DIRECTORY & REVIEWS                      */}
      {/* ══════════════════════════════════════════ */}
      <ManualSection id="directory" icon={Star} title="Directory & Reviews" color="#a855f7">
        <ManualHeading color="#a855f7">Company Directory</ManualHeading>
        <ManualParagraph>
          The HSH Directory is a browsable catalog of all companies on the marketplace that have the "Fill Jobs" capability enabled. Your own company is excluded from the listing. The directory is organized into collapsible sections:
        </ManualParagraph>
        <ManualList items={[
          <><strong>Favorites:</strong> Companies you've starred — always shown first for quick access</>,
          <><strong>Everyone Else:</strong> All other active marketplace companies, sorted alphabetically</>,
          <><strong>Blocked:</strong> Companies you've blocked — hidden by default, revealed with a "Show blocked" toggle</>,
        ]} />

        <ManualHeading color="#a855f7">Card View vs. List View</ManualHeading>
        <ManualParagraph>
          Toggle between two display modes using the view switcher (your preference is saved automatically):
        </ManualParagraph>
        <ManualList items={[
          <><strong>Card view:</strong> Grid of company cards showing: logo, name, star rating, location (city/state), website link, review count, and favorite/block buttons</>,
          <><strong>List view:</strong> Compact table with columns for logo, company name with rating, location, website, review count, and favorite/block actions</>,
        ]} />
        <ManualParagraph>
          Use the search bar to filter by company name, or the location filter to narrow by city or state.
        </ManualParagraph>

        <ManualHeading color="#a855f7">Company Profile Modal</ManualHeading>
        <ManualParagraph>
          Click any company card or list row to open a profile dialog showing:
        </ManualParagraph>
        <ManualList items={[
          "Company logo, name, and star rating",
          "Location (city/state), website link, and phone number",
          "Complete list of reviews from other companies (reviewer name, star rating, written feedback, and date)",
        ]} />
        <ManualParagraph>
          You can also view your own company's profile using the "My Company Profile" button in the header — helpful for seeing how your company appears to others.
        </ManualParagraph>

        <ManualHeading color="#a855f7">Favorites & Blocking</ManualHeading>
        <ManualParagraph>
          Each company card has two action buttons:
        </ManualParagraph>
        <ManualList items={[
          <><strong>Favorite (heart icon):</strong> Adds the company to your Favorites section. Favorited companies appear at the top of the directory and are pre-suggested when selecting recipients for HSH job requests — making it fast to invite trusted partners</>,
          <><strong>Block (broken-heart icon):</strong> Removes the company from your normal directory view. Blocked companies are only visible when you toggle "Show blocked." Useful for hiding companies you don't want to work with. You can unblock at any time</>,
        ]} />

        <ManualHeading color="#a855f7">Reviews & Ratings</ManualHeading>
        <ManualParagraph>
          Any HSH user can leave a review for another company (you cannot review your own company). Reviews are submitted from the company's profile modal:
        </ManualParagraph>
        <ManualList items={[
          <><strong>Rating:</strong> 1 to 5 stars using an interactive star picker</>,
          <><strong>Written feedback:</strong> Free-text comment describing the experience</>,
          <><strong>Public visibility:</strong> All reviews are visible to every HSH user on the company's profile. Each review shows the reviewer's name, their star rating, the comment, and a relative timestamp</>,
          <><strong>Delete own reviews:</strong> You can delete any review you personally wrote</>,
          <><strong>Report reviews:</strong> If you're an Owner or Admin viewing reviews on your own company's profile, you can report inappropriate reviews — this sends an email to HSH support with the review details</>,
          <><strong>Aggregate rating:</strong> The company's average rating and total review count are recalculated automatically after every review submission or deletion, and displayed on directory cards and list rows</>,
        ]} />

        <ManualHeading color="#a855f7">Referral Invitations</ManualHeading>
        <ManualParagraph>
          The "Send Referral Invitation" button in the directory header opens a form where you enter a person's name and email address. This sends them a branded invitation to join HotSeaters and create their own company account. More companies on the marketplace means more staffing options and gig opportunities for everyone.
        </ManualParagraph>
        <ManualQuickTip color="#a855f7">Build your Favorites list early. When you need a subcontractor urgently (trial starting next week, your consultant got sick), having trusted partners already favorited means you can post a private request to exactly the right companies in seconds.</ManualQuickTip>
      </ManualSection>
    </ManualSubpageLayout>
  );
}
