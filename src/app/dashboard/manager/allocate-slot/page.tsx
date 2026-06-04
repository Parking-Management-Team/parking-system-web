'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/features/auth';

// Kiểu cấu trúc cho thông tin xe được chọn
interface VehicleDetails {
  plate: string;
  model: string;
  owner: string;
  memberId: string;
}

/**
 * AllocateSlotPage - Trang cấp phát chỗ đỗ xe cho khách hàng/thành viên
 * 
 * Các chức năng:
 * 1. Hiển thị thông số chi tiết của Slot đang chọn (A1-012, vip, tầng B1, EV).
 * 2. Tìm kiếm xe hoặc thành viên bằng Biển kiểm soát / Member ID (hỗ trợ nhập liệu thật).
 * 3. Lựa chọn loại hình đỗ xe (Vãng lai ngắn hạn, Đăng ký tháng, Cấp VIP cố định).
 * 4. Nhập thời gian bắt đầu và kết thúc cùng ghi chú nghiệp vụ.
 * 5. Xác nhận cấp phát với hiệu ứng tải (Loading) và thông báo thành công (Toast).
 */
export default function AllocateSlotPage() {
  const router = useRouter();
  const { user } = useAuth();

  // State thông tin xe được chọn (Mặc định chọn sẵn xe VinFast VF8)
  const [selectedVehicle, setSelectedVehicle] = useState<VehicleDetails | null>({
    plate: '30F-998.12',
    model: 'VinFast VF8 • Pearl White',
    owner: 'Tran Thi B',
    memberId: 'MEM-2023-884'
  });

  // State ô nhập tìm kiếm
  const [searchQuery, setSearchQuery] = useState('');
  
  // State loại hình đỗ xe (duration)
  const [allocationType, setAllocationType] = useState('monthly'); // short, monthly, vip

  // State ngày bắt đầu và kết thúc
  const [startDate, setStartDate] = useState('2026-06-04T08:00');
  const [endDate, setEndDate] = useState('2026-07-04T08:00');

  // Ghi chú
  const [notes, setNotes] = useState('');

  // Trạng thái xử lý gửi yêu cầu
  const [isAllocating, setIsAllocating] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [currentTime, setCurrentTime] = useState('00:00:00');
  const [currentDate, setCurrentDate] = useState('Thursday, June 4, 2026');

  // Chạy đồng hồ thời gian thực ở Header
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString('en-US', { hour12: false }));
      setCurrentDate(now.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Xử lý tìm kiếm giả lập khi người dùng nhấn nút Tìm kiếm hoặc Enter
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    // Giả lập tìm thấy xe dựa vào biển số nhập vào
    const query = searchQuery.toUpperCase();
    if (query.includes('29A') || query.includes('HN')) {
      setSelectedVehicle({
        plate: '29A-123.45',
        model: 'Toyota Camry • Premium Black',
        owner: 'Nguyen Van A',
        memberId: 'MEM-2026-001'
      });
    } else if (query.includes('51G') || query.includes('SG')) {
      setSelectedVehicle({
        plate: '51G-567.89',
        model: 'Tesla Model Y • Midnight Silver',
        owner: 'Le Hoang C',
        memberId: 'MEM-2026-099'
      });
    } else {
      // Mặc định xe ngẫu nhiên nếu không khớp từ khóa
      setSelectedVehicle({
        plate: query,
        model: 'Mazda CX-5 • Soul Red Crystal',
        owner: 'Nguyen Hoang Nam',
        memberId: `MEM-2026-${Math.floor(100 + Math.random() * 900)}`
      });
    }
    setSearchQuery('');
  };

  // Xác nhận cấp phát slot
  const handleConfirm = () => {
    if (!selectedVehicle) {
      alert('Vui lòng chọn hoặc tìm kiếm xe trước khi cấp phát!');
      return;
    }

    setIsAllocating(true);

    // Giả lập gửi lên Server đỗ xe
    setTimeout(() => {
      setIsAllocating(false);
      setShowToast(true);

      // Điều hướng về màn hình quản lý sau 1.5 giây
      setTimeout(() => {
        router.push('/dashboard/manager/facilities');
      }, 1500);
    }, 1200);
  };

  return (
    <div className="flex-grow flex flex-col min-h-screen relative">
      
      {/* ===== TOAST THÔNG BÁO THÀNH CÔNG ===== */}
      {showToast && (
        <div className="fixed top-6 right-6 z-50 flex items-center gap-3 bg-emerald-500 text-white px-5 py-3 rounded-xl shadow-lg shadow-emerald-500/20 animate-bounce">
          <span className="material-symbols-outlined">verified</span>
          <span className="text-sm font-semibold">Cấp phát chỗ đỗ A1-012 thành công!</span>
        </div>
      )}

      {/* ===== HEADER BAR ===== */}
      <header className="sticky top-0 z-40 h-[70px] bg-white/80 backdrop-blur-md border-b border-gray-200 shadow-sm flex justify-between items-center px-8 shrink-0">
        <div className="flex items-center flex-1 max-w-xl">
          <div className="relative w-full">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">search</span>
            <input
              type="text"
              placeholder="Search for reports, data, or metrics..."
              className="w-full bg-slate-50 border-none rounded-xl pl-12 pr-4 py-2.5 text-sm focus:ring-2 focus:ring-emerald-500/20 transition-all outline-none text-slate-800"
              disabled
            />
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="flex flex-col items-end border-r border-slate-200 pr-6">
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

      {/* ===== KHÔNG GIAN LÀM VIỆC CHÍNH ===== */}
      <main className="flex-grow p-6 lg:p-8 w-full max-w-[1280px] mx-auto bg-slate-50/50">
        
        {/* Nút quay lại & Tiêu đề */}
        <div className="mb-8 flex items-center gap-4">
          <Link
            href="/dashboard/manager/facilities"
            className="p-2 rounded-xl bg-white border border-slate-150 text-slate-600 hover:text-emerald-500 hover:border-emerald-500/20 hover:bg-emerald-50/30 transition-all shadow-sm flex items-center justify-center"
          >
            <span className="material-symbols-outlined">arrow_back</span>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Allocate Parking Slot</h1>
            <p className="text-slate-500 text-sm mt-0.5">Assign a vehicle to a specific parking bay within the facility.</p>
          </div>
        </div>

        {/* Bố cục lưới Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
          
          {/* CỘT TRÁI: CHI TIẾT SLOT ĐƯỢC CHỌN (4 Cols) */}
          <div className="xl:col-span-4 flex flex-col gap-6">
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              
              {/* Ảnh bản vẽ / Sơ đồ vị trí đỗ xe */}
              <div className="h-44 bg-slate-100 relative w-full overflow-hidden border-b border-slate-100">
                <img
                  src="https://images.unsplash.com/photo-1506521788701-1e13a4e33c10?q=80&w=600&auto=format&fit=crop"
                  alt="Parking Garage Map Layout"
                  className="w-full h-full object-cover opacity-90"
                />
                
                {/* Huy hiệu hiển thị Slot ID */}
                <div className="absolute bottom-4 left-4 bg-white/95 backdrop-blur-md border border-slate-200 rounded-xl px-4 py-2 flex items-center gap-2 shadow-sm">
                  <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse"></div>
                  <span className="text-xs font-bold text-slate-800">Slot A1-012</span>
                </div>
              </div>

              {/* Thông số kỹ thuật của Chỗ đỗ */}
              <div className="p-6 space-y-6">
                <div>
                  <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-4">Slot Specifications</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                      <p className="text-[10px] text-slate-400 font-semibold mb-1">Zone</p>
                      <p className="text-xs font-semibold text-slate-700">Standard VIP</p>
                    </div>
                    <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                      <p className="text-[10px] text-slate-400 font-semibold mb-1">Floor</p>
                      <p className="text-xs font-semibold text-slate-700">Level B1</p>
                    </div>
                    <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                      <p className="text-[10px] text-slate-400 font-semibold mb-1">Dimensions</p>
                      <p className="text-xs font-semibold text-slate-700">2.5m x 5.0m</p>
                    </div>
                    <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                      <p className="text-[10px] text-slate-400 font-semibold mb-1">EV Charging</p>
                      <div className="flex items-center gap-1 text-emerald-600">
                        <span className="material-symbols-outlined text-[16px]">ev_station</span>
                        <span className="text-xs font-bold">Available</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-xs text-slate-500 font-medium">Current Status</span>
                  <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 uppercase tracking-wide">
                    Unallocated
                  </span>
                </div>
              </div>

            </div>

            {/* Nút hành động nhanh ở Cột trái */}
            <button
              onClick={handleConfirm}
              disabled={isAllocating || !selectedVehicle}
              className="w-full bg-emerald-500 text-white py-4 rounded-2xl font-bold text-sm shadow-md shadow-emerald-500/10 hover:shadow-lg hover:bg-emerald-600 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:pointer-events-none"
            >
              <span className="material-symbols-outlined text-[20px]">verified</span>
              {isAllocating ? 'Allocating...' : 'Confirm Slot Allocation'}
            </button>
          </div>

          {/* CỘT PHẢI: FORM GÁN XE & KHÁCH HÀNG (8 Cols) */}
          <div className="xl:col-span-8">
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 lg:p-8">
              <h2 className="text-lg font-bold text-slate-800 mb-6 border-b border-slate-100 pb-4">
                Vehicle &amp; User Assignment
              </h2>

              {/* BƯỚC 1: TÌM KIẾM XE / THÀNH VIÊN */}
              <div className="mb-8">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">
                  Find Vehicle or Member
                </label>
                <form onSubmit={handleSearch} className="flex gap-3">
                  <div className="relative flex-1">
                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                      search
                    </span>
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Enter License Plate (e.g., 29A-123.45) or Member ID..."
                      className="w-full bg-white border border-slate-200 rounded-xl py-3 pl-12 pr-4 text-sm focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 transition-all font-medium text-slate-800"
                    />
                  </div>
                  <button
                    type="submit"
                    className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-6 py-3 rounded-xl font-semibold text-sm transition-colors border border-slate-200/50 flex items-center gap-2 shrink-0"
                  >
                    <span className="material-symbols-outlined text-[18px]">search</span>
                    Search
                  </button>
                </form>
                <p className="text-[10px] text-slate-400 mt-1.5 ml-1">
                  Mẹo: Nhập xe chứa &quot;29A&quot; hoặc &quot;51G&quot; để tải dữ liệu mẫu khác nhau.
                </p>
              </div>

              {/* CARD HIỂN THỊ THÔNG TIN XE ĐÃ CHỌN */}
              <div className="mb-8">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-3">
                  Selected Vehicle
                </label>
                
                {selectedVehicle ? (
                  <div className="bg-emerald-50/30 rounded-2xl border-2 border-emerald-500/20 p-5 flex items-start gap-4 relative overflow-hidden group hover:border-emerald-500/40 transition-all">
                    
                    {/* Badge trạng thái đã chọn */}
                    <div className="absolute top-0 right-0 bg-emerald-500 text-white text-[9px] uppercase font-bold px-3 py-1 rounded-bl-xl tracking-wider">
                      Selected
                    </div>

                    {/* Icon xe đỗ */}
                    <div className="w-14 h-14 rounded-xl bg-white border border-emerald-500/10 flex items-center justify-center shrink-0 shadow-sm">
                      <span className="material-symbols-outlined text-emerald-500 text-3xl">directions_car</span>
                    </div>

                    {/* Chi tiết xe và thành viên */}
                    <div className="flex-grow">
                      <h4 className="text-base font-bold text-slate-800">{selectedVehicle.plate}</h4>
                      <p className="text-xs text-slate-500 mt-0.5">{selectedVehicle.model}</p>
                      
                      <div className="flex items-center gap-4 mt-3 pt-3 border-t border-slate-100">
                        <div className="flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-[16px] text-slate-400">person</span>
                          <span className="text-xs text-slate-600 font-semibold">{selectedVehicle.owner}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-[16px] text-slate-400">badge</span>
                          <span className="text-xs text-slate-500 font-mono">{selectedVehicle.memberId}</span>
                        </div>
                      </div>
                    </div>

                    {/* Nút hủy lựa chọn */}
                    <button
                      onClick={() => setSelectedVehicle(null)}
                      className="text-slate-400 hover:text-red-500 transition-colors p-1.5 rounded-full hover:bg-slate-100/50"
                      title="Clear selection"
                    >
                      <span className="material-symbols-outlined text-[18px]">close</span>
                    </button>
                  </div>
                ) : (
                  <div className="bg-slate-50 rounded-2xl border border-dashed border-slate-200 p-6 text-center">
                    <span className="material-symbols-outlined text-slate-300 text-4xl mb-2">directions_car_filled</span>
                    <p className="text-xs text-slate-500 font-medium">Chưa có xe nào được chọn. Hãy tìm kiếm xe bằng ô tìm kiếm ở trên.</p>
                  </div>
                )}
              </div>

              {/* BƯỚC 2: CHỌN HÌNH THỨC CẤP PHÁT */}
              <div className="mb-8">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-3">
                  Allocation Type
                </label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  
                  {/* Loại vãng lai */}
                  <label className="cursor-pointer">
                    <input
                      type="radio"
                      name="allocationType"
                      value="short"
                      checked={allocationType === 'short'}
                      onChange={() => setAllocationType('short')}
                      className="peer sr-only"
                    />
                    <div className="rounded-xl border border-slate-200 p-4 hover:bg-slate-50 transition-colors peer-checked:border-emerald-500 peer-checked:bg-emerald-50/10 peer-checked:ring-2 peer-checked:ring-emerald-500/10 flex flex-col items-center text-center gap-2">
                      <span className="material-symbols-outlined text-slate-400 peer-checked:text-emerald-500">hourglass_empty</span>
                      <span className="text-xs font-bold text-slate-700">Short-term</span>
                      <span className="text-[10px] text-slate-400 leading-tight">Hourly rate billing</span>
                    </div>
                  </label>

                  {/* Vé tháng */}
                  <label className="cursor-pointer">
                    <input
                      type="radio"
                      name="allocationType"
                      value="monthly"
                      checked={allocationType === 'monthly'}
                      onChange={() => setAllocationType('monthly')}
                      className="peer sr-only"
                    />
                    <div className="rounded-xl border border-slate-200 p-4 hover:bg-slate-50 transition-colors peer-checked:border-emerald-500 peer-checked:bg-emerald-50/10 peer-checked:ring-2 peer-checked:ring-emerald-500/10 flex flex-col items-center text-center gap-2">
                      <span className="material-symbols-outlined text-slate-400 peer-checked:text-emerald-500">calendar_month</span>
                      <span className="text-xs font-bold text-slate-700">Monthly Pass</span>
                      <span className="text-[10px] text-slate-400 leading-tight">Recurring subscription</span>
                    </div>
                  </label>

                  {/* VIP / Cố định */}
                  <label className="cursor-pointer">
                    <input
                      type="radio"
                      name="allocationType"
                      value="vip"
                      checked={allocationType === 'vip'}
                      onChange={() => setAllocationType('vip')}
                      className="peer sr-only"
                    />
                    <div className="rounded-xl border border-slate-200 p-4 hover:bg-slate-50 transition-colors peer-checked:border-emerald-500 peer-checked:bg-emerald-50/10 peer-checked:ring-2 peer-checked:ring-emerald-500/10 flex flex-col items-center text-center gap-2">
                      <span className="material-symbols-outlined text-slate-400 peer-checked:text-emerald-500">workspace_premium</span>
                      <span className="text-xs font-bold text-slate-700">VIP Permanent</span>
                      <span className="text-[10px] text-slate-400 leading-tight">Dedicated ownership</span>
                    </div>
                  </label>

                </div>
              </div>

              {/* BƯỚC 3: THỜI GIAN BẮT ĐẦU VÀ KẾT THÚC */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide">
                    Start Date &amp; Time
                  </label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                      calendar_today
                    </span>
                    <input
                      type="datetime-local"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl py-3 pl-12 pr-4 text-sm focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 transition-all font-medium text-slate-800"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide">
                    End Date &amp; Time
                  </label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                      event_busy
                    </span>
                    <input
                      type="datetime-local"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl py-3 pl-12 pr-4 text-sm focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 transition-all font-medium text-slate-800"
                    />
                  </div>
                </div>
              </div>

              {/* GHI CHÚ BỔ SUNG */}
              <div className="mb-8">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">
                  Operational Notes (Optional)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Enter any specific requirements or remarks..."
                  rows={2}
                  className="w-full bg-white border border-slate-200 rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 transition-all resize-none text-slate-800"
                />
              </div>

              {/* FOOTER ACTIONS */}
              <div className="pt-6 border-t border-slate-100 flex items-center justify-end gap-4">
                <Link
                  href="/dashboard/manager/facilities"
                  className="flex-1 px-6 py-3.5 rounded-xl text-sm font-semibold text-slate-500 hover:bg-slate-50 transition-colors border border-slate-200 text-center"
                >
                  Cancel
                </Link>
                <button
                  onClick={handleConfirm}
                  disabled={isAllocating || !selectedVehicle}
                  className="flex-[3] px-8 py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-bold shadow-md shadow-emerald-500/10 transition-all hover:-translate-y-0.5 flex items-center justify-center gap-2 disabled:opacity-50 disabled:pointer-events-none"
                >
                  {isAllocating ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Processing...
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-[20px]">check_circle</span>
                      Confirm Allocation
                    </>
                  )}
                </button>
              </div>

            </div>
          </div>

        </div>

      </main>
    </div>
  );
}
