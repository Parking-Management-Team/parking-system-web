
/**
 * Định nghĩa cấu trúc dữ liệu cho Tầng (Floor) quản lý nội bộ
 */
export interface Floor {
  id: number;
  buildingId: number;
  floorNumber: number; // Ví dụ: 1, 2, 3, hoặc -1 cho Hầm B1
  name: string;        // Tên hiển thị (ví dụ: Basement 1, Floor 1)
  totalSlots: number;  // Sức chứa ô đỗ tối đa của tầng này
  status: 'Active' | 'Inactive';
}

/**
 * Định nghĩa cấu trúc dữ liệu cho Phân khu (Zone) quản lý nội bộ
 */
export interface Zone {
  id: number;
  floorId: number;
  code?: string;        // Mã code của zone (ví dụ: ZM01, ZC01)
  name: string;        // Tên phân khu (ví dụ: Zone A, Zone B)
  vehicleType: 'Standard' | 'VIP' | 'EV Charging' | 'Motorbike'; // Loại xe cho phép đỗ
  zoneAccessType: 'GENERAL' | 'MONTHLY'; // GENERAL = Walk-in/Booking, MONTHLY = Thẻ tháng
  slotCapacity: number; // Sức chứa ô đỗ của phân khu này
  status: 'Active' | 'Inactive';
}
