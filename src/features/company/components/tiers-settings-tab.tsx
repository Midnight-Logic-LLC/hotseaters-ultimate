/**
 * tiers-settings-tab.tsx — full-parity port of the Consultant Tiers
 * section of `HotSeatersMVP/src/components/settings/TierManagement.jsx`.
 *
 * - Renders the live list of consultant tiers from Tier1Provider.
 * - Inline edit (click the pencil icon → editable row).
 * - Add new tier via the bible's `TierForm` (name + multiplier +
 *   description + is_active).
 * - Delete via AlertDialog confirmation.
 *
 * Components → hooks only (RULE B); the hook owns all I/O via the
 * tiers store (RULE C / RULE D). UI primitives only — no raw HTML
 * elements where a shadcn primitive exists (RULE G).
 *
 * HotSeatersMVP is the bible. Self-hosted Supabase only.
 */

import { useState } from 'react';
import { Edit, Plus, Trash2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

import { useTiers, type ConsultantTierDraft } from '@/features/company/hooks/use-tiers';
import type { LookupRow } from '@/shared/db/lookups-selectors';

const EMPTY_DRAFT: ConsultantTierDraft = {
  name: '',
  multiplier: 1.0,
  description: '',
  is_active: true,
};

const BRAND_BUTTON_STYLE = {
  backgroundColor: 'var(--theme-brand-primary)',
  color: 'white',
} as const;

function tierToDraft(tier: LookupRow): ConsultantTierDraft {
  const description =
    (tier.extra_schema?.description as string | undefined) ?? '';
  return {
    name: tier.name,
    multiplier:
      typeof tier.multiplier === 'number' && Number.isFinite(tier.multiplier)
        ? tier.multiplier
        : 1.0,
    description,
    is_active: tier.is_active !== false,
  };
}

interface TierFormProps {
  initial?: ConsultantTierDraft;
  isLoading: boolean;
  onSubmit: (draft: ConsultantTierDraft) => void;
  onCancel: () => void;
  submitLabel: string;
}

function TierForm({
  initial,
  isLoading,
  onSubmit,
  onCancel,
  submitLabel,
}: TierFormProps) {
  const [draft, setDraft] = useState<ConsultantTierDraft>(initial ?? EMPTY_DRAFT);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(draft);
      }}
      className="space-y-4 rounded-lg border border-stone-200 bg-stone-50 p-4"
    >
      <div>
        <Label htmlFor="tier-form-name">Tier Name *</Label>
        <Input
          id="tier-form-name"
          value={draft.name}
          onChange={(e) => setDraft({ ...draft, name: e.target.value })}
          placeholder="e.g., Senior"
          required
        />
      </div>

      <div>
        <Label htmlFor="tier-form-multiplier">Price Multiplier *</Label>
        <Input
          id="tier-form-multiplier"
          type="number"
          step="0.01"
          min="0"
          value={draft.multiplier}
          onChange={(e) =>
            setDraft({ ...draft, multiplier: parseFloat(e.target.value) })
          }
          required
        />
        <p className="mt-1 text-xs text-stone-500">
          1.0 = standard rate, 0.9 = 10% discount, 1.2 = 20% premium
        </p>
      </div>

      <div>
        <Label htmlFor="tier-form-description">Description</Label>
        <Textarea
          id="tier-form-description"
          value={draft.description}
          onChange={(e) => setDraft({ ...draft, description: e.target.value })}
          placeholder="Optional description"
          rows={2}
        />
      </div>

      <div className="flex items-center gap-2">
        <Checkbox
          id="tier-form-active"
          checked={draft.is_active}
          onCheckedChange={(checked) =>
            setDraft({ ...draft, is_active: checked === true })
          }
        />
        <Label htmlFor="tier-form-active" className="cursor-pointer">
          Active
        </Label>
      </div>

      <div className="flex justify-end gap-2 pt-2">
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
          style={BRAND_BUTTON_STYLE}
          className="hover:opacity-90 transition-opacity"
        >
          {isLoading ? 'Saving...' : submitLabel}
        </Button>
      </div>
    </form>
  );
}

interface InlineEditRowProps {
  tier: LookupRow;
  isSaving: boolean;
  onSave: (patch: Partial<ConsultantTierDraft>) => void;
  onCancel: () => void;
}

function InlineEditRow({ tier, isSaving, onSave, onCancel }: InlineEditRowProps) {
  const [draft, setDraft] = useState<ConsultantTierDraft>(tierToDraft(tier));

  const handleSave = () => {
    onSave({
      name: draft.name,
      multiplier:
        typeof draft.multiplier === 'string'
          ? parseFloat(draft.multiplier)
          : draft.multiplier,
      description: draft.description,
      is_active: draft.is_active,
    });
  };

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-12 items-start gap-3">
        <div className="col-span-3">
          <Label htmlFor={`consultant-name-${tier.id}`} className="text-xs">
            Tier Name *
          </Label>
          <Input
            id={`consultant-name-${tier.id}`}
            value={draft.name}
            onChange={(e) => setDraft({ ...draft, name: e.target.value })}
            className="h-9 bg-white"
            required
          />
        </div>
        <div className="col-span-5">
          <Label
            htmlFor={`consultant-description-${tier.id}`}
            className="text-xs"
          >
            Description
          </Label>
          <Input
            id={`consultant-description-${tier.id}`}
            value={draft.description}
            onChange={(e) =>
              setDraft({ ...draft, description: e.target.value })
            }
            className="h-9 bg-white"
            placeholder="Optional"
          />
        </div>
        <div className="col-span-3">
          <Label
            htmlFor={`consultant-multiplier-${tier.id}`}
            className="text-xs"
          >
            Multiplier *
          </Label>
          <Input
            id={`consultant-multiplier-${tier.id}`}
            type="number"
            step="0.01"
            min="0"
            value={draft.multiplier}
            onChange={(e) =>
              setDraft({
                ...draft,
                multiplier: parseFloat(e.target.value),
              })
            }
            className="h-9 bg-white"
            required
          />
          <p className="mt-1 text-xs text-stone-500">
            1.0 = standard, 0.9 = 10% off, 1.2 = 20% markup
          </p>
        </div>
        <div className="col-span-1">
          <Label htmlFor={`consultant-active-${tier.id}`} className="text-xs">
            Active
          </Label>
          <div className="flex h-9 items-center">
            <Switch
              id={`consultant-active-${tier.id}`}
              checked={draft.is_active}
              onCheckedChange={(checked) =>
                setDraft({ ...draft, is_active: checked })
              }
            />
          </div>
        </div>
      </div>
      <div className="flex justify-end gap-2 border-t pt-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onCancel}
          disabled={isSaving}
        >
          Cancel
        </Button>
        <Button
          size="sm"
          onClick={handleSave}
          disabled={isSaving}
          style={BRAND_BUTTON_STYLE}
          className="hover:opacity-90 transition-opacity"
        >
          {isSaving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>
    </div>
  );
}

