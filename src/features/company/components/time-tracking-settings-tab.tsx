/**
 * time-tracking-settings-tab.tsx — full-parity port of the Time Tracking
 * section of `HotSeatersMVP/src/pages/Settings.jsx` (lines 627–765).
 *
 * One Card titled "Time Tracking" with:
 *   - Time Entry Rounding (minutes) select (1, 6, 15, 30, 60)
 *   - Clock-In Rounding select (down / nearest / up)
 *   - Clock-Out Rounding select (down / nearest / up)
 *   - Default Daily Minimum Hours number input (per S04 spec)
 *   - Admin-only "Hide Deals from Time Clock" switch — saves IMMEDIATELY
 *     via updateCompanyImmediate on toggle (no draft step)
 *
 * The four field inputs above batch-save via the "Save Time Tracking
 * Settings" button using `saveSettings`. The switch persists instantly,
 * matching the bible's `updateCompanyMutation.mutate(...)` pattern.
 *
 * Components → hooks only (RULE B). All I/O lives in `useCompanySettings()`
 * and the company store. HotSeatersMVP is the bible.
 */

import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';

import { useTier1 } from '@/app/tier1-provider';
import { useCompanySettings } from '@/features/company/hooks/use-company-settings';
import type { GeneralSettings } from '@/features/company/hooks/use-company-settings';

const LABEL_STYLE = {
  fontSize: 'var(--theme-text-label)',
  color: 'var(--theme-stone-700)',
} as const;

const CAPTION_STYLE = {
  fontSize: 'var(--theme-text-caption)',
  color: 'var(--theme-stone-500)',
  marginTop: 'var(--theme-element-gap)',
} as const;

const INPUT_STYLE = {
  borderRadius: 'var(--theme-input-radius)',
  borderWidth: 'var(--theme-input-border)',
  backgroundColor: 'var(--theme-input-bg)',
} as const;

const SELECT_CLASS =
  'w-full px-3 py-2 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500';

type TimeTrackingDraft = Pick<
  GeneralSettings,
  | 'time_rounding_minutes'
  | 'clock_in_rounding'
  | 'clock_out_rounding'
  | 'default_daily_minimum_hours'
>;

