/**
 * publish-seed-defaults-button.tsx — adapted port of
 * `HotSeatersMVP/src/components/settings/PublishSeedDefaultsButton.jsx`.
 *
 * Renders ONLY when the current user is the seed superadmin (gated through
 * `useTier1` + the pure `isSeedSuperadmin` business rule, both consumed via
 * `usePublishSeedDefaults`). Otherwise renders nothing.
 *
 * Behaviour: opens a confirmation dialog with an optional notes textarea,
 * calls the publish action through the hook, and reflects loading / success /
 * error states inline.
 *
 * Components → hooks only (RULE B). All I/O lives in the hook + store.
 *
 * Self-hosted Supabase only. HotSeatersMVP is the bible.
 */

import { useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Loader2,
  Sprout,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';

import { usePublishSeedDefaults } from '@/features/company/hooks/use-publish-seed-defaults';

export interface PublishSeedDefaultsButtonProps {
  className?: string;
}

export function PublishSeedDefaultsButton({
  className = '',
}: PublishSeedDefaultsButtonProps) {
  const { isSuperadmin, state, result, error, publish, reset } =
    usePublishSeedDefaults();

  const [open, setOpen] = useState(false);
  const [notes, setNotes] = useState('');

  if (!isSuperadmin) return null;

  const isPublishing = state === 'publishing';
  const isSuccess = state === 'success';
  const isError = state === 'error';

  const handleClose = () => {
    setOpen(false);
    setNotes('');
    reset();
  };

  const handlePublish = async () => {
    await publish(notes.trim() || undefined);
  };

  return (
    <>
      <Button
        variant="outline"
        onClick={() => setOpen(true)}
        className={`border-emerald-300 text-emerald-700 hover:bg-emerald-50 ${className}`}
      >
        <Sprout className="mr-2 h-4 w-4" />
        Publish Seed Defaults
      </Button>

      <Dialog
        open={open}
        onOpenChange={(o) => (o ? setOpen(true) : handleClose())}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sprout className="h-5 w-5 text-emerald-600" />
              Publish Seed Defaults
            </DialogTitle>
            <DialogDescription>
              Exports the seed company's current configuration to the live
              snapshot used by new-customer onboarding. Existing customers are{' '}
              <strong>not</strong> affected.
            </DialogDescription>
          </DialogHeader>

          {!isSuccess && !isError && (
            <div className="space-y-2">
              <label
                htmlFor="publish-seed-notes"
                className="text-stone-700 text-sm font-medium"
              >
                Notes (optional)
              </label>
              <Textarea
                id="publish-seed-notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Updated default Hot Seat rate"
                rows={2}
              />
            </div>
          )}

          {isSuccess && result && (
            <div
              role="status"
              className="flex items-center gap-2 rounded border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800"
            >
              <CheckCircle2 className="h-4 w-4" />
              <span>
                Published version{' '}
                <strong>{result.version ?? 'latest'}</strong>
              </span>
            </div>
          )}

          {isError && (
            <div
              role="alert"
              className="flex items-start gap-2 rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700"
            >
              <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0" />
              <span>{error ?? 'Publish failed'}</span>
            </div>
          )}

          <DialogFooter>
            {!isSuccess ? (
              <>
                <Button
                  variant="outline"
                  onClick={handleClose}
                  disabled={isPublishing}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handlePublish}
                  disabled={isPublishing}
                  className="bg-emerald-600 text-white hover:bg-emerald-700"
                >
                  {isPublishing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Publishing…
                    </>
                  ) : (
                    <>
                      <Sprout className="mr-2 h-4 w-4" />
                      Publish
                    </>
                  )}
                </Button>
              </>
            ) : (
              <Button onClick={handleClose}>Done</Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
