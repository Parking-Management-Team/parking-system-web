'use client';

import { useState, useCallback } from 'react';
import { api } from '@/lib/api/client';
import { BaseResponse } from '@/lib/types/building.types';

import { Booking } from '../types';

export function useBookings() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchBookings = useCallback(async (status?: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const url = status ? `/bookings?status=${status}` : '/bookings';
      const res = await api.get<BaseResponse<any[]> | any[]>(url);
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

      setBookings(mappedBookings);
    } catch (err: any) {
      console.error('Error fetching bookings:', err);
      setError(err?.message || 'Failed to load bookings.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchBookingsByBuilding = useCallback(async (buildingId: number, status?: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const url = status
        ? `/bookings/by-building/${buildingId}?status=${status}`
        : `/bookings/by-building/${buildingId}`;
      const res = await api.get<BaseResponse<any[]> | any[]>(url);
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

      setBookings(mappedBookings);
    } catch (err: any) {
      console.error('Error fetching bookings by building:', err);
      setError(err?.message || 'Failed to load bookings.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    bookings,
    isLoading,
    error,
    fetchBookings,
    fetchBookingsByBuilding,
  };
}
