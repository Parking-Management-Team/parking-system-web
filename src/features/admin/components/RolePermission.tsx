'use client';

import React, { useState } from 'react';

const MOCK_PERMISSIONS = [
  { key: 'manage_users', label: 'Manage System Users', category: 'Security' },
  { key: 'edit_roles', label: 'Modify Roles & Permissions', category: 'Security' },
  { key: 'view_analytics', label: 'View Financial Analytics', category: 'Reports' },
  { key: 'manage_facilities', label: 'Manage Parking Facilities', category: 'Operational' },
  { key: 'vehicle_check_in_out', label: 'Perform Check-in/out', category: 'Operational' },
  { key: 'handle_incidents', label: 'Process Incident Tickets', category: 'Operational' },
];

const MOCK_ROLES = [
  { name: 'ADMIN', desc: 'Full root access to system, hardware nodes and configs.', permissions: ['manage_users', 'edit_roles', 'view_analytics', 'manage_facilities', 'vehicle_check_in_out', 'handle_incidents'] },
  { name: 'MANAGER', desc: 'Manage operations, view analytics and reports.', permissions: ['view_analytics', 'manage_facilities', 'handle_incidents'] },
  { name: 'STAFF', desc: 'Daily operational gate management and incident logging.', permissions: ['vehicle_check_in_out', 'handle_incidents'] },
];

/**
 * RolePermission Component - Quản lý quyền hạn và phân vai trò
 * Giúp Admin kiểm soát phân quyền chi tiết (Access Control List) cho từng vai trò trong NexPark.
 */
export default function RolePermission() {
  const [selectedRole, setSelectedRole] = useState('STAFF');
  const [roles, setRoles] = useState(MOCK_ROLES);

  const activeRole = roles.find(r => r.name === selectedRole);

  const togglePermission = (permKey: string) => {
    setRoles(prev =>
      prev.map(role => {
        if (role.name !== selectedRole) return role;
        const exists = role.permissions.includes(permKey);
        const updated = exists
          ? role.permissions.filter(p => p !== permKey)
          : [...role.permissions, permKey];
        return { ...role, permissions: updated };
      })
    );
  };

  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Role & Permission Policies</h1>
        <p className="text-slate-500 text-sm mt-1">Configure security levels, role hierarchies and operational permissions.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Lựa chọn Role */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider text-slate-400">System Roles</h3>
          <div className="space-y-2">
            {roles.map((r) => (
              <button
                key={r.name}
                onClick={() => setSelectedRole(r.name)}
                className={`w-full p-4 rounded-xl text-left border transition-all ${
                  selectedRole === r.name
                    ? 'border-emerald-500 bg-emerald-50/20 text-emerald-800'
                    : 'border-slate-100 hover:border-slate-200 text-slate-600 bg-slate-50/50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold font-mono">{r.name}</span>
                  <span className="text-[10px] font-bold bg-white px-2 py-0.5 rounded border text-slate-400">{r.permissions.length} perms</span>
                </div>
                <p className="text-xs text-slate-500 mt-2 leading-relaxed">{r.desc}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Cấu hình các Permission tương ứng */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm lg:col-span-2 space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h3 className="text-base font-bold text-slate-800">Permissions for <span className="font-mono text-emerald-600">{selectedRole}</span></h3>
            <p className="text-xs text-slate-400 mt-1">Select/deselect permissions to adjust access control policies.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {MOCK_PERMISSIONS.map((perm) => {
              const isChecked = activeRole?.permissions.includes(perm.key) || false;
              return (
                <label
                  key={perm.key}
                  className={`flex items-start gap-3 p-4 rounded-xl border cursor-pointer select-none transition-all ${
                    isChecked
                      ? 'border-emerald-100 bg-emerald-50/10'
                      : 'border-slate-100 bg-white hover:bg-slate-50/50'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => togglePermission(perm.key)}
                    className="mt-1 accent-emerald-500 rounded focus:ring-0"
                  />
                  <div>
                    <span className="text-xs font-bold text-slate-700">{perm.label}</span>
                    <div className="flex items-center gap-1.5 mt-1.5">
                      <span className="text-[9px] bg-slate-100 text-slate-500 font-bold px-1.5 py-0.5 rounded">
                        {perm.category}
                      </span>
                    </div>
                  </div>
                </label>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
