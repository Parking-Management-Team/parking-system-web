import { VehicleType, STANDARD_PRICING, SURCHARGE } from '@/constants/parking.constants';
import { roundCashVND } from './format';

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
 * Calculates parking fee based on entry and exit times.
 * Supports day/night rates, base 4 hours block, incremental blocks, and caps.
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

  // Determine if rate is Night rate based on entry hour
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

  // Apply maximum cap
  if (totalBeforeRounding > cap) {
    totalBeforeRounding = cap;
  }

  // Calculate surcharges
  const surchargesList: { name: string; amount: number }[] = [];
  if (options?.hasLostCard) {
    surchargesList.push({ name: 'Lost Card', amount: SURCHARGE.LOST_CARD_PENALTY });
  }
  if (options?.hasWrongZone) {
    surchargesList.push({ name: 'Wrong Zone', amount: SURCHARGE.WRONG_ZONE_PENALTY });
  }
  if (options?.isBooking) {
    // Booking deposit is deducted from the final fee
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
