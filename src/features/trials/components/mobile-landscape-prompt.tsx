/**
 * mobile-landscape-prompt.tsx
 *
 * Port of HotSeatersMVP/src/components/schedule/MobileLandscapePrompt.jsx.
 *
 * Overlay shown on mobile in portrait mode when the timeline view is active.
 * Prompts the user to rotate to landscape for a usable timeline experience.
 *
 * RULE B: pure presentational — no stores, no I/O.
 */

import { RotateCw } from 'lucide-react';

export function MobileLandscapePrompt() {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      <div
        className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
        style={{
          background:
            'color-mix(in srgb, var(--theme-brand-primary) 10%, white)',
        }}
      >
        <RotateCw
          className="w-8 h-8"
          style={{ color: 'var(--theme-brand-primary)' }}
        />
      </div>
      <h3
        className="font-semibold mb-2"
        style={{
          fontSize: 'var(--theme-text-card-title)',
          color: 'var(--theme-stone-900)',
        }}
      >
        Rotate for Timeline View
      </h3>
      <p
        className="max-w-xs"
        style={{
          fontSize: 'var(--theme-text-body)',
          color: 'var(--theme-stone-500)',
        }}
      >
        Turn your phone sideways to landscape mode for the best timeline
        experience, or switch back to List view.
      </p>
    </div>
  );
}
