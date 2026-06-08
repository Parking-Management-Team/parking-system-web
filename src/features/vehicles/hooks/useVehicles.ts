import { useState, useEffect } from 'react';
import { useAuth } from '@/features/auth';
import { ActivityLog, VehicleInfo } from '../types';

/**
 * Custom hook quản lý toàn bộ logic nghiệp vụ (state, timers, modals, API mock) của quản lý chi tiết xe (Vehicles)
 */
export function useVehicles() {
  const { user } = useAuth();

  // Khai báo state trạng thái đỗ xe
  const [isParked, setIsParked] = useState(true);
  const [parkedSlot, setParkedSlot] = useState('Slot A1-013');

  // Quản lý Modals
  const [showViolationModal, setShowViolationModal] = useState(false);
  const [showTicketModal, setShowTicketModal] = useState(false);

  // Lý do vi phạm được chọn
  const [violationReason, setViolationReason] = useState('Parking Out of Line');
  const [violationNotes, setViolationNotes] = useState('');

  // Các State thông báo Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Quản lý thời gian trôi qua (giả lập xe đã đỗ 2 giờ 15 phút 44 giây ban đầu)
  const [secondsElapsed, setSecondsElapsed] = useState(2 * 3600 + 15 * 60 + 44);

  // Đồng hồ chạy thực tế ở Header
  const [currentTime, setCurrentTime] = useState('00:00:00');
  const [currentDate, setCurrentDate] = useState('Thursday, June 4, 2026');

  // Thông tin xe giả lập (Offline-first fallback)
  const [vehicle, setVehicle] = useState<VehicleInfo>({
    licensePlate: '29A-123.45',
    model: 'Toyota Camry',
    color: 'Metallic Silver',
    colorHex: '#C0C0C0',
    entryTime: 'Jun 04, 18:49',
    type: 'Mid-size Sedan',
    ticketNo: 'TKT-884-2026',
    rateTier: 'Standard VIP'
  });

  // Nhật ký hoạt động xe giả lập (Offline-first fallback)
  const [logs, setLogs] = useState<ActivityLog[]>([
    { timestamp: 'Jun 04, 2026 - 18:49', activity: 'Entry', location: 'Gate 1 - North Entrance', duration: '-' },
    { timestamp: 'May 19, 2026 - 09:15', activity: 'Exit', location: 'Gate 3 - South Exit', duration: '08:30:00' },
    { timestamp: 'May 19, 2026 - 08:45', activity: 'Entry', location: 'Gate 1 - North Entrance', duration: '-' },
  ]);

  // Bộ đếm thời gian đỗ xe & Đồng hồ hệ thống
  useEffect(() => {
    const timeInterval = setInterval(() => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString('en-US', { hour12: false }));
      setCurrentDate(now.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }));
    }, 1000);

    let elapsedInterval: NodeJS.Timeout;
    if (isParked) {
      elapsedInterval = setInterval(() => {
        setSecondsElapsed((prev) => prev + 1);
      }, 1000);
    }

    return () => {
      clearInterval(timeInterval);
      if (elapsedInterval) clearInterval(elapsedInterval);
    };
  }, [isParked]);

  // Hàm chuyển đổi giây thành chuỗi HHh MMm SSs
  const formatDuration = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    return `${String(hours).padStart(2, '0')}h ${String(minutes).padStart(2, '0')}m ${String(secs).padStart(2, '0')}s`;
  };

  // Kích hoạt Toast thông báo ngắn
  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Thực hiện Giải phóng Slot đỗ
  const handleReleaseSlot = async () => {
    if (!isParked) return;
    
    const confirmRelease = window.confirm('Bạn có chắc chắn muốn giải phóng chỗ đỗ A1-013 cho xe này không?');
    if (confirmRelease) {
      try {
        setIsParked(false);
        setParkedSlot('None (Departed)');
        
        const exitTime = new Date().toLocaleTimeString('en-US', { hour12: false });
        const exitDateStr = `Jun 04, 2026 - ${exitTime.substring(0, 5)}`;
        
        const newLog: ActivityLog = {
          timestamp: exitDateStr,
          activity: 'Exit',
          location: 'Gate 2 - Main Exit (Manual Release)',
          duration: formatDuration(secondsElapsed),
        };

        setLogs([newLog, ...logs]);
        triggerToast('Đã giải phóng chỗ đỗ và ghi nhận thời gian rời bãi thành công!');
      } catch (err) {
        console.error('Lỗi giải phóng chỗ đỗ:', err);
      }
    }
  };

  // Nộp báo cáo vi phạm
  const submitViolation = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const nowTime = new Date().toLocaleTimeString('en-US', { hour12: false });
      const logDateStr = `Jun 04, 2026 - ${nowTime.substring(0, 5)}`;
      
      const newLog: ActivityLog = {
        timestamp: logDateStr,
        activity: 'Violation',
        location: `Zone A1 - ${violationReason}`,
        duration: '-',
      };

      setLogs([newLog, ...logs]);
      setShowViolationModal(false);
      triggerToast(`Đã ghi nhận vi phạm: ${violationReason}!`);
    } catch (err) {
      console.error('Lỗi báo cáo vi phạm:', err);
    }
  };

  return {
    user,
    isParked,
    setIsParked,
    parkedSlot,
    setParkedSlot,
    showViolationModal,
    setShowViolationModal,
    showTicketModal,
    setShowTicketModal,
    violationReason,
    setViolationReason,
    violationNotes,
    setViolationNotes,
    toastMessage,
    secondsElapsed,
    currentTime,
    currentDate,
    vehicle,
    logs,
    formatDuration,
    triggerToast,
    handleReleaseSlot,
    submitViolation
  };
}
