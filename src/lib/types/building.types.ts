// Định nghĩa enum đại diện cho các trạng thái hoạt động của một tòa nhà
export enum BuildingStatus {
  Available = 0,    // Trạng thái 0: Tòa nhà đang khả dụng, hoạt động bình thường
  Occupied = 1,     // Trạng thái 1: Tòa nhà đã bị lấp đầy, không còn chỗ trống
  Reserved = 2,     // Trạng thái 2: Tòa nhà đang được đặt trước/giữ chỗ
  OutOfService = 3, // Trạng thái 3: Tòa nhà đang bảo trì hoặc tạm thời ngừng hoạt động
}

// Định nghĩa interface mô tả cấu trúc dữ liệu của một Tòa nhà (Building) nhận từ backend
export interface Building {
  id: number;             // ID duy nhất của tòa nhà (số nguyên tăng tự động)
  code: string;           // Mã của tòa nhà (ví dụ: BLD01)
  name: string;           // Tên tòa nhà (ví dụ: Building A)
  address: string | null; // Địa chỉ của tòa nhà, có thể là chuỗi ký tự hoặc null
  totalFloor: number;     // Tổng số tầng đỗ xe của tòa nhà
  status: BuildingStatus; // Trạng thái hoạt động hiện tại (kiểu enum BuildingStatus)
}

// Định nghĩa interface mô tả dữ liệu cần truyền lên khi tạo mới một Tòa nhà
export interface BuildingCreateRequest {
  code: string;       // Mã tòa nhà (bắt buộc, ví dụ: BLD01)
  name: string;       // Tên tòa nhà (bắt buộc, ví dụ: Building A)
  address?: string;   // Địa chỉ tòa nhà (tùy chọn, không bắt buộc)
  totalFloor: number; // Tổng số tầng (bắt buộc, kiểu số nguyên từ 1 đến 100)
}

// Định nghĩa interface mô tả dữ liệu cần truyền lên khi cập nhật thông tin một Tòa nhà
export interface BuildingUpdateRequest {
  code: string;           // Mã tòa nhà mới hoặc cũ cần cập nhật (bắt buộc)
  name: string;           // Tên tòa nhà mới cần cập nhật (bắt buộc)
  address?: string;       // Địa chỉ mới cần cập nhật (tùy chọn)
  totalFloor: number;     // Tổng số tầng mới cần cập nhật (bắt buộc)
  status: BuildingStatus; // Trạng thái hoạt động mới cần cập nhật (bắt buộc)
}

// Định nghĩa interface mô tả cấu trúc BaseResponse chuẩn hóa từ Backend API
export interface BaseResponse<T> {
  success: boolean;       // Biến boolean chỉ thị xem yêu cầu API thành công hay thất bại
  message: string | null; // Chuỗi ký tự chứa thông điệp phản hồi từ server (nếu có)
  errorCode: string | null; // Mã lỗi của hệ thống dùng để tra cứu hoặc dịch ngôn ngữ
  data: T | null;         // Kiểu dữ liệu Generic chứa thông tin thực tế trả về từ backend
  errors: Record<string, string[]> | null; // Tập hợp các lỗi Validation từ ModelState backend
}

// Định nghĩa interface mô tả kết quả phân trang PagedResult từ Backend API
export interface PagedResult<T> {
  items: T[];             // Danh sách các đối tượng dữ liệu của trang hiện tại
  pageIndex: number;      // Số thứ tự trang hiện tại (bắt đầu từ 1)
  pageSize: number;       // Số lượng phần tử tối đa trên mỗi trang
  totalCount: number;     // Tổng số bản ghi thực tế tồn tại trong cơ sở dữ liệu
  totalPages: number;     // Tổng số trang tính toán dựa trên tổng số bản ghi và pageSize
  hasPreviousPage: boolean; // Cờ boolean báo hiệu có trang trước đó hay không
  hasNextPage: boolean;     // Cờ boolean báo hiệu có trang tiếp theo hay không
}

