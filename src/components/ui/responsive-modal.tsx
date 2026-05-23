import type { ReactNode } from 'react';
import { useIsMobile } from '@/shared/hooks/use-media-query';
import { BottomSheet } from '@/components/ui/bottom-sheet';

/**
 * Responsive modal — a bottom sheet on mobile, a centered dialog on desktop.
 *
 * Feature components use this instead of choosing a presentation themselves.
 * The breakpoint decision comes from the shared `useIsMobile` hook, so the
 * native-feel mobile pattern (slide-up sheet) and the desktop pattern
 * (centered card) share one call site.
 */
export function ResponsiveModal({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
}) {
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <BottomSheet open={open} onClose={onClose} title={title}>
        {children}
      </BottomSheet>
    );
  }

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-6"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="absolute inset-0 bg-black/40"
      />
      <div className="relative w-full max-w-md rounded-[var(--radius-card)] bg-[var(--color-surface)] shadow-xl">
        {title && (
          <h2 className="border-b border-[var(--color-stone-200)] px-5 py-4 font-[family-name:var(--font-sans)] text-base font-semibold text-[var(--color-stone-900)]">
            {title}
          </h2>
        )}
        <div className="px-5 py-4">{children}</div>
      </div>
    </div>
  );
}
