'use client';

// Nhập các hook và thư viện cần thiết từ React
import React, { useEffect, useState, useMemo } from 'react';

// Nhập hook quản lý thông tin đăng nhập
import { useAuth } from '@/features/auth';
// Nhập API client để giao tiếp với backend
import { api } from '@/lib/api/client';
// Nhập các type định nghĩa của Building
import { Building, BuildingStatus, BaseResponse, PagedResult } from '@/lib/types/building.types';

// Định nghĩa kiểu dữ liệu cho vị trí đỗ xe giả lập (Slot Mock)
interface ParkingSlotMock {
  id: number;
  code: string;
  floor: string;
  type: 'Standard' | 'VIP' | 'EV Charging';
  status: 'Available' | 'Occupied' | 'Maintenance';
  hardwareId: string;
}

// Hàm sinh dữ liệu vị trí đỗ ngẫu nhiên dựa trên số tầng của tòa nhà
const generateMockSlotsForBuilding = (buildingId: number, totalFloor: number, buildingCode?: string): ParkingSlotMock[] => {
  const slots: ParkingSlotMock[] = [];
  
  // Mỗi tầng tạo 5 vị trí đỗ xe để làm mẫu
  const slotsPerFloor = 5;
  const totalSlotsCount = totalFloor * slotsPerFloor;

  for (let i = 1; i <= totalSlotsCount; i++) {
    const floorNum = Math.ceil(i / slotsPerFloor);
    let type: 'Standard' | 'VIP' | 'EV Charging' = 'Standard';
    if (i % 5 === 0) type = 'EV Charging';
    else if (i % 7 === 0) type = 'VIP';

    let status: 'Available' | 'Occupied' | 'Maintenance' = 'Available';
    if (i % 3 === 0) status = 'Occupied';
    else if (i % 11 === 0) status = 'Maintenance';

    slots.push({
      id: i,
      code: `${buildingCode || 'SLT'}-F${floorNum}-${String(i).padStart(3, '0')}`,
      floor: `Floor ${floorNum}`,
      type,
      status,
      hardwareId: `SNR-FL${floorNum}-${String(1000 + i).substring(1)}`
    });
  }
  return slots;
};

