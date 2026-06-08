'use client';

// Nhập các hook và thư viện cần thiết từ React
import React, { useEffect, useState } from 'react';
// Nhập component Link của Next.js để điều hướng nếu cần
import Link from 'next/link';
// Nhập hook quản lý thông tin đăng nhập
import { useAuth } from '@/features/auth';
// Nhập API client đã được cấu hình sẵn để giao tiếp với backend
import { api } from '@/lib/api/client';
// Nhập các type định nghĩa của Building vừa tạo ở Task 1
import { Building, BuildingStatus } from '@/lib/types/building.types';

// Định nghĩa kiểu dữ liệu cho FacilityInfo hiển thị trên thẻ Hero
interface FacilityInfo {
  name: string;
  address: string;
  totalCapacity: number;
  totalFloors: number;
  totalZones: number;
  imageUrl: string;
}

// Định nghĩa kiểu dữ liệu cho ZoneInfo (thông tin phân khu)
interface ZoneInfo {
  id: string;
  name: string;
  level: string;
  capacity: number;
  occupancyRate: number;
  trafficLevel: 'High' | 'Average' | 'Open';
}

// Định nghĩa kiểu dữ liệu cho FloorInfo (thông tin tầng)
interface FloorInfo {
  id: string;
  code: string;
  name: string;
  capacity: number;
  occupied: number;
  occupancyRate: number;
  statusText: string;
}

