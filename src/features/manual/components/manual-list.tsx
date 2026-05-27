interface ManualListProps {
  items: (string | React.ReactNode)[];
}

/**
 * A styled bullet list for manual content.
 * items = array of strings or JSX elements
 */
export function ManualList({ items }: ManualListProps) {
  return (
    <ul className="space-y-2 mb-5">
      {items.map((item, i) => (
        <li key={i} className="flex items-start gap-2.5 text-[13px] leading-relaxed" style={{ color: '#57534e' }}>
          <span className="mt-2 w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: '#d6d3d1' }} />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}
