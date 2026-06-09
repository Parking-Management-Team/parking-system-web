/**
 * Pricing Feature Type Definitions
 */

export interface PricingDetails {
  basePrice: number;
  initialDuration: string;
  blockPrice: number;
  increment: string;
  startTime: string;
  endTime: string;
  maxCap: number;
  graceVal: string;
}

export interface StandardTariff {
  id: string;
  vehicleType: string;
  timeSlot: string;
  baseRate: string;
  incrementalRate: string;
  dailyCap: string;
  gracePeriod: string;
  isActive: boolean;
  details: PricingDetails;
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
