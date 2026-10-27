import React from 'react';
import { User } from '../types';
import { ShieldCheck, UserCheck, LogOut, ArrowRightLeft, Sparkles, Database } from 'lucide-react';

interface NavbarProps {
  currentUser: User | null;
  onLogout: () => void;
  onSwitchRole: () => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  claimCount: number;
  unverifiedCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  onLogout,
  onSwitchRole,
  activeTab,
  setActiveTab,
  unverifiedCount,
}) => {
  const navItems = [
    { id: 'dashboard', label: 'Ringkasan' },
    {
      id: 'claims',
      label: 'Klaim & Verifikasi',
      badge: unverifiedCount > 0 ? unverifiedCount : undefined,
    },
    { id: 'lab-vault', label: 'Vault Lab (LIS)' },
    { id: 'insights', label: 'Wawasan Data Sampel', isSpecial: true },
    { id: 'audit-chain', label: 'Rantai Segel & Audit' },
  ];

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-emerald-100 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo & Name */}
          <div className="flex items-center gap-6">
            <button
              onClick={() => setActiveTab('dashboard')}
              className="flex items-center gap-2.5 text-left group focus:outline-hidden"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-sm shadow-emerald-200 group-hover:scale-105 transition-transform duration-200">
                <ShieldCheck className="w-6 h-6 stroke-[2.2]" />
              </div>
              <div>
                <span className="text-xl font-bold tracking-tight text-slate-900 group-hover:text-emerald-700 transition-colors">
                  Veri<span className="text-emerald-600">Med</span>
                </span>
                <span className="hidden sm:block text-[11px] font-medium text-slate-600 -mt-0.5">
                  Integritas Klaim Kriptografis
                </span>
              </div>
            </button>

            {/* Cryptographic Chain Status Indicator */}
            <div className="hidden lg:flex items-center gap-2 px-3 py-1 bg-emerald-50/80 border border-emerald-200/60 rounded-full text-xs text-emerald-800">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="font-semibold">Rantai Segel:</span>
              <span className="font-mono text-[11px] text-emerald-700">Ed25519 Utuh</span>
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`relative px-3.5 py-2 rounded-lg text-sm font-medium transition-all duration-150 flex items-center gap-2 ${
                    isActive
                      ? 'bg-emerald-50 text-emerald-800 font-semibold shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  {item.isSpecial && (
                    <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
                  )}
                  {item.label}
                  {item.badge && (
                    <span className="px-1.5 py-0.5 text-[11px] font-bold rounded-full bg-amber-500 text-white leading-none">
                      {item.badge}
                    </span>
                  )}
                  {isActive && (
                    <span className="absolute bottom-0 left-2 right-2 h-0.5 bg-emerald-600 rounded-full"></span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* User Profile & Role Switcher */}
          <div className="flex items-center gap-3">
            {currentUser && (
              <div className="flex items-center gap-2">
                {/* Role Switcher Button */}
                <button
                  onClick={onSwitchRole}
                  title="Ganti Peran Pengguna (Admin/Faskes)"
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-emerald-200 text-xs font-medium text-emerald-700 bg-emerald-50/60 hover:bg-emerald-100/80 transition-colors"
                >
                  <ArrowRightLeft className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Ganti Peran</span>
                </button>

                {/* User Card */}
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200/80 text-left">
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white ${
                      currentUser.role === 'admin'
                        ? 'bg-emerald-600'
                        : 'bg-teal-600'
                    }`}
                  >
                    {currentUser.role === 'admin' ? 'AD' : 'FK'}
                  </div>
                  <div className="hidden sm:block">
                    <p className="text-xs font-semibold text-slate-800 leading-tight truncate max-w-[140px]">
                      {currentUser.name}
                    </p>
                    <p className="text-[10px] text-slate-600 capitalize">
                      {currentUser.role === 'admin' ? 'Admin & Verifikator' : 'Fasilitas Kesehatan'}
                    </p>
                  </div>
                </div>

                {/* Logout Button */}
                <button
                  onClick={onLogout}
                  title="Keluar"
                  className="p-1.5 text-slate-600 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Navigation Tabs */}
      <div className="md:hidden border-t border-slate-100 bg-white px-2 py-1.5 overflow-x-auto flex gap-1 scrollbar-none">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`whitespace-nowrap px-3 py-1.5 rounded-md text-xs font-medium flex items-center gap-1.5 ${
              activeTab === item.id
                ? 'bg-emerald-50 text-emerald-700 font-semibold'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            {item.label}
            {item.badge && (
              <span className="w-4 h-4 text-[10px] rounded-full bg-amber-500 text-white flex items-center justify-center">
                {item.badge}
              </span>
            )}
          </button>
        ))}
      </div>
    </header>
  );
};
