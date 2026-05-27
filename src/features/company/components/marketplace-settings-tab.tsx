/**
 * marketplace-settings-tab.tsx — full-parity port of the "HotSeatHub /
 * marketplace" section of `HotSeatersMVP/src/pages/Settings.jsx`
 * (lines 356–599).
 *
 * One Card titled "HotSeatHub Settings" with three regions:
 *   1. Enable Help Wanted switch — saves IMMEDIATELY via
 *      updateCompanyImmediate('marketplace_post_jobs', value). The bible
 *      labels this "Enable Help Wanted" but the column is
 *      `marketplace_post_jobs` (HotSeatersMVP/src/pages/Settings.jsx#397).
 *   2. Profit Margin Target — visible only when marketplace_post_jobs is on.
 *      Two fields, both saving immediately:
 *        - profit_margin_type select ('percentage' | 'dollar')
 *        - profit_margin_value number input
 *   3. Decline Notifications — user_info.preferences JSONB via the generic
 *      useEntitySetting hook keyed by `user.preferences`. The bible writes
 *      directly to base44.UserInfo.preferences (Settings.jsx#499-504);
 *      our entity-setting store is the equivalent seam.
 *   4. Enable Potential Gigs switch — saves IMMEDIATELY via
 *      updateCompanyImmediate('marketplace_fill_jobs', value).
 *
 * Components → hooks only (RULE B). All I/O lives in useCompanySettings
 * and useEntitySetting. HotSeatersMVP is the bible.
 */

import { Orbit } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';

import { useTier1 } from '@/app/tier1-provider';
import { useCompanySettings } from '@/features/company/hooks/use-company-settings';
import { useEntitySetting } from '@/features/settings/hooks/use-entity-setting';

const LABEL_STYLE = {
  fontSize: 'var(--theme-text-label)',
  color: 'var(--theme-stone-700)',
} as const;

const CAPTION_STYLE = {
  fontSize: 'var(--theme-text-caption)',
  color: 'var(--theme-stone-500)',
  marginTop: 'var(--theme-element-gap)',
} as const;

const BODY_STYLE = {
  fontSize: 'var(--theme-text-body)',
  color: 'var(--theme-stone-600)',
  marginTop: 'var(--theme-element-gap)',
} as const;

const INPUT_STYLE = {
  borderRadius: 'var(--theme-input-radius)',
  borderWidth: 'var(--theme-input-border)',
  backgroundColor: 'var(--theme-input-bg)',
} as const;

const SELECT_CLASS =
  'w-full px-3 py-2 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white';

const ROW_BORDER_STYLE = {
  padding: 'var(--theme-card-padding)',
  borderColor: 'var(--theme-stone-200)',
  borderRadius: 'var(--theme-card-radius)',
} as const;

const NESTED_BOX_STYLE = {
  padding: 'var(--theme-card-padding)',
  borderColor: 'var(--theme-stone-200)',
  borderRadius: 'var(--theme-card-radius)',
  display: 'flex',
  flexDirection: 'column' as const,
  gap: 'var(--theme-card-gap)',
  backgroundColor: 'var(--theme-stone-50)',
};

type DeclineNotificationMode = 'with_message_only' | 'all' | 'none';

interface UserPreferences extends Record<string, unknown> {
  hsh_decline_notifications?: DeclineNotificationMode;
  hsh_decline_notification_threshold?: number;
}

const DECLINE_HELP_TEXT: Record<DeclineNotificationMode, string> = {
  with_message_only:
    'You will receive individual notifications only for declines that include a message explaining why.',
  all: 'You will receive periodic aggregated notifications summarizing total declines.',
  none: 'You will not receive any bell menu notifications for declines.',
};

