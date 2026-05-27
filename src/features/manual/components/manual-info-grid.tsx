interface ManualInfoGridItem {
  title: string;
  desc: string;
}

interface ManualInfoGridProps {
  items: ManualInfoGridItem[] | [string, string][];
  cols?: 2 | 3 | 4;
  color?: string;
}

/**
 * A grid of small info cards.
 * items = [{ title, desc }] or [[title, desc]]
 * cols = 2 | 3 | 4
 */
export function ManualInfoGrid({ items, cols = 2, color }: ManualInfoGridProps) {
  const normalized = items.map(i =>
    Array.isArray(i) ? { title: i[0], desc: i[1] } : i
  );
  const colClass = cols === 4 ? 'md:grid-cols-4' : cols === 3 ? 'md:grid-cols-3' : 'md:grid-cols-2';

  return (
    <div className={`grid grid-cols-1 ${colClass} gap-3 my-5`}>
      {normalized.map(({ title, desc }) => (
        <div
          key={title}
          className="p-3.5 rounded-lg"
          style={{
            background: color ? color + '0d' : '#f5f5f4',
            border: `1px solid ${color ? color + '25' : '#e7e5e4'}`,
          }}
        >
          <p className="text-[13px] font-bold mb-0.5" style={{ color: color || '#1c1917' }}>{title}</p>
          <p className="text-xs leading-relaxed" style={{ color: '#57534e' }}>{desc}</p>
        </div>
      ))}
    </div>
  );
}
