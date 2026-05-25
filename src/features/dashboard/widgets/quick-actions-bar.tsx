/**
 * QuickActionsBar — bible Dashboard.jsx lines 1326–1437.
 *
 * Reads `useQuickActions()` (role + flag aware) and renders the bible's
 * tile grid. No role check or feature-flag check in this component —
 * the hook owns that.
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useQuickActions } from '@/features/dashboard/hooks/use-quick-actions';
import { useTier1 } from '@/app/tier1-provider';
import { cardStyle, headerPad, bodyPad } from './_styles';

export function QuickActionsBar() {
  const actions = useQuickActions();
  const { role } = useTier1();
  const isTrialConsultant = role === 'trial_consultant';

  // Bible grid: trial-consultant gets a fixed 4-column shape; everyone else
  // gets a responsive 2 → 3 → 6 grid that wraps gracefully on narrower viewports.
  const gridClass = isTrialConsultant
    ? 'grid grid-cols-2 sm:grid-cols-4'
    : 'grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6';

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
        <div className={gridClass} style={{ gap: 'var(--theme-element-gap)' }}>
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
