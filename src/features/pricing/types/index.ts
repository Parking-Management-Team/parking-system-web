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

// Request body để tạo 1 khung giờ trong chính sách mới
export interface CreatePricingWindowRequest {
  windowName: string;               // Tên khung giờ (vd: "Day Shift")
  startTime: string;                // Định dạng "HH:mm" (vd: "06:00")
  endTime: string;                  // Định dạng "HH:mm" (vd: "18:00")
  baseDurationMinutes: number;      // Thời lượng block đầu (phút)
  basePrice: number;                // Đơn giá block đầu (VNĐ)
  incrementBlockMinutes: number;    // Thời lượng mỗi block tiếp theo (phút)
  incrementPrice: number;           // Đơn giá block tiếp theo (VNĐ)
  windowCap: number | null;         // Giá trần (null = không giới hạn)
  gracePeriodMinutes: number;       // Thời gian ân hạn (phút)
}

// Request body để tạo chính sách giá mới (POST /api/pricing-policies)
export interface CreatePricingPolicyRequest {
  vehicleTypeId: number;            // 1 = Xe máy, 2 = Ô tô
  policyName: string;               // Tên chính sách
  effectiveStart: string;           // ISO DateTime: "2026-06-15T00:00:00Z"
  effectiveEnd: string | null;      // null = vô thời hạn
  pricingWindows: CreatePricingWindowRequest[]; // Phải có ít nhất 1
}

// Request body để cập nhật khung giờ (PUT /api/pricing-policies/windows/{id})
export interface UpdatePricingWindowRequest {
  windowName: string;
  startTime: string;
  endTime: string;
  baseDurationMinutes: number;
  basePrice: number;
  incrementBlockMinutes: number;
  incrementPrice: number;
  windowCap: number | null;
  removeWindowCap: boolean;         // true = xóa bỏ giá trần trên server
  gracePeriodMinutes: number;
}

export interface VehicleType {
  id: number;
  name: string;
  description?: string;
  vehicleTypeStatus?: string;
}

