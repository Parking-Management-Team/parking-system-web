'use client';

// Nhập các hook và thư viện cần thiết từ React
import React, { useEffect, useState, useMemo } from 'react';

// Nhập hook quản lý thông tin đăng nhập
import { useAuth } from '@/features/auth';
// Nhập API client để giao tiếp với backend
import { api } from '@/lib/api/client';
// Nhập các type định nghĩa của Building
import { Building, BuildingStatus, BaseResponse, PagedResult } from '@/lib/types/building.types';

// Định nghĩa cấu trúc dữ liệu cho Tầng (Floor) quản lý nội bộ
interface Floor {
  id: number;
  buildingId: number;
  floorNumber: number; // Ví dụ: 1, 2, 3, hoặc -1 cho Hầm B1
  name: string;        // Tên hiển thị (ví dụ: Basement 1, Floor 1)
  totalSlots: number;  // Sức chứa ô đỗ tối đa của tầng này
  status: 'Active' | 'Inactive';
}

// Định nghĩa cấu trúc dữ liệu cho Phân khu (Zone) quản lý nội bộ
interface Zone {
  id: number;
  floorId: number;
  name: string;        // Tên phân khu (ví dụ: Zone A, Zone B)
  vehicleType: 'Standard' | 'VIP' | 'EV Charging' | 'Motorbike'; // Loại xe cho phép đỗ
  slotCapacity: number; // Sức chứa ô đỗ của phân khu này
  status: 'Active' | 'Inactive';
}

