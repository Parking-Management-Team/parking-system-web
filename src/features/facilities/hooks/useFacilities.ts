import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/features/auth';
import { facilityService, FloorResponseDto as FloorResponse, ZoneResponseDto as ZoneResponse } from '../services/facility.service';
import { Building, BuildingStatus, BaseResponse, PagedResult } from '@/lib/types/building.types';
import { Floor, Zone, VehicleType } from '../types';

// Map accessType number to string (Backend: 0 = GENERAL, 1 = MONTHLY)
const mapAccessTypeToBackend = (type: 'GENERAL' | 'MONTHLY'): number => {
  return type === 'MONTHLY' ? 1 : 0;
};

// Map accessType number from backend to string
const mapAccessTypeToFrontend = (accessType?: number): 'GENERAL' | 'MONTHLY' => {
  return accessType === 1 ? 'MONTHLY' : 'GENERAL';
};

const mapStatusToFrontend = (status: number | string): 'Active' | 'Inactive' => {
  if (status === 5 || status === 'OutOfService' || status === 'Inactive') return 'Inactive';
  return 'Active';
};

const mapStatusToBackend = (status: 'Active' | 'Inactive'): number => {
  return status === 'Active' ? 1 : 0; // 1 = Active, 0 = Inactive
};

const extractErrorMessage = (error: any, defaultMsg: string): string => {
  if (error && error.data) {
    const data = error.data;
    if (typeof data === 'object' && data !== null) {
      if (data.message) return data.message;
      if (data.errors && Array.isArray(data.errors) && data.errors.length > 0) {
        return data.errors.join(', ');
      }
      if (data.errors && typeof data.errors === 'object') {
        return Object.values(data.errors).flat().join(', ');
      }
      if (data.detail) return data.detail;
      if (data.title && data.title !== 'One or more validation errors occurred.') {
        return data.title;
      }
    }
  }
  if (error?.message && error.message !== 'Failed') {
    return error.message;
  }
  return defaultMsg;
};


/**
 * Custom hook quản lý toàn bộ logic nghiệp vụ (state, API, validation, cascades) của quản lý cơ sở hạ tầng (Facilities)
 */
