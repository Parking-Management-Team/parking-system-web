/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * 📌 FILE: FacilitiesContext.tsx (REACT CONTEXT PROVIDER QUẢN LÝ HẠ TẦNG FACILITIES)
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * 🎯 MỤC ĐÍCH FILE:
 * Nhà cung cấp bối cảnh dữ liệu dùng chung (React Context Provider) cho phân hệ Hạ tầng (Facilities):
 * 1. 🏢 Đóng gói dữ liệu state từ `useFacilities()` thành Nguồn dữ liệu chung duy nhất (Single Source of Truth).
 * 2. 🔄 Chia sẻ dữ liệu Tòa nhà, Tầng, Phân khu (Zone), Loại xe và Trạng thái Modal đóng/mở
 *    cho tất cả các Component con mà không bị gián đoạn hay phải truyền Props nhiều tầng (Avoid Prop Drilling).
 * 3. 🛡️ Cung cấp Custom Hook `useFacilitiesContext()` kiểm tra tính hợp lệ khi truy cập Context.
 * ═══════════════════════════════════════════════════════════════════════════════
 */

'use client';

import React, { createContext, useContext } from 'react';
import { useFacilities } from '../hooks/useFacilities';

// 📐 Trích xuất kiểu dữ liệu cho Context dựa trên kiểu giá trị trả về của hook `useFacilities`
type FacilitiesContextType = ReturnType<typeof useFacilities>;

// 🏗️ Khởi tạo Context lưu trữ dữ liệu hạ tầng Facilities
const FacilitiesContext = createContext<FacilitiesContextType | undefined>(undefined);

/**
 * 🧱 Component `FacilitiesProvider`
 * Nhà cung cấp Context bao bọc xung quanh các trang con của phân hệ Facilities:
 * - Gọi hook `useFacilities()` khởi tạo toàn bộ state & logic CRUD.
 * - Truyền đối tượng `value` xuống cho toàn bộ các Sub-components / Modals / Tables bên dưới.
 *
 * @param children Các thành phần giao diện con thuộc phân hệ Facilities
 */
export function FacilitiesProvider({ children }: { children: React.ReactNode }) {
  const value = useFacilities();
  return (
    <FacilitiesContext.Provider value={value}>
      {children}
    </FacilitiesContext.Provider>
  );
}

/**
 * 🏑 Hook tiện ích `useFacilitiesContext`
 * Cho phép bất kỳ Component con nào trong phân hệ Facilities dễ dàng truy xuất trực tiếp
 * đến State và các hàm xử lý hành động (CRUD Tòa nhà, Tầng, Phân khu Zone, Loại xe).
 *
 * @throws {Error} Quăng lỗi nếu hook được gọi ngoài phạm vi của `FacilitiesProvider`
 */
export function useFacilitiesContext() {
  const context = useContext(FacilitiesContext);
  if (!context) {
    throw new Error('useFacilitiesContext must be used within a FacilitiesProvider');
  }
  return context;
}
