/**
 * opportunity-card.tsx — port of
 * HotSeatersMVP/src/components/sales/OpportunityCard.jsx.
 *
 * Spectrum card for the unified CRM. One shell, three disclosed layers:
 *   Layer 3 (deal only): tinted case header — case_name · $value · stage · days
 *   Layer 1 (always):    identity — contact · firm · sales-lead avatar
 *   Layer 2 (always):    activity zone — next pending follow-up (read display)
 *   Footer  (always):    phone · email · view-details · LOE status (deal only)
 *
 * Adaptation (RULE 0): the bible's activity zone embeds an inline activity
 * editor (`InlineSalesActivityForm`), an `ActivityToolbar`, a history dialog
 * and `CascadeDeleteDialog` (deal-mode Delete Deal). D04 wires all of them:
 * the card consumes `useSalesActivities()` for the next-activity display +
 * mark-done/edit controls + add-activity + history, the contact-only
 * "Not Pursuing" action flips `is_active_prospect` through the hook, and the
 * deal-mode delete opens the cascade dialog.
 *
 * HotSeatersMVP is the bible.
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Phone, Mail, ExternalLink, CalendarDays, Send, Building2, MapPin,
  Clock, User, Plus, MoreVertical, UserX, CheckCircle2, Pencil, Trash2,
} from 'lucide-react';
import { differenceInDays, parseISO, format } from 'date-fns';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
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
import type { Trial } from '@/features/trials/entities';
import { stageColorToCss } from '@/features/deals/business-rules/deal-kanban-buckets';
import { getDaysLabel } from '@/features/deals/business-rules/activity-date-utils';
import { isOwnerOrAdmin } from '@/shared/lib/role-mapping';
import { useSalesActivities } from '@/features/deals/hooks/use-sales-activities';
import { useCurrentUser } from '@/features/auth/hooks/use-current-user';
import { useTier1 } from '@/app/tier1-provider';
import { ACTIVITY_TYPE_ICON } from './deal-card-types';
import { ActivityToolbar } from './activity-toolbar';
import { InlineSalesActivityForm, type InlineFormMode } from './inline-sales-activity-form';
import { SalesActivityHistoryDialog } from './sales-activity-history-dialog';
import { CascadeDeleteDialog } from './cascade-delete-dialog';
import type {
  AttorneyRow,
  DealRow,
  SharedCardProps,
} from './deal-card-types';

interface OpportunityCardProps extends SharedCardProps {
  /** Deal mode (a sales-stage trial with derived daysUntilTrial). */
  deal?: DealRow | null;
  /** Contact-only mode (an active prospect with no sales-stage trial). */
  attorney?: AttorneyRow | null;
  disableInitialAnimation?: boolean;
}

