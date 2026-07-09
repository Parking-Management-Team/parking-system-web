'use client';

import React from 'react';
import { BlacklistManagement } from '@/features/blacklist';

/**
 * Admin Blacklist Management Page
 */
export default function AdminBlacklistPage() {
  return <BlacklistManagement role="ADMIN" />;
}
