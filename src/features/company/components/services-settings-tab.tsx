/**
 * services-settings-tab.tsx — bible-parity port of
 * `HotSeatersMVP/src/components/settings/ServicesTab.jsx`.
 *
 * Two-level reorderable list (categories → services within each category)
 * with inline edit, deactivate-vs-delete based on trial usage, and an
 * "Uncategorized" bucket for services with no category.
 *
 * DnD via @dnd-kit (the repo's canonical primitive — same pattern as
 * `pipeline-settings-tab.tsx` and the onboarding tier editor).
 *
 * Components → hooks (RULE B). All Supabase I/O is hidden behind the
 * services / categories / company-trial-services hooks.
 *
 * Self-hosted Supabase only. HotSeatersMVP is the bible.
 */

import { useEffect, useMemo, useState } from 'react';
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  AlertTriangle,
  Check,
  ChevronDown,
  DollarSign,
  Edit,
  Eye,
  EyeOff,
  GripVertical,
  Plus,
  RotateCcw,
  Trash2,
  X,
} from 'lucide-react';

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
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';

import { useTier1 } from '@/app/tier1-provider';
import { useServices, type ServiceRecord } from '@/features/company/hooks/use-services';
import {
  useServiceCategories,
  type ServiceCategoryRecord,
} from '@/features/company/hooks/use-service-categories';
import { useCompanyTrialServices } from '@/features/company/hooks/use-company-trial-services';
import { useCompanySettings } from '@/features/company/hooks/use-company-settings';
import { ServiceForm, type ServiceFormValue } from './service-form';
import type { ServiceRowInput } from '@/features/company/stores/company-store';

interface DeleteServiceTarget extends ServiceRecord {
  isUsed: boolean;
}

interface DeleteCategoryTarget extends ServiceCategoryRecord {
  activeServiceCount: number;
  inactiveServiceCount: number;
}

