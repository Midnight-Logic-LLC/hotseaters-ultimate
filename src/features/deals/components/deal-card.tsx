/**
 * deal-card.tsx — port of HotSeatersMVP/src/components/sales/DealCard.jsx.
 *
 * The bible's original (pre-OpportunityCard) deal card: case header, client /
 * date / location, multi-stage progress strip, days badge, activity-zone
 * display and a quick-action footer. The current DealTrackerKanbanGrid renders
 * `OpportunityCard` everywhere; `DealCard` is preserved here for parity with
 * the bible's component set and for surfaces that prefer the flat layout.
 *
 * Adaptation (RULE 0): the activity-zone editors (`InlineSalesActivityForm`,
 * `ActivityToolbar`, history dialog) are out of scope for D02 (they land with
 * the sales-activity change). We reproduce the read-only next-activity display.
 *
 * HotSeatersMVP is the bible.
 */

import {
  Phone, Mail, ExternalLink, CalendarDays, Send, Building2, MapPin, Clock,
} from 'lucide-react';
import { differenceInDays, parseISO, format } from 'date-fns';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { Trial } from '@/features/trials/entities';
import { stageColorToCss } from '@/features/deals/business-rules/deal-kanban-buckets';
import type { DealRow, SharedCardProps } from './deal-card-types';

const ACTIVITY_TYPE_ICON: Record<string, { icon: typeof Phone; color: string }> = {
  Call: { icon: Phone, color: 'text-blue-600' },
  Email: { icon: Mail, color: 'text-amber-600' },
  Meeting: { icon: CalendarDays, color: 'text-green-600' },
};

interface DealCardProps extends SharedCardProps {
  deal: DealRow;
  showProgress?: boolean;
}

