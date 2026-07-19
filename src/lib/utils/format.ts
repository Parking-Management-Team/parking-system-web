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
    return `${formatted} triệu VNĐ`;
  }

  const formatted = new Intl.NumberFormat('vi-VN', {
    maximumFractionDigits: 0,
  }).format(amount ?? 0);

  return `${formatted} VNĐ`;
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

/**
 * Format a vehicle plate number for display.
 * Automatically inserts hyphens and dots according to Vietnamese standard formats.
 * Example: "51a12345" -> "51A-123.45", "29g11234" -> "29G1-1234"
 */
export function formatPlate(plate: string): string {
  if (!plate) return '';
  const clean = plate.toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (clean.length < 5) return clean;

  const match = clean.match(/^(.*?)(\d{4,5})$/);
  if (!match) return clean;

  const prefix = match[1];
  const suffix = match[2];

  if (suffix.length === 5) {
    return `${prefix}-${suffix.substring(0, 3)}.${suffix.substring(3)}`;
  } else {
    return `${prefix}-${suffix}`;
  }
}

/**
 * Automatically detects whether a Vietnamese plate belongs to a Motorcycle or a Car.
 * Returns 'Motorcycle' or 'Car'.
 */
export function detectVehicleTypeFromPlate(plate: string): 'Motorcycle' | 'Car' {
  if (!plate) return 'Car';
  const clean = plate.toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (clean.length < 3) return 'Car';

  const match = clean.match(/^(.*?)(\d{4,5})$/);
  if (!match) return 'Car';

  const prefix = match[1];

  // 1. Motorcycle standard: 2 digits + 1 letter + 1 digit (e.g., 29G1, 59T2)
  if (/^\d{2}[A-Z]\d$/.test(prefix)) {
    return 'Motorcycle';
  }

  // 2. Motorcycle electric / under 50cc: 2 digits + 2 letters (e.g., 29AA, 59AB, 29MĐ/29MD)
  // Excluding special car prefixes: LD, DA, MK, HC, NG, QT, NN, KT
  if (/^\d{2}[A-Z]{2}$/.test(prefix)) {
    const letters = prefix.substring(2);
    const carSpecialLetters = ['LD', 'DA', 'MK', 'HC', 'NG', 'QT', 'NN', 'KT'];
    if (carSpecialLetters.includes(letters)) {
      return 'Car';
    }
    return 'Motorcycle';
  }

  return 'Car';
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
