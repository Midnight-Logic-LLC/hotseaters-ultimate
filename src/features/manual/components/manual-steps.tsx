import React from "react";

interface ManualStepsProps {
  steps: (string | React.ReactNode)[];
  color?: string;
}

export function ManualSteps({ steps, color = '#4f46e5' }: ManualStepsProps) {
  return (
    <div className="space-y-3 my-4 pl-1">
      {steps.map((step, i) => (
        <div key={i} className="flex items-start gap-3">
          <div
            className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-[11px] font-bold text-white mt-0.5"
            style={{ background: color }}
          >
            {i + 1}
          </div>
          <p className="text-[13px] leading-relaxed" style={{ color: '#44403c' }}>{step}</p>
        </div>
      ))}
    </div>
  );
}
