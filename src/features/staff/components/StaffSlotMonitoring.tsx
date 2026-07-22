/**
 * ===================================================================================
 * 🅿️ FE COMPONENT: StaffSlotMonitoring.tsx (Giám Sát Ô Đỗ / Slot Monitoring Workspace)
 * ===================================================================================
 * 
 * 📌 VAI TRÒ & CHỨC NĂNG CHÍNH TRÊN UI:
 * - Giám sát sơ đồ trạng thái ô đỗ thời gian thực tại các tầng bãi đỗ dành cho Nhân viên (Staff).
 * - Chọn Tòa nhà (Building) & Tầng đỗ (Floor) để hiển thị ma trận ô đỗ (Parking Slot Grid Matrix).
 * - Trực quan hóa màu sắc trạng thái từng ô đỗ:
 *   + Available (Xanh lá)  : Ô đỗ đang trống, sẵn sàng tiếp nhận xe.
 *   + Occupied (Đỏ)       : Ô đỗ đang có xe đỗ trong bãi.
 *   + Reserved (Vàng/Cam)  : Ô đỗ đã có khách hàng Đặt trước (Booking).
 *   + OutOfService (Xám)   : Ô đỗ đang tạm đóng / bảo trì kỹ thuật.
 * - Nhấp vào ô đỗ để xem chi tiết biển số xe, thông tin đặt chỗ hoặc nhanh chóng Báo cáo sự cố tại ô đỗ đó.
 * 
 * ⚙️ KẾT NỐI API BACKEND (ASP.NET Core Controllers):
 * - GET /buildings                   --> Lấy danh sách Tòa nhà đỗ xe (BuildingController.cs)
 * - GET /floors/building/{id}        --> Lấy danh sách Tầng thuộc Tòa nhà (FloorController.cs)
 * - GET /slots/floor/{id}/status     --> Lấy ma trận sơ đồ ô đỗ thời gian thực (SlotController.cs)
 * 
 * 🗄️ BẢNG DATABASE LIÊN QUAN (PostgreSQL):
 * - Buildings (Id, Name, Code)
 * - Floors    (Id, BuildingId, Name, FloorNumber)
 * - Slots     (Id, FloorId, ZoneId, SlotCode, SlotStatus, VehicleTypeId)
 * 
 * 🔄 LUỒNG CẬP NHẬT DỮ LIỆU & RENDER UI:
 * 1. Chọn Vị Trí: Chọn Tòa nhà & Tầng đỗ -> Gọi API `GET /slots/floor/{id}/status`.
 * 2. Render Sơ Đồ: Phân loại ô đỗ theo Zone (Phân khu) & tô màu tương ứng.
 * 3. Thao Tác Chi Tiết: Click vào ô đỗ -> Mở Modal chi tiết hoặc báo cáo sự cố ngay tại vị trí.
 * ===================================================================================
 */

'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '@/features/auth/context/AuthContext';
import { api, ApiError } from '@/lib/api/client';
import StaffIncidentSelector from './StaffIncidentSelector';

type BaseResponse<T> = {
  success?: boolean;
  data?: T | null;
  message?: string | null;
  errorCode?: string | null;
};

type BuildingDto = {
  id: number;
  name?: string | null;
  code?: string | null;
};

type PagedResult<T> = {
  items?: T[];
};

type FloorDto = {
  id: number;
  buildingId: number;
  floorNumber?: number | null;
  name?: string | null;
};

type ZoneDto = {
  id: number;
  floorId: number;
  name?: string | null;
  vehicleTypeId?: number | null;
  accessType?: number | string | null;
};

type SlotDto = {
  id: number;
  zoneId: number;
  code?: string | null;
  name?: string | null;
  status?: number | string | null;
  vehicleTypeId?: number | null;
  occupiedLicensePlate?: string | null;
};

type ActiveSessionDto = {
  id: number;
  vehicleId?: number | null;
  cardId?: number | null;
  vehicleTypeId?: number | null;
  slotId?: number | null;
  zoneId?: number | null;
  bookingCode?: string | null;
  cardCode?: string | null;
  cardStatus?: string | null;
  licensePlateIn?: string | null;
  vehicleType?: string | null;
  vehicleTypeName?: string | null;
  checkInTime?: string | null;
  plannedCheckoutTime?: string | null;
  sessionStatus?: string | null;
  zoneCode?: string | null;
  zoneName?: string | null;
  slotCode?: string | null;
  totalFee?: number | null;
  penaltyFee?: number | null;
  amountDue?: number | null;
};

