export type LicensePlateVehicleType = 'Motorcycle' | 'Car';

export type LicensePlateValidationResult = {
  isValid: boolean;
  normalized: string;
  formatted: string;
  vehicleType: LicensePlateVehicleType;
  error?: string;
};

/**
 * Shared rules for Vietnamese license plates.
 *
 * Accepted examples:
 * - Car: 51A-123.45, 30F-5678, 80NG-123.45
 * - Motorcycle: 29G1-123.45, 59T2-888.88, 29AA-123.45
 *
 * Separators are accepted for input/display, while normalized values contain
 * only uppercase ASCII letters and digits for API/database comparisons.
 */
export class LicensePlateValidation {
  private static readonly allowedInputPattern = /^[A-Z0-9.\-\s]+$/i;

  private static readonly normalizedPlatePattern =
    /^\d{2}(?:[A-Z]|[A-Z]\d|[A-Z]{2})\d{4,5}$/;

  private static readonly specialCarPrefixes = [
    'LD',
    'DA',
    'MK',
    'HC',
    'NG',
    'QT',
    'NN',
    'KT',
  ];

  static normalize(plate: string): string {
    return String(plate ?? '')
      .trim()
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, '');
  }

  static format(plate: string): string {
    const normalized = this.normalize(plate);
    if (normalized.length < 5) return normalized;

    const match = normalized.match(/^(.*?)(\d{4,5})$/);
    if (!match) return normalized;

    const [, prefix, suffix] = match;
    return suffix.length === 5
      ? `${prefix}-${suffix.substring(0, 3)}.${suffix.substring(3)}`
      : `${prefix}-${suffix}`;
  }

  static detectVehicleType(plate: string): LicensePlateVehicleType {
    const normalized = this.normalize(plate);
    const match = normalized.match(/^(.*?)(\d{4,5})$/);
    if (!match) return 'Car';

    const prefix = match[1];
    if (/^\d{2}[A-Z]\d$/.test(prefix)) {
      return 'Motorcycle';
    }

    if (/^\d{2}[A-Z]{2}$/.test(prefix)) {
      const letters = prefix.substring(2);
      return this.specialCarPrefixes.includes(letters) ? 'Car' : 'Motorcycle';
    }

    return 'Car';
  }

  static validate(plate: string): LicensePlateValidationResult {
    const raw = String(plate ?? '').trim();
    const normalized = this.normalize(raw);
    const formatted = this.format(normalized);
    const vehicleType = this.detectVehicleType(normalized);

    if (!raw) {
      return {
        isValid: false,
        normalized,
        formatted,
        vehicleType,
        error: 'License plate is required.',
      };
    }

    if (raw.length > 20) {
      return {
        isValid: false,
        normalized,
        formatted,
        vehicleType,
        error: 'License plate cannot exceed 20 characters.',
      };
    }

    if (!this.allowedInputPattern.test(raw)) {
      return {
        isValid: false,
        normalized,
        formatted,
        vehicleType,
        error: 'License plate contains unsupported characters.',
      };
    }

    if (!this.normalizedPlatePattern.test(normalized)) {
      return {
        isValid: false,
        normalized,
        formatted,
        vehicleType,
        error:
          'Invalid Vietnamese license plate format. Example: 51A-123.45 or 29G1-123.45.',
      };
    }

    return {
      isValid: true,
      normalized,
      formatted,
      vehicleType,
    };
  }

  static isValid(plate: string): boolean {
    return this.validate(plate).isValid;
  }
}
