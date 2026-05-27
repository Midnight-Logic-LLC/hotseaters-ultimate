/**
 * templates-settings-tab.tsx — S09 minimal list view of DocumentTemplate
 * rows for the active tenant. Supports create + soft-delete; the full
 * per-template editor (sections, page settings, services-table,
 * placeholders, signature fields) is deferred to Wave W8.
 *
 * Bible: HotSeatersMVP/src/components/settings/DocumentTemplateManagement.jsx
 *
 * Components → hooks only (RULE B). All I/O lives in `useTemplates()` and
 * `templates-store.ts`.
 *
 * Self-hosted Supabase only. HotSeatersMVP is the bible.
 */

import { useState } from 'react';
import { FileText, Plus, Trash2, Edit, Mail, DollarSign } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
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

import { useTier1 } from '@/app/tier1-provider';
import { useTemplates } from '@/features/company/hooks/use-templates';
import {
  TEMPLATE_TYPES,
  type DocumentTemplateRow,
  type TemplateType,
} from '@/features/company/stores/templates-store';

const LABEL_STYLE = {
  fontSize: 'var(--theme-text-label)',
  color: 'var(--theme-stone-700)',
} as const;

const INPUT_STYLE = {
  borderRadius: 'var(--theme-input-radius)',
  borderWidth: 'var(--theme-input-border)',
  backgroundColor: 'var(--theme-input-bg)',
} as const;

const SELECT_CLASS =
  'w-full px-3 py-2 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500';

const TYPE_ICON: Record<TemplateType, typeof FileText> = {
  document: FileText,
  billing: DollarSign,
  email: Mail,
};

const TYPE_LABEL: Record<TemplateType, string> = {
  document: 'Document',
  billing: 'Billing',
  email: 'Email',
};

function formatDate(iso: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function TemplatesSettingsTab() {
  const { company: tier1Company } = useTier1();
  const companyId = tier1Company?.id ?? null;
  const { templates, isLoading, create, remove, mutating } = useTemplates(companyId);

  const [showForm, setShowForm] = useState(false);
  const [draftName, setDraftName] = useState('');
  const [draftType, setDraftType] = useState<TemplateType>('document');
  const [createError, setCreateError] = useState<string | null>(null);

  const [editingPlaceholder, setEditingPlaceholder] =
    useState<DocumentTemplateRow | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<DocumentTemplateRow | null>(null);

  const resetForm = () => {
    setShowForm(false);
    setDraftName('');
    setDraftType('document');
    setCreateError(null);
  };

  const handleCreate = async () => {
    const name = draftName.trim();
    if (!name) {
      setCreateError('Template name is required');
      return;
    }
    try {
      await create({ name, template_type: draftType });
      resetForm();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Could not create template';
      setCreateError(msg);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await remove(deleteTarget.id);
    } finally {
      setDeleteTarget(null);
    }
  };

  const hasTemplates = templates.length > 0;

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--theme-section-gap)',
      }}
    >
      <Card className="overflow-hidden">
        <CardHeader
          className="flex flex-row items-center justify-between"
          style={{
            backgroundColor: 'var(--theme-card-header-bg)',
            padding: 'var(--theme-card-header-padding)',
          }}
        >
          <CardTitle
            style={{
              fontSize: 'var(--theme-text-card-title)',
              color: 'var(--theme-stone-900)',
            }}
          >
            Document Templates
          </CardTitle>
          {!showForm && (
            <Button
              type="button"
              size="sm"
              onClick={() => setShowForm(true)}
              style={{
                backgroundColor: 'var(--theme-brand-primary)',
                color: 'white',
              }}
              className="hover:opacity-90 transition-opacity"
            >
              <Plus className="w-4 h-4 mr-2" />
              New Template
            </Button>
          )}
        </CardHeader>
        <CardContent style={{ padding: 'var(--theme-card-padding)' }}>
          {showForm && (
            <CreateTemplateForm
              draftName={draftName}
              draftType={draftType}
              onNameChange={setDraftName}
              onTypeChange={setDraftType}
              onCancel={resetForm}
              onSubmit={handleCreate}
              submitting={mutating}
              error={createError}
            />
          )}

          {!showForm && isLoading && (
            <p
              style={{
                fontSize: 'var(--theme-text-body)',
                color: 'var(--theme-stone-500)',
                padding: 'var(--theme-card-gap)',
              }}
            >
              Loading templates…
            </p>
          )}

          {!showForm && !isLoading && !hasTemplates && (
            <EmptyTemplatesState onCreate={() => setShowForm(true)} />
          )}

          {!showForm && hasTemplates && (
            <TemplateList
              templates={templates}
              onEdit={setEditingPlaceholder}
              onDelete={setDeleteTarget}
            />
          )}
        </CardContent>
      </Card>

      {/* Edit-deferred placeholder */}
      {editingPlaceholder && (
        <Card className="overflow-hidden">
          <CardHeader
            style={{
              backgroundColor: 'var(--theme-card-header-bg)',
              padding: 'var(--theme-card-header-padding)',
            }}
            className="flex flex-row items-center justify-between"
          >
            <CardTitle
              style={{
                fontSize: 'var(--theme-text-card-title)',
                color: 'var(--theme-stone-900)',
              }}
            >
              Editing: {editingPlaceholder.name}
            </CardTitle>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setEditingPlaceholder(null)}
            >
              Close
            </Button>
          </CardHeader>
          <CardContent
            style={{ padding: 'var(--theme-card-padding)' }}
            className="text-center"
          >
            <p
              style={{
                fontSize: 'var(--theme-text-body)',
                color: 'var(--theme-stone-700)',
              }}
            >
              Coming soon — full editor in a future update.
            </p>
            <p
              style={{
                fontSize: 'var(--theme-text-caption)',
                color: 'var(--theme-stone-500)',
                marginTop: 'var(--theme-element-gap)',
              }}
            >
              Sections, page settings, placeholders, and signature fields are
              part of Wave W8.
            </p>
          </CardContent>
        </Card>
      )}

      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Template?</AlertDialogTitle>
          </AlertDialogHeader>
          <AlertDialogDescription>
            The template "<strong>{deleteTarget?.name}</strong>" will be
            deactivated and preserved for historical reference. This cannot
            be undone from this screen.
          </AlertDialogDescription>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              style={{
                backgroundColor: 'var(--theme-danger)',
                color: 'white',
              }}
              className="hover:opacity-90 transition-opacity"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// ── Subcomponents ─────────────────────────────────────────────────────────