export default function FacilityManagementPage() {
  // Lấy thông tin user hiện tại (Manager) từ Auth Context
  const { user } = useAuth();
  
  // State quản lý thời gian thực hiển thị trên Header
  const [currentTime, setCurrentTime] = useState('00:00:00');
  const [currentDate, setCurrentDate] = useState('Loading date...');

  // ─── STATE QUẢN LÝ DANH SÁCH TÒA NHÀ & PHÂN TRANG ─────────────────────────────
  // Khởi tạo danh sách tòa nhà ban đầu
  const [buildings, setBuildings] = useState<Building[]>([
    {
      id: 1,
      code: 'BLD-TOWN',
      name: 'Urban Flow Tower',
      address: '100 Tech Plaza, Downtown',
      totalFloor: 10,
      status: BuildingStatus.Available
    },
    {
      id: 2,
      code: 'BLD-NORTH',
      name: 'Northside Complex',
      address: '450 Industrial Parkway',
      totalFloor: 4,
      status: BuildingStatus.Occupied
    },
    {
      id: 3,
      code: 'BLD-EAST',
      name: 'East Gate Hub',
      address: '22 Riverside Ave',
      totalFloor: 6,
      status: BuildingStatus.Reserved
    },
    {
      id: 4,
      code: 'BLD-WEST',
      name: 'West End Annex',
      address: '880 Sunset Blvd',
      totalFloor: 2,
      status: BuildingStatus.OutOfService
    }
  ]);

  // Các state hỗ trợ phân trang cho tòa nhà (Pagination)
  const [pageIndex, setPageIndex] = useState(1);       // Trang hiện tại
  const [pageSize] = useState(10);                    // Số lượng bản ghi cố định trên mỗi trang là 10
  const [totalCount, setTotalCount] = useState(4);     // Tổng số lượng tòa nhà
  const [totalPages, setTotalPages] = useState(1);     // Tổng số trang

  // State tìm kiếm tòa nhà
  const [searchBldQuery, setSearchBldQuery] = useState('');

  // ─── STATE QUẢN LÝ QUẢN LÝ VỊ TRÍ ĐỖ (SLOTS) ──────────────────────────────────
  // Quản lý tòa nhà đang được xem danh sách vị trí đỗ xe (null nếu đang ở màn hình danh sách tòa nhà)
  const [viewingSlotsBuilding, setViewingSlotsBuilding] = useState<Building | null>(null);

  // Map lưu trữ vị trí đỗ của từng tòa nhà theo Building ID để duy trì trạng thái CRUD cục bộ
  const [slotsMap, setSlotsMap] = useState<Record<number, ParkingSlotMock[]>>({});

  // Các state lọc danh sách vị trí đỗ xe
  const [filterFloor, setFilterFloor] = useState('All Floors');
  const [filterType, setFilterType] = useState('All Types');
  const [filterStatus, setFilterStatus] = useState('All Status');
  const [searchSlotQuery, setSearchSlotQuery] = useState('');
  const [slotsPageIndex, setSlotsPageIndex] = useState(1);
  const [slotsPageSize] = useState(10);

  // ─── STATE QUẢN LÝ CÁC MODAL & THAO TÁC (DIALOUGES/OVERLAYS) ─────────────────
  const [isAddBldOpen, setIsAddBldOpen] = useState(false);         // Mở modal thêm tòa nhà
  const [isEditBldOpen, setIsEditBldOpen] = useState(false);       // Mở modal sửa tòa nhà
  const [isDelBldOpen, setIsDelBldOpen] = useState(false);         // Mở modal xóa tòa nhà
  const [isWarningBldOpen, setIsWarningBldOpen] = useState(false); // Mở modal cảnh báo giảm tầng

  const [isAddSlotOpen, setIsAddSlotOpen] = useState(false);       // Mở modal thêm slot
  const [isEditSlotOpen, setIsEditSlotOpen] = useState(false);     // Mở modal sửa slot
  const [isDelSlotOpen, setIsDelSlotOpen] = useState(false);       // Mở modal xóa slot

  // Form State cho Tòa nhà (Building)
  const [formBldCode, setFormBldCode] = useState('');
  const [formBldName, setFormBldName] = useState('');
  const [formBldAddress, setFormBldAddress] = useState('');
  const [formBldTotalFloor, setFormBldTotalFloor] = useState(1);
  const [formBldStatus, setFormBldStatus] = useState<BuildingStatus>(BuildingStatus.Available);

  const [editingBld, setEditingBld] = useState<Building | null>(null);
  const [deletingBld, setDeletingBld] = useState<Building | null>(null);

  // Form State cho Vị trí đỗ (Slot)
  const [formSlotCode, setFormSlotCode] = useState('');
  const [formSlotFloor, setFormSlotFloor] = useState('Floor 1');
  const [formSlotType, setFormSlotType] = useState<'Standard' | 'VIP' | 'EV Charging'>('Standard');
  const [formSlotStatus, setFormSlotStatus] = useState<'Available' | 'Occupied' | 'Maintenance'>('Available');
  const [formSlotHardwareId, setFormSlotHardwareId] = useState('');

  const [editingSlot, setEditingSlot] = useState<ParkingSlotMock | null>(null);
  const [deletingSlot, setDeletingSlot] = useState<ParkingSlotMock | null>(null);

  // Trạng thái Loading khi đang lưu dữ liệu
  const [isSaving, setIsSaving] = useState(false);

  // State Toast thông báo
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error'>('success');

  // Hàm kích hoạt Toast thông báo nhanh
  const triggerToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToastMessage(message);
    setToastType(type);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  // Đồng hồ cập nhật mỗi giây trên Header
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

  // ─── TÍCH HỢP BỘ LỌC VÀ LẤY DANH SÁCH TÒA NHÀ PHÂN TRANG TỪ API ───────────────
  const fetchBuildings = async (index: number) => {
    try {
      // Gọi GET API phân trang đến endpoint /api/Buildings/paged
      const res = await api.get<BaseResponse<PagedResult<Building>>>(
        `/Buildings/paged?pageIndex=${index}&pageSize=${pageSize}`
      );

      // Nếu API phản hồi thành công
      if (res.success && res.data && res.data.items.length > 0) {
        setBuildings(res.data.items);
        setTotalCount(res.data.totalCount);
        setTotalPages(res.data.totalPages);
        setPageIndex(res.data.pageIndex);
      }
    } catch (error) {
      console.warn('Không thể kết nối API. Sử dụng danh sách Mock làm phương án dự phòng.', error);
    }
  };

  // Tải danh sách tòa nhà khi trang thay đổi
  useEffect(() => {
    fetchBuildings(pageIndex);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageIndex]);

  // Bộ lọc tìm kiếm tòa nhà cục bộ
  const filteredBuildings = useMemo(() => {
    return buildings.filter(bld => {
      const query = searchBldQuery.toLowerCase();
      return (
        bld.name.toLowerCase().includes(query) ||
        bld.code.toLowerCase().includes(query) ||
        (bld.address && bld.address.toLowerCase().includes(query))
      );
    });
  }, [buildings, searchBldQuery]);

  // ─── TẠO VÀ QUẢN LÝ DỮ LIỆU VỊ TRÍ ĐỖ XE GIẢ LẬP (SLOTS MAP) ──────────────────
  // Lấy hoặc khởi tạo danh sách vị trí đỗ của tòa nhà đang chọn
  const activeSlots = useMemo(() => {
    if (!viewingSlotsBuilding) return [];
    
    // Nếu chưa có dữ liệu trong slotsMap, tự động khởi tạo
    if (!slotsMap[viewingSlotsBuilding.id]) {
      const generated = generateMockSlotsForBuilding(
        viewingSlotsBuilding.id,
        viewingSlotsBuilding.totalFloor,
        viewingSlotsBuilding.code
      );
      setSlotsMap(prev => ({ ...prev, [viewingSlotsBuilding.id]: generated }));
      return generated;
    }
    
    return slotsMap[viewingSlotsBuilding.id];
  }, [viewingSlotsBuilding, slotsMap]);


  // Bộ lọc & Tìm kiếm danh sách vị trí đỗ xe
  const filteredSlots = useMemo(() => {
    return activeSlots.filter(slot => {
      const matchFloor = filterFloor === 'All Floors' || slot.floor === filterFloor;
      const matchType = filterType === 'All Types' || slot.type === filterType;
      const matchStatus = filterStatus === 'All Status' || slot.status === filterStatus;
      
      const query = searchSlotQuery.toLowerCase();
      const matchSearch = slot.code.toLowerCase().includes(query) || slot.hardwareId.toLowerCase().includes(query);
      
      return matchFloor && matchType && matchStatus && matchSearch;
    });
  }, [activeSlots, filterFloor, filterType, filterStatus, searchSlotQuery]);

  // Phân trang danh sách vị trí đỗ xe (10 bản ghi mỗi trang)
  const paginatedSlots = useMemo(() => {
    const startIndex = (slotsPageIndex - 1) * slotsPageSize;
    return filteredSlots.slice(startIndex, startIndex + slotsPageSize);
  }, [filteredSlots, slotsPageIndex, slotsPageSize]);

  const slotsTotalPages = useMemo(() => {
    return Math.ceil(filteredSlots.length / slotsPageSize) || 1;
  }, [filteredSlots, slotsPageSize]);

  // Reset trang vị trí đỗ xe khi thay đổi bộ lọc
  useEffect(() => {
    setSlotsPageIndex(1);
  }, [filterFloor, filterType, filterStatus, searchSlotQuery]);

  // Thống kê nhanh số lượng vị trí đỗ (Bento Stats)
  const slotsStats = useMemo(() => {
    const total = activeSlots.length;
    const available = activeSlots.filter(s => s.status === 'Available').length;
    const occupied = activeSlots.filter(s => s.status === 'Occupied').length;
    const maintenance = activeSlots.filter(s => s.status === 'Maintenance').length;
    return { total, available, occupied, maintenance };
  }, [activeSlots]);

  // ─── THAO TÁC CRUD CHO TÒA NHÀ (BUILDINGS) ───────────────────────────────────
  // Mở modal thêm tòa nhà mới
  const handleOpenAddBld = () => {
    setFormBldCode('');
    setFormBldName('');
    setFormBldAddress('');
    setFormBldTotalFloor(1);
    setFormBldStatus(BuildingStatus.Available);
    setIsAddBldOpen(true);
  };

  // Mở modal sửa tòa nhà
  const handleOpenEditBld = (bld: Building, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingBld(bld);
    setFormBldCode(bld.code);
    setFormBldName(bld.name);
    setFormBldAddress(bld.address || '');
    setFormBldTotalFloor(bld.totalFloor);
    setFormBldStatus(bld.status);
    setIsEditBldOpen(true);
  };

  // Mở modal xác nhận xóa tòa nhà
  const handleOpenDelBld = (bld: Building, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeletingBld(bld);
    setIsDelBldOpen(true);
  };

  // Submit thêm mới tòa nhà
  const handleAddBldSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const res = await api.post<BaseResponse<Building>>('/Buildings', {
        code: formBldCode,
        name: formBldName,
        address: formBldAddress || undefined,
        totalFloor: formBldTotalFloor
      });

      if (res.success && res.data) {
        setIsAddBldOpen(false);
        triggerToast('Thêm tòa nhà mới thành công!');
        fetchBuildings(pageIndex);
      } else {
        triggerToast(res.message || 'Lỗi xảy ra từ máy chủ!', 'error');
      }
    } catch (error) {
      console.warn('Lỗi mạng, kích hoạt Mock Fallback thêm tòa nhà:', error);
      
      const newBld: Building = {
        id: Date.now(),
        code: formBldCode,
        name: formBldName,
        address: formBldAddress || null,
        totalFloor: formBldTotalFloor,
        status: BuildingStatus.Available
      };

      setBuildings(prev => [...prev, newBld]);
      setTotalCount(prev => prev + 1);
      setIsAddBldOpen(false);
      triggerToast('Đã lưu tòa nhà cục bộ (Chế độ offline)!');
    } finally {
      setIsSaving(false);
    }
  };

  // Tiền xử lý submit cập nhật tòa nhà (kiểm tra giảm tầng)
  const handleEditBldPreSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBld) return;

    if (formBldTotalFloor < editingBld.totalFloor) {
      // Bật modal cảnh báo giảm tầng
      setIsWarningBldOpen(true);
    } else {
      executeEditBldSave();
    }
  };

  // Thực thi cập nhật tòa nhà lên Backend API
  const executeEditBldSave = async () => {
    if (!editingBld) return;
    setIsSaving(true);
    setIsWarningBldOpen(false);

    try {
      const res = await api.put<BaseResponse<Building>>(`/Buildings/${editingBld.id}`, {
        code: formBldCode,
        name: formBldName,
        address: formBldAddress || undefined,
        totalFloor: formBldTotalFloor,
        status: formBldStatus
      });

      if (res.success) {
        setIsEditBldOpen(false);
        setEditingBld(null);
        triggerToast('Cập nhật thông tin tòa nhà thành công!');
        fetchBuildings(pageIndex);
      } else {
        triggerToast(res.message || 'Lỗi khi cập nhật cấu hình tòa nhà!', 'error');
      }
    } catch (error) {
      console.warn('Lỗi mạng, kích hoạt Mock Fallback sửa tòa nhà:', error);

      // Cập nhật state cục bộ
      setBuildings(prev => prev.map(b => b.id === editingBld.id ? {
        ...b,
        code: formBldCode,
        name: formBldName,
        address: formBldAddress || null,
        totalFloor: formBldTotalFloor,
        status: formBldStatus
      } : b));

      // Điều chỉnh số tầng nếu đang xem slots của tòa nhà này
      if (viewingSlotsBuilding && viewingSlotsBuilding.id === editingBld.id) {
        setViewingSlotsBuilding(prev => prev ? {
          ...prev,
          code: formBldCode,
          name: formBldName,
          address: formBldAddress || null,
          totalFloor: formBldTotalFloor,
          status: formBldStatus
        } : null);

        // Lọc bớt các slot ở tầng cao hơn tầng mới cấu hình
        const currentSlots = slotsMap[editingBld.id] || [];
        const filtered = currentSlots.filter(slot => {
          const slotFloorNum = parseInt(slot.floor.replace('Floor ', ''), 10);
          return slotFloorNum <= formBldTotalFloor;
        });
        setSlotsMap(prev => ({ ...prev, [editingBld.id]: filtered }));
      }

      setIsEditBldOpen(false);
      setEditingBld(null);
      triggerToast('Đã lưu cấu hình cục bộ (Chế độ offline)!');
    } finally {
      setIsSaving(false);
    }
  };

  // Thực thi xóa tòa nhà
  const executeDeleteBld = async () => {
    if (!deletingBld) return;
    setIsSaving(true);

    try {
      const res = await api.delete<BaseResponse<unknown>>(`/Buildings/${deletingBld.id}`);
      if (res.success) {
        setIsDelBldOpen(false);
        setDeletingBld(null);
        triggerToast('Xóa tòa nhà thành công!');
        fetchBuildings(pageIndex);
      } else {
        triggerToast(res.message || 'Lỗi xảy ra từ máy chủ khi xóa!', 'error');
      }
    } catch (error) {
      console.warn('Lỗi mạng, kích hoạt Mock Fallback xóa tòa nhà:', error);

      setBuildings(prev => prev.filter(b => b.id !== deletingBld.id));
      setTotalCount(prev => prev - 1);
      
      // Xóa bộ nhớ slot của tòa nhà này
      setSlotsMap(prev => {
        const copy = { ...prev };
        delete copy[deletingBld.id];
        return copy;
      });

      if (viewingSlotsBuilding && viewingSlotsBuilding.id === deletingBld.id) {
        setViewingSlotsBuilding(null);
      }

      setIsDelBldOpen(false);
      setDeletingBld(null);
      triggerToast('Đã xóa tòa nhà cục bộ (Chế độ offline)!');
    } finally {
      setIsSaving(false);
    }
  };

  // ─── THAO TÁC CRUD CHO VỊ TRÍ ĐỖ XE (SLOTS) ──────────────────────────────────
  // Mở modal thêm vị trí đỗ mới
  const handleOpenAddSlot = () => {
    if (!viewingSlotsBuilding) return;
    setFormSlotCode(`${viewingSlotsBuilding.code}-F1-${String(activeSlots.length + 1).padStart(3, '0')}`);
    setFormSlotFloor('Floor 1');
    setFormSlotType('Standard');
    setFormSlotStatus('Available');
    setFormSlotHardwareId(`SNR-FL1-${1000 + activeSlots.length + 1}`);
    setIsAddSlotOpen(true);
  };

  // Submit thêm mới vị trí đỗ
  const handleAddSlotSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!viewingSlotsBuilding) return;

    const newSlot: ParkingSlotMock = {
      id: Date.now(),
      code: formSlotCode,
      floor: formSlotFloor,
      type: formSlotType,
      status: formSlotStatus,
      hardwareId: formSlotHardwareId
    };

    setSlotsMap(prev => {
      const bldSlots = prev[viewingSlotsBuilding.id] || [];
      return { ...prev, [viewingSlotsBuilding.id]: [...bldSlots, newSlot] };
    });

    setIsAddSlotOpen(false);
    triggerToast('Thêm vị trí đỗ xe thành công!');
  };

  // Mở modal sửa vị trí đỗ
  const handleOpenEditSlot = (slot: ParkingSlotMock, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingSlot(slot);
    setFormSlotCode(slot.code);
    setFormSlotFloor(slot.floor);
    setFormSlotType(slot.type);
    setFormSlotStatus(slot.status);
    setFormSlotHardwareId(slot.hardwareId);
    setIsEditSlotOpen(true);
  };

  // Submit cập nhật thông tin vị trí đỗ
  const handleEditSlotSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!viewingSlotsBuilding || !editingSlot) return;

    setSlotsMap(prev => {
      const bldSlots = prev[viewingSlotsBuilding.id] || [];
      const updated = bldSlots.map(s => s.id === editingSlot.id ? {
        ...s,
        code: formSlotCode,
        floor: formSlotFloor,
        type: formSlotType,
        status: formSlotStatus,
        hardwareId: formSlotHardwareId
      } : s);
      return { ...prev, [viewingSlotsBuilding.id]: updated };
    });

    setIsEditSlotOpen(false);
    setEditingSlot(null);
    triggerToast('Cập nhật vị trí đỗ xe thành công!');
  };

  // Mở modal xác nhận xóa vị trí đỗ
  const handleOpenDelSlot = (slot: ParkingSlotMock, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeletingSlot(slot);
    setIsDelSlotOpen(true);
  };

  // Thực thi xóa vị trí đỗ
  const executeDeleteSlot = () => {
    if (!viewingSlotsBuilding || !deletingSlot) return;

    setSlotsMap(prev => {
      const bldSlots = prev[viewingSlotsBuilding.id] || [];
      const filtered = bldSlots.filter(s => s.id !== deletingSlot.id);
      return { ...prev, [viewingSlotsBuilding.id]: filtered };
    });

    setIsDelSlotOpen(false);
    setDeletingSlot(null);
    triggerToast('Xóa vị trí đỗ xe thành công!');
  };

  return (
    <div className="flex-grow flex flex-col min-h-screen bg-background">
      
      {/* ===== TOAST THÔNG BÁO NỔI ===== */}
      {showToast && (
        <div 
          className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-3 rounded-xl shadow-lg transition-all duration-300 transform scale-100 ${
            toastType === 'success' ? 'bg-primary text-on-primary shadow-primary/20' : 'bg-error text-on-error shadow-error/20'
          }`}
        >
          <span className="material-symbols-outlined text-lg">
            {toastType === 'success' ? 'check_circle' : 'error'}
          </span>
          <span className="text-sm font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* ===== TOP NAVIGATION BAR ===== */}
      <header className="sticky top-0 z-30 h-16 w-full bg-surface border-b border-outline-variant/15 flex justify-between items-center px-gutter shrink-0">
        {/* Breadcrumbs điều hướng */}
        <div className="flex items-center gap-md">
          <div className="flex items-center gap-sm text-on-surface-variant font-label-lg text-label-lg">
            {viewingSlotsBuilding ? (
              <>
                <button 
                  onClick={() => setViewingSlotsBuilding(null)}
                  className="hover:text-primary transition-colors flex items-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-[18px]">domain</span>
                  <span>Buildings</span>
                </button>
                <span className="material-symbols-outlined text-[16px]">chevron_right</span>
                <h1 className="font-headline-md text-headline-md font-bold text-on-surface text-base">
                  {viewingSlotsBuilding.name}
                </h1>
              </>
            ) : (
              <>
                <span>Facility Management</span>
                <span className="material-symbols-outlined text-[16px]">chevron_right</span>
                <h1 className="font-headline-md text-headline-md font-bold text-on-surface text-base">
                  Building Configuration
                </h1>
              </>
            )}
          </div>
        </div>

        {/* Đồng hồ số và Profile */}
        <div className="flex items-center gap-lg">
          {/* Đồng hồ hiển thị thời gian thực */}
          <div className="hidden md:flex flex-col items-end border-r border-outline-variant/30 pr-lg">
            <span className="font-mono text-base font-bold text-on-surface tabular-nums leading-none">
              {currentTime}
            </span>
            <span className="text-[10px] text-on-surface-variant font-medium tracking-wide leading-none mt-1">
              {currentDate}
            </span>
          </div>

          <div className="flex items-center gap-sm text-on-surface-variant">
            <button className="p-2 hover:bg-surface-variant rounded-full transition-colors relative">
              <span className="material-symbols-outlined text-[20px]">notifications</span>
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-error rounded-full"></span>
            </button>
            <button className="p-2 hover:bg-surface-variant rounded-full transition-colors">
              <span className="material-symbols-outlined text-[20px]">help_outline</span>
            </button>
          </div>

          <div className="pl-md border-l border-outline-variant/30 flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <p className="text-xs font-semibold text-on-surface leading-tight">
                {user?.fullName || 'Alex Thompson'}
              </p>
              <p className="text-[9px] text-primary font-bold uppercase tracking-wider">
                Manager
              </p>
            </div>
            <div className="w-8 h-8 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center font-label-sm text-label-sm font-bold border border-primary/20 overflow-hidden">
              <img 
                alt="User Profile" 
                className="w-full h-full object-cover" 
                src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=256&auto=format&fit=crop"
              />
            </div>
          </div>
        </div>
      </header>

      {/* ===== KHÔNG GIAN LÀM VIỆC CHÍNH ===== */}
      <main className="flex-grow p-margin-mobile md:p-margin-desktop overflow-y-auto">
        <div className="max-w-max-width mx-auto flex flex-col gap-lg">
          
          {/* CONDITIONAL RENDERING: CHI TIẾT VỊ TRÍ ĐỖ XE CỦA TÒA NHÀ */}
          {viewingSlotsBuilding ? (
            <div className="flex flex-col gap-lg animate-in fade-in slide-in-from-bottom-2 duration-200">
              
              {/* Tiêu đề trang & Nút hành động */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-md">
                <div className="flex items-center gap-md">
                  <button 
                    onClick={() => setViewingSlotsBuilding(null)}
                    className="p-2 bg-white border border-outline-variant/20 text-on-surface-variant hover:text-primary hover:border-primary/20 rounded-lg transition-all shadow-sm flex items-center justify-center"
                    title="Back to buildings list"
                  >
                    <span className="material-symbols-outlined text-[18px]">arrow_back</span>
                  </button>
                  <div>
                    <h2 className="font-title-lg text-title-lg text-on-surface flex items-center gap-2">
                      Building: {viewingSlotsBuilding.name} 
                      <span className="text-on-surface-variant/50 font-normal font-code-md text-sm">({viewingSlotsBuilding.code})</span>
                    </h2>
                    <p className="font-body-md text-body-md text-on-surface-variant mt-1">
                      Manage and configure parking slots, levels, and hardware integration.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-sm">
                  <button className="bg-transparent border border-primary text-primary hover:bg-primary/5 font-label-lg text-label-lg py-2.5 px-4 rounded-lg flex items-center gap-2 transition-colors">
                    <span className="material-symbols-outlined text-[18px]">upload</span>
                    Import CSV
                  </button>
                  <button 
                    onClick={handleOpenAddSlot}
                    className="bg-primary hover:bg-primary/90 text-on-primary font-label-lg text-label-lg py-2.5 px-4 rounded-lg flex items-center gap-2 transition-all shadow-sm"
                  >
                    <span className="material-symbols-outlined text-[18px]">add</span>
                    Add Slot
                  </button>
                </div>
              </div>

              {/* Bento Grid Stats Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-md">
                {/* Tổng số vị trí đỗ */}
                <div className="bg-[#F4FBF3] border border-primary/10 rounded-xl p-lg flex flex-col justify-between relative overflow-hidden shadow-sm">
                  <div className="flex justify-between items-start z-10">
                    <span className="font-label-sm text-label-sm text-on-surface-variant/70 uppercase tracking-wider">Total Slots</span>
                    <span className="material-symbols-outlined text-primary/40 text-[20px]">grid_view</span>
                  </div>
                  <div className="mt-4 z-10">
                    <span className="font-display-lg text-display-lg font-bold text-on-surface text-2xl">
                      {slotsStats.total}
                    </span>
                  </div>
                  <div className="absolute -right-4 -bottom-4 opacity-[0.03] scale-150 pointer-events-none">
                    <span className="material-symbols-outlined text-[100px]" style={{ fontVariationSettings: "'FILL' 1" }}>grid_view</span>
                  </div>
                </div>

                {/* Vị trí đang trống */}
                <div className="bg-white border border-outline-variant/10 rounded-xl p-lg flex flex-col justify-between shadow-sm">
                  <div className="flex justify-between items-start">
                    <span className="font-label-sm text-label-sm text-on-surface-variant/70 uppercase tracking-wider">Available</span>
                    <div className="w-2 h-2 rounded-full bg-primary mt-1"></div>
                  </div>
                  <div className="mt-4 flex items-baseline gap-2">
                    <span className="font-display-lg text-display-lg font-bold text-primary text-2xl">
                      {slotsStats.available}
                    </span>
                    <span className="font-label-sm text-label-sm text-on-surface-variant/60">/ {slotsStats.total}</span>
                  </div>
                </div>

                {/* Vị trí đã có xe */}
                <div className="bg-white border border-outline-variant/10 rounded-xl p-lg flex flex-col justify-between shadow-sm">
                  <div className="flex justify-between items-start">
                    <span className="font-label-sm text-label-sm text-on-surface-variant/70 uppercase tracking-wider">Occupied</span>
                    <div className="w-2 h-2 rounded-full bg-inverse-surface mt-1"></div>
                  </div>
                  <div className="mt-4 flex items-baseline gap-2">
                    <span className="font-display-lg text-display-lg font-bold text-inverse-surface text-2xl">
                      {slotsStats.occupied}
                    </span>
                    <span className="font-label-sm text-label-sm text-on-surface-variant/60">
                      {slotsStats.total ? Math.round((slotsStats.occupied / slotsStats.total) * 100) : 0}% utilization
                    </span>
                  </div>
                </div>

                {/* Vị trí đang bảo trì */}
                <div className="bg-white border border-outline-variant/10 rounded-xl p-lg flex flex-col justify-between shadow-sm">
                  <div className="flex justify-between items-start">
                    <span className="font-label-sm text-label-sm text-on-surface-variant/70 uppercase tracking-wider">Maintenance</span>
                    <div className="w-2 h-2 rounded-full bg-error mt-1"></div>
                  </div>
                  <div className="mt-4 flex items-baseline gap-2">
                    <span className="font-display-lg text-display-lg font-bold text-on-surface text-2xl">
                      {slotsStats.maintenance}
                    </span>
                    {slotsStats.maintenance > 0 && (
                      <span className="font-label-sm text-label-sm text-error flex items-center gap-1">
                        <span className="material-symbols-outlined text-[14px]">warning</span> Needs Audit
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Data Table & Filters Container */}
              <div className="card-bg rounded-xl overflow-hidden flex flex-col shadow-sm bg-white">
                
                {/* Toolbar Bộ lọc */}
                <div className="px-lg py-md border-b border-primary/10 flex flex-col md:flex-row justify-between items-start md:items-center gap-md bg-white/50">
                  <div className="flex flex-wrap items-center gap-sm">
                    {/* Lọc theo Tầng */}
                    <div className="relative">
                      <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant/50 text-[18px]">layers</span>
                      <select 
                        value={filterFloor}
                        onChange={(e) => setFilterFloor(e.target.value)}
                        className="pl-9 pr-8 py-2 bg-background border border-outline-variant/25 rounded-lg font-body-md text-body-md focus:outline-none focus:border-primary appearance-none text-on-surface min-w-[140px]"
                      >
                        <option value="All Floors">All Floors</option>
                        {Array.from({ length: viewingSlotsBuilding.totalFloor }, (_, idx) => (
                          <option key={idx} value={`Floor ${idx + 1}`}>Floor {idx + 1}</option>
                        ))}
                      </select>
                      <span className="material-symbols-outlined absolute right-2.5 top-1/2 -translate-y-1/2 text-on-surface-variant text-[16px] pointer-events-none">expand_more</span>
                    </div>

                    {/* Lọc theo Loại */}
                    <div className="relative">
                      <select 
                        value={filterType}
                        onChange={(e) => setFilterType(e.target.value)}
                        className="px-4 pr-8 py-2 bg-background border border-outline-variant/25 rounded-lg font-body-md text-body-md focus:outline-none focus:border-primary appearance-none text-on-surface min-w-[140px]"
                      >
                        <option value="All Types">All Types</option>
                        <option value="Standard">Standard</option>
                        <option value="VIP">VIP</option>
                        <option value="EV Charging">EV Charging</option>
                      </select>
                      <span className="material-symbols-outlined absolute right-2.5 top-1/2 -translate-y-1/2 text-on-surface-variant text-[16px] pointer-events-none">expand_more</span>
                    </div>

                    {/* Lọc theo Trạng thái */}
                    <div className="relative">
                      <select 
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        className="px-4 pr-8 py-2 bg-background border border-outline-variant/25 rounded-lg font-body-md text-body-md focus:outline-none focus:border-primary appearance-none text-on-surface min-w-[140px]"
                      >
                        <option value="All Status">All Status</option>
                        <option value="Available">Available</option>
                        <option value="Occupied">Occupied</option>
                        <option value="Maintenance">Maintenance</option>
                      </select>
                      <span className="material-symbols-outlined absolute right-2.5 top-1/2 -translate-y-1/2 text-on-surface-variant text-[16px] pointer-events-none">expand_more</span>
                    </div>
                  </div>

                  {/* Thanh tìm kiếm ô đỗ */}
                  <div className="relative w-full md:w-64">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant/50 text-[18px]">search</span>
                    <input 
                      type="text"
                      placeholder="Search spaces, hardware ID..."
                      value={searchSlotQuery}
                      onChange={(e) => setSearchSlotQuery(e.target.value)}
                      className="w-full pl-9 pr-4 py-2 bg-background border border-outline-variant/25 rounded-lg text-body-md font-body-md focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all text-on-surface"
                    />
                  </div>
                </div>

                {/* Bảng dữ liệu Vị trí đỗ */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-white/30 text-on-surface-variant/60 font-label-sm text-label-sm uppercase tracking-wider table-row-border border-b border-outline-variant/10">
                        <th className="px-lg py-sm font-medium w-12 text-center">
                          <input type="checkbox" className="rounded border-outline-variant/30 text-primary focus:ring-primary" />
                        </th>
                        <th className="px-lg py-sm font-medium">Slot ID</th>
                        <th className="px-lg py-sm font-medium">Floor Level</th>
                        <th className="px-lg py-sm font-medium">Type</th>
                        <th className="px-lg py-sm font-medium">Status</th>
                        <th className="px-lg py-sm font-medium">Hardware ID</th>
                        <th className="px-lg py-sm font-medium text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-transparent font-body-md text-body-md text-on-surface divide-y divide-outline-variant/5">
                      {paginatedSlots.length > 0 ? (
                        paginatedSlots.map(slot => (
                          <tr key={slot.id} className="hover:bg-white/60 transition-colors group">
                            <td className="px-lg py-md text-center">
                              <input type="checkbox" className="rounded border-outline-variant/30 text-primary focus:ring-primary" />
                            </td>
                            <td className="px-lg py-md font-code-md text-code-md text-on-surface font-semibold">
                              {slot.code}
                            </td>
                            <td className="px-lg py-md text-on-surface-variant">
                              {slot.floor}
                            </td>
                            <td className="px-lg py-md text-on-surface">
                              <div className="flex items-center gap-2">
                                {slot.type === 'EV Charging' && (
                                  <span className="material-symbols-outlined text-[16px] text-primary">ev_station</span>
                                )}
                                {slot.type === 'VIP' && (
                                  <span className="material-symbols-outlined text-[16px] text-amber-700">stars</span>
                                )}
                                {slot.type === 'Standard' && (
                                  <span className="material-symbols-outlined text-[16px] text-on-surface-variant/60">directions_car</span>
                                )}
                                <span className={slot.type === 'VIP' ? 'text-amber-800 font-medium' : ''}>{slot.type}</span>
                              </div>
                            </td>
                            <td className="px-lg py-md">
                              {slot.status === 'Available' && (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/10 text-primary font-label-sm text-label-sm border border-primary/20">
                                  <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
                                  Available
                                </span>
                              )}
                              {slot.status === 'Occupied' && (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-inverse-surface text-white font-label-sm text-label-sm">
                                  <span className="w-1.5 h-1.5 rounded-full bg-white/70"></span>
                                  Occupied
                                </span>
                              )}
                              {slot.status === 'Maintenance' && (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-error-container text-on-error-container font-label-sm text-label-sm border border-error/20">
                                  <span className="w-1.5 h-1.5 rounded-full bg-error"></span>
                                  Maintenance
                                </span>
                              )}
                            </td>
                            <td className="px-lg py-md font-code-md text-code-md text-on-surface-variant/70">
                              {slot.hardwareId}
                            </td>
                            <td className="px-lg py-md text-right">
                              <div className="flex justify-end gap-xs opacity-0 group-hover:opacity-100 transition-opacity">
                                <button 
                                  onClick={(e) => handleOpenEditSlot(slot, e)}
                                  className="p-1.5 text-secondary hover:text-primary hover:bg-white rounded transition-colors"
                                  title="Edit Slot"
                                >
                                  <span className="material-symbols-outlined text-[18px]">edit</span>
                                </button>
                                <button 
                                  onClick={(e) => handleOpenDelSlot(slot, e)}
                                  className="p-1.5 text-secondary hover:text-error hover:bg-error/10 rounded transition-colors"
                                  title="Delete Slot"
                                >
                                  <span className="material-symbols-outlined text-[18px]">delete</span>
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={7} className="px-lg py-8 text-center text-on-surface-variant/60 font-medium">
                            No slots found matching selected filters.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Phân trang dữ liệu Vị trí đỗ */}
                <div className="px-lg py-md border-t border-primary/10 bg-white/50 flex justify-between items-center text-on-surface-variant">
                  <span className="font-body-md text-body-md text-xs">
                    Showing {filteredSlots.length > 0 ? (slotsPageIndex - 1) * slotsPageSize + 1 : 0} to {Math.min(slotsPageIndex * slotsPageSize, filteredSlots.length)} of {filteredSlots.length} slots
                  </span>
                  <div className="flex gap-1">
                    <button 
                      onClick={() => setSlotsPageIndex(p => Math.max(p - 1, 1))}
                      disabled={slotsPageIndex === 1}
                      className="px-3 py-1.5 border border-outline-variant/15 rounded-md bg-white text-secondary hover:bg-surface transition-colors disabled:opacity-50 disabled:pointer-events-none text-xs font-semibold"
                    >
                      Previous
                    </button>
                    {Array.from({ length: slotsTotalPages }, (_, i) => (
                      <button 
                        key={i}
                        onClick={() => setSlotsPageIndex(i + 1)}
                        className={`px-3 py-1 rounded-md text-xs font-bold ${slotsPageIndex === i + 1 ? 'bg-primary text-on-primary' : 'border border-outline-variant/15 bg-white text-secondary hover:bg-surface'}`}
                      >
                        {i + 1}
                      </button>
                    ))}
                    <button 
                      onClick={() => setSlotsPageIndex(p => Math.min(p + 1, slotsTotalPages))}
                      disabled={slotsPageIndex === slotsTotalPages}
                      className="px-3 py-1.5 border border-outline-variant/15 rounded-md bg-white text-secondary hover:bg-surface transition-colors disabled:opacity-50 disabled:pointer-events-none text-xs font-semibold"
                    >
                      Next
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            // CONDITIONAL RENDERING: DANH SÁCH TÒA NHÀ CHÍNH (SCREEN 3 STYLE)
            <div className="flex flex-col gap-lg animate-in fade-in duration-200">
              {/* Tiêu đề & Nút Thêm mới */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-md">
                <div>
                  <h2 className="font-title-lg text-title-lg text-on-surface">Managed Buildings</h2>
                  <p className="font-body-md text-body-md text-on-surface-variant mt-1">
                    Configure and monitor facility structures, parking levels, and spatial configurations.
                  </p>
                </div>
                <button 
                  onClick={handleOpenAddBld}
                  className="bg-primary hover:bg-primary/90 text-on-primary font-label-lg text-label-lg py-2.5 px-5 rounded-lg transition-colors flex items-center gap-sm shadow-sm"
                >
                  <span className="material-symbols-outlined text-[18px]">add_business</span>
                  Add New Building
                </button>
              </div>

              {/* Bảng Dữ liệu Tòa nhà */}
              <div className="card-bg rounded-xl overflow-hidden flex flex-col shadow-sm bg-white">
                
                {/* Utilities Bar */}
                <div className="px-lg py-md border-b border-primary/10 flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-md bg-white/50">
                  <div className="flex items-center gap-md">
                    <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider font-semibold">
                      {filteredBuildings.length} Buildings Found
                    </span>
                  </div>

                  <div className="flex items-center gap-sm">
                    {/* Ô Tìm kiếm tòa nhà */}
                    <div className="relative">
                      <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant/50 text-[18px]">search</span>
                      <input 
                        type="text"
                        placeholder="Search buildings..."
                        value={searchBldQuery}
                        onChange={(e) => setSearchBldQuery(e.target.value)}
                        className="w-full pl-9 pr-4 py-1.5 bg-background border border-outline-variant/25 rounded-lg text-xs font-body-md focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all text-on-surface"
                      />
                    </div>
                    
                    <button className="p-1.5 text-on-surface-variant hover:bg-white rounded-md transition-colors border border-transparent hover:border-outline-variant/15">
                      <span className="material-symbols-outlined text-[20px]">filter_list</span>
                    </button>
                    <button className="p-1.5 text-on-surface-variant hover:bg-white rounded-md transition-colors border border-transparent hover:border-outline-variant/15">
                      <span className="material-symbols-outlined text-[20px]">download</span>
                    </button>
                  </div>
                </div>

                {/* Thực tế Bảng dữ liệu */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-white/30 text-on-surface-variant/60 font-label-sm text-label-sm uppercase tracking-wider table-row-border border-b border-outline-variant/10">
                        <th className="px-lg py-sm font-medium">Code</th>
                        <th className="px-lg py-sm font-medium">Name</th>
                        <th className="px-lg py-sm font-medium">Address</th>
                        <th className="px-lg py-sm font-medium text-right">Total Floors</th>
                        <th className="px-lg py-sm font-medium text-center">Status</th>
                        <th className="px-lg py-sm font-medium text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-transparent font-body-md text-body-md text-on-surface divide-y divide-outline-variant/5">
                      {filteredBuildings.length > 0 ? (
                        filteredBuildings.map(bld => (
                          <tr 
                            key={bld.id} 
                            onClick={() => setViewingSlotsBuilding(bld)}
                            className="hover:bg-white/60 transition-colors table-row-border group cursor-pointer"
                          >
                            <td className="px-lg py-md font-code-md text-code-md text-secondary font-bold">
                              {bld.code}
                            </td>
                            <td className="px-lg py-md font-semibold text-on-surface">
                              {bld.name}
                            </td>
                            <td className="px-lg py-md text-on-surface-variant">
                              {bld.address || '—'}
                            </td>
                            <td className="px-lg py-md text-right font-code-md text-code-md font-medium">
                              {bld.totalFloor}
                            </td>
                            <td className="px-lg py-md text-center">
                              {bld.status === BuildingStatus.Available && (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/10 text-primary font-label-sm text-label-sm border border-primary/20">
                                  <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
                                  Available
                                </span>
                              )}
                              {bld.status === BuildingStatus.Occupied && (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-inverse-surface text-white font-label-sm text-label-sm">
                                  <span className="w-1.5 h-1.5 rounded-full bg-white/70"></span>
                                  Occupied
                                </span>
                              )}
                              {bld.status === BuildingStatus.Reserved && (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-secondary-container text-on-secondary-container font-label-sm text-label-sm border border-secondary/20">
                                  <span className="w-1.5 h-1.5 rounded-full bg-secondary"></span>
                                  Reserved
                                </span>
                              )}
                              {bld.status === BuildingStatus.OutOfService && (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-error-container text-on-error-container font-label-sm text-label-sm border border-error/20">
                                  <span className="w-1.5 h-1.5 rounded-full bg-error"></span>
                                  Out of Service
                                </span>
                              )}
                            </td>
                            <td className="px-lg py-md text-right" onClick={(e) => e.stopPropagation()}>
                              <div className="flex justify-end gap-xs opacity-0 group-hover:opacity-100 transition-opacity">
                                <button 
                                  onClick={() => setViewingSlotsBuilding(bld)}
                                  className="p-1.5 text-secondary hover:text-primary hover:bg-white rounded transition-colors" 
                                  title="View Slots"
                                >
                                  <span className="material-symbols-outlined text-[18px]">grid_view</span>
                                </button>
                                <button 
                                  onClick={(e) => handleOpenEditBld(bld, e)}
                                  className="p-1.5 text-secondary hover:text-primary hover:bg-white rounded transition-colors" 
                                  title="Edit Building"
                                >
                                  <span className="material-symbols-outlined text-[18px]">edit</span>
                                </button>
                                <button 
                                  onClick={(e) => handleOpenDelBld(bld, e)}
                                  className="p-1.5 text-secondary hover:text-error hover:bg-error/10 rounded transition-colors" 
                                  title="Delete Building"
                                >
                                  <span className="material-symbols-outlined text-[18px]">delete</span>
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={6} className="px-lg py-8 text-center text-on-surface-variant/60 font-medium">
                            No buildings found. Click &quot;Add New Building&quot; to configure one.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Footer Phân trang tòa nhà */}
                <div className="px-lg py-md border-t border-primary/10 bg-white/50 flex justify-between items-center text-on-surface-variant">
                  <span className="font-body-md text-body-md text-sm">
                    Showing 1 to {filteredBuildings.length} of {totalCount} entries
                  </span>
                  <div className="flex gap-1">
                    <button 
                      onClick={() => setPageIndex(p => Math.max(p - 1, 1))}
                      disabled={pageIndex === 1}
                      className="px-3 py-1.5 border border-outline-variant/10 rounded-md bg-white text-secondary hover:bg-surface transition-colors disabled:opacity-50 disabled:pointer-events-none text-xs font-semibold"
                    >
                      Previous
                    </button>
                    <button 
                      onClick={() => setPageIndex(p => Math.min(p + 1, totalPages))}
                      disabled={pageIndex === totalPages}
                      className="px-3 py-1.5 border border-outline-variant/10 rounded-md bg-white text-secondary hover:bg-surface transition-colors disabled:opacity-50 disabled:pointer-events-none text-xs font-semibold"
                    >
                      Next
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>
      </main>

      {/* ─── MODAL 1: THÊM MỚI TÒA NHÀ (ADD BUILDING) ─────────────────────────── */}
      {isAddBldOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-inverse-surface/40 backdrop-blur-[2px] transition-opacity"
            onClick={() => setIsAddBldOpen(false)}
          ></div>
          
          <div className="relative bg-surface rounded-xl shadow-2xl w-full max-w-md max-h-[90vh] flex flex-col overflow-hidden border border-outline-variant/30 transform transition-all">
            {/* Header */}
            <div className="px-lg py-5 border-b border-outline-variant/15 flex justify-between items-center bg-surface-container-lowest">
              <div>
                <h2 className="font-title-lg text-title-lg text-on-surface text-base">Add New Building</h2>
                <p className="font-body-md text-body-md text-on-surface-variant text-xs mt-1">Configure details for a new facility asset.</p>
              </div>
              <button 
                onClick={() => setIsAddBldOpen(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-surface-variant text-on-surface-variant transition-colors"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>

            {/* Form Body */}
            <div className="flex-1 overflow-y-auto p-lg space-y-4">
              <form onSubmit={handleAddBldSubmit} className="flex flex-col gap-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="font-label-sm text-label-sm text-on-surface-variant text-xs" htmlFor="addBldCode">
                      Building Code <span className="text-error">*</span>
                    </label>
                    <input 
                      type="text" 
                      id="addBldCode"
                      required
                      value={formBldCode}
                      onChange={(e) => setFormBldCode(e.target.value)}
                      placeholder="e.g. BLD-NT-001"
                      className="w-full bg-surface border border-outline-variant/30 rounded-lg px-3 py-2 text-sm text-on-surface placeholder:text-on-surface-variant/40 focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-all font-code-md"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="font-label-sm text-label-sm text-on-surface-variant text-xs" htmlFor="addBldName">
                      Building Name <span className="text-error">*</span>
                    </label>
                    <input 
                      type="text" 
                      id="addBldName"
                      required
                      value={formBldName}
                      onChange={(e) => setFormBldName(e.target.value)}
                      placeholder="e.g. North Tower"
                      className="w-full bg-surface border border-outline-variant/30 rounded-lg px-3 py-2 text-sm text-on-surface placeholder:text-on-surface-variant/40 focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-all font-medium"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="font-label-sm text-label-sm text-on-surface-variant text-xs" htmlFor="addBldAddress">
                    Physical Address
                  </label>
                  <textarea 
                    id="addBldAddress"
                    rows={2}
                    value={formBldAddress}
                    onChange={(e) => setFormBldAddress(e.target.value)}
                    placeholder="Enter complete street address..."
                    className="w-full bg-surface border border-outline-variant/30 rounded-lg px-3 py-2 text-sm text-on-surface placeholder:text-on-surface-variant/40 focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-all resize-none font-medium"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="font-label-sm text-label-sm text-on-surface-variant text-xs" htmlFor="addBldFloors">
                      Total Floors <span className="text-error">*</span>
                    </label>
                    <div className="relative">
                      <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant/50 text-base">layers</span>
                      <input 
                        type="number" 
                        id="addBldFloors"
                        required
                        min={1}
                        max={100}
                        value={formBldTotalFloor}
                        onChange={(e) => setFormBldTotalFloor(Math.max(1, Number(e.target.value)))}
                        className="w-full bg-surface border border-outline-variant/30 rounded-lg pl-9 pr-3 py-2 text-sm text-on-surface focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-all font-semibold"
                      />
                    </div>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="font-label-sm text-label-sm text-on-surface-variant text-xs" htmlFor="addBldStatus">
                      Operational Status
                    </label>
                    <div className="relative">
                      <select 
                        id="addBldStatus"
                        value={formBldStatus}
                        onChange={(e) => setFormBldStatus(Number(e.target.value))}
                        className="w-full appearance-none bg-surface border border-outline-variant/30 rounded-lg px-3 py-2 pr-8 text-sm text-on-surface focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-all cursor-pointer font-medium"
                      >
                        <option value={BuildingStatus.Available}>Available</option>
                        <option value={BuildingStatus.Occupied}>Occupied</option>
                        <option value={BuildingStatus.Reserved}>Reserved</option>
                        <option value={BuildingStatus.OutOfService}>Out of Service</option>
                      </select>
                      <span className="material-symbols-outlined absolute right-2.5 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none">expand_more</span>
                    </div>
                  </div>
                </div>

                <div className="bg-[#F4FBF3] p-3 rounded-lg border border-primary/10 flex items-start gap-2 mt-2">
                  <span className="material-symbols-outlined text-primary text-base mt-0.5">info</span>
                  <p className="font-label-sm text-label-sm text-on-surface-variant text-xs leading-relaxed">
                    Once created, you can assign Parking Zones and deploy Sensors to this building via the main dashboard.
                  </p>
                </div>

                {/* Footer Actions inside the scroll body to save height */}
                <div className="pt-4 border-t border-outline-variant/15 flex justify-end gap-3 items-center mt-2">
                  <button 
                    type="button"
                    onClick={() => setIsAddBldOpen(false)}
                    className="font-label-lg text-label-lg px-4 py-2 rounded-lg border border-primary/30 text-primary hover:bg-primary/5 transition-colors text-xs font-bold"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    disabled={isSaving}
                    className="font-label-lg text-label-lg px-5 py-2 rounded-lg bg-primary text-on-primary hover:bg-primary/90 shadow-sm transition-all text-xs font-bold flex items-center gap-1.5"
                  >
                    {isSaving ? 'Saving...' : (
                      <>
                        <span className="material-symbols-outlined text-sm">save</span>
                        Save Changes
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL 2: CHỈNH SỬA TÒA NHÀ (EDIT BUILDING) ────────────────────────── */}
      {isEditBldOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-inverse-surface/40 backdrop-blur-[2px] transition-opacity"
            onClick={() => setIsEditBldOpen(false)}
          ></div>
          
          <div className="relative bg-surface rounded-xl shadow-2xl w-full max-w-md max-h-[90vh] flex flex-col overflow-hidden border border-outline-variant/30 transform transition-all">
            {/* Header */}
            <div className="px-lg py-5 border-b border-outline-variant/15 flex justify-between items-center bg-surface-container-lowest">
              <div>
                <h2 className="font-title-lg text-title-lg text-on-surface text-base">Edit Building</h2>
                <p className="font-body-md text-body-md text-on-surface-variant text-xs mt-1">Configure details for facility asset: {editingBld?.code}.</p>
              </div>
              <button 
                onClick={() => setIsEditBldOpen(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-surface-variant text-on-surface-variant transition-colors"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>

            {/* Form Body */}
            <div className="flex-1 overflow-y-auto p-lg space-y-4">
              <form onSubmit={handleEditBldPreSubmit} className="flex flex-col gap-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="font-label-sm text-label-sm text-on-surface-variant text-xs" htmlFor="editBldCode">
                      Building Code <span className="text-error">*</span>
                    </label>
                    <input 
                      type="text" 
                      id="editBldCode"
                      required
                      value={formBldCode}
                      onChange={(e) => setFormBldCode(e.target.value)}
                      className="w-full bg-surface border border-outline-variant/30 rounded-lg px-3 py-2 text-sm text-on-surface focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-all font-code-md"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="font-label-sm text-label-sm text-on-surface-variant text-xs" htmlFor="editBldName">
                      Building Name <span className="text-error">*</span>
                    </label>
                    <input 
                      type="text" 
                      id="editBldName"
                      required
                      value={formBldName}
                      onChange={(e) => setFormBldName(e.target.value)}
                      className="w-full bg-surface border border-outline-variant/30 rounded-lg px-3 py-2 text-sm text-on-surface focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-all font-medium"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="font-label-sm text-label-sm text-on-surface-variant text-xs" htmlFor="editBldAddress">
                    Physical Address
                  </label>
                  <textarea 
                    id="editBldAddress"
                    rows={2}
                    value={formBldAddress}
                    onChange={(e) => setFormBldAddress(e.target.value)}
                    className="w-full bg-surface border border-outline-variant/30 rounded-lg px-3 py-2 text-sm text-on-surface focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-all resize-none font-medium"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="font-label-sm text-label-sm text-on-surface-variant text-xs" htmlFor="editBldFloors">
                      Total Floors <span className="text-error">*</span>
                    </label>
                    <div className="relative">
                      <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant/50 text-base">layers</span>
                      <input 
                        type="number" 
                        id="editBldFloors"
                        required
                        min={1}
                        max={100}
                        value={formBldTotalFloor}
                        onChange={(e) => setFormBldTotalFloor(Math.max(1, Number(e.target.value)))}
                        className="w-full bg-surface border border-outline-variant/30 rounded-lg pl-9 pr-3 py-2 text-sm text-on-surface focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-all font-semibold"
                      />
                    </div>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="font-label-sm text-label-sm text-on-surface-variant text-xs" htmlFor="editBldStatus">
                      Operational Status
                    </label>
                    <div className="relative">
                      <select 
                        id="editBldStatus"
                        value={formBldStatus}
                        onChange={(e) => setFormBldStatus(Number(e.target.value))}
                        className="w-full appearance-none bg-surface border border-outline-variant/30 rounded-lg px-3 py-2 pr-8 text-sm text-on-surface focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-all cursor-pointer font-medium"
                      >
                        <option value={BuildingStatus.Available}>Available</option>
                        <option value={BuildingStatus.Occupied}>Occupied</option>
                        <option value={BuildingStatus.Reserved}>Reserved</option>
                        <option value={BuildingStatus.OutOfService}>Out of Service</option>
                      </select>
                      <span className="material-symbols-outlined absolute right-2.5 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none">expand_more</span>
                    </div>
                  </div>
                </div>

                <div className="bg-[#F4FBF3] p-3 rounded-lg border border-primary/10 flex items-start gap-2 mt-2">
                  <span className="material-symbols-outlined text-primary text-base mt-0.5">info</span>
                  <p className="font-label-sm text-label-sm text-on-surface-variant text-xs leading-relaxed">
                    Modifying total floors may prompt an audit warning if you reduce floors containing registered spots.
                  </p>
                </div>

                {/* Footer Actions */}
                <div className="pt-4 border-t border-outline-variant/15 flex justify-end gap-3 items-center mt-2">
                  <button 
                    type="button"
                    onClick={() => setIsEditBldOpen(false)}
                    className="font-label-lg text-label-lg px-4 py-2 rounded-lg border border-primary/30 text-primary hover:bg-primary/5 transition-colors text-xs font-bold"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    disabled={isSaving}
                    className="font-label-lg text-label-lg px-5 py-2 rounded-lg bg-primary text-on-primary hover:bg-primary/90 shadow-sm transition-all text-xs font-bold flex items-center gap-1.5"
                  >
                    {isSaving ? 'Saving...' : (
                      <>
                        <span className="material-symbols-outlined text-sm">save</span>
                        Save Changes
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL 3: CẢNH BÁO GIẢM TẦNG (WARNING ALERT DIALOG) ────────────────── */}
      {isWarningBldOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
            onClick={() => setIsWarningBldOpen(false)}
          ></div>
          
          <div className="relative w-full max-w-sm bg-white rounded-xl border border-outline-variant/20 shadow-2xl p-6 z-10 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 text-amber-600 mb-4">
              <span className="material-symbols-outlined text-3xl">warning</span>
              <h4 className="font-bold text-on-surface text-base">Xác nhận giảm số tầng</h4>
            </div>
            
            <p className="text-xs text-on-surface-variant leading-relaxed mb-6 font-medium">
              Cảnh báo: Bạn đang giảm số tầng đỗ xe từ <span className="font-bold text-on-surface">{editingBld?.totalFloor}</span> xuống <span className="font-bold text-on-surface">{formBldTotalFloor}</span>. 
              Điều này có thể dẫn đến việc **xóa toàn bộ các cấu hình phân khu, bãi đỗ và tầng** từ tầng <span className="font-bold text-error">{formBldTotalFloor + 1}</span> trở lên. Bạn có chắc chắn muốn tiến hành?
            </p>

            <div className="flex gap-3 justify-end">
              <button 
                type="button"
                onClick={() => setIsWarningBldOpen(false)}
                className="px-4 py-2 text-xs font-bold text-on-surface bg-surface-variant hover:bg-outline-variant/20 rounded-lg transition-colors"
              >
                Hủy bỏ
              </button>
              <button 
                type="button"
                onClick={executeEditBldSave}
                className="px-4 py-2 text-xs font-bold text-white bg-error hover:bg-error/90 rounded-lg shadow-md shadow-error/10 transition-colors"
              >
                Đồng ý & Xóa
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL 4: XÁC NHẬN XÓA TÒA NHÀ (DELETE CONFIRM DIALOG) ────────────── */}
      {isDelBldOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-inverse-surface/40 backdrop-blur-[2px]"
            onClick={() => setIsDelBldOpen(false)}
          ></div>
          
          <div className="relative w-full max-w-sm bg-white rounded-xl border border-outline-variant/20 shadow-xl p-6 z-10 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 text-error mb-4">
              <span className="material-symbols-outlined text-3xl">delete_forever</span>
              <h4 className="font-bold text-on-surface text-base">Xóa tòa nhà</h4>
            </div>
            
            <p className="text-xs text-on-surface-variant leading-relaxed mb-6 font-medium">
              Bạn có chắc chắn muốn xóa tòa nhà <span className="font-bold text-on-surface">{deletingBld?.name}</span>? 
              Hành động này là vĩnh viễn và không thể hoàn tác. Mọi thông tin đỗ xe liên quan sẽ bị xóa sạch khỏi hệ thống.
            </p>

            <div className="flex gap-3 justify-end">
              <button 
                type="button"
                onClick={() => setIsDelBldOpen(false)}
                className="px-4 py-2 text-xs font-bold text-on-surface-variant bg-transparent hover:bg-surface-variant border border-outline-variant/30 rounded-lg transition-colors"
              >
                Hủy
              </button>
              <button 
                type="button"
                onClick={executeDeleteBld}
                className="px-4 py-2 text-xs font-bold text-white bg-error hover:bg-error/90 rounded-lg shadow-md shadow-error/10 transition-colors"
              >
                Xác nhận Xóa
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL 5: THÊM MỚI VỊ TRÍ ĐỖ (ADD SLOT) ───────────────────────────── */}
      {isAddSlotOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-inverse-surface/40 backdrop-blur-[2px] transition-opacity"
            onClick={() => setIsAddSlotOpen(false)}
          ></div>
          
          <div className="relative bg-surface rounded-xl shadow-2xl w-full max-w-md max-h-[90vh] flex flex-col overflow-hidden border border-outline-variant/30 transform transition-all animate-in fade-in duration-200">
            {/* Header */}
            <div className="px-lg py-5 border-b border-outline-variant/15 flex justify-between items-center bg-surface-container-lowest">
              <div>
                <h2 className="font-title-lg text-title-lg text-on-surface text-base">Add New Slot</h2>
                <p className="font-body-md text-body-md text-on-surface-variant text-xs mt-1">Configure layout details for a new parking bay.</p>
              </div>
              <button 
                onClick={() => setIsAddSlotOpen(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-surface-variant text-on-surface-variant transition-colors"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>

            {/* Form Body */}
            <div className="flex-1 overflow-y-auto p-lg space-y-4">
              <form onSubmit={handleAddSlotSubmit} className="flex flex-col gap-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="font-label-sm text-label-sm text-on-surface-variant text-xs" htmlFor="addSlotCode">
                      Slot ID / Code <span className="text-error">*</span>
                    </label>
                    <input 
                      type="text" 
                      id="addSlotCode"
                      required
                      value={formSlotCode}
                      onChange={(e) => setFormSlotCode(e.target.value)}
                      placeholder="e.g. TOWN-F1-050"
                      className="w-full bg-surface border border-outline-variant/30 rounded-lg px-3 py-2 text-sm text-on-surface focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-all font-code-md"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="font-label-sm text-label-sm text-on-surface-variant text-xs" htmlFor="addSlotFloor">
                      Floor Level <span className="text-error">*</span>
                    </label>
                    <div className="relative">
                      <select 
                        id="addSlotFloor"
                        value={formSlotFloor}
                        onChange={(e) => setFormSlotFloor(e.target.value)}
                        className="w-full appearance-none bg-surface border border-outline-variant/30 rounded-lg px-3 py-2 pr-8 text-sm text-on-surface focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-all cursor-pointer font-medium"
                      >
                        {viewingSlotsBuilding && Array.from({ length: viewingSlotsBuilding.totalFloor }, (_, idx) => (
                          <option key={idx} value={`Floor ${idx + 1}`}>Floor {idx + 1}</option>
                        ))}
                      </select>
                      <span className="material-symbols-outlined absolute right-2.5 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none">expand_more</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="font-label-sm text-label-sm text-on-surface-variant text-xs" htmlFor="addSlotType">
                      Slot Type
                    </label>
                    <div className="relative">
                      <select 
                        id="addSlotType"
                        value={formSlotType}
                        onChange={(e) => setFormSlotType(e.target.value as 'Standard' | 'VIP' | 'EV Charging')}
                        className="w-full appearance-none bg-surface border border-outline-variant/30 rounded-lg px-3 py-2 pr-8 text-sm text-on-surface focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-all cursor-pointer font-medium"
                      >
                        <option value="Standard">Standard</option>
                        <option value="VIP">VIP</option>
                        <option value="EV Charging">EV Charging</option>
                      </select>
                      <span className="material-symbols-outlined absolute right-2.5 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none">expand_more</span>
                    </div>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="font-label-sm text-label-sm text-on-surface-variant text-xs" htmlFor="addSlotStatus">
                      Status
                    </label>
                    <div className="relative">
                      <select 
                        id="addSlotStatus"
                        value={formSlotStatus}
                        onChange={(e) => setFormSlotStatus(e.target.value as 'Available' | 'Occupied' | 'Maintenance')}
                        className="w-full appearance-none bg-surface border border-outline-variant/30 rounded-lg px-3 py-2 pr-8 text-sm text-on-surface focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-all cursor-pointer font-medium"
                      >
                        <option value="Available">Available</option>
                        <option value="Occupied">Occupied</option>
                        <option value="Maintenance">Maintenance</option>
                      </select>
                      <span className="material-symbols-outlined absolute right-2.5 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none">expand_more</span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="font-label-sm text-label-sm text-on-surface-variant text-xs" htmlFor="addSlotHardware">
                    Hardware Sensor ID
                  </label>
                  <input 
                    type="text" 
                    id="addSlotHardware"
                    value={formSlotHardwareId}
                    onChange={(e) => setFormSlotHardwareId(e.target.value)}
                    placeholder="e.g. SNR-8822-B"
                    className="w-full bg-surface border border-outline-variant/30 rounded-lg px-3 py-2 text-sm text-on-surface focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-all font-code-md"
                  />
                </div>

                {/* Footer Actions */}
                <div className="pt-4 border-t border-outline-variant/15 flex justify-end gap-3 items-center mt-2">
                  <button 
                    type="button"
                    onClick={() => setIsAddSlotOpen(false)}
                    className="font-label-lg text-label-lg px-4 py-2 rounded-lg border border-primary/30 text-primary hover:bg-primary/5 transition-colors text-xs font-bold"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className="font-label-lg text-label-lg px-5 py-2 rounded-lg bg-primary text-on-primary hover:bg-primary/90 shadow-sm transition-all text-xs font-bold flex items-center gap-1.5"
                  >
                    <span className="material-symbols-outlined text-sm">save</span>
                    Add Slot
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL 6: CHỈNH SỬA VỊ TRÍ ĐỖ (EDIT SLOT) ───────────────────────────── */}
      {isEditSlotOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-inverse-surface/40 backdrop-blur-[2px] transition-opacity"
            onClick={() => setIsEditSlotOpen(false)}
          ></div>
          
          <div className="relative bg-surface rounded-xl shadow-2xl w-full max-w-md max-h-[90vh] flex flex-col overflow-hidden border border-outline-variant/30 transform transition-all animate-in fade-in duration-200">
            {/* Header */}
            <div className="px-lg py-5 border-b border-outline-variant/15 flex justify-between items-center bg-surface-container-lowest">
              <div>
                <h2 className="font-title-lg text-title-lg text-on-surface text-base">Edit Slot</h2>
                <p className="font-body-md text-body-md text-on-surface-variant text-xs mt-1">Configure layout details for: {editingSlot?.code}.</p>
              </div>
              <button 
                onClick={() => setIsEditSlotOpen(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-surface-variant text-on-surface-variant transition-colors"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>

            {/* Form Body */}
            <div className="flex-1 overflow-y-auto p-lg space-y-4">
              <form onSubmit={handleEditSlotSubmit} className="flex flex-col gap-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="font-label-sm text-label-sm text-on-surface-variant text-xs" htmlFor="editSlotCode">
                      Slot ID / Code <span className="text-error">*</span>
                    </label>
                    <input 
                      type="text" 
                      id="editSlotCode"
                      required
                      value={formSlotCode}
                      onChange={(e) => setFormSlotCode(e.target.value)}
                      className="w-full bg-surface border border-outline-variant/30 rounded-lg px-3 py-2 text-sm text-on-surface focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-all font-code-md"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="font-label-sm text-label-sm text-on-surface-variant text-xs" htmlFor="editSlotFloor">
                      Floor Level <span className="text-error">*</span>
                    </label>
                    <div className="relative">
                      <select 
                        id="editSlotFloor"
                        value={formSlotFloor}
                        onChange={(e) => setFormSlotFloor(e.target.value)}
                        className="w-full appearance-none bg-surface border border-outline-variant/30 rounded-lg px-3 py-2 pr-8 text-sm text-on-surface focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-all cursor-pointer font-medium"
                      >
                        {viewingSlotsBuilding && Array.from({ length: viewingSlotsBuilding.totalFloor }, (_, idx) => (
                          <option key={idx} value={`Floor ${idx + 1}`}>Floor {idx + 1}</option>
                        ))}
                      </select>
                      <span className="material-symbols-outlined absolute right-2.5 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none">expand_more</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="font-label-sm text-label-sm text-on-surface-variant text-xs" htmlFor="editSlotType">
                      Slot Type
                    </label>
                    <div className="relative">
                      <select 
                        id="editSlotType"
                        value={formSlotType}
                        onChange={(e) => setFormSlotType(e.target.value as 'Standard' | 'VIP' | 'EV Charging')}
                        className="w-full appearance-none bg-surface border border-outline-variant/30 rounded-lg px-3 py-2 pr-8 text-sm text-on-surface focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-all cursor-pointer font-medium"
                      >
                        <option value="Standard">Standard</option>
                        <option value="VIP">VIP</option>
                        <option value="EV Charging">EV Charging</option>
                      </select>
                      <span className="material-symbols-outlined absolute right-2.5 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none">expand_more</span>
                    </div>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="font-label-sm text-label-sm text-on-surface-variant text-xs" htmlFor="editSlotStatus">
                      Status
                    </label>
                    <div className="relative">
                      <select 
                        id="editSlotStatus"
                        value={formSlotStatus}
                        onChange={(e) => setFormSlotStatus(e.target.value as 'Available' | 'Occupied' | 'Maintenance')}
                        className="w-full appearance-none bg-surface border border-outline-variant/30 rounded-lg px-3 py-2 pr-8 text-sm text-on-surface focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-all cursor-pointer font-medium"
                      >
                        <option value="Available">Available</option>
                        <option value="Occupied">Occupied</option>
                        <option value="Maintenance">Maintenance</option>
                      </select>
                      <span className="material-symbols-outlined absolute right-2.5 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none">expand_more</span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="font-label-sm text-label-sm text-on-surface-variant text-xs" htmlFor="editSlotHardware">
                    Hardware Sensor ID
                  </label>
                  <input 
                    type="text" 
                    id="editSlotHardware"
                    value={formSlotHardwareId}
                    onChange={(e) => setFormSlotHardwareId(e.target.value)}
                    className="w-full bg-surface border border-outline-variant/30 rounded-lg px-3 py-2 text-sm text-on-surface focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-all font-code-md"
                  />
                </div>

                {/* Footer Actions */}
                <div className="pt-4 border-t border-outline-variant/15 flex justify-end gap-3 items-center mt-2">
                  <button 
                    type="button"
                    onClick={() => setIsEditSlotOpen(false)}
                    className="font-label-lg text-label-lg px-4 py-2 rounded-lg border border-primary/30 text-primary hover:bg-primary/5 transition-colors text-xs font-bold"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className="font-label-lg text-label-lg px-5 py-2 rounded-lg bg-primary text-on-primary hover:bg-primary/90 shadow-sm transition-all text-xs font-bold flex items-center gap-1.5"
                  >
                    <span className="material-symbols-outlined text-sm">save</span>
                    Save Changes
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL 7: XÁC NHẬN XÓA VỊ TRÍ ĐỖ (DELETE SLOT CONFIRM DIALOG) ──────── */}
      {isDelSlotOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-inverse-surface/40 backdrop-blur-[2px]"
            onClick={() => setIsDelSlotOpen(false)}
          ></div>
          
          <div className="relative w-full max-w-sm bg-white rounded-xl border border-outline-variant/20 shadow-xl p-6 z-10 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 text-error mb-4">
              <span className="material-symbols-outlined text-3xl">delete_forever</span>
              <h4 className="font-bold text-on-surface text-base">Xóa vị trí đỗ xe</h4>
            </div>
            
            <p className="text-xs text-on-surface-variant leading-relaxed mb-6 font-medium">
              Bạn có chắc chắn muốn xóa vị trí đỗ <span className="font-bold text-on-surface">{deletingSlot?.code}</span>? 
              Hành động này là vĩnh viễn và không thể hoàn tác.
            </p>

            <div className="flex gap-3 justify-end">
              <button 
                type="button"
                onClick={() => setIsDelSlotOpen(false)}
                className="px-4 py-2 text-xs font-bold text-on-surface-variant bg-transparent hover:bg-surface-variant border border-outline-variant/30 rounded-lg transition-colors"
              >
                Hủy
              </button>
              <button 
                type="button"
                onClick={executeDeleteSlot}
                className="px-4 py-2 text-xs font-bold text-white bg-error hover:bg-error/90 rounded-lg shadow-md shadow-error/10 transition-colors"
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
