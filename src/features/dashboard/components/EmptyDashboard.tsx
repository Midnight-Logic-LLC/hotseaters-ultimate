/**
 * EmptyDashboard — first-run state shown when the current company has no
 * clients and no trials. Inspired by the MVP's empty `Recent Activity`
 * treatment but extended to a full-page hero so freshly-onboarded teams
 * see a clear next step.
 */

import { useNavigate } from 'react-router-dom';
import { Rocket, Users, Gavel, BookOpen } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { useTier1 } from '@/app/tier1-provider';

export function EmptyDashboard() {
  const navigate = useNavigate();
  useTier1(); // ensure the provider is mounted; greet generically for v0.1.

  return (
    <Card
      className="overflow-hidden"
      style={{
        borderRadius: 'var(--theme-card-radius)',
        boxShadow: 'var(--theme-card-shadow)',
        borderWidth: 'var(--theme-card-border)',
        backgroundColor: 'var(--theme-card-bg)',
      }}
    >
      <CardContent
        className="flex flex-col items-center text-center"
        style={{ padding: '2.5rem 1.5rem' }}
      >
        <span
          className="mb-4 flex h-14 w-14 items-center justify-center rounded-full"
          style={{
            backgroundColor:
              'color-mix(in srgb, var(--theme-brand-primary) 14%, white)',
            color: 'var(--theme-brand-primary)',
          }}
        >
          <Rocket className="h-7 w-7" />
        </span>
        <h2
          className="font-bold"
          style={{
            fontSize: 'var(--theme-text-card-title)',
            color: 'var(--theme-stone-900)',
          }}
        >
          Welcome to HotSeaters
        </h2>
        <p
          className="mt-2 max-w-md"
          style={{
            fontSize: 'var(--theme-text-body)',
            color: 'var(--theme-stone-600)',
          }}
        >
          Your dashboard lights up as soon as you add your first client and
          open your first trial. Start with one of these.
        </p>
        <div className="mt-6 grid w-full max-w-lg grid-cols-1 gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => navigate('/clients/new')}
            className="flex items-center gap-3 rounded-lg border p-3 text-left transition-colors hover:bg-stone-50"
            style={{ minHeight: '44px', borderColor: 'var(--theme-stone-200)' }}
          >
            <Users className="h-5 w-5 text-emerald-600" />
            <span className="flex-1">
              <span
                className="block font-semibold"
                style={{ color: 'var(--theme-stone-900)' }}
              >
                Add your first client
              </span>
              <span
                className="block"
                style={{
                  fontSize: 'var(--theme-text-caption)',
                  color: 'var(--theme-stone-500)',
                }}
              >
                A law firm or in-house team
              </span>
            </span>
          </button>
          <button
            type="button"
            onClick={() => navigate('/Trials?new=1')}
            className="flex items-center gap-3 rounded-lg border p-3 text-left transition-colors hover:bg-stone-50"
            style={{ minHeight: '44px', borderColor: 'var(--theme-stone-200)' }}
          >
            <Gavel className="h-5 w-5 text-indigo-600" />
            <span className="flex-1">
              <span
                className="block font-semibold"
                style={{ color: 'var(--theme-stone-900)' }}
              >
                Open your first trial
              </span>
              <span
                className="block"
                style={{
                  fontSize: 'var(--theme-text-caption)',
                  color: 'var(--theme-stone-500)',
                }}
              >
                Sales pipeline or operations
              </span>
            </span>
          </button>
        </div>
        <button
          type="button"
          onClick={() => navigate('/manual')}
          className="mt-6 flex items-center gap-2 text-sm transition-colors hover:underline"
          style={{ color: 'var(--theme-brand-primary)', minHeight: '44px' }}
        >
          <BookOpen className="h-4 w-4" />
          Read the user manual
        </button>
      </CardContent>
    </Card>
  );
}
