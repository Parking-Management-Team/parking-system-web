'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/features/auth';
import { api } from '@/lib/api/client'; // Import API client sẵn có để gọi backend

// Interface cho Nhật ký hoạt động của Xe
interface ActivityLog {
  timestamp: string;
  activity: 'Entry' | 'Exit' | 'Violation';
  location: string;
  duration: string;
}

// Interface cho thông tin chi tiết xe
interface VehicleInfo {
  licensePlate: string;
  model: string;
  color: string;
  colorHex: string;
  entryTime: string;
  type: string;
  ticketNo: string;
  rateTier: string;
}

/**
 * VehicleDetailsPage - Trang chi tiết phương tiện và giám sát thời gian thực cho Manager
 * 
 * Các tính năng tương tác premium:
 * 1. Đồng hồ thời gian thực ở Header và Timer đếm thời gian đỗ xe tăng dần mỗi giây.
 * 2. Nút "Mark Violation" mở Modal báo lỗi đỗ xe (không đúng vị trí, không vé...).
 * 3. Nút "Release Slot" để giải phóng chỗ đỗ và cập nhật trạng thái đỗ xe sang "Đã rời bãi".
 * 4. Nút "Print Ticket" hiển thị biên lai hóa đơn đỗ xe điện tử (E-Ticket) dạng Modal thiết kế đẹp.
 * 5. Camera giám sát giả lập hình ảnh xe đỗ thực tế kèm tọa độ và nhãn LIVE FEED nhấp nháy.
 * 
 * Đã cấu trúc sẵn các state và chừa chỗ (placeholder) để tích hợp gọi API từ backend sau này.
 */
