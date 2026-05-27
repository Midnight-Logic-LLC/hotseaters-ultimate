import { Lightbulb } from 'lucide-react';

interface ManualQuickTipProps {
  children: React.ReactNode;
  color?: string;
}

export function ManualQuickTip({ children, color = '#4f46e5' }: ManualQuickTipProps) {
  return (
    <div
      className="flex items-start gap-3 p-4 rounded-lg my-5"
      style={{
        background: color + '12',
        border: `1px solid ${color}30`,
      }}
    >
      <Lightbulb className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color }} />
      <p className="text-[13px] m-0 leading-relaxed" style={{ color: '#44403c' }}>{children}</p>
    </div>
  );
}
