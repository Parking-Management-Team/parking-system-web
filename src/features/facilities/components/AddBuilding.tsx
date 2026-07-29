/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * 📌 FILE: AddBuilding.tsx (THÊM TÒA NHÀ MỚI - ADD BUILDING PAGE)
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * 🎯 MỤC ĐÍCH FILE:
 * Trang tạo mới Tòa nhà trong phân hệ Facilities Management dành cho Admin và Manager.
 * Tự động tạo mã Building Code thông minh và hỗ trợ chế độ Offline Fallback nếu mất kết nối mạng.
 *
 * 🛠️ CHỨC NĂNG DÀNH CHO ADMIN & MANAGER:
 * 1. 🏢 Nhập Tên Tòa nhà (Building Name):
 *    - Tự động sinh mã Code theo format `BLD-TÊN-TÒA-NHÀ` khi nhập tên.
 * 2. 🔢 Thiết lập Tổng số Tầng (Total Floors):
 *    - Nhập số lượng tầng của tòa nhà (từ 1 đến 100).
 * 3. 🏷️ Cấu hình Mã Code Tòa nhà (Building Code):
 *    - Tự động kiểm tra trùng lặp mã code (`isCodeDuplicate`).
 *    - Giới hạn độ dài mã code tối đa 20 ký tự.
 * 4. 📍 Nhập Địa chỉ Vật lý (Physical Address).
 * 5. ⚡ Công tắc Trạng thái Hoạt động (Operational Status Toggle):
 *    - Thiết lập tòa nhà có sẵn sàng đón khách ngay khi khởi tạo hay không.
 * 6. 🌐 Chế độ Fallback Ngoại tuyến (Offline Fallback Storage):
 *    - Nếu gọi API thất bại (hoặc không có Internet), tự động lưu tòa nhà và khởi tạo danh sách tầng ảo vào `localStorage` (`offline_buildings` & `offline_floors`).
 * ═══════════════════════════════════════════════════════════════════════════════
 */

'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

import { useFacilities } from '../hooks/useFacilities';
import { Building, BuildingStatus, BaseResponse } from '@/lib/types/building.types';
import { Floor } from '../types';
import { api } from '@/lib/api/client';

