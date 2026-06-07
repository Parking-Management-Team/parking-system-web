'use client';

import React, { useState } from 'react';

const MOCK_DEVICES = [
  { id: 'CAM-01-ENT', name: 'ANPR Camera (Entry Point 1)', type: 'CAMERA', status: 'ONLINE', latency: '42ms', ip: '192.168.10.11' },
  { id: 'BAR-01-ENT', name: 'Barrier Gate (Entry Point 1)', type: 'BARRIER', status: 'ONLINE', latency: '12ms', ip: '192.168.10.12' },
  { id: 'CAM-02-EXT', name: 'ANPR Camera (Exit Point 1)', type: 'CAMERA', status: 'ONLINE', latency: '38ms', ip: '192.168.10.21' },
  { id: 'BAR-02-EXT', name: 'Barrier Gate (Exit Point 1)', type: 'BARRIER', status: 'OFFLINE', latency: '--', ip: '192.168.10.22' },
  { id: 'SEN-LOOP-A1', name: 'Inductive Loop (Zone A)', type: 'SENSOR', status: 'ONLINE', latency: '320ms', ip: '192.168.20.15' },
];

/**
 * DeviceMonitoring Component - Giám sát hạ tầng IoT dành cho Admin
 * Quản lý trạng thái camera ANPR, Barrier, cảm biến vòng lặp từ và các trạm điều khiển phần cứng.
 */
export default function DeviceMonitoring() {
  const [devices, setDevices] = useState(MOCK_DEVICES);
  const [filterType, setFilterType] = useState('ALL');

  const pingDevice = (id: string) => {
    alert(`Ping request sent to device ${id}. Network response OK.`);
  };

  const rebootDevice = (id: string) => {
    if (confirm(`Are you sure you want to trigger system reboot for device: ${id}?`)) {
      setDevices(prev =>
        prev.map(d => (d.id === id ? { ...d, status: 'ONLINE', latency: '10ms' } : d))
      );
    }
  };

  const filteredDevices = filterType === 'ALL'
    ? devices
    : devices.filter(d => d.type === filterType);

  return (
    <div className="p-8 space-y-8">
      {/* Tiêu đề & Cảnh báo nhanh */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">IoT Device Telemetry</h1>
          <p className="text-slate-500 text-sm mt-1">Monitor hardware connectivity, latency and manage system barriers remotely.</p>
        </div>
        <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl p-1.5 shadow-sm text-xs font-bold text-slate-600 self-start sm:self-center">
          <button onClick={() => setFilterType('ALL')} className={`px-3 py-1.5 rounded-lg ${filterType === 'ALL' ? 'bg-slate-100 text-slate-800' : 'hover:bg-slate-50'}`}>All</button>
          <button onClick={() => setFilterType('CAMERA')} className={`px-3 py-1.5 rounded-lg ${filterType === 'CAMERA' ? 'bg-slate-100 text-slate-800' : 'hover:bg-slate-50'}`}>Cameras</button>
          <button onClick={() => setFilterType('BARRIER')} className={`px-3 py-1.5 rounded-lg ${filterType === 'BARRIER' ? 'bg-slate-100 text-slate-800' : 'hover:bg-slate-50'}`}>Barriers</button>
        </div>
      </div>

      {/* Grid thiết bị */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredDevices.map((d) => (
          <div key={d.id} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between space-y-6 hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[9px] bg-slate-100 text-slate-500 font-bold px-2 py-0.5 rounded-md uppercase tracking-wider font-mono">
                  {d.id}
                </span>
                <h3 className="text-sm font-bold text-slate-800 mt-2">{d.name}</h3>
                <p className="text-xs text-slate-400 mt-0.5 font-mono">{d.ip}</p>
              </div>
              <span className={`px-2 py-1 rounded-lg text-[10px] font-bold ${
                d.status === 'ONLINE' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600 animate-pulse'
              }`}>
                {d.status}
              </span>
            </div>

            <div className="flex items-center justify-between border-t border-slate-50 pt-4 text-xs">
              <div className="flex flex-col">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Latency</span>
                <span className={`font-black mt-0.5 ${
                  d.latency === '--' ? 'text-slate-300' : d.latency.includes('320') ? 'text-amber-500' : 'text-slate-700'
                }`}>
                  {d.latency}
                </span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => pingDevice(d.id)}
                  disabled={d.status === 'OFFLINE'}
                  className="px-3 py-1.5 border border-slate-200 hover:border-slate-300 disabled:opacity-50 text-slate-600 font-bold rounded-lg transition-colors"
                >
                  Ping
                </button>
                <button
                  onClick={() => rebootDevice(d.id)}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-lg transition-colors"
                >
                  Reboot
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
