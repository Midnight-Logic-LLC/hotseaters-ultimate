/**
 * QuickActionsCard — list of CTAs that deep-link to the destination feature
 * pages. The dashboard never mutates; mutations belong to the destination.
 *
 * Touch targets ≥ 44pt (RULE 4).
 */

import { useNavigate } from 'react-router-dom';
import { Plus, Users, Gavel, Search, BookOpen } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { useTier1 } from '@/app/tier1-provider';

interface QuickAction {
  label: string;
  description: string;
  icon: typeof Plus;
  onClick: () => void;
  visible: boolean;
}

export function QuickActionsCard() {
  const navigate = useNavigate();
  const { role } = useTier1();
  const isSalesy = role === 'owner' || role === 'admin' || role === 'sales';

  const actions: QuickAction[] = [
    {
      label: 'New Client',
      description: 'Add a law firm or in-house client',
      icon: Users,
      onClick: () => navigate('/clients/new'),
      visible: isSalesy,
    },
    {
      label: 'New Trial',
      description: 'Open a deal or operations trial',
      icon: Gavel,
      onClick: () => navigate('/Trials?new=1'),
      visible: true,
    },
    {
      label: 'Find a Trial',
      description: 'Search across all your trials',
      icon: Search,
      onClick: () => navigate('/Trials'),
      visible: true,
    },
    {
      label: 'User Manual',
      description: 'How HotSeaters works',
      icon: BookOpen,
      onClick: () => navigate('/manual'),
      visible: true,
    },
  ].filter((a) => a.visible);

  return (
    <Card
      style={{
        borderRadius: 'var(--theme-card-radius)',
        boxShadow: 'var(--theme-card-shadow)',
        borderWidth: 'var(--theme-card-border)',
        backgroundColor: 'var(--theme-card-bg)',
      }}
    >
      <CardHeader
        className="border-b"
        style={{
          padding: 'var(--theme-card-header-padding)',
          backgroundColor: 'var(--theme-card-header-bg)',
          borderBottomColor: 'var(--theme-stone-100)',
        }}
      >
        <CardTitle
          className="flex items-center"
          style={{
            fontSize: 'var(--theme-text-card-title)',
            color: 'var(--theme-stone-900)',
            gap: 'var(--theme-element-gap)',
          }}
        >
          <Plus className="h-5 w-5 text-indigo-600" />
          Quick Actions
        </CardTitle>
      </CardHeader>
      <CardContent
        style={{ padding: 'var(--theme-card-padding)' }}
        className="grid grid-cols-1 gap-2 md:grid-cols-2"
      >
        {actions.map((action) => {
          const Icon = action.icon;
          return (
            <button
              key={action.label}
              type="button"
              onClick={action.onClick}
              className="flex w-full items-center gap-3 rounded-lg border p-3 text-left transition-colors hover:bg-stone-50"
              style={{
                minHeight: '44px',
                borderColor: 'var(--theme-stone-200)',
              }}
            >
              <span
                className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-md"
                style={{
                  backgroundColor:
                    'color-mix(in srgb, var(--theme-brand-primary) 12%, white)',
                  color: 'var(--theme-brand-primary)',
                }}
              >
                <Icon className="h-4 w-4" />
              </span>
              <span className="min-w-0 flex-1">
                <span
                  className="block font-semibold"
                  style={{
                    fontSize: 'var(--theme-text-body)',
                    color: 'var(--theme-stone-900)',
                  }}
                >
                  {action.label}
                </span>
                <span
                  className="block truncate"
                  style={{
                    fontSize: 'var(--theme-text-caption)',
                    color: 'var(--theme-stone-500)',
                  }}
                >
                  {action.description}
                </span>
              </span>
            </button>
          );
        })}
      </CardContent>
    </Card>
  );
}
