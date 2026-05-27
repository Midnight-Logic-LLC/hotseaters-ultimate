interface ManualParagraphProps {
  children: React.ReactNode;
}

/**
 * Standard body paragraph with consistent typography.
 */
export function ManualParagraph({ children }: ManualParagraphProps) {
  return (
    <p className="text-[13px] leading-relaxed mb-4" style={{ color: '#57534e' }}>
      {children}
    </p>
  );
}
