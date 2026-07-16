'use client';

import { BookingWorkspace } from '@/features/booking';

export default function StaffBookingsPage() {
  return (
    <BookingWorkspace
      title="Booking Review"
      description="Review incoming confirmed bookings before vehicles arrive at the staff gate."
    />
  );
}
