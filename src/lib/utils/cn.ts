import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Utility to merge Tailwind class names cleanly.
 * Combines clsx (conditional classes) + tailwind-merge (deduplication).
 *
 * @example cn('px-4 py-2', isActive && 'bg-emerald-500', className)
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
