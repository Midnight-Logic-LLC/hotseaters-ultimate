import { useEffect, type ReactNode } from 'react';
import { cn } from '@/shared/lib/cn';

/**
 * Bottom sheet — the native-feel modal surface for mobile form factor.
 *
 * On mobile, dialogs should present as a sheet sliding up from the bottom
 * edge, not a centered desktop dialog. This primitive provides that: a
 * scrim + a rounded sheet anchored to the bottom, with safe-area padding and
 * a drag-handle affordance.
 *
 * A shared UI component — pure presentation. It takes open/onClose as props;
 * the deciding logic (and whether to use this vs a desktop dialog) lives in
 * feature components driven by `useIsMobile`.
 *
 * Once shadcn/Base UI is installed, this can be reimplemented on Base UI's
 * Dialog primitive for focus-trapping and ARIA; the prop surface stays the
 * same.
 */
export function BottomSheet({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title?: string | undefined;
  children: ReactNode;
}) {
  // Close on Escape; lock body scroll while open.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      {/* Scrim */}
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="absolute inset-0 bg-black/40"
      />
      {/* Sheet */}
      <div
        className={cn(
          'relative w-full rounded-t-2xl bg-[var(--color-surface)]',
          'max-h-[85vh] overflow-y-auto overscroll-contain',
          // Honor the home-indicator safe area.
          'pb-[max(1rem,env(safe-area-inset-bottom))]',
          'motion-safe:animate-[sheet-up_200ms_ease-out]',
        )}
      >
        {/* Drag-handle affordance */}
        <div className="flex justify-center pt-3">
          <span className="h-1 w-10 rounded-full bg-[var(--color-stone-200)]" />
        </div>
        {title && (
          <h2 className="px-5 pt-3 font-[family-name:var(--font-sans)] text-base font-semibold text-[var(--color-stone-900)]">
            {title}
          </h2>
        )}
        <div className="px-5 py-4">{children}</div>
      </div>

      <style>{`
        @keyframes sheet-up {
          from { transform: translateY(100%); }
          to   { transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
