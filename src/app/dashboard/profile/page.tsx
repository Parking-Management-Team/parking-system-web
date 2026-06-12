'use client';

import React from 'react';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';
import { ProfileFeature } from '@/features/profile';

/**
 * ProfilePage Route - /dashboard/profile
 * 
 * Secures access to the Profile page using ProtectedRoute and wraps it with the Sidebar.
 */
export default function ProfilePage() {
  return (
    <ProtectedRoute allowedRoles={['MANAGER', 'STAFF', 'ADMIN']}>
      <div className="min-h-screen bg-[#f8f9ff] flex text-slate-800 antialiased">
        {/* Unified Sidebar Navigation */}
        <Sidebar />

        {/* Main Content Workspace area */}
        <div className="flex-1 pl-[260px] min-h-screen flex flex-col transition-all duration-200">
          <Header />
          <main className="flex-grow w-full">
            <ProfileFeature />
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
}
