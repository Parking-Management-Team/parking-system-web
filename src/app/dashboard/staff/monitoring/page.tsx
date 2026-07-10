'use client';

import React from 'react';
import { StaffSlotMonitoring } from '@/features/staff';

/**
 * Staff Slot Monitoring Page - màn vận hành gọn cho Staff xác nhận slot thực tế.
 * Không dùng lại màn Facility/Manager để tránh hiển thị dư thông tin quản trị.
 */
export default function SlotMonitoringPage() {
  return <StaffSlotMonitoring />;
}
