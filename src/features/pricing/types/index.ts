/**
 * Pricing Feature Type Definitions - Synchronized with PBMS DB Schema
 */

export interface PricingWindow {
  pricingWindowId: number;
  pricingPolicyId: number;
  windowName: string;
  startTime: string; // "HH:mm:ss"
  endTime: string;   // "HH:mm:ss"
  baseDurationMinutes: number;
  basePrice: number;
  incrementBlockMinutes: number;
  incrementPrice: number;
  windowCap: number | null;
  gracePeriodMinutes: number;
}

export interface StandardTariff {
  pricingPolicyId: number;
  vehicleTypeId: number;
  policyName: string;
  effectiveStart: string; // "YYYY-MM-DD"
  effectiveEnd: string | null;
  pricingPolicyStatus: 'Active' | 'Inactive';
  pricingWindows: PricingWindow[];
}

export interface TariffRowDetails {
  basePrice: number;
  initialDuration: string;
  blockPrice: number;
  increment: string;
  startTime: string;
  endTime: string;
  maxCap: number;
  graceVal: string;
}

export interface TariffRow {
  id: string; // format: "policyId-windowId"
  vehicleType: string;
  timeSlot: string;
  baseRate: string;
  incrementalRate: string;
  dailyCap: string;
  gracePeriod: string;
  isActive: boolean;
  details: TariffRowDetails;
}

export interface MonthlyMembership {
  id: string;
  vehicleType: string;
  price: string;
  priceNum: number;
}

export type FeePenaltyType = 'deposit' | 'noshow' | 'lostcard' | 'wrongzone';
export type TriggerType = 'time' | 'manual';

export interface ServiceFeeOrPenalty {
  id: string;
  name: string;
  type: FeePenaltyType;
  amount: string;
  amountNum: number;
  description: string;
  triggerType: TriggerType;
  triggerVal?: number; // minutes for time-based trigger
  isActive: boolean;
}
