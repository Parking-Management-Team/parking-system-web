'use client';

import React, { createContext, useContext } from 'react';
import { useFacilities } from '../hooks/useFacilities';

// Định nghĩa kiểu dữ liệu cho Context dựa trên giá trị trả về của hook useFacilities
type FacilitiesContextType = ReturnType<typeof useFacilities>;

const FacilitiesContext = createContext<FacilitiesContextType | undefined>(undefined);

/**
 * Nhà cung cấp Context (Provider) cho phân hệ Facilities, giúp đồng bộ hóa dữ liệu
 * và chia sẻ trạng thái chung giữa layout và các trang con (sub-routes).
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
 * Hook tiện ích để lấy trực tiếp context của Facilities
 */
export function useFacilitiesContext() {
  const context = useContext(FacilitiesContext);
  if (!context) {
    throw new Error('useFacilitiesContext must be used within a FacilitiesProvider');
  }
  return context;
}
