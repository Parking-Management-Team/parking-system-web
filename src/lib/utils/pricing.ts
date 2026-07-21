import { VehicleType } from '@/constants/parking.constants';
import { roundCashVND } from './format';

/**
 * Bảng giá mặc định dự phòng (Fallback) khi chưa tải xong từ API
 */
const STANDARD_PRICING = {
  MOTORBIKE: {
    DAY: {
      basePrice:      5_000,
      baseDuration:   4,
      blockPrice:     1_000,
      blockDuration:  1,
      windowCap:      10_000,
    },
    NIGHT: {
      basePrice:      5_000,
      baseDuration:   4,
      blockPrice:     2_000,
      blockDuration:  1,
      windowCap:      20_000,
    },
  },
  CAR: {
    DAY: {
      basePrice:      30_000,
      baseDuration:   4,
      blockPrice:     10_000,
      blockDuration:  1,
      windowCap:      100_000,
    },
    NIGHT: {
      basePrice:      30_000,
      baseDuration:   4,
      blockPrice:     12_000,
      blockDuration:  1,
      windowCap:      120_000,
    },
  },
} as const;

/**
 * Phụ phí & Phạt mặc định
 */
const SURCHARGE = {
  BOOKING_DEPOSIT:    5_000,
  LOST_CARD_PENALTY:  50_000,
  WRONG_ZONE_PENALTY: 100_000,
} as const;

export interface FeeCalculationResult {
  basePrice: number;
  blockPrice: number;
  additionalHours: number;
  surcharges: { name: string; amount: number }[];
  totalBeforeRounding: number;
  totalAmount: number;
  isNightRate: boolean;
  rawHours: number;
}

/**
 * Tính toán phí gửi xe theo thời gian vào/ra và loại phương tiện
 */
export function calculateParkingFee(
  entryTime: Date | string,
  exitTime: Date | string,
  vehicleType: VehicleType,
  options?: {
    hasLostCard?: boolean;
    hasWrongZone?: boolean;
    isBooking?: boolean;
  }
): FeeCalculationResult {
  const entry = new Date(entryTime);
  const exit = new Date(exitTime);

  const diffMs = exit.getTime() - entry.getTime();
  const rawHours = Math.max(0, diffMs / (1000 * 60 * 60));

  // Kiểm tra khung giờ đêm (18:00 - 06:00)
  const entryHour = entry.getHours();
  const isNightRate = entryHour >= 18 || entryHour < 6;

  const rates = isNightRate
    ? STANDARD_PRICING[vehicleType].NIGHT
    : STANDARD_PRICING[vehicleType].DAY;

  const basePrice = rates.basePrice;
  const blockPrice = rates.blockPrice;
  const cap = rates.windowCap;

  let totalBeforeRounding: number = basePrice;
  let additionalHours = 0;

  if (rawHours > 4) {
    additionalHours = Math.ceil(rawHours - 4);
    totalBeforeRounding += additionalHours * blockPrice;
  }

  // Giới hạn giá tối đa
  if (totalBeforeRounding > cap) {
    totalBeforeRounding = cap;
  }

  // Tính phụ phí
  const surchargesList: { name: string; amount: number }[] = [];
  if (options?.hasLostCard) {
    surchargesList.push({ name: 'Lost Card', amount: SURCHARGE.LOST_CARD_PENALTY });
  }
  if (options?.hasWrongZone) {
    surchargesList.push({ name: 'Wrong Zone', amount: SURCHARGE.WRONG_ZONE_PENALTY });
  }
  if (options?.isBooking) {
    surchargesList.push({ name: 'Deposit Deducted', amount: -SURCHARGE.BOOKING_DEPOSIT });
  }

  const surchargeSum = surchargesList.reduce((sum, item) => sum + item.amount, 0);
  const totalWithSurcharge = Math.max(0, totalBeforeRounding + surchargeSum);

  return {
    basePrice,
    blockPrice,
    additionalHours,
    surcharges: surchargesList,
    totalBeforeRounding: totalWithSurcharge,
    totalAmount: roundCashVND(totalWithSurcharge),
    isNightRate,
    rawHours,
  };
}
