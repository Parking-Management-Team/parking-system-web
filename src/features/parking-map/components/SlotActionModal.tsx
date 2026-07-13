'use client';

import React, { useState, useEffect } from 'react';
import { api, apiClient } from '@/lib/api/client';
import { BaseResponse } from '@/lib/types/building.types';
import { Slot, VehicleDto, CardDto, ParkingSessionDto } from '../types';

interface SlotActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  slot: Slot | null;
  selectedBuildingId: number | null;
  userRole?: string;
  onSlotUpdated: (
    slotId: number,
    newStatus: 'AVAILABLE' | 'OCCUPIED' | 'BLOCKED' | 'MAINTENANCE',
    assignedVehicle?: Slot['assignedVehicle']
  ) => void;
  showToastMessage: (message: string, type?: 'success' | 'error') => void;
}

export function SlotActionModal({
  isOpen,
  onClose,
  slot,
  selectedBuildingId,
  userRole,
  onSlotUpdated,
  showToastMessage
}: SlotActionModalProps) {
  // Form Allocation States
  const [vehicleSearchQuery, setVehicleSearchQuery] = useState('');
  const [searchedVehicle, setSearchedVehicle] = useState<{
    id?: number;
    plate: string;
    model: string;
    ownerName: string;
    memberId: string;
    vehicleTypeId?: number;
  } | null>(null);

  const [allocationType, setAllocationType] = useState<'monthly' | 'short'>('monthly');
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    return d.toISOString().slice(0, 16);
  });
  const [endDate, setEndDate] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() + 1);
    return d.toISOString().slice(0, 16);
  });
  const [allocationNotes, setAllocationNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [activeSlot, setActiveSlot] = useState<Slot | null>(null);
  const [futureBookingsData, setFutureBookingsData] = useState<{
    slotId: number;
    slotCode: string;
    futureBookings: any[];
    recommendedSlots: any[];
  } | null>(null);
  const [loadingFutureBookings, setLoadingFutureBookings] = useState(false);

  // Reset form states on open or slot change
  useEffect(() => {
    if (isOpen && slot) {
      setActiveSlot(slot);
      setVehicleSearchQuery('');
      setSearchedVehicle(null);
      setAllocationType('monthly');
      
      const d = new Date();
      setStartDate(d.toISOString().slice(0, 16));
      
      const d2 = new Date();
      d2.setMonth(d2.getMonth() + 1);
      setEndDate(d2.toISOString().slice(0, 16));
      
      setAllocationNotes('');
      setIsSubmitting(false);
    }
  }, [isOpen, slot]);

  // Fetch future bookings when activeSlot changes to AVAILABLE
  useEffect(() => {
    if (isOpen && activeSlot && activeSlot.status === 'AVAILABLE') {
      setLoadingFutureBookings(true);
      setFutureBookingsData(null);
      api.get<BaseResponse<any>>(`/parking-slots/${activeSlot.id}/future-bookings`)
        .then((res) => {
          if (res.success && res.data) {
            setFutureBookingsData(res.data);
          }
        })
        .catch((err) => console.error('Error fetching future bookings', err))
        .finally(() => setLoadingFutureBookings(false));
    } else {
      setFutureBookingsData(null);
    }
  }, [isOpen, activeSlot]);

  const handleSwitchSlot = async (newSlotId: number) => {
    try {
      setLoadingFutureBookings(true);
      const res = await api.get<BaseResponse<any>>(`/ParkingSlots/${newSlotId}`);
      if (res.success && res.data) {
        const s = res.data;
        const newSlot: Slot = {
          id: s.id,
          slotCode: s.code || `SLOT-${s.id}`,
          slotName: s.name,
          status: s.status === 0 || s.status === 'Available' ? 'AVAILABLE' :
                  s.status === 1 || s.status === 'Occupied' ? 'OCCUPIED' :
                  s.status === 2 || s.status === 'Blocked' ? 'BLOCKED' :
                  s.status === 3 || s.status === 'Maintenance' ? 'MAINTENANCE' :
                  'AVAILABLE',
          zoneId: s.zoneId,
          vehicleTypeId: s.vehicleTypeId,
          zoneName: activeSlot?.zoneName || '',
          slotType: activeSlot?.slotType || 'Standard',
          floorId: activeSlot?.floorId || 0,
          buildingId: activeSlot?.buildingId || 0
        };
        setActiveSlot(newSlot);
        showToastMessage(`Đã đổi sang vị trí đỗ ${newSlot.slotCode}`);
      }
    } catch (err) {
      showToastMessage('Không thể chuyển sang slot mới.', 'error');
    } finally {
      setLoadingFutureBookings(false);
    }
  };

  if (!isOpen || !slot || !activeSlot) return null;

  // Search vehicle helper
  const handleVehicleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vehicleSearchQuery.trim()) return;

    try {
      const query = vehicleSearchQuery.toUpperCase().replace(/[\s\.-]/g, '');
      const res = await api.get<BaseResponse<VehicleDto[]>>('/vehicles');
      
      let foundVehicle: VehicleDto | undefined;
      if (res.success && res.data) {
        foundVehicle = res.data.find(
          v => v.licensePlate.toUpperCase().replace(/[\s\.-]/g, '') === query
        );
      }

      if (foundVehicle) {
        setSearchedVehicle({
          id: foundVehicle.id,
          plate: foundVehicle.licensePlate,
          model: foundVehicle.vehicleTypeName || 'Registered Vehicle',
          ownerName: foundVehicle.accountId ? `Member #${foundVehicle.accountId}` : 'Registered Guest',
          memberId: foundVehicle.accountId ? `MEM-${foundVehicle.accountId}` : 'WALK-IN',
          vehicleTypeId: foundVehicle.vehicleTypeId
        });
        showToastMessage('Vehicle found successfully!');
      } else {
        // Create vehicle on-the-fly if not found
        const typeId = slot.vehicleTypeId;
        const newVehicleRes = await api.post<BaseResponse<VehicleDto>>('/vehicles', {
          vehicleTypeId: typeId,
          licensePlate: vehicleSearchQuery.toUpperCase(),
          vehicleStatus: 'ACTIVE'
        });

        if (newVehicleRes.success && newVehicleRes.data) {
          const created = newVehicleRes.data;
          setSearchedVehicle({
            id: created.id,
            plate: created.licensePlate,
            model: created.vehicleTypeName || 'Pre-Registered Vehicle',
            ownerName: 'Walk-in Customer',
            memberId: 'WALK-IN',
            vehicleTypeId: created.vehicleTypeId
          });
          showToastMessage('Vehicle not in database. Auto-registered walk-in vehicle.', 'success');
        } else {
          showToastMessage('Vehicle not found and could not register.', 'error');
        }
      }
    } catch (err) {
      console.error(err);
      showToastMessage('Error during vehicle lookup.', 'error');
    }
  };

  // Confirm Allocation Action
  const handleConfirmAllocation = async () => {
    if (!searchedVehicle || !searchedVehicle.id) {
      showToastMessage('Please search and select a vehicle first.', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      // 1. Get or create an available parking card
      let cardId = 1;
      try {
        const cardsRes = await api.get<BaseResponse<CardDto[]>>('/cards');
        if (cardsRes.success && cardsRes.data) {
          const availableCard = cardsRes.data.find(c => c.cardStatus === 'Available');
          if (availableCard) {
            cardId = availableCard.id;
          } else {
            // Create a new card on-the-fly
            const newCode = `CARD-${Date.now().toString().slice(-4)}`;
            const createCardRes = await api.post<BaseResponse<CardDto>>('/cards', {
              cardCode: newCode,
              cardType: 'PARKING_CARD',
              cardStatus: 'Available'
            });
            if (createCardRes.success && createCardRes.data) {
              cardId = createCardRes.data.id;
            }
          }
        }
      } catch (cardErr) {
        console.warn('Could not query cards from API, using default cardId = 1', cardErr);
      }

      // 2. Start a parking session on the backend
      await api.post<BaseResponse<ParkingSessionDto>>('/parking-sessions', {
        vehicleId: searchedVehicle.id,
        buildingId: selectedBuildingId,
        cardId: cardId,
        zoneId: activeSlot.zoneId,
        slotId: activeSlot.id,
        licensePlateIn: searchedVehicle.plate,
        checkInTime: new Date().toISOString()
      });

      // 3. Update the slot status to Occupied (1)
      await api.put(`/ParkingSlots/${activeSlot.id}`, {
        code: activeSlot.slotCode,
        name: activeSlot.slotName || `Slot ${activeSlot.slotCode}`,
        vehicleTypeId: activeSlot.vehicleTypeId,
        status: 1 // Occupied
      });

      // Trigger Parent callback
      onSlotUpdated(activeSlot.id, 'OCCUPIED', {
        plate: searchedVehicle.plate,
        model: searchedVehicle.model,
        ownerName: searchedVehicle.ownerName,
        memberId: searchedVehicle.memberId,
        startDate,
        endDate,
        notes: allocationNotes
      });
      
      showToastMessage(`Successfully allocated slot ${activeSlot.slotCode}!`);
      onClose();
    } catch (err) {
      console.error(err);
      showToastMessage('Could not save allocation to backend.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Release Slot / Mark Available Action
  const handleReleaseSlot = async () => {
    setIsSubmitting(true);
    try {
      // 1. Fetch active session for this slot and complete it
      const activeRes = await api.get<BaseResponse<ParkingSessionDto[]>>('/parking-sessions/active');
      if (activeRes.success && activeRes.data) {
        const session = activeRes.data.find(s => s.slotId === activeSlot.id);
        if (session) {
          await apiClient(`/parking-sessions/${session.id}/complete`, { method: 'PATCH' });
        } else {
          throw new Error('No active session found for this slot');
        }
      } else {
        throw new Error(activeRes.message || 'Could not fetch active sessions');
      }

      // Trigger Parent callback
      onSlotUpdated(activeSlot.id, 'AVAILABLE', undefined);
      showToastMessage(`Slot ${activeSlot.slotCode} is now Available.`);
      onClose();
    } catch (err) {
      console.error(err);
      showToastMessage('Could not release slot on backend.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Toggle maintenance or block status
  const handleSetStatus = async (newStatus: 'AVAILABLE' | 'BLOCKED' | 'MAINTENANCE') => {
    setIsSubmitting(true);
    try {
      let statusVal = 0; // Available
      if (newStatus === 'BLOCKED') statusVal = 2;
      else if (newStatus === 'MAINTENANCE') statusVal = 3;

      await api.put(`/ParkingSlots/${activeSlot.id}`, {
        code: activeSlot.slotCode,
        name: activeSlot.slotName || `Slot ${activeSlot.slotCode}`,
        vehicleTypeId: activeSlot.vehicleTypeId,
        status: statusVal
      });

      // Trigger Parent callback
      onSlotUpdated(activeSlot.id, newStatus, newStatus === 'AVAILABLE' ? undefined : activeSlot.assignedVehicle);
      showToastMessage(`Slot ${activeSlot.slotCode} status updated to ${newStatus}.`);
      onClose();
    } catch (err) {
      console.error(err);
      showToastMessage('Could not update status on backend.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className={`fixed inset-0 z-[60] flex items-center justify-center p-4 transition-all duration-300 ${
        isOpen ? 'opacity-100 visible' : 'opacity-0 invisible pointer-events-none'
      }`}
    >
      {/* Backdrop Overlay */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      ></div>

      {/* Modal content */}
      <div
        className={`relative w-full max-w-lg bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden transition-all duration-300 transform ${
          isOpen ? 'scale-100 opacity-100 translate-y-0' : 'scale-95 opacity-0 translate-y-4'
        } max-h-[90vh]`}
      >
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-emerald-50/30">
          <div>
            <h2 className="text-lg font-extrabold text-slate-800">
              Slot {activeSlot.slotCode}
            </h2>
            <p className="text-xs text-slate-500 font-semibold mt-0.5">
              {activeSlot.zoneName} • {activeSlot.slotType}
            </p>
          </div>
          <button
            className="p-1.5 hover:bg-slate-100 rounded-full text-slate-500"
            onClick={onClose}
          >
            <span className="material-symbols-outlined text-[20px] align-middle">close</span>
          </button>
        </div>

        {/* Body */}
        <div className="p-6 flex-grow overflow-y-auto space-y-6">
          
          {/* Drawer Mode: AVAILABLE -> New Allocation Form */}
          {activeSlot.status === 'AVAILABLE' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              {loadingFutureBookings && (
                <div className="flex items-center justify-center p-4">
                  <div className="w-5 h-5 border-2 border-emerald-650 border-t-transparent rounded-full animate-spin"></div>
                  <span className="ml-2 text-xs font-semibold text-slate-500">Checking future bookings...</span>
                </div>
              )}

              {/* Warning Banner & Recommendations */}
              {!loadingFutureBookings && futureBookingsData?.futureBookings && futureBookingsData.futureBookings.length > 0 && (
                <div className="rounded-2xl border border-amber-100 bg-amber-50/70 p-4 text-xs text-amber-800 space-y-3">
                  <div className="flex items-center gap-2 font-bold text-amber-900">
                    <span className="material-symbols-outlined text-[18px] text-amber-600">warning</span>
                    Cảnh báo: Vị trí đỗ này đã có lịch đặt trước trong tương lai!
                  </div>
                  <ul className="list-disc pl-4 space-y-1 font-semibold text-amber-700">
                    {futureBookingsData.futureBookings.map((b: any) => (
                      <li key={b.id}>
                        {new Date(b.plannedCheckinTime).toLocaleString('vi-VN')} - {new Date(b.plannedCheckoutTime).toLocaleString('vi-VN')}
                      </li>
                    ))}
                  </ul>
                  {futureBookingsData.recommendedSlots && futureBookingsData.recommendedSlots.length > 0 && (
                    <div className="pt-2 border-t border-amber-200/50">
                      <p className="font-bold text-amber-900 mb-2">Đề xuất các vị trí trống khác an toàn hơn:</p>
                      <div className="flex flex-wrap gap-2">
                        {futureBookingsData.recommendedSlots.map((rec: any) => (
                          <button
                            key={rec.slotId}
                            type="button"
                            onClick={() => handleSwitchSlot(rec.slotId)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white border border-amber-250 hover:border-amber-400 hover:bg-amber-100/55 transition font-black text-amber-900 shadow-sm"
                          >
                            <span className="material-symbols-outlined text-sm text-amber-650">swap_horiz</span>
                            {rec.slotCode}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="bg-emerald-50/50 p-4 rounded-xl border border-emerald-500/10 flex items-start gap-3">
                <span className="material-symbols-outlined text-emerald-600 mt-0.5">add_circle</span>
                <div>
                  <h4 className="text-sm font-bold text-[#006d43]">New Allocation</h4>
                  <p className="text-xs text-slate-500 mt-0.5">Fill in vehicle details to assign this bay.</p>
                </div>
              </div>

              <div className="space-y-4">
                {/* Search vehicle input */}
                <form onSubmit={handleVehicleSearch} className="space-y-2">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide">
                    Search Vehicle License Plate
                  </label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">
                        directions_car
                      </span>
                      <input
                        type="text"
                        value={vehicleSearchQuery}
                        onChange={(e) => setVehicleSearchQuery(e.target.value)}
                        placeholder="e.g. 29A-123.45"
                        className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:ring-1 focus:ring-emerald-500/30 focus:border-emerald-500 focus:outline-none font-medium"
                      />
                    </div>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 text-sm font-bold rounded-lg transition-colors"
                    >
                      Search
                    </button>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">Tip: Type plate containing &quot;29A&quot; to fetch test vehicle.</p>
                </form>

                {/* Selected Vehicle Card */}
                {searchedVehicle ? (
                  <div className="bg-emerald-50/10 border border-emerald-500/20 rounded-xl p-4 space-y-2.5 relative">
                    <button
                      onClick={() => setSearchedVehicle(null)}
                      className="absolute top-3 right-3 text-slate-400 hover:text-slate-650"
                    >
                      <span className="material-symbols-outlined text-[16px]">close</span>
                    </button>
                    <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">Target Vehicle</p>
                    <div>
                      <h4 className="text-sm font-extrabold text-slate-800">{searchedVehicle.plate}</h4>
                      <p className="text-xs text-slate-500">{searchedVehicle.model}</p>
                    </div>
                    <div className="flex gap-4 pt-2 border-t border-slate-100 text-xs text-slate-600">
                      <span>Owner: <strong>{searchedVehicle.ownerName}</strong></span>
                      <span>ID: <strong>{searchedVehicle.memberId}</strong></span>
                    </div>
                  </div>
                ) : (
                  <div className="bg-slate-50 border border-dashed border-slate-200 rounded-xl p-6 text-center">
                    <span className="material-symbols-outlined text-slate-350 text-3xl mb-1.5">directions_car_filled</span>
                    <p className="text-xs text-slate-400 font-medium">Please search a vehicle to assign this slot.</p>
                  </div>
                )}

                {/* Allocation parameters */}
                <div className="grid grid-cols-2 gap-4 pt-2">
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Allocation Type</label>
                    <select
                      value={allocationType}
                      onChange={(e) => setAllocationType(e.target.value as 'monthly' | 'short')}
                      className="w-full border border-slate-200 rounded-lg py-2 px-3 text-sm focus:ring-1 focus:ring-emerald-500/30 focus:border-emerald-500 text-slate-600 focus:outline-none"
                    >
                      <option value="monthly">Monthly Pass</option>
                      <option value="short">Short stay</option>
                    </select>
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Priority</label>
                    <select className="w-full border border-slate-200 rounded-lg py-2 px-3 text-sm focus:ring-1 focus:ring-emerald-500/30 focus:border-emerald-500 text-slate-600 focus:outline-none">
                      <option>Normal</option>
                      <option>High</option>
                      <option>Critical</option>
                    </select>
                  </div>
                </div>

                <div className="flex flex-col gap-1 pt-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Date Range</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="datetime-local"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full border border-slate-200 rounded-lg py-2 px-3 text-xs focus:ring-1 focus:ring-emerald-500/30 focus:border-emerald-500 focus:outline-none text-slate-600"
                    />
                    <span className="text-slate-400 text-xs font-bold">to</span>
                    <input
                      type="datetime-local"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full border border-slate-200 rounded-lg py-2 px-3 text-xs focus:ring-1 focus:ring-emerald-500/30 focus:border-emerald-500 focus:outline-none text-slate-600"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1 pt-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Operational Notes</label>
                  <textarea
                    value={allocationNotes}
                    onChange={(e) => setAllocationNotes(e.target.value)}
                    placeholder="Add any specific requirements or remarks..."
                    rows={3}
                    className="w-full border border-slate-200 rounded-lg py-2.5 px-3 text-sm focus:ring-1 focus:ring-emerald-500/30 focus:border-emerald-500 focus:outline-none resize-none text-slate-700"
                  />
                </div>
                
                {/* Administrative Actions */}
                {userRole === 'MANAGER' && (
                  <div className="pt-4 border-t border-slate-100 space-y-3">
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">
                      Administrative Controls
                    </label>
                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={() => handleSetStatus('MAINTENANCE')}
                        disabled={isSubmitting}
                        className="flex-1 py-2.5 px-3 text-white bg-[#d97706] hover:bg-amber-700 hover:brightness-110 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-md shadow-amber-500/10 disabled:opacity-50"
                      >
                        <span className="material-symbols-outlined text-[16px]">build</span>
                        Set Maintenance
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSetStatus('BLOCKED')}
                        disabled={isSubmitting}
                        className="flex-1 py-2.5 px-3 text-white bg-[#ba1a1a] hover:bg-red-700 hover:brightness-110 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-md shadow-red-500/10 disabled:opacity-50"
                      >
                        <span className="material-symbols-outlined text-[16px]">block</span>
                        Block Slot
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Drawer Mode: OCCUPIED -> Details and Actions */}
          {activeSlot.status === 'OCCUPIED' && activeSlot.assignedVehicle && (
            <div className="space-y-6 animate-in fade-in duration-150">
              <div className="bg-slate-50 border border-slate-200/60 rounded-2xl p-5 space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Parked Vehicle</p>
                    <h3 className="text-xl font-black text-slate-800 tracking-tight mt-0.5">{activeSlot.assignedVehicle.plate}</h3>
                    <p className="text-xs text-slate-500 font-semibold">{activeSlot.assignedVehicle.model}</p>
                  </div>
                  <span className="px-2.5 py-1 bg-slate-200/60 text-slate-700 font-bold rounded-lg text-[10px] uppercase tracking-wide">
                    Occupied
                  </span>
                </div>

                <div className="border-t border-slate-200/50 pt-4 grid grid-cols-2 gap-y-3 gap-x-4 text-xs">
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Driver / Owner</p>
                    <p className="font-semibold text-slate-700 mt-0.5">{activeSlot.assignedVehicle.ownerName}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Member ID</p>
                    <p className="font-semibold text-slate-700 mt-0.5">{activeSlot.assignedVehicle.memberId}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Parked Since</p>
                    <p className="font-semibold text-slate-700 mt-0.5">
                      {activeSlot.assignedVehicle.startDate
                        ? new Date(activeSlot.assignedVehicle.startDate).toLocaleString()
                        : 'N/A'}
                    </p>
                  </div>
                </div>

                {activeSlot.assignedVehicle.notes && (
                  <div className="bg-amber-50/30 border border-amber-200/20 p-4 rounded-xl">
                    <p className="text-[10px] font-bold text-amber-700 uppercase tracking-wider">Staff Note</p>
                    <p className="text-xs text-slate-600 mt-1 italic">{activeSlot.assignedVehicle.notes}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Drawer Mode: BLOCKED or MAINTENANCE -> Action Panel */}
          {(activeSlot.status === 'BLOCKED' || activeSlot.status === 'MAINTENANCE') && (
            <div className="space-y-6 animate-in fade-in duration-150">
              <div className="bg-red-50/30 p-5 rounded-2xl border border-red-500/10 flex items-start gap-4">
                <span className={`material-symbols-outlined text-2xl mt-0.5 ${activeSlot.status === 'BLOCKED' ? 'text-red-650' : 'text-amber-500'}`}>
                  {activeSlot.status === 'BLOCKED' ? 'block' : 'lock_clock'}
                </span>
                <div>
                  <h4 className="text-sm font-extrabold text-slate-800 uppercase tracking-wide">
                    Slot currently {activeSlot.status}
                  </h4>
                  <p className="text-xs text-slate-500 mt-1">
                    This parking bay has been marked out of service for operations/maintenance. It cannot be assigned or utilized by check-in sessions.
                  </p>
                </div>
              </div>
              
              {/* Administrative Actions */}
              {userRole === 'MANAGER' && (
                <div className="pt-4 border-t border-slate-100 space-y-2">
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Switch Status
                  </label>
                  <button
                    type="button"
                    onClick={() => handleSetStatus(activeSlot.status === 'BLOCKED' ? 'MAINTENANCE' : 'BLOCKED')}
                    disabled={isSubmitting}
                    className={`w-full py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all text-white hover:brightness-110 shadow-md disabled:opacity-50 ${
                      activeSlot.status === 'BLOCKED'
                        ? 'bg-[#d97706] hover:bg-amber-700 shadow-amber-500/10'
                        : 'bg-[#ba1a1a] hover:bg-red-700 shadow-red-500/10'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[16px]">
                      {activeSlot.status === 'BLOCKED' ? 'build' : 'block'}
                    </span>
                    Change to {activeSlot.status === 'BLOCKED' ? 'MAINTENANCE' : 'BLOCKED'}
                  </button>
                </div>
              )}
            </div>
          )}

        </div>

        {/* Footer Actions */}
        <div className="p-6 border-t border-slate-100 bg-slate-50/70 flex gap-3">
          {activeSlot.status === 'AVAILABLE' && (
            <>
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-3 border border-slate-200 rounded-xl font-bold text-sm text-slate-500 hover:bg-white transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmAllocation}
                disabled={isSubmitting || !searchedVehicle}
                className="flex-1 py-3 bg-[#006d43] hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl font-bold text-sm shadow-md shadow-emerald-500/10 flex items-center justify-center gap-2 transition-all"
              >
                {isSubmitting ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  'Confirm'
                )}
              </button>
            </>
          )}

          {activeSlot.status === 'OCCUPIED' && (
            <>
              <button
                onClick={() => handleSetStatus('MAINTENANCE')}
                disabled={isSubmitting}
                className="flex-1 py-3 border border-slate-200 hover:bg-white text-slate-600 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-[16px]">build</span>
                Maintain
              </button>
              <button
                onClick={handleReleaseSlot}
                disabled={isSubmitting}
                className="flex-[2] py-3 bg-red-650 hover:bg-red-700 disabled:opacity-50 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-md shadow-red-500/10"
              >
                {isSubmitting ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-[16px]">logout</span>
                    Release Slot
                  </>
                )}
              </button>
            </>
          )}

          {(activeSlot.status === 'BLOCKED' || activeSlot.status === 'MAINTENANCE') && (
            <>
              <button
                onClick={onClose}
                className="flex-1 py-3 border border-slate-200 rounded-xl font-bold text-sm text-slate-500 hover:bg-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleSetStatus('AVAILABLE')}
                disabled={isSubmitting}
                className="flex-[2] py-3 bg-[#006d43] hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-md shadow-emerald-500/10"
              >
                {isSubmitting ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-[18px]">verified</span>
                    Set Available
                  </>
                )}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
