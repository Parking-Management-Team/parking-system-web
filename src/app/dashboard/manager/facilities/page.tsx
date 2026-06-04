'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/features/auth';
import { api } from '@/lib/api/client'; // Import API client sẵn có để gọi backend

// Định nghĩa kiểu dữ liệu cho Facility
interface FacilityInfo {
  name: string;
  address: string;
  totalCapacity: number;
  totalFloors: number;
  totalZones: number;
  imageUrl: string;
}

// Định nghĩa kiểu dữ liệu cho Zone
interface ZoneInfo {
  id: string;
  name: string;
  level: string;
  capacity: number;
  occupancyRate: number;
  trafficLevel: 'High' | 'Average' | 'Open';
}

// Định nghĩa kiểu dữ liệu cho Floor
interface FloorInfo {
  id: string;
  code: string;
  name: string;
  capacity: number;
  occupied: number;
  occupancyRate: number;
  statusText: string;
}

/**
 * FacilityManagementPage - Trang quản lý cơ sở vật chất dành cho Manager
 * 
 * Các chức năng:
 * 1. Hiển thị thông tin tổng quan của bãi xe (Sức chứa, số tầng, số phân khu).
 * 2. Theo dõi trạng thái lấp đầy từng phân khu (Zone Status).
 * 3. Đồng hồ thời gian thực và hiển thị thông tin Manager đăng nhập.
 * 4. Liên kết chỉnh sửa thông tin bãi xe (Edit Facility).
 * 
 * Đã cấu trúc sẵn các state và chừa chỗ (placeholder) để tích hợp gọi API từ backend sau này.
 */