interface CreateTemplateFormProps {
  draftName: string;
  draftType: TemplateType;
  onNameChange: (value: string) => void;
  onTypeChange: (value: TemplateType) => void;
  onCancel: () => void;
  onSubmit: () => void;
  submitting: boolean;
  error: string | null;
}

function CreateTemplateForm({
  draftName,
  draftType,
  onNameChange,
  onTypeChange,
  onCancel,
  onSubmit,
  submitting,
  error,
}: CreateTemplateFormProps) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--theme-card-gap)',
      }}
    >
      <div className="grid md:grid-cols-2" style={{ gap: 'var(--theme-card-gap)' }}>
        <div>
          <Label htmlFor="template_name" style={LABEL_STYLE}>
            Template Name
          </Label>
          <Input
            id="template_name"
            placeholder="e.g. Standard Engagement Letter"
            value={draftName}
            onChange={(e) => onNameChange(e.target.value)}
            style={INPUT_STYLE}
          />
        </div>
        <div>
          <Label htmlFor="template_type" style={LABEL_STYLE}>
            Type
          </Label>
          <select
            id="template_type"
            value={draftType}
            onChange={(e) => onTypeChange(e.target.value as TemplateType)}
            className={SELECT_CLASS}
          >
            {TEMPLATE_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>
      </div>
      {error && (
        <p
          role="alert"
          style={{
            fontSize: 'var(--theme-text-caption)',
            color: 'var(--theme-danger)',
          }}
        >
          {error}
        </p>
      )}
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel} disabled={submitting}>
          Cancel
        </Button>
        <Button
          type="button"
          onClick={onSubmit}
          disabled={submitting}
          style={{
            backgroundColor: 'var(--theme-brand-primary)',
            color: 'white',
          }}
          className="hover:opacity-90 transition-opacity"
        >
          {submitting ? 'Creating…' : 'Create Template'}
        </Button>
      </div>
    </div>
  );
}

interface EmptyTemplatesStateProps {
  onCreate: () => void;
}

function EmptyTemplatesState({ onCreate }: EmptyTemplatesStateProps) {
  return (
    <div
      className="flex flex-col items-center text-center"
      style={{
        padding: 'var(--theme-card-padding)',
        gap: 'var(--theme-element-gap)',
      }}
    >
      <FileText className="w-10 h-10" style={{ color: 'var(--theme-stone-400)' }} />
      <p
        style={{
          fontSize: 'var(--theme-text-body)',
          color: 'var(--theme-stone-700)',
        }}
      >
        No templates yet. Create your first template.
      </p>
      <Button
        type="button"
        size="sm"
        onClick={onCreate}
        style={{
          backgroundColor: 'var(--theme-brand-primary)',
          color: 'white',
        }}
        className="hover:opacity-90 transition-opacity"
      >
        <Plus className="w-4 h-4 mr-2" />
        New Template
      </Button>
    </div>
  );
}

interface TemplateListProps {
  templates: DocumentTemplateRow[];
  onEdit: (template: DocumentTemplateRow) => void;
  onDelete: (template: DocumentTemplateRow) => void;
}

function TemplateList({ templates, onEdit, onDelete }: TemplateListProps) {
  return (
    <ul
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--theme-element-gap)',
      }}
    >
      {templates.map((template) => {
        const type = (template.template_type ?? 'document') as TemplateType;
        const Icon = TYPE_ICON[type] ?? FileText;
        return (
          <li
            key={template.id}
            className="flex items-center justify-between border rounded-lg"
            style={{
              padding: 'var(--theme-card-padding)',
              borderColor: 'var(--theme-stone-200)',
              backgroundColor: 'var(--theme-stone-50)',
              borderRadius: 'var(--theme-card-radius)',
            }}
          >
            <div className="flex items-center gap-3 min-w-0">
              <Icon
                className="w-5 h-5 flex-shrink-0"
                style={{ color: 'var(--theme-brand-primary)' }}
              />
              <div className="min-w-0">
                <div
                  className="font-semibold truncate"
                  style={{ color: 'var(--theme-stone-900)' }}
                >
                  {template.name}
                </div>
                <div
                  className="flex items-center gap-2"
                  style={{
                    fontSize: 'var(--theme-text-caption)',
                    color: 'var(--theme-stone-500)',
                    marginTop: 'var(--theme-element-gap)',
                  }}
                >
                  <Badge variant="secondary">{TYPE_LABEL[type]}</Badge>
                  <span>Created {formatDate(template.created_at)}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1 flex-shrink-0">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label={`Edit ${template.name}`}
                onClick={() => onEdit(template)}
              >
                <Edit className="w-4 h-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label={`Delete ${template.name}`}
                onClick={() => onDelete(template)}
              >
                <Trash2 className="w-4 h-4" style={{ color: 'var(--theme-danger)' }} />
              </Button>
            </div>
          </li>
        );
      })}
    </ul>
  );
}

export default TemplatesSettingsTab;