type CardDto = {
  id?: number | null;
  cardCode?: string | null;
  cardStatus?: string | null;
  cardType?: string | null;
};

type VehicleTypeDto = {
  id?: number | null;
  name?: string | null;
  typeName?: string | null;
  vehicleTypeName?: string | null;
  vehicleTypeStatus?: string | null;
};

type StaffSlotStatus = 'AVAILABLE' | 'OCCUPIED' | 'BLOCKED' | 'MAINTENANCE';

type StaffSlot = {
  id: number;
  code: string;
  zoneId: number;
  zoneName: string;
  floorName: string;
  status: StaffSlotStatus;
  licensePlate: string | null;
  checkInTime: string | null;
  sessionId: number | null;
  vehicleId: number | null;
  cardId: number | null;
  cardCode: string | null;
  cardStatus: string | null;
  vehicleTypeName: string | null;
  plannedCheckoutTime: string | null;
};

const unwrap = <T,>(response: BaseResponse<T> | T, fallback: T): T => {
  if (response && typeof response === 'object' && 'success' in response) {
    const wrapped = response as BaseResponse<T>;
    return wrapped.success && wrapped.data != null ? wrapped.data : fallback;
  }
  return response as T;
};

const getErrorMessage = (error: unknown, fallback: string) => {
  if (error instanceof ApiError) {
    const data = error.data as { message?: string; errorCode?: string; errors?: unknown } | null;
    if (data?.message) return data.message;
    if (data?.errorCode) return data.errorCode;
  }

  if (error instanceof Error && error.message) return error.message;
  return fallback;
};

const normalizeSlotStatus = (status: SlotDto['status']): StaffSlotStatus => {
  if (typeof status === 'string') {
    const normalized = status.trim().toUpperCase();
    if (normalized === 'OCCUPIED') return 'OCCUPIED';
    if (normalized === 'BLOCKED' || normalized === 'LOCKED') return 'BLOCKED';
    if (normalized === 'MAINTENANCE') return 'MAINTENANCE';
    return 'AVAILABLE';
  }

  // BE enum hiện tại: Available=0, Occupied=1, Blocked=2, Maintenance=3.
  if (status === 1) return 'OCCUPIED';
  if (status === 2) return 'BLOCKED';
  if (status === 3) return 'MAINTENANCE';
  return 'AVAILABLE';
};



const formatDateTime = (iso?: string | null) => {
  if (!iso) return '—';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat('vi-VN', {
    dateStyle: 'short',
    timeStyle: 'medium',
  }).format(date);
};

const statusStyle: Record<StaffSlotStatus, string> = {
  AVAILABLE: 'border-emerald-200 bg-emerald-50 text-emerald-800',
  OCCUPIED: 'border-slate-300 bg-slate-800 text-white',
  BLOCKED: 'border-red-200 bg-red-50 text-red-700',
  MAINTENANCE: 'border-amber-200 bg-amber-50 text-amber-700',
};

const statusLabel: Record<StaffSlotStatus, string> = {
  AVAILABLE: 'Available',
  OCCUPIED: 'Occupied',
  BLOCKED: 'Blocked',
  MAINTENANCE: 'Maintenance',
};