export function useFacilities() {
  const { user } = useAuth();

  // State hiển thị thời gian trên header
  const [currentTime, setCurrentTime] = useState('00:00:00');
  const [currentDate, setCurrentDate] = useState('Loading date...');

  // State quản lý danh sách tòa nhà và phân trang
  const [buildings, setBuildings] = useState<Building[]>([]);

  const [pageIndex, setPageIndex] = useState(1);
  const [pageSize] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [searchBldQuery, setSearchBldQuery] = useState('');

  // Các lựa chọn phân cấp (Building -> Floor)
  const [selectedBuilding, setSelectedBuilding] = useState<Building | null>(null);
  const [selectedFloor, setSelectedFloor] = useState<Floor | null>(null);

  // Danh sách Phân khu (Zones)
  const [zones, setZones] = useState<Zone[]>([]);

  // Danh sách Tầng (Floors)
  const [rawFloors, setRawFloors] = useState<Floor[]>([]);

  const floors = useMemo(() => {
    return rawFloors.map(floor => {
      const allocated = zones
        .filter(z => z.floorId === floor.id)
        .reduce((sum, z) => sum + z.slotCapacity, 0);
      return {
        ...floor,
        totalSlots: allocated // Gán tự động tổng số slot của Floor = tổng slot của các Zone
      };
    });
  }, [rawFloors, zones]);

  // Danh sách Loại xe từ API (Vehicle Types)
  const [vehicleTypes, setVehicleTypes] = useState<VehicleType[]>([]);

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
  const [editingFloor, setEditingFloor] = useState<Floor | null>(null);
  const [deletingFloor, setDeletingFloor] = useState<Floor | null>(null);

  // Dữ liệu nhập trên Form Phân khu
  const [formZoneCode, setFormZoneCode] = useState('');
  const [formZoneName, setFormZoneName] = useState('');
  const [formZoneVehicleTypeId, setFormZoneVehicleTypeId] = useState<number | ''>('');
  const [formZoneAccessType, setFormZoneAccessType] = useState<'GENERAL' | 'MONTHLY'>('GENERAL');
  const [formZoneSlotCapacity, setFormZoneSlotCapacity] = useState(5);
  const [formZoneBookingLimitRate, setFormZoneBookingLimitRate] = useState(80);
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

  // Fetch danh sách tầng từ API thông qua Service
  const fetchFloors = async () => {
    try {
      const res = await facilityService.floors.getAll();
      if (res.success && res.data) {
        const mappedFloors: Floor[] = res.data.map((item: FloorResponse) => ({
          id: item.id,
          buildingId: item.buildingId,
          floorNumber: item.floorNumber,
          name: item.name || `Floor ${item.floorNumber}`,
          floorType: item.type || item.floorType || 'Standard',
          totalSlots: 0,
          status: mapStatusToFrontend(item.status)
        }));
        setRawFloors(mappedFloors);
      }
    } catch (error) {
      console.error('Không thể kết nối API Floors.', error);
    }
  };

  // Fetch danh sách Loại xe từ API thông qua Service
  const fetchVehicleTypes = async () => {
    try {
      const res = await facilityService.vehicleTypes.getAll();
      if (res.success && res.data) {
        setVehicleTypes(res.data);
        return res.data;
      }
    } catch (error) {
      console.error('Không thể kết nối API Vehicle Types.', error);
    }
    return [];
  };

  const fetchZones = async () => {
    try {
      let currentVehicleTypes = vehicleTypes;
      if (!currentVehicleTypes || currentVehicleTypes.length === 0) {
        currentVehicleTypes = await fetchVehicleTypes() || [];
      }

      const res = await facilityService.zones.getAll();
      if (res.success && Array.isArray(res.data)) {
        const safeVehicleTypes = Array.isArray(currentVehicleTypes) ? currentVehicleTypes : [];
        const mappedZones: Zone[] = res.data.map((item: ZoneResponse) => {
          const vt = safeVehicleTypes.find(v => v && v.id === item.vehicleTypeId);
          return {
            id: item.id,
            floorId: item.floorId,
            name: item.name,
            code: item.code,
            vehicleTypeId: item.vehicleTypeId,
            vehicleType: vt ? vt.name : `Type ${item.vehicleTypeId}`,
            zoneAccessType: mapAccessTypeToFrontend(item.accessType),
            slotCapacity: item.capacity || 0,
            status: mapStatusToFrontend(item.status),
            bookingLimitRate: item.bookingLimitRate ?? 80
          };
        });
        setZones(mappedZones);
      }
    } catch (error) {
      console.error('Không thể kết nối API Zones.', error);
    }
  };

  // Fetch dữ liệu Tòa nhà từ API thông qua Service
  const fetchBuildings = async (index: number) => {
    try {
      const res = await facilityService.buildings.getPaged(index, pageSize);
      if (res.success && res.data && res.data.items) {
        setBuildings(res.data.items);
        setTotalCount(res.data.totalCount);
        setTotalPages(res.data.totalPages);
        setPageIndex(res.data.pageIndex);
      }
    } catch (error) {
      console.error('Không thể kết nối API Buildings.', error);
    }
  };

  useEffect(() => {
    fetchBuildings(pageIndex);
    fetchFloors();
    fetchVehicleTypes();
    fetchZones();
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

    // Validate building code rules: Max 20 characters and unique
    const cleanCode = formBldCode.trim();
    if (!cleanCode) {
      triggerToast('Building code is required!', 'error');
      return;
    }
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

    setIsSaving(true);
    try {
      // Gửi request tạo tòa nhà mới lên API server thông qua Service
      const res = await facilityService.buildings.create({
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
      console.error('Lỗi khi thêm tòa nhà:', error);
      triggerToast(extractErrorMessage(error, 'Network error, failed to add building'), 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleEditBldPreSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBld) return;

    // Validate building code rules: Max 20 characters and unique
    const cleanCode = formBldCode.trim();
    if (!cleanCode) {
      triggerToast('Building code is required!', 'error');
      return;
    }
    if (cleanCode.length > 20) {
      triggerToast('Building code cannot exceed 20 characters!', 'error');
      return;
    }
    const isCodeDuplicate = buildings.some(
      b => b.id !== editingBld.id && b.code.toUpperCase() === cleanCode.toUpperCase()
    );
    if (isCodeDuplicate) {
      triggerToast('Building code must be unique!', 'error');
      return;
    }

    const existingFloorsCount = floors.filter(f => f.buildingId === editingBld.id).length;
    if (formBldTotalFloor < existingFloorsCount) {
      triggerToast(`Cannot decrease total floors below the currently registered floor count (${existingFloorsCount})!`, 'error');
      return;
    }

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
      // Gửi yêu cầu cập nhật thông tin tòa nhà lên API thông qua Service
      const res = await facilityService.buildings.update(editingBld.id, {
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
      console.error('Lỗi khi sửa tòa nhà:', error);
      triggerToast(extractErrorMessage(error, 'Network error, failed to update building'), 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const executeDeleteBld = async () => {
    if (!deletingBld) return;
    setIsSaving(true);

    try {
      // Gửi yêu cầu xóa tòa nhà lên API server thông qua Service
      const res = await facilityService.buildings.delete(deletingBld.id);
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
      console.error('Lỗi khi xóa tòa nhà:', error);
      triggerToast(extractErrorMessage(error, 'Network error, failed to delete building'), 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // ─── THAO TÁC CRUD CHO TẦNG (FLOORS) ─────────────────────────────────────────
  const handleOpenAddFloor = () => {
    if (!selectedBuilding) return;
    if (activeFloors.length >= selectedBuilding.totalFloor) {
      triggerToast(`Building "${selectedBuilding.name}" is configured to have a maximum of ${selectedBuilding.totalFloor} floors. Cannot add more!`, 'error');
      return;
    }
    const maxFloorNum = activeFloors.length > 0 
      ? Math.max(...activeFloors.map(f => f.floorNumber)) 
      : 0;
    
    setFormFloorNumber(maxFloorNum + 1);
    setFormFloorName(`Floor ${maxFloorNum + 1}`);
    setFormFloorTotalSlots(10);
    setFormFloorStatus('Active');
    setFormFloorType('Standard');
    setIsAddFloorOpen(true);
  };

  const handleOpenEditFloor = (floor: Floor, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingFloor(floor);
    setFormFloorNumber(floor.floorNumber);
    setFormFloorName(floor.name);
    setFormFloorTotalSlots(floor.totalSlots);
    setFormFloorStatus(floor.status);
    setFormFloorType(floor.floorType || 'Standard');
    setIsEditFloorOpen(true);
  };

  const handleOpenDelFloor = (floor: Floor, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeletingFloor(floor);
    setIsDelFloorOpen(true);
  };

  const handleAddFloorSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBuilding) return;

    // Nghiệp vụ: Chặn thêm tầng nếu đã đạt giới hạn tầng của tòa nhà
    if (activeFloors.length >= selectedBuilding.totalFloor) {
      triggerToast(`Cannot add floor: this building only allows a maximum of ${selectedBuilding.totalFloor} floors!`, 'error');
      return;
    }

    // Nghiệp vụ: Đảm bảo số tầng (Floor Number) không được trùng lặp trong cùng một tòa nhà
    const floorExists = activeFloors.some(f => f.floorNumber === formFloorNumber);
    if (floorExists) {
      triggerToast(`Floor number ${formFloorNumber} already exists!`, 'error');
      return;
    }

    setIsSaving(true);
    try {
      const res = await facilityService.floors.create({
        buildingId: selectedBuilding.id,
        floorNumber: formFloorNumber,
        name: formFloorName
      });
      if (res.success) {
        setIsAddFloorOpen(false);
        triggerToast('Floor added successfully!');
        await fetchFloors();
      } else {
        triggerToast(res.message || 'Failed to add floor', 'error');
      }
    } catch (error) {
      console.error('Failed to add floor:', error);
      triggerToast(extractErrorMessage(error, 'Network error, failed to add floor'), 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleEditFloorSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingFloor || !selectedBuilding) return;

    // Nghiệp vụ: Đảm bảo số tầng chỉnh sửa không trùng với số tầng khác của tòa nhà đó
    const floorExists = activeFloors.some(f => f.floorNumber === formFloorNumber && f.id !== editingFloor.id);
    if (floorExists) {
      triggerToast(`Floor number ${formFloorNumber} already exists in this building!`, 'error');
      return;
    }

    setIsSaving(true);
    try {
      const res = await facilityService.floors.update(editingFloor.id, {
        floorNumber: formFloorNumber,
        name: formFloorName,
        status: mapStatusToBackend(formFloorStatus)
      });
      if (res.success) {
        setIsEditFloorOpen(false);
        setEditingFloor(null);
        triggerToast('Floor structure updated!');
        await fetchFloors();
      } else {
        triggerToast(res.message || 'Failed to update floor', 'error');
      }
    } catch (error) {
      console.error('Failed to update floor:', error);
      triggerToast(extractErrorMessage(error, 'Network error, failed to update floor'), 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const executeDeleteFloor = async () => {
    if (!deletingFloor) return;
    setIsSaving(true);
    try {
      const res = await facilityService.floors.delete(deletingFloor.id);
      if (res.success) {
        setIsDelFloorOpen(false);
        setDeletingFloor(null);
        if (selectedFloor?.id === deletingFloor.id) {
          setSelectedFloor(null);
        }
        triggerToast('Floor deleted successfully!');
        await fetchFloors();
      } else {
        triggerToast(res.message || 'Failed to delete floor', 'error');
      }
    } catch (error) {
      console.error('Failed to delete floor:', error);
      triggerToast(extractErrorMessage(error, 'Network error, failed to delete floor'), 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // ─── THAO TÁC CRUD CHO PHÂN KHU (ZONES) ──────────────────────────────────────
  const handleOpenAddZone = () => {
    if (!selectedFloor) return;
    // Auto-generate zone code: Z + floorNumber + sequential number
    const existingZonesOnFloor = zones.filter(z => z.floorId === selectedFloor.id);
    const nextNum = existingZonesOnFloor.length + 1;
    const generatedCode = `Z${selectedFloor.floorNumber}${String(nextNum).padStart(2, '0')}`;
    
    setFormZoneCode(generatedCode);
    setFormZoneName('');
    setFormZoneVehicleTypeId(''); // Trống mặc định để require người dùng chọn
    setFormZoneAccessType('GENERAL');
    setFormZoneSlotCapacity(5);
    setFormZoneBookingLimitRate(80);
    setFormZoneStatus('Active');
    setIsAddZoneOpen(true);
  };

  const handleOpenEditZone = (zone: Zone, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingZone(zone);
    setFormZoneCode(zone.code || '');
    setFormZoneName(zone.name);
    setFormZoneVehicleTypeId(zone.vehicleTypeId);
    setFormZoneAccessType(zone.zoneAccessType);
    setFormZoneSlotCapacity(zone.slotCapacity);
    setFormZoneBookingLimitRate(zone.bookingLimitRate ?? 80);
    setFormZoneStatus(zone.status);
    setIsEditZoneOpen(true);
  };

  const handleOpenDelZone = (zone: Zone, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeletingZone(zone);
    setIsDelZoneOpen(true);
  };

  const handleAddZoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFloor) return;

    if (!formZoneVehicleTypeId) {
      triggerToast('Please select a vehicle type!', 'error');
      return;
    }

    // Nghiệp vụ 1: Đảm bảo tên phân khu (Zone Name) không trùng lặp trong cùng một tầng
    const zoneExists = activeZones.some(z => z.name.toLowerCase() === formZoneName.toLowerCase());
    if (zoneExists) {
      triggerToast(`Zone named "${formZoneName}" already exists on this floor!`, 'error');
      return;
    }

    setIsSaving(true);
    try {
      const res = await facilityService.zones.create({
        floorId: selectedFloor.id,
        code: formZoneCode,
        name: formZoneName,
        vehicleTypeId: Number(formZoneVehicleTypeId),
        accessType: mapAccessTypeToBackend(formZoneAccessType),
        capacity: formZoneSlotCapacity,
        bookingLimitRate: formZoneBookingLimitRate
      });
      if (res.success) {
        setIsAddZoneOpen(false);
        triggerToast('Zone added successfully!');
        await fetchZones();
      } else {
        triggerToast(res.message || 'Failed to add zone', 'error');
      }
    } catch (error) {
      console.error('Failed to add zone:', error);
      triggerToast(extractErrorMessage(error, 'Network error, failed to add zone'), 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleEditZoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingZone || !selectedFloor) return;

    if (!formZoneVehicleTypeId) {
      triggerToast('Please select a vehicle type!', 'error');
      return;
    }

    // Nghiệp vụ 1: Kiểm tra trùng tên với phân khu khác trên cùng một tầng
    const zoneExists = activeZones.some(z => z.name.toLowerCase() === formZoneName.toLowerCase() && z.id !== editingZone.id);
    if (zoneExists) {
      triggerToast(`Zone named "${formZoneName}" already exists on this floor!`, 'error');
      return;
    }

    setIsSaving(true);
    try {
      const res = await facilityService.zones.update(editingZone.id, {
        code: formZoneCode,
        name: formZoneName,
        vehicleTypeId: Number(formZoneVehicleTypeId),
        accessType: mapAccessTypeToBackend(formZoneAccessType),
        capacity: formZoneSlotCapacity,
        bookingLimitRate: formZoneBookingLimitRate
      });
      if (res.success) {
        setIsEditZoneOpen(false);
        setEditingZone(null);
        triggerToast('Zone configuration updated!');
        await fetchZones();
      } else {
        triggerToast(res.message || 'Failed to update zone', 'error');
      }
    } catch (error) {
      console.error('Failed to update zone:', error);
      triggerToast(extractErrorMessage(error, 'Network error, failed to update zone'), 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const executeDeleteZone = async () => {
    if (!deletingZone) return;
    setIsSaving(true);
    try {
      const res = await facilityService.zones.delete(deletingZone.id);
      if (res.success) {
        setIsDelZoneOpen(false);
        setDeletingZone(null);
        triggerToast('Zone deleted successfully!');
        await fetchZones();
      } else {
        triggerToast(res.message || 'Failed to delete zone', 'error');
      }
    } catch (error) {
      console.error('Failed to delete zone:', error);
      triggerToast(extractErrorMessage(error, 'Network error, failed to delete zone'), 'error');
    } finally {
      setIsSaving(false);
    }
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
    formZoneCode,
    setFormZoneCode,
    formZoneName,
    setFormZoneName,
    vehicleTypes,
    formZoneVehicleTypeId,
    setFormZoneVehicleTypeId,
    formZoneAccessType,
    setFormZoneAccessType,
    formZoneSlotCapacity,
    setFormZoneSlotCapacity,
    formZoneBookingLimitRate,
    setFormZoneBookingLimitRate,
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