export function TimeTrackingSettingsTab() {
  const { userInfo, company: tier1Company, role } = useTier1();
  const companyId = tier1Company?.id ?? null;
  const {
    company,
    generalSettings: serverGeneral,
    saving,
    saveSettings,
    updateCompanyImmediate,
  } = useCompanySettings(companyId);

  const [draft, setDraft] = useState<TimeTrackingDraft>({
    time_rounding_minutes: serverGeneral.time_rounding_minutes,
    clock_in_rounding: serverGeneral.clock_in_rounding,
    clock_out_rounding: serverGeneral.clock_out_rounding,
    default_daily_minimum_hours: serverGeneral.default_daily_minimum_hours,
  });
  const [hydratedFromCompanyId, setHydratedFromCompanyId] = useState<string | null>(
    null,
  );

  // Re-seed once the live company row arrives or changes id.
  if (company && hydratedFromCompanyId !== company.id) {
    setDraft({
      time_rounding_minutes: serverGeneral.time_rounding_minutes,
      clock_in_rounding: serverGeneral.clock_in_rounding,
      clock_out_rounding: serverGeneral.clock_out_rounding,
      default_daily_minimum_hours: serverGeneral.default_daily_minimum_hours,
    });
    setHydratedFromCompanyId(company.id);
  }

  const isAdmin =
    role === 'owner' ||
    role === 'admin' ||
    userInfo?.company_role === 'admin' ||
    userInfo?.company_role === 'owner';

  const update = <K extends keyof TimeTrackingDraft>(
    key: K,
    value: TimeTrackingDraft[K],
  ) => {
    setDraft((prev) => ({ ...prev, [key]: value }));
  };

  const hideDeals = Boolean(company?.hide_deals_from_time_clock);

  const handleHideDealsToggle = async (checked: boolean) => {
    await updateCompanyImmediate('hide_deals_from_time_clock', checked);
  };

  const handleSave = async () => {
    await saveSettings(draft);
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--theme-section-gap)',
      }}
    >
      <Card
        className="overflow-hidden"
        style={{
          borderRadius: 'var(--theme-card-radius)',
          boxShadow: 'var(--theme-card-shadow)',
          backgroundColor: 'var(--theme-card-bg)',
          borderWidth: 'var(--theme-card-border)',
          borderColor: 'var(--theme-stone-200)',
        }}
      >
        <CardHeader
          style={{
            backgroundColor: 'var(--theme-card-header-bg)',
            padding: 'var(--theme-card-header-padding)',
            borderTopLeftRadius: 'var(--theme-card-radius)',
            borderTopRightRadius: 'var(--theme-card-radius)',
          }}
        >
          <CardTitle
            style={{
              fontSize: 'var(--theme-text-card-title)',
              color: 'var(--theme-stone-900)',
            }}
          >
            Time Tracking
          </CardTitle>
        </CardHeader>
        <CardContent style={{ padding: 'var(--theme-card-padding)' }}>
          <div
            className="grid md:grid-cols-3"
            style={{ gap: 'var(--theme-card-gap)' }}
          >
            <div>
              <Label htmlFor="time_rounding_minutes" style={LABEL_STYLE}>
                Time Entry Rounding (minutes)
              </Label>
              <select
                id="time_rounding_minutes"
                value={draft.time_rounding_minutes}
                onChange={(e) =>
                  update('time_rounding_minutes', e.target.value)
                }
                className={SELECT_CLASS}
              >
                <option value="1">1 minute (0.025 hour)</option>
                <option value="6">6 minutes (0.1 hour)</option>
                <option value="15">15 minutes (0.25 hour)</option>
                <option value="30">30 minutes (0.5 hour)</option>
                <option value="60">60 minutes (1 hour)</option>
              </select>
              <p style={CAPTION_STYLE}>
                Round time entries to the nearest increment
              </p>
            </div>

            <div>
              <Label htmlFor="clock_in_rounding" style={LABEL_STYLE}>
                Clock-In Rounding
              </Label>
              <select
                id="clock_in_rounding"
                value={draft.clock_in_rounding}
                onChange={(e) => update('clock_in_rounding', e.target.value)}
                className={SELECT_CLASS}
              >
                <option value="down">Round Down (back in time)</option>
                <option value="nearest">Round to Nearest</option>
                <option value="up">Round Up (forward in time)</option>
              </select>
              <p style={CAPTION_STYLE}>When starting the timer</p>
            </div>

            <div>
              <Label htmlFor="clock_out_rounding" style={LABEL_STYLE}>
                Clock-Out Rounding
              </Label>
              <select
                id="clock_out_rounding"
                value={draft.clock_out_rounding}
                onChange={(e) => update('clock_out_rounding', e.target.value)}
                className={SELECT_CLASS}
              >
                <option value="down">Round Down (back in time)</option>
                <option value="nearest">Round to Nearest</option>
                <option value="up">Round Up (forward in time)</option>
              </select>
              <p style={CAPTION_STYLE}>When stopping the timer</p>
            </div>

            <div>
              <Label htmlFor="default_daily_minimum_hours" style={LABEL_STYLE}>
                Default Daily Minimum Hours
              </Label>
              <Input
                id="default_daily_minimum_hours"
                type="number"
                step="0.5"
                min="0"
                placeholder="8"
                value={draft.default_daily_minimum_hours}
                onChange={(e) =>
                  update('default_daily_minimum_hours', e.target.value)
                }
                style={INPUT_STYLE}
              />
              <p style={CAPTION_STYLE}>
                Default minimum billable hours per day for trials
              </p>
            </div>
          </div>

          {isAdmin && (
            <div
              className="flex items-center justify-between border rounded-lg"
              style={{
                padding: 'var(--theme-card-padding)',
                borderColor: 'var(--theme-stone-200)',
                backgroundColor: 'var(--theme-stone-50)',
                borderRadius: 'var(--theme-card-radius)',
                marginTop: 'var(--theme-card-gap)',
              }}
            >
              <div className="flex-1">
                <div
                  className="font-medium"
                  style={{ color: 'var(--theme-stone-900)' }}
                >
                  Hide Deals from Time Clock
                </div>
                <p
                  style={{
                    fontSize: 'var(--theme-text-body)',
                    color: 'var(--theme-stone-600)',
                    marginTop: 'var(--theme-element-gap)',
                  }}
                >
                  Only show trials (not deals) in the time clock task list
                </p>
              </div>
              <Switch
                aria-label="Hide Deals from Time Clock"
                checked={hideDeals}
                onCheckedChange={handleHideDealsToggle}
              />
            </div>
          )}
        </CardContent>
      </Card>

      <div
        className="flex justify-end"
        style={{ marginTop: 'var(--theme-section-gap)' }}
      >
        <Button
          onClick={handleSave}
          disabled={saving}
          style={{
            backgroundColor: 'var(--theme-brand-primary)',
            color: 'white',
          }}
          className="hover:opacity-90 transition-opacity"
        >
          {saving ? 'Saving...' : 'Save Time Tracking Settings'}
        </Button>
      </div>
    </div>
  );
}

export default TimeTrackingSettingsTab;