export default function StaffSlotMonitoring() {
  const { showToast } = useAuth();
  const [buildings, setBuildings] = useState<BuildingDto[]>([]);
  const [floors, setFloors] = useState<FloorDto[]>([]);
  const [zones, setZones] = useState<ZoneDto[]>([]);
  const [slots, setSlots] = useState<StaffSlot[]>([]);
  const [selectedBuildingId, setSelectedBuildingId] = useState<number | null>(null);
  const [selectedFloorId, setSelectedFloorId] = useState<number | null>(null);
  const [selectedOccupiedSlotId, setSelectedOccupiedSlotId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  const activeFloors = useMemo(
    () => floors.filter((floor) => floor.buildingId === selectedBuildingId),
    [floors, selectedBuildingId]
  );

  const activeZones = useMemo(
    () => zones.filter((zone) => zone.floorId === selectedFloorId),
    [zones, selectedFloorId]
  );

  const selectedOccupiedSlot = useMemo(
    () => slots.find((slot) => slot.id === selectedOccupiedSlotId) ?? null,
    [selectedOccupiedSlotId, slots]
  );

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [buildingRes, floorRes, zoneRes, sessionRes, cardRes, vehicleTypeRes] = await Promise.all([
        api.get<BaseResponse<PagedResult<BuildingDto>>>('/Buildings/paged?pageIndex=1&pageSize=100'),
        api.get<BaseResponse<FloorDto[]> | FloorDto[]>('/Floors'),
        api.get<BaseResponse<ZoneDto[]> | ZoneDto[]>('/Zones'),
        api.get<BaseResponse<ActiveSessionDto[]> | ActiveSessionDto[]>('/parking-sessions/active'),
        api.get<BaseResponse<CardDto[]> | CardDto[]>('/cards').catch(() => [] as CardDto[]),
        api.get<BaseResponse<VehicleTypeDto[]> | VehicleTypeDto[]>('/vehicle-types').catch(() => [] as VehicleTypeDto[]),
      ]);

      const buildingItems = unwrap(buildingRes, { items: [] }).items ?? [];
      const floorItems = unwrap(floorRes, []);
      const zoneItems = unwrap(zoneRes, []);
      const activeSessions = unwrap(sessionRes, []);
      const cards = unwrap(cardRes, []);
      const vehicleTypes = unwrap(vehicleTypeRes, []);
      const cardById = new Map<number, CardDto>();
      const vehicleTypeById = new Map<number, string>();

      cards.forEach((card) => {
        const id = Number(card.id ?? 0);
        if (id > 0) cardById.set(id, card);
      });

      vehicleTypes.forEach((type) => {
        const id = Number(type.id ?? 0);
        const name = String(type.name ?? type.vehicleTypeName ?? type.typeName ?? '').trim();
        if (id > 0 && name) vehicleTypeById.set(id, name);
      });

      setBuildings(buildingItems);
      setFloors(floorItems);
      setZones(zoneItems);

      const currentBuildingId = selectedBuildingId ?? buildingItems[0]?.id ?? null;
      const currentFloorId =
        selectedFloorId ??
        floorItems.find((floor) => floor.buildingId === currentBuildingId)?.id ??
        null;

      setSelectedBuildingId(currentBuildingId);
      setSelectedFloorId(currentFloorId);

      const floorZones = zoneItems.filter((zone) => zone.floorId === currentFloorId);
      const sessionBySlot = new Map(
        activeSessions
          .filter((session) => session.slotId != null)
          .map((session) => [Number(session.slotId), session])
      );

      const slotViews: StaffSlot[] = [];
      await Promise.all(
        floorZones.map(async (zone) => {
          const slotRes = await api
            .get<BaseResponse<SlotDto[]> | SlotDto[]>(`/ParkingSlots/zone/${zone.id}`)
            .catch(() => [] as SlotDto[]);
          const zoneSlots = unwrap(slotRes, []);

          zoneSlots.forEach((slot) => {
            const session = sessionBySlot.get(slot.id);
            const card = session?.cardId ? cardById.get(Number(session.cardId)) : null;
            const sessionVehicleTypeId = Number(session?.vehicleTypeId ?? 0);
            const slotVehicleTypeId = Number(slot.vehicleTypeId ?? zone.vehicleTypeId ?? 0);
            slotViews.push({
              id: slot.id,
              code: slot.code || slot.name || `Slot #${slot.id}`,
              zoneId: zone.id,
              zoneName: zone.name || `Zone #${zone.id}`,
              floorName:
                floorItems.find((floor) => floor.id === zone.floorId)?.name ||
                `Floor ${floorItems.find((floor) => floor.id === zone.floorId)?.floorNumber ?? ''}`.trim(),
              status: normalizeSlotStatus(slot.status),
              licensePlate: session?.licensePlateIn || slot.occupiedLicensePlate || null,
              checkInTime: session?.checkInTime || null,
              sessionId: session?.id ?? null,
              vehicleId: session?.vehicleId ?? null,
              cardId: session?.cardId ?? null,
              cardCode: session?.cardCode ?? card?.cardCode ?? null,
              cardStatus: session?.cardStatus ?? card?.cardStatus ?? null,
              vehicleTypeName:
                session?.vehicleTypeName ??
                session?.vehicleType ??
                vehicleTypeById.get(sessionVehicleTypeId) ??
                vehicleTypeById.get(slotVehicleTypeId) ??
                null,
              plannedCheckoutTime: session?.plannedCheckoutTime ?? null,
            });
          });
        })
      );

      setSlots(slotViews);
    } catch (error) {
      showToast(getErrorMessage(error, 'Could not load slot data.'), 'error');
    } finally {
      setLoading(false);
    }
  }, [selectedBuildingId, selectedFloorId, showToast]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!selectedOccupiedSlot) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [selectedOccupiedSlot]);

  const handleBuildingChange = (buildingId: number) => {
    const nextFloorId = floors.find((floor) => floor.buildingId === buildingId)?.id ?? null;
    setSelectedBuildingId(buildingId);
    setSelectedFloorId(nextFloorId);
  };

  const totals = useMemo(() => ({
    total: slots.length,
    available: slots.filter((slot) => slot.status === 'AVAILABLE').length,
    occupied: slots.filter((slot) => slot.status === 'OCCUPIED').length,
    blocked: slots.filter((slot) => slot.status === 'BLOCKED').length,
    maintenance: slots.filter((slot) => slot.status === 'MAINTENANCE').length,
  }), [slots]);

  return (
    <div className="space-y-5 p-6">
      <div className="flex flex-col gap-3 rounded-3xl border border-slate-100 bg-white p-5 shadow-sm lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.2em] text-[#006d43]">Staff gate view</p>
          <h1 className="mt-1 text-2xl font-black text-[#111c2d]">Slot confirmation</h1>
          <p className="mt-1 max-w-2xl text-sm font-medium text-slate-500">
            This screen is for gate operations only: quickly view slots and confirm actual parking locations for vehicles in the lot.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => void loadData()}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-2xl bg-[#111c2d] px-4 py-2 text-sm font-black text-white transition hover:bg-[#263143] disabled:opacity-60"
          >
            <span className={`material-symbols-outlined text-lg ${loading ? 'animate-spin' : ''}`}>
              refresh
            </span>
            Refresh
          </button>
        </div>
      </div>

      <div className="space-y-4">
        <div className="rounded-3xl border border-slate-100 bg-white p-4 shadow-sm">
          <div className="grid gap-3 md:grid-cols-2">
            <label className="space-y-1">
              <span className="text-xs font-black uppercase text-slate-400">Building</span>
              <select
                value={selectedBuildingId ?? ''}
                onChange={(event) => handleBuildingChange(Number(event.target.value))}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-700 outline-none focus:border-[#006d43]"
              >
                {buildings.map((building) => (
                  <option key={building.id} value={building.id}>
                    {building.name || building.code || `Building #${building.id}`}
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-1">
              <span className="text-xs font-black uppercase text-slate-400">Floor</span>
              <select
                value={selectedFloorId ?? ''}
                onChange={(event) => setSelectedFloorId(Number(event.target.value))}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-700 outline-none focus:border-[#006d43]"
              >
                {activeFloors.map((floor) => (
                  <option key={floor.id} value={floor.id}>
                    {floor.name || `Floor ${floor.floorNumber ?? floor.id}`}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-5">
            {[
              ['Total', totals.total, 'text-slate-800'],
              ['Available', totals.available, 'text-[#006d43]'],
              ['Occupied', totals.occupied, 'text-[#111c2d]'],
              ['Blocked', totals.blocked, 'text-red-600'],
              ['Maintenance', totals.maintenance, 'text-amber-600'],
            ].map(([label, value, color]) => (
              <div key={String(label)} className="rounded-2xl bg-slate-50 p-3 text-center">
                <p className={`text-2xl font-black ${color}`}>{value}</p>
                <p className="mt-1 text-[10px] font-black uppercase text-slate-400">{label}</p>
              </div>
            ))}
          </div>
        </div>

        {activeZones.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-10 text-center">
            <span className="material-symbols-outlined text-5xl text-slate-300">grid_view</span>
            <p className="mt-2 text-sm font-bold text-slate-500">No zones available for the selected floor.</p>
          </div>
        ) : (
          activeZones.map((zone) => {
            const zoneSlots = slots.filter((slot) => slot.zoneId === zone.id);
            return (
              <div key={zone.id} className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h2 className="text-base font-black text-[#111c2d]">{zone.name || `Zone #${zone.id}`}</h2>
                    <p className="text-xs font-bold text-slate-400">
                      {zoneSlots.filter((slot) => slot.status === 'AVAILABLE').length} available / {zoneSlots.length} slots
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2 text-[11px] font-black">
                    {(['AVAILABLE', 'OCCUPIED', 'BLOCKED', 'MAINTENANCE'] as StaffSlotStatus[]).map((status) => (
                      <span key={status} className={`rounded-full border px-3 py-1 ${statusStyle[status]}`}>
                        {statusLabel[status]}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6">
                  {zoneSlots.map((slot) => (
                    <button
                      key={slot.id}
                      type="button"
                      onClick={() => {
                        if (slot.status === 'OCCUPIED') {
                          setSelectedOccupiedSlotId(slot.id);
                        }
                      }}
                      className={`min-h-28 rounded-2xl border p-3 text-left transition ${
                        selectedOccupiedSlotId === slot.id
                          ? 'ring-4 ring-orange-400/30'
                          : ''
                      } ${statusStyle[slot.status]} ${
                        slot.status === 'OCCUPIED'
                          ? 'hover:scale-[1.02]'
                          : 'cursor-default'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-mono text-sm font-black">{slot.code}</span>
                        <span className="material-symbols-outlined text-lg">
                          {slot.status === 'AVAILABLE'
                            ? 'check_circle'
                            : slot.status === 'OCCUPIED'
                              ? 'directions_car'
                              : slot.status === 'MAINTENANCE'
                                ? 'construction'
                                : 'block'}
                        </span>
                      </div>
                      <p className="mt-1 text-[10px] font-black uppercase opacity-70">{statusLabel[slot.status]}</p>
                      {slot.status === 'OCCUPIED' && (
                        <div className="mt-3 space-y-1 text-xs font-bold">
                          <p className="truncate">{slot.licensePlate || 'Unknown plate'}</p>
                          <p className="truncate opacity-70">{slot.cardCode || 'No card code'}</p>
                          <p className="opacity-70">In {formatDateTime(slot.checkInTime)}</p>
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            );
          })
        )}
      </div>

      {isMounted &&
        selectedOccupiedSlot &&
        createPortal(
          <OccupiedSlotDetailModal
            slot={selectedOccupiedSlot}
            onClose={() => setSelectedOccupiedSlotId(null)}
            onChanged={() => void loadData()}
          />,
          document.body
        )}
    </div>
  );
}

function OccupiedSlotDetailModal({
  slot,
  onClose,
  onChanged,
}: {
  slot: StaffSlot;
  onClose: () => void;
  onChanged: () => void;
}) {
  return (
    <div className="fixed left-0 top-0 z-[2147483647] h-dvh w-screen overflow-y-auto bg-[#111c2d]/55 p-4 backdrop-blur-xl">
      <button
        type="button"
        className="fixed inset-0 cursor-default"
        onClick={onClose}
        aria-label="Close slot detail backdrop"
      />
      <div className="relative mx-auto my-8 w-full max-w-5xl rounded-[2rem] border border-orange-100 bg-white p-5 shadow-2xl sm:p-6">
        <div className="flex flex-col gap-4 border-b border-slate-100 pb-5 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.35em] text-orange-600">
              Occupied slot detail
            </p>
            <h2 className="mt-2 font-mono text-4xl font-black tracking-tight text-[#111c2d]">
              {slot.licensePlate || 'Unknown plate'}
            </h2>
            <p className="mt-1 text-sm font-bold text-slate-400">
              {slot.zoneName} · {slot.code}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="self-start rounded-full bg-slate-100 p-3 text-slate-500 transition hover:bg-slate-200 hover:text-[#111c2d]"
            title="Close slot detail"
          >
            <span className="material-symbols-outlined text-2xl">close</span>
          </button>
        </div>

        <div className="mt-5 grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
          <section>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
              <DetailItem label="Slot" value={slot.code} />
              <DetailItem label="Zone" value={slot.zoneName} />
              <DetailItem label="Card" value={slot.cardCode || '—'} />
              <DetailItem label="Card status" value={slot.cardStatus || '—'} />
              <DetailItem label="Vehicle type" value={slot.vehicleTypeName || '—'} />
              <DetailItem label="Check-in" value={formatDateTime(slot.checkInTime)} />
            </div>
          </section>

          <aside>
            {slot.sessionId ? (
              <StaffIncidentSelector
                sessionId={slot.sessionId}
                licensePlate={slot.licensePlate || 'Unknown plate'}
                cardCode={slot.cardCode}
                onChanged={onChanged}
              />
            ) : (
              <div className="rounded-3xl bg-slate-50 p-5 text-sm font-bold text-slate-400">
                This slot is not matched to an active session, so incidents cannot be reported here.
              </div>
            )}
          </aside>
        </div>
      </div>
    </div>
  );
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-slate-50 p-4">
      <p className="text-[10px] font-black uppercase text-slate-400">{label}</p>
      <p className="mt-1 break-words text-base font-black text-[#111c2d]">{value}</p>
    </div>
  );
}
