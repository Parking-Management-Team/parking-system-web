import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/features/auth';
import { useSearchParams } from 'next/navigation';
import { api } from '@/lib/api/client';
import { ActivityLog, VehicleInfo } from '../types';

/**
 * Custom hook quản lý toàn bộ logic nghiệp vụ (state, timers, modals, API thực tế) của quản lý chi tiết xe (Vehicles)
 */
export function useVehicles() {
  const { user } = useAuth();
  const searchParams = useSearchParams();

  // Selected vehicle parameters from URL query parameters
  const vehicleId = searchParams?.get('id');
  const licensePlateFromUrl = searchParams?.get('licensePlate') || searchParams?.get('plate');

  const [loading, setLoading] = useState(true);
  const [vehicle, setVehicle] = useState<VehicleInfo | null>(null);
  const [isParked, setIsParked] = useState(false);
  const [parkedSlot, setParkedSlot] = useState('None');
  const [secondsElapsed, setSecondsElapsed] = useState(0);
  const [logs, setLogs] = useState<ActivityLog[]>([]);

  // Modals state
  const [showViolationModal, setShowViolationModal] = useState(false);
  const [showTicketModal, setShowTicketModal] = useState(false);
  const [violationReason, setViolationReason] = useState('Parking Out of Line');
  const [violationNotes, setViolationNotes] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const formatDuration = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const secs = Math.floor(totalSeconds % 60);
    return `${String(hours).padStart(2, '0')}h ${String(minutes).padStart(2, '0')}m ${String(secs).padStart(2, '0')}s`;
  };

  // Load real vehicle, session, and logs from Supabase API
  const loadVehicleDetails = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      // 1. Fetch vehicles of this user (if driver) or all vehicles (if manager/staff)
      const url = user.role === 'DRIVER' ? `/vehicles?accountId=${user.id}` : '/vehicles';
      const vehRes = await api.get<any>(url);
      
      let selectedVeh: any = null;
      if (vehRes.success && Array.isArray(vehRes.data)) {
        if (vehicleId) {
          selectedVeh = vehRes.data.find((v: any) => v.id.toString() === vehicleId);
        } else if (licensePlateFromUrl) {
          selectedVeh = vehRes.data.find((v: any) => v.licensePlate === licensePlateFromUrl);
        } else if (vehRes.data.length > 0) {
          // Default to the first vehicle if no parameters are present
          selectedVeh = vehRes.data[0];
        }
      }

      if (!selectedVeh) {
        setVehicle(null);
        setIsParked(false);
        setParkedSlot('None');
        setSecondsElapsed(0);
        setLogs([]);
        setLoading(false);
        return;
      }

      // Map to VehicleInfo
      const mappedVeh: VehicleInfo = {
        licensePlate: selectedVeh.licensePlate,
        model: selectedVeh.model || 'Toyota Camry', // Fallback display details if empty
        color: selectedVeh.color || 'Silver',
        colorHex: selectedVeh.colorHex || '#94a3b8',
        entryTime: '—',
        type: selectedVeh.vehicleTypeName || 'Car',
        ticketNo: '—',
        rateTier: 'Standard'
      };

      // 2. Fetch active sessions to check if this vehicle is currently parked
      const activeRes = await api.get<any>('/parking-sessions/active');
      let activeSession: any = null;
      if (activeRes.success && Array.isArray(activeRes.data)) {
        activeSession = activeRes.data.find(
          (s: any) => s.licensePlateIn === selectedVeh.licensePlate || s.vehicleId === selectedVeh.id
        );
      }

      if (activeSession) {
        setIsParked(true);
        setParkedSlot(activeSession.slotCode || `Slot #${activeSession.slotId}`);
        mappedVeh.entryTime = new Date(activeSession.checkInTime).toLocaleString('vi-VN');
        mappedVeh.ticketNo = `TKT-${activeSession.id}`;
        
        // Calculate dynamic elapsed time
        const checkIn = new Date(activeSession.checkInTime).getTime();
        const diffSecs = Math.max(0, Math.floor((Date.now() - checkIn) / 1000));
        setSecondsElapsed(diffSecs);
      } else {
        setIsParked(false);
        setParkedSlot('None');
        setSecondsElapsed(0);
      }

      setVehicle(mappedVeh);

      // 3. Fetch activity logs (all sessions for this vehicle)
      const allSessionsRes = await api.get<any>('/parking-sessions');
      if (allSessionsRes.success && Array.isArray(allSessionsRes.data)) {
        const vehicleSessions = allSessionsRes.data.filter(
          (s: any) => s.licensePlateIn === selectedVeh.licensePlate || s.vehicleId === selectedVeh.id
        );

        // Sort by check-in time descending
        vehicleSessions.sort((a: any, b: any) => b.checkInTime.localeCompare(a.checkInTime));

        const mappedLogs: ActivityLog[] = vehicleSessions.map((s: any) => {
          let durationStr = '—';
          if (s.checkInTime && s.checkOutTime) {
            const diffMs = new Date(s.checkOutTime).getTime() - new Date(s.checkInTime).getTime();
            if (diffMs > 0) {
              const h = Math.floor(diffMs / 3600000);
              const m = Math.floor((diffMs % 3600000) / 60000);
              durationStr = `${h}h ${m}m`;
            }
          }
          return {
            timestamp: new Date(s.checkInTime).toLocaleString('vi-VN'),
            activity: s.sessionStatus === 'ACTIVE' ? 'Entry' : 'Exit',
            location: s.slotCode ? `Slot ${s.slotCode}` : 'Main Gate',
            duration: durationStr
          };
        });

        setLogs(mappedLogs);
      } else {
        setLogs([]);
      }
    } catch (err) {
      console.error('Error loading vehicle details:', err);
    } finally {
      setLoading(false);
    }
  }, [user, vehicleId, licensePlateFromUrl]);

  useEffect(() => {
    loadVehicleDetails();
  }, [loadVehicleDetails]);

  // Parking timer loop
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isParked) {
      timer = setInterval(() => {
        setSecondsElapsed(prev => prev + 1);
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isParked]);

  // Release Slot
  const handleReleaseSlot = async () => {
    if (!isParked || !vehicle) return;
    const confirmRelease = window.confirm(`Bạn có chắc chắn muốn giải phóng chỗ đỗ cho xe ${vehicle.licensePlate}?`);
    if (confirmRelease) {
      try {
        const activeRes = await api.get<any>('/parking-sessions/active');
        if (activeRes.success && Array.isArray(activeRes.data)) {
          const activeSession = activeRes.data.find(
            (s: any) => s.licensePlateIn === vehicle.licensePlate
          );
          if (activeSession) {
            await api.patch(`/parking-sessions/${activeSession.id}/complete`, {});
            triggerToast('Đã giải phóng chỗ đỗ thành công!');
            loadVehicleDetails();
          }
        }
      } catch (err) {
        console.error('Lỗi giải phóng chỗ đỗ:', err);
        triggerToast('Không thể giải phóng chỗ đỗ.');
      }
    }
  };

  // Submit Violation (Incidents)
  const submitViolation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vehicle) return;

    try {
      const activeRes = await api.get<any>('/parking-sessions/active');
      if (activeRes.success && Array.isArray(activeRes.data)) {
        const activeSession = activeRes.data.find(
          (s: any) => s.licensePlateIn === vehicle.licensePlate
        );
        if (activeSession) {
          const typeRes = await api.get<any>('/IncidentType');
          let typeId = 1;
          if (typeRes.success && Array.isArray(typeRes.data)) {
            const foundType = typeRes.data.find(
              (t: any) => t.incidentCode === 'WRONG_LANE' || t.incidentName.includes(violationReason)
            );
            if (foundType) typeId = foundType.id;
          }

          await api.post('/Incident', {
            sessionId: activeSession.id,
            incidentTypeId: typeId,
            description: violationReason + (violationNotes ? `: ${violationNotes}` : '')
          });

          setShowViolationModal(false);
          triggerToast(`Đã ghi nhận báo cáo sự cố vi phạm: ${violationReason}!`);
          loadVehicleDetails();
        } else {
          triggerToast('Xe này không ở trong phiên đỗ hoạt động.');
        }
      }
    } catch (err) {
      console.error('Lỗi báo cáo vi phạm:', err);
      triggerToast('Gặp lỗi khi lưu báo cáo vi phạm.');
    }
  };

  return {
    user,
    loading,
    isParked,
    setIsParked,
    parkedSlot,
    setParkedSlot,
    showViolationModal,
    setShowViolationModal,
    showTicketModal,
    setShowTicketModal,
    violationReason,
    setViolationReason,
    violationNotes,
    setViolationNotes,
    toastMessage,
    secondsElapsed,
    vehicle: vehicle || { licensePlate: 'None', model: '—', color: '—', colorHex: '#cbd5e1', entryTime: '—', type: '—', ticketNo: '—', rateTier: '—' },
    logs,
    formatDuration,
    triggerToast,
    handleReleaseSlot,
    submitViolation
  };
}
