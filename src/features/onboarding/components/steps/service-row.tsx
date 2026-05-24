/**
 * service-row.tsx — single service row, rendered as a `<tr>` on desktop
 * (`lg+`) and as a stacked card on mobile (`<lg`).
 *
 * BIBLE: HotSeatersMVP/src/components/onboarding/StepServices.jsx
 *   - `ServiceRowDesktop` (lines 54-108)
 *   - `ServiceCardMobile` (lines 110-152)
 *   - `toggleAvailability` (lines 42-52) — also reproduced here.
 *
 * Two existing canonical fields drive three checkbox columns (per
 * proposal): `service_availability` ('pre_trial_only' | 'in_trial_only' |
 * 'both') feeds Pre-Trial + In-Trial; `has_daily_minimum` feeds Daily Min.
 */
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { X } from 'lucide-react';
import type { ServiceDraft } from '@/features/onboarding/stores/onboarding-store';

type Patch = Partial<ServiceDraft>;

interface ServiceRowProps {
  service: ServiceDraft;
  onUpdate: (id: string, patch: Patch) => void;
  onDelete: (id: string) => void;
}

function deriveAvailability(service: ServiceDraft): { isPre: boolean; isIn: boolean } {
  const a = service.service_availability;
  return {
    isPre: a === 'pre_trial_only' || a === 'both',
    isIn: a === 'in_trial_only' || a === 'both',
  };
}

/** Toggle one of Pre-Trial / In-Trial; collapse into the canonical
 *  `service_availability` enum. Must have at least one — falls back to
 *  `pre_trial_only` when the user un-checks both (bible behaviour). */
function toggleAvailability(
  service: ServiceDraft,
  field: 'pre' | 'in',
  checked: boolean,
  onUpdate: (id: string, patch: Patch) => void,
) {
  const { isPre, isIn } = deriveAvailability(service);
  const newPre = field === 'pre' ? checked : isPre;
  const newIn = field === 'in' ? checked : isIn;
  let availability: ServiceDraft['service_availability'] = 'both';
  if (newPre && !newIn) availability = 'pre_trial_only';
  else if (!newPre && newIn) availability = 'in_trial_only';
  else if (!newPre && !newIn) availability = 'pre_trial_only';
  onUpdate(service.id, { service_availability: availability });
}

function rateSuffix(rateType: string): string {
  if (rateType === 'hourly') return 'hr';
  if (rateType === 'daily') return 'dy';
  return 'flat';
}

export function ServiceRowDesktop({ service, onUpdate, onDelete }: ServiceRowProps) {
  const { isPre, isIn } = deriveAvailability(service);
  return (
    <tr className="border-t border-stone-100 group">
      <td className="py-2 pl-2">
        <div className="flex items-center gap-1">
          <Input
            value={service.name}
            onChange={(e) => onUpdate(service.id, { name: e.target.value })}
            className="h-8 text-sm font-medium border-transparent hover:border-stone-200 focus:border-indigo-300 bg-transparent px-2 -ml-2"
          />
          <button
            type="button"
            onClick={() => onDelete(service.id)}
            className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-stone-400 hover:text-red-500 flex-shrink-0"
            aria-label="Delete service"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </td>
      <td className="py-2 pr-4">
        <div className="flex items-center gap-1 justify-end">
          <div className="relative w-24">
            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-stone-400 text-xs">
              $
            </span>
            <Input
              type="number"
              min={0}
              step="0.01"
              value={service.base_rate}
              onChange={(e) =>
                onUpdate(service.id, { base_rate: parseFloat(e.target.value) || 0 })
              }
              className="h-8 text-sm pl-5 text-right"
            />
          </div>
          <span className="text-xs text-stone-400 w-6">/{rateSuffix(service.rate_type)}</span>
        </div>
      </td>
      <td className="py-2 text-center">
        <Checkbox
          checked={isPre}
          onCheckedChange={(c) => toggleAvailability(service, 'pre', !!c, onUpdate)}
          className="data-[state=checked]:bg-blue-500 data-[state=checked]:border-blue-500"
        />
      </td>
      <td className="py-2 text-center">
        <Checkbox
          checked={isIn}
          onCheckedChange={(c) => toggleAvailability(service, 'in', !!c, onUpdate)}
          className="data-[state=checked]:bg-purple-500 data-[state=checked]:border-purple-500"
        />
      </td>
      <td className="py-2 text-center">
        <Checkbox
          checked={!!service.has_daily_minimum}
          onCheckedChange={(c) => onUpdate(service.id, { has_daily_minimum: !!c })}
          className="data-[state=checked]:bg-green-600 data-[state=checked]:border-green-600"
        />
      </td>
    </tr>
  );
}

export function ServiceCardMobile({ service, onUpdate, onDelete }: ServiceRowProps) {
  const { isPre, isIn } = deriveAvailability(service);
  return (
    <div className="border border-stone-200 rounded-lg p-3 bg-white">
      <div className="flex items-center gap-2">
        <div className="flex-1 min-w-0">
          <Input
            value={service.name}
            onChange={(e) => onUpdate(service.id, { name: e.target.value })}
            className="h-8 text-sm font-medium border-transparent hover:border-stone-200 focus:border-indigo-300 bg-transparent px-2"
          />
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          <div className="relative w-20">
            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-stone-400 text-xs">
              $
            </span>
            <Input
              type="number"
              min={0}
              step="0.01"
              value={service.base_rate}
              onChange={(e) =>
                onUpdate(service.id, { base_rate: parseFloat(e.target.value) || 0 })
              }
              className="h-8 text-sm pl-5 text-right"
            />
          </div>
          <span className="text-xs text-stone-400 w-6">
            /
            {service.rate_type === 'hourly' ? 'hr' : service.rate_type === 'daily' ? 'day' : 'flat'}
          </span>
          <button
            type="button"
            onClick={() => onDelete(service.id)}
            className="p-1 text-stone-400 hover:text-red-500 flex-shrink-0"
            aria-label="Delete service"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
      <div className="flex items-center gap-3 mt-2 ml-2">
        <label className="flex items-center gap-1.5 text-xs text-blue-600">
          <Checkbox
            checked={isPre}
            onCheckedChange={(c) => toggleAvailability(service, 'pre', !!c, onUpdate)}
            className="h-3.5 w-3.5 data-[state=checked]:bg-blue-500 data-[state=checked]:border-blue-500"
          />{' '}
          Pre-Trial
        </label>
        <label className="flex items-center gap-1.5 text-xs text-purple-600">
          <Checkbox
            checked={isIn}
            onCheckedChange={(c) => toggleAvailability(service, 'in', !!c, onUpdate)}
            className="h-3.5 w-3.5 data-[state=checked]:bg-purple-500 data-[state=checked]:border-purple-500"
          />{' '}
          In-Trial
        </label>
        <label className="flex items-center gap-1.5 text-xs text-green-600">
          <Checkbox
            checked={!!service.has_daily_minimum}
            onCheckedChange={(c) => onUpdate(service.id, { has_daily_minimum: !!c })}
            className="h-3.5 w-3.5 data-[state=checked]:bg-green-600 data-[state=checked]:border-green-600"
          />{' '}
          Daily Min
        </label>
      </div>
    </div>
  );
}
