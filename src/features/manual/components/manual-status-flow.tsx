import { ArrowRight } from 'lucide-react';

interface ManualStatus {
  label: string;
  bg: string;
  text: string;
}

interface ManualStatusFlowProps {
  statuses: ManualStatus[];
}

export function ManualStatusFlow({ statuses }: ManualStatusFlowProps) {
  return (
    <div
      className="flex items-center gap-2 flex-wrap my-5 py-3 px-4 rounded-lg"
      style={{ background: '#f5f3f0', border: '1px solid #e7e5e4' }}
    >
      {statuses.map((s, i) => (
        <span key={s.label} className="flex items-center gap-2">
          <span
            className="px-3 py-1.5 rounded-md text-xs font-semibold"
            style={{ backgroundColor: s.bg, color: s.text, border: `1px solid ${s.text}15` }}
          >
            {s.label}
          </span>
          {i < statuses.length - 1 && <ArrowRight className="w-3.5 h-3.5" style={{ color: '#d6d3d1' }} />}
        </span>
      ))}
    </div>
  );
}
