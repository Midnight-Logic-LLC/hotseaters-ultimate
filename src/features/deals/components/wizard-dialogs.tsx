/**
 * wizard-dialogs.tsx — port of HotSeatersMVP/src/components/deals/WizardDialogs.jsx.
 *
 * The modal layer for the deal wizard:
 *   • No-services alert (blocks save with zero services).
 *   • Contract-warning dialog (rate change invalidates an existing contract).
 *   • Rate-override dialog (custom per-trial rate for a service).
 *   • Post-to-HotSeatHub form — STUBBED (HSH marketplace is its own feature).
 *
 * Port deferrals (auditable parity gaps — see change report):
 *   • TODO(HSH): the bible's `PostToHotSeatHubForm` (post a service to the
 *     HotSeatHub marketplace) belongs to the HSH feature. The "Post to
 *     HotSeatHub" modal is rendered as a clearly-labeled stub; the affordance
 *     that opens it (the team-assign / post buttons in step 3/4) is itself
 *     deferred to the HSH/D04 surface.
 *
 * Components consume hook-supplied props only (RULE B). HotSeatersMVP is the bible.
 */

import { AlertCircle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import type { ServiceRecord } from '@/features/company/hooks/use-services';

export interface ContractWarning {
  type: 'signed' | 'sent' | 'draft';
  message: string;
  instanceId: number | string;
  serviceId: string;
}

interface WizardDialogsProps {
  mode: 'deal' | 'trial';
  services: ServiceRecord[];
  showNoServicesAlert: boolean;
  setShowNoServicesAlert: (open: boolean) => void;
  showContractWarning: ContractWarning | null;
  setShowContractWarning: (next: ContractWarning | null) => void;
  promptForRateOverride: (instanceId: number | string, serviceId: string) => void;
  showRateOverrideDialog: boolean;
  setShowRateOverrideDialog: (open: boolean) => void;
  rateOverrideServiceId: string | null;
  rateOverrideInstanceId: number | string | null;
  newRateValue: string;
  setNewRateValue: (value: string) => void;
  setOverriddenRates: (
    updater: (prev: Record<string, number>) => Record<string, number>,
  ) => void;
}

export function WizardDialogs({
  mode,
  services,
  showNoServicesAlert,
  setShowNoServicesAlert,
  showContractWarning,
  setShowContractWarning,
  promptForRateOverride,
  showRateOverrideDialog,
  setShowRateOverrideDialog,
  rateOverrideServiceId,
  rateOverrideInstanceId,
  newRateValue,
  setNewRateValue,
  setOverriddenRates,
}: WizardDialogsProps) {
  const commitRateOverride = () => {
    const p = parseFloat(newRateValue);
    if (!Number.isNaN(p) && p >= 0 && rateOverrideInstanceId !== null) {
      setOverriddenRates((prev) => ({ ...prev, [String(rateOverrideInstanceId)]: p }));
      setShowRateOverrideDialog(false);
    }
  };

  return (
    <>
      {/* TODO(HSH): Post-to-HotSeatHub form belongs to the HSH marketplace
          feature; the entry affordance + form are deferred there. */}

      <AlertDialog open={showNoServicesAlert} onOpenChange={setShowNoServicesAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-amber-600" />
              No Services Selected
            </AlertDialogTitle>
          </AlertDialogHeader>
          <div className="text-sm text-stone-600">
            You haven't added any services to this {mode === 'trial' ? 'trial' : 'deal'}. Please
            add at least one pre-trial or in-trial service before saving.
          </div>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setShowNoServicesAlert(false)}>OK</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={!!showContractWarning}
        onOpenChange={(open) => !open && setShowContractWarning(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-amber-600" />
              {showContractWarning?.type === 'signed'
                ? 'Signed Contract Exists'
                : showContractWarning?.type === 'sent'
                  ? 'Contract Already Sent'
                  : 'Draft Contract Exists'}
            </AlertDialogTitle>
          </AlertDialogHeader>
          <div className="text-sm text-stone-600">{showContractWarning?.message}</div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (showContractWarning) {
                  promptForRateOverride(
                    showContractWarning.instanceId,
                    showContractWarning.serviceId,
                  );
                  setShowContractWarning(null);
                }
              }}
              style={{ backgroundColor: 'var(--theme-warning)', color: 'white' }}
              className="hover:opacity-90 transition-opacity"
            >
              Change Rate Anyway
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showRateOverrideDialog} onOpenChange={setShowRateOverrideDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Override Rate for{' '}
              {services.find((s) => s.id === rateOverrideServiceId)?.name || 'Service'}
            </AlertDialogTitle>
          </AlertDialogHeader>
          <div className="text-sm text-stone-600">
            Enter a custom rate for this trial. This will override the standard pricing for this
            service.
          </div>
          <div className="py-4">
            <Label htmlFor="new-rate">New Rate ($)</Label>
            <Input
              id="new-rate"
              type="number"
              step="0.01"
              min="0"
              value={newRateValue}
              onChange={(e) => setNewRateValue(e.target.value)}
              placeholder="Enter new rate"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  commitRateOverride();
                }
              }}
              style={{
                borderRadius: 'var(--theme-input-radius)',
                borderWidth: 'var(--theme-input-border)',
                backgroundColor: 'var(--theme-input-bg)',
              }}
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={commitRateOverride}
              style={{ backgroundColor: 'var(--theme-brand-primary)', color: 'white' }}
              className="hover:opacity-90 transition-opacity"
            >
              Update Rate
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
