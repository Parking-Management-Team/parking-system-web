/**
 * ===================================================================================
 * 🚘 FE COMPONENT: DriverVehicles.tsx (Quản Lý Phương Tiện / Vehicle Management)
 * ===================================================================================
 * 
 * 📌 VAI TRÒ & CHỨC NĂNG CHÍNH TRÊN UI:
 * - Quản lý danh sách phương tiện cá nhân của tài xế (Ô tô, Xe máy).
 * - Render thẻ xe trực quan: Biển số, loại xe, model/hãng xe, màu sơn (badge màu hex), trạng thái xe (Đang gửi trong bãi / Đã ra ngoài).
 * - Modal Thêm phương tiện mới (Add Vehicle Modal) với kiểm tra định dạng biển số Việt Nam.
 * - Modal Xóa phương tiện (Delete Vehicle).
 * - Xem nhật ký lượt gửi xe liên quan tới từng xe cụ thể.
 * 
 * ⚙️ KẾT NỐI API BACKEND (ASP.NET Core Controllers):
 * - GET    /vehicles?accountId={accountId}   --> Lấy danh sách xe của tài xế (VehiclesController.cs)
 * - GET    /VehicleTypes                     --> Lấy danh mục loại xe: Ô tô (1), Xe máy (2) (VehicleTypeController.cs)
 * - POST   /vehicles                         --> Đăng ký thêm phương tiện mới (VehiclesController.cs)
 * - PUT    /vehicles/{id}                    --> Cập nhật thông tin xe (VehiclesController.cs)
 * - DELETE /vehicles/{id}                    --> Xóa phương tiện khỏi hệ thống (VehiclesController.cs)
 * 
 * 🗄️ BẢNG DATABASE LIÊN QUAN (PostgreSQL):
 * - Vehicles     (Id, LicensePlate, VehicleTypeId, Model, Color, ColorHex, AccountId)
 * - VehicleTypes (Id, Name, Description)
 * 
 * 🔄 LUỒNG CẬP NHẬT DỮ LIỆU & RENDER UI:
 * 1. Mounting: Hook `useVehicles()` tự động nạp danh sách xe và trạng thái đỗ từ API.
 * 2. Đăng ký xe mới: Người dùng submit form -> Gọi `POST /vehicles` -> Nhận phản hồi -> Reload danh sách xe -> Toast notification thành công.
 * 3. Render Card: Mảng xe được render bằng `.map()`, trạng thái đỗ được đối chiếu với `activeSession`.
 * ===================================================================================
 */

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '@/features/auth';
import { api } from '@/lib/api/client';
import { formatPlate, detectVehicleTypeFromPlate } from '@/lib/utils/format';
import { 
  Plus, 
  Trash2, 
  CheckCircle, 
  AlertCircle, 
  X, 
  Loader2,
  RefreshCw,
  ShieldCheck
} from 'lucide-react';

interface VehicleType {
  id: number;
  name: string;
  description?: string;
}

interface Vehicle {
  id: number;
  licensePlate: string;
  vehicleTypeName?: string;
  vehicleTypeId?: number;
  accountId?: number;
  registeredAt?: string;
}

// ─── Regex chuẩn biển số Việt Nam ────────────────────────────────────────────
// Dạng: 2 chữ số + 1-2 chữ hoa + 4-5 chữ số (sau khi strip ký tự không phải A-Z0-9)
// Ví dụ hợp lệ: 30A12345, 59AB1234, 29G1234, 51F12345
const VN_PLATE_REGEX = /^\d{2}[A-Z]{1,2}\d{4,5}$/;

function normalizePlateForValidation(raw: string): string {
  return raw.toUpperCase().replace(/[^A-Z0-9]/g, '');
}

function isValidVnPlate(raw: string): boolean {
  return VN_PLATE_REGEX.test(normalizePlateForValidation(raw));
}

