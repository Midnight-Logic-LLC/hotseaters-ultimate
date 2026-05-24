/**
 * onboarding-payload.spec.ts — change-204 smoke.
 *
 * Asserts the finalize-owner-onboarding payload includes
 * `consultant_tier_key` and `service_keys[]` for every invitation row.
 *
 * Self-hosted Supabase only — the request is intercepted via page.route().
 */
import { test, expect } from '../fixtures';

interface CapturedInvitation {
  email: string;
  consultant_tier_key: string | null;
  service_keys: string[];
}

const PRIMED_ONBOARDING_STATE = {
  state: {
    step: 11,
    highestStep: 11,
    profileForm: { firstName: 'Avery', lastName: 'Owner', phone: '', title: '' },
    companyForm: {
      companyName: 'Test Co',
      address: '',
      city: '',
      state: '',
      zip: '',
      phone: '',
      website: '',
    },
    financialsForm: {
      fiscal_year_start_month: 1,
      annual_revenue_target: '150000',
      monthly_breakeven: '10000',
    },
    timeForm: {
      time_rounding_minutes: 15,
      clock_in_rounding: 'nearest',
      clock_out_rounding: 'nearest',
      hide_deals_from_time_clock: true,
    },
    billingForm: {
      default_daily_minimum_hours: 10,
      default_tax_rate: '',
      invoice_due_days: 30,
      invoice_period: 'weekly',
      weekly_billing_day: 'Sunday',
      monthly_billing_date: 1,
      sender_email: '',
      invoice_number_format: 'INV-0000',
      invoice_number_start: 1,
      job_number_format: 'JOB-0000',
      job_number_start: 1,
    },
    retainerForm: { retainer_minimum: 1000, retainer_divisor: 15000, retainer_multiplier: 5000 },
    pipelineStages: [],
    services: [
      {
        id: 'svc-0-jury-consulting',
        name: 'Jury Consulting',
        category_key: 'pretrial',
        base_rate: 250,
        rate_type: 'hourly',
        has_daily_minimum: false,
        service_availability: 'both',
        is_default: true,
        is_active: true,
        travel_multiplier: null,
        order: 0,
      },
      {
        id: 'svc-1-witness-prep',
        name: 'Witness Prep',
        category_key: 'pretrial',
        base_rate: 300,
        rate_type: 'hourly',
        has_daily_minimum: false,
        service_availability: 'both',
        is_default: false,
        is_active: true,
        travel_multiplier: null,
        order: 1,
      },
    ],
    serviceCategories: [{ id: 'pretrial', name: 'Pre-Trial', order: 0 }],
    clientTiers: [],
    consultantTiers: [
      { id: 'cot-0', key: 'junior', name: 'Junior', multiplier: 0.8, is_active: true },
      { id: 'cot-1', key: 'senior', name: 'Senior', multiplier: 1.2, is_active: true },
    ],
    invitations: [
      {
        id: 'inv-1',
        first_name: 'Mira',
        last_name: 'Roe',
        email: 'mira@example.test',
        role: 'Trial Consultant',
        consultant_tier_key: 'senior',
        service_keys: ['pretrial:Jury Consulting', 'pretrial:Witness Prep'],
      },
      {
        id: 'inv-2',
        first_name: 'Liam',
        last_name: 'Park',
        email: 'liam@example.test',
        role: 'Sales',
        consultant_tier_key: 'junior',
        service_keys: ['pretrial:Jury Consulting'],
      },
    ],
    snapshotVersion: 'test-snapshot-v1',
    snapshotTheme: null,
    snapshotCustomFonts: [],
  },
  version: 0,
};

test.describe('@smoke onboarding finalize payload', () => {
  test('finalize payload carries consultant_tier_key + service_keys per invitation', async ({ page }) => {
    // Capture the body of any POST to the finalize endpoint.
    let captured: Record<string, unknown> | null = null;
    await page.route('**/functions/v1/finalize-owner-onboarding', async (route) => {
      try {
        captured = JSON.parse(route.request().postData() ?? '{}');
      } catch {
        captured = null;
      }
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          ok: true,
          companyId: '00000000-0000-0000-0000-0000000000c1',
          snapshot_version: 'test-snapshot-v1',
          invitations_sent: [],
        }),
      });
    });

    // Block the seed-defaults endpoint so bootstrap doesn't overwrite our
    // primed state — we provide a no-op response and the persisted state
    // wins because snapshotVersion is already non-null.
    await page.route('**/functions/v1/get-seed-defaults', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ version: 'test-snapshot-v1', data: { theme: null, custom_fonts: [], service_categories: [], services: [], client_tiers: [], consultant_tiers: [], pipeline_stages: [] } }),
      });
    });

    // Prime the Zustand persisted state before the app boots.
    await page.addInitScript((primed) => {
      window.localStorage.setItem('hs.onboarding', JSON.stringify(primed));
    }, PRIMED_ONBOARDING_STATE);

    await page.goto('/onboarding');

    // Step 11 (index) is the team-invite step.
    await expect(page.getByRole('heading', { name: /invite your team/i })).toBeVisible({ timeout: 10_000 });

    // Two invitation rows already primed.
    const rows = page.getByTestId('invitation-row');
    await expect(rows).toHaveCount(2);

    // Click Finish & Launch.
    await page.getByRole('button', { name: /finish & launch/i }).click();

    // Wait for the captured POST.
    await expect.poll(() => captured, { timeout: 10_000 }).not.toBeNull();

    expect(captured).not.toBeNull();
    const body = captured as { invitations?: CapturedInvitation[] };
    expect(Array.isArray(body.invitations)).toBe(true);
    expect(body.invitations).toHaveLength(2);

    const mira = body.invitations!.find((i) => i.email === 'mira@example.test')!;
    expect(mira.consultant_tier_key).toBe('senior');
    expect(mira.service_keys).toEqual(
      expect.arrayContaining(['pretrial:Jury Consulting', 'pretrial:Witness Prep']),
    );

    const liam = body.invitations!.find((i) => i.email === 'liam@example.test')!;
    expect(liam.consultant_tier_key).toBe('junior');
    expect(liam.service_keys).toEqual(['pretrial:Jury Consulting']);
  });
});