export function DealCard({
  deal,
  showProgress = false,
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
}: DealCardProps) {
  const openDetails = () => onSelectTrial(deal as unknown as Trial);

  const client = clients.find((c) => c.id === deal.client_id) ?? null;
  const primaryContact = attorneys.find((a) => a.id === deal.primary_contact_id) ?? null;
  const salesLead = consultants.find((c) => c.id === deal.consultant_id) ?? null;

  const dealActivities = salesActivities.filter((a) => a.trial_id === deal.id);
  const nextActivity = dealActivities
    .filter((a) => a.status === 'pending' && a.scheduled_date)
    .sort((a, b) => (a.scheduled_date ?? '').localeCompare(b.scheduled_date ?? ''))[0] ?? null;

  const now = new Date();
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  const fuDate = nextActivity?.scheduled_date ?? null;
  const isOverdue = !!fuDate && fuDate < todayStr;
  const isDueToday = fuDate === todayStr;

  const days = deal.daysUntilTrial ?? 9999;
  const daysColor = days < 10 ? 'var(--theme-danger)' : days <= 30 ? 'var(--theme-warning)' : 'var(--theme-success)';
  const progressPercent = days <= 90 ? Math.max(0, ((90 - days) / 90) * 100) : 0;

  const actInfo = nextActivity?.activity_type ? ACTIVITY_TYPE_ICON[nextActivity.activity_type] : undefined;
  const ActIcon = actInfo?.icon;

  const getDaysLabel = (): string | null => {
    if (!fuDate) return null;
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const target = new Date(`${fuDate}T00:00:00`);
    const diff = Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    if (diff < 0) return `${Math.abs(diff)}d overdue`;
    if (diff === 0) return 'Today';
    return `in ${diff}d`;
  };

  const salesStages = pipelineStages
    .filter((s) => s.type === 'sales')
    .sort((a, b) => a.order - b.order);
  const currentStageIndex = salesStages.findIndex((s) => s.id === deal.pipeline_stage_id);

  return (
    <div
      className="border transition-all hover:shadow-md relative"
      style={{
        borderRadius: 'var(--theme-list-item-radius)',
        boxShadow: 'var(--theme-list-item-shadow)',
        borderColor: days < 10 ? 'var(--theme-danger)' : days <= 30 ? 'var(--theme-warning)' : 'var(--theme-stone-200)',
        backgroundColor:
          days < 10 ? 'color-mix(in srgb, var(--theme-danger) 5%, white)' :
          days <= 30 ? 'color-mix(in srgb, var(--theme-warning) 5%, white)' :
          'var(--theme-list-item-bg)',
        padding: 'var(--theme-list-item-padding)',
        borderWidth: days < 10 ? '2px' : '1px',
      }}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1 cursor-pointer" onClick={openDetails}>
          <h5 className="font-semibold mb-1" style={{ color: 'var(--theme-stone-900)', fontSize: 'var(--theme-text-body)' }}>
            {deal.case_name}
          </h5>
        </div>
        <div className="flex flex-col items-end gap-1">
          <p className="font-semibold" style={{ fontSize: 'var(--theme-text-body)', color: 'var(--theme-success)' }}>
            ${(deal.estimated_value || 0).toLocaleString()}
          </p>
        </div>
      </div>

      <div className="flex gap-3 mb-2">
        <div className="flex-1 min-w-0 cursor-pointer" onClick={openDetails}>
          {client?.firm_name && (
            <p style={{ fontSize: 'var(--theme-text-caption)', color: 'var(--theme-stone-600)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <Building2 className="w-3.5 h-3.5 flex-shrink-0" />
              <span className="truncate">{client.firm_name}</span>
            </p>
          )}
          {deal.start_date && (
            <div style={{ fontSize: 'var(--theme-text-caption)', color: 'var(--theme-stone-500)', marginTop: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <CalendarDays className="w-3.5 h-3.5 flex-shrink-0" />
              {new Date(`${deal.start_date}T00:00:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              {deal.end_date && (
                <span>({differenceInDays(parseISO(deal.end_date), parseISO(deal.start_date)) + 1} days)</span>
              )}
            </div>
          )}
          {(deal.city || deal.state) && (
            <div style={{ fontSize: 'var(--theme-text-caption)', color: 'var(--theme-stone-500)', marginTop: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
              <span className="truncate">{deal.city && deal.state ? `${deal.city}, ${deal.state}` : deal.city || deal.state}</span>
            </div>
          )}
        </div>
        {salesLead && !showMyDeals && (
          <div className="flex-shrink-0 flex items-end">
            {salesLead.profile_photo ? (
              <img
                src={salesLead.profile_photo}
                alt={`${salesLead.first_name} ${salesLead.last_name}`}
                className="w-9 h-9 rounded-full object-cover border border-stone-200"
                title={`${salesLead.first_name} ${salesLead.last_name}`}
              />
            ) : (
              <div className="w-9 h-9 bg-gradient-to-br from-indigo-100 to-indigo-200 rounded-full flex items-center justify-center border border-stone-200" title={`${salesLead.first_name} ${salesLead.last_name}`}>
                <span className="text-xs font-semibold text-indigo-700">
                  {(salesLead.first_name?.[0] || '') + (salesLead.last_name?.[0] || '')}
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Multi-stage progress indicator */}
      {salesStages.length > 0 && (
        <div className="flex items-center mb-2" style={{ gap: '2px' }}>
          {salesStages.map((s, i) => {
            const isActive = i === currentStageIndex;
            return (
              <div
                key={s.id}
                className="flex-1 text-center truncate"
                style={{
                  padding: '2px 4px',
                  fontSize: '9px',
                  fontWeight: isActive ? 600 : 400,
                  backgroundColor: isActive ? stageColorToCss((s as unknown as { color?: string }).color) : 'var(--theme-stone-100)',
                  color: isActive ? 'white' : 'var(--theme-stone-400)',
                  borderRadius: i === 0 ? '4px 0 0 4px' : i === salesStages.length - 1 ? '0 4px 4px 0' : '0',
                }}
                title={s.name}
              >
                {s.name}
              </div>
            );
          })}
        </div>
      )}

      {/* Days badge + progress */}
      <div className="flex items-center mb-2" style={{ gap: 'var(--theme-element-gap)' }}>
        <div className="flex-1">
          {showProgress && (
            <div className="h-1 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--theme-stone-200)' }}>
              <div className="h-full" style={{ width: `${progressPercent}%`, backgroundColor: daysColor }} />
            </div>
          )}
        </div>
        <Badge
          style={{
            backgroundColor: daysColor,
            color: 'white',
            fontSize: 'var(--theme-text-caption)',
            borderRadius: 'var(--theme-button-radius)',
            flexShrink: 0,
          }}
        >
          {days} {days === 1 ? 'day' : 'days'}
        </Badge>
      </div>

      {/* Activity zone (read-only display) */}
      <div
        className="rounded-lg overflow-hidden mb-2"
        style={{
          border: `1px solid ${isOverdue ? '#fca5a5' : isDueToday ? '#fcd34d' : 'var(--theme-stone-200)'}`,
          backgroundColor: isOverdue
            ? 'color-mix(in srgb, #dc2626 4%, white)'
            : isDueToday
              ? 'color-mix(in srgb, #f59e0b 4%, white)'
              : 'color-mix(in srgb, var(--theme-brand-primary) 3%, white)',
        }}
      >
        {nextActivity ? (
          <div className="p-2.5 flex items-start gap-2.5">
            <div className="flex-shrink-0 mt-0.5">{ActIcon && <ActIcon className={`w-4 h-4 ${actInfo?.color ?? 'text-stone-500'}`} />}</div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span
                  className={`text-xs font-semibold ${isOverdue ? 'text-red-700' : isDueToday ? 'text-amber-700' : ''}`}
                  style={{ color: !isOverdue && !isDueToday ? 'var(--theme-stone-800)' : undefined }}
                >
                  {nextActivity.activity_type} — {fuDate && format(parseISO(`${fuDate}T00:00:00`), 'MMM d, yyyy')}
                </span>
                {getDaysLabel() && (
                  <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${isOverdue ? 'bg-red-100 text-red-700' : isDueToday ? 'bg-amber-100 text-amber-700' : 'bg-stone-100 text-stone-600'}`}>
                    {getDaysLabel()}
                  </span>
                )}
              </div>
              {nextActivity.content && (
                <p className="text-xs mt-1 leading-relaxed line-clamp-2" style={{ color: 'var(--theme-stone-600)' }}>
                  {nextActivity.content}
                </p>
              )}
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 px-2.5 py-2">
            <Clock className="w-3.5 h-3.5" style={{ color: 'var(--theme-stone-300)' }} />
            <span className="text-xs italic" style={{ color: 'var(--theme-stone-400)' }}>No scheduled activity</span>
          </div>
        )}
      </div>

      {/* Footer: quick actions + LOE status */}
      <div className="flex items-center gap-1">
        <div className="flex items-center gap-1">
          {primaryContact?.phone && (
            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); window.location.href = `tel:${primaryContact.phone}`; }} title="Call">
              <Phone className="w-3.5 h-3.5" />
            </Button>
          )}
          {primaryContact?.email && (
            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); window.location.href = `mailto:${primaryContact.email}`; }} title="Email">
              <Mail className="w-3.5 h-3.5" />
            </Button>
          )}
          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); openDetails(); }} title="View Details">
            <ExternalLink className="w-3.5 h-3.5" />
          </Button>
        </div>
        <div className="flex-1 flex justify-end">
          {(() => {
            const dealStage = pipelineStages.find((s) => s.id === deal.pipeline_stage_id);
            if (dealStage?.name === 'LOE Sent') {
              const dealDocs = documents.filter((d) => d.trial_id === deal.id && d.status === 'sent');
              if (dealDocs.length > 0) {
                const loeDoc = dealDocs[0]!;
                const signers = documentSigners.filter((s) => s.document_id === loeDoc.id && !s.view_only);
                const signedCount = signers.filter((s) => s.status === 'signed').length;
                const totalSigners = signers.length;
                return (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--theme-element-gap)' }}>
                    <Badge style={{ fontSize: 'var(--theme-text-caption)', borderRadius: 'var(--theme-button-radius)', backgroundColor: 'white', color: 'var(--theme-stone-700)', border: '1px solid var(--theme-stone-200)' }}>
                      {signedCount}/{totalSigners} signed
                    </Badge>
                    {signedCount < totalSigners && onSendReminder && (
                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={(e) => onSendReminder(loeDoc, e)} title="Send Reminder">
                        <Send className="w-3.5 h-3.5" />
                      </Button>
                    )}
                  </div>
                );
              }
            } else {
              const hasSentLOE = documents.some((d) => d.trial_id === deal.id && d.status === 'sent');
              if (!hasSentLOE && days < 90) {
                return (
                  <Badge style={{ fontSize: 'var(--theme-text-caption)', borderRadius: 'var(--theme-button-radius)', backgroundColor: 'color-mix(in srgb, var(--theme-warning) 15%, white)', color: 'color-mix(in srgb, var(--theme-warning) 80%, black)', border: '1px solid color-mix(in srgb, var(--theme-warning) 30%, white)' }}>
                    Create LOE
                  </Badge>
                );
              }
            }
            return null;
          })()}
        </div>
      </div>
    </div>
  );
}
