/**
 * Format a number as Vietnamese Dong currency.
 * Output: "5.000 ₫"  (dot as thousands separator)
 *
 * @param amount - The amount in VND
 * @param compact - Use compact notation for large numbers (e.g. "1,5 triệu")
 */
export function formatVND(amount: number, compact = false): string {
  if (compact && amount >= 1_000_000) {
    const millions = amount / 1_000_000;
    const formatted = millions % 1 === 0
      ? millions.toFixed(0)
      : millions.toFixed(1);
    return `${formatted} triệu đ`;
  }

  const formatted = new Intl.NumberFormat('vi-VN', {
    maximumFractionDigits: 0,
  }).format(amount ?? 0);

  return `${formatted} đ`;
}

/**
 * Format date to Vietnamese locale string.
 * Output: "28/05/2026"
 */
export function formatDateVI(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(d);
}

/**
 * Format datetime to readable Vietnamese string.
 * Output: "28/05/2026 22:30"
 */
export function formatDateTimeVI(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(d);
}

import { LicensePlateValidation } from '@/lib/validation/LicensePlateValidation';

/**
 * Format a vehicle plate number for display.
 * Automatically inserts hyphens and dots according to Vietnamese standard formats.
 * Example: "51a12345" -> "51A-123.45", "29g11234" -> "29G1-1234"
 */
export function formatPlate(plate: string): string {
  return LicensePlateValidation.format(plate);
}

/**
 * Automatically detects whether a Vietnamese plate belongs to a Motorcycle or a Car.
 * Returns 'Motorcycle' or 'Car'.
 */
export function detectVehicleTypeFromPlate(plate: string): 'Motorcycle' | 'Car' {
  return LicensePlateValidation.detectVehicleType(plate);
}

/**
 * Calculate duration between two dates in human-readable format.
 * Output: "2 giờ 30 phút" or "45 phút"
 */
export function formatDuration(startDate: Date | string, endDate: Date | string): string {
  const start = typeof startDate === 'string' ? new Date(startDate) : startDate;
  const end   = typeof endDate   === 'string' ? new Date(endDate)   : endDate;
  const diffMs = end.getTime() - start.getTime();
  const totalMinutes = Math.floor(diffMs / (1000 * 60));
  const hours   = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours === 0) return `${minutes} phút`;
  if (minutes === 0) return `${hours} giờ`;
  return `${hours} giờ ${minutes} phút`;
}

/**
 * Apply Vietnamese cash rounding rules to an amount.
 * - Fraction < 500 → round down to nearest 1,000
 * - Fraction >= 500 → round up to nearest 1,000
 */
export function roundCashVND(amount: number): number {
  const remainder = amount % 1000;
  if (remainder === 0) return amount;
  if (remainder < 500) return amount - remainder;
  return amount + (1000 - remainder);
}