export default function DriverVehicles() {
  const { user, showToast } = useAuth();

  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [vehicleTypes, setVehicleTypes] = useState<VehicleType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  // Add Vehicle Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [addPlate, setAddPlate] = useState('');
  const [addTypeId, setAddTypeId] = useState<number | ''>('');
  const [isSaving, setIsSaving] = useState(false);

  // Real-time plate validation state
  const [plateError, setPlateError] = useState<string>('');

  // Auto-detect vehicle type based on license plate input
  useEffect(() => {
    if (!addPlate.trim() || vehicleTypes.length === 0) return;
    const detected = detectVehicleTypeFromPlate(addPlate);
    
    // Find matching vehicle type in the list
    const matchedType = vehicleTypes.find(t => {
      const name = t.name.toLowerCase();
      if (detected === 'Motorcycle') {
        return name.includes('motor') || name.includes('bike') || name.includes('scoot') || name.includes('máy');
      } else {
        // For Car, make sure it is NOT a motorcycle
        return !(name.includes('motor') || name.includes('bike') || name.includes('scoot') || name.includes('máy'));
      }
    });

    if (matchedType) {
      setAddTypeId(matchedType.id);
    }
  }, [addPlate, vehicleTypes]);

  // Real-time plate validation
  useEffect(() => {
    if (!addPlate.trim()) {
      setPlateError('');
      return;
    }
    if (!isValidVnPlate(addPlate)) {
      setPlateError('Invalid format. Vietnamese plates: 2 digits + 1–2 letters + 4–5 digits (e.g. 30A-123.45 or 59AB-1234)');
    } else {
      setPlateError('');
    }
  }, [addPlate]);

  // Delete confirm modal
  const [deleteVehicleId, setDeleteVehicleId] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchData = useCallback(async () => {
    if (!user?.id) return;
    setIsLoading(true);
    try {
      // Fetch vehicles
      const vehRes = await api.get<any>(`/vehicles?accountId=${user.id}`);
      if (vehRes.success && Array.isArray(vehRes.data)) {
        setVehicles(vehRes.data);
      } else {
        setVehicles([]);
      }

      // Fetch vehicle types
      try {
        const typRes = await api.get<any>('/vehicle-types');
        if (typRes.success && Array.isArray(typRes.data)) {
          setVehicleTypes(typRes.data);
        } else {
          // Try alternate endpoint
          const typRes2 = await api.get<any>('/VehicleTypes');
          if (typRes2.success && Array.isArray(typRes2.data)) {
            setVehicleTypes(typRes2.data);
          }
        }
      } catch {
        // Fallback vehicle types
        setVehicleTypes([
          { id: 1, name: 'Motorcycle', description: 'Motorbikes & scooters' },
          { id: 2, name: 'Car', description: 'Sedans, SUVs, hatchbacks' },
          { id: 3, name: 'Truck', description: 'Pickup trucks & vans' },
          { id: 4, name: 'Electric Vehicle', description: 'EVs with charging needs' },
        ]);
      }
    } catch (err) {
      console.error('Error loading vehicles:', err);
      setVehicles([]);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleAddVehicle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addPlate.trim()) {
      showToast('Please enter a license plate.', 'error');
      return;
    }
    if (!addTypeId) {
      showToast('Please select a vehicle type.', 'error');
      return;
    }

    // ── Mục 2: Validate format biển số trước khi gọi API ──────────────────
    const normalized = normalizePlateForValidation(addPlate);
    if (!VN_PLATE_REGEX.test(normalized)) {
      showToast(
        'Invalid Vietnamese plate format. Example: 30A-123.45 or 59AB-1234.',
        'error'
      );
      return;
    }

    // ── Mục 2: Validate loại xe vs biển số (detect mismatch) ──────────────
    const detected = detectVehicleTypeFromPlate(addPlate);
    const selectedType = vehicleTypes.find(t => t.id === Number(addTypeId));
    const selectedName = selectedType?.name?.toLowerCase() ?? '';
    const isSelectedMotorcycle =
      selectedName.includes('motor') ||
      selectedName.includes('bike') ||
      selectedName.includes('scoot') ||
      selectedName.includes('máy');

    if (detected === 'Motorcycle' && !isSelectedMotorcycle) {
      showToast(
        'This plate format is for a Motorcycle. Please select Motorcycle as the vehicle type.',
        'error'
      );
      return;
    }
    if (detected === 'Car' && isSelectedMotorcycle) {
      showToast(
        'This plate format is for a Car/Truck. Please select Car as the vehicle type.',
        'error'
      );
      return;
    }

    setIsSaving(true);
    try {
      await api.post('/vehicles', {
        licensePlate: normalized,
        vehicleTypeId: Number(addTypeId),
        accountId: user?.id,
      });
      showToast('Vehicle registered successfully!', 'success');
      setShowAddModal(false);
      setAddPlate('');
      setAddTypeId('');
      setPlateError('');
      fetchData();
    } catch (err: any) {
      console.error('Error adding vehicle:', err);
      // ── Mục 3: Surface BE error (e.g. LICENSE_PLATE_EXISTS) rõ ràng ────
      const msg = err?.data?.message || err?.message || 'Failed to register vehicle.';
      showToast(msg, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteVehicle = async () => {
    if (!deleteVehicleId) return;
    setIsDeleting(true);
    try {
      await api.delete(`/vehicles/${deleteVehicleId}`);
      showToast('Vehicle removed successfully.', 'info');
      setDeleteVehicleId(null);
      fetchData();
    } catch (err: any) {
      console.error('Error deleting vehicle:', err);
      // Surface the actual API error message when available
      const apiMsg = err?.data?.message || err?.message || '';
      showToast(
        apiMsg
          ? `Failed to remove vehicle: ${apiMsg}`
          : 'Failed to remove vehicle. It may have an active booking or session.',
        'error'
      );
    } finally {
      setIsDeleting(false);
    }
  };

  const getTypeIcon = (name?: string) => {
    if (!name) return '🚗';
    const n = name.toLowerCase();
    if (n.includes('motor') || n.includes('bike') || n.includes('scoot')) return '🏍️';
    if (n.includes('truck') || n.includes('van')) return '🚛';
    if (n.includes('electric') || n.includes('ev')) return '⚡';
    return '🚗';
  };

  return (
    <div className="p-8 max-w-[1000px] mx-auto space-y-6">
      
      {/* PAGE HEADER */}
      <section className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">My Vehicles</h1>
          <p className="text-sm text-slate-400 mt-1">Register and manage all your vehicles for parking access.</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => fetchData()}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-600 text-xs font-bold rounded-xl shadow-xs transition-all"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>

      </section>

      {/* INFO BANNER */}
      <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl flex items-start gap-3 text-blue-800">
        <ShieldCheck className="w-5 h-5 shrink-0 mt-0.5 text-blue-600" />
        <div className="text-xs">
          <p className="font-bold">Registered plates are used for automatic gate recognition.</p>
          <p className="text-blue-600 mt-0.5">Ensure your license plate is correct and matches your physical vehicle plate.</p>
        </div>
      </div>

      {/* VEHICLES GRID */}
      {isLoading ? (
        <div className="py-20 flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
          <p className="text-xs text-slate-400">Loading your vehicles...</p>
        </div>
      ) : vehicles.length === 0 ? (
        <div className="bg-white border border-[#e2e8f0] rounded-2xl p-16 text-center space-y-4 shadow-sm">
          <div className="w-16 h-16 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-center mx-auto text-3xl">
            🚗
          </div>
          <h3 className="font-bold text-slate-700">No Vehicles Registered</h3>
          <p className="text-xs text-slate-400 max-w-xs mx-auto">Register your vehicle to enable auto gate access, QR check-in, and slot booking.</p>
          <button 
            onClick={() => setShowAddModal(true)}
            className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-sm transition-all inline-flex items-center gap-1.5 mt-2"
          >
            <Plus className="w-4 h-4" />
            Register First Vehicle
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {vehicles.map((vehicle) => (
            <div
              key={vehicle.id}
              className="bg-white border border-[#e2e8f0] rounded-2xl p-6 shadow-sm hover:shadow-md transition-all"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-slate-50 border border-[#e2e8f0] rounded-2xl flex items-center justify-center text-2xl shrink-0">
                    {getTypeIcon(vehicle.vehicleTypeName)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-extrabold text-[#1B2A41] text-lg font-mono tracking-wide">
                        {formatPlate(vehicle.licensePlate)}
                      </h3>
                    </div>
                    <span className="inline-block mt-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200/50 px-2 py-0.5 rounded-full uppercase tracking-wide">
                      {vehicle.vehicleTypeName || 'Vehicle'}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  {/* Mục 1: Nút "Set as Default" đã được xoá */}
                  <button
                    onClick={() => setDeleteVehicleId(vehicle.id)}
                    className="p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all"
                    title="Remove vehicle"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="mt-5 pt-4 border-t border-slate-100 flex items-center gap-2 text-xs text-slate-500">
                <CheckCircle className="w-4 h-4 text-emerald-500" />
                <span className="font-medium">Verified · Gate recognition active</span>
                {vehicle.registeredAt && (
                  <span className="ml-auto text-slate-300 font-mono">
                    Since {new Date(vehicle.registeredAt).toLocaleDateString()}
                  </span>
                )}
              </div>
            </div>
          ))}

          {/* Add new vehicle card */}
          <button
            onClick={() => { setAddPlate(''); setAddTypeId(''); setPlateError(''); setShowAddModal(true); }}
            className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl p-6 flex flex-col items-center justify-center gap-3 text-slate-400 hover:border-emerald-500/50 hover:text-emerald-600 hover:bg-emerald-50/20 transition-all group min-h-[140px]"
          >
            <div className="w-12 h-12 rounded-2xl border-2 border-dashed border-slate-300 group-hover:border-emerald-500/50 flex items-center justify-center transition-all">
              <Plus className="w-6 h-6" />
            </div>
            <span className="text-xs font-bold">Register New Vehicle</span>
          </button>
        </div>
      )}

      {/* ── ADD VEHICLE MODAL ── */}
      {mounted && showAddModal && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-xl overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-start">
              <div>
                <h3 className="font-bold text-slate-800">Register New Vehicle</h3>
                <p className="text-xs text-slate-400 mt-1">Enter the license plate and vehicle type to register.</p>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 hover:bg-slate-100 rounded-lg text-slate-400 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddVehicle} className="p-6 space-y-5">
              {/* License Plate — Mục 2: Thêm real-time validation hint */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wide">
                  License Plate *
                </label>
                <input
                  type="text"
                  value={addPlate}
                  onChange={(e) => setAddPlate(e.target.value)}
                  placeholder="e.g. 30A-123.45"
                  maxLength={20}
                  required
                  className={`w-full px-4 py-3 border focus:outline-none focus:ring-2 text-sm font-mono font-bold rounded-xl uppercase tracking-wider transition-colors ${
                    plateError
                      ? 'border-rose-400 focus:ring-rose-500/20 focus:border-rose-500 bg-rose-50/30'
                      : addPlate && !plateError
                        ? 'border-emerald-400 focus:ring-emerald-500/20 focus:border-emerald-600 bg-emerald-50/20'
                        : 'border-slate-200 focus:ring-emerald-500/20 focus:border-emerald-600'
                  }`}
                />
                {/* Inline validation feedback */}
                {plateError ? (
                  <p className="text-[11px] text-rose-600 flex items-start gap-1.5 mt-1">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                    {plateError}
                  </p>
                ) : addPlate && !plateError ? (
                  <p className="text-[11px] text-emerald-600 flex items-center gap-1.5 mt-1">
                    <CheckCircle className="w-3.5 h-3.5 shrink-0" />
                    Valid Vietnamese plate format.
                  </p>
                ) : (
                  <p className="text-[10px] text-slate-400">
                    Format: 2 digits + 1–2 letters + 4–5 digits (e.g. <span className="font-mono font-semibold">30A-123.45</span> or <span className="font-mono font-semibold">59AB-1234</span>)
                  </p>
                )}
              </div>

              {/* Vehicle Type */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wide">
                  Vehicle Type *
                </label>
                {vehicleTypes.length > 0 ? (
                  <select
                    value={addTypeId}
                    onChange={(e) => setAddTypeId(Number(e.target.value))}
                    required
                    className="w-full px-4 py-3 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 text-sm font-bold rounded-xl bg-white text-slate-700"
                  >
                    <option value="">Select a type...</option>
                    {vehicleTypes.map(t => (
                      <option key={t.id} value={t.id}>
                        {getTypeIcon(t.name)} {t.name}
                        {t.description ? ` — ${t.description}` : ''}
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="flex items-center gap-2 py-2 text-xs text-amber-700">
                    <AlertCircle className="w-4 h-4 text-amber-500" />
                    <span>Could not load vehicle types. Please try again.</span>
                  </div>
                )}
              </div>

              {/* Warning */}
              <div className="p-3 bg-amber-50 border border-amber-100 rounded-xl text-amber-800 text-xs flex gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
                <span>Make sure the license plate is correct. An incorrect plate may prevent gate access.</span>
              </div>

              {/* Buttons */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  disabled={isSaving}
                  className="flex-1 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-bold rounded-xl transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving || !addPlate || !addTypeId || !!plateError}
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  {isSaving ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Registering...</> : 'Register Vehicle'}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* ── DELETE CONFIRM MODAL ── */}
      {mounted && deleteVehicleId !== null && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-sm rounded-2xl shadow-xl overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-100">
              <h3 className="font-bold text-slate-800">Remove Vehicle?</h3>
              <p className="text-xs text-slate-400 mt-1">This vehicle will be de-registered. You won't be able to use it for parking access.</p>
            </div>
            <div className="p-6 flex gap-3">
              <button
                onClick={() => setDeleteVehicleId(null)}
                disabled={isDeleting}
                className="flex-1 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-bold rounded-xl transition-all"
              >
                Keep Vehicle
              </button>
              <button
                onClick={handleDeleteVehicle}
                disabled={isDeleting}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                {isDeleting ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Removing...</> : 'Yes, Remove'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

    </div>
  );
}
