'use client';

import React, { useState } from 'react';
import { useAccounts } from '../hooks/useAccounts';
import { useSystemConfig } from '../hooks/useSystemConfig';
import { usePricingEngine } from '../hooks/usePricingEngine';
import { usePayments } from '../hooks/usePayments';
import { useVehicleTypes } from '../hooks/useVehicleTypes';

type TabType = 'accounts' | 'config' | 'pricing-engine' | 'payments' | 'vehicle-types';

export default function ManagerWorkspace() {
  const [activeTab, setActiveTab] = useState<TabType>('accounts');

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Manager Dashboard</h1>

      {/* Tab Navigation */}
      <div className="flex gap-2 mb-6 border-b border-gray-200 overflow-x-auto">
        <TabButton
          active={activeTab === 'accounts'}
          onClick={() => setActiveTab('accounts')}
          label="Accounts"
        />
        <TabButton
          active={activeTab === 'config'}
          onClick={() => setActiveTab('config')}
          label="System Config"
        />
        <TabButton
          active={activeTab === 'pricing-engine'}
          onClick={() => setActiveTab('pricing-engine')}
          label="Pricing Engine"
        />
        <TabButton
          active={activeTab === 'payments'}
          onClick={() => setActiveTab('payments')}
          label="Payments"
        />
        <TabButton
          active={activeTab === 'vehicle-types'}
          onClick={() => setActiveTab('vehicle-types')}
          label="Vehicle Types"
        />
      </div>

      {/* Tab Content */}
      <div className="mt-4">
        {activeTab === 'accounts' && <AccountsTab />}
        {activeTab === 'config' && <SystemConfigTab />}
        {activeTab === 'pricing-engine' && <PricingEngineTab />}
        {activeTab === 'payments' && <PaymentsTab />}
        {activeTab === 'vehicle-types' && <VehicleTypesTab />}
      </div>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
        active
          ? 'border-blue-500 text-blue-600'
          : 'border-transparent text-gray-500 hover:text-gray-700'
      }`}
    >
      {label}
    </button>
  );
}

function AccountsTab() {
  const { accounts, isLoading, error, filter, setFilter, deactivateAccount, deleteAccount } = useAccounts();
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  const handleDeactivate = async (id: number) => {
    if (!confirm('Are you sure you want to deactivate this account?')) return;
    setActionLoading(id);
    try {
      await deactivateAccount(id);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to deactivate account');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this account? This action cannot be undone.')) return;
    setActionLoading(id);
    try {
      await deleteAccount(id);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete account');
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div>
      <div className="flex gap-4 mb-4">
        <input
          type="text"
          placeholder="Search by email or name..."
          value={filter.search || ''}
          onChange={(e) => setFilter({ ...filter, search: e.target.value })}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
        />
        <select
          value={filter.role || ''}
          onChange={(e) => setFilter({ ...filter, role: e.target.value || undefined })}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
        >
          <option value="">All Roles</option>
          <option value="ADMIN">Admin</option>
          <option value="MANAGER">Manager</option>
          <option value="STAFF">Staff</option>
          <option value="DRIVER">Driver</option>
        </select>
      </div>

      {isLoading ? (
        <div className="text-center py-8 text-gray-500">Loading...</div>
      ) : error ? (
        <div className="text-center py-8 text-red-500">{error}</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-medium">ID</th>
                <th className="text-left py-3 px-4 font-medium">Email</th>
                <th className="text-left py-3 px-4 font-medium">Full Name</th>
                <th className="text-left py-3 px-4 font-medium">Role</th>
                <th className="text-left py-3 px-4 font-medium">Status</th>
                <th className="text-left py-3 px-4 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {accounts.map((account) => (
                <tr key={account.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4">{account.id}</td>
                  <td className="py-3 px-4">{account.email}</td>
                  <td className="py-3 px-4">{account.fullName}</td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-1 text-xs font-medium bg-gray-100 rounded">
                      {account.role}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-1 text-xs font-medium rounded ${
                      account.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {account.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex gap-2">
                      {account.isActive && (
                        <button
                          onClick={() => handleDeactivate(account.id)}
                          disabled={actionLoading === account.id}
                          className="px-2 py-1 text-xs text-orange-600 hover:bg-orange-50 rounded disabled:opacity-50"
                        >
                          Deactivate
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(account.id)}
                        disabled={actionLoading === account.id}
                        className="px-2 py-1 text-xs text-red-600 hover:bg-red-50 rounded disabled:opacity-50"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {accounts.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-gray-500">
                    No accounts found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function SystemConfigTab() {
  const { configs, isLoading, error, updateConfig } = useSystemConfig();
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [saving, setSaving] = useState(false);

  const handleEdit = (key: string, value: string) => {
    setEditingKey(key);
    setEditValue(value);
  };

  const handleSave = async (key: string) => {
    setSaving(true);
    try {
      await updateConfig({ key, value: editValue });
      setEditingKey(null);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to update config');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      {isLoading ? (
        <div className="text-center py-8 text-gray-500">Loading...</div>
      ) : error ? (
        <div className="text-center py-8 text-red-500">{error}</div>
      ) : (
        <div className="space-y-4">
          {configs.map((config) => (
            <div key={config.key} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-gray-900">{config.key}</div>
                  {config.description && (
                    <div className="text-sm text-gray-500 mt-1">{config.description}</div>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {editingKey === config.key ? (
                    <>
                      <input
                        type="text"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        className="px-3 py-1 border border-gray-300 rounded text-sm"
                      />
                      <button
                        onClick={() => handleSave(config.key)}
                        disabled={saving}
                        className="px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600 disabled:opacity-50"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => setEditingKey(null)}
                        className="px-3 py-1 text-gray-500 hover:text-gray-700 text-sm"
                      >
                        Cancel
                      </button>
                    </>
                  ) : (
                    <>
                      <span className="text-gray-700 font-mono text-sm">{config.value}</span>
                      <button
                        onClick={() => handleEdit(config.key, config.value)}
                        className="px-3 py-1 text-blue-600 hover:bg-blue-50 text-sm rounded"
                      >
                        Edit
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
          {configs.length === 0 && (
            <div className="text-center py-8 text-gray-500">No configurations found</div>
          )}
        </div>
      )}
    </div>
  );
}

function PricingEngineTab() {
  const { isCalculating, error, calculatePrice } = usePricingEngine();
  const [vehicleTypeId, setVehicleTypeId] = useState(1);
  const [checkInTime, setCheckInTime] = useState('');
  const [checkOutTime, setCheckOutTime] = useState('');
  const [result, setResult] = useState<{
    durationMinutes: number;
    basePrice: number;
    totalAmount: number;
    applicableWindow?: string;
  } | null>(null);

  const handleCalculate = async () => {
    if (!checkInTime || !checkOutTime) {
      alert('Please enter both check-in and check-out times');
      return;
    }
    const res = await calculatePrice({
      vehicleTypeId,
      checkInTime,
      checkOutTime,
    });
    if (res) {
      setResult(res);
    }
  };

  return (
    <div className="max-w-xl">
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Vehicle Type</label>
          <select
            value={vehicleTypeId}
            onChange={(e) => setVehicleTypeId(Number(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
          >
            <option value={1}>Car (Standard)</option>
            <option value={3}>Car (EV Charging)</option>
            <option value={4}>Motorbike</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Check-in Time</label>
          <input
            type="datetime-local"
            value={checkInTime}
            onChange={(e) => setCheckInTime(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Check-out Time</label>
          <input
            type="datetime-local"
            value={checkOutTime}
            onChange={(e) => setCheckOutTime(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
          />
        </div>

        <button
          onClick={handleCalculate}
          disabled={isCalculating}
          className="w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
        >
          {isCalculating ? 'Calculating...' : 'Calculate Price'}
        </button>

        {error && (
          <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm">{error}</div>
        )}

        {result && (
          <div className="p-4 bg-green-50 rounded-lg space-y-2">
            <div className="text-sm">
              <span className="font-medium">Duration:</span> {result.durationMinutes} minutes
            </div>
            <div className="text-sm">
              <span className="font-medium">Base Price:</span> {result.basePrice.toLocaleString()} đ
            </div>
            <div className="text-sm">
              <span className="font-medium">Total Amount:</span>{' '}
              <span className="text-lg font-bold text-green-700">
                {result.totalAmount.toLocaleString()} đ
              </span>
            </div>
            {result.applicableWindow && (
              <div className="text-sm">
                <span className="font-medium">Applicable Window:</span> {result.applicableWindow}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function PaymentsTab() {
  const { payments, isLoading, error, totalCount, fetchPayments } = usePayments();
  const [pageIndex, setPageIndex] = useState(1);

  React.useEffect(() => {
    fetchPayments({ pageIndex, pageSize: 10 });
  }, [pageIndex, fetchPayments]);

  return (
    <div>
      {isLoading ? (
        <div className="text-center py-8 text-gray-500">Loading...</div>
      ) : error ? (
        <div className="text-center py-8 text-red-500">{error}</div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-medium">ID</th>
                  <th className="text-left py-3 px-4 font-medium">Amount</th>
                  <th className="text-left py-3 px-4 font-medium">Method</th>
                  <th className="text-left py-3 px-4 font-medium">Status</th>
                  <th className="text-left py-3 px-4 font-medium">Order Code</th>
                  <th className="text-left py-3 px-4 font-medium">Payment Time</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((payment) => (
                  <tr key={payment.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4">{payment.id}</td>
                    <td className="py-3 px-4 font-medium">{payment.amount.toLocaleString()} đ</td>
                    <td className="py-3 px-4">{payment.paymentMethod}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 text-xs font-medium rounded ${
                        payment.paymentStatus === 'PAID' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                      }`}>
                        {payment.paymentStatus}
                      </span>
                    </td>
                    <td className="py-3 px-4">{payment.orderCode || '-'}</td>
                    <td className="py-3 px-4">
                      {payment.paymentTime ? new Date(payment.paymentTime).toLocaleString() : '-'}
                    </td>
                  </tr>
                ))}
                {payments.length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-gray-500">
                      No payments found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="flex justify-between items-center mt-4">
            <span className="text-sm text-gray-500">Total: {totalCount} payments</span>
            <div className="flex gap-2">
              <button
                onClick={() => setPageIndex(Math.max(1, pageIndex - 1))}
                disabled={pageIndex === 1}
                className="px-3 py-1 text-sm border rounded disabled:opacity-50"
              >
                Previous
              </button>
              <span className="px-3 py-1 text-sm">Page {pageIndex}</span>
              <button
                onClick={() => setPageIndex(pageIndex + 1)}
                disabled={payments.length < 10}
                className="px-3 py-1 text-sm border rounded disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function VehicleTypesTab() {
  const { vehicleTypes, isLoading, error, createVehicleType, updateVehicleType, deleteVehicleType } = useVehicleTypes();
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);

  const handleAdd = async () => {
    if (!name.trim()) {
      alert('Type name is required');
      return;
    }
    setSaving(true);
    try {
      await createVehicleType({ name: name.trim(), description: description.trim() || undefined, vehicleTypeStatus: 'ACTIVE' });
      setIsAdding(false);
      setName('');
      setDescription('');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to create');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async (id: number) => {
    if (!name.trim()) {
      alert('Type name is required');
      return;
    }
    setSaving(true);
    try {
      await updateVehicleType(id, { name: name.trim(), description: description.trim() || undefined, vehicleTypeStatus: 'ACTIVE' });
      setEditingId(null);
      setName('');
      setDescription('');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to update');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this vehicle type?')) return;
    try {
      await deleteVehicleType(id);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete');
    }
  };

  const startEdit = (vt: { id: number; name: string; description?: string }) => {
    setEditingId(vt.id);
    setName(vt.name);
    setDescription(vt.description || '');
  };

  return (
    <div>
      <div className="mb-4">
        <button
          onClick={() => { setIsAdding(true); setEditingId(null); setName(''); setDescription(''); }}
          className="px-4 py-2 bg-blue-500 text-white text-sm rounded-lg hover:bg-blue-600"
        >
          + Add Vehicle Type
        </button>
      </div>

      {isLoading ? (
        <div className="text-center py-8 text-gray-500">Loading...</div>
      ) : error ? (
        <div className="text-center py-8 text-red-500">{error}</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-medium">ID</th>
                <th className="text-left py-3 px-4 font-medium">Name</th>
                <th className="text-left py-3 px-4 font-medium">Description</th>
                <th className="text-left py-3 px-4 font-medium">Status</th>
                <th className="text-left py-3 px-4 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isAdding && (
                <tr className="border-b border-gray-100 bg-blue-50">
                  <td className="py-3 px-4">-</td>
                  <td className="py-3 px-4">
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Type name"
                      className="px-2 py-1 border rounded text-sm w-full"
                    />
                  </td>
                  <td className="py-3 px-4">
                    <input
                      type="text"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Description"
                      className="px-2 py-1 border rounded text-sm w-full"
                    />
                  </td>
                  <td className="py-3 px-4">-</td>
                  <td className="py-3 px-4">
                    <div className="flex gap-2">
                      <button onClick={handleAdd} disabled={saving} className="px-2 py-1 text-xs text-green-600 hover:bg-green-50 rounded disabled:opacity-50">Save</button>
                      <button onClick={() => setIsAdding(false)} className="px-2 py-1 text-xs text-gray-600 hover:bg-gray-50 rounded">Cancel</button>
                    </div>
                  </td>
                </tr>
              )}
              {vehicleTypes.map((vt) => (
                <tr key={vt.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4">{vt.id}</td>
                  <td className="py-3 px-4">
                    {editingId === vt.id ? (
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="px-2 py-1 border rounded text-sm w-full"
                      />
                    ) : (
                      vt.name
                    )}
                  </td>
                  <td className="py-3 px-4">
                    {editingId === vt.id ? (
                      <input
                        type="text"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        className="px-2 py-1 border rounded text-sm w-full"
                      />
                    ) : (
                      vt.description || '-'
                    )}
                  </td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-700 rounded">
                      {vt.vehicleTypeStatus}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    {editingId === vt.id ? (
                      <div className="flex gap-2">
                        <button onClick={() => handleUpdate(vt.id)} disabled={saving} className="px-2 py-1 text-xs text-green-600 hover:bg-green-50 rounded disabled:opacity-50">Save</button>
                        <button onClick={() => setEditingId(null)} className="px-2 py-1 text-xs text-gray-600 hover:bg-gray-50 rounded">Cancel</button>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <button onClick={() => startEdit(vt)} className="px-2 py-1 text-xs text-blue-600 hover:bg-blue-50 rounded">Edit</button>
                        <button onClick={() => handleDelete(vt.id)} className="px-2 py-1 text-xs text-red-600 hover:bg-red-50 rounded">Delete</button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
              {vehicleTypes.length === 0 && !isAdding && (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-gray-500">
                    No vehicle types found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
