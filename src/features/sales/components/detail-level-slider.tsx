/**
 * detail-level-slider.tsx — 4-stop slider selecting the revenue detail level.
 *
 * Port of HotSeatersMVP/src/components/sales/DetailLevelSlider.jsx. Stops:
 * Inv | Case | Client | Total. Click a label, a tick, or anywhere on the track
 * to snap to the nearest stop.
 *
 * HotSeatersMVP is the bible.
 */

import { useRef } from 'react';
import type { DetailLevel } from '@/features/deals/business-rules/revenue-detail-aggregator';

interface Level {
  value: DetailLevel;
  label: string;
}

const LEVELS: Level[] = [
  { value: 'invoice', label: 'Inv' },
  { value: 'case', label: 'Case' },
  { value: 'client', label: 'Client' },
  { value: 'total', label: 'Total' },
];

interface DetailLevelSliderProps {
  value: DetailLevel;
  onChange: (value: DetailLevel) => void;
}

export function DetailLevelSlider({ value, onChange }: DetailLevelSliderProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const currentIndex = LEVELS.findIndex((s) => s.value === value);
  const tickSpacing = 100 / (LEVELS.length - 1);

  const handleTrackClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!trackRef.current) return;
    const rect = trackRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = x / rect.width;
    const index = Math.round(percentage * (LEVELS.length - 1));
    const clamped = Math.max(0, Math.min(LEVELS.length - 1, index));
    onChange(LEVELS[clamped]!.value);
  };

  return (
    <div className="flex flex-col select-none" style={{ width: '120px' }}>
      <div className="relative h-4 mb-1">
        {LEVELS.map((level, index) => (
          <div
            key={level.value}
            className="absolute cursor-pointer"
            style={{ left: `${index * tickSpacing}%`, transform: 'translateX(-50%)' }}
            onClick={() => onChange(level.value)}
          >
            <span
              className="text-[10px] font-medium"
              style={{
                color: index === currentIndex ? 'var(--theme-brand-primary)' : 'var(--theme-stone-400)',
              }}
            >
              {level.label}
            </span>
          </div>
        ))}
      </div>
      <div ref={trackRef} className="relative h-4 cursor-pointer flex items-center" onClick={handleTrackClick}>
        <div
          className="absolute w-full h-1 rounded-full"
          style={{ backgroundColor: 'var(--theme-stone-200)' }}
        />
        <div
          className="absolute h-1 rounded-full"
          style={{
            backgroundColor: 'var(--theme-brand-primary)',
            left: 0,
            width: `${currentIndex * tickSpacing}%`,
          }}
        />
        {LEVELS.map((level, index) => (
          <div
            key={level.value}
            className="absolute w-1.5 h-1.5 rounded-full cursor-pointer"
            style={{
              left: `${index * tickSpacing}%`,
              transform: 'translateX(-50%)',
              backgroundColor:
                index <= currentIndex ? 'var(--theme-brand-primary)' : 'var(--theme-stone-400)',
            }}
            onClick={(e) => {
              e.stopPropagation();
              onChange(level.value);
            }}
          />
        ))}
        <div
          className="absolute w-4 h-4 rounded-full shadow-md border-2 cursor-pointer"
          style={{
            backgroundColor: 'white',
            borderColor: 'var(--theme-brand-primary)',
            top: '50%',
            transform: 'translateY(-50%)',
            left: `calc(${currentIndex * tickSpacing}% - 8px)`,
          }}
        />
      </div>
    </div>
  );
}