export default function FacilityManagementPage() {
  // Lấy thông tin user hiện tại (Manager) từ Auth Context
  const { user } = useAuth();
  
  // State quản lý thời gian thực hiển thị trên Header
  const [currentTime, setCurrentTime] = useState('00:00:00');
  const [currentDate, setCurrentDate] = useState('Loading date...');

  // ─── STATE QUẢN LÝ DANH SÁCH TÒA NHÀ & PHÂN TRANG ─────────────────────────────
  const [buildings, setBuildings] = useState<Building[]>([
    {
      id: 1,
      code: 'BLD-TOWN',
      name: 'Urban Flow Tower',
      address: '100 Tech Plaza, Downtown',
      totalFloor: 5,
      status: BuildingStatus.Available
    },
    {
      id: 2,
      code: 'BLD-NORTH',
      name: 'Northside Complex',
      address: '450 Industrial Parkway',
      totalFloor: 3,
      status: BuildingStatus.Occupied
    },
    {
      id: 3,
      code: 'BLD-EAST',
      name: 'East Gate Hub',
      address: '22 Riverside Ave',
      totalFloor: 4,
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
  const [searchBldQuery, setSearchBldQuery] = useState(''); // Ô tìm kiếm tòa nhà

  // ─── STATE LỰA CHỌN PHÂN CẤP (BUILDING -> FLOOR -> ZONE) ──────────────────────
  const [selectedBuilding, setSelectedBuilding] = useState<Building | null>(null);
  const [selectedFloor, setSelectedFloor] = useState<Floor | null>(null);

  // ─── STATE QUẢN LÝ TẦNG (FLOORS) & PHÂN KHU (ZONES) GIẢ LẬP CỤC BỘ ─────────────────
  // Khởi tạo danh sách tầng giả lập mẫu
  const [floors, setFloors] = useState<Floor[]>([
    // Tòa nhà 1 (Urban Flow Tower)
    { id: 11, buildingId: 1, floorNumber: 1, name: 'Floor 1', totalSlots: 20, status: 'Active' },
    { id: 12, buildingId: 1, floorNumber: 2, name: 'Floor 2', totalSlots: 15, status: 'Active' },
    { id: 13, buildingId: 1, floorNumber: 3, name: 'Floor 3', totalSlots: 15, status: 'Active' },
    { id: 14, buildingId: 1, floorNumber: 4, name: 'Floor 4', totalSlots: 10, status: 'Active' },
    { id: 15, buildingId: 1, floorNumber: 5, name: 'Floor 5', totalSlots: 10, status: 'Active' },
    // Tòa nhà 2 (Northside Complex)
    { id: 21, buildingId: 2, floorNumber: 1, name: 'Floor 1', totalSlots: 12, status: 'Active' },
    { id: 22, buildingId: 2, floorNumber: 2, name: 'Floor 2', totalSlots: 12, status: 'Active' },
    { id: 23, buildingId: 2, floorNumber: 3, name: 'Floor 3', totalSlots: 10, status: 'Active' },
    // Tòa nhà 3 (East Gate Hub)
    { id: 31, buildingId: 3, floorNumber: 1, name: 'Floor 1', totalSlots: 16, status: 'Active' },
    { id: 32, buildingId: 3, floorNumber: 2, name: 'Floor 2', totalSlots: 16, status: 'Active' },
    { id: 33, buildingId: 3, floorNumber: 3, name: 'Floor 3', totalSlots: 12, status: 'Active' },
    { id: 34, buildingId: 3, floorNumber: 4, name: 'Floor 4', totalSlots: 10, status: 'Active' },
    // Tòa nhà 4 (West End Annex)
    { id: 41, buildingId: 4, floorNumber: 1, name: 'Floor 1', totalSlots: 8, status: 'Active' },
    { id: 42, buildingId: 4, floorNumber: 2, name: 'Floor 2', totalSlots: 8, status: 'Active' }
  ]);

  // Khởi tạo danh sách phân khu giả lập mẫu
  const [zones, setZones] = useState<Zone[]>([
    // Tầng 11 (Tòa 1 - Tầng 1)
    { id: 111, floorId: 11, name: 'Zone A', vehicleType: 'Standard', slotCapacity: 10, status: 'Active' },
    { id: 112, floorId: 11, name: 'Zone B', vehicleType: 'EV Charging', slotCapacity: 10, status: 'Active' },
    // Tầng 12 (Tòa 1 - Tầng 2)
    { id: 121, floorId: 12, name: 'Zone C', vehicleType: 'VIP', slotCapacity: 5, status: 'Active' },
    { id: 122, floorId: 12, name: 'Zone D', vehicleType: 'Standard', slotCapacity: 10, status: 'Active' },
    // Tầng 13 (Tòa 1 - Tầng 3)
    { id: 131, floorId: 13, name: 'Zone E', vehicleType: 'Motorbike', slotCapacity: 15, status: 'Active' },
    // Tầng 21 (Tòa 2 - Tầng 1)
    { id: 211, floorId: 21, name: 'Zone N1', vehicleType: 'Standard', slotCapacity: 12, status: 'Active' },
    // Tầng 31 (Tòa 3 - Tầng 1)
    { id: 311, floorId: 31, name: 'Zone E1', vehicleType: 'Standard', slotCapacity: 16, status: 'Active' },
    // Tầng 41 (Tòa 4 - Tầng 1)
    { id: 411, floorId: 41, name: 'Zone W1', vehicleType: 'Standard', slotCapacity: 8, status: 'Active' }
  ]);

  // ─── STATE QUẢN LÝ CÁC DIALOGS & OVERLAYS ─────────────────────────────────────
  // Trạng thái đóng/mở modals Tòa nhà (Building)
  const [isAddBldOpen, setIsAddBldOpen] = useState(false);
  const [isEditBldOpen, setIsEditBldOpen] = useState(false);
  const [isDelBldOpen, setIsDelBldOpen] = useState(false);
  const [isWarningBldOpen, setIsWarningBldOpen] = useState(false); // Cảnh báo giảm tầng

  // Trạng thái đóng/mở modals Tầng (Floor)
  const [isAddFloorOpen, setIsAddFloorOpen] = useState(false);
  const [isEditFloorOpen, setIsEditFloorOpen] = useState(false);
  const [isDelFloorOpen, setIsDelFloorOpen] = useState(false);

  // Trạng thái đóng/mở modals Phân khu (Zone)
  const [isAddZoneOpen, setIsAddZoneOpen] = useState(false);
  const [isEditZoneOpen, setIsEditZoneOpen] = useState(false);
  const [isDelZoneOpen, setIsDelZoneOpen] = useState(false);

  // ─── FORM STATES ────────────────────────────────────────────────────────────
  // Form Tòa nhà
  const [formBldCode, setFormBldCode] = useState('');
  const [formBldName, setFormBldName] = useState('');
  const [formBldAddress, setFormBldAddress] = useState('');
  const [formBldTotalFloor, setFormBldTotalFloor] = useState(1);
  const [formBldStatus, setFormBldStatus] = useState<BuildingStatus>(BuildingStatus.Available);
  const [editingBld, setEditingBld] = useState<Building | null>(null);
  const [deletingBld, setDeletingBld] = useState<Building | null>(null);

  // Form Tầng
  const [formFloorNumber, setFormFloorNumber] = useState(1);
  const [formFloorName, setFormFloorName] = useState('');
  const [formFloorTotalSlots, setFormFloorTotalSlots] = useState(10);
  const [formFloorStatus, setFormFloorStatus] = useState<'Active' | 'Inactive'>('Active');
  const [editingFloor, setEditingFloor] = useState<Floor | null>(null);
  const [deletingFloor, setDeletingFloor] = useState<Floor | null>(null);

  // Form Phân khu
  const [formZoneName, setFormZoneName] = useState('');
  const [formZoneVehicleType, setFormZoneVehicleType] = useState<'Standard' | 'VIP' | 'EV Charging' | 'Motorbike'>('Standard');
  const [formZoneSlotCapacity, setFormZoneSlotCapacity] = useState(5);
  const [formZoneStatus, setFormZoneStatus] = useState<'Active' | 'Inactive'>('Active');
  const [editingZone, setEditingZone] = useState<Zone | null>(null);
  const [deletingZone, setDeletingZone] = useState<Zone | null>(null);

  // Trạng thái đang tải dữ liệu / đang lưu
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

  // ─── TẢI DỮ LIỆU TÒA NHÀ TỪ API HOẶC FALLBACK ─────────────────────────────────
  const fetchBuildings = async (index: number) => {
    try {
      const res = await api.get<BaseResponse<PagedResult<Building>>>(
        `/Buildings/paged?pageIndex=${index}&pageSize=${pageSize}`
      );
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

  // Lọc tầng của tòa nhà đang được chọn
  const activeFloors = useMemo(() => {
    if (!selectedBuilding) return [];
    return floors.filter(f => f.buildingId === selectedBuilding.id)
                 .sort((a, b) => a.floorNumber - b.floorNumber);
  }, [selectedBuilding, floors]);

  // Lọc phân khu của tầng đang được chọn
  const activeZones = useMemo(() => {
    if (!selectedFloor) return [];
    return zones.filter(z => z.floorId === selectedFloor.id);
  }, [selectedFloor, zones]);

  // ─── THAO TÁC CRUD TÒA NHÀ (BUILDING) ─────────────────────────────────────────
  const handleOpenAddBld = () => {
    setFormBldCode('');
    setFormBldName('');
    setFormBldAddress('');
    setFormBldTotalFloor(3);
    setFormBldStatus(BuildingStatus.Available);
    setIsAddBldOpen(true);
  };

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

  const handleOpenDelBld = (bld: Building, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeletingBld(bld);
    setIsDelBldOpen(true);
  };

  // Submit thêm tòa nhà
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
        triggerToast('Building added successfully!');
        fetchBuildings(pageIndex);
      } else {
        triggerToast(res.message || 'Error from server', 'error');
      }
    } catch (error) {
      console.warn('Lỗi mạng, thêm tòa nhà cục bộ offline:', error);
      const newBldId = Date.now();
      const newBld: Building = {
        id: newBldId,
        code: formBldCode,
        name: formBldName,
        address: formBldAddress || null,
        totalFloor: formBldTotalFloor,
        status: BuildingStatus.Available
      };
      
      // Tạo trước các tầng mặc định cho tòa nhà mới
      const autoFloors: Floor[] = [];
      for (let i = 1; i <= formBldTotalFloor; i++) {
        autoFloors.push({
          id: Date.now() + i,
          buildingId: newBldId,
          floorNumber: i,
          name: `Floor ${i}`,
          totalSlots: 10,
          status: 'Active'
        });
      }

      setBuildings(prev => [...prev, newBld]);
      setFloors(prev => [...prev, ...autoFloors]);
      setTotalCount(prev => prev + 1);
      setIsAddBldOpen(false);
      triggerToast('Saved building locally (Offline mode)!');
    } finally {
      setIsSaving(false);
    }
  };

  // Submit chỉnh sửa tòa nhà (Kiểm tra giảm tầng trước khi thực thi)
  const handleEditBldPreSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBld) return;

    // Nếu người dùng giảm số tầng đỗ xe, hiển thị Modal cảnh báo
    if (formBldTotalFloor < editingBld.totalFloor) {
      setIsWarningBldOpen(true);
    } else {
      executeEditBldSave();
    }
  };

  // Thực thi cập nhật thông tin tòa nhà
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
        triggerToast('Building updated successfully!');
        fetchBuildings(pageIndex);
      } else {
        triggerToast(res.message || 'Error updating building configuration', 'error');
      }
    } catch (error) {
      console.warn('Lỗi mạng, sửa tòa nhà cục bộ offline:', error);

      // Cập nhật tòa nhà trong state cục bộ
      setBuildings(prev => prev.map(b => b.id === editingBld.id ? {
        ...b,
        code: formBldCode,
        name: formBldName,
        address: formBldAddress || null,
        totalFloor: formBldTotalFloor,
        status: formBldStatus
      } : b));

      // Đồng bộ lại selected building nếu đang chọn tòa nhà này
      if (selectedBuilding && selectedBuilding.id === editingBld.id) {
        setSelectedBuilding(prev => prev ? {
          ...prev,
          code: formBldCode,
          name: formBldName,
          address: formBldAddress || null,
          totalFloor: formBldTotalFloor,
          status: formBldStatus
        } : null);
      }

      // Nếu giảm tầng, lọc bỏ các tầng và phân khu ở tầng bị giảm
      if (formBldTotalFloor < editingBld.totalFloor) {
        const remainingFloors = floors.filter(f => {
          if (f.buildingId !== editingBld.id) return true;
          return f.floorNumber <= formBldTotalFloor;
        });
        const deletedFloorIds = floors.filter(f => f.buildingId === editingBld.id && f.floorNumber > formBldTotalFloor)
                                      .map(f => f.id);
        
        setFloors(remainingFloors);
        setZones(prev => prev.filter(z => !deletedFloorIds.includes(z.floorId)));

        if (selectedFloor && deletedFloorIds.includes(selectedFloor.id)) {
          setSelectedFloor(null);
        }
      } 
      // Nếu tăng tầng, tự động tạo thêm tầng trống
      else if (formBldTotalFloor > editingBld.totalFloor) {
        const addedFloorsCount = formBldTotalFloor - editingBld.totalFloor;
        const autoFloors: Floor[] = [];
        for (let i = 1; i <= addedFloorsCount; i++) {
          const newFloorNum = editingBld.totalFloor + i;
          autoFloors.push({
            id: Date.now() + i,
            buildingId: editingBld.id,
            floorNumber: newFloorNum,
            name: `Floor ${newFloorNum}`,
            totalSlots: 10,
            status: 'Active'
          });
        }
        setFloors(prev => [...prev, ...autoFloors]);
      }

      setIsEditBldOpen(false);
      setEditingBld(null);
      triggerToast('Building configuration updated locally!');
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
        if (selectedBuilding?.id === deletingBld.id) {
          setSelectedBuilding(null);
          setSelectedFloor(null);
        }
        triggerToast('Building deleted successfully!');
        fetchBuildings(pageIndex);
      } else {
        triggerToast(res.message || 'Error deleting building from server', 'error');
      }
    } catch (error) {
      console.warn('Lỗi mạng, xóa tòa nhà cục bộ offline:', error);

      // Xóa tòa nhà khỏi state
      setBuildings(prev => prev.filter(b => b.id !== deletingBld.id));
      setTotalCount(prev => prev - 1);

      // Xóa cascaded các tầng và phân khu tương ứng
      const buildingFloors = floors.filter(f => f.buildingId === deletingBld.id);
      const buildingFloorIds = buildingFloors.map(f => f.id);

      setFloors(prev => prev.filter(f => f.buildingId !== deletingBld.id));
      setZones(prev => prev.filter(z => !buildingFloorIds.includes(z.floorId)));

      if (selectedBuilding?.id === deletingBld.id) {
        setSelectedBuilding(null);
        setSelectedFloor(null);
      }

      setIsDelBldOpen(false);
      setDeletingBld(null);
      triggerToast('Building deleted locally!');
    } finally {
      setIsSaving(false);
    }
  };

  // ─── THAO TÁC CRUD CHO TẦNG (FLOORS) ─────────────────────────────────────────
  const handleOpenAddFloor = () => {
    if (!selectedBuilding) return;
    // Tự động tính số tầng tiếp theo dựa trên cấu trúc hiện tại
    const maxFloorNum = activeFloors.length > 0 
      ? Math.max(...activeFloors.map(f => f.floorNumber)) 
      : 0;
    
    setFormFloorNumber(maxFloorNum + 1);
    setFormFloorName(`Floor ${maxFloorNum + 1}`);
    setFormFloorTotalSlots(10);
    setFormFloorStatus('Active');
    setIsAddFloorOpen(true);
  };

  const handleOpenEditFloor = (floor: Floor, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingFloor(floor);
    setFormFloorNumber(floor.floorNumber);
    setFormFloorName(floor.name);
    setFormFloorTotalSlots(floor.totalSlots);
    setFormFloorStatus(floor.status);
    setIsEditFloorOpen(true);
  };

  const handleOpenDelFloor = (floor: Floor, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeletingFloor(floor);
    setIsDelFloorOpen(true);
  };

  const handleAddFloorSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBuilding) return;

    // Kiểm tra số tầng trùng lặp
    const floorExists = activeFloors.some(f => f.floorNumber === formFloorNumber);
    if (floorExists) {
      triggerToast(`Floor number ${formFloorNumber} already exists!`, 'error');
      return;
    }

    const newFloor: Floor = {
      id: Date.now(),
      buildingId: selectedBuilding.id,
      floorNumber: formFloorNumber,
      name: formFloorName,
      totalSlots: formFloorTotalSlots,
      status: formFloorStatus
    };

    setFloors(prev => [...prev, newFloor]);
    setIsAddFloorOpen(false);
    triggerToast('Floor added successfully!');
  };

  const handleEditFloorSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingFloor || !selectedBuilding) return;

    // Kiểm tra trùng lặp tầng ngoại trừ tầng đang sửa
    const floorExists = activeFloors.some(f => f.floorNumber === formFloorNumber && f.id !== editingFloor.id);
    if (floorExists) {
      triggerToast(`Floor number ${formFloorNumber} already exists in this building!`, 'error');
      return;
    }

    setFloors(prev => prev.map(f => f.id === editingFloor.id ? {
      ...f,
      floorNumber: formFloorNumber,
      name: formFloorName,
      totalSlots: formFloorTotalSlots,
      status: formFloorStatus
    } : f));

    // Cập nhật selectedFloor nếu đang được chọn
    if (selectedFloor && selectedFloor.id === editingFloor.id) {
      setSelectedFloor(prev => prev ? {
        ...prev,
        floorNumber: formFloorNumber,
        name: formFloorName,
        totalSlots: formFloorTotalSlots,
        status: formFloorStatus
      } : null);
    }

    setIsEditFloorOpen(false);
    setEditingFloor(null);
    triggerToast('Floor structure updated!');
  };

  const executeDeleteFloor = () => {
    if (!deletingFloor) return;

    setFloors(prev => prev.filter(f => f.id !== deletingFloor.id));
    // Cascade xóa các phân khu thuộc tầng này
    setZones(prev => prev.filter(z => z.floorId !== deletingFloor.id));

    if (selectedFloor?.id === deletingFloor.id) {
      setSelectedFloor(null);
    }

    setIsDelFloorOpen(false);
    setDeletingFloor(null);
    triggerToast('Floor deleted successfully!');
  };

  // ─── THAO TÁC CRUD CHO PHÂN KHU (ZONES) ──────────────────────────────────────
  const handleOpenAddZone = () => {
    if (!selectedFloor) return;
    setFormZoneName('');
    setFormZoneVehicleType('Standard');
    setFormZoneSlotCapacity(5);
    setFormZoneStatus('Active');
    setIsAddZoneOpen(true);
  };

  const handleOpenEditZone = (zone: Zone, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingZone(zone);
    setFormZoneName(zone.name);
    setFormZoneVehicleType(zone.vehicleType);
    setFormZoneSlotCapacity(zone.slotCapacity);
    setFormZoneStatus(zone.status);
    setIsEditZoneOpen(true);
  };

  const handleOpenDelZone = (zone: Zone, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeletingZone(zone);
    setIsDelZoneOpen(true);
  };

  const handleAddZoneSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFloor) return;

    // Kiểm tra trùng tên phân khu trong cùng tầng
    const zoneExists = activeZones.some(z => z.name.toLowerCase() === formZoneName.toLowerCase());
    if (zoneExists) {
      triggerToast(`Zone named "${formZoneName}" already exists on this floor!`, 'error');
      return;
    }

    // Kiểm tra tổng sức chứa các phân khu không vượt quá sức chứa tối đa của tầng
    const currentTotalCapacity = activeZones.reduce((sum, z) => sum + z.slotCapacity, 0);
    if (currentTotalCapacity + formZoneSlotCapacity > selectedFloor.totalSlots) {
      triggerToast(`Failed to add! Total zones capacity (${currentTotalCapacity + formZoneSlotCapacity}) exceeds floor total slot limit (${selectedFloor.totalSlots}).`, 'error');
      return;
    }

    const newZone: Zone = {
      id: Date.now(),
      floorId: selectedFloor.id,
      name: formZoneName,
      vehicleType: formZoneVehicleType,
      slotCapacity: formZoneSlotCapacity,
      status: formZoneStatus
    };

    setZones(prev => [...prev, newZone]);
    setIsAddZoneOpen(false);
    triggerToast('Zone added successfully!');
  };

  const handleEditZoneSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingZone || !selectedFloor) return;

    // Kiểm tra trùng tên phân khu
    const zoneExists = activeZones.some(z => z.name.toLowerCase() === formZoneName.toLowerCase() && z.id !== editingZone.id);
    if (zoneExists) {
      triggerToast(`Zone named "${formZoneName}" already exists on this floor!`, 'error');
      return;
    }

    // Kiểm tra tổng sức chứa các phân khu không vượt quá sức chứa tối đa của tầng
    const currentTotalCapacity = activeZones.reduce((sum, z) => z.id === editingZone.id ? sum : sum + z.slotCapacity, 0);
    if (currentTotalCapacity + formZoneSlotCapacity > selectedFloor.totalSlots) {
      triggerToast(`Failed to update! Total zones capacity (${currentTotalCapacity + formZoneSlotCapacity}) exceeds floor total slot limit (${selectedFloor.totalSlots}).`, 'error');
      return;
    }

    setZones(prev => prev.map(z => z.id === editingZone.id ? {
      ...z,
      name: formZoneName,
      vehicleType: formZoneVehicleType,
      slotCapacity: formZoneSlotCapacity,
      status: formZoneStatus
    } : z));

    setIsEditZoneOpen(false);
    setEditingZone(null);
    triggerToast('Zone configuration updated!');
  };

  const executeDeleteZone = () => {
    if (!deletingZone) return;

    setZones(prev => prev.filter(z => z.id !== deletingZone.id));
    setIsDelZoneOpen(false);
    setDeletingZone(null);
    triggerToast('Zone deleted successfully!');
  };

  return (
    <div className="flex-grow flex flex-col min-h-screen bg-[#f9f9ff]">
      
      {/* ===== TOAST THÔNG BÁO CHUNG ===== */}
      {showToast && (
        <div 
          className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-3 rounded-xl shadow-lg transition-all duration-300 transform scale-100 ${
            toastType === 'success' ? 'bg-[#006d43] text-white shadow-[#006d43]/20' : 'bg-red-600 text-white shadow-red-600/20'
          }`}
        >
          <span className="material-symbols-outlined text-lg">
            {toastType === 'success' ? 'check_circle' : 'error'}
          </span>
          <span className="text-sm font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* ===== HEADER TRANG CHUNG ===== */}
      <header className="sticky top-0 z-30 h-16 w-full bg-white border-b border-slate-200/50 flex justify-between items-center px-6 shrink-0">
        <div className="flex items-center gap-md">
          <div className="flex items-center gap-sm text-[#3d4a41] font-medium text-sm">
            <span>Facilities Configuration</span>
            <span className="material-symbols-outlined text-[16px] text-slate-400">chevron_right</span>
            <span className="text-[#111c2d] font-bold">Building Hierarchy</span>
          </div>
        </div>

        {/* Đồng hồ số và Hồ sơ người dùng */}
        <div className="flex items-center gap-6">
          <div className="hidden md:flex flex-col items-end border-r border-slate-200 pr-6">
            <span className="font-mono text-sm font-bold text-[#111c2d] tabular-nums leading-none">
              {currentTime}
            </span>
            <span className="text-[10px] text-slate-400 font-medium tracking-wide mt-1">
              {currentDate}
            </span>
          </div>

          <div className="flex items-center gap-2 text-[#3d4a41]">
            <button className="p-2 hover:bg-slate-100 rounded-full transition-colors relative">
              <span className="material-symbols-outlined text-[20px]">notifications</span>
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-red-600 rounded-full"></span>
            </button>
          </div>

          <div className="pl-4 border-l border-slate-200 flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <p className="text-xs font-semibold text-[#111c2d] leading-tight">
                {user?.fullName || 'Alex Thompson'}
              </p>
              <p className="text-[9px] text-[#006d43] font-bold uppercase tracking-wider">
                Manager
              </p>
            </div>
            <div className="w-8 h-8 rounded-full bg-[#F4FBF3] text-[#006d43] flex items-center justify-center text-xs font-bold border border-[#006d43]/20 overflow-hidden">
              <img 
                alt="User Profile" 
                className="w-full h-full object-cover" 
                src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=256&auto=format&fit=crop"
              />
            </div>
          </div>
        </div>
      </header>

      {/* ===== KHÔNG GIAN LÀM VIỆC CHÍNH (3 CỘT SONG SONG) ===== */}
      <main className="flex-grow p-6 overflow-y-auto">
        <div className="max-w-[1600px] mx-auto flex flex-col gap-6">
          
          {/* PHẦN GIỚI THIỆU TRANG */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-2xl font-bold text-[#111c2d]">Facility Structure & Zoning</h1>
              <p className="text-sm text-slate-500 mt-1">
                Configure the organizational hierarchy: Buildings, Floors, and Parking Zones on a unified interactive workspace.
              </p>
            </div>
            {/* Redirect button to Slots Allocation */}
            <a 
              href="/dashboard/manager/allocate-slot" 
              className="inline-flex items-center gap-2 px-4 py-2 border border-[#006d43] text-[#006d43] hover:bg-[#F4FBF3] font-semibold text-xs rounded-xl transition-all shadow-sm"
            >
              <span className="material-symbols-outlined text-[16px]">grid_view</span>
              Go to Slots Allocation
            </a>
          </div>

          {/* BỐ CỤC CHIA 3 CỘT CHÍNH */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* ─── CỘT 1: DANH SÁCH TÒA NHÀ (SPANS 4 COLS) ────────────────────── */}
            <section className="lg:col-span-4 bg-white border border-[#006d43]/10 rounded-2xl shadow-sm flex flex-col overflow-hidden">
              {/* Header Cột */}
              <div className="p-4 border-b border-slate-100 bg-[#F4FBF3]/35 flex justify-between items-center">
                <div className="flex items-center gap-2 text-[#111c2d]">
                  <span className="material-symbols-outlined text-[20px] text-[#006d43]">domain</span>
                  <h2 className="font-bold text-sm">1. Buildings</h2>
                </div>
                <button 
                  onClick={handleOpenAddBld}
                  className="bg-[#006d43] hover:bg-[#006d43]/90 text-white text-xs font-semibold py-1.5 px-3 rounded-lg flex items-center gap-1 shadow-sm transition-colors"
                >
                  <span className="material-symbols-outlined text-[14px]">add</span>
                  Add
                </button>
              </div>

              {/* Ô Tìm kiếm tòa nhà */}
              <div className="p-3 border-b border-slate-100 bg-white">
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">search</span>
                  <input 
                    type="text"
                    placeholder="Search buildings..."
                    value={searchBldQuery}
                    onChange={(e) => setSearchBldQuery(e.target.value)}
                    className="w-full pl-9 pr-4 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-[#006d43] focus:ring-1 focus:ring-[#006d43]/10 transition-all text-[#111c2d]"
                  />
                </div>
              </div>

              {/* Danh sách Tòa nhà */}
              <div className="divide-y divide-slate-100 overflow-y-auto max-h-[500px]">
                {filteredBuildings.length > 0 ? (
                  filteredBuildings.map(bld => {
                    const isSelected = selectedBuilding?.id === bld.id;
                    return (
                      <div 
                        key={bld.id}
                        onClick={() => {
                          setSelectedBuilding(bld);
                          setSelectedFloor(null); // Reset tầng đã chọn khi đổi tòa nhà
                        }}
                        className={`p-4 transition-all cursor-pointer flex justify-between items-start group ${
                          isSelected 
                            ? 'bg-[#F4FBF3] border-l-4 border-[#006d43]' 
                            : 'hover:bg-slate-50 bg-white'
                        }`}
                      >
                        <div className="flex-1 min-w-0 pr-3">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-[#3d4a41]">
                              {bld.code}
                            </span>
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                              bld.status === BuildingStatus.Available ? 'bg-[#006d43]/10 text-[#006d43]' :
                              bld.status === BuildingStatus.Occupied ? 'bg-amber-100 text-amber-800' :
                              bld.status === BuildingStatus.Reserved ? 'bg-blue-100 text-blue-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {bld.status === BuildingStatus.Available ? 'Available' :
                               bld.status === BuildingStatus.Occupied ? 'Occupied' :
                               bld.status === BuildingStatus.Reserved ? 'Reserved' :
                               'Maintenance'}
                            </span>
                          </div>
                          <h3 className="font-bold text-xs text-[#111c2d] truncate">{bld.name}</h3>
                          <p className="text-[11px] text-slate-400 mt-0.5 truncate">{bld.address || 'No address registered'}</p>
                          <p className="text-[11px] text-[#006d43] font-semibold mt-1 flex items-center gap-1">
                            <span className="material-symbols-outlined text-[13px]">layers</span>
                            {bld.totalFloor} parking levels
                          </p>
                        </div>

                        {/* Các nút CRUD tác vụ */}
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button 
                            onClick={(e) => handleOpenEditBld(bld, e)}
                            className="p-1 text-slate-400 hover:text-[#006d43] hover:bg-white border border-transparent hover:border-slate-200 rounded transition-all"
                            title="Edit building details"
                          >
                            <span className="material-symbols-outlined text-[16px]">edit</span>
                          </button>
                          <button 
                            onClick={(e) => handleOpenDelBld(bld, e)}
                            className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 border border-transparent hover:border-red-100 rounded transition-all"
                            title="Delete building"
                          >
                            <span className="material-symbols-outlined text-[16px]">delete</span>
                          </button>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="p-8 text-center text-slate-400 text-xs font-medium">
                    No buildings match search query.
                  </div>
                )}
              </div>

              {/* Footer Phân trang tòa nhà */}
              <div className="p-3 border-t border-slate-100 bg-[#F4FBF3]/15 flex justify-between items-center text-slate-400">
                <span className="text-[10px] font-medium">
                  Page {pageIndex} of {totalPages} ({totalCount} total)
                </span>
                <div className="flex gap-1">
                  <button 
                    disabled={pageIndex === 1}
                    onClick={() => setPageIndex(p => Math.max(p - 1, 1))}
                    className="p-1 border border-slate-200 rounded bg-white text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-40 disabled:pointer-events-none"
                  >
                    <span className="material-symbols-outlined text-[14px] block">chevron_left</span>
                  </button>
                  <button 
                    disabled={pageIndex === totalPages}
                    onClick={() => setPageIndex(p => Math.min(p + 1, totalPages))}
                    className="p-1 border border-slate-200 rounded bg-white text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-40 disabled:pointer-events-none"
                  >
                    <span className="material-symbols-outlined text-[14px] block">chevron_right</span>
                  </button>
                </div>
              </div>
            </section>

            {/* ─── CỘT 2: CẤU HÌNH TẦNG (FLOOR CONFIGURATION) (SPANS 4 COLS) ────── */}
            <section className="lg:col-span-4 bg-white border border-[#006d43]/10 rounded-2xl shadow-sm flex flex-col overflow-hidden min-h-[400px]">
              {/* Header Cột */}
              <div className="p-4 border-b border-slate-100 bg-[#F4FBF3]/35 flex justify-between items-center">
                <div className="flex items-center gap-2 text-[#111c2d]">
                  <span className="material-symbols-outlined text-[20px] text-[#006d43]">layers</span>
                  <h2 className="font-bold text-sm">2. Floor Structure</h2>
                </div>
                {selectedBuilding && (
                  <button 
                    onClick={handleOpenAddFloor}
                    className="bg-[#006d43] hover:bg-[#006d43]/90 text-white text-xs font-semibold py-1.5 px-3 rounded-lg flex items-center gap-1 shadow-sm transition-colors"
                  >
                    <span className="material-symbols-outlined text-[14px]">add</span>
                    Add Floor
                  </button>
                )}
              </div>

              {/* Danh sách các Tầng của Tòa nhà đã chọn */}
              {selectedBuilding ? (
                <div className="divide-y divide-slate-100 overflow-y-auto max-h-[570px] flex-grow">
                  <div className="p-3 bg-slate-50 text-[11px] text-[#3d4a41] font-semibold">
                    Building Selected: <span className="text-[#006d43]">{selectedBuilding.name}</span>
                  </div>
                  {activeFloors.length > 0 ? (
                    activeFloors.map(floor => {
                      const isSelected = selectedFloor?.id === floor.id;
                      return (
                        <div 
                          key={floor.id}
                          onClick={() => setSelectedFloor(floor)}
                          className={`p-4 transition-all cursor-pointer flex justify-between items-center group ${
                            isSelected 
                              ? 'bg-[#F4FBF3] border-l-4 border-[#006d43]' 
                              : 'hover:bg-slate-50 bg-white'
                          }`}
                        >
                          <div className="flex-1 min-w-0 pr-3">
                            <h3 className="font-bold text-xs text-[#111c2d] flex items-center gap-2">
                              {floor.name}
                              <span className={`w-1.5 h-1.5 rounded-full ${floor.status === 'Active' ? 'bg-[#006d43]' : 'bg-red-500'}`} />
                            </h3>
                            <p className="text-[11px] text-slate-400 mt-1">Floor index: {floor.floorNumber}</p>
                            <p className="text-[11px] text-[#3d4a41]/75 font-medium mt-0.5">
                              Max capacity: {floor.totalSlots} slots
                            </p>
                          </div>

                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button 
                              onClick={(e) => handleOpenEditFloor(floor, e)}
                              className="p-1 text-slate-400 hover:text-[#006d43] hover:bg-white border border-transparent hover:border-slate-200 rounded transition-all"
                              title="Edit floor"
                            >
                              <span className="material-symbols-outlined text-[16px]">edit</span>
                            </button>
                            <button 
                              onClick={(e) => handleOpenDelFloor(floor, e)}
                              className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 border border-transparent hover:border-red-100 rounded transition-all"
                              title="Delete floor"
                            >
                              <span className="material-symbols-outlined text-[16px]">delete</span>
                            </button>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="p-8 text-center text-slate-400 text-xs font-medium">
                      No floors configured for this building. Click Add Floor above.
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex-grow flex flex-col items-center justify-center p-8 text-center text-slate-400 text-xs">
                  <span className="material-symbols-outlined text-4xl text-slate-300 mb-2">apartment</span>
                  Please select a building from the left panel to configure its floors.
                </div>
              )}
            </section>

            {/* ─── CỘT 3: CẤU HÌNH PHÂN KHU (ZONING MANAGEMENT) (SPANS 4 COLS) ─── */}
            <section className="lg:col-span-4 bg-white border border-[#006d43]/10 rounded-2xl shadow-sm flex flex-col overflow-hidden min-h-[400px]">
              {/* Header Cột */}
              <div className="p-4 border-b border-slate-100 bg-[#F4FBF3]/35 flex justify-between items-center">
                <div className="flex items-center gap-2 text-[#111c2d]">
                  <span className="material-symbols-outlined text-[20px] text-[#006d43]">grid_view</span>
                  <h2 className="font-bold text-sm">3. Zones & Vehicle Specs</h2>
                </div>
                {selectedFloor && (
                  <button 
                    onClick={handleOpenAddZone}
                    className="bg-[#006d43] hover:bg-[#006d43]/90 text-white text-xs font-semibold py-1.5 px-3 rounded-lg flex items-center gap-1 shadow-sm transition-colors"
                  >
                    <span className="material-symbols-outlined text-[14px]">add</span>
                    Add Zone
                  </button>
                )}
              </div>

              {/* Danh sách Phân khu thuộc Tầng đã chọn */}
              {selectedFloor ? (
                <div className="divide-y divide-slate-100 overflow-y-auto max-h-[570px] flex-grow">
                  <div className="p-3 bg-slate-50 text-[11px] text-[#3d4a41] font-semibold">
                    Floor Selected: <span className="text-[#006d43]">{selectedFloor.name}</span> (Max {selectedFloor.totalSlots} slots)
                  </div>
                  {activeZones.length > 0 ? (
                    activeZones.map(zone => (
                      <div 
                        key={zone.id}
                        className="p-4 bg-white hover:bg-slate-50 transition-all flex justify-between items-center group"
                      >
                        <div className="flex-1 min-w-0 pr-3">
                          <h3 className="font-bold text-xs text-[#111c2d] flex items-center gap-2">
                            {zone.name}
                            <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-semibold ${
                              zone.vehicleType === 'VIP' ? 'bg-amber-100 text-amber-800' :
                              zone.vehicleType === 'EV Charging' ? 'bg-[#006d43]/10 text-[#006d43]' :
                              zone.vehicleType === 'Motorbike' ? 'bg-blue-100 text-blue-800' :
                              'bg-slate-100 text-slate-700'
                            }`}>
                              {zone.vehicleType}
                            </span>
                            <span className={`w-1.5 h-1.5 rounded-full ${zone.status === 'Active' ? 'bg-[#006d43]' : 'bg-red-500'}`} />
                          </h3>
                          <p className="text-[11px] text-slate-400 mt-1">Capacity allocation: {zone.slotCapacity} slots</p>
                        </div>

                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button 
                            onClick={(e) => handleOpenEditZone(zone, e)}
                            className="p-1 text-slate-400 hover:text-[#006d43] hover:bg-white border border-transparent hover:border-slate-200 rounded transition-all"
                            title="Edit zone"
                          >
                            <span className="material-symbols-outlined text-[16px]">edit</span>
                          </button>
                          <button 
                            onClick={(e) => handleOpenDelZone(zone, e)}
                            className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 border border-transparent hover:border-red-100 rounded transition-all"
                            title="Delete zone"
                          >
                            <span className="material-symbols-outlined text-[16px]">delete</span>
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-8 text-center text-slate-400 text-xs font-medium">
                      No zones configured for this floor yet. Click Add Zone above to allocate capacity.
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex-grow flex flex-col items-center justify-center p-8 text-center text-slate-400 text-xs">
                  <span className="material-symbols-outlined text-4xl text-slate-300 mb-2">layers_clear</span>
                  Please select a floor level from the middle panel to configure its zoning & vehicle types.
                </div>
              )}
            </section>

          </div>
        </div>
      </main>

      {/* ========================================================================= */}
      {/* ─── MODALS & DIALOGS KHÔNG GIAN HẠ TẦNG ───────────────────────────────── */}
      {/* ========================================================================= */}

      {/* 1. MODAL THÊM TÒA NHÀ MỚI */}
      {isAddBldOpen && (
        <div className="fixed inset-0 bg-[#111c2d]/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-[#006d43]/10 p-6 max-w-md w-full animate-in fade-in zoom-in-95 duration-150">
            <h3 className="text-lg font-bold text-[#111c2d] mb-4">Add New Building</h3>
            <form onSubmit={handleAddBldSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#3d4a41] mb-1">Building Code *</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. BLD-MAIN" 
                  value={formBldCode}
                  onChange={(e) => setFormBldCode(e.target.value.toUpperCase())}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm text-[#111c2d] focus:outline-none focus:border-[#006d43]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#3d4a41] mb-1">Building Name *</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. Main Central Tower" 
                  value={formBldName}
                  onChange={(e) => setFormBldName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm text-[#111c2d] focus:outline-none focus:border-[#006d43]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#3d4a41] mb-1">Physical Address</label>
                <input 
                  type="text" 
                  placeholder="e.g. 123 Parking Avenue" 
                  value={formBldAddress}
                  onChange={(e) => setFormBldAddress(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm text-[#111c2d] focus:outline-none focus:border-[#006d43]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#3d4a41] mb-1">Total Parking Floors (1-100) *</label>
                <input 
                  type="number" 
                  required
                  min={1}
                  max={100}
                  value={formBldTotalFloor}
                  onChange={(e) => setFormBldTotalFloor(parseInt(e.target.value, 10) || 1)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm text-[#111c2d] focus:outline-none focus:border-[#006d43]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button 
                  type="button"
                  onClick={() => setIsAddBldOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-500 hover:bg-slate-50 rounded-lg"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={isSaving}
                  className="px-4 py-2 bg-[#006d43] hover:bg-[#006d43]/90 text-white text-xs font-bold rounded-lg disabled:opacity-55"
                >
                  {isSaving ? 'Saving...' : 'Add Building'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. MODAL CHỈNH SỬA TÒA NHÀ */}
      {isEditBldOpen && (
        <div className="fixed inset-0 bg-[#111c2d]/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-[#006d43]/10 p-6 max-w-md w-full animate-in fade-in zoom-in-95 duration-150">
            <h3 className="text-lg font-bold text-[#111c2d] mb-4">Edit Building Configuration</h3>
            <form onSubmit={handleEditBldPreSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#3d4a41] mb-1">Building Code *</label>
                <input 
                  type="text" 
                  required
                  value={formBldCode}
                  onChange={(e) => setFormBldCode(e.target.value.toUpperCase())}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm text-[#111c2d] focus:outline-none focus:border-[#006d43]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#3d4a41] mb-1">Building Name *</label>
                <input 
                  type="text" 
                  required
                  value={formBldName}
                  onChange={(e) => setFormBldName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm text-[#111c2d] focus:outline-none focus:border-[#006d43]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#3d4a41] mb-1">Physical Address</label>
                <input 
                  type="text" 
                  value={formBldAddress}
                  onChange={(e) => setFormBldAddress(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm text-[#111c2d] focus:outline-none focus:border-[#006d43]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#3d4a41] mb-1">Total Parking Floors *</label>
                <input 
                  type="number" 
                  required
                  min={1}
                  value={formBldTotalFloor}
                  onChange={(e) => setFormBldTotalFloor(parseInt(e.target.value, 10) || 1)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm text-[#111c2d] focus:outline-none focus:border-[#006d43]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#3d4a41] mb-1">Status</label>
                <select
                  value={formBldStatus}
                  onChange={(e) => setFormBldStatus(parseInt(e.target.value, 10))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm text-[#111c2d] focus:outline-none focus:border-[#006d43]"
                >
                  <option value={BuildingStatus.Available}>Available</option>
                  <option value={BuildingStatus.Occupied}>Occupied</option>
                  <option value={BuildingStatus.Reserved}>Reserved</option>
                  <option value={BuildingStatus.OutOfService}>Maintenance (Out Of Service)</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button 
                  type="button"
                  onClick={() => {
                    setIsEditBldOpen(false);
                    setEditingBld(null);
                  }}
                  className="px-4 py-2 text-xs font-bold text-slate-500 hover:bg-slate-50 rounded-lg"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={isSaving}
                  className="px-4 py-2 bg-[#006d43] hover:bg-[#006d43]/90 text-white text-xs font-bold rounded-lg disabled:opacity-55"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. CẢNH BÁO GIẢM TẦNG TÒA NHÀ (WARNING MODAL) */}
      {isWarningBldOpen && (
        <div className="fixed inset-0 bg-[#111c2d]/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-red-100 p-6 max-w-md w-full animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-2 text-red-600 mb-3">
              <span className="material-symbols-outlined text-2xl">warning</span>
              <h3 className="text-lg font-bold">Confirm Floor Count Reduction</h3>
            </div>
            <p className="text-sm text-slate-600 leading-relaxed mb-6">
              You are reducing the floor count for <span className="font-bold text-[#111c2d]">{editingBld?.name}</span> from {editingBld?.totalFloor} to {formBldTotalFloor} levels.
              <br /><br />
              <span className="text-red-600 font-bold">CRITICAL WARNING:</span> All floors above level {formBldTotalFloor}, as well as their configured zones and parking spaces, will be <span className="font-bold">PERMANENTLY DELETED</span>. This action cannot be undone. Do you wish to proceed?
            </p>
            <div className="flex justify-end gap-2">
              <button 
                type="button"
                onClick={() => setIsWarningBldOpen(false)}
                className="px-4 py-2 text-xs font-bold text-slate-500 hover:bg-slate-50 rounded-lg"
              >
                No, Abort
              </button>
              <button 
                type="button"
                onClick={executeEditBldSave}
                disabled={isSaving}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-lg"
              >
                Yes, Delete and Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. MODAL XÁC NHẬN XÓA TÒA NHÀ */}
      {isDelBldOpen && (
        <div className="fixed inset-0 bg-[#111c2d]/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-red-100 p-6 max-w-md w-full animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-2 text-red-600 mb-3">
              <span className="material-symbols-outlined text-2xl">delete_forever</span>
              <h3 className="text-lg font-bold">Delete Building</h3>
            </div>
            <p className="text-sm text-slate-600 leading-relaxed mb-6">
              Are you sure you want to delete <span className="font-bold text-[#111c2d]">{deletingBld?.name} ({deletingBld?.code})</span>?
              <br /><br />
              All floors and zones registered to this facility will also be cascade-deleted. This action is permanent.
            </p>
            <div className="flex justify-end gap-2">
              <button 
                type="button"
                onClick={() => {
                  setIsDelBldOpen(false);
                  setDeletingBld(null);
                }}
                className="px-4 py-2 text-xs font-bold text-slate-500 hover:bg-slate-50 rounded-lg"
              >
                Cancel
              </button>
              <button 
                type="button"
                onClick={executeDeleteBld}
                disabled={isSaving}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-lg"
              >
                {isSaving ? 'Deleting...' : 'Confirm Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. MODAL THÊM TẦNG MỚI */}
      {isAddFloorOpen && (
        <div className="fixed inset-0 bg-[#111c2d]/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-[#006d43]/10 p-6 max-w-md w-full animate-in fade-in zoom-in-95 duration-150">
            <h3 className="text-lg font-bold text-[#111c2d] mb-4">Add Floor level</h3>
            <form onSubmit={handleAddFloorSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#3d4a41] mb-1">Floor Number (Index) *</label>
                <input 
                  type="number" 
                  required
                  value={formFloorNumber}
                  onChange={(e) => setFormFloorNumber(parseInt(e.target.value, 10) || 1)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm text-[#111c2d] focus:outline-none focus:border-[#006d43]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#3d4a41] mb-1">Floor Name *</label>
                <input 
                  type="text" 
                  required
                  value={formFloorName}
                  onChange={(e) => setFormFloorName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm text-[#111c2d] focus:outline-none focus:border-[#006d43]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#3d4a41] mb-1">Max Capacity Allocation (slots) *</label>
                <input 
                  type="number" 
                  required
                  min={1}
                  value={formFloorTotalSlots}
                  onChange={(e) => setFormFloorTotalSlots(parseInt(e.target.value, 10) || 10)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm text-[#111c2d] focus:outline-none focus:border-[#006d43]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#3d4a41] mb-1">Status</label>
                <select
                  value={formFloorStatus}
                  onChange={(e) => setFormFloorStatus(e.target.value as 'Active' | 'Inactive')}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm text-[#111c2d] focus:outline-none focus:border-[#006d43]"
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive (Under Maintenance)</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button 
                  type="button"
                  onClick={() => setIsAddFloorOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-500 hover:bg-slate-50 rounded-lg"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="px-4 py-2 bg-[#006d43] hover:bg-[#006d43]/90 text-white text-xs font-bold rounded-lg"
                >
                  Add Floor
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. MODAL CHỈNH SỬA TẦNG */}
      {isEditFloorOpen && (
        <div className="fixed inset-0 bg-[#111c2d]/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-[#006d43]/10 p-6 max-w-md w-full animate-in fade-in zoom-in-95 duration-150">
            <h3 className="text-lg font-bold text-[#111c2d] mb-4">Edit Floor Structure</h3>
            <form onSubmit={handleEditFloorSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#3d4a41] mb-1">Floor Number (Index) *</label>
                <input 
                  type="number" 
                  required
                  value={formFloorNumber}
                  onChange={(e) => setFormFloorNumber(parseInt(e.target.value, 10) || 1)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm text-[#111c2d] focus:outline-none focus:border-[#006d43]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#3d4a41] mb-1">Floor Name *</label>
                <input 
                  type="text" 
                  required
                  value={formFloorName}
                  onChange={(e) => setFormFloorName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm text-[#111c2d] focus:outline-none focus:border-[#006d43]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#3d4a41] mb-1">Max Capacity Allocation (slots) *</label>
                <input 
                  type="number" 
                  required
                  min={1}
                  value={formFloorTotalSlots}
                  onChange={(e) => setFormFloorTotalSlots(parseInt(e.target.value, 10) || 10)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm text-[#111c2d] focus:outline-none focus:border-[#006d43]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#3d4a41] mb-1">Status</label>
                <select
                  value={formFloorStatus}
                  onChange={(e) => setFormFloorStatus(e.target.value as 'Active' | 'Inactive')}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm text-[#111c2d] focus:outline-none focus:border-[#006d43]"
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button 
                  type="button"
                  onClick={() => {
                    setIsEditFloorOpen(false);
                    setEditingFloor(null);
                  }}
                  className="px-4 py-2 text-xs font-bold text-slate-500 hover:bg-slate-50 rounded-lg"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="px-4 py-2 bg-[#006d43] hover:bg-[#006d43]/90 text-white text-xs font-bold rounded-lg"
                >
                  Save Floor
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 7. MODAL XÁC NHẬN XÓA TẦNG */}
      {isDelFloorOpen && (
        <div className="fixed inset-0 bg-[#111c2d]/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-red-100 p-6 max-w-md w-full animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-2 text-red-600 mb-3">
              <span className="material-symbols-outlined">delete</span>
              <h3 className="text-lg font-bold">Delete Floor Level</h3>
            </div>
            <p className="text-sm text-slate-600 leading-relaxed mb-6">
              Are you sure you want to delete <span className="font-bold text-[#111c2d]">{deletingFloor?.name}</span>?
              <br /><br />
              All zones registered on this floor will also be permanently deleted. This action is irreversible.
            </p>
            <div className="flex justify-end gap-2">
              <button 
                type="button"
                onClick={() => {
                  setIsDelFloorOpen(false);
                  setDeletingFloor(null);
                }}
                className="px-4 py-2 text-xs font-bold text-slate-500 hover:bg-slate-50 rounded-lg"
              >
                Cancel
              </button>
              <button 
                type="button"
                onClick={executeDeleteFloor}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-lg"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 8. MODAL THÊM PHÂN KHU (ZONE) */}
      {isAddZoneOpen && (
        <div className="fixed inset-0 bg-[#111c2d]/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-[#006d43]/10 p-6 max-w-md w-full animate-in fade-in zoom-in-95 duration-150">
            <h3 className="text-lg font-bold text-[#111c2d] mb-4">Add Parking Zone</h3>
            <form onSubmit={handleAddZoneSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#3d4a41] mb-1">Zone Name *</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. Zone A"
                  value={formZoneName}
                  onChange={(e) => setFormZoneName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm text-[#111c2d] focus:outline-none focus:border-[#006d43]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#3d4a41] mb-1">Allowed Vehicle Type *</label>
                <select
                  value={formZoneVehicleType}
                  onChange={(e) => setFormZoneVehicleType(e.target.value as 'Standard' | 'VIP' | 'EV Charging' | 'Motorbike')}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm text-[#111c2d] focus:outline-none focus:border-[#006d43]"
                >
                  <option value="Standard">Standard Car</option>
                  <option value="VIP">VIP Spot</option>
                  <option value="EV Charging">EV Charging Station</option>
                  <option value="Motorbike">Motorbike Spot</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#3d4a41] mb-1">Slot Capacity Allocation *</label>
                <input 
                  type="number" 
                  required
                  min={1}
                  value={formZoneSlotCapacity}
                  onChange={(e) => setFormZoneSlotCapacity(parseInt(e.target.value, 10) || 5)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm text-[#111c2d] focus:outline-none focus:border-[#006d43]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#3d4a41] mb-1">Status</label>
                <select
                  value={formZoneStatus}
                  onChange={(e) => setFormZoneStatus(e.target.value as 'Active' | 'Inactive')}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm text-[#111c2d] focus:outline-none focus:border-[#006d43]"
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button 
                  type="button"
                  onClick={() => setIsAddZoneOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-500 hover:bg-slate-50 rounded-lg"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="px-4 py-2 bg-[#006d43] hover:bg-[#006d43]/90 text-white text-xs font-bold rounded-lg"
                >
                  Add Zone
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 9. MODAL CHỈNH SỬA PHÂN KHU (ZONE) */}
      {isEditZoneOpen && (
        <div className="fixed inset-0 bg-[#111c2d]/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-[#006d43]/10 p-6 max-w-md w-full animate-in fade-in zoom-in-95 duration-150">
            <h3 className="text-lg font-bold text-[#111c2d] mb-4">Edit Zone Details</h3>
            <form onSubmit={handleEditZoneSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#3d4a41] mb-1">Zone Name *</label>
                <input 
                  type="text" 
                  required
                  value={formZoneName}
                  onChange={(e) => setFormZoneName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm text-[#111c2d] focus:outline-none focus:border-[#006d43]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#3d4a41] mb-1">Allowed Vehicle Type *</label>
                <select
                  value={formZoneVehicleType}
                  onChange={(e) => setFormZoneVehicleType(e.target.value as 'Standard' | 'VIP' | 'EV Charging' | 'Motorbike')}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm text-[#111c2d] focus:outline-none focus:border-[#006d43]"
                >
                  <option value="Standard">Standard Car</option>
                  <option value="VIP">VIP Spot</option>
                  <option value="EV Charging">EV Charging Station</option>
                  <option value="Motorbike">Motorbike Spot</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#3d4a41] mb-1">Slot Capacity Allocation *</label>
                <input 
                  type="number" 
                  required
                  min={1}
                  value={formZoneSlotCapacity}
                  onChange={(e) => setFormZoneSlotCapacity(parseInt(e.target.value, 10) || 5)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm text-[#111c2d] focus:outline-none focus:border-[#006d43]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#3d4a41] mb-1">Status</label>
                <select
                  value={formZoneStatus}
                  onChange={(e) => setFormZoneStatus(e.target.value as 'Active' | 'Inactive')}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm text-[#111c2d] focus:outline-none focus:border-[#006d43]"
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button 
                  type="button"
                  onClick={() => {
                    setIsEditZoneOpen(false);
                    setEditingZone(null);
                  }}
                  className="px-4 py-2 text-xs font-bold text-slate-500 hover:bg-slate-50 rounded-lg"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="px-4 py-2 bg-[#006d43] hover:bg-[#006d43]/90 text-white text-xs font-bold rounded-lg"
                >
                  Save Zone
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 10. MODAL XÁC NHẬN XÓA PHÂN KHU (ZONE) */}
      {isDelZoneOpen && (
        <div className="fixed inset-0 bg-[#111c2d]/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-red-100 p-6 max-w-md w-full animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-2 text-red-600 mb-3">
              <span className="material-symbols-outlined">delete</span>
              <h3 className="text-lg font-bold">Delete Zone</h3>
            </div>
            <p className="text-sm text-slate-600 leading-relaxed mb-6">
              Are you sure you want to delete parking <span className="font-bold text-[#111c2d]">{deletingZone?.name}</span>?
              <br /><br />
              This action will release its allocated capacity of {deletingZone?.slotCapacity} slots from the floor level.
            </p>
            <div className="flex justify-end gap-2">
              <button 
                type="button"
                onClick={() => {
                  setIsDelZoneOpen(false);
                  setDeletingZone(null);
                }}
                className="px-4 py-2 text-xs font-bold text-slate-500 hover:bg-slate-50 rounded-lg"
              >
                Cancel
              </button>
              <button 
                type="button"
                onClick={executeDeleteZone}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-lg"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
