'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/features/auth';
import Image from 'next/image';

/**
 * Unified Dashboard Header Component - Top navbar for authenticated pages
 * 
 * Styled based on the facility management header theme (digital clock, breadcrumbs, user role tags).
 * Automatically generates breadcrumbs based on the current pathname and integrates the auth dropdown.
 */
export default function Header() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  
  const [dropdownOpen, setDropdownOpen] = React.useState(false);
  const [currentTime, setCurrentTime] = React.useState('00:00:00');
  const [currentDate, setCurrentDate] = React.useState('Loading date...');
  
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Live Digital Clock
  React.useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString('en-US', { hour12: false }));
      setCurrentDate(now.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }));
    };
    updateClock();
    const intervalId = setInterval(updateClock, 1000);
    return () => clearInterval(intervalId);
  }, []);

  const handleLogout = async () => {
    setDropdownOpen(false);
    await logout();
    router.push('/');
  };

  // Generate dynamic breadcrumbs based on active pathname
  const breadcrumbs = React.useMemo(() => {
    const defaultBrumbs = [
      { label: 'Dashboard', href: '/dashboard/manager' },
      { label: 'Overview', href: '/dashboard/manager', isLast: true }
    ];

    if (!pathname) return defaultBrumbs;

    const segments = pathname.split('/').filter(Boolean);
    
    // Check for profile page
    if (segments.includes('profile')) {
      return [
        { label: 'User Settings', href: '/dashboard/profile' },
        { label: 'My Profile', href: '/dashboard/profile', isLast: true }
      ];
    }

    const roleSegment = segments[1]; // e.g. "manager", "staff", "admin"
    const dashboardHome = `/dashboard/${roleSegment || 'manager'}`;

    if (segments.length <= 2) {
      const roleLabels: Record<string, string> = {
        manager: 'Manager Portal',
        staff: 'Staff Portal',
        admin: 'Admin Portal'
      };
      return [
        { label: roleLabels[roleSegment] || 'Dashboard', href: dashboardHome },
        { label: 'Overview', href: dashboardHome, isLast: true }
      ];
    }

    const pageSegment = segments[2]; // e.g. "facilities", "allocate-slot", "vehicles", "pricing"
    const basePath = `/dashboard/${roleSegment}/${pageSegment}`;

    const labelMap: Record<string, string> = {
      facilities: 'Facility Management',
      'allocate-slot': 'Slot Management',
      vehicles: 'Vehicle Details',
      pricing: 'Pricing Management',
      'check-in': 'Vehicle Check-in',
      'check-out': 'Vehicle Check-out',
      monitoring: 'Slot Monitoring',
      incident: 'Incident Handling',
      reports: 'Shift Reports',
      cards: 'Card Management',
      users: 'User Management',
      roles: 'Role & Permission',
      analytics: 'Parking Analytics',
      devices: 'Device Monitoring',
      settings: 'System Settings'
    };

    const subLabelMap: Record<string, string> = {
      facilities: 'Building Configuration',
      'allocate-slot': 'Slot Allocation',
      vehicles: 'Vehicle List',
      pricing: 'Pricing Workspace',
      'check-in': 'Check-in Workspace',
      'check-out': 'Check-out Workspace',
      monitoring: 'Monitoring Panel',
      incident: 'Incident Panel',
      reports: 'Shift Log',
      cards: 'Card Directory',
      users: 'System Users',
      roles: 'Roles & Permissions',
      analytics: 'Analytics Overview',
      devices: 'Device Status',
      settings: 'Configuration Panel'
    };

    const primaryLabel = labelMap[pageSegment] || pageSegment.charAt(0).toUpperCase() + pageSegment.slice(1);
    const secondaryLabel = subLabelMap[pageSegment] || 'Overview';

    const crumbs: Array<{ label: string; href: string; isLast?: boolean }> = [
      { label: primaryLabel, href: basePath }
    ];

    if (segments.length === 3) {
      crumbs.push({ label: secondaryLabel, href: basePath, isLast: true });
    } else if (segments.length > 3) {
      crumbs.push({ label: secondaryLabel, href: basePath });
      
      const lastSegment = segments[segments.length - 1];
      if (lastSegment === 'new') {
        crumbs.push({ label: 'Add New Building', href: pathname, isLast: true });
      } else if (segments.includes('floors')) {
        crumbs.push({ label: 'Floor Management', href: pathname, isLast: true });
      } else if (segments.includes('access')) {
        crumbs.push({ label: 'Access Control', href: pathname, isLast: true });
      } else {
        crumbs.push({ label: 'Details', href: pathname, isLast: true });
      }
    }

    return crumbs;
  }, [pathname]);

  const userRoleDisplay = React.useMemo(() => {
    if (!user?.role) return 'Manager';
    const role = user.role.toUpperCase();
    if (role === 'MANAGER') return 'Manager';
    if (role === 'STAFF') return 'Staff';
    if (role === 'ADMIN') return 'Administrator';
    return role;
  }, [user]);

  return (
    <header className="flex justify-between items-center h-16 px-8 bg-white sticky top-0 z-40 border-b border-[#d8e3fb] backdrop-blur-md bg-white/90 shadow-sm">
      {/* Left side: Dynamic Breadcrumbs */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 text-slate-500 font-medium text-sm">
          {breadcrumbs.map((crumb, idx) => (
            <React.Fragment key={idx}>
              {idx > 0 && (
                <span className="material-symbols-outlined text-[16px] text-slate-400 select-none">
                  chevron_right
                </span>
              )}
              {crumb.isLast ? (
                <h1 className="font-bold text-slate-800">{crumb.label}</h1>
              ) : (
                <Link href={crumb.href} className="hover:text-emerald-600 transition-colors">
                  {crumb.label}
                </Link>
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Right side: Actions & Profile */}
      <div className="flex items-center gap-6">
        {/* Digital Clock */}
        <div className="hidden md:flex flex-col items-end border-r border-slate-200 pr-6 select-none">
          <span className="font-mono text-sm font-bold text-[#111c2d] tabular-nums leading-none">
            {currentTime}
          </span>
          <span className="text-[10px] text-slate-400 font-medium tracking-wide mt-1">
            {currentDate}
          </span>
        </div>

        {/* Action icons */}
        <div className="flex items-center gap-2 text-slate-500">
          <button className="p-2 hover:bg-slate-100 rounded-full transition-colors relative" title="Notifications">
            <span className="material-symbols-outlined text-[20px]">notifications</span>
            <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-red-600 rounded-full"></span>
          </button>
          <button className="p-2 hover:bg-slate-100 rounded-full transition-colors hidden sm:block" title="Help">
            <span className="material-symbols-outlined text-[20px]">help_outline</span>
          </button>
        </div>

        {/* User profile dropdown container */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen((prev) => !prev)}
            className="flex items-center gap-3 pl-2 text-left focus:outline-none select-none hover:opacity-90 active:scale-[0.98] transition-all"
            id="user-profile-trigger"
          >
            <div className="text-right hidden sm:block">
              <p className="text-sm font-semibold text-slate-800 leading-tight">
                {user?.fullName || 'Alex Thompson'}
              </p>
              <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider">
                {userRoleDisplay}
              </p>
            </div>
            <div className="w-9 h-9 rounded-full border border-[#006d43]/20 flex items-center justify-center bg-slate-200 overflow-hidden relative shadow-sm hover:ring-2 hover:ring-emerald-500/20 transition-all">
              <Image 
                alt="User Profile" 
                className="object-cover" 
                fill
                sizes="36px"
                priority
                src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=256&auto=format&fit=crop"
              />
            </div>
          </button>

          {/* Dropdown Menu block */}
          {dropdownOpen && (
            <div className="absolute right-0 mt-2.5 w-60 bg-white rounded-2xl shadow-xl border border-slate-100 py-2.5 z-50 animate-fade-in origin-top-right">
              {/* Account profile overview */}
              <div className="px-4 py-2 border-b border-slate-50 mb-1.5">
                <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Signed In As</p>
                <p className="text-sm font-semibold text-slate-700 truncate mt-0.5">{user?.fullName || 'Alex Thompson'}</p>
                <p className="text-xs text-slate-400 truncate mt-0.5">{user?.email || 'manager@nexpark.com'}</p>
              </div>

              {/* Navigation Options */}
              <Link
                href="/dashboard/profile"
                onClick={() => setDropdownOpen(false)}
                className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-600 hover:bg-emerald-50/60 hover:text-emerald-600 transition-colors font-medium"
              >
                <span className="material-symbols-outlined text-[18px]">person</span>
                <span>My Profile</span>
              </Link>

              <Link
                href="#"
                onClick={() => setDropdownOpen(false)}
                className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-600 hover:bg-emerald-50/60 hover:text-emerald-600 transition-colors font-medium"
              >
                <span className="material-symbols-outlined text-[18px]">settings</span>
                <span>Settings</span>
              </Link>

              {/* Divider */}
              <div className="h-[1px] bg-slate-100 my-1.5"></div>

              {/* Log out action */}
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-rose-600 hover:bg-rose-50/60 transition-colors font-medium text-left"
              >
                <span className="material-symbols-outlined text-[18px]">logout</span>
                <span>Logout</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

