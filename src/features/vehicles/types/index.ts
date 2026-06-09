/**
 * Interface cho Nhật ký hoạt động của Xe
 */
export interface ActivityLog {
  timestamp: string;
  activity: 'Entry' | 'Exit' | 'Violation';
  location: string;
  duration: string;
}

/**
 * Interface cho thông tin chi tiết xe
 */
export interface VehicleInfo {
  licensePlate: string;
  model: string;
  color: string;
  colorHex: string;
  entryTime: string;
  type: string;
  ticketNo: string;
  rateTier: string;
}