export function ServicesSettingsTab() {
  const { company } = useTier1();
  const companyId = company?.id ?? null;

  const {
    services,
    create: createService,
    update: updateService,
    remove: removeService,
    deactivate: deactivateService,
    reactivate: reactivateService,
    reorder: reorderServices,
    saving: savingService,
  } = useServices();
  const {
    categories,
    create: createCategory,
    update: updateCategory,
    remove: removeCategory,
    deactivate: deactivateCategory,
    reactivate: reactivateCategory,
    reorder: reorderCategories,
    saving: savingCategory,
  } = useServiceCategories();
  const { trialServices } = useCompanyTrialServices(companyId);
  const { company: companyRow } = useCompanySettings(companyId);

  const defaultDailyMinHours = useMemo<number>(() => {
    const raw = (companyRow?.default_daily_minimum_hours as unknown) ?? 8;
    const n = Number(raw);
    return Number.isFinite(n) && n > 0 ? n : 8;
  }, [companyRow]);

  // ── Local UI state ─────────────────────────────────────────────────────
  const [showServiceForm, setShowServiceForm] = useState(false);
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [editingCategoryDraftName, setEditingCategoryDraftName] = useState('');
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({
    uncategorized: true,
  });
  const [inlineEditingCategoryId, setInlineEditingCategoryId] = useState<string | null>(
    null,
  );
  const [inlineEditValue, setInlineEditValue] = useState('');
  const [inlineEditingServiceId, setInlineEditingServiceId] = useState<string | null>(
    null,
  );
  const [deleteServiceConfirm, setDeleteServiceConfirm] =
    useState<DeleteServiceTarget | null>(null);
  const [deleteCategoryConfirm, setDeleteCategoryConfirm] =
    useState<DeleteCategoryTarget | null>(null);
  const [showInactiveItems, setShowInactiveItems] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  useEffect(() => {
    if (categories.length === 0) return;
    setCollapsedGroups((prev) => {
      if (Object.keys(prev).length > 1) return prev;
      const next: Record<string, boolean> = { uncategorized: true };
      categories.forEach((c) => {
        next[c.id] = true;
      });
      return next;
    });
  }, [categories]);

  const visibleCategories = categories.filter((c) =>
    showInactiveItems ? true : c.is_active,
  );

  const servicesForCategory = (categoryId: string): ServiceRecord[] =>
    services
      .filter((s) => s.category_id === categoryId)
      .filter((s) => (showInactiveItems ? true : s.is_active))
      .sort((a, b) => a.order - b.order);

  const uncategorizedServices = services
    .filter((s) => !s.category_id)
    .filter((s) => (showInactiveItems ? true : s.is_active))
    .sort((a, b) => a.name.localeCompare(b.name));

  const handleSubmitService = async (data: ServiceRowInput) => {
    if (inlineEditingServiceId) {
      await updateService(inlineEditingServiceId, data);
      setInlineEditingServiceId(null);
    } else {
      await createService({ ...data, company_id: companyId });
      setShowServiceForm(false);
    }
  };

  const handleDeleteService = (service: ServiceRecord) => {
    const isUsed = trialServices.some(
      (ts) => (ts as { service_id?: string }).service_id === service.id,
    );
    setDeleteServiceConfirm({ ...service, isUsed });
  };

  const confirmDeleteService = async () => {
    if (!deleteServiceConfirm) return;
    if (deleteServiceConfirm.isUsed) {
      await deactivateService(deleteServiceConfirm.id);
    } else {
      await removeService(deleteServiceConfirm.id);
    }
    setDeleteServiceConfirm(null);
  };

  const handleSubmitCategoryNew = async () => {
    const name = editingCategoryDraftName.trim();
    if (!name) return;
    await createCategory({ name, company_id: companyId });
    setEditingCategoryDraftName('');
    setShowCategoryForm(false);
  };

  const handleDeleteCategory = (category: ServiceCategoryRecord) => {
    const inCategory = services.filter((s) => s.category_id === category.id);
    setDeleteCategoryConfirm({
      ...category,
      activeServiceCount: inCategory.filter((s) => s.is_active).length,
      inactiveServiceCount: inCategory.filter((s) => !s.is_active).length,
    });
  };

  const confirmDeleteCategory = async () => {
    if (!deleteCategoryConfirm) return;
    if (deleteCategoryConfirm.inactiveServiceCount > 0) {
      await deactivateCategory(deleteCategoryConfirm.id);
    } else {
      await removeCategory(deleteCategoryConfirm.id);
    }
    setDeleteCategoryConfirm(null);
  };

  const handleCategoryDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = visibleCategories.findIndex((c) => c.id === active.id);
    const newIndex = visibleCategories.findIndex((c) => c.id === over.id);
    if (oldIndex < 0 || newIndex < 0) return;
    const reordered = arrayMove(visibleCategories, oldIndex, newIndex);
    void reorderCategories(reordered.map((c) => c.id));
  };

  const handleServiceDragEnd = (event: DragEndEvent, categoryId: string) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const list = servicesForCategory(categoryId);
    const oldIndex = list.findIndex((s) => s.id === active.id);
    const newIndex = list.findIndex((s) => s.id === over.id);
    if (oldIndex < 0 || newIndex < 0) return;
    const reordered = arrayMove(list, oldIndex, newIndex);
    void reorderServices(reordered.map((s) => s.id));
  };

  const toServiceFormValue = (service: ServiceRecord): ServiceFormValue => ({
    id: service.id,
    name: service.name,
    description: service.description,
    category_id: service.category_id,
    base_rate: service.base_rate,
    rate_type: service.rate_type,
    has_daily_minimum: service.has_daily_minimum,
    service_availability: service.service_availability,
    default_lead_days: service.default_lead_days,
    default_duration_days: service.default_duration_days,
    travel_multiplier: service.travel_multiplier,
    is_active: service.is_active,
    is_default: service.is_default,
  });

  return (
    <>
      <Card
        className="mb-6 overflow-hidden"
        style={{
          borderRadius: 'var(--theme-card-radius)',
          boxShadow: 'var(--theme-card-shadow)',
          backgroundColor: 'var(--theme-card-bg)',
        }}
      >
        <CardHeader
          style={{
            backgroundColor: 'var(--theme-card-header-bg)',
            padding: 'var(--theme-card-header-padding)',
          }}
        >
          <div className="flex items-center justify-between">
            <CardTitle
              style={{
                fontSize: 'var(--theme-text-card-title)',
                color: 'var(--theme-stone-900)',
              }}
            >
              Services &amp; Rates
            </CardTitle>
            <div className="flex items-center" style={{ gap: 'var(--theme-card-gap)' }}>
              <div
                className="flex items-center"
                style={{ gap: 'var(--theme-element-gap)' }}
              >
                <Switch
                  id="show-inactive-services"
                  checked={showInactiveItems}
                  onCheckedChange={setShowInactiveItems}
                />
                <Label
                  htmlFor="show-inactive-services"
                  className="flex items-center cursor-pointer"
                  style={{
                    gap: 'var(--theme-element-gap)',
                    fontSize: 'var(--theme-text-body)',
                    color: 'var(--theme-stone-600)',
                  }}
                >
                  {showInactiveItems ? (
                    <Eye className="w-4 h-4" />
                  ) : (
                    <EyeOff className="w-4 h-4" />
                  )}
                  Active
                </Label>
              </div>
              <div className="flex" style={{ gap: 'var(--theme-element-gap)' }}>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowCategoryForm(true);
                    setEditingCategoryDraftName('');
                    setShowServiceForm(false);
                    setInlineEditingServiceId(null);
                  }}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Category
                </Button>
                <Button
                  onClick={() => {
                    setShowServiceForm(true);
                    setShowCategoryForm(false);
                    setInlineEditingServiceId(null);
                  }}
                  style={{
                    backgroundColor: 'var(--theme-brand-primary)',
                    color: 'white',
                  }}
                  className="hover:opacity-90 transition-opacity"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Service
                </Button>
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      <div className="px-2">
        {showCategoryForm && (
          <div className="border-b border-stone-200 pb-4 mb-6">
            <div className="flex items-center gap-2">
              <GripVertical className="w-5 h-5 text-stone-300" />
              <div className="w-1 h-6 bg-indigo-600 rounded-full" />
              <Input
                value={editingCategoryDraftName}
                onChange={(e) => setEditingCategoryDraftName(e.target.value)}
                placeholder="Category name"
                className="h-8 flex-1"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    void handleSubmitCategoryNew();
                  } else if (e.key === 'Escape') {
                    setShowCategoryForm(false);
                    setEditingCategoryDraftName('');
                  }
                }}
              />
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50"
                onClick={() => void handleSubmitCategoryNew()}
                disabled={!editingCategoryDraftName.trim() || savingCategory}
                aria-label="Save category"
              >
                <Check className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => {
                  setShowCategoryForm(false);
                  setEditingCategoryDraftName('');
                }}
                aria-label="Cancel category"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}

        {showServiceForm ? (
          <ServiceForm
            onSubmit={handleSubmitService}
            onCancel={() => setShowServiceForm(false)}
            isLoading={savingService}
          />
        ) : (
          <div className="space-y-6">
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleCategoryDragEnd}
            >
              <SortableContext
                items={visibleCategories.map((c) => c.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-2">
                  {visibleCategories.map((category) => (
                    <SortableCategoryGroup
                      key={category.id}
                      category={category}
                      services={servicesForCategory(category.id)}
                      collapsed={collapsedGroups[category.id] ?? true}
                      isInlineEditing={inlineEditingCategoryId === category.id}
                      inlineEditValue={inlineEditValue}
                      defaultDailyMinHours={defaultDailyMinHours}
                      inlineEditingServiceId={inlineEditingServiceId}
                      savingService={savingService}
                      sensors={sensors}
                      onToggleCollapsed={() =>
                        setCollapsedGroups((prev) => ({
                          ...prev,
                          [category.id]: !prev[category.id],
                        }))
                      }
                      onStartInlineEdit={() => {
                        setInlineEditingCategoryId(category.id);
                        setInlineEditValue(category.name);
                        setShowServiceForm(false);
                      }}
                      onChangeInlineEdit={setInlineEditValue}
                      onCommitInlineEdit={() => {
                        const v = inlineEditValue.trim();
                        if (v) {
                          void updateCategory(category.id, { name: v });
                          setInlineEditingCategoryId(null);
                        }
                      }}
                      onCancelInlineEdit={() => setInlineEditingCategoryId(null)}
                      onReactivateCategory={() => void reactivateCategory(category.id)}
                      onDeleteCategory={() => handleDeleteCategory(category)}
                      onStartEditService={(id) => setInlineEditingServiceId(id)}
                      onCancelEditService={() => setInlineEditingServiceId(null)}
                      onSubmitEditService={handleSubmitService}
                      onDeleteService={handleDeleteService}
                      onReactivateService={(id) => void reactivateService(id)}
                      onServiceDragEnd={(ev) => handleServiceDragEnd(ev, category.id)}
                      toServiceFormValue={toServiceFormValue}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>

            {uncategorizedServices.length > 0 && (
              <UncategorizedGroup
                services={uncategorizedServices}
                collapsed={collapsedGroups.uncategorized ?? true}
                toggleCollapsed={() =>
                  setCollapsedGroups((prev) => ({
                    ...prev,
                    uncategorized: !prev.uncategorized,
                  }))
                }
                defaultDailyMinHours={defaultDailyMinHours}
                inlineEditingId={inlineEditingServiceId}
                onStartEdit={(id) => setInlineEditingServiceId(id)}
                onCancelEdit={() => setInlineEditingServiceId(null)}
                onSubmitEdit={handleSubmitService}
                onDelete={handleDeleteService}
                onReactivate={(id) => void reactivateService(id)}
                savingService={savingService}
                toServiceFormValue={toServiceFormValue}
              />
            )}

            {services.length === 0 && (
              <div
                className="text-center"
                style={{
                  paddingTop: 'calc(var(--theme-card-padding) * 3)',
                  paddingBottom: 'calc(var(--theme-card-padding) * 3)',
                  color: 'var(--theme-stone-500)',
                }}
              >
                <DollarSign
                  className="w-16 h-16 mx-auto opacity-50"
                  style={{ marginBottom: 'var(--theme-card-gap)' }}
                />
                <p style={{ marginBottom: 'var(--theme-card-gap)' }}>
                  No services configured yet
                </p>
                <Button
                  onClick={() => setShowServiceForm(true)}
                  style={{
                    backgroundColor: 'var(--theme-brand-primary)',
                    color: 'white',
                  }}
                  className="hover:opacity-90 transition-opacity"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Your First Service
                </Button>
              </div>
            )}
          </div>
        )}
      </div>

      <AlertDialog
        open={!!deleteServiceConfirm}
        onOpenChange={(open) => !open && setDeleteServiceConfirm(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle
                className={`w-5 h-5 ${
                  deleteServiceConfirm?.isUsed ? 'text-amber-500' : 'text-red-500'
                }`}
              />
              {deleteServiceConfirm?.isUsed
                ? 'Deactivate Service?'
                : 'Delete Service?'}
            </AlertDialogTitle>
          </AlertDialogHeader>
          <AlertDialogDescription>
            {deleteServiceConfirm?.isUsed ? (
              <>
                The service &quot;<strong>{deleteServiceConfirm?.name}</strong>&quot;
                has been used in deals or trials and cannot be permanently deleted.
                It will be marked as inactive instead.
              </>
            ) : (
              <>
                Are you sure you want to permanently delete the service &quot;
                <strong>{deleteServiceConfirm?.name}</strong>&quot;? This action
                cannot be undone.
              </>
            )}
          </AlertDialogDescription>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => void confirmDeleteService()}
              className={
                deleteServiceConfirm?.isUsed
                  ? 'bg-amber-600 hover:bg-amber-700'
                  : 'bg-red-600 hover:bg-red-700'
              }
            >
              {deleteServiceConfirm?.isUsed ? 'Deactivate' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={!!deleteCategoryConfirm}
        onOpenChange={(open) => !open && setDeleteCategoryConfirm(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              {deleteCategoryConfirm && deleteCategoryConfirm.activeServiceCount > 0 ? (
                <>
                  <AlertTriangle className="w-5 h-5 text-red-500" />
                  Cannot Delete Category
                </>
              ) : deleteCategoryConfirm &&
                deleteCategoryConfirm.inactiveServiceCount > 0 ? (
                <>
                  <AlertTriangle className="w-5 h-5 text-amber-500" />
                  Deactivate Category?
                </>
              ) : (
                <>
                  <AlertTriangle className="w-5 h-5 text-red-500" />
                  Delete Category?
                </>
              )}
            </AlertDialogTitle>
          </AlertDialogHeader>
          <AlertDialogDescription>
            {deleteCategoryConfirm && deleteCategoryConfirm.activeServiceCount > 0 ? (
              <>
                The category &quot;<strong>{deleteCategoryConfirm.name}</strong>
                &quot; contains{' '}
                <strong>{deleteCategoryConfirm.activeServiceCount}</strong> active
                service{deleteCategoryConfirm.activeServiceCount !== 1 ? 's' : ''}.
                You must deactivate or reassign all active services before you can
                remove this category.
              </>
            ) : deleteCategoryConfirm &&
              deleteCategoryConfirm.inactiveServiceCount > 0 ? (
              <>
                The category &quot;<strong>{deleteCategoryConfirm.name}</strong>
                &quot; contains{' '}
                <strong>{deleteCategoryConfirm.inactiveServiceCount}</strong>{' '}
                inactive service
                {deleteCategoryConfirm.inactiveServiceCount !== 1 ? 's' : ''}. It
                will be marked as inactive but preserved for historical records.
              </>
            ) : (
              <>
                Are you sure you want to permanently delete the category &quot;
                <strong>{deleteCategoryConfirm?.name}</strong>&quot;? This action
                cannot be undone.
              </>
            )}
          </AlertDialogDescription>
          <AlertDialogFooter>
            <AlertDialogCancel>
              {deleteCategoryConfirm && deleteCategoryConfirm.activeServiceCount > 0
                ? 'Close'
                : 'Cancel'}
            </AlertDialogCancel>
            {!(
              deleteCategoryConfirm && deleteCategoryConfirm.activeServiceCount > 0
            ) && (
              <AlertDialogAction
                onClick={() => void confirmDeleteCategory()}
                className={
                  deleteCategoryConfirm &&
                  deleteCategoryConfirm.inactiveServiceCount > 0
                    ? 'bg-amber-600 hover:bg-amber-700'
                    : 'bg-red-600 hover:bg-red-700'
                }
              >
                {deleteCategoryConfirm &&
                deleteCategoryConfirm.inactiveServiceCount > 0
                  ? 'Deactivate'
                  : 'Delete'}
              </AlertDialogAction>
            )}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

// ─── Sortable category group ─────────────────────────────────────────────

interface SortableCategoryGroupProps {
  category: ServiceCategoryRecord;
  services: ServiceRecord[];
  collapsed: boolean;
  isInlineEditing: boolean;
  inlineEditValue: string;
  defaultDailyMinHours: number;
  inlineEditingServiceId: string | null;
  savingService: boolean;
  sensors: ReturnType<typeof useSensors>;
  onToggleCollapsed: () => void;
  onStartInlineEdit: () => void;
  onChangeInlineEdit: (value: string) => void;
  onCommitInlineEdit: () => void;
  onCancelInlineEdit: () => void;
  onReactivateCategory: () => void;
  onDeleteCategory: () => void;
  onStartEditService: (id: string) => void;
  onCancelEditService: () => void;
  onSubmitEditService: (data: ServiceRowInput) => Promise<void>;
  onDeleteService: (service: ServiceRecord) => void;
  onReactivateService: (id: string) => void;
  onServiceDragEnd: (event: DragEndEvent) => void;
  toServiceFormValue: (s: ServiceRecord) => ServiceFormValue;
}

function SortableCategoryGroup(props: SortableCategoryGroupProps) {
  const {
    category,
    services,
    collapsed,
    isInlineEditing,
    inlineEditValue,
    defaultDailyMinHours,
    inlineEditingServiceId,
    savingService,
    sensors,
    onToggleCollapsed,
    onStartInlineEdit,
    onChangeInlineEdit,
    onCommitInlineEdit,
    onCancelInlineEdit,
    onReactivateCategory,
    onDeleteCategory,
    onStartEditService,
    onCancelEditService,
    onSubmitEditService,
    onDeleteService,
    onReactivateService,
    onServiceDragEnd,
    toServiceFormValue,
  } = props;

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: category.id });
  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={isDragging ? 'opacity-50' : ''}
      {...attributes}
    >
      <div
        className="flex items-center justify-between py-3 cursor-pointer"
        onClick={() => {
          if (!isInlineEditing) onToggleCollapsed();
        }}
      >
        <div className="flex items-center gap-2 flex-1">
          <button
            type="button"
            {...listeners}
            className="cursor-grab active:cursor-grabbing bg-transparent border-0 p-0"
            onClick={(e) => e.stopPropagation()}
            aria-label="Drag to reorder category"
          >
            <GripVertical className="w-5 h-5 text-stone-400" />
          </button>
          <div
            className={`w-1 h-6 rounded-full ${
              !category.is_active ? 'bg-stone-400' : 'bg-indigo-600'
            }`}
          />
          {isInlineEditing ? (
            <>
              <Input
                value={inlineEditValue}
                onChange={(e) => onChangeInlineEdit(e.target.value)}
                className="h-8 flex-1"
                autoFocus
                onClick={(e) => e.stopPropagation()}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    onCommitInlineEdit();
                  } else if (e.key === 'Escape') {
                    onCancelInlineEdit();
                  }
                }}
              />
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-green-600"
                aria-label="Save category name"
                onClick={(e) => {
                  e.stopPropagation();
                  onCommitInlineEdit();
                }}
              >
                <Check className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                aria-label="Cancel rename"
                onClick={(e) => {
                  e.stopPropagation();
                  onCancelInlineEdit();
                }}
              >
                <X className="w-4 h-4" />
              </Button>
            </>
          ) : (
            <span
              className={`text-lg font-semibold ${
                !category.is_active ? 'text-stone-500' : 'text-stone-900'
              }`}
            >
              {category.name}
              {category.is_default && (
                <span className="ml-2 text-xs px-2 py-1 bg-blue-50 text-blue-700 rounded font-medium border border-blue-200">
                  Default
                </span>
              )}
              <span className="ml-2 text-sm font-normal text-stone-400">
                ({services.length} service{services.length !== 1 ? 's' : ''})
              </span>
              {!category.is_active && (
                <span className="ml-2 text-xs px-2 py-0.5 bg-stone-100 text-stone-600 rounded-full border border-stone-200">
                  Inactive
                </span>
              )}
            </span>
          )}
        </div>
        {!isInlineEditing && (
          <div
            className="flex items-center gap-2"
            onClick={(e) => e.stopPropagation()}
          >
            {!category.is_active ? (
              <Button
                variant="ghost"
                size="icon"
                aria-label="Reactivate category"
                onClick={onReactivateCategory}
              >
                <RotateCcw className="w-4 h-4 text-green-600" />
              </Button>
            ) : (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Edit category"
                  onClick={onStartInlineEdit}
                >
                  <Edit className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Delete category"
                  onClick={onDeleteCategory}
                  disabled={category.is_default}
                  className={category.is_default ? 'opacity-50 cursor-not-allowed' : ''}
                >
                  <Trash2 className="w-4 h-4 text-red-500" />
                </Button>
              </>
            )}
            <div className="p-1">
              <ChevronDown
                className={`w-5 h-5 text-stone-500 transition-transform ${
                  collapsed ? '-rotate-90' : ''
                }`}
              />
            </div>
          </div>
        )}
      </div>

      {!collapsed && (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={onServiceDragEnd}
        >
          <SortableContext
            items={services.map((s) => s.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-3 mt-0 ml-8">
              {services.map((service) => (
                <SortableServiceRow
                  key={service.id}
                  service={service}
                  defaultDailyMinHours={defaultDailyMinHours}
                  inlineEditingServiceId={inlineEditingServiceId}
                  savingService={savingService}
                  onStartEdit={() => onStartEditService(service.id)}
                  onCancelEdit={onCancelEditService}
                  onSubmitEdit={onSubmitEditService}
                  onDelete={() => onDeleteService(service)}
                  onReactivate={() => onReactivateService(service.id)}
                  toServiceFormValue={toServiceFormValue}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}
    </div>
  );
}

// ─── Sortable service row ────────────────────────────────────────────────

interface SortableServiceRowProps {
  service: ServiceRecord;
  defaultDailyMinHours: number;
  inlineEditingServiceId: string | null;
  savingService: boolean;
  onStartEdit: () => void;
  onCancelEdit: () => void;
  onSubmitEdit: (data: ServiceRowInput) => Promise<void>;
  onDelete: () => void;
  onReactivate: () => void;
  toServiceFormValue: (s: ServiceRecord) => ServiceFormValue;
}

function SortableServiceRow({
  service,
  defaultDailyMinHours,
  inlineEditingServiceId,
  savingService,
  onStartEdit,
  onCancelEdit,
  onSubmitEdit,
  onDelete,
  onReactivate,
  toServiceFormValue,
}: SortableServiceRowProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: service.id });
  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
  };
  const isEditing = inlineEditingServiceId === service.id;
  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      className={`bg-white border border-stone-200 hover:shadow-md transition-all border-l-4 border-l-orange-400 rounded-lg p-3 ${
        isDragging ? 'opacity-50' : ''
      }`}
    >
      {isEditing ? (
        <ServiceForm
          service={toServiceFormValue(service)}
          onSubmit={onSubmitEdit}
          onCancel={onCancelEdit}
          isLoading={savingService}
        />
      ) : (
        <ServiceRow
          service={service}
          dragListeners={listeners}
          defaultDailyMinHours={defaultDailyMinHours}
          onEdit={onStartEdit}
          onDelete={onDelete}
          onReactivate={onReactivate}
        />
      )}
    </div>
  );
}

// ─── Presentational service row body ─────────────────────────────────────

interface ServiceRowProps {
  service: ServiceRecord;
  dragListeners?: ReturnType<typeof useSortable>['listeners'] | null;
  defaultDailyMinHours: number;
  onEdit: () => void;
  onDelete: () => void;
  onReactivate: () => void;
}

function ServiceRow({
  service,
  dragListeners,
  defaultDailyMinHours,
  onEdit,
  onDelete,
  onReactivate,
}: ServiceRowProps) {
  const availability = service.service_availability;
  return (
    <div className="flex items-center" style={{ gap: 'var(--theme-element-gap)' }}>
      {dragListeners && (
        <button
          type="button"
          {...dragListeners}
          className="cursor-grab active:cursor-grabbing bg-transparent border-0 p-0"
          aria-label="Drag to reorder service"
        >
          <GripVertical className="w-5 h-5 text-stone-400" />
        </button>
      )}
      <div className="flex-1">
        <div
          className="flex items-center justify-between"
          style={{ gap: 'var(--theme-card-gap)' }}
        >
          <div className="flex-1 min-w-0">
            <div
              className="flex items-center"
              style={{ gap: 'var(--theme-element-gap)' }}
            >
              <h4 className="font-semibold" style={{ color: 'var(--theme-stone-900)' }}>
                {service.name}
              </h4>
              {service.is_default && (
                <span className="text-xs px-2 py-1 bg-blue-50 text-blue-700 rounded font-medium border border-blue-200">
                  Default
                </span>
              )}
              {!service.is_active && (
                <span className="text-xs px-2 py-0.5 bg-stone-100 text-stone-600 rounded-full border border-stone-200">
                  Inactive
                </span>
              )}
            </div>
            {service.description && (
              <p
                style={{
                  fontSize: 'var(--theme-text-body)',
                  color: 'var(--theme-stone-500)',
                  marginTop: 'var(--theme-element-gap)',
                }}
              >
                {service.description}
              </p>
            )}
          </div>
          <div
            className="flex items-center flex-shrink-0"
            style={{ gap: 'var(--theme-element-gap)' }}
          >
            <div
              className="flex flex-col"
              style={{ gap: 'calc(var(--theme-element-gap) / 2)' }}
            >
              {(availability === 'pre_trial_only' || availability === 'both') && (
                <span className="text-xs px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full border border-blue-200 whitespace-nowrap">
                  Pre-Trial
                </span>
              )}
              {(availability === 'in_trial_only' || availability === 'both') && (
                <span className="text-xs px-2 py-0.5 bg-purple-50 text-purple-700 rounded-full border border-purple-200 whitespace-nowrap">
                  In-Trial
                </span>
              )}
            </div>
            <div className="text-right">
              {service.is_default ? (
                <span
                  className="px-3 py-1 bg-amber-50 text-amber-700 rounded-full font-medium border border-amber-200"
                  style={{ fontSize: 'var(--theme-text-body)' }}
                >
                  {((service.travel_multiplier ?? 1) * 100).toFixed(0)}%
                </span>
              ) : (
                <>
                  <span
                    className="px-3 py-1 bg-green-50 text-green-700 rounded-full font-medium border border-green-200"
                    style={{ fontSize: 'var(--theme-text-body)' }}
                  >
                    ${service.base_rate.toLocaleString()}
                    <span className="text-green-600 ml-1 font-normal">
                      {service.rate_type === 'flat'
                        ? 'flat'
                        : `/${service.rate_type === 'hourly' ? 'hr' : 'day'}`}
                    </span>
                  </span>
                  {service.has_daily_minimum && service.rate_type === 'hourly' && (
                    <div
                      style={{
                        fontSize: 'var(--theme-text-caption)',
                        color: 'var(--theme-stone-500)',
                        marginTop: 'var(--theme-element-gap)',
                      }}
                    >
                      ${(service.base_rate * defaultDailyMinHours).toLocaleString()}{' '}
                      daily min
                    </div>
                  )}
                </>
              )}
            </div>
            {!service.is_active ? (
              <Button
                variant="ghost"
                size="icon"
                aria-label="Reactivate service"
                onClick={onReactivate}
              >
                <RotateCcw className="w-4 h-4 text-green-600" />
              </Button>
            ) : (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Edit service"
                  onClick={onEdit}
                >
                  <Edit className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Delete service"
                  onClick={onDelete}
                  disabled={service.is_default}
                  className={service.is_default ? 'opacity-50 cursor-not-allowed' : ''}
                >
                  <Trash2 className="w-4 h-4 text-red-500" />
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Uncategorized group (no DnD; sort is by name) ──────────────────────

interface UncategorizedGroupProps {
  services: ServiceRecord[];
  collapsed: boolean;
  toggleCollapsed: () => void;
  defaultDailyMinHours: number;
  inlineEditingId: string | null;
  onStartEdit: (id: string) => void;
  onCancelEdit: () => void;
  onSubmitEdit: (data: ServiceRowInput) => Promise<void>;
  onDelete: (service: ServiceRecord) => void;
  onReactivate: (id: string) => void;
  savingService: boolean;
  toServiceFormValue: (s: ServiceRecord) => ServiceFormValue;
}

function UncategorizedGroup({
  services,
  collapsed,
  toggleCollapsed,
  defaultDailyMinHours,
  inlineEditingId,
  onStartEdit,
  onCancelEdit,
  onSubmitEdit,
  onDelete,
  onReactivate,
  savingService,
  toServiceFormValue,
}: UncategorizedGroupProps) {
  return (
    <div>
      <div
        className="flex items-center justify-between py-3 cursor-pointer"
        onClick={toggleCollapsed}
      >
        <div className="flex items-center gap-2">
          <div className="w-1 h-6 bg-stone-400 rounded-full" />
          <span className="text-lg font-semibold text-stone-900">
            Uncategorized
            <span className="ml-2 text-sm font-normal text-stone-400">
              ({services.length} service{services.length !== 1 ? 's' : ''})
            </span>
          </span>
        </div>
        <div className="p-1">
          <ChevronDown
            className={`w-5 h-5 text-stone-500 transition-transform ${
              collapsed ? '-rotate-90' : ''
            }`}
          />
        </div>
      </div>
      {!collapsed && (
        <div className="space-y-3 mt-3 ml-4">
          {services.map((service) => (
            <div
              key={service.id}
              className="bg-white border border-stone-200 hover:shadow-md transition-all border-l-4 border-l-orange-400 rounded-lg p-3"
            >
              {inlineEditingId === service.id ? (
                <ServiceForm
                  service={toServiceFormValue(service)}
                  onSubmit={onSubmitEdit}
                  onCancel={onCancelEdit}
                  isLoading={savingService}
                />
              ) : (
                <ServiceRow
                  service={service}
                  defaultDailyMinHours={defaultDailyMinHours}
                  onEdit={() => onStartEdit(service.id)}
                  onDelete={() => onDelete(service)}
                  onReactivate={() => onReactivate(service.id)}
                />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default ServicesSettingsTab;
