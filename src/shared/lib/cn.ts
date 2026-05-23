import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * `cn` — Tailwind class-name composer.
 * Used by every shadcn primitive copied in Change 2.
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