interface TierDisplayRowProps {
  tier: LookupRow;
  onEdit: () => void;
  onDelete: () => void;
}

function TierDisplayRow({ tier, onEdit, onDelete }: TierDisplayRowProps) {
  const description =
    (tier.extra_schema?.description as string | undefined) ?? '';
  const multiplier =
    typeof tier.multiplier === 'number' ? tier.multiplier : 1.0;
  return (
    <div className="flex items-center justify-between">
      <div className="flex-1">
        <div className="flex items-center gap-3">
          <h4 className="font-semibold text-stone-900">{tier.name}</h4>
          <span className="text-sm text-stone-600">×{multiplier}</span>
          {!tier.is_active && (
            <span className="rounded bg-stone-100 px-2 py-1 text-xs text-stone-600">
              Inactive
            </span>
          )}
        </div>
        {description && (
          <p className="mt-1 text-sm text-stone-600">{description}</p>
        )}
      </div>
      <div className="flex gap-2">
        <Button
          variant="ghost"
          size="icon"
          aria-label={`Edit ${tier.name}`}
          onClick={onEdit}
        >
          <Edit className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          aria-label={`Delete ${tier.name}`}
          onClick={onDelete}
        >
          <Trash2 className="h-4 w-4 text-red-500" />
        </Button>
      </div>
    </div>
  );
}

export function TiersSettingsTab() {
  const { consultantTiers, saving, createTier, updateTier, deleteTier } =
    useTiers();

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  const handleCreate = async (draft: ConsultantTierDraft) => {
    await createTier(draft);
    setShowForm(false);
  };

  const handleInlineSave = async (
    id: string,
    patch: Partial<ConsultantTierDraft>,
  ) => {
    await updateTier(id, patch);
    setEditingId(null);
  };

  const handleConfirmDelete = async () => {
    if (!pendingDeleteId) return;
    const id = pendingDeleteId;
    setPendingDeleteId(null);
    await deleteTier(id);
  };

  const pendingDeleteTier =
    pendingDeleteId !== null
      ? consultantTiers.find((t) => t.id === pendingDeleteId) ?? null
      : null;

  return (
    <div className="space-y-8">
      <Card className="overflow-hidden">
        <CardHeader
          style={{
            backgroundColor: 'var(--theme-card-header-bg)',
            padding: 'var(--theme-card-header-padding)',
          }}
        >
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Consultant Tiers</CardTitle>
            <Button
              size="sm"
              onClick={() => {
                setShowForm(true);
                setEditingId(null);
              }}
              style={BRAND_BUTTON_STYLE}
              className="hover:opacity-90 transition-opacity"
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Tier
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 p-6">
          {showForm && (
            <TierForm
              isLoading={saving}
              onSubmit={handleCreate}
              onCancel={() => setShowForm(false)}
              submitLabel="Create"
            />
          )}

          <div className="space-y-3">
            {consultantTiers.map((tier) => {
              const isEditing = editingId === tier.id;
              return (
                <div
                  key={tier.id}
                  className={`rounded-lg border border-stone-200 p-4 ${
                    isEditing ? 'bg-green-50' : 'bg-stone-50'
                  }`}
                >
                  {isEditing ? (
                    <InlineEditRow
                      tier={tier}
                      isSaving={saving}
                      onSave={(patch) => handleInlineSave(tier.id, patch)}
                      onCancel={() => setEditingId(null)}
                    />
                  ) : (
                    <TierDisplayRow
                      tier={tier}
                      onEdit={() => {
                        setEditingId(tier.id);
                        setShowForm(false);
                      }}
                      onDelete={() => setPendingDeleteId(tier.id)}
                    />
                  )}
                </div>
              );
            })}

            {consultantTiers.length === 0 && !showForm && (
              <p className="py-6 text-center text-stone-500">
                No consultant tiers configured
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      <AlertDialog
        open={pendingDeleteId !== null}
        onOpenChange={(open) => {
          if (!open) setPendingDeleteId(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this tier?</AlertDialogTitle>
            <AlertDialogDescription>
              {pendingDeleteTier
                ? `“${pendingDeleteTier.name}” will be removed. Existing assignments to this tier will lose their multiplier.`
                : 'This tier will be removed.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              style={{ backgroundColor: '#dc2626', color: 'white' }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default TiersSettingsTab;
