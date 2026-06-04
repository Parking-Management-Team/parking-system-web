'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/features/auth';
import { api } from '@/lib/api/client'; // Import API client sẵn có để gọi backend

/**
 * EditFacilityPage - Trang chỉnh sửa thông tin Cơ sở đỗ xe dành cho Manager
 * 
 * Các chức năng:
 * 1. Cho phép chỉnh sửa các thông số: Tên tòa nhà, Sức chứa (Slots), Địa chỉ, Số tầng, Trạng thái hoạt động.
 * 2. Lưu trạng thái tạm thời (Form State).
 * 3. Hỗ trợ thông báo lưu thành công và tự động điều hướng quay lại trang quản lý.
 * 
 * Đã cấu trúc sẵn các state và chừa chỗ (placeholder) để tích hợp gọi API từ backend sau này.
 */
export default function EditFacilityPage() {
  const router = useRouter();
  const { user } = useAuth();
  
  // Các State quản lý giá trị của Form nhập liệu
  const [buildingName, setBuildingName] = useState('Urban Flow Tower');
  const [totalCapacity, setTotalCapacity] = useState(500);
  const [address, setAddress] = useState('123 Innovation Blvd, District 1, Ho Chi Minh City');
  const [numFloors, setNumFloors] = useState(3);
  const [status, setStatus] = useState('active');

  // State quản lý trạng thái đang lưu (saving) và thông báo thành công (toast)
  const [isSaving, setIsSaving] = useState(false);
  const [showToast, setShowToast] = useState(false);

  const [currentTime, setCurrentTime] = useState('00:00:00');

  // Đồng hồ chạy thời gian thực trên header
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString('en-US', { hour12: false }));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // ─── CHỪA CHỖ GỌI API BACKEND ĐỂ LOAD DỮ LIỆU BAN ĐẦU CỦA CƠ SỞ ĐỂ EDIT ────────
  useEffect(() => {
    const fetchFacilityDetails = async () => {
      try {
        /**
         * 📝 BƯỚC ĐIỀN API BACKEND CỦA BẠN:
         * 
         * const res = await api.get<any>('/manager/facility/FAC-8821'); // Thay ID hoặc route tương ứng
         * if (res.success) {
         *   setBuildingName(res.data.name);
         *   setTotalCapacity(res.data.capacity);
         *   setAddress(res.data.address);
         *   setNumFloors(res.data.numFloors);
         *   setStatus(res.data.status);
         * }
         */
        console.log('Ready to fetch facility details for editing!');
      } catch (error) {
        console.error('Failed to load facility details:', error);
      }
    };
    fetchFacilityDetails();
  }, []);

  // Xử lý gửi Form (Submit) - Ghi nhận lưu thông tin
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      /**
       * 📝 BƯỚC ĐIỀN API BACKEND CỦA BẠN:
       * 
       * const response = await api.put('/manager/facility/FAC-8821', {
       *   name: buildingName,
       *   capacity: totalCapacity,
       *   address: address,
       *   numFloors: numFloors,
       *   status: status
       * });
       * 
       * if (response.success) {
       *   setShowToast(true);
       *   setTimeout(() => {
       *     router.push('/dashboard/manager/facilities');
       *   }, 1500);
       *   return;
       * }
       */
      
      // Giả lập cuộc gọi API lưu dữ liệu (delay 1 giây) khi chưa gắn API thật
      setTimeout(() => {
        setIsSaving(false);
        setShowToast(true);
        
        // Đợi hiển thị thông báo thành công 1.5 giây rồi quay lại trang trước
        setTimeout(() => {
          router.push('/dashboard/manager/facilities');
        }, 1500);
      }, 1000);
    } catch (err) {
      console.error('Failed to save facility changes:', err);
      setIsSaving(false);
    }
  };

  return (
    <div className="flex-grow flex flex-col min-h-screen relative">
      
      {/* ===== THÔNG BÁO TOAST THÀNH CÔNG ===== */}
      {showToast && (
        <div className="fixed top-6 right-6 z-50 flex items-center gap-3 bg-emerald-500 text-white px-5 py-3 rounded-xl shadow-lg shadow-emerald-500/20 animate-bounce">
          <span className="material-symbols-outlined">check_circle</span>
          <span className="text-sm font-semibold">Cập nhật thông tin cơ sở thành công!</span>
        </div>
      )}

      {/* ===== HEADER BAR ===== */}
      <header className="sticky top-0 z-40 h-[70px] bg-white/80 backdrop-blur-md border-b border-gray-200 shadow-sm flex justify-between items-center px-8 shrink-0">
        <div className="flex items-center flex-1 max-w-3xl mr-8">
          <div className="relative w-full">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">search</span>
            <input
              type="text"
              placeholder="Search facilities, slots, or records..."
              className="w-full bg-slate-50 border-none rounded-xl pl-12 pr-4 py-2.5 text-sm focus:ring-2 focus:ring-emerald-500/20 transition-all outline-none text-slate-800"
              disabled
            />
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="hidden lg:flex items-center gap-2 text-slate-600 px-3 py-1 bg-slate-50 rounded-lg border border-slate-100 font-mono text-sm tracking-wide">
            {currentTime}
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

      {/* ===== KHÔNG GIAN FORM NHẬP LIỆU ===== */}
      <main className="flex-grow p-6 lg:p-8 w-full max-w-[1280px] mx-auto bg-slate-50/50">
        
        {/* Breadcrumb điều hướng */}
        <nav aria-label="Breadcrumb" className="flex text-xs text-slate-500 mb-6 font-medium">
          <ol className="inline-flex items-center space-x-1 md:space-x-2">
            <li className="inline-flex items-center">
              <span className="hover:text-emerald-500 transition-colors">PBMS Manager</span>
            </li>
            <li className="flex items-center">
              <span className="material-symbols-outlined text-[16px] mx-1 text-slate-400">chevron_right</span>
              <Link href="/dashboard/manager/facilities" className="hover:text-emerald-500 transition-colors">
                Facility Management
              </Link>
            </li>
            <li aria-current="page" className="flex items-center">
              <span className="material-symbols-outlined text-[16px] mx-1 text-slate-400">chevron_right</span>
              <span className="text-emerald-500 font-semibold">Edit Facility</span>
            </li>
          </ol>
        </nav>

        {/* Tiêu đề trang */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight mb-1">Edit Facility Details</h2>
          <p className="text-slate-500 text-sm">Update structural and operational information for the building.</p>
        </div>

        {/* Card chứa Form chính */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          
          {/* Header Form */}
          <div className="p-6 border-b border-slate-100 bg-slate-50/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <span className="material-symbols-outlined">domain</span>
              </div>
              <div>
                <h3 className="font-semibold text-slate-800 text-base">General Information</h3>
                <p className="text-xs text-slate-400">Facility ID: FAC-8821</p>
              </div>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 lg:p-8 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
              
              {/* Tên tòa nhà */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide" htmlFor="buildingName">
                  Building Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="buildingName"
                  value={buildingName}
                  onChange={(e) => setBuildingName(e.target.value)}
                  className="w-full bg-white border border-slate-200 text-slate-800 rounded-xl px-4 py-3 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 transition-all font-medium text-sm"
                  required
                />
              </div>

              {/* Sức chứa (Slots) */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide" htmlFor="totalCapacity">
                  Total Capacity (Slots) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  id="totalCapacity"
                  value={totalCapacity}
                  onChange={(e) => setTotalCapacity(Number(e.target.value))}
                  className="w-full bg-white border border-slate-200 text-slate-800 rounded-xl px-4 py-3 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 transition-all font-medium text-sm"
                  required
                />
              </div>

              {/* Địa chỉ bãi đỗ */}
              <div className="space-y-2 md:col-span-2">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide" htmlFor="address">
                  Address <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-[20px]">
                    location_on
                  </span>
                  <input
                    type="text"
                    id="address"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full bg-white border border-slate-200 text-slate-800 rounded-xl pl-12 pr-4 py-3 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 transition-all font-medium text-sm"
                    required
                  />
                </div>
              </div>

              {/* Số tầng */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide" htmlFor="numFloors">
                  Number of Floors <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  id="numFloors"
                  value={numFloors}
                  onChange={(e) => setNumFloors(Number(e.target.value))}
                  className="w-full bg-white border border-slate-200 text-slate-800 rounded-xl px-4 py-3 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 transition-all font-medium text-sm"
                  required
                />
              </div>

              {/* Trạng thái hoạt động */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide" htmlFor="status">
                  Operational Status
                </label>
                <div className="relative">
                  <select
                    id="status"
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="appearance-none w-full bg-white border border-slate-200 text-slate-800 rounded-xl px-4 py-3 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 transition-all font-medium text-sm pr-10"
                  >
                    <option value="active">Active & Operational</option>
                    <option value="maintenance">Under Maintenance</option>
                    <option value="closed">Closed</option>
                  </select>
                  <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                    arrow_drop_down
                  </span>
                </div>
              </div>

            </div>

            {/* Đường gạch phân tách */}
            <hr className="border-slate-100" />

            {/* Các nút hành động */}
            <div className="flex items-center justify-end gap-4 pt-2">
              <Link
                href="/dashboard/manager/facilities"
                className="px-6 py-3 text-sm font-semibold text-slate-500 bg-transparent border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors focus:ring-2 focus:ring-slate-100"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={isSaving}
                className="px-6 py-3 text-sm font-semibold text-white bg-emerald-500 hover:bg-emerald-600 rounded-xl shadow-md shadow-emerald-500/10 transition-all hover:-translate-y-0.5 flex items-center gap-2 disabled:opacity-55 disabled:pointer-events-none"
              >
                {isSaving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-[18px]">save</span>
                    Save Changes
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
