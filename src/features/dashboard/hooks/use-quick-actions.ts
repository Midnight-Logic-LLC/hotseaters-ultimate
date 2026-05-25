/**
 * use-quick-actions — role + feature-flag aware list of dashboard CTAs.
 *
 * Composes Phase A's `quickActionsFor` (pure policy) with `useNavigate`
 * to produce the QuickActionsBar's render-ready array. Side-effects are
 * deferred to the offline-first phase's `queueSideEffect` API — until
 * then every quick action navigates (no third-party calls).
 *
 * Bible: HotSeatersMVP/src/pages/Dashboard.jsx lines 1326–1437.
 */

import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CalendarOff,
  Clock,
  FileText,
  GanttChart,
  Orbit,
  Plus,
  Receipt,
  Users,
  type LucideIcon,
} from 'lucide-react';
import { useTier1 } from '@/app/tier1-provider';
import {
  quickActionsFor,
  type QuickActionId,
} from '@/features/dashboard/business-rules/quick-action-policy';

export interface QuickAction {
  id: QuickActionId;
  label: string;
  icon: LucideIcon;
  /** Click handler — currently navigate-only; offline-first will add queueSideEffect. */
  onClick: () => void;
  /** Set on HotSeatHub to let the component apply a purple accent per bible. */
  accent?: 'purple';
}

interface ActionDef {
  label: string;
  icon: LucideIcon;
  route: string;
  accent?: 'purple';
}

/** Bible role/route matrix from quick-action-policy + Dashboard.jsx 1338–1432. */
const ACTION_DEFS: Record<QuickActionId, ActionDef> = {
  'new-deal': { label: 'New Deal', icon: Plus, route: '/DealTracker?tab=pipeline' },
  'log-time': { label: 'Log Time', icon: Clock, route: '/TimeAndExpenses' },
  'add-expense': { label: 'Add Expense', icon: Receipt, route: '/TimeAndExpenses' },
  'time-off': { label: 'Time Off', icon: CalendarOff, route: '/TimeAndExpenses' },
  'add-client': { label: 'Add Client', icon: Users, route: '/Clients' },
  'view-schedule': { label: 'View Schedule', icon: GanttChart, route: '/Timeline' },
  'hot-seat-hub': { label: 'HotSeatHub', icon: Orbit, route: '/HelpWanted', accent: 'purple' },
  'new-invoice': { label: 'New Invoice', icon: FileText, route: '/Invoices' },
};

export function useQuickActions(): QuickAction[] {
  const { role, company } = useTier1();
  const navigate = useNavigate();
  return useMemo(() => {
    const ids = quickActionsFor({
      role,
      company: company
        ? {
            marketplace_fill_jobs: company.marketplace_fill_jobs ?? false,
            marketplace_post_jobs: company.marketplace_post_jobs ?? false,
          }
        : null,
    });
    return ids.map<QuickAction>((id) => {
      const def = ACTION_DEFS[id];
      return {
        id,
        label: def.label,
        icon: def.icon,
        onClick: () => navigate(def.route),
        ...(def.accent ? { accent: def.accent } : {}),
      };
    });
  }, [role, company, navigate]);
}
