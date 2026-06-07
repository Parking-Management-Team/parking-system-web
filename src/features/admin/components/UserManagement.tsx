'use client';

import React, { useState } from 'react';

const MOCK_USERS = [
  { id: 1, name: 'Nguyen Van A', email: 'admin.a@nexpark.com', role: 'ADMIN', status: 'ACTIVE', joined: '2026-01-10' },
  { id: 2, name: 'Tran Thi B', email: 'staff.b@nexpark.com', role: 'STAFF', status: 'ACTIVE', joined: '2026-03-15' },
  { id: 3, name: 'Pham Van C', email: 'manager.c@nexpark.com', role: 'MANAGER', status: 'ACTIVE', joined: '2026-02-20' },
  { id: 4, name: 'Le Van D', email: 'staff.d@nexpark.com', role: 'STAFF', status: 'INACTIVE', joined: '2026-05-01' },
];

/**
 * UserManagement Component - Quản lý tài khoản hệ thống của Admin
 * Cho phép xem danh sách, cập nhật trạng thái hoạt động và thay đổi quyền của tài khoản.
 */
export default function UserManagement() {
  const [users, setUsers] = useState(MOCK_USERS);
  const [search, setSearch] = useState('');

  const toggleStatus = (id: number) => {
    setUsers(prev =>
      prev.map(u => (u.id === id ? { ...u, status: u.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE' } : u))
    );
  };

  const filteredUsers = users.filter(
    u => u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-8 space-y-8">
      {/* Tiêu đề & Action nhanh */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">User Account Management</h1>
          <p className="text-slate-500 text-sm mt-1">Create, manage, and monitor system users across all roles.</p>
        </div>
        <button className="px-5 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl shadow-lg shadow-emerald-500/15 transition-all text-xs flex items-center gap-1.5 self-start sm:self-center">
          <span className="material-symbols-outlined text-sm">person_add</span>
          Add New User
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex flex-col">
        {/* Tìm kiếm & Bộ lọc */}
        <div className="p-5 border-b border-slate-100 flex gap-4">
          <div className="relative flex-1">
            <span className="material-symbols-outlined text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 text-lg">search</span>
            <input
              type="text"
              placeholder="Search by name, email, or role..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-xs font-semibold text-slate-700"
            />
          </div>
        </div>

        {/* Bảng danh sách */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/75 border-b border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-wider">
                <th className="py-4 px-6">Name</th>
                <th className="py-4 px-6">Email</th>
                <th className="py-4 px-6">System Role</th>
                <th className="py-4 px-6">Status</th>
                <th className="py-4 px-6">Joined Date</th>
                <th className="py-4 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700">
              {filteredUsers.map((u) => (
                <tr key={u.id} className="hover:bg-slate-50/20 transition-colors">
                  <td className="py-4 px-6 font-bold text-slate-800">{u.name}</td>
                  <td className="py-4 px-6 text-slate-500 font-mono">{u.email}</td>
                  <td className="py-4 px-6">
                    <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold ${
                      u.role === 'ADMIN' ? 'bg-indigo-50 text-indigo-600' : u.role === 'MANAGER' ? 'bg-blue-50 text-blue-600' : 'bg-teal-50 text-teal-600'
                    }`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="py-4 px-6">
                    <span className={`inline-flex items-center gap-1 font-bold ${
                      u.status === 'ACTIVE' ? 'text-emerald-500' : 'text-slate-400'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${u.status === 'ACTIVE' ? 'bg-emerald-500' : 'bg-slate-400'}`}></span>
                      {u.status}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-slate-400 font-mono">{u.joined}</td>
                  <td className="py-4 px-6 text-right space-x-2">
                    <button className="text-slate-400 hover:text-slate-600 font-bold">Edit</button>
                    <button
                      onClick={() => toggleStatus(u.id)}
                      className={`font-bold ${u.status === 'ACTIVE' ? 'text-red-500 hover:text-red-600' : 'text-emerald-500 hover:text-emerald-600'}`}
                    >
                      {u.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
