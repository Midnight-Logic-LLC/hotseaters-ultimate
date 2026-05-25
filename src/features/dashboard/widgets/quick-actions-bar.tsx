/**
 * QuickActionsBar — bible Dashboard.jsx lines 1326–1437.
 *
 * Reads `useQuickActions()` for the action list (role + flag aware) and
 * `useDashboardLayout()` for the grid class. NO role literal here — the
 * registry + layout hook own gating decisions.
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useQuickActions } from '@/features/dashboard/hooks/use-quick-actions';
import { useDashboardLayout } from '@/features/dashboard/hooks/use-dashboard-widgets';
import { cardStyle, headerPad, bodyPad } from './_styles';

export function QuickActionsBar() {
  const actions = useQuickActions();
  const { quickActionsGridClass } = useDashboardLayout();

  return (
    <Card style={cardStyle()} data-testid="quick-actions-bar">
      <CardHeader style={headerPad()}>
        <CardTitle
          style={{
            fontSize: 'var(--theme-text-card-title)',
            color: 'var(--theme-stone-900)',
          }}
        >
          Quick Actions
        </CardTitle>
      </CardHeader>
      <CardContent style={bodyPad()}>
        <div className={quickActionsGridClass} style={{ gap: 'var(--theme-element-gap)' }}>
          {actions.map((a) => {
            const Icon = a.icon;
            const accentClass =
              a.accent === 'purple' ? 'border-purple-200 hover:bg-purple-50' : '';
            const iconClass =
              a.accent === 'purple' ? 'h-5 w-5 text-purple-600' : 'h-5 w-5';
            return (
              <Button
                key={a.id}
                variant="outline"
                onClick={a.onClick}
                className={`flex h-auto flex-col items-center gap-2 py-4 ${accentClass}`}
                data-testid={`quick-action-${a.id}`}
              >
                <Icon className={iconClass} aria-hidden="true" />
                <span className="text-sm">{a.label}</span>
              </Button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
