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
  createdAt: string;
}

export interface StandardTariff {
  pricingPolicyId: number;
  vehicleTypeId: number;
  vehicleTypeName?: string;
  policyName: string;
  priority?: number;
  effectiveStart: string; // "YYYY-MM-DDTHH:mm:ssZ"
  effectiveEnd: string | null;
  pricingPolicyStatus: 'Active' | 'Inactive' | 'Expired' | string;
  pricingWindows: PricingWindow[];
  createdAt: string;
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


export interface ServiceFeeOrPenalty {
  id: string;
  incidentTypeId: number;
  name: string;
  type: string;
  amount: string;
  amountNum: number;
  description: string;
  isActive: boolean;
  hasConfig: boolean;
}

export interface IncidentType {
  id: number;
  incidentCode: string;
  incidentName: string;
  description: string;
  defaultPenaltyFee: number;
}

// Request body để tạo 1 khung giờ trong chính sách mới
export interface CreatePricingWindowRequest {
  windowName: string;               // Tên khung giờ (vd: "Day Shift")
  startTime: string;                // Định dạng "HH:mm:ss" (vd: "06:00:00")
  endTime: string;                  // Định dạng "HH:mm:ss" (vd: "18:00:00")
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
  priority?: number;                // Độ ưu tiên (0 = Mặc định, >=1 = Lễ/Sự kiện)
  effectiveStart: string;           // ISO DateTime: "2026-06-15T00:00:00Z"
  effectiveEnd: string | null;      // null = vô thời hạn
  pricingWindows: CreatePricingWindowRequest[]; // Phải có ít nhất 1
}

// Request body để cập nhật khung giờ (PUT /api/pricing-policies/windows/{id})
// Tất cả fields đều Optional - chỉ gửi field nào muốn thay đổi
export interface UpdatePricingWindowRequest {
  windowName?: string;
  startTime?: string;
  endTime?: string;
  baseDurationMinutes?: number;
  basePrice?: number;
  incrementBlockMinutes?: number;
  incrementPrice?: number;
  windowCap?: number | null;
  removeWindowCap?: boolean;         // true = xóa bỏ giá trần trên server
  gracePeriodMinutes?: number;
}

export interface VehicleType {
  id: number;
  name: string;
  description?: string;
  vehicleTypeStatus?: string;
}

