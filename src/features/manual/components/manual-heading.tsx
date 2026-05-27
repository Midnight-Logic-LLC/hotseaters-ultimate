interface ManualHeadingProps {
  children: React.ReactNode;
  color?: string;
}

/**
 * An h3-level sub-heading within a ManualSection.
 * Keeps consistent typography across all manual pages.
 */
export function ManualHeading({ children, color = '#1c1917' }: ManualHeadingProps) {
  return (
    <h3 className="text-[13px] font-bold uppercase tracking-wider mt-8 mb-3 first:mt-0" style={{ color }}>
      {children}
    </h3>
  );
}