export default function AddBuilding() {
  const router = useRouter();
  const {
    user,
    showToast,
    toastMessage,
    toastType,
    triggerToast,
    buildings
  } = useFacilities();

  const basePath = user?.role === 'ADMIN' ? '/dashboard/admin/facilities' : '/dashboard/manager/facilities';

  // State quản lý form cục bộ
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [totalFloors, setTotalFloors] = useState<number>(3);
  const [address, setAddress] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Xử lý tạo Code tự động dựa trên tên tòa nhà
  const handleNameChange = (val: string) => {
    setName(val);
    // Tự sinh code ngắn gọn từ tên, VD: "Tower Alpha" -> "BLD-TOWER-ALPHA"
    if (val.trim()) {
      const generatedCode = 'BLD-' + val
        .trim()
        .toUpperCase()
        .replace(/[^A-Z0-9\s-]/g, '')
        .replace(/\s+/g, '-');
      setCode(generatedCode);
    } else {
      setCode('');
    }
  };

  // Submit tạo mới Tòa nhà
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      triggerToast('Building name is required!', 'error');
      return;
    }
    if (totalFloors < 1 || totalFloors > 100) {
      triggerToast('Total floors must be between 1 and 100!', 'error');
      return;
    }

    const cleanCode = code.trim() || `BLD-${Date.now()}`;
    if (cleanCode.length > 20) {
      triggerToast('Building code cannot exceed 20 characters!', 'error');
      return;
    }
    const isCodeDuplicate = buildings.some(
      b => b.code.toUpperCase() === cleanCode.toUpperCase()
    );
    if (isCodeDuplicate) {
      triggerToast('Building code must be unique!', 'error');
      return;
    }

    setIsSubmitting(true);

    const submitData = {
      code: cleanCode,
      name: name.trim(),
      address: address.trim() || undefined,
      totalFloor: totalFloors
    };

    try {
      const res = await api.post<BaseResponse<Building>>('/Buildings', submitData);
      if (res.success && res.data) {
        triggerToast('Building added successfully!', 'success');
        setTimeout(() => {
          router.push(basePath);
        }, 800);
      } else {
        triggerToast(res.message || 'Error creating building', 'error');
      }
    } catch (error) {
      console.warn('Lỗi mạng, tiến hành fallback lưu offline cục bộ:', error);
      
      // Fallback offline: lưu trữ vào localStorage
      const offlineBldsStr = localStorage.getItem('offline_buildings');
      const offlineBlds: Building[] = offlineBldsStr ? JSON.parse(offlineBldsStr) : [];
      
      const newBldId = Date.now();
      const newBld: Building = {
        id: newBldId,
        code: submitData.code,
        name: submitData.name,
        address: submitData.address || null,
        totalFloor: submitData.totalFloor,
        status: isActive ? BuildingStatus.Available : BuildingStatus.OutOfService
      };

      offlineBlds.push(newBld);
      localStorage.setItem('offline_buildings', JSON.stringify(offlineBlds));

      // Sinh tầng tương ứng offline
      const offlineFloorsStr = localStorage.getItem('offline_floors');
      const offlineFloors: Floor[] = offlineFloorsStr ? JSON.parse(offlineFloorsStr) : [];
      for (let i = 1; i <= submitData.totalFloor; i++) {
        offlineFloors.push({
          id: Date.now() + i,
          buildingId: newBldId,
          floorNumber: i,
          name: `Floor ${i}`,
          totalSlots: 10,
          status: 'Active'
        });
      }
      localStorage.setItem('offline_floors', JSON.stringify(offlineFloors));

      triggerToast('Saved building locally (Offline mode)!', 'success');
      setTimeout(() => {
        router.push(basePath);
      }, 800);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex-grow flex flex-col min-h-screen bg-[#f9f9ff]">
      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* 🔔 TOAST THÔNG BÁO HỆ THỐNG                                           */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {showToast && (
        <div 
          className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-3 rounded-xl shadow-lg transition-all duration-300 transform scale-100 animate-in fade-in slide-in-from-top-4 ${
            toastType === 'success' ? 'bg-[#006d43] text-white shadow-[#006d43]/20' : 'bg-red-600 text-white shadow-red-600/20'
          }`}
        >
          <span className="material-symbols-outlined text-lg">
            {toastType === 'success' ? 'check_circle' : 'error'}
          </span>
          <span className="text-sm font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* 👑 MAIN CONTENT CANVAS & FORM HEADER                                */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <main className="flex-1 p-6 md:p-8">
        <div className="max-w-[800px] mx-auto flex flex-col gap-6">
          {/* Nút quay lại & Tiêu đề */}
          <div className="flex flex-col gap-3">
            <button 
              onClick={() => router.push(basePath)}
              className="flex items-center gap-1.5 text-slate-500 hover:text-slate-800 font-semibold text-xs w-fit transition-colors group cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px] group-hover:-translate-x-0.5 transition-transform">arrow_back</span>
              Back to Directory
            </button>
            <div>
              <h2 className="text-xl font-bold text-[#111c2d]">Add New Building</h2>
              <p className="text-sm text-slate-500 mt-1">Register a new facility into the NexPark management system.</p>
            </div>
          </div>

          {/* Form Thêm Tòa nhà Mới */}
          <form onSubmit={handleSubmit} className="bg-[#fcfdfd] border border-[#d8e3fb] rounded-xl p-6 md:p-8 flex flex-col gap-6 shadow-sm">
            
            {/* Grid 2 cột: Tên & Tầng / Mã Code */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-6 border-b border-[#d8e3fb]/60">
              
              {/* Tên Tòa nhà */}
              <div className="flex flex-col gap-2">
                <label htmlFor="buildingName" className="text-xs font-semibold text-slate-700">
                  Building Name *
                </label>
                <input 
                  type="text" 
                  id="buildingName"
                  required
                  value={name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder="e.g. North Tower Alpha"
                  className="w-full bg-white border border-[#bccabe] rounded-lg px-3.5 py-2 text-sm text-[#111c2d] placeholder:text-slate-400 focus:outline-none focus:border-[#006d43] focus:ring-1 focus:ring-[#006d43] transition-all"
                />
              </div>

              {/* Tổng số tầng */}
              <div className="flex flex-col gap-2">
                <label htmlFor="totalFloors" className="text-xs font-semibold text-slate-700">
                  Total Floors *
                </label>
                <input 
                  type="number" 
                  id="totalFloors"
                  required
                  min={1}
                  max={100}
                  value={totalFloors}
                  onChange={(e) => setTotalFloors(parseInt(e.target.value) || 0)}
                  placeholder="e.g. 5"
                  className="w-full bg-white border border-[#bccabe] rounded-lg px-3.5 py-2 text-sm text-[#111c2d] placeholder:text-slate-400 focus:outline-none focus:border-[#006d43] focus:ring-1 focus:ring-[#006d43] transition-all"
                />
              </div>

              {/* Mã Code Tòa nhà */}
              <div className="flex flex-col gap-2 md:col-span-2">
                <label htmlFor="buildingCode" className="text-xs font-semibold text-slate-700">
                  Building Code *
                </label>
                <input 
                  type="text" 
                  id="buildingCode"
                  required
                  maxLength={20}
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase().replace(/\s+/g, '-'))}
                  placeholder="e.g. BLD-NORTH-TOWER"
                  className="w-full bg-slate-50 border border-[#bccabe] rounded-lg px-3.5 py-2 text-sm text-slate-600 font-mono font-bold placeholder:text-slate-400 focus:outline-none focus:border-[#006d43] focus:ring-1 focus:ring-[#006d43] transition-all"
                />
                <p className="text-[10px] text-slate-400">
                  Unique identifier used for API bindings. Generated automatically based on the building name.
                </p>
              </div>

            </div>

            {/* Địa chỉ vật lý */}
            <div className="flex flex-col gap-2 pb-6 border-b border-[#d8e3fb]/60">
              <label htmlFor="physicalAddress" className="text-xs font-semibold text-slate-700">
                Physical Address
              </label>
              <textarea 
                id="physicalAddress"
                rows={3}
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Enter complete street address..."
                className="w-full bg-white border border-[#bccabe] rounded-lg px-3.5 py-2 text-sm text-[#111c2d] placeholder:text-slate-400 focus:outline-none focus:border-[#006d43] focus:ring-1 focus:ring-[#006d43] transition-all resize-none"
              />
              <p className="text-[10px] text-slate-400">
                This address will be used for geolocation routing and emergency services.
              </p>
            </div>


            {/* Nút hành động */}
            <div className="flex justify-end gap-3 pt-4">
              <button 
                type="button"
                onClick={() => router.push(basePath)}
                className="px-5 py-2 rounded-lg border border-slate-300 hover:bg-slate-50 text-slate-700 text-sm font-semibold transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button 
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2 rounded-lg bg-[#006d43] hover:bg-[#006d43]/95 text-white text-sm font-semibold transition-colors flex items-center gap-2 shadow-sm disabled:opacity-50 cursor-pointer"
              >
                {isSubmitting ? 'Creating...' : 'Create Building'}
              </button>
            </div>

          </form>
        </div>
      </main>
    </div>
  );
}