export default function VehicleDetailsPage() {
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

  // Quản lý thời gian trôi qua (giả lập xe đã đỗ 2 giờ 15 phút 44 giây)
  const [secondsElapsed, setSecondsElapsed] = useState(2 * 3600 + 15 * 60 + 44);

  // Đồng hồ chạy thực tế ở Header
  const [currentTime, setCurrentTime] = useState('00:00:00');
  const [currentDate, setCurrentDate] = useState('Thursday, June 4, 2026');

  // ─── CHỪA CHỖ GỌI API BACKEND CHO CHI TIẾT XE (VEHICLE DETAILS) ──────────────
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

  // ─── CHỪA CHỖ GỌI API BACKEND CHO NHẬT KÝ HOẠT ĐỘNG XE (ACTIVITY LOGS) ───────
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

  // Effect fetch dữ liệu từ Backend API cho phương tiện này
  useEffect(() => {
    const fetchVehicleData = async () => {
      try {
        /**
         * 📝 BƯỚC ĐIỀN API BACKEND CỦA BẠN:
         * 
         * 1. Gọi API lấy thông tin phương tiện (ví dụ theo biển số hoặc ID):
         *    const plate = '29A-123.45'; // hoặc lấy từ URL params/query
         *    const res = await api.get<any>(`/manager/vehicles/${plate}`);
         *    if (res.success) {
         *      setVehicle({
         *        licensePlate: res.data.licensePlate,
         *        model: res.data.model,
         *        color: res.data.color,
         *        colorHex: res.data.colorHex,
         *        entryTime: res.data.entryTime,
         *        type: res.data.type,
         *        ticketNo: res.data.ticketNo,
         *        rateTier: res.data.rateTier
         *      });
         *      setIsParked(res.data.isParked);
         *      setParkedSlot(res.data.currentSlot || 'None');
         *      setSecondsElapsed(res.data.secondsElapsed || 0);
         *    }
         * 
         * 2. Gọi API lấy logs hoạt động của xe này:
         *    const logsRes = await api.get<any[]>(`/manager/vehicles/${plate}/logs`);
         *    if (logsRes.success) {
         *      setLogs(logsRes.data);
         *    }
         */
        console.log('Ready to fetch vehicle profile from backend!');
      } catch (error) {
        console.error('Failed to fetch vehicle details:', error);
      }
    };

    fetchVehicleData();
  }, []);

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

  // Thực hiện Giải phóng Slot đỗ (Có thể nối API POST/PUT ở đây)
  const handleReleaseSlot = async () => {
    if (!isParked) return;
    
    const confirmRelease = window.confirm('Bạn có chắc chắn muốn giải phóng chỗ đỗ A1-013 cho xe này không?');
    if (confirmRelease) {
      try {
        /**
         * 📝 BƯỚC ĐIỀN API BACKEND CỦA BẠN:
         * 
         * await api.post(`/manager/slots/release`, { slotCode: parkedSlot, licensePlate: vehicle.licensePlate });
         */
        setIsParked(false);
        setParkedSlot('None (Departed)');
        
        // Thêm dòng log rời bãi vào bảng
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

  // Nộp báo cáo vi phạm (Có thể nối API POST/PUT ở đây)
  const submitViolation = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      /**
       * 📝 BƯỚC ĐIỀN API BACKEND CỦA BẠN:
       * 
       * await api.post(`/manager/violations`, {
       *   licensePlate: vehicle.licensePlate,
       *   reason: violationReason,
       *   notes: violationNotes,
       *   slotCode: parkedSlot
       * });
       */
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

  return (
    <div className="flex-grow flex flex-col min-h-screen relative">
      
      {/* ===== THÔNG BÁO TOAST NỔI ===== */}
      {toastMessage && (
        <div className="fixed top-6 right-6 z-50 flex items-center gap-3 bg-slate-800 text-white px-5 py-3 rounded-xl shadow-lg animate-fade-in border border-slate-700">
          <span className="material-symbols-outlined text-emerald-400">info</span>
          <span className="text-sm font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* ===== MODAL: BÁO CÁO VI PHẠM (VIOLATION) ===== */}
      {showViolationModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl border border-slate-100 max-w-md w-full shadow-2xl overflow-hidden animate-scale-up">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-red-50/50">
              <div className="flex items-center gap-2 text-red-600">
                <span className="material-symbols-outlined">report_problem</span>
                <h3 className="font-bold text-base">Report Parking Violation</h3>
              </div>
              <button onClick={() => setShowViolationModal(false)} className="text-slate-400 hover:text-slate-600">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <form onSubmit={submitViolation} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide">Violation Type</label>
                <select
                  value={violationReason}
                  onChange={(e) => setViolationReason(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-red-500/20"
                >
                  <option value="Parking Out of Line">Đỗ xe đè vạch / Sai vị trí</option>
                  <option value="Overstaying Permit Limit">Quá hạn thời gian cho phép</option>
                  <option value="Unauthorized VIP Zone">Đỗ trái phép khu vực VIP</option>
                  <option value="Blocking Other Vehicles">Cản trở phương tiện khác</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide">Detailed Notes</label>
                <textarea
                  value={violationNotes}
                  onChange={(e) => setViolationNotes(e.target.value)}
                  placeholder="Ghi chú chi tiết (vị trí, hành vi vi phạm...)"
                  rows={3}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-red-500/20 resize-none"
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowViolationModal(false)}
                  className="px-4 py-2 text-sm font-semibold text-slate-500 bg-transparent hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 text-sm font-semibold text-white bg-red-500 hover:bg-red-600 rounded-xl shadow-md shadow-red-500/10"
                >
                  Confirm Violation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===== MODAL: BIÊN LAI IN VÉ (E-TICKET) ===== */}
      {showTicketModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl border border-slate-150 max-w-sm w-full shadow-2xl p-6 relative overflow-hidden font-mono text-slate-800 animate-scale-up">
            
            {/* Lớp trang trí răng cưa hóa đơn */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-slate-200 via-slate-300 to-slate-200"></div>

            <div className="text-center pb-4 border-b border-dashed border-slate-200 mt-2">
              <h3 className="font-bold text-lg tracking-tight uppercase">NexPark System</h3>
              <p className="text-[10px] text-slate-500 uppercase">Smart Parking Receipt</p>
            </div>

            <div className="py-4 space-y-2.5 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">TICKET NO:</span>
                <span className="font-bold text-slate-700">{vehicle.ticketNo}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">LICENSE PLATE:</span>
                <span className="font-bold text-slate-700">{vehicle.licensePlate}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">VEHICLE:</span>
                <span className="font-semibold text-slate-700">{vehicle.model}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">ALLOCATED SLOT:</span>
                <span className="font-bold text-emerald-600">{parkedSlot}</span>
              </div>
              <hr className="border-dashed border-slate-200 my-2" />
              <div className="flex justify-between">
                <span className="text-slate-400">CHECK-IN:</span>
                <span className="font-semibold text-slate-700">{vehicle.entryTime}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">DURATION STAMP:</span>
                <span className="font-bold text-slate-700">{formatDuration(secondsElapsed)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">RATE TIER:</span>
                <span className="font-bold text-slate-700">{vehicle.rateTier}</span>
              </div>
            </div>

            <div className="pt-4 border-t border-dashed border-slate-200 text-center space-y-4">
              <div className="bg-slate-50 p-2.5 rounded-lg flex flex-col items-center">
                <span className="text-[9px] text-slate-400 uppercase">Simulated Barcode</span>
                <div className="w-full h-8 bg-slate-800 mt-1 flex items-center justify-center text-white/90 text-xs font-sans tracking-[0.4em] font-bold">
                  *{vehicle.licensePlate.replace(/[^A-Z0-9]/gi, '')}*
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setShowTicketModal(false)}
                  className="flex-1 py-2 text-xs font-semibold text-slate-500 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    alert('Đang gửi lệnh in tới máy in hóa đơn cổng North Gate...');
                    setShowTicketModal(false);
                  }}
                  className="flex-1 py-2 text-xs font-semibold text-white bg-emerald-500 hover:bg-emerald-600 rounded-lg transition-colors shadow-sm"
                >
                  Print
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ===== HEADER BAR ===== */}
      <header className="sticky top-0 z-40 h-[70px] bg-white/80 backdrop-blur-md border-b border-gray-200 shadow-sm flex justify-between items-center px-8 shrink-0">
        <div className="flex items-center flex-1 max-w-md">
          <div className="relative w-full">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">search</span>
            <input
              type="text"
              placeholder="Search slots, vehicles, or IDs..."
              className="w-full bg-slate-50 border-none rounded-xl pl-12 pr-4 py-2.5 text-sm focus:ring-2 focus:ring-emerald-500/20 transition-all outline-none text-slate-800"
              disabled
            />
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="hidden lg:flex flex-col items-end border-r border-slate-200 pr-4">
            <span className="text-lg font-bold text-slate-800 tabular-nums leading-none">{currentTime}</span>
            <span className="text-xs text-slate-400 leading-none mt-1">{currentDate}</span>
          </div>

          <div className="flex items-center gap-4 text-slate-500">
            <button className="relative w-10 h-10 rounded-full hover:bg-slate-100 flex items-center justify-center transition-colors">
              <span className="material-symbols-outlined">notifications</span>
              <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
            </button>
            <button className="w-10 h-10 rounded-full hover:bg-slate-100 flex items-center justify-center transition-colors">
              <span className="material-symbols-outlined">help</span>
            </button>
          </div>

          <div className="flex items-center gap-3 pl-2">
            <div className="text-right">
              <p className="text-sm font-semibold text-slate-800 leading-tight">
                {user?.fullName || 'Alex Thompson'}
              </p>
              <p className="text-[10px] text-emerald-500 font-bold uppercase tracking-wider">
                Manager
              </p>
            </div>
            <div className="w-10 h-10 rounded-full border-2 border-emerald-500 flex items-center justify-center bg-slate-200 overflow-hidden">
              <img
                src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=256&auto=format&fit=crop"
                alt="Profile Avatar"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>
      </header>

      {/* ===== KHÔNG GIAN MAIN CANVAS ===== */}
      <main className="flex-grow p-6 lg:p-8 w-full max-w-[1280px] mx-auto bg-slate-50/50">
        
        {/* Breadcrumb */}
        <nav className="flex items-center text-xs text-slate-500 font-medium mb-6 space-x-2">
          <Link href="/dashboard/manager/facilities" className="hover:text-emerald-500 transition-colors">
            Slot Management
          </Link>
          <span className="material-symbols-outlined text-[16px] text-slate-400">chevron_right</span>
          <span className="hover:text-emerald-500 transition-colors">{parkedSlot}</span>
          <span className="material-symbols-outlined text-[16px] text-slate-400">chevron_right</span>
          <span className="text-slate-800 font-semibold">Vehicle Details</span>
        </nav>

        {/* Tiêu đề xe & Các nút hành động chính */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Vehicle {vehicle.licensePlate}</h1>
            <p className="text-xs text-slate-500 mt-1 flex items-center gap-2 font-medium">
              <span className={`w-2.5 h-2.5 rounded-full ${isParked ? 'bg-emerald-500 animate-pulse' : 'bg-red-400'}`}></span>
              {isParked ? `Currently parked in ${parkedSlot}` : 'Has departed the facility'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setShowViolationModal(true)}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold text-red-500 border border-red-200 hover:bg-red-50 transition-all bg-white shadow-sm"
            >
              Mark Violation
            </button>
            
            <button
              onClick={handleReleaseSlot}
              disabled={!isParked}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 border border-slate-200 hover:bg-slate-50 hover:text-slate-800 transition-all shadow-sm bg-white disabled:opacity-45 disabled:pointer-events-none"
            >
              Release Slot
            </button>

            <button
              onClick={() => setShowTicketModal(true)}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold text-white bg-emerald-500 hover:bg-emerald-600 transition-all shadow-sm flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-[16px]">receipt_long</span>
              Print Ticket
            </button>
          </div>
        </div>

        {/* Bố cục Bento Grid 2 hàng */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* CAMERA THEO DÕI LIVE FEED (Lg: col-span-2) */}
          <div className="lg:col-span-2 rounded-2xl border border-slate-100 shadow-sm overflow-hidden bg-slate-900 relative group min-h-[380px] flex items-center justify-center">
            <img
              src="https://images.unsplash.com/photo-1506521788701-1e13a4e33c10?q=80&w=1000&auto=format&fit=crop"
              alt="Vehicle Entry Camera Viewport"
              className="w-full h-full object-cover opacity-85 transition-transform duration-700 group-hover:scale-105"
            />
            
            {/* Overlay Gradient tối bên dưới */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-slate-950/80 to-transparent p-6 pt-16">
              <div className="flex items-center justify-between gap-2 text-white">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-emerald-400">videocam</span>
                  <span className="text-[10px] font-bold tracking-widest uppercase">ENTRY CAMERA 04 • ZONE A1</span>
                </div>
                <div className="text-[9px] font-mono text-slate-300 tracking-wider">
                  COORD: 10.7626 N, 106.6602 E
                </div>
              </div>
            </div>

            {/* Trạng thái LIVE nổi góc trên */}
            <div className="absolute top-6 right-6 flex flex-col items-end gap-2">
              <div className="bg-red-500/90 backdrop-blur-md text-white px-3 py-1 rounded-lg flex items-center gap-2 font-bold text-[10px] tracking-tight uppercase">
                <span className="w-2 h-2 rounded-full bg-white animate-pulse"></span>
                LIVE FEED
              </div>
              <div className="bg-slate-950/40 backdrop-blur-sm text-slate-200 px-2 py-0.5 rounded-md text-[9px] font-mono">
                60 FPS • 4K HDR
              </div>
            </div>
          </div>

          {/* CARD HỒ SƠ XE VÀ KHÁCH HÀNG */}
          <div className="rounded-2xl border border-slate-100 shadow-sm p-6 flex flex-col bg-white">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
              <span className="material-symbols-outlined text-emerald-500">fingerprint</span>
              Registration Profile
            </h3>

            <div className="space-y-6 flex-grow">
              
              {/* Biển số xe */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                <p className="text-[10px] text-slate-400 uppercase tracking-widest mb-2 font-bold">License Plate</p>
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-black text-slate-800 tracking-tight font-mono">{vehicle.licensePlate}</span>
                  <span className="material-symbols-outlined text-emerald-500">verified</span>
                </div>
              </div>

              {/* Thông số xe */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[10px] text-slate-400 uppercase tracking-widest mb-1 font-bold">Vehicle Model</p>
                  <p className="text-xs font-bold text-slate-700">{vehicle.model}</p>
                  <p className="text-[10px] text-slate-400 font-medium">{vehicle.type}</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 uppercase tracking-widest mb-1 font-bold">Colorway</p>
                  <div className="flex items-center gap-2">
                    <span 
                      className="w-3.5 h-3.5 rounded-full border border-slate-300 shadow-inner"
                      style={{ backgroundColor: vehicle.colorHex }}
                    ></span>
                    <p className="text-xs font-bold text-slate-700">{vehicle.color}</p>
                  </div>
                </div>
              </div>

              {/* Đường kẻ ngang */}
              <hr className="border-slate-100" />

              {/* Thông tin mốc thời gian */}
              <div className="space-y-4">
                <div className="flex justify-between items-center text-xs">
                  <div className="flex items-center gap-2 text-slate-500">
                    <span className="material-symbols-outlined text-[18px]">login</span>
                    <span>Entry Timestamp</span>
                  </div>
                  <span className="font-bold text-slate-700">{vehicle.entryTime}</span>
                </div>

                <div className="flex justify-between items-center text-xs">
                  <div className="flex items-center gap-2 text-slate-500">
                    <span className="material-symbols-outlined text-[18px]">schedule</span>
                    <span>Total Duration</span>
                  </div>
                  <span className="font-bold text-emerald-500 tabular-nums">
                    {isParked ? formatDuration(secondsElapsed) : 'Session Ended'}
                  </span>
                </div>
              </div>

            </div>
          </div>

        </div>

        {/* BẢNG NHẬT KÝ HOẠT ĐỘNG PHƯƠNG TIỆN */}
        <div className="rounded-2xl border border-slate-100 shadow-sm p-6 bg-white mt-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
            <div>
              <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <span className="material-symbols-outlined text-emerald-500">history</span>
                Vehicle Activity Logs
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">Historical movement records for this registration</p>
            </div>
            
            <button
              onClick={() => alert(`Đang xuất tệp lịch sử xe ${vehicle.licensePlate} dưới dạng CSV...`)}
              className="px-4 py-2 rounded-xl text-xs text-emerald-600 font-bold bg-emerald-50 hover:bg-emerald-100 transition-colors border border-emerald-100 flex items-center gap-1.5"
            >
              Export CSV
              <span className="material-symbols-outlined text-[16px]">download</span>
            </button>
          </div>

          {/* Bảng hoạt động */}
          <div className="overflow-hidden rounded-xl border border-slate-100">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-[10px] text-slate-400 uppercase tracking-widest font-bold border-b border-slate-100">
                  <th className="py-4 px-6">Date &amp; Timestamp</th>
                  <th className="py-4 px-6">Activity</th>
                  <th className="py-4 px-6">Access Point</th>
                  <th className="py-4 px-6 text-right">Session Length</th>
                </tr>
              </thead>
              <tbody className="text-xs text-slate-700 divide-y divide-slate-100">
                {logs.map((log, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-4 px-6 font-semibold">{log.timestamp}</td>
                    <td className="py-4 px-6">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full font-bold text-[9px] uppercase tracking-wide
                        ${log.activity === 'Entry' ? 'bg-emerald-50 text-emerald-600' : ''}
                        ${log.activity === 'Exit' ? 'bg-slate-100 text-slate-500' : ''}
                        ${log.activity === 'Violation' ? 'bg-red-50 text-red-500' : ''}
                      `}>
                        {log.activity}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-slate-500">{log.location}</td>
                    <td className="py-4 px-6 text-right font-mono text-slate-500">{log.duration}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </main>
    </div>
  );
}