export function OpportunityCard({
  deal = null,
  attorney = null,
  clients,
  pipelineStages,
  attorneys,
  documents,
  documentSigners,
  consultants = [],
  salesActivities = [],
  showMyDeals = false,
  onSelectTrial,
  onSendReminder,
  onAddDealForContact,
  onDeleteTrial,
  onDeleteTrialChildren,
  disableInitialAnimation = false,
}: OpportunityCardProps) {
  const [showNotPursuingConfirm, setShowNotPursuingConfirm] = useState(false);
  const [inlineFormMode, setInlineFormMode] = useState<InlineFormMode | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [showCascadeDelete, setShowCascadeDelete] = useState(false);

  const { setAttorneyProspectStatus } = useSalesActivities();
  const { userInfo } = useCurrentUser();
  const { company } = useTier1();
  const companyId = company?.id ?? null;

  // ── Resolve actors ─────────────────────────────────────────────────────
  const primaryContact = deal
    ? attorneys.find((a) => a.id === deal.primary_contact_id) ?? null
    : attorney;
  const client = deal
    ? clients.find((c) => c.id === deal.client_id) ?? null
    : primaryContact
      ? clients.find((c) => c.id === primaryContact.client_id) ?? null
      : null;
  const salesLead = deal
    ? consultants.find((c) => c.id === deal.consultant_id) ?? null
    : client
      ? consultants.find((c) => c.id === client.sales_lead) ?? null
      : null;

  const openDetails = () => {
    if (deal && onSelectTrial) onSelectTrial(deal as unknown as Trial);
  };

  // ── Activity zone (read-only display) ──────────────────────────────────
  const cardActivities = deal
    ? salesActivities.filter((a) => a.trial_id === deal.id)
    : primaryContact
      ? salesActivities.filter((a) => a.attorney_id === primaryContact.id && !a.trial_id)
      : [];
  const nextActivity = cardActivities
    .filter((a) => a.status === 'pending' && a.scheduled_date)
    .sort((a, b) => (a.scheduled_date ?? '').localeCompare(b.scheduled_date ?? ''))[0] ?? null;

  const now = new Date();
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  const fuDate = nextActivity?.scheduled_date ?? null;
  const isOverdue = !!fuDate && fuDate < todayStr;
  const isDueToday = fuDate === todayStr;

  const actInfo = nextActivity?.activity_type
    ? ACTIVITY_TYPE_ICON[nextActivity.activity_type]
    : undefined;
  const ActIcon = actInfo?.icon;

  const daysLabel = getDaysLabel(fuDate);

  // ── Urgency styling (deal-attached only) ───────────────────────────────
  const days = deal?.daysUntilTrial ?? null;
  const urgency = deal && days != null
    ? days < 10 ? 'critical' : days <= 30 ? 'warning' : 'normal'
    : 'normal';
  const cardBorderColor =
    urgency === 'critical' ? 'var(--theme-danger)' :
    urgency === 'warning' ? 'var(--theme-warning)' :
    'var(--theme-stone-200)';
  const cardBg =
    urgency === 'critical' ? 'color-mix(in srgb, var(--theme-danger) 5%, white)' :
    urgency === 'warning' ? 'color-mix(in srgb, var(--theme-warning) 5%, white)' :
    'white';
  const cardBorderWidth = urgency === 'critical' ? '2px' : '1px';
  const daysBadgeBg =
    urgency === 'critical' ? 'var(--theme-danger)' :
    urgency === 'warning' ? 'var(--theme-warning)' :
    'var(--theme-success)';

  const dealStage = deal ? pipelineStages.find((s) => s.id === deal.pipeline_stage_id) ?? null : null;
  const stageAccent = stageColorToCss(dealStage?.color);

  const locationStr = deal
    ? deal.city && deal.state ? `${deal.city}, ${deal.state}` : deal.city || deal.state || ''
    : '';

  return (
    <motion.div
      layout
      initial={disableInitialAnimation ? false : { opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9, height: 0, marginBottom: 0 }}
      transition={{ duration: 0.2 }}
      className="border transition-all hover:shadow-md relative overflow-hidden"
      style={{
        borderRadius: 'var(--theme-list-item-radius)',
        boxShadow: 'var(--theme-list-item-shadow)',
        borderColor: cardBorderColor,
        backgroundColor: cardBg,
        borderWidth: cardBorderWidth,
      }}
    >
      {/* LAYER 3 — Case header (tinted, deal-only) */}
      {deal && (
        <div
          className="cursor-pointer"
          onClick={openDetails}
          style={{
            padding: '0.75rem 0.875rem 0.875rem',
            background: 'linear-gradient(135deg, #0f172a 0%, #475569 100%)',
            color: 'white',
            marginBottom: '-0.5rem',
            paddingBottom: '1.25rem',
            clipPath: 'polygon(0 0, 100% 0, 100% calc(100% - 12px), 50% 100%, 0 calc(100% - 12px))',
          }}
        >
          <div className="flex items-start justify-between gap-2">
            <h5
              className="font-semibold truncate flex-1"
              style={{ color: 'white', fontSize: 'var(--theme-text-body)' }}
              title={deal.case_name ?? undefined}
            >
              {deal.case_name}
            </h5>
            <p className="font-bold flex-shrink-0" style={{ fontSize: 'var(--theme-text-body)', color: '#4ade80' }}>
              ${(deal.estimated_value || 0).toLocaleString()}
            </p>
          </div>
          {(deal.start_date || locationStr) && (
            <div
              className="flex items-center gap-3 mt-1 flex-wrap"
              style={{ fontSize: 'var(--theme-text-caption)', color: '#cbd5e1' }}
            >
              {deal.start_date && (
                <span className="flex items-center gap-1">
                  <CalendarDays className="w-3 h-3 flex-shrink-0" />
                  {new Date(`${deal.start_date}T00:00:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  {deal.end_date && (
                    <span className="ml-1" style={{ color: '#94a3b8' }}>
                      ({differenceInDays(parseISO(deal.end_date), parseISO(deal.start_date)) + 1}d)
                    </span>
                  )}
                </span>
              )}
              {locationStr && (
                <span className="flex items-center gap-1 min-w-0">
                  <MapPin className="w-3 h-3 flex-shrink-0" />
                  <span className="truncate">{locationStr}</span>
                </span>
              )}
            </div>
          )}
          <div className="flex items-center gap-2 mt-2">
            {dealStage && (
              <Badge
                className="flex-shrink-0"
                style={{
                  fontSize: 'var(--theme-text-caption)',
                  borderRadius: 'var(--theme-button-radius)',
                  backgroundColor: stageAccent,
                  color: 'white',
                  border: 'none',
                }}
              >
                {dealStage.name}
              </Badge>
            )}
            <div
              className="flex-1 overflow-hidden"
              style={{
                height: '6px',
                borderRadius: '999px',
                backgroundColor: 'rgba(255,255,255,0.15)',
                border: '1px solid rgba(255,255,255,0.1)',
              }}
              title={`${days} days until trial`}
            >
              <div
                style={{
                  height: '100%',
                  width: `${Math.max(0, Math.min(100, ((90 - (days ?? 0)) / 90) * 100))}%`,
                  backgroundColor: daysBadgeBg,
                  borderRadius: '999px',
                  transition: 'width 0.3s ease',
                }}
              />
            </div>
            {days != null && (
              <Badge
                className="flex-shrink-0"
                style={{
                  backgroundColor: daysBadgeBg,
                  color: 'white',
                  fontSize: 'var(--theme-text-caption)',
                  borderRadius: 'var(--theme-button-radius)',
                }}
              >
                {days} {days === 1 ? 'day' : 'days'}
              </Badge>
            )}
          </div>
        </div>
      )}

      {/* LAYER 1 — Identity (always) */}
      <div
        className="cursor-pointer flex items-start gap-2.5"
        onClick={openDetails}
        style={{ padding: '0.625rem 0.75rem 0.5rem' }}
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <User className="w-3.5 h-3.5 flex-shrink-0" style={{ color: 'var(--theme-stone-500)' }} />
            {primaryContact ? (
              <span className="font-semibold truncate" style={{ color: 'var(--theme-stone-900)', fontSize: 'var(--theme-text-body)' }}>
                {primaryContact.first_name} {primaryContact.last_name}
              </span>
            ) : (
              <span className="italic" style={{ color: 'var(--theme-stone-400)', fontSize: 'var(--theme-text-caption)' }}>
                No contact
              </span>
            )}
          </div>
          {client?.firm_name && (
            <div className="flex items-center gap-1.5 mt-0.5" style={{ fontSize: 'var(--theme-text-caption)', color: 'var(--theme-stone-600)' }}>
              <Building2 className="w-3 h-3 flex-shrink-0" />
              <span className="truncate">{client.firm_name}</span>
            </div>
          )}
        </div>

        {salesLead && !showMyDeals && (
          <div className="flex-shrink-0" onClick={(e) => e.stopPropagation()}>
            {salesLead.profile_photo ? (
              <img
                src={salesLead.profile_photo}
                alt={`${salesLead.first_name} ${salesLead.last_name}`}
                className="w-8 h-8 rounded-full object-cover border border-stone-200"
                title={`${salesLead.first_name} ${salesLead.last_name}`}
              />
            ) : (
              <div
                className="w-8 h-8 bg-gradient-to-br from-indigo-100 to-indigo-200 rounded-full flex items-center justify-center border border-stone-200"
                title={`${salesLead.first_name} ${salesLead.last_name}`}
              >
                <span className="text-xs font-semibold text-indigo-700">
                  {(salesLead.first_name?.[0] || '') + (salesLead.last_name?.[0] || '')}
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* LAYER 2 — Activity zone (editable) */}
      <div style={{ padding: '0 0.75rem 0.5rem' }} onClick={(e) => e.stopPropagation()}>
        <div
          className="rounded-lg overflow-hidden"
          style={{
            border: `1px solid ${isOverdue ? '#fca5a5' : isDueToday ? '#fcd34d' : 'var(--theme-stone-200)'}`,
            backgroundColor: isOverdue
              ? 'color-mix(in srgb, #dc2626 4%, white)'
              : isDueToday
                ? 'color-mix(in srgb, #f59e0b 4%, white)'
                : 'color-mix(in srgb, var(--theme-brand-primary) 3%, white)',
          }}
        >
          {inlineFormMode !== 'edit' &&
            inlineFormMode !== 'complete' &&
            (nextActivity ? (
              <div className="p-2.5 flex items-start gap-2.5">
                <div className="flex-shrink-0 mt-0.5">
                  {ActIcon && <ActIcon className={`w-4 h-4 ${actInfo?.color ?? 'text-stone-500'}`} />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span
                      className={`text-xs font-semibold ${isOverdue ? 'text-red-700' : isDueToday ? 'text-amber-700' : ''}`}
                      style={{ color: !isOverdue && !isDueToday ? 'var(--theme-stone-800)' : undefined }}
                    >
                      {nextActivity.activity_type} — {fuDate && format(parseISO(`${fuDate}T00:00:00`), 'MMM d, yyyy')}
                    </span>
                    {daysLabel && (
                      <span
                        className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${
                          isOverdue ? 'bg-red-100 text-red-700' : isDueToday ? 'bg-amber-100 text-amber-700' : 'bg-stone-100 text-stone-600'
                        }`}
                      >
                        {daysLabel}
                      </span>
                    )}
                  </div>
                  {nextActivity.content && (
                    <p className="text-xs mt-1 leading-relaxed line-clamp-2" style={{ color: 'var(--theme-stone-600)' }}>
                      {nextActivity.content}
                    </p>
                  )}
                </div>
                <div className="flex flex-col gap-1 flex-shrink-0">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger
                        render={
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 hover:opacity-90 transition-opacity"
                            onClick={() => setInlineFormMode('complete')}
                            style={{
                              borderRadius: 'var(--theme-button-radius)',
                              backgroundColor: 'var(--theme-success)',
                              border: '0.5px solid var(--theme-success)',
                            }}
                          >
                            <CheckCircle2 className="w-4 h-4 text-white" />
                          </Button>
                        }
                      />
                      <TooltipContent>Mark done</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger
                        render={
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 hover:bg-stone-50 bg-white"
                            onClick={() => setInlineFormMode('edit')}
                            style={{
                              borderRadius: 'var(--theme-button-radius)',
                              color: 'var(--theme-stone-400)',
                              border: '0.5px solid var(--theme-stone-200)',
                            }}
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </Button>
                        }
                      />
                      <TooltipContent>Edit activity</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </div>
            ) : (
              inlineFormMode !== 'new' && (
                <div className="flex items-center gap-1.5 px-2.5 py-2">
                  <Clock className="w-3.5 h-3.5" style={{ color: 'var(--theme-stone-300)' }} />
                  <span className="text-xs italic" style={{ color: 'var(--theme-stone-400)' }}>
                    No scheduled activity
                  </span>
                </div>
              )
            ))}

          {inlineFormMode === 'new' && (
            <div
              className="flex items-center gap-1.5 px-2.5 py-1.5"
              style={{
                borderTop: '1px solid var(--theme-stone-200)',
                borderBottom: '1px solid var(--theme-stone-200)',
                backgroundColor: 'var(--theme-stone-100)',
              }}
            >
              <CalendarDays className="w-3 h-3" style={{ color: 'var(--theme-stone-400)' }} />
              <span className="text-xs font-medium" style={{ color: 'var(--theme-stone-500)' }}>
                Log New Activity
              </span>
            </div>
          )}

          {inlineFormMode && (
            <InlineSalesActivityForm
              mode={inlineFormMode}
              activity={inlineFormMode !== 'new' ? nextActivity : null}
              attorneyId={primaryContact?.id ?? null}
              clientId={client?.id ?? null}
              trialId={deal?.id ?? null}
              companyId={companyId}
              userInfo={userInfo}
              onDone={() => setInlineFormMode(null)}
              onCancel={() => setInlineFormMode(null)}
            />
          )}

          {!inlineFormMode && (
            <ActivityToolbar
              isOverdue={isOverdue}
              isDueToday={isDueToday}
              activityCount={cardActivities.length}
              onAddActivity={() => setInlineFormMode('new')}
              onShowHistory={() => setShowHistory(true)}
              stopPropagation
            />
          )}
        </div>
      </div>

      {/* FOOTER — Quick actions + LOE status */}
      <div
        className="flex items-center gap-1"
        style={{ padding: '0.375rem 0.5rem 0.5rem', borderTop: '1px solid var(--theme-stone-100)' }}
      >
        <div className="flex items-center gap-0.5">
          {primaryContact?.phone && (
            <Button
              size="icon" variant="ghost" className="h-7 w-7"
              onClick={(e) => { e.stopPropagation(); window.location.href = `tel:${primaryContact.phone}`; }}
              title="Call"
            >
              <Phone className="w-3.5 h-3.5" />
            </Button>
          )}
          {primaryContact?.email && (
            <Button
              size="icon" variant="ghost" className="h-7 w-7"
              onClick={(e) => { e.stopPropagation(); window.location.href = `mailto:${primaryContact.email}`; }}
              title="Email"
            >
              <Mail className="w-3.5 h-3.5" />
            </Button>
          )}
          {deal && (
            <Button
              size="icon" variant="ghost" className="h-7 w-7"
              onClick={(e) => { e.stopPropagation(); openDetails(); }}
              title="View Details"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </Button>
          )}
        </div>

        {/* Contact-only: Not Pursuing + Add Deal (D03 wizard) entry point */}
        {!deal && primaryContact && (
          <div className="flex-1 flex justify-end items-center gap-1">
            {/* Bible OpportunityCard ~529–558: "Not Pursuing" flips the
                attorney's is_active_prospect to false (single-field write).
                The port has no Attorney store/hook yet — the write path lands
                with the sales-activity surface (change-D04). We render the menu
                + confirm dialog for bible parity; the confirm action is a
                clearly-labeled stub until the Attorney write path exists. */}
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7"
                    onClick={(e) => e.stopPropagation()}
                    title="More actions"
                  >
                    <MoreVertical className="w-3.5 h-3.5" />
                  </Button>
                }
              />
              <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                <DropdownMenuItem
                  onClick={(e) => { e.stopPropagation(); setShowNotPursuingConfirm(true); }}
                  className="text-red-600 focus:text-red-600 focus:bg-red-50"
                  style={{ fontFamily: 'var(--theme-font-body)', fontSize: 'var(--theme-text-body)' }}
                >
                  <UserX className="w-4 h-4 mr-2" />
                  Not Pursuing
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {onAddDealForContact && (
            <Button
              size="sm"
              onClick={(e) => { e.stopPropagation(); onAddDealForContact(primaryContact); }}
              className="h-7 gap-1.5 hover:opacity-90 transition-opacity"
              style={{
                background: 'linear-gradient(135deg, #0f172a 0%, #475569 100%)',
                color: 'white',
                fontSize: 'var(--theme-text-caption)',
                borderRadius: 'var(--theme-button-radius)',
              }}
              title="Create a deal for this contact"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Deal
            </Button>
            )}
          </div>
        )}

        {/* Deal: delete menu + LOE status */}
        {deal && (
          <div className="flex-1 flex justify-end items-center gap-1">
            {onDeleteTrial && (
              <DropdownMenu>
                <DropdownMenuTrigger
                  render={
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7"
                      onClick={(e) => e.stopPropagation()}
                      title="More actions"
                    >
                      <MoreVertical className="w-3.5 h-3.5" />
                    </Button>
                  }
                />
                <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowCascadeDelete(true);
                    }}
                    className="text-red-600 focus:text-red-600 focus:bg-red-50"
                    style={{ fontFamily: 'var(--theme-font-body)', fontSize: 'var(--theme-text-body)' }}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete Deal
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
            {(() => {
              if (dealStage?.name === 'LOE Sent') {
                const dealDocs = documents.filter((d) => d.trial_id === deal.id && d.status === 'sent');
                if (dealDocs.length > 0) {
                  const loeDoc = dealDocs[0]!;
                  const signers = documentSigners.filter((s) => s.document_id === loeDoc.id && !s.view_only);
                  const signedCount = signers.filter((s) => s.status === 'signed').length;
                  const totalSigners = signers.length;
                  return (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--theme-element-gap)' }}>
                      <Badge
                        style={{
                          fontSize: 'var(--theme-text-caption)',
                          borderRadius: 'var(--theme-button-radius)',
                          backgroundColor: 'white',
                          color: 'var(--theme-stone-700)',
                          border: '1px solid var(--theme-stone-200)',
                        }}
                      >
                        {signedCount}/{totalSigners} signed
                      </Badge>
                      {signedCount < totalSigners && onSendReminder && (
                        <Button
                          size="icon" variant="ghost" className="h-7 w-7"
                          onClick={(e) => onSendReminder(loeDoc, e)}
                          title="Send Reminder"
                        >
                          <Send className="w-3.5 h-3.5" />
                        </Button>
                      )}
                    </div>
                  );
                }
              } else {
                const hasSentLOE = documents.some((d) => d.trial_id === deal.id && d.status === 'sent');
                if (!hasSentLOE && days != null && days < 90) {
                  return (
                    <Badge
                      style={{
                        fontSize: 'var(--theme-text-caption)',
                        borderRadius: 'var(--theme-button-radius)',
                        backgroundColor: 'color-mix(in srgb, var(--theme-warning) 15%, white)',
                        color: 'color-mix(in srgb, var(--theme-warning) 80%, black)',
                        border: '1px solid color-mix(in srgb, var(--theme-warning) 30%, white)',
                      }}
                    >
                      Create LOE
                    </Badge>
                  );
                }
              }
              return null;
            })()}
          </div>
        )}
      </div>

      {/* Not Pursuing confirm (contact-only). Bible OpportunityCard ~676–695.
          The confirm action flips is_active_prospect to false; the port has no
          Attorney write path yet, so this is a clearly-labeled D04 stub. */}
      <AlertDialog open={showNotPursuingConfirm} onOpenChange={setShowNotPursuingConfirm}>
        <AlertDialogContent onClick={(e) => e.stopPropagation()}>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove from Deal Tracker?</AlertDialogTitle>
            <AlertDialogDescription>
              Remove <strong>{primaryContact?.first_name} {primaryContact?.last_name}</strong> from Deal Tracker? Their contact record and activity history will be kept. You can bring them back any time by adding a new Deal.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                // D04: flip the contact's is_active_prospect → false through the
                // sales-activity hook (single-field attorney write).
                if (primaryContact?.id) void setAttorneyProspectStatus(primaryContact.id, false);
                setShowNotPursuingConfirm(false);
              }}
              style={{ backgroundColor: 'var(--theme-brand-primary)', color: 'white' }}
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Activity history side panel */}
      <SalesActivityHistoryDialog
        open={showHistory}
        onOpenChange={setShowHistory}
        trialId={deal?.id ?? null}
        attorneyId={deal ? null : (primaryContact?.id ?? null)}
        consultants={consultants}
      />

      {/* Deal cascade-delete (deal-mode only) */}
      {deal && onDeleteTrial && onDeleteTrialChildren && (
        <CascadeDeleteDialog
          open={showCascadeDelete}
          onOpenChange={setShowCascadeDelete}
          entityId={deal.id}
          entityName={deal.case_name ?? 'this deal'}
          onDeleteTrial={onDeleteTrial}
          onDeleteTrialChildren={onDeleteTrialChildren}
          isAdminOrOwner={isOwnerOrAdmin(userInfo?.company_role)}
        />
      )}
    </motion.div>
  );
}
