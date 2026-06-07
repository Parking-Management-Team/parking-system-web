'use client';

import React from 'react';

const MOCK_STATS = [
  { label: 'Total Devices', value: '156', icon: 'router', color: 'text-indigo-500 bg-indigo-50 border-indigo-100' },
  { label: 'Active Barriers', value: '62', icon: 'door_sliding', color: 'text-emerald-500 bg-emerald-50 border-emerald-100' },
  { label: 'ANPR Cameras', value: '84', icon: 'videocam', color: 'text-cyan-500 bg-cyan-50 border-cyan-100' },
  { label: 'Other Sensors', value: '10', icon: 'sensors', color: 'text-amber-500 bg-amber-50 border-amber-100' },
];

const MOCK_HEALTH = [
  { name: 'Gate Controllers', desc: 'All clear across 12 sectors', status: 'optimal', icon: 'settings_input_component' },
  { name: 'Database Servers', desc: 'Optimized sync active', status: 'optimal', icon: 'database' },
  { name: 'IoT Gateways', desc: 'Approaching threshold (82% CPU)', status: 'warning', icon: 'hub' },
];

const MOCK_SECURITY_LOGS = [
  { id: 1, type: 'critical', title: 'Unauthorized Access Attempt', desc: 'IP 192.168.1.104 attempted login to Sector 4 Barrier Control.', time: '2 mins ago' },
  { id: 2, type: 'success', title: 'System Backup Completed', desc: 'Automated nightly backup for Database-SEA-01 successful.', time: '1 hour ago' },
  { id: 3, type: 'info', title: 'Firmware Update Pushed', desc: 'Version 2.4.1 deployed to all ANPR camera units.', time: '3 hours ago' },
  { id: 4, type: 'warning', title: 'Sensor Latency Spike', desc: 'Inductive loops in Zone B reporting 400ms delay.', time: '5 hours ago' },
];

/**
 * AdminOverview Component - Trang HUD giám sát hạ tầng dành cho Admin
 * Hiển thị thông số thiết bị phần cứng, sức khỏe hệ thống và nhật ký bảo mật.
 */
export default function AdminOverview() {
  return (
    <div className="p-8 space-y-8">
      {/* Tiêu đề & Cảnh báo toàn cục */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Infrastructure Dashboard</h1>
          <p className="text-slate-500 text-sm mt-1">Real-time status and telemetry of Urban Flow smart parking nodes.</p>
        </div>
        <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-100 px-4 py-2.5 rounded-xl text-xs font-semibold text-emerald-800 shadow-sm">
          <span className="material-symbols-outlined text-sm">verified_user</span>
          <span>System Integrity Scan Complete (156 nodes verified)</span>
        </div>
      </div>

      {/* Cards thống kê thiết bị */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {MOCK_STATS.map((stat, i) => (
          <div key={i} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
            <div className={`p-3.5 rounded-xl border ${stat.color} shrink-0`}>
              <span className="material-symbols-outlined text-2xl">{stat.icon}</span>
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{stat.label}</p>
              <h3 className="text-2xl font-black text-slate-800 mt-1">{stat.value}</h3>
            </div>
          </div>
        ))}
      </div>

      {/* Grid chính */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Hardware Health Section */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-6">
          <div>
            <h3 className="text-lg font-bold text-slate-800">Hardware Health</h3>
            <p className="text-xs text-slate-400 mt-1">Status of critical controllers & edge endpoints</p>
          </div>

          <div className="space-y-4">
            {MOCK_HEALTH.map((item, i) => (
              <div key={i} className="p-4 rounded-xl border border-slate-50 bg-slate-50/50 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-slate-400 text-lg bg-white p-1.5 rounded-lg border border-slate-100">{item.icon}</span>
                  <div>
                    <h4 className="text-sm font-bold text-slate-700">{item.name}</h4>
                    <p className="text-xs text-slate-500 mt-0.5">{item.desc}</p>
                  </div>
                </div>
                <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                  item.status === 'optimal' ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'
                }`}></span>
              </div>
            ))}
          </div>
        </div>

        {/* Security Logs Section */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm lg:col-span-2 flex flex-col justify-between">
          <div className="pb-4 border-b border-slate-100 mb-6 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-slate-800">Recent Security Logs</h3>
              <p className="text-xs text-slate-400 mt-1">Real-time authentication and network event tracing</p>
            </div>
            <span className="text-[10px] bg-red-100 text-red-600 font-bold px-2 py-0.5 rounded-full">Secure Sync</span>
          </div>

          <div className="space-y-4 flex-1">
            {MOCK_SECURITY_LOGS.map((log) => {
              let iconColor = 'text-blue-500 bg-blue-50';
              if (log.type === 'critical') iconColor = 'text-red-500 bg-red-50';
              if (log.type === 'warning') iconColor = 'text-amber-500 bg-amber-50';
              if (log.type === 'success') iconColor = 'text-emerald-500 bg-emerald-50';

              return (
                <div key={log.id} className="flex gap-4 p-3.5 rounded-xl hover:bg-slate-50/50 transition-colors">
                  <span className={`material-symbols-outlined text-lg p-1.5 rounded-lg shrink-0 h-fit ${iconColor}`}>
                    {log.type === 'critical' ? 'gpp_maybe' : log.type === 'warning' ? 'warning' : 'info'}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-sm font-bold text-slate-700 truncate">{log.title}</span>
                      <span className="text-[10px] text-slate-400 whitespace-nowrap">{log.time}</span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed truncate">{log.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
