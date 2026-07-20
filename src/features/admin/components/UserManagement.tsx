'use client';

import React, { useState } from 'react';
import { useAuth } from '@/features/auth';
import { useAccounts, AccountDto } from '../hooks/useAccounts';
import { Badge, Input, Select } from '@/components/ui';

export default function UserManagement() {
  const { user: currentUser, showToast } = useAuth();
  
  // Feature-based custom hook for data & mutations
  const {
    filteredAccounts,
    isLoading,
    error,
    searchQuery,
    setSearchQuery,
    roleFilter,
    setRoleFilter,
    statusFilter,
    setStatusFilter,
    stats,
    fetchAccounts,
    createAccount,
    updateAccount,
    blockAccount,
    unblockAccount,
  } = useAccounts();

  // Create User Modal state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [createFullName, setCreateFullName] = useState<string>('');
  const [createUsername, setCreateUsername] = useState<string>('');
  const [createEmail, setCreateEmail] = useState<string>('');
  const [createPhone, setCreatePhone] = useState<string>('');
  const [createPassword, setCreatePassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [createRoleId, setCreateRoleId] = useState<number>(3); // 3 = Staff, 2 = Manager
  const [isCreating, setIsCreating] = useState<boolean>(false);

  // Edit Modal state
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
  const [editingAccount, setEditingAccount] = useState<AccountDto | null>(null);
  const [editFullName, setEditFullName] = useState<string>('');
  const [editPhone, setEditPhone] = useState<string>('');
  const [editRoleId, setEditRoleId] = useState<number>(4);
  const [editStatus, setEditStatus] = useState<string>('Active');
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // Block/Unblock Warning Modal state
  const [isBlockModalOpen, setIsBlockModalOpen] = useState<boolean>(false);
  const [targetAccount, setTargetAccount] = useState<AccountDto | null>(null);
  const [isBlocking, setIsBlocking] = useState<boolean>(false);

  // Open Create User Modal
  const handleCreateClick = () => {
    setCreateFullName('');
    setCreateUsername('');
    setCreateEmail('');
    setCreatePhone('');
    setCreatePassword('');
    setShowPassword(false);
    setCreateRoleId(3); // Default Staff
    setIsCreateModalOpen(true);
  };

  // Submit Create User Form
  const handleCreateSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createFullName.trim() || !createUsername.trim() || !createEmail.trim() || !createPassword.trim()) {
      showToast('Full Name, Username, Email, and Password are required.', 'error');
      return;
    }

    // Restriction: Admin can only create Staff (3) or Manager (2)
    if (createRoleId !== 2 && createRoleId !== 3) {
      showToast('Admins can only create Staff or Manager accounts.', 'error');
      return;
    }

    setIsCreating(true);
    const success = await createAccount({
      fullName: createFullName.trim(),
      username: createUsername.trim(),
      email: createEmail.trim(),
      phone: createPhone.trim() || null,
      password: createPassword,
      roleId: createRoleId,
    });

    if (success) {
      setIsCreateModalOpen(false);
    }
    setIsCreating(false);
  };

  // Open Edit Modal
  const handleEditClick = (acc: AccountDto) => {
    setEditingAccount(acc);
    setEditFullName(acc.fullName || '');
    setEditPhone(acc.phone || '');
    setEditRoleId(acc.roleId);
    setEditStatus(acc.accountStatus);
    setIsEditModalOpen(true);
  };

  // Save changes
  const handleEditSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAccount) return;

    if (!editFullName.trim()) {
      showToast('Full Name is required', 'error');
      return;
    }

    // Protection: Prevent Admin from deactivating their own account
    const isSelf = currentUser && (
      editingAccount.id === currentUser.id || 
      (currentUser.email && editingAccount.email?.toLowerCase() === currentUser.email.toLowerCase())
    );
    if (isSelf && (editStatus === 'Blocked' || editStatus === 'Inactive')) {
      showToast('You cannot deactivate or block your own account.', 'error');
      return;
    }

    setIsSaving(true);
    const success = await updateAccount(editingAccount.id, {
      fullName: editFullName.trim(),
      phone: editPhone.trim() || null,
      roleId: editRoleId,
      accountStatus: editStatus,
    });

    if (success) {
      setIsEditModalOpen(false);
    }
    setIsSaving(false);
  };

  // Open Block / Unblock Modal
  const handleBlockClick = (acc: AccountDto) => {
    // Protection: Prevent Admin from blocking their own account
    const isSelf = currentUser && (
      acc.id === currentUser.id || 
      (currentUser.email && acc.email?.toLowerCase() === currentUser.email.toLowerCase())
    );
    if (isSelf) {
      showToast('You cannot block or deactivate your own account.', 'error');
      return;
    }
    setTargetAccount(acc);
    setIsBlockModalOpen(true);
  };

  // Confirm Block / Unblock
  const handleBlockConfirm = async () => {
    if (!targetAccount) return;

    setIsBlocking(true);
    let success = false;
    if (targetAccount.accountStatus === 'Blocked') {
      success = await unblockAccount(targetAccount.id, {
        fullName: targetAccount.fullName,
        phone: targetAccount.phone,
        roleId: targetAccount.roleId,
      });
    } else {
      success = await blockAccount(targetAccount.id);
    }

    if (success) {
      setIsBlockModalOpen(false);
    }
    setIsBlocking(false);
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return dateString;
    }
  };

  return (
    <div className="p-8 space-y-8">
      {/* Title & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">User Account Management</h1>
          <p className="text-slate-500 text-sm mt-1">
            Monitor accounts, update system roles, and manage access statuses.
          </p>
        </div>
        <button
          onClick={handleCreateClick}
          className="px-4 py-2.5 bg-[#006d43] hover:bg-[#005c38] text-white text-xs font-bold rounded-xl transition-all shadow-sm hover:shadow active:scale-95 flex items-center gap-1.5 self-start sm:self-center"
        >
          <span className="material-symbols-outlined text-sm font-bold">person_add</span>
          Add New User
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center text-slate-500">
            <span className="material-symbols-outlined text-2xl">group</span>
          </div>
          <div>
            <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">Total Users</p>
            <h3 className="text-2xl font-black text-slate-800 mt-0.5">{isLoading ? '...' : stats.total}</h3>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-500">
            <span className="material-symbols-outlined text-2xl">check_circle</span>
          </div>
          <div>
            <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">Active Users</p>
            <h3 className="text-2xl font-black text-emerald-600 mt-0.5">{isLoading ? '...' : stats.active}</h3>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-rose-50 flex items-center justify-center text-rose-500">
            <span className="material-symbols-outlined text-2xl">block</span>
          </div>
          <div>
            <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">Blocked Users</p>
            <h3 className="text-2xl font-black text-rose-600 mt-0.5">{isLoading ? '...' : stats.blocked}</h3>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center text-slate-500">
            <span className="material-symbols-outlined text-2xl">person_off</span>
          </div>
          <div>
            <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">Inactive Users</p>
            <h3 className="text-2xl font-black text-slate-600 mt-0.5">{isLoading ? '...' : stats.inactive}</h3>
          </div>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex flex-col">
        {/* Search & Filters */}
        <div className="p-5 border-b border-slate-100 flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
          <div className="relative flex-1">
            <span className="material-symbols-outlined text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 text-lg">
              search
            </span>
            <input
              type="text"
              placeholder="Search by name, username, email, phone, role..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#006d43]/10 focus:border-[#006d43] text-xs font-semibold text-slate-700 transition-all"
            />
          </div>

          <div className="flex flex-wrap gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-400 uppercase">Role</span>
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-[#006d43] focus:ring-1 focus:ring-[#006d43]/10 text-xs font-bold text-slate-700"
              >
                <option value="ALL">All Roles</option>
                <option value="Admin">Admin</option>
                <option value="Manager">Manager</option>
                <option value="Staff">Staff</option>
                <option value="Driver">Driver</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-400 uppercase">Status</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-[#006d43] focus:ring-1 focus:ring-[#006d43]/10 text-xs font-bold text-slate-700"
              >
                <option value="ALL">All Statuses</option>
                <option value="Active">Active</option>
                <option value="Blocked">Blocked</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>

            <button
              onClick={fetchAccounts}
              className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100/50 rounded-xl transition-all border border-slate-200 flex items-center justify-center min-w-0"
              title="Refresh"
            >
              <span className="material-symbols-outlined text-lg">refresh</span>
            </button>
          </div>
        </div>

        {/* Loading / Error States */}
        {isLoading ? (
          <div className="p-20 flex flex-col items-center justify-center space-y-4">
            <div className="w-10 h-10 border-4 border-[#006d43] border-t-transparent rounded-full animate-spin"></div>
            <p className="text-slate-500 text-sm font-semibold">Loading accounts from PBMS server...</p>
          </div>
        ) : error ? (
          <div className="p-20 flex flex-col items-center justify-center text-center max-w-md mx-auto space-y-4">
            <span className="material-symbols-outlined text-red-500 text-5xl">error</span>
            <div>
              <h4 className="text-lg font-bold text-slate-800">Connection Failed</h4>
              <p className="text-slate-500 text-xs mt-1">{error}</p>
            </div>
            <button
              onClick={fetchAccounts}
              className="px-4 py-2 bg-[#006d43] hover:bg-[#005c38] text-white text-xs font-bold rounded-xl transition-all shadow-sm active:scale-95"
            >
              Retry Connection
            </button>
          </div>
        ) : filteredAccounts.length === 0 ? (
          <div className="p-20 flex flex-col items-center justify-center text-center space-y-3">
            <span className="material-symbols-outlined text-slate-300 text-5xl">group_off</span>
            <div>
              <h4 className="text-base font-bold text-slate-700">No accounts found</h4>
              <p className="text-slate-400 text-xs">Try adjusting your filters or search query.</p>
            </div>
          </div>
        ) : (
          /* Accounts Table */
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/75 border-b border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-wider">
                  <th className="py-4 px-6">User / Username</th>
                  <th className="py-4 px-6">Email & Contact</th>
                  <th className="py-4 px-6">Role</th>
                  <th className="py-4 px-6">Status</th>
                  <th className="py-4 px-6">Date Registered</th>
                  <th className="py-4 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-semibold text-slate-700">
                {filteredAccounts.map((acc) => {
                  const isSelf = currentUser && (
                    acc.id === currentUser.id || 
                    (currentUser.email && acc.email?.toLowerCase() === currentUser.email.toLowerCase())
                  );

                  return (
                    <tr key={acc.id} className="hover:bg-slate-50/20 transition-colors">
                      {/* User profile */}
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-600 text-sm">
                            {(acc.fullName || acc.username).charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <p className="font-bold text-slate-800 text-sm">{acc.fullName || 'No Name Set'}</p>
                              {isSelf && (
                                <span className="px-1.5 py-0.5 bg-emerald-100 text-[#006d43] text-[10px] font-bold rounded-md">
                                  You
                                </span>
                              )}
                            </div>
                            <p className="text-slate-400 text-[11px] font-medium font-mono">@{acc.username}</p>
                          </div>
                        </div>
                      </td>

                      {/* Email and Phone */}
                      <td className="py-4 px-6">
                        <div className="space-y-0.5">
                          <p className="text-slate-600 font-medium font-mono">{acc.email || 'N/A'}</p>
                          <p className="text-slate-400 text-[11px] font-mono">{acc.phone || 'No Phone Set'}</p>
                        </div>
                      </td>

                      {/* System Role */}
                      <td className="py-4 px-6">
                        {acc.roleName === 'Admin' && <span className="text-rose-600 font-bold text-xs">Admin</span>}
                        {acc.roleName === 'Manager' && <span className="text-amber-600 font-bold text-xs">Manager</span>}
                        {acc.roleName === 'Staff' && <span className="text-[#006d43] font-bold text-xs">Staff</span>}
                        {acc.roleName === 'Driver' && <span className="text-slate-500 font-semibold text-xs">Driver</span>}
                      </td>

                      {/* Account Status */}
                      <td className="py-4 px-6">
                        {acc.accountStatus === 'Active' && <Badge variant="available" dot>Active</Badge>}
                        {acc.accountStatus === 'Blocked' && <Badge variant="occupied" dot>Blocked</Badge>}
                        {acc.accountStatus === 'Inactive' && <Badge variant="inactive" dot>Inactive</Badge>}
                      </td>

                      {/* Registered date */}
                      <td className="py-4 px-6 text-slate-500 font-mono">{formatDate(acc.createdAt)}</td>

                      {/* Actions */}
                      <td className="py-4 px-6 text-right space-x-1.5">
                        <button
                          onClick={() => handleEditClick(acc)}
                          className="px-3 py-1.5 border border-slate-200 hover:border-slate-350 hover:bg-slate-50 text-slate-600 hover:text-slate-800 font-bold rounded-lg transition-all text-xs bg-white shadow-sm"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleBlockClick(acc)}
                          disabled={!!isSelf}
                          title={isSelf ? "You cannot block your own account" : ""}
                          className={`px-3 py-1.5 border font-bold rounded-lg transition-all text-xs bg-white shadow-sm ${
                            isSelf
                              ? 'border-slate-200 text-slate-300 bg-slate-50 cursor-not-allowed opacity-60'
                              : acc.accountStatus === 'Blocked'
                              ? 'border-emerald-200 text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50/20 hover:border-emerald-350'
                              : 'border-red-200 text-red-600 hover:text-red-800 hover:bg-red-50/20 hover:border-red-350'
                          }`}
                        >
                          {acc.accountStatus === 'Blocked' ? 'Unblock' : 'Block'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create Account Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
            onClick={() => setIsCreateModalOpen(false)}
          />

          {/* Dialog Body */}
          <div className="relative bg-white rounded-2xl w-full max-w-md shadow-2xl border border-slate-100 overflow-hidden transform scale-100 transition-all flex flex-col">
            {/* Header */}
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <div>
                <h3 className="text-base font-bold text-slate-800">Create New Account</h3>
                <p className="text-xs text-slate-500 mt-0.5">Admin Privilege: Create account for Staff or Manager</p>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-200/60 text-slate-400 hover:text-slate-600 transition-all"
              >
                <span className="material-symbols-outlined text-xl">close</span>
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleCreateSave} className="p-6 space-y-4">
              <Input
                label="Full Name *"
                value={createFullName}
                onChange={(e) => setCreateFullName(e.target.value)}
                placeholder="e.g. Nguyen Van A"
                required
              />

              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Username *"
                  value={createUsername}
                  onChange={(e) => setCreateUsername(e.target.value)}
                  placeholder="e.g. staff_nguyena"
                  required
                />
                <Input
                  label="Email *"
                  type="email"
                  value={createEmail}
                  onChange={(e) => setCreateEmail(e.target.value)}
                  placeholder="name@example.com"
                  required
                />
              </div>

              <Input
                label="Phone Number"
                value={createPhone}
                onChange={(e) => setCreatePhone(e.target.value)}
                placeholder="0912345678"
              />

              <div className="relative">
                <Input
                  label="Password *"
                  type={showPassword ? 'text' : 'password'}
                  value={createPassword}
                  onChange={(e) => setCreatePassword(e.target.value)}
                  placeholder="Enter account password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-[34px] text-slate-400 hover:text-slate-600 focus:outline-none"
                >
                  <span className="material-symbols-outlined text-lg">
                    {showPassword ? 'visibility_off' : 'visibility'}
                  </span>
                </button>
              </div>

              <Select
                label="Assign System Role *"
                value={createRoleId.toString()}
                onChange={(e) => setCreateRoleId(Number(e.target.value))}
                options={[
                  { value: '3', label: 'Staff (Nhân viên)' },
                  { value: '2', label: 'Manager (Quản lý)' },
                ]}
              />

              {/* Action Buttons */}
              <div className="pt-4 border-t border-slate-100 flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 border border-slate-250 text-slate-600 hover:text-slate-800 hover:bg-slate-55 bg-white font-bold rounded-xl text-xs transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreating}
                  className="px-4 py-2 bg-[#006d43] hover:bg-[#005c38] disabled:opacity-50 text-white font-bold rounded-xl text-xs transition-all flex items-center gap-1.5 shadow-sm hover:shadow"
                >
                  {isCreating ? (
                    <>
                      <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                      Creating...
                    </>
                  ) : (
                    'Create Account'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Account Modal */}
      {isEditModalOpen && editingAccount && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
            onClick={() => setIsEditModalOpen(false)}
          />

          {/* Dialog Body */}
          <div className="relative bg-white rounded-2xl w-full max-w-md shadow-2xl border border-slate-100 overflow-hidden transform scale-100 transition-all flex flex-col">
            {/* Header */}
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <div>
                <h3 className="text-base font-bold text-slate-800">Edit System Account</h3>
                <p className="text-xs text-slate-500 mt-0.5">Username: @{editingAccount.username}</p>
              </div>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-200/60 text-slate-400 hover:text-slate-600 transition-all"
              >
                <span className="material-symbols-outlined text-xl">close</span>
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleEditSave} className="p-6 space-y-4">
              {currentUser && (
                editingAccount.id === currentUser.id || 
                (currentUser.email && editingAccount.email?.toLowerCase() === currentUser.email.toLowerCase())
              ) && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 font-medium flex items-center gap-2">
                  <span className="material-symbols-outlined text-base text-amber-600 shrink-0">info</span>
                  <span>You are editing your own account. Status cannot be changed to Inactive or Blocked.</span>
                </div>
              )}

              <Input
                label="Full Name"
                value={editFullName}
                onChange={(e) => setEditFullName(e.target.value)}
                required
              />

              <Input
                label="Phone Number"
                value={editPhone}
                onChange={(e) => setEditPhone(e.target.value)}
                placeholder="No phone number set"
              />

              <div className="grid grid-cols-2 gap-4">
                <Select
                  label="System Role"
                  value={editRoleId.toString()}
                  onChange={(e) => setEditRoleId(Number(e.target.value))}
                  options={[
                    { value: '1', label: 'Admin' },
                    { value: '2', label: 'Manager' },
                    { value: '3', label: 'Staff' },
                    { value: '4', label: 'Driver' },
                  ]}
                />

                <Select
                  label="Account Status"
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value)}
                  options={
                    currentUser && (
                      editingAccount.id === currentUser.id || 
                      (currentUser.email && editingAccount.email?.toLowerCase() === currentUser.email.toLowerCase())
                    )
                      ? [{ value: 'Active', label: 'Active (Current)' }]
                      : [
                          { value: 'Active', label: 'Active' },
                          { value: 'Inactive', label: 'Inactive' },
                          { value: 'Blocked', label: 'Blocked' },
                        ]
                  }
                />
              </div>

              {/* Action Buttons */}
              <div className="pt-4 border-t border-slate-100 flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 border border-slate-250 text-slate-600 hover:text-slate-800 hover:bg-slate-55 bg-white font-bold rounded-xl text-xs transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-4 py-2 bg-[#006d43] hover:bg-[#005c38] disabled:opacity-50 text-white font-bold rounded-xl text-xs transition-all flex items-center gap-1.5 shadow-sm hover:shadow"
                >
                  {isSaving ? (
                    <>
                      <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                      Saving...
                    </>
                  ) : (
                    'Save Changes'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Block/Unblock Warning Modal */}
      {isBlockModalOpen && targetAccount && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
            onClick={() => setIsBlockModalOpen(false)}
          />

          {/* Warning Card */}
          <div className="relative bg-white rounded-2xl w-full max-w-sm shadow-2xl border border-slate-100 overflow-hidden transform scale-100 transition-all p-6 flex flex-col space-y-4">
            <div className="flex items-center gap-3.5">
              <div
                className={`w-12 h-12 rounded-full flex items-center justify-center ${
                  targetAccount.accountStatus === 'Blocked'
                    ? 'bg-emerald-50 text-emerald-600'
                    : 'bg-rose-50 text-rose-600'
                }`}
              >
                <span className="material-symbols-outlined text-2xl font-bold">
                  {targetAccount.accountStatus === 'Blocked' ? 'verified_user' : 'warning'}
                </span>
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-800">
                  {targetAccount.accountStatus === 'Blocked' ? 'Unblock User Account?' : 'Block User Account?'}
                </h3>
                <p className="text-xs text-slate-400 font-mono">@{targetAccount.username}</p>
              </div>
            </div>

            <div className="text-xs text-slate-500 leading-relaxed">
              {targetAccount.accountStatus === 'Blocked' ? (
                <span>
                  Are you sure you want to unblock <strong>{targetAccount.fullName || targetAccount.username}</strong>?
                  This will restore their normal login privileges and set their status to <strong>Active</strong>.
                </span>
              ) : (
                <span>
                  Are you sure you want to block <strong>{targetAccount.fullName || targetAccount.username}</strong>?
                  This user will be logged out and prevented from accessing system features immediately. Their status will change to <strong>Blocked</strong>.
                </span>
              )}
            </div>

            {/* Buttons */}
            <div className="pt-2 flex gap-3 justify-end">
              <button
                type="button"
                onClick={() => setIsBlockModalOpen(false)}
                className="px-4 py-2 border border-slate-250 text-slate-600 hover:text-slate-800 hover:bg-slate-55 bg-white font-bold rounded-xl text-xs transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleBlockConfirm}
                disabled={isBlocking}
                className={`px-4 py-2 font-bold rounded-xl text-xs transition-all flex items-center gap-1.5 shadow-sm hover:shadow ${
                  targetAccount.accountStatus === 'Blocked'
                    ? 'bg-[#006d43] hover:bg-[#005c38] text-white'
                    : 'bg-red-600 hover:bg-red-700 text-white'
                }`}
              >
                {isBlocking ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    Processing...
                  </>
                ) : targetAccount.accountStatus === 'Blocked' ? (
                  'Confirm Unblock'
                ) : (
                  'Confirm Block'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
