import { Suspense } from 'react';
import { ForgotPasswordForm } from '@/features/auth';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Forgot Password | NexPark Smart Parking',
  description: 'Reset your NexPark account password securely using email OTP verification.',
};

export default function ForgotPasswordPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0f172a] flex items-center justify-center text-white">Loading...</div>}>
      <ForgotPasswordForm />
    </Suspense>
  );
}