export function MarketplaceSettingsTab() {
  const { userInfo, company: tier1Company } = useTier1();
  const companyId = tier1Company?.id ?? null;
  const userInfoId = userInfo?.id ?? null;

  const { company, updateCompanyImmediate } = useCompanySettings(companyId);
  const { data: preferences, save: savePreferences } =
    useEntitySetting<UserPreferences>(
      'user.preferences',
      userInfoId,
      'user_info',
    );

  const marketplacePostJobs = Boolean(company?.marketplace_post_jobs);
  const marketplaceFillJobs = Boolean(company?.marketplace_fill_jobs);
  const profitMarginType =
    (company?.profit_margin_type as 'percentage' | 'dollar' | undefined) ??
    'percentage';
  const profitMarginValue =
    (company?.profit_margin_value as number | string | undefined) ?? '';

  const declineMode: DeclineNotificationMode =
    preferences?.hsh_decline_notifications ?? 'with_message_only';
  const declineThreshold = preferences?.hsh_decline_notification_threshold ?? 10;

  const handlePostJobsToggle = async (checked: boolean) => {
    await updateCompanyImmediate('marketplace_post_jobs', checked);
  };

  const handleFillJobsToggle = async (checked: boolean) => {
    await updateCompanyImmediate('marketplace_fill_jobs', checked);
  };

  const handleMarginTypeChange = async (value: string) => {
    await updateCompanyImmediate('profit_margin_type', value);
  };

  const handleMarginValueChange = async (raw: string) => {
    const parsed = parseFloat(raw);
    await updateCompanyImmediate(
      'profit_margin_value',
      Number.isFinite(parsed) ? parsed : 0,
    );
  };

  const handleDeclineModeChange = async (value: string) => {
    await savePreferences({
      hsh_decline_notifications: value as DeclineNotificationMode,
    });
  };

  const handleDeclineThresholdChange = async (raw: string) => {
    const parsed = parseInt(raw, 10);
    await savePreferences({
      hsh_decline_notification_threshold: Number.isFinite(parsed)
        ? parsed
        : 10,
    });
  };

  return (
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
          className="flex items-center"
          style={{
            gap: 'var(--theme-element-gap)',
            fontSize: 'var(--theme-text-card-title)',
            color: 'var(--theme-stone-900)',
          }}
        >
          <Orbit
            className="w-5 h-5"
            style={{ color: 'var(--theme-brand-primary)' }}
          />
          HotSeatHub Settings
        </CardTitle>
      </CardHeader>
      <CardContent style={{ padding: 'var(--theme-card-padding)' }}>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--theme-card-gap)',
            maxWidth: '48rem',
          }}
        >
          <div
            className="flex items-center justify-between border rounded-lg"
            style={ROW_BORDER_STYLE}
          >
            <div className="flex-1">
              <div
                className="font-medium"
                style={{ color: 'var(--theme-stone-900)' }}
              >
                Enable Help Wanted
              </div>
              <p style={BODY_STYLE}>
                Allow your company to post subcontractor requests to the
                HotSeaters marketplace
              </p>
            </div>
            <Switch
              aria-label="Enable Help Wanted"
              checked={marketplacePostJobs}
              onCheckedChange={handlePostJobsToggle}
            />
          </div>

          {marketplacePostJobs && (
            <>
              <div className="border rounded-lg" style={NESTED_BOX_STYLE}>
                <div
                  className="font-medium"
                  style={{ color: 'var(--theme-stone-900)' }}
                >
                  Profit Margin Target
                </div>
                <p
                  style={{
                    fontSize: 'var(--theme-text-body)',
                    color: 'var(--theme-stone-600)',
                  }}
                >
                  Set your desired profit margin when calculating
                  subcontractor payouts for marketplace jobs
                </p>

                <div
                  className="grid grid-cols-2"
                  style={{ gap: 'var(--theme-card-gap)' }}
                >
                  <div>
                    <Label htmlFor="margin_type" style={LABEL_STYLE}>
                      Margin Type
                    </Label>
                    <select
                      id="margin_type"
                      value={profitMarginType}
                      onChange={(e) => handleMarginTypeChange(e.target.value)}
                      className={SELECT_CLASS}
                    >
                      <option value="percentage">Percentage</option>
                      <option value="dollar">Dollar Amount</option>
                    </select>
                  </div>

                  <div>
                    <Label htmlFor="margin_value" style={LABEL_STYLE}>
                      {profitMarginType === 'dollar'
                        ? 'Margin Amount ($)'
                        : 'Margin (%)'}
                    </Label>
                    <Input
                      id="margin_value"
                      type="number"
                      step={profitMarginType === 'dollar' ? '1' : '0.1'}
                      min="0"
                      placeholder={profitMarginType === 'dollar' ? '100' : '10'}
                      value={profitMarginValue as string | number}
                      onChange={(e) => handleMarginValueChange(e.target.value)}
                      className="bg-white"
                      style={INPUT_STYLE}
                    />
                    <p style={CAPTION_STYLE}>
                      {profitMarginType === 'dollar'
                        ? 'Fixed dollar amount to retain as profit per unit'
                        : 'Percentage of billable rate to retain as profit'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="border rounded-lg" style={NESTED_BOX_STYLE}>
                <div
                  className="font-medium"
                  style={{ color: 'var(--theme-stone-900)' }}
                >
                  Decline Notifications
                </div>
                <p
                  style={{
                    fontSize: 'var(--theme-text-body)',
                    color: 'var(--theme-stone-600)',
                  }}
                >
                  Control how you receive notifications when subcontractors
                  decline your public HotSeatHub posts
                </p>

                <div>
                  <Label htmlFor="decline_notifications" style={LABEL_STYLE}>
                    Notification Preference
                  </Label>
                  <select
                    id="decline_notifications"
                    value={declineMode}
                    onChange={(e) => handleDeclineModeChange(e.target.value)}
                    className={SELECT_CLASS}
                  >
                    <option value="with_message_only">
                      Only when they provide a reason (recommended)
                    </option>
                    <option value="all">All declines (aggregated count)</option>
                    <option value="none">No decline notifications</option>
                  </select>
                  <p style={CAPTION_STYLE}>{DECLINE_HELP_TEXT[declineMode]}</p>
                </div>

                {declineMode === 'all' && (
                  <div>
                    <Label htmlFor="decline_threshold" style={LABEL_STYLE}>
                      Notification Frequency
                    </Label>
                    <div
                      className="flex items-center"
                      style={{ gap: 'var(--theme-element-gap)' }}
                    >
                      <span
                        style={{
                          fontSize: 'var(--theme-text-body)',
                          color: 'var(--theme-stone-600)',
                        }}
                      >
                        Send notification every
                      </span>
                      <Input
                        id="decline_threshold"
                        type="number"
                        min="1"
                        max="100"
                        value={declineThreshold}
                        onChange={(e) =>
                          handleDeclineThresholdChange(e.target.value)
                        }
                        className="w-20 h-9 bg-white"
                        style={INPUT_STYLE}
                      />
                      <span
                        style={{
                          fontSize: 'var(--theme-text-body)',
                          color: 'var(--theme-stone-600)',
                        }}
                      >
                        declines
                      </span>
                    </div>
                    <p style={CAPTION_STYLE}>
                      You&apos;ll receive a notification at {declineThreshold},{' '}
                      {declineThreshold * 2}, {declineThreshold * 3}, etc.
                      declines per posting.
                    </p>
                  </div>
                )}
              </div>
            </>
          )}

          <div
            className="flex items-center justify-between border rounded-lg"
            style={ROW_BORDER_STYLE}
          >
            <div className="flex-1">
              <div
                className="font-medium"
                style={{ color: 'var(--theme-stone-900)' }}
              >
                Enable Potential Gigs
              </div>
              <p style={BODY_STYLE}>
                Make your consultants available to respond to subcontractor
                requests from other companies
              </p>
            </div>
            <Switch
              aria-label="Enable Potential Gigs"
              checked={marketplaceFillJobs}
              onCheckedChange={handleFillJobsToggle}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default MarketplaceSettingsTab;
