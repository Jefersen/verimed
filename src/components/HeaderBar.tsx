import React from 'react';
import { User } from '../types';
import { Menu, ShieldCheck, ArrowRightLeft, Sparkles } from 'lucide-react';

interface HeaderBarProps {
  currentUser: User | null;
  activeTab: string;
  onOpenMobileSidebar: () => void;
  onSwitchRole: () => void;
  unverifiedCount: number;
}

const TAB_TITLES: Record<string, { title: string; subtitle: string }> = {
  dashboard: {
    title: 'Ringkasan Dashboard',
    subtitle: 'Pemantauan integritas klaim & performa aturan klinis',
  },
  claims: {
    title: 'Pusat Verifikasi & Berkas Klaim',
    subtitle: 'Penelusuran status berkas, antrean telaah risiko, histori versi & segel digital',
  },
  'verification-queue': {
    title: 'Antrean Verifikasi Klaim',
    subtitle: 'Prioritas risiko tinggi, ketidaksesuaian koding, dan telaah bukti objektif',
  },
  findings: {
    title: 'Temuan Aturan & Signal Risiko',
    subtitle: 'Daftar klaim dengan indikasi potensi upcoding, unbundling, atau anomali',
  },
  'lab-vault': {
    title: 'Vault Hasil Laboratorium (LIS)',
    subtitle: 'Rujukan kebenaran faktual objektif hasil pemeriksaan tersegel Level 2',
  },
  klarifikasi: {
    title: 'Permintaan Klarifikasi & Revisi',
    subtitle: 'Tanggapi catatan telaah verifikator dan kirim versi berkas baru',
  },
  profil: {
    title: 'Profil Fasilitas Kesehatan',
    subtitle: 'Identitas instansi, sertifikat LIS, dan status kepatuhan integrasi',
  },
  insights: {
    title: 'Wawasan Agregat Nasional BPJS',
    subtitle: 'Analisis pola koding dan benchmark pada 1.699.219 kunjungan FKRTL',
  },
  'audit-chain': {
    title: 'Rantai Segel & Log Audit Sistem',
    subtitle: 'Penelusuran integritas rantai blok append-only dan jejak audit aktivitas',
  },
  'ai-settings': {
    title: 'Konfigurasi Penyedia AI',
    subtitle: 'Integrasi LLM aman, manajemen kunci terenkripsi, dan mode fallback deterministik',
  },
};

export const HeaderBar: React.FC<HeaderBarProps> = ({
  currentUser,
  activeTab,
  onOpenMobileSidebar,
  onSwitchRole,
  unverifiedCount,
}) => {
  const currentTabInfo = TAB_TITLES[activeTab] || {
    title: 'Dashboard VeriMed',
    subtitle: 'Platform Integritas Klaim Pelayanan Kesehatan',
  };

  return (
    <header className="sticky top-0 z-20 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between gap-4">
      {/* Left: Mobile Hamburger & Page Title */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={onOpenMobileSidebar}
          className="min-[1100px]:hidden p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors"
          aria-label="Buka navigasi menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="min-w-0">
          <h1 className="text-base sm:text-lg font-bold tracking-tight text-slate-900 truncate leading-snug">
            {currentTabInfo.title}
          </h1>
          <p className="hidden sm:block text-xs text-slate-500 truncate">
            {currentTabInfo.subtitle}
          </p>
        </div>
      </div>

      {/* Right: Quick Role Switcher & Status */}
      <div className="flex items-center gap-3 shrink-0">
        {currentUser && (
          <div className="flex items-center gap-2">
            {/* Role indicator pill */}
            <div className="hidden lg:flex items-center gap-1.5 px-3 py-1 bg-emerald-50 rounded-full border border-emerald-200 text-xs font-semibold text-emerald-800">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span>
                Peran Aktif:{' '}
                <strong>
                  {currentUser.role === 'admin' ? 'Admin & Verifikator' : 'Fasilitas Kesehatan'}
                </strong>
              </span>
            </div>

            {/* Quick Switch Button */}
            <button
              onClick={onSwitchRole}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-emerald-200 text-xs font-semibold text-emerald-800 bg-white hover:bg-emerald-50/80 transition-colors shadow-2xs group"
              title="Ganti Peran Pengguna"
            >
              <ArrowRightLeft className="w-3.5 h-3.5 text-emerald-600 group-hover:rotate-180 transition-transform duration-300" />
              <span className="hidden sm:inline">Ganti Peran</span>
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