export default function FacilityManagementPage() {
  // Lấy thông tin user hiện tại (Manager) từ Auth Context
  const { user } = useAuth();
  
  // State quản lý thời gian thực hiển thị trên Header
  const [currentTime, setCurrentTime] = useState('00:00:00');
  const [currentDate, setCurrentDate] = useState('Loading date...');

  // ─── STATE QUẢN LÝ DANH SÁCH TÒA NHÀ & PHÂN TRANG ─────────────────────────────
  // Khởi tạo danh sách tòa nhà giả lập ban đầu để dựng giao diện
  const [buildings, setBuildings] = useState<Building[]>([
    {
      id: 1,
      code: 'BLD-FLOW',
      name: 'Urban Flow Tower',
      address: '123 Innovation Blvd, District 1, Ho Chi Minh City',
      totalFloor: 3,
      status: BuildingStatus.Available
    },
    {
      id: 2,
      code: 'BLD-PLAZA',
      name: 'Smart City Plaza',
      address: '456 Tech Street, District 7, Ho Chi Minh City',
      totalFloor: 8,
      status: BuildingStatus.Occupied
    },
    {
      id: 3,
      code: 'BLD-EV',
      name: 'EV Green Hub',
      address: '789 Eco Way, Binh Thanh District, Ho Chi Minh City',
      totalFloor: 5,
      status: BuildingStatus.OutOfService
    }
  ]);

  // Các state hỗ trợ phân trang (Pagination)
  const [pageIndex, setPageIndex] = useState(1);       // Trang hiện tại, mặc định là trang 1
  const [pageSize] = useState(10);                    // Số lượng bản ghi cố định trên mỗi trang là 10
  const [totalCount, setTotalCount] = useState(3);     // Tổng số lượng tòa nhà hiện tại là 3
  const [totalPages, setTotalPages] = useState(1);     // Tổng số trang có thể hiển thị, mặc định là 1

  // Tòa nhà đang được chọn làm tòa nhà chủ đạo hiển thị chi tiết (Active Building)
  const [activeBuilding, setActiveBuilding] = useState<Building | null>({
    id: 1,
    code: 'BLD-FLOW',
    name: 'Urban Flow Tower',
    address: '123 Innovation Blvd, District 1, Ho Chi Minh City',
    totalFloor: 3,
    status: BuildingStatus.Available
  });

  // State thông tin cơ sở vật chất tổng quát của tòa nhà đang chọn
  const [facility, setFacility] = useState<FacilityInfo>({
    name: 'Urban Flow Tower',
    address: '123 Innovation Blvd, District 1, Ho Chi Minh City',
    totalCapacity: 500,
    totalFloors: 3,
    totalZones: 6,
    imageUrl: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=600&auto=format&fit=crop'
  });

  // State danh sách các Phân khu (Zones) thuộc tòa nhà đang chọn
  const [zones, setZones] = useState<ZoneInfo[]>([
    { id: 'z-1', name: 'Premium Zone', level: 'Level B1', capacity: 50, occupancyRate: 95, trafficLevel: 'High' },
    { id: 'z-2', name: 'Standard A', level: 'Level B2', capacity: 100, occupancyRate: 60, trafficLevel: 'Average' },
    { id: 'z-3', name: 'EV Hub', level: 'Level B1', capacity: 150, occupancyRate: 30, trafficLevel: 'Open' },
    { id: 'z-4', name: 'VIP Reserved', level: 'Rooftop', capacity: 100, occupancyRate: 90, trafficLevel: 'High' }
  ]);

  // State danh sách các Tầng (Floors) thuộc tòa nhà đang chọn
  const [floors, setFloors] = useState<FloorInfo[]>([
    { id: 'f-1', code: 'B1', name: 'Level B1', capacity: 200, occupied: 150, occupancyRate: 75, statusText: '75% Full' },
    { id: 'f-2', code: 'B2', name: 'Level B2', capacity: 200, occupied: 85, occupancyRate: 42.5, statusText: '42.5% Full' },
    { id: 'f-3', code: 'VIP', name: 'Rooftop', capacity: 100, occupied: 90, occupancyRate: 90, statusText: '90% Full' }
  ]);

  // ─── STATE QUẢN LÝ FORM & MODALS ─────────────────────────────────────────────
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);         // State kiểm soát đóng mở Modal Thêm mới
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);       // State kiểm soát đóng mở Modal Chỉnh sửa
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);   // State kiểm soát đóng mở Modal Xác nhận xóa
  const [isWarningModalOpen, setIsWarningModalOpen] = useState(false); // State kiểm soát đóng mở Modal Cảnh báo giảm tầng

  // Các state giữ giá trị của Form nhập liệu
  const [formCode, setFormCode] = useState('');
  const [formName, setFormName] = useState('');
  const [formAddress, setFormAddress] = useState('');
  const [formTotalFloor, setFormTotalFloor] = useState(1);
  const [formStatus, setFormStatus] = useState<BuildingStatus>(BuildingStatus.Available);

  // Đối tượng tòa nhà đang được chọn để sửa hoặc xóa
  const [editingBuilding, setEditingBuilding] = useState<Building | null>(null);
  const [deletingBuilding, setDeletingBuilding] = useState<Building | null>(null);

  // Trạng thái Loading khi đang lưu dữ liệu
  const [isSaving, setIsSaving] = useState(false);

  // State Toast thông báo
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error'>('success');

  // Hàm trigger hiển thị Toast tiện lợi
  const triggerToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToastMessage(message);
    setToastType(type);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000); // Ẩn toast sau 3 giây
  };

  // Đồng hồ cập nhật mỗi giây trên header
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

  // Đồng bộ thông tin Hero, Floors và Zones khi activeBuilding thay đổi
  useEffect(() => {
    if (activeBuilding) {
      setFacility({
        name: activeBuilding.name,
        address: activeBuilding.address || 'No address provided',
        totalCapacity: activeBuilding.totalFloor * 150, // Giả định sức chứa dựa trên số tầng
        totalFloors: activeBuilding.totalFloor,
        totalZones: activeBuilding.totalFloor * 2, // Giả định số phân khu dựa trên số tầng
        imageUrl: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=600&auto=format&fit=crop'
      });

      // Tạo động danh sách tầng tương ứng với số tầng của Tòa nhà được chọn
      const generatedFloors: FloorInfo[] = Array.from({ length: activeBuilding.totalFloor }, (_, idx) => {
        const floorNum = idx + 1;
        return {
          id: `f-${activeBuilding.id}-${floorNum}`,
          code: `F${floorNum}`,
          name: `Floor ${floorNum}`,
          capacity: 150,
          occupied: floorNum === 1 ? 120 : floorNum === 2 ? 80 : 0,
          occupancyRate: floorNum === 1 ? 80 : floorNum === 2 ? 53.3 : 0,
          statusText: floorNum === 1 ? 'High Traffic' : 'Available'
        };
      });
      setFloors(generatedFloors);

      // Tạo động danh sách phân khu tương ứng
      const generatedZones: ZoneInfo[] = [
        { id: `z-${activeBuilding.id}-1`, name: 'Premium Zone', level: 'Floor 1', capacity: 50, occupancyRate: 90, trafficLevel: 'High' },
        { id: `z-${activeBuilding.id}-2`, name: 'Standard Zone A', level: 'Floor 1', capacity: 100, occupancyRate: 75, trafficLevel: 'Average' },
        { id: `z-${activeBuilding.id}-3`, name: 'EV Parking Hub', level: 'Floor 2', capacity: 80, occupancyRate: 40, trafficLevel: 'Open' }
      ];
      setZones(generatedZones);
    }
  }, [activeBuilding]);

  // ─── CÁC HÀM XỬ LÝ SỰ KIỆN FORM & MOCK CRUD ──────────────────────────────────
  
  // Hàm mở Modal thêm tòa nhà mới
  const handleOpenAddModal = () => {
    setFormCode('');
    setFormName('');
    setFormAddress('');
    setFormTotalFloor(1);
    setIsAddModalOpen(true);
  };

  // Hàm mở Modal chỉnh sửa tòa nhà
  const handleOpenEditModal = (bld: Building, e: React.MouseEvent) => {
    e.stopPropagation(); // Ngăn chặn sự kiện click lan truyền làm chọn dòng active
    setEditingBuilding(bld);
    setFormCode(bld.code);
    setFormName(bld.name);
    setFormAddress(bld.address || '');
    setFormTotalFloor(bld.totalFloor);
    setFormStatus(bld.status);
    setIsEditModalOpen(true);
  };

  // Hàm mở Modal xác nhận xóa
  const handleOpenDeleteModal = (bld: Building, e: React.MouseEvent) => {
    e.stopPropagation(); // Ngăn chặn sự kiện click dòng active
    setDeletingBuilding(bld);
    setIsDeleteModalOpen(true);
  };

  // Hàm lưu khi thêm mới tòa nhà (Mock)
  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    setTimeout(() => {
      const newBuilding: Building = {
        id: Date.now(), // Tạo ID tạm thời dạng miliseconds
        code: formCode,
        name: formName,
        address: formAddress || null,
        totalFloor: formTotalFloor,
        status: BuildingStatus.Available
      };

      setBuildings([...buildings, newBuilding]);
      setIsSaving(false);
      setIsAddModalOpen(false);
      triggerToast('Thêm tòa nhà mới thành công!');
    }, 800);
  };

  // Hàm tiền xử lý lưu chỉnh sửa (Kiểm tra xem có bị giảm số tầng hay không)
  const handleEditPreSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!editingBuilding) return;

    // Kiểm tra nếu Manager giảm số tầng xuống nhỏ hơn ban đầu
    if (formTotalFloor < editingBuilding.totalFloor) {
      // Mở Modal cảnh báo xác nhận giảm tầng và vẫn giữ Modal chỉnh sửa ở dưới
      setIsWarningModalOpen(true);
    } else {
      // Nếu không giảm tầng hoặc tăng tầng, tiến hành lưu bình thường
      executeEditSave();
    }
  };

  // Hàm thực thi việc cập nhật tòa nhà vào state (Mock Update)
  const executeEditSave = () => {
    setIsSaving(true);
    setIsWarningModalOpen(false);

    setTimeout(() => {
      if (!editingBuilding) return;

      const updatedList = buildings.map(bld => {
        if (bld.id === editingBuilding.id) {
          return {
            ...bld,
            code: formCode,
            name: formName,
            address: formAddress || null,
            totalFloor: formTotalFloor,
            status: formStatus
          };
        }
        return bld;
      });

      setBuildings(updatedList);

      // Cập nhật lại tòa nhà chủ đạo đang được chọn hiển thị nếu đó là tòa nhà vừa sửa
      if (activeBuilding && activeBuilding.id === editingBuilding.id) {
        setActiveBuilding({
          id: editingBuilding.id,
          code: formCode,
          name: formName,
          address: formAddress || null,
          totalFloor: formTotalFloor,
          status: formStatus
        });
      }

      setIsSaving(false);
      setIsEditModalOpen(false);
      setEditingBuilding(null);
      triggerToast('Cập nhật cấu hình tòa nhà thành công!');
    }, 800);
  };

  // Hàm xóa tòa nhà khỏi danh sách (Mock Delete)
  const executeDelete = () => {
    if (!deletingBuilding) return;

    setTimeout(() => {
      const updatedList = buildings.filter(b => b.id !== deletingBuilding.id);
      setBuildings(updatedList);

      // Nếu tòa nhà vừa xóa trùng với tòa nhà đang chọn hiển thị, chuyển active sang tòa nhà đầu tiên còn lại
      if (activeBuilding && activeBuilding.id === deletingBuilding.id) {
        setActiveBuilding(updatedList.length > 0 ? updatedList[0] : null);
      }

      setIsDeleteModalOpen(false);
      setDeletingBuilding(null);
      triggerToast('Xóa tòa nhà thành công!');
    }, 500);
  };

  return (
    <div className="flex-grow flex flex-col min-h-screen bg-[#f8f9ff]">
      
      {/* ===== THÔNG BÁO TOAST NỔI ===== */}
      {showToast && (
        <div 
          className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-3 rounded-xl shadow-lg animate-bounce transition-all ${
            toastType === 'success' ? 'bg-emerald-500 text-white shadow-emerald-500/20' : 'bg-red-500 text-white shadow-red-500/20'
          }`}
        >
          <span className="material-symbols-outlined">
            {toastType === 'success' ? 'check_circle' : 'error'}
          </span>
          <span className="text-sm font-semibold">{toastMessage}</span>
        </div>
      )}

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

        {/* Tiêu đề trang & Nút thêm mới mở Modal */}
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
            <button
              onClick={handleOpenAddModal}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-emerald-500 text-white hover:bg-emerald-600 text-sm font-semibold rounded-[12px] transition-all shadow-md shadow-emerald-500/10"
            >
              <span className="material-symbols-outlined text-lg">add</span>
              Add Building
            </button>
          </div>
        </div>

        {/* ─── DANH SÁCH BẢNG TÒA NHÀ & PHÂN TRANG (MỚI THÊM) ────────────────── */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden mb-8">
          <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
            <h3 className="font-bold text-slate-800 text-base">Buildings Directory</h3>
            <span className="text-xs text-slate-400 font-medium">Click a row to load its capacity details</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider bg-slate-50/20">
                  <th className="py-4 px-6">Building Code</th>
                  <th className="py-4 px-6">Building Name</th>
                  <th className="py-4 px-6">Address</th>
                  <th className="py-4 px-6 text-center">Floors</th>
                  <th className="py-4 px-6 text-center">Status</th>
                  <th className="py-4 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {buildings.map((bld) => (
                  <tr 
                    key={bld.id} 
                    onClick={() => setActiveBuilding(bld)}
                    className={`border-b border-slate-50 hover:bg-slate-50/40 cursor-pointer transition-all ${
                      activeBuilding?.id === bld.id ? 'bg-emerald-50/30' : ''
                    }`}
                  >
                    <td className="py-4 px-6 font-mono text-xs font-bold text-slate-700">
                      {bld.code}
                    </td>
                    <td className="py-4 px-6 text-sm font-semibold text-slate-800">
                      {bld.name}
                    </td>
                    <td className="py-4 px-6 text-xs text-slate-500 max-w-xs truncate">
                      {bld.address || '—'}
                    </td>
                    <td className="py-4 px-6 text-sm font-semibold text-slate-700 text-center">
                      {bld.totalFloor}
                    </td>
                    <td className="py-4 px-6 text-center">
                      {bld.status === BuildingStatus.Available && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-50 text-emerald-600">
                          Available
                        </span>
                      )}
                      {bld.status === BuildingStatus.Occupied && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-50 text-amber-600">
                          Occupied
                        </span>
                      )}
                      {bld.status === BuildingStatus.Reserved && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-sky-50 text-sky-600">
                          Reserved
                        </span>
                      )}
                      {bld.status === BuildingStatus.OutOfService && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-red-50 text-red-600">
                          Maintenance
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-6 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={(e) => handleOpenEditModal(bld, e)}
                          className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-500 hover:text-emerald-500 transition-colors"
                        >
                          <span className="material-symbols-outlined text-lg">edit</span>
                        </button>
                        <button
                          onClick={(e) => handleOpenDeleteModal(bld, e)}
                          className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-500 hover:text-red-500 transition-colors"
                        >
                          <span className="material-symbols-outlined text-lg">delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Thanh phân trang cố định */}
          <div className="px-6 py-4 bg-slate-50/50 border-t border-slate-100 flex justify-between items-center text-xs text-slate-500">
            <span>Showing 1 to {buildings.length} of {totalCount} records</span>
            <div className="flex gap-2">
              <button 
                disabled={pageIndex === 1}
                onClick={() => setPageIndex(p => Math.max(p - 1, 1))}
                className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 font-semibold disabled:opacity-50 disabled:pointer-events-none transition-colors"
              >
                Previous
              </button>
              <button 
                disabled={pageIndex === totalPages}
                onClick={() => setPageIndex(p => Math.min(p + 1, totalPages))}
                className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 font-semibold disabled:opacity-50 disabled:pointer-events-none transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        </div>

        {/* Lưới bố cục (Grid Layout) */}
        {activeBuilding ? (
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
                    <span className="text-sm font-bold text-slate-800">{Math.round(facility.totalCapacity * 0.7)}</span>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-slate-100/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-sm bg-sky-400"></div>
                      <span className="material-symbols-outlined text-slate-500 text-[18px]">ev_station</span>
                      <span className="text-xs font-semibold text-slate-600">EV Charging</span>
                    </div>
                    <span className="text-sm font-bold text-slate-800">{Math.round(facility.totalCapacity * 0.3)}</span>
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
        ) : (
          <div className="bg-white p-8 rounded-2xl text-center text-slate-500 border border-slate-100 shadow-sm">
            Please add or select a building to view spatial configuration details.
          </div>
        )}
      </main>

      {/* ─── MODAL 1: THÊM MỚI TÒA NHÀ ───────────────────────────────────────── */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Lớp nền mờ click out để đóng */}
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setIsAddModalOpen(false)}></div>
          
          {/* Panel Modal chính */}
          <div className="relative w-full max-w-md bg-white rounded-2xl border border-slate-100 shadow-xl overflow-hidden z-10 animate-in fade-in zoom-in-95 duration-150">
            <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
              <h3 className="font-bold text-slate-800 text-base">Add New Building</h3>
              <button 
                onClick={() => setIsAddModalOpen(false)}
                className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Building Code *</label>
                <input 
                  type="text" 
                  required
                  maxLength={20}
                  value={formCode}
                  onChange={(e) => setFormCode(e.target.value)}
                  placeholder="e.g. BLD01"
                  className="w-full bg-white border border-slate-200 text-slate-850 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 transition-all font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Building Name *</label>
                <input 
                  type="text" 
                  required
                  maxLength={50}
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. Building A"
                  className="w-full bg-white border border-slate-200 text-slate-850 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 transition-all font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Address</label>
                <input 
                  type="text" 
                  maxLength={100}
                  value={formAddress}
                  onChange={(e) => setFormAddress(e.target.value)}
                  placeholder="e.g. 123 Street, District 1"
                  className="w-full bg-white border border-slate-200 text-slate-850 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 transition-all font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Total Floors *</label>
                <input 
                  type="number" 
                  required
                  min={1}
                  max={100}
                  value={formTotalFloor}
                  onChange={(e) => setFormTotalFloor(Number(e.target.value))}
                  className="w-full bg-white border border-slate-200 text-slate-850 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 transition-all font-medium"
                />
              </div>

              <div className="flex gap-3 pt-4 justify-end border-t border-slate-100">
                <button 
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-500 bg-transparent hover:bg-slate-50 border border-slate-200 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={isSaving}
                  className="px-4 py-2 text-xs font-bold text-white bg-emerald-500 hover:bg-emerald-600 rounded-xl shadow-md transition-all flex items-center gap-1.5 disabled:opacity-50"
                >
                  {isSaving ? 'Saving...' : 'Add Building'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── MODAL 2: CHỈNH SỬA TÒA NHÀ ──────────────────────────────────────── */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setIsEditModalOpen(false)}></div>
          
          <div className="relative w-full max-w-md bg-white rounded-2xl border border-slate-100 shadow-xl overflow-hidden z-10 animate-in fade-in zoom-in-95 duration-150">
            <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
              <h3 className="font-bold text-slate-800 text-base">Edit Building Config</h3>
              <button 
                onClick={() => setIsEditModalOpen(false)}
                className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleEditPreSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Building Code *</label>
                <input 
                  type="text" 
                  required
                  maxLength={20}
                  value={formCode}
                  onChange={(e) => setFormCode(e.target.value)}
                  className="w-full bg-white border border-slate-200 text-slate-850 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 transition-all font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Building Name *</label>
                <input 
                  type="text" 
                  required
                  maxLength={50}
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full bg-white border border-slate-200 text-slate-850 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 transition-all font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Address</label>
                <input 
                  type="text" 
                  maxLength={100}
                  value={formAddress}
                  onChange={(e) => setFormAddress(e.target.value)}
                  className="w-full bg-white border border-slate-200 text-slate-850 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 transition-all font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Total Floors *</label>
                <input 
                  type="number" 
                  required
                  min={1}
                  max={100}
                  value={formTotalFloor}
                  onChange={(e) => setFormTotalFloor(Number(e.target.value))}
                  className="w-full bg-white border border-slate-200 text-slate-850 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 transition-all font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Status</label>
                <select 
                  value={formStatus}
                  onChange={(e) => setFormStatus(Number(e.target.value) as BuildingStatus)}
                  className="w-full bg-white border border-slate-200 text-slate-850 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 transition-all font-medium"
                >
                  <option value={BuildingStatus.Available}>Available & Active</option>
                  <option value={BuildingStatus.Occupied}>Full capacity (Occupied)</option>
                  <option value={BuildingStatus.Reserved}>Reserved</option>
                  <option value={BuildingStatus.OutOfService}>Maintenance (Closed)</option>
                </select>
              </div>

              <div className="flex gap-3 pt-4 justify-end border-t border-slate-100">
                <button 
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-500 bg-transparent hover:bg-slate-50 border border-slate-200 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={isSaving}
                  className="px-4 py-2 text-xs font-bold text-white bg-emerald-500 hover:bg-emerald-600 rounded-xl shadow-md transition-all flex items-center gap-1.5 disabled:opacity-50"
                >
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── MODAL 3: XÁC NHẬN GIẢM SỐ TẦNG (WARNING ALERT DIALOG) ───────────────── */}
      {isWarningModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => setIsWarningModalOpen(false)}></div>
          
          <div className="relative w-full max-w-sm bg-white rounded-2xl border border-slate-100 shadow-2xl p-6 z-10 animate-in fade-in zoom-in-95 duration-100">
            <div className="flex items-center gap-3 text-amber-500 mb-4">
              <span className="material-symbols-outlined text-3xl">warning</span>
              <h4 className="font-bold text-slate-800 text-lg">Xác nhận giảm số tầng</h4>
            </div>
            
            <p className="text-xs text-slate-600 leading-relaxed mb-6">
              Cảnh báo: Bạn đang giảm số tầng đỗ xe từ <span className="font-bold text-slate-800">{editingBuilding?.totalFloor}</span> xuống <span className="font-bold text-slate-800">{formTotalFloor}</span>. 
              Điều này có thể dẫn đến việc **xóa toàn bộ các cấu hình phân khu, bãi đỗ và tầng** từ tầng <span className="font-bold text-red-500">{formTotalFloor + 1}</span> trở lên. Bạn có chắc chắn muốn tiến hành?
            </p>

            <div className="flex gap-3 justify-end">
              <button 
                type="button"
                onClick={() => setIsWarningModalOpen(false)}
                className="px-4 py-2 text-xs font-bold text-slate-500 bg-slate-50 hover:bg-slate-100 rounded-xl transition-colors"
              >
                Hủy bỏ
              </button>
              <button 
                type="button"
                onClick={executeEditSave}
                className="px-4 py-2 text-xs font-bold text-white bg-red-500 hover:bg-red-600 rounded-xl shadow-md shadow-red-500/10 transition-colors"
              >
                Đồng ý & Xóa
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL 4: XÁC NHẬN XÓA TÒA NHÀ (DELETE CONFIRM DIALOG) ─────────────── */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setIsDeleteModalOpen(false)}></div>
          
          <div className="relative w-full max-w-sm bg-white rounded-2xl border border-slate-100 shadow-xl p-6 z-10 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 text-red-500 mb-4">
              <span className="material-symbols-outlined text-3xl">delete_forever</span>
              <h4 className="font-bold text-slate-800 text-lg">Xóa tòa nhà</h4>
            </div>
            
            <p className="text-xs text-slate-600 leading-relaxed mb-6">
              Bạn có chắc chắn muốn xóa tòa nhà <span className="font-bold text-slate-800">{deletingBuilding?.name}</span>? 
              Hành động này là vĩnh viễn và không thể hoàn tác. Mọi thông tin đỗ xe liên quan sẽ bị xóa sạch khỏi hệ thống.
            </p>

            <div className="flex gap-3 justify-end">
              <button 
                type="button"
                onClick={() => setIsDeleteModalOpen(false)}
                className="px-4 py-2 text-xs font-bold text-slate-500 bg-transparent hover:bg-slate-50 border border-slate-200 rounded-xl transition-colors"
              >
                Hủy
              </button>
              <button 
                type="button"
                onClick={executeDelete}
                className="px-4 py-2 text-xs font-bold text-white bg-red-500 hover:bg-red-600 rounded-xl shadow-md shadow-red-500/10 transition-colors"
              >
                Xác nhận Xóa
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
