/**
 * service-form.tsx — bible-parity port of
 * `HotSeatersMVP/src/components/settings/ServiceForm.jsx`.
 *
 * Inline form used by services-settings-tab for both new-service entry and
 * row-level inline edit. Reads service-category options from the
 * `useServiceCategories()` hook (RULE B).
 *
 * Self-hosted Supabase only. HotSeatersMVP is the bible.
 */

import { useState, type FormEvent } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';

import { useServiceCategories } from '@/features/company/hooks/use-service-categories';
import type { ServiceRowInput } from '@/features/company/stores/company-store';

export interface ServiceFormValue {
  id?: string;
  name?: string;
  description?: string | null;
  category_id?: string | null;
  base_rate?: number | string | null;
  rate_type?: 'hourly' | 'daily' | 'flat';
  has_daily_minimum?: boolean;
  service_availability?: 'both' | 'pre_trial_only' | 'in_trial_only';
  default_lead_days?: number | string | null;
  default_duration_days?: number | string | null;
  travel_multiplier?: number | string | null;
  is_active?: boolean;
  is_default?: boolean;
}

export interface ServiceFormProps {
  service?: ServiceFormValue | null;
  onSubmit: (data: ServiceRowInput) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

const LABEL_STYLE = {
  fontSize: 'var(--theme-text-label)',
  color: 'var(--theme-stone-700)',
} as const;

const INPUT_STYLE = {
  borderRadius: 'var(--theme-input-radius)',
  borderWidth: 'var(--theme-input-border)',
  backgroundColor: 'white',
} as const;

const NATIVE_SELECT_CLASS =
  'w-full px-3 py-2 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-sm';

interface DraftState {
  name: string;
  description: string;
  category_id: string;
  base_rate: string;
  rate_type: 'hourly' | 'daily' | 'flat';
  has_daily_minimum: boolean;
  service_availability: 'both' | 'pre_trial_only' | 'in_trial_only';
  default_lead_days: string;
  default_duration_days: string;
  travel_multiplier: string;
  is_active: boolean;
}

function seedDraft(service?: ServiceFormValue | null): DraftState {
  return {
    name: service?.name ?? '',
    description: service?.description ?? '',
    category_id: service?.category_id ?? '',
    base_rate:
      service?.base_rate === undefined || service?.base_rate === null
        ? ''
        : String(service.base_rate),
    rate_type: service?.rate_type ?? 'hourly',
    has_daily_minimum: Boolean(service?.has_daily_minimum),
    service_availability: service?.service_availability ?? 'both',
    default_lead_days:
      service?.default_lead_days === undefined ||
      service?.default_lead_days === null
        ? ''
        : String(service.default_lead_days),
    default_duration_days:
      service?.default_duration_days === undefined ||
      service?.default_duration_days === null
        ? ''
        : String(service.default_duration_days),
    travel_multiplier:
      service?.travel_multiplier === undefined ||
      service?.travel_multiplier === null
        ? ''
        : String(service.travel_multiplier),
    is_active: service?.is_active !== false,
  };
}

export function ServiceForm({
  service,
  onSubmit,
  onCancel,
  isLoading = false,
}: ServiceFormProps) {
  const { categories } = useServiceCategories();
  const isTravelTimeService = service?.is_default === true;

  const [draft, setDraft] = useState<DraftState>(() => seedDraft(service));

  const update = <K extends keyof DraftState>(key: K, value: DraftState[K]) => {
    setDraft((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const payload: ServiceRowInput = {
      name: draft.name.trim(),
      description: draft.description.trim() || null,
      category_id: draft.category_id || null,
      base_rate: draft.base_rate ? Number(draft.base_rate) : 0,
      rate_type: draft.rate_type,
      has_daily_minimum: draft.has_daily_minimum,
      service_availability: draft.service_availability,
      default_lead_days: draft.default_lead_days
        ? parseInt(draft.default_lead_days, 10)
        : null,
      default_duration_days: draft.default_duration_days
        ? parseInt(draft.default_duration_days, 10)
        : null,
      travel_multiplier: draft.travel_multiplier
        ? Number(draft.travel_multiplier)
        : null,
      is_active: draft.is_active,
    };
    onSubmit(payload);
  };

  return (
    <form
      onSubmit={handleSubmit}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--theme-card-gap)',
      }}
      aria-label={service?.id ? 'Edit service' : 'New service'}
    >
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Column 1: identity */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--theme-card-gap)',
          }}
        >
          <div>
            <Label htmlFor="service-name" style={LABEL_STYLE}>
              Service Name *
            </Label>
            <Input
              id="service-name"
              required
              placeholder="Hot Seat Operations"
              value={draft.name}
              onChange={(e) => update('name', e.target.value)}
              style={INPUT_STYLE}
            />
          </div>

          <div>
            <Label htmlFor="service-description" style={LABEL_STYLE}>
              Description
            </Label>
            <Textarea
              id="service-description"
              placeholder="Describe this service..."
              rows={3}
              value={draft.description}
              onChange={(e) => update('description', e.target.value)}
              style={INPUT_STYLE}
            />
          </div>

          {!isTravelTimeService && (
            <div>
              <Label htmlFor="service-category" style={LABEL_STYLE}>
                Category
              </Label>
              <select
                id="service-category"
                className={NATIVE_SELECT_CLASS}
                value={draft.category_id}
                onChange={(e) => update('category_id', e.target.value)}
              >
                <option value="">Select category</option>
                {categories
                  .filter((c) => c.is_active)
                  .map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
              </select>
            </div>
          )}
        </div>

        {/* Column 2: rate or travel multiplier */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--theme-card-gap)',
          }}
        >
          {!isTravelTimeService ? (
            <>
              <div>
                <Label htmlFor="service-base-rate" style={LABEL_STYLE}>
                  Base Rate ($) *
                </Label>
                <Input
                  id="service-base-rate"
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  placeholder="150.00"
                  value={draft.base_rate}
                  onChange={(e) => update('base_rate', e.target.value)}
                  style={INPUT_STYLE}
                />
              </div>

              <div>
                <Label htmlFor="service-rate-type" style={LABEL_STYLE}>
                  Rate Type *
                </Label>
                <select
                  id="service-rate-type"
                  className={NATIVE_SELECT_CLASS}
                  value={draft.rate_type}
                  onChange={(e) =>
                    update('rate_type', e.target.value as DraftState['rate_type'])
                  }
                >
                  <option value="hourly">Hourly</option>
                  <option value="daily">Daily</option>
                  <option value="flat">Flat Fee</option>
                </select>
              </div>
            </>
          ) : (
            <div>
              <Label htmlFor="service-travel-multiplier" style={LABEL_STYLE}>
                Travel Multiplier *
              </Label>
              <Input
                id="service-travel-multiplier"
                type="number"
                step="0.01"
                min="0"
                required
                placeholder="0.50"
                value={draft.travel_multiplier}
                onChange={(e) => update('travel_multiplier', e.target.value)}
                style={INPUT_STYLE}
              />
              <p
                style={{
                  fontSize: 'var(--theme-text-caption)',
                  color: 'var(--theme-stone-500)',
                  marginTop: 'calc(var(--theme-element-gap) / 2)',
                }}
              >
                Percentage of associated service rate (e.g., 0.5 = 50%)
              </p>
            </div>
          )}
        </div>

        {/* Column 3: availability + flags */}
        {!isTravelTimeService && (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 'var(--theme-card-gap)',
            }}
          >
            <div>
              <Label htmlFor="service-availability" style={LABEL_STYLE}>
                Service Availability
              </Label>
              <select
                id="service-availability"
                className={NATIVE_SELECT_CLASS}
                value={draft.service_availability}
                onChange={(e) =>
                  update(
                    'service_availability',
                    e.target.value as DraftState['service_availability'],
                  )
                }
              >
                <option value="both">Available Pre-Trial &amp; In-Trial</option>
                <option value="pre_trial_only">Pre-Trial Only</option>
                <option value="in_trial_only">In-Trial Only</option>
              </select>
            </div>

            <div>
              <Label htmlFor="service-lead-days" style={LABEL_STYLE}>
                Default Lead Days (Pre-Trial)
              </Label>
              <Input
                id="service-lead-days"
                type="number"
                min="0"
                placeholder="Days before trial (optional)"
                value={draft.default_lead_days}
                onChange={(e) => update('default_lead_days', e.target.value)}
                disabled={draft.service_availability === 'in_trial_only'}
                style={INPUT_STYLE}
              />
              <p
                style={{
                  fontSize: 'var(--theme-text-caption)',
                  color: 'var(--theme-stone-500)',
                  marginTop: 'calc(var(--theme-element-gap) / 2)',
                }}
              >
                Days before trial start
              </p>
            </div>

            <div className="flex items-center" style={{ gap: 'var(--theme-element-gap)' }}>
              <Checkbox
                id="service-daily-min"
                checked={draft.has_daily_minimum}
                onCheckedChange={(checked) =>
                  update('has_daily_minimum', Boolean(checked))
                }
                disabled={draft.service_availability === 'pre_trial_only'}
              />
              <Label
                htmlFor="service-daily-min"
                className={
                  draft.service_availability === 'pre_trial_only'
                    ? 'cursor-not-allowed opacity-50'
                    : 'cursor-pointer'
                }
                style={LABEL_STYLE}
              >
                Subject to Daily Minimum During Trial
              </Label>
            </div>

            <div className="flex items-center" style={{ gap: 'var(--theme-element-gap)' }}>
              <Checkbox
                id="service-is-active"
                checked={draft.is_active}
                onCheckedChange={(checked) => update('is_active', Boolean(checked))}
              />
              <Label htmlFor="service-is-active" className="cursor-pointer" style={LABEL_STYLE}>
                Active
              </Label>
            </div>
          </div>
        )}
      </div>

      <div className="flex justify-end" style={{ gap: 'var(--theme-element-gap)' }}>
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isLoading}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={isLoading}
          style={{
            backgroundColor: 'var(--theme-brand-primary)',
            color: 'white',
          }}
          className="hover:opacity-90 transition-opacity"
        >
          {isLoading ? 'Saving...' : service?.id ? 'Update Service' : 'Create Service'}
        </Button>
      </div>
    </form>
  );
}

export default ServiceForm;
