import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/features/auth';
import { api } from '@/lib/api/client';
import { Building, BuildingStatus, BaseResponse, PagedResult } from '@/lib/types/building.types';
import { Floor, Zone } from '../types';

/**
 * Custom hook quản lý toàn bộ logic nghiệp vụ (state, API, validation, cascades) của quản lý cơ sở hạ tầng (Facilities)
 */
export function useFacilities() {
  const { user } = useAuth();

  // State hiển thị thời gian trên header
  const [currentTime, setCurrentTime] = useState('00:00:00');
  const [currentDate, setCurrentDate] = useState('Loading date...');

  // State quản lý danh sách tòa nhà và phân trang
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

  const [pageIndex, setPageIndex] = useState(1);
  const [pageSize] = useState(10);
  const [totalCount, setTotalCount] = useState(4);
  const [totalPages, setTotalPages] = useState(1);
  const [searchBldQuery, setSearchBldQuery] = useState('');

  // Các lựa chọn phân cấp (Building -> Floor)
  const [selectedBuilding, setSelectedBuilding] = useState<Building | null>(null);
  const [selectedFloor, setSelectedFloor] = useState<Floor | null>(null);

  // Danh sách Tầng (Floors) mẫu cục bộ (Offline-first fallback)
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

  // Danh sách Phân khu (Zones) mẫu cục bộ (Offline-first fallback)
  const [zones, setZones] = useState<Zone[]>([
    { id: 111, floorId: 11, name: 'Zone A', vehicleType: 'Standard', slotCapacity: 10, status: 'Active' },
    { id: 112, floorId: 11, name: 'Zone B', vehicleType: 'EV Charging', slotCapacity: 10, status: 'Active' },
    { id: 121, floorId: 12, name: 'Zone C', vehicleType: 'VIP', slotCapacity: 5, status: 'Active' },
    { id: 122, floorId: 12, name: 'Zone D', vehicleType: 'Standard', slotCapacity: 10, status: 'Active' },
    { id: 131, floorId: 13, name: 'Zone E', vehicleType: 'Motorbike', slotCapacity: 15, status: 'Active' },
    { id: 211, floorId: 21, name: 'Zone N1', vehicleType: 'Standard', slotCapacity: 12, status: 'Active' },
    { id: 311, floorId: 31, name: 'Zone E1', vehicleType: 'Standard', slotCapacity: 16, status: 'Active' },
    { id: 411, floorId: 41, name: 'Zone W1', vehicleType: 'Standard', slotCapacity: 8, status: 'Active' }
  ]);

  // Tình trạng mở các Modal Tòa nhà (Building)
  const [isAddBldOpen, setIsAddBldOpen] = useState(false);
  const [isEditBldOpen, setIsEditBldOpen] = useState(false);
  const [isDelBldOpen, setIsDelBldOpen] = useState(false);
  const [isWarningBldOpen, setIsWarningBldOpen] = useState(false);

  // Tình trạng mở các Modal Tầng (Floor)
  const [isAddFloorOpen, setIsAddFloorOpen] = useState(false);
  const [isEditFloorOpen, setIsEditFloorOpen] = useState(false);
  const [isDelFloorOpen, setIsDelFloorOpen] = useState(false);

  // Tình trạng mở các Modal Phân khu (Zone)
  const [isAddZoneOpen, setIsAddZoneOpen] = useState(false);
  const [isEditZoneOpen, setIsEditZoneOpen] = useState(false);
  const [isDelZoneOpen, setIsDelZoneOpen] = useState(false);

  // Dữ liệu nhập trên Form Tòa nhà
  const [formBldCode, setFormBldCode] = useState('');
  const [formBldName, setFormBldName] = useState('');
  const [formBldAddress, setFormBldAddress] = useState('');
  const [formBldTotalFloor, setFormBldTotalFloor] = useState(1);
  const [formBldStatus, setFormBldStatus] = useState<BuildingStatus>(BuildingStatus.Available);
  const [editingBld, setEditingBld] = useState<Building | null>(null);
  const [deletingBld, setDeletingBld] = useState<Building | null>(null);

  // Dữ liệu nhập trên Form Tầng
  const [formFloorNumber, setFormFloorNumber] = useState(1);
  const [formFloorName, setFormFloorName] = useState('');
  const [formFloorTotalSlots, setFormFloorTotalSlots] = useState(10);
  const [formFloorStatus, setFormFloorStatus] = useState<'Active' | 'Inactive'>('Active');
  const [formFloorType, setFormFloorType] = useState<string>('Standard');
  const [formFloorInitDefaultZones, setFormFloorInitDefaultZones] = useState<boolean>(false);
  const [editingFloor, setEditingFloor] = useState<Floor | null>(null);
  const [deletingFloor, setDeletingFloor] = useState<Floor | null>(null);

  // Dữ liệu nhập trên Form Phân khu
  const [formZoneName, setFormZoneName] = useState('');
  const [formZoneVehicleType, setFormZoneVehicleType] = useState<'Standard' | 'VIP' | 'EV Charging' | 'Motorbike'>('Standard');
  const [formZoneSlotCapacity, setFormZoneSlotCapacity] = useState(5);
  const [formZoneStatus, setFormZoneStatus] = useState<'Active' | 'Inactive'>('Active');
  const [editingZone, setEditingZone] = useState<Zone | null>(null);
  const [deletingZone, setDeletingZone] = useState<Zone | null>(null);

  const [isSaving, setIsSaving] = useState(false);

  // Quản lý Toast
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error'>('success');

  const triggerToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToastMessage(message);
    setToastType(type);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  // Đồng hồ chạy thực tế
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

  // Fetch dữ liệu Tòa nhà từ API
  const fetchBuildings = async (index: number) => {
    try {
      // Gọi API lấy danh sách tòa nhà theo trang
      const res = await api.get<BaseResponse<PagedResult<Building>>>(
        `/Buildings/paged?pageIndex=${index}&pageSize=${pageSize}`
      );
      if (res.success && res.data && res.data.items.length > 0) {
        // Cập nhật dữ liệu từ API vào state
        setBuildings(res.data.items);
        setTotalCount(res.data.totalCount);
        setTotalPages(res.data.totalPages);
        setPageIndex(res.data.pageIndex);
      }
    } catch (error) {
      // Khi API lỗi hoặc không kết nối được (offline mode), hệ thống cảnh báo và giữ nguyên dữ liệu Mock
      console.warn('Không thể kết nối API. Sử dụng danh sách Mock làm phương án dự phòng.', error);
    }
  };

  useEffect(() => {
    fetchBuildings(pageIndex);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageIndex]);

  // Bộ lọc tìm kiếm tòa nhà
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

  // Bộ lọc tầng theo tòa nhà được chọn
  const activeFloors = useMemo(() => {
    if (!selectedBuilding) return [];
    return floors.filter(f => f.buildingId === selectedBuilding.id)
                 .sort((a, b) => a.floorNumber - b.floorNumber);
  }, [selectedBuilding, floors]);

  // Bộ lọc phân khu theo tầng được chọn
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

  const handleAddBldSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      // Gửi request tạo tòa nhà mới lên API server
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
      // [Offline Fallback] Nếu mất kết nối mạng, tiến hành lưu tạm tòa nhà cục bộ để tiếp tục trải nghiệm UX
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
      
      // Nghiệp vụ: Tự động khởi tạo cấu trúc tầng (Floor 1 -> Floor N) tương ứng với số tầng đăng ký
      const autoFloors: Floor[] = [];
      for (let i = 1; i <= formBldTotalFloor; i++) {
        autoFloors.push({
          id: Date.now() + i,
          buildingId: newBldId,
          floorNumber: i,
          name: `Floor ${i}`,
          totalSlots: 10, // Số slot đỗ mặc định cho tầng offline
          status: 'Active'
        });
      }

      // Lưu lại vào state cục bộ
      setBuildings(prev => [...prev, newBld]);
      setFloors(prev => [...prev, ...autoFloors]);
      setTotalCount(prev => prev + 1);
      setIsAddBldOpen(false);
      triggerToast('Saved building locally (Offline mode)!');
    } finally {
      setIsSaving(false);
    }
  };

  const handleEditBldPreSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBld) return;

    if (formBldTotalFloor < editingBld.totalFloor) {
      setIsWarningBldOpen(true);
    } else {
      executeEditBldSave();
    }
  };

  const executeEditBldSave = async () => {
    if (!editingBld) return;
    setIsSaving(true);
    setIsWarningBldOpen(false);

    try {
      // Gửi yêu cầu cập nhật thông tin tòa nhà lên API
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
      // [Offline Fallback] Cập nhật thông tin cục bộ khi mất kết nối mạng
      console.warn('Lỗi mạng, sửa tòa nhà cục bộ offline:', error);

      setBuildings(prev => prev.map(b => b.id === editingBld.id ? {
        ...b,
        code: formBldCode,
        name: formBldName,
        address: formBldAddress || null,
        totalFloor: formBldTotalFloor,
        status: formBldStatus
      } : b));

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

      // Nghiệp vụ 1: Nếu số tầng mới NHỎ HƠN số tầng cũ
      if (formBldTotalFloor < editingBld.totalFloor) {
        // Thực hiện cascade-delete: Xóa bỏ các tầng có chỉ số vượt quá số tầng mới cấu hình
        const remainingFloors = floors.filter(f => {
          if (f.buildingId !== editingBld.id) return true;
          return f.floorNumber <= formBldTotalFloor;
        });
        
        // Thu thập danh sách ID của những tầng bị xóa để cascade-delete các phân khu tương ứng
        const deletedFloorIds = floors.filter(f => f.buildingId === editingBld.id && f.floorNumber > formBldTotalFloor)
                                      .map(f => f.id);
        
        setFloors(remainingFloors);
        // Cascade-delete các phân khu (Zones) thuộc các tầng đã bị xóa bỏ
        setZones(prev => prev.filter(z => !deletedFloorIds.includes(z.floorId)));

        // Reset trạng thái chọn tầng nếu tầng đang được chọn nằm trong nhóm bị xóa
        if (selectedFloor && deletedFloorIds.includes(selectedFloor.id)) {
          setSelectedFloor(null);
        }
      } 
      // Nghiệp vụ 2: Nếu số tầng mới LỚN HƠN số tầng cũ
      else if (formBldTotalFloor > editingBld.totalFloor) {
        // Tự động sinh thêm các tầng mới từ số tầng cũ trở lên
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

  const executeDeleteBld = async () => {
    if (!deletingBld) return;
    setIsSaving(true);

    try {
      // Gửi yêu cầu xóa tòa nhà lên API server
      const res = await api.delete<BaseResponse<unknown>>(`/Buildings/${deletingBld.id}`);
      if (res.success) {
        setIsDelBldOpen(false);
        setDeletingBld(null);
        // Reset trạng thái chọn tòa nhà và tầng nếu đang xem tòa nhà vừa xóa
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
      // [Offline Fallback] Thực hiện xóa cục bộ khi mất kết nối mạng
      console.warn('Lỗi mạng, xóa tòa nhà cục bộ offline:', error);

      // Xóa tòa nhà khỏi danh sách state
      setBuildings(prev => prev.filter(b => b.id !== deletingBld.id));
      setTotalCount(prev => prev - 1);

      // Tìm và lưu các Tầng thuộc tòa nhà vừa xóa để cascade-delete phân khu
      const buildingFloors = floors.filter(f => f.buildingId === deletingBld.id);
      const buildingFloorIds = buildingFloors.map(f => f.id);

      // Cascade-delete: Xóa toàn bộ tầng của tòa nhà này
      setFloors(prev => prev.filter(f => f.buildingId !== deletingBld.id));
      // Cascade-delete: Xóa toàn bộ phân khu (Zones) thuộc các tầng đó
      setZones(prev => prev.filter(z => !buildingFloorIds.includes(z.floorId)));

      // Reset trạng thái xem nếu tòa nhà bị xóa đang được chọn
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
    const maxFloorNum = activeFloors.length > 0 
      ? Math.max(...activeFloors.map(f => f.floorNumber)) 
      : 0;
    
    setFormFloorNumber(maxFloorNum + 1);
    setFormFloorName(`Floor ${maxFloorNum + 1}`);
    setFormFloorTotalSlots(10);
    setFormFloorStatus('Active');
    setFormFloorType('Standard');
    setFormFloorInitDefaultZones(false);
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

    // Nghiệp vụ: Đảm bảo số tầng (Floor Number) không được trùng lặp trong cùng một tòa nhà
    const floorExists = activeFloors.some(f => f.floorNumber === formFloorNumber);
    if (floorExists) {
      triggerToast(`Floor number ${formFloorNumber} already exists!`, 'error');
      return;
    }

    // Khởi tạo đối tượng tầng mới
    const newFloor: Floor = {
      id: Date.now(),
      buildingId: selectedBuilding.id,
      floorNumber: formFloorNumber,
      name: formFloorName,
      totalSlots: formFloorTotalSlots,
      status: formFloorStatus
    };

    // Cập nhật tầng vào state cục bộ
    setFloors(prev => [...prev, newFloor]);

    // Khởi tạo phân khu mặc định nếu chọn
    if (formFloorInitDefaultZones) {
      const defaultZone: Zone = {
        id: Date.now() + 1,
        floorId: newFloor.id,
        name: 'Ground Floor Zone',
        vehicleType: 'Standard',
        slotCapacity: 0,
        status: 'Active'
      };
      setZones(prev => [...prev, defaultZone]);
    }

    setIsAddFloorOpen(false);
    triggerToast('Floor added successfully!');
  };

  const handleEditFloorSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingFloor || !selectedBuilding) return;

    // Nghiệp vụ: Đảm bảo số tầng chỉnh sửa không trùng với số tầng khác của tòa nhà đó
    const floorExists = activeFloors.some(f => f.floorNumber === formFloorNumber && f.id !== editingFloor.id);
    if (floorExists) {
      triggerToast(`Floor number ${formFloorNumber} already exists in this building!`, 'error');
      return;
    }

    // Cập nhật cấu trúc tầng trong state danh sách tầng
    setFloors(prev => prev.map(f => f.id === editingFloor.id ? {
      ...f,
      floorNumber: formFloorNumber,
      name: formFloorName,
      totalSlots: formFloorTotalSlots,
      status: formFloorStatus
    } : f));

    // Đồng bộ lại thông tin nếu tầng đó đang được lựa chọn hiển thị phân khu
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

    // Xóa tầng khỏi danh sách
    setFloors(prev => prev.filter(f => f.id !== deletingFloor.id));
    // Cascade-delete: Đồng thời xóa bỏ các phân khu (Zones) thuộc tầng vừa bị xóa
    setZones(prev => prev.filter(z => z.floorId !== deletingFloor.id));

    // Reset trạng thái xem phân khu nếu tầng bị xóa đang được chọn
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

    // Nghiệp vụ 1: Đảm bảo tên phân khu (Zone Name) không trùng lặp trong cùng một tầng
    const zoneExists = activeZones.some(z => z.name.toLowerCase() === formZoneName.toLowerCase());
    if (zoneExists) {
      triggerToast(`Zone named "${formZoneName}" already exists on this floor!`, 'error');
      return;
    }

    // Nghiệp vụ 2: Kiểm tra tổng sức chứa (Capacity Check)
    // Tính tổng số slots của các phân khu hiện có trên tầng
    const currentTotalCapacity = activeZones.reduce((sum, z) => sum + z.slotCapacity, 0);
    // Nếu tổng sức chứa sau khi cộng thêm phân khu mới vượt quá số slots tối đa của tầng đó -> báo lỗi
    if (currentTotalCapacity + formZoneSlotCapacity > selectedFloor.totalSlots) {
      triggerToast(`Failed to add! Total zones capacity (${currentTotalCapacity + formZoneSlotCapacity}) exceeds floor total slot limit (${selectedFloor.totalSlots}).`, 'error');
      return;
    }

    // Khởi tạo phân khu mới
    const newZone: Zone = {
      id: Date.now(),
      floorId: selectedFloor.id,
      name: formZoneName,
      vehicleType: formZoneVehicleType,
      slotCapacity: formZoneSlotCapacity,
      status: formZoneStatus
    };

    // Lưu vào state cục bộ
    setZones(prev => [...prev, newZone]);
    setIsAddZoneOpen(false);
    triggerToast('Zone added successfully!');
  };

  const handleEditZoneSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingZone || !selectedFloor) return;

    // Nghiệp vụ 1: Kiểm tra trùng tên với phân khu khác trên cùng một tầng
    const zoneExists = activeZones.some(z => z.name.toLowerCase() === formZoneName.toLowerCase() && z.id !== editingZone.id);
    if (zoneExists) {
      triggerToast(`Zone named "${formZoneName}" already exists on this floor!`, 'error');
      return;
    }

    // Nghiệp vụ 2: Kiểm tra tổng sức chứa khi thay đổi sức chứa của phân khu hiện tại
    // Tính tổng số slots của các phân khu khác
    const currentTotalCapacity = activeZones.reduce((sum, z) => z.id === editingZone.id ? sum : sum + z.slotCapacity, 0);
    // Đảm bảo tổng sức chứa mới không vượt quá giới hạn của tầng
    if (currentTotalCapacity + formZoneSlotCapacity > selectedFloor.totalSlots) {
      triggerToast(`Failed to update! Total zones capacity (${currentTotalCapacity + formZoneSlotCapacity}) exceeds floor total slot limit (${selectedFloor.totalSlots}).`, 'error');
      return;
    }

    // Cập nhật phân khu trong state
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

    // Nghiệp vụ: Xóa phân khu khỏi state, giải phóng sức chứa đã phân bổ cho tầng
    setZones(prev => prev.filter(z => z.id !== deletingZone.id));
    setIsDelZoneOpen(false);
    setDeletingZone(null);
    triggerToast('Zone deleted successfully!');
  };

  return {
    currentTime,
    currentDate,
    user,
    
    // Buildings
    buildings,
    filteredBuildings,
    pageIndex,
    setPageIndex,
    totalPages,
    totalCount,
    searchBldQuery,
    setSearchBldQuery,
    selectedBuilding,
    setSelectedBuilding,
    isAddBldOpen,
    setIsAddBldOpen,
    isEditBldOpen,
    setIsEditBldOpen,
    isDelBldOpen,
    setIsDelBldOpen,
    isWarningBldOpen,
    setIsWarningBldOpen,
    
    // Building Form States
    formBldCode,
    setFormBldCode,
    formBldName,
    setFormBldName,
    formBldAddress,
    setFormBldAddress,
    formBldTotalFloor,
    setFormBldTotalFloor,
    formBldStatus,
    setFormBldStatus,
    editingBld,
    setEditingBld,
    deletingBld,
    setDeletingBld,
    
    // Building Action Handlers
    handleOpenAddBld,
    handleOpenEditBld,
    handleOpenDelBld,
    handleAddBldSubmit,
    handleEditBldPreSubmit,
    executeEditBldSave,
    executeDeleteBld,

    // Floors
    floors,
    activeFloors,
    selectedFloor,
    setSelectedFloor,
    isAddFloorOpen,
    setIsAddFloorOpen,
    isEditFloorOpen,
    setIsEditFloorOpen,
    isDelFloorOpen,
    setIsDelFloorOpen,
    
    // Floor Form States
    formFloorNumber,
    setFormFloorNumber,
    formFloorName,
    setFormFloorName,
    formFloorTotalSlots,
    setFormFloorTotalSlots,
    formFloorStatus,
    setFormFloorStatus,
    formFloorType,
    setFormFloorType,
    formFloorInitDefaultZones,
    setFormFloorInitDefaultZones,
    editingFloor,
    setEditingFloor,
    deletingFloor,
    setDeletingFloor,
    
    // Floor Action Handlers
    handleOpenAddFloor,
    handleOpenEditFloor,
    handleOpenDelFloor,
    handleAddFloorSubmit,
    handleEditFloorSubmit,
    executeDeleteFloor,

    // Zones
    zones,
    activeZones,
    isAddZoneOpen,
    setIsAddZoneOpen,
    isEditZoneOpen,
    setIsEditZoneOpen,
    isDelZoneOpen,
    setIsDelZoneOpen,
    
    // Zone Form States
    formZoneName,
    setFormZoneName,
    formZoneVehicleType,
    setFormZoneVehicleType,
    formZoneSlotCapacity,
    setFormZoneSlotCapacity,
    formZoneStatus,
    setFormZoneStatus,
    editingZone,
    setEditingZone,
    deletingZone,
    setDeletingZone,
    
    // Zone Action Handlers
    handleOpenAddZone,
    handleOpenEditZone,
    handleOpenDelZone,
    handleAddZoneSubmit,
    handleEditZoneSubmit,
    executeDeleteZone,

    // Common States
    isSaving,
    showToast,
    toastMessage,
    toastType,
    triggerToast
  };
}