export default function FacilityManagementPage() {
  const { user } = useAuth();
  const [currentTime, setCurrentTime] = useState('00:00:00');
  const [currentDate, setCurrentDate] = useState('Loading date...');

  // ─── CHỪA CHỖ GỌI API BACKEND CHO THÔNG TIN CƠ SỞ (FACILITY) ─────────────────
  const [facility, setFacility] = useState<FacilityInfo>({
    name: 'Urban Flow Tower',
    address: '123 Innovation Blvd, District 1, Ho Chi Minh City',
    totalCapacity: 500,
    totalFloors: 3,
    totalZones: 6,
    imageUrl: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=600&auto=format&fit=crop'
  });

  // ─── CHỪA CHỖ GỌI API BACKEND CHO DANH SÁCH KHU VỰC (ZONES) ─────────────────
  const [zones, setZones] = useState<ZoneInfo[]>([
    {
      id: 'z-1',
      name: 'Premium Zone',
      level: 'Level B1',
      capacity: 50,
      occupancyRate: 95,
      trafficLevel: 'High'
    },
    {
      id: 'z-2',
      name: 'Standard A',
      level: 'Level B2',
      capacity: 100,
      occupancyRate: 60,
      trafficLevel: 'Average'
    },
    {
      id: 'z-3',
      name: 'EV Hub',
      level: 'Level B1',
      capacity: 150,
      occupancyRate: 30,
      trafficLevel: 'Open'
    },
    {
      id: 'z-4',
      name: 'VIP Reserved',
      level: 'Rooftop',
      capacity: 100,
      occupancyRate: 90,
      trafficLevel: 'High'
    }
  ]);

  // ─── CHỪA CHỖ GỌI API BACKEND CHO DANH SÁCH TẦNG (FLOORS) ───────────────────
  const [floors, setFloors] = useState<FloorInfo[]>([
    {
      id: 'f-1',
      code: 'B1',
      name: 'Level B1',
      capacity: 200,
      occupied: 150,
      occupancyRate: 75,
      statusText: '75% Full'
    },
    {
      id: 'f-2',
      code: 'B2',
      name: 'Level B2',
      capacity: 200,
      occupied: 85,
      occupancyRate: 42.5,
      statusText: '42.5% Full'
    },
    {
      id: 'f-3',
      code: 'VIP',
      name: 'Rooftop',
      capacity: 100,
      occupied: 90,
      occupancyRate: 90,
      statusText: '90% Full - High Traffic'
    }
  ]);

  // Cập nhật đồng hồ thời gian thực mỗi giây
  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString('en-US', { hour12: false }));
      setCurrentDate(now.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }));
    };
    updateClock();
    const intervalId = setInterval(updateClock, 1000);
    return () => clearInterval(intervalId);
  }, []);

  // Effect fetch dữ liệu từ Backend API
  useEffect(() => {
    const fetchFacilityData = async () => {
      try {
        /**
         * 📝 BƯỚC ĐIỀN API BACKEND CỦA BẠN:
         * 
         * 1. Gọi API lấy thông tin tòa nhà/cơ sở:
         *    const facilityRes = await api.get<any>('/manager/facility/active');
         *    if (facilityRes.success) {
         *      setFacility({
         *        name: facilityRes.data.name,
         *        address: facilityRes.data.address,
         *        totalCapacity: facilityRes.data.totalCapacity,
         *        totalFloors: facilityRes.data.totalFloors,
         *        totalZones: facilityRes.data.totalZones,
         *        imageUrl: facilityRes.data.imageUrl || facility.imageUrl
         *      });
         *    }
         * 
         * 2. Gọi API lấy danh sách Zone:
         *    const zonesRes = await api.get<any[]>('/manager/zones');
         *    if (zonesRes.success) {
         *      setZones(zonesRes.data.map(z => ({
         *        id: z.id,
         *        name: z.name,
         *        level: z.floorName,
         *        capacity: z.capacity,
         *        occupancyRate: z.occupancyRate,
         *        trafficLevel: z.occupancyRate > 80 ? 'High' : z.occupancyRate > 40 ? 'Average' : 'Open'
         *      })));
         *    }
         * 
         * 3. Gọi API lấy danh sách tầng (Floors):
         *    const floorsRes = await api.get<any[]>('/manager/floors');
         *    if (floorsRes.success) {
         *      setFloors(floorsRes.data.map(f => ({
         *        id: f.id,
         *        code: f.code,
         *        name: f.name,
         *        capacity: f.capacity,
         *        occupied: f.occupiedSlots,
         *        occupancyRate: f.occupancyRate,
         *        statusText: `${f.occupancyRate}% Full`
         *      })));
         *    }
         */
        console.log('Ready to fetch facility management data from backend!');
      } catch (error) {
        console.error('Failed to fetch facility data:', error);
      }
    };

    fetchFacilityData();
  }, []);

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-[#f8f9ff]">
      {/* ===== HEADER BAR ===== */}
      <header className="sticky top-0 z-40 h-[70px] w-full bg-white/80 backdrop-blur-md border-b border-gray-200 shadow-sm flex justify-between items-center px-8 shrink-0 transition-colors">
        {/* Thanh tìm kiếm */}
        <div className="flex items-center flex-1 max-w-3xl mr-8">
          <div className="relative w-full group">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-500 transition-colors">
              search
            </span>
            <input
              type="text"
              placeholder="Search facilities, zones, or slots..."
              className="w-full bg-slate-50 border-none rounded-xl pl-12 pr-4 py-2.5 text-sm focus:ring-2 focus:ring-emerald-500/20 transition-all outline-none text-slate-800"
            />
          </div>
        </div>

        {/* Đồng hồ và User Profile */}
        <div className="flex items-center gap-6">
          {/* Đồng hồ số */}
          <div className="flex flex-col items-end border-r border-gray-200 pr-6">
            <span className="font-mono text-xl font-bold text-slate-800 tabular-nums leading-none">
              {currentTime}
            </span>
            <span className="text-[10px] text-slate-500 font-semibold leading-none mt-1">
              {currentDate}
            </span>
          </div>

          {/* Nút thông báo */}
          <div className="flex items-center gap-4 text-slate-500">
            <button className="relative w-10 h-10 rounded-full hover:bg-slate-100 flex items-center justify-center transition-colors">
              <span className="material-symbols-outlined">notifications</span>
              <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
            </button>
            <button className="w-10 h-10 rounded-full hover:bg-slate-100 flex items-center justify-center transition-colors">
              <span className="material-symbols-outlined">help</span>
            </button>
          </div>

          {/* Profile cá nhân của Manager */}
          <div className="flex items-center gap-3 pl-2 cursor-pointer hover:bg-slate-50 p-1 rounded-full transition-all">
            <div className="text-right">
              <p className="text-sm font-semibold text-slate-800 leading-tight">
                {user?.fullName || 'Alex Thompson'}
              </p>
              <p className="text-[10px] text-emerald-500 font-bold uppercase tracking-wider">
                Manager
              </p>
            </div>
            <div className="w-10 h-10 rounded-full border-2 border-emerald-500 flex items-center justify-center bg-slate-200 text-slate-700 font-bold overflow-hidden">
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
      <main className="flex-grow p-6 lg:p-8 w-full max-w-[1400px] mx-auto">
        {/* Breadcrumb điều hướng */}
        <nav aria-label="Breadcrumb" className="flex text-xs text-slate-500 mb-6">
          <ol className="inline-flex items-center gap-2">
            <li className="inline-flex items-center">
              <span className="hover:text-emerald-600 transition-colors">PBMS Manager</span>
            </li>
            <li>
              <span className="material-symbols-outlined text-sm">chevron_right</span>
            </li>
            <li aria-current="page" className="text-slate-800 font-medium">
              Facility Management
            </li>
          </ol>
        </nav>

        {/* Tiêu đề trang & Nút chỉnh sửa */}
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-8">
          <div>
            <h2 className="text-3xl font-bold text-slate-800 tracking-tight mb-2">
              Facility Management
            </h2>
            <p className="text-slate-500 text-sm max-w-2xl">
              Manage building infrastructure, capacity, and spatial configurations.
            </p>
          </div>
          <div className="flex shrink-0 gap-3">
            <Link
              href="/dashboard/manager/edit-facility"
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-emerald-500 text-white hover:bg-emerald-600 text-sm font-semibold rounded-[12px] transition-all shadow-md shadow-emerald-500/10"
            >
              <span className="material-symbols-outlined text-lg">edit</span>
              Edit Facility
            </Link>
          </div>
        </div>

        {/* Lưới bố cục (Grid Layout) */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Cột Trái: Thông tin tòa nhà & Trạng thái Phân khu */}
          <section className="xl:col-span-2 flex flex-col gap-6">
            
            {/* Thẻ Hero giới thiệu Tòa nhà */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex flex-col sm:flex-row relative">
              <div
                className="absolute inset-0 opacity-5 pointer-events-none"
                style={{
                  backgroundImage: 'radial-gradient(#006d43 1px, transparent 1px)',
                  backgroundSize: '20px 20px',
                }}
              ></div>
              
              {/* Ảnh đại diện tòa nhà */}
              <div className="w-full sm:w-2/5 h-48 sm:h-auto relative z-10 min-h-[220px]">
                <img
                  alt={facility.name}
                  className="w-full h-full object-cover border-r border-slate-100"
                  src={facility.imageUrl}
                />
              </div>

              {/* Chi tiết thông tin */}
              <div className="p-6 lg:p-8 flex-1 flex flex-col justify-center relative z-10 bg-white/95 backdrop-blur-sm">
                <div className="flex items-center gap-2 mb-2">
                  <span className="material-symbols-outlined text-emerald-500 text-xl">business</span>
                  <h3 className="text-xl font-bold text-slate-800">{facility.name}</h3>
                </div>
                <p className="text-xs text-slate-500 mb-6 flex items-start gap-1.5">
                  <span className="material-symbols-outlined text-[16px] mt-0.5 text-slate-400">location_on</span>
                  {facility.address}
                </p>

                {/* Thống kê nhanh số lượng */}
                <div className="grid grid-cols-3 gap-4 mt-auto">
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                    <p className="text-[10px] text-slate-400 uppercase tracking-wider font-bold mb-1">
                      Total Capacity
                    </p>
                    <p className="text-xl font-bold text-slate-800">
                      {facility.totalCapacity} <span className="text-xs font-normal text-slate-400">slots</span>
                    </p>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                    <p className="text-[10px] text-slate-400 uppercase tracking-wider font-bold mb-1">
                      Total Floors
                    </p>
                    <p className="text-xl font-bold text-slate-800">
                      {facility.totalFloors} <span className="text-xs font-normal text-slate-400">levels</span>
                    </p>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                    <p className="text-[10px] text-slate-400 uppercase tracking-wider font-bold mb-1">
                      Total Zones
                    </p>
                    <p className="text-xl font-bold text-slate-800">
                      {facility.totalZones} <span className="text-xs font-normal text-slate-400">areas</span>
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Quản lý trạng thái phân khu (Zone Status) */}
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-slate-800">Zone Status</h3>
                <button className="text-slate-400 hover:text-slate-600 transition-colors">
                  <span className="material-symbols-outlined text-[20px]">filter_list</span>
                </button>
              </div>

              {/* Danh sách các Zone */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {zones.map((zone) => (
                  <div key={zone.id} className="flex items-center justify-between p-4 border border-slate-100 rounded-xl hover:border-emerald-500/20 transition-all cursor-pointer group hover:bg-slate-50/50">
                    <div>
                      <h4 className="text-sm font-semibold text-slate-800 group-hover:text-emerald-500 transition-colors">
                        {zone.name}
                      </h4>
                      <p className="text-xs text-slate-400 mt-1">{zone.level} • {zone.capacity} Slots</p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      {zone.trafficLevel === 'High' && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide bg-red-50 text-red-600">
                          High
                        </span>
                      )}
                      {zone.trafficLevel === 'Average' && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide bg-amber-50 text-amber-600">
                          Average
                        </span>
                      )}
                      {zone.trafficLevel === 'Open' && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide bg-emerald-50 text-emerald-600">
                          Open
                        </span>
                      )}
                      <span className="text-sm font-bold text-slate-800">{zone.occupancyRate}%</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Nút xem thêm */}
              <button className="w-full mt-6 py-2 text-xs font-semibold text-slate-500 hover:text-emerald-500 transition-colors flex items-center justify-center gap-1">
                View All Zones <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
              </button>
            </div>
          </section>

          {/* Cột Phải: Biểu đồ Allocation & Quản lý Tầng */}
          <section className="flex flex-col gap-6">
            
            {/* Thẻ Phân bổ Sức chứa (Allocation Overview) */}
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
              <h3 className="text-lg font-bold text-slate-800 mb-6">Allocation Overview</h3>
              
              {/* Vòng tròn Biểu đồ */}
              <div className="flex items-center justify-center mb-6 relative">
                <div className="w-32 h-32 rounded-full border-[12px] border-slate-100 flex items-center justify-center relative overflow-hidden">
                  <div
                    className="absolute inset-0 border-[12px] border-emerald-500 rounded-full"
                    style={{
                      clipPath: 'polygon(50% 0, 100% 0, 100% 100%, 0 100%, 0 50%, 50% 50%)',
                      transform: 'rotate(45deg)',
                    }}
                  ></div>
                  <div
                    className="absolute inset-0 border-[12px] border-sky-400 rounded-full"
                    style={{
                      clipPath: 'polygon(0 0, 50% 0, 50% 50%, 0 50%)',
                      transform: 'rotate(45deg)',
                    }}
                  ></div>
                  <div className="text-center bg-white w-24 h-24 rounded-full flex flex-col items-center justify-center z-10 shadow-inner">
                    <span className="text-2xl font-bold text-slate-800 leading-none">{facility.totalCapacity}</span>
                    <span className="text-[9px] text-slate-400 uppercase font-bold tracking-wider mt-1">Total</span>
                  </div>
                </div>
              </div>

              {/* Chú thích biểu đồ */}
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-slate-100/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-sm bg-emerald-500"></div>
                    <span className="material-symbols-outlined text-slate-500 text-[18px]">directions_car</span>
                    <span className="text-xs font-semibold text-slate-600">Standard Cars</span>
                  </div>
                  <span className="text-sm font-bold text-slate-800">350</span>
                </div>
                
                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-slate-100/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-sm bg-sky-400"></div>
                    <span className="material-symbols-outlined text-slate-500 text-[18px]">ev_station</span>
                    <span className="text-xs font-semibold text-slate-600">EV Charging</span>
                  </div>
                  <span className="text-sm font-bold text-slate-800">150</span>
                </div>
              </div>
            </div>

            {/* Quản lý Tầng (Floor Management) */}
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between px-1">
                <h3 className="text-lg font-bold text-slate-800">Floor Management</h3>
                <button className="text-xs font-bold text-emerald-500 hover:text-emerald-600 transition-colors">
                  View All Floors
                </button>
              </div>

              {/* Danh sách tầng */}
              <div className="flex flex-col gap-4">
                {floors.map((floor) => (
                  <div key={floor.id} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover:-translate-y-0.5 transition-all duration-200 cursor-pointer group">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-sm">
                          {floor.code}
                        </div>
                        <h4 className="font-semibold text-slate-800 text-sm">{floor.name}</h4>
                      </div>
                      <button className="text-slate-400 hover:text-slate-600 transition-colors opacity-0 group-hover:opacity-100">
                        <span className="material-symbols-outlined text-[20px]">more_vert</span>
                      </button>
                    </div>
                    
                    <div className="mb-4">
                      <div className="flex justify-between text-xs mb-1.5">
                        <span className="text-slate-500 font-medium">Occupancy</span>
                        <span className="text-slate-800 font-bold">{floor.occupied} / {floor.capacity}</span>
                      </div>
                      <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full ${floor.occupancyRate >= 80 ? 'bg-red-500' : 'bg-emerald-500'}`} 
                          style={{ width: `${floor.occupancyRate}%` }}
                        ></div>
                      </div>
                      <p className={`text-[10px] mt-2 text-right ${floor.occupancyRate >= 80 ? 'text-red-500 font-medium' : 'text-slate-400'}`}>
                        {floor.statusText}
                      </p>
                    </div>
                    
                    <div className="pt-4 border-t border-slate-50">
                      <button className="w-full py-2 text-xs font-bold text-emerald-500 bg-slate-50 hover:bg-slate-100 rounded-xl transition-colors">
                        Manage Floor
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
