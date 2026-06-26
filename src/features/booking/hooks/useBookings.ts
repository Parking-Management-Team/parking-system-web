'use client';

import { useState, useCallback } from 'react';
import { api } from '@/lib/api/client';
import { BaseResponse } from '@/lib/types/building.types';
import { useAuth } from '@/features/auth';
import { Booking, BookingFilter } from '../types';

export function useBookings() {
  const { showToast } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchBookings = useCallback(async (filters?: BookingFilter) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await api.get<BaseResponse<any[]> | any[]>('/bookings');
      const rawItems = Array.isArray(res) ? res : res.data || [];

      const mappedBookings: Booking[] = rawItems.map((item: any) => ({
        id: item.id,
        code: item.code || `BK-${item.id}`,
        accountId: item.accountId,
        accountName: item.accountName || 'Customer',
        vehicleId: item.vehicleId,
        licensePlate: item.licensePlate || item.vehiclePlate || '',
        vehiclePlate: item.vehiclePlate || item.licensePlate || '',
        vehicleType: item.vehicleTypeName || item.vehicleType || (item.vehicleTypeId === 1 ? 'Car' : 'Motorcycle'),
        vehicleTypeId: item.vehicleTypeId,
        vehicleTypeName: item.vehicleTypeName,
        buildingId: item.buildingId,
        buildingName: item.buildingName || 'Facility',
        plannedCheckinTime: item.plannedCheckinTime || item.createdAt || '',
        plannedCheckoutTime: item.plannedCheckoutTime || '',
        depositAmount: item.depositAmount || 0,
        bookingStatus: item.bookingStatus || item.status || 'Pending',
        depositPaid: item.depositPaid ?? (item.bookingStatus === 'Confirmed'),
        paymentDeadline: item.paymentDeadline || null,
        checkinGraceUntil: item.checkinGraceUntil || null,
        confirmedAt: item.confirmedAt || null,
        cancelledAt: item.cancelledAt || null,
        cancelReason: item.cancelReason || null,
        isWithinGrace: item.isWithinGrace ?? null,
        slotId: item.slotId || null,
        slotCode: item.slotCode || null,
        createdAt: item.createdAt || '',
      }));

      let filtered = mappedBookings;
      if (filters) {
        if (filters.status && filters.status !== 'ALL') {
          filtered = filtered.filter(b => b.bookingStatus.toUpperCase() === filters.status?.toUpperCase());
        }
        if (filters.buildingId) {
          filtered = filtered.filter(b => b.buildingId === filters.buildingId);
        }
        if (filters.licensePlate) {
          const search = filters.licensePlate.trim().toLowerCase();
          filtered = filtered.filter(b => b.licensePlate.toLowerCase().includes(search));
        }
      }

      setBookings(filtered);
    } catch (err: any) {
      console.error('Error fetching bookings:', err);
      setError(err?.message || 'Failed to load bookings.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const cancelBooking = useCallback(async (id: number): Promise<boolean> => {
    setIsLoading(true);
    try {
      const res = await api.delete<BaseResponse<any>>(`/bookings/${id}`);
      if (res.success || (res as any).data) {
        showToast('Booking cancelled successfully.', 'success');
        return true;
      } else {
        showToast(res.message || 'Failed to cancel booking.', 'error');
        return false;
      }
    } catch (err: any) {
      const errMsg = err?.data?.message || err?.message || 'Error cancelling booking.';
      showToast(errMsg, 'error');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  return {
    bookings,
    isLoading,
    error,
    fetchBookings,
    cancelBooking,
  };
}
