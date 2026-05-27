interface ManualSectionProps {
  id: string;
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  title: string;
  color: string;
  children: React.ReactNode;
}

/**
 * A docs-style content section. Always visible (no accordion).
 * Rendered as an <article> with an anchor id for TOC scrolling.
 */
export function ManualSection({ id, icon: Icon, title, color, children }: ManualSectionProps) {
  return (
    <article id={id} className="scroll-mt-20">
      {/* Section heading */}
      <div className="flex items-center gap-3 mb-5">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: color + '18' }}>
          <Icon className="w-4 h-4" style={{ color }} />
        </div>
        <h2 className="text-lg font-bold" style={{ color: color }}>{title}</h2>
      </div>

      {/* Section body */}
      <div className="pl-11 rounded-lg p-5" style={{ background: 'white', border: '1px solid #e7e5e4' }}>
        {children}
      </div>
    </article>
  );
}
