/**
 * page-metadata.ts — port of
 * `HotSeatersMVP/src/components/mobile/pageMetadata.jsx`.
 *
 * Maps a route segment (the first path component after `/`) to a mobile
 * header title + description, plus optional behavior flags used by the
 * mobile shell.
 *
 * Descriptions MUST match the actual page descriptions exactly (per legacy
 * comment). The bible is HotSeatersMVP.
 */

export interface PageMetadata {
  title: string;
  description?: string;
  /** Hide the bottom tab bar on this route (e.g. immersive trial detail). */
  hideTabBar?: boolean;
  /** Show a back arrow in the mobile header. */
  showBack?: boolean;
}

const PAGE_METADATA: Record<string, PageMetadata> = {
  Dashboard: { title: 'Dashboard', description: "Here's what's happening with your business" },
  Deals: { title: 'Deals', description: 'Manage your sales pipeline' },
  Trials: { title: 'Trials', description: 'Manage your trial pipeline' },
  TimeTracking: { title: 'Time & Expenses', description: 'Track your time and expenses' },
  TimeAndExpenses: { title: 'Time & Expenses', description: 'Track your time and expenses' },
  Approvals: {
    title: 'Approvals',
    description: 'Review and approve time entries and expenses',
  },
  Invoices: { title: 'Invoices', description: 'Review and invoice approved work' },
  Collections: { title: 'Collections', description: 'Track outstanding and paid invoices' },
  Clients: { title: 'Clients', description: 'Manage your client relationships' },
  Consultants: { title: 'Team', description: 'Manage your team members' },
  Team: { title: 'Team', description: 'Manage your team members' },
  Settings: { title: 'Settings', description: 'Company settings and configuration' },
  Schedule: { title: 'Trial Timeline', description: 'View and manage your trial schedule' },
  Timeline: { title: 'Trial Timeline', description: 'View and manage your trial schedule' },
  SalesHub: { title: 'Sales', description: 'Manage your deals and client relationships' },
  Sales: { title: 'Sales', description: 'Manage your deals and client relationships' },
  LeadRadar: {
    title: 'Lead Radar',
    description: 'Track potential leads and follow up before they go cold',
  },
  DealTracker: {
    title: 'Deal Tracker',
    description: 'Track active deals and manage the sales pipeline',
  },
  Projections: { title: 'Projections', description: 'Revenue forecasting across the fiscal year' },
  HelpWanted: { title: 'Help Wanted', description: 'Post and manage subcontract requests' },
  PotentialGigs: {
    title: 'Potential Gigs',
    description: 'Browse available subcontract opportunities',
  },
  HSHDirectory: { title: 'HSH Directory', description: 'Browse HotSeatHub company directory' },
  HotSeatHubMarketing: { title: 'HotSeatHub', description: 'Join the HotSeatHub marketplace' },
  UserManual: { title: 'User Manual', description: 'Learn how to use HotSeaters' },
  manual: { title: 'User Manual', description: 'Learn how to use HotSeaters' },
  Docs: {
    title: 'Dev Docs',
    description: 'Developer documentation and technical reference',
  },
  Calendar: { title: 'Calendar', description: 'View your trial calendar' },
  MobileMore: { title: 'More', description: '' },
  Bills: { title: 'Bills', description: 'Track HSH subcontractor bills' },
};

/**
 * Look up mobile metadata for a route. Accepts either a `pageName`
 * (`'Dashboard'`) or a full pathname (`'/Dashboard/abc'` — only the first
 * segment is considered).
 */
export function getPageMetadata(pathnameOrPageName: string | null | undefined): PageMetadata {
  if (!pathnameOrPageName) return { title: '', description: '' };
  const trimmed = pathnameOrPageName.startsWith('/')
    ? pathnameOrPageName.slice(1)
    : pathnameOrPageName;
  const segment = trimmed.split('/')[0] ?? '';
  return PAGE_METADATA[segment] ?? { title: segment, description: '' };
}
