import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Menu,
  ArrowRightLeft,
  Search,
  Bell,
  FileText,
  ShieldAlert,
  CheckCircle2,
  X,
  ArrowRight
} from "lucide-react";

const TAB_TITLES = {
  dashboard: {
    title: "Ringkasan Dashboard",
    subtitle: "Pemantauan integritas klaim & performa aturan klinis"
  },
  claims: {
    title: "Pusat Verifikasi & Berkas Klaim",
    subtitle: "Penelusuran status berkas, antrean telaah risiko, histori versi & segel digital"
  },
  "verification-queue": {
    title: "Antrean Verifikasi Klaim",
    subtitle: "Prioritas risiko tinggi, ketidaksesuaian koding, dan telaah bukti objektif"
  },
  findings: {
    title: "Temuan Aturan & Signal Risiko",
    subtitle: "Daftar klaim dengan indikasi potensi upcoding, unbundling, atau anomali"
  },
  "lab-vault": {
    title: "Vault Hasil Laboratorium (LIS)",
    subtitle: "Rujukan kebenaran faktual objektif hasil pemeriksaan tersegel Level 2"
  },
  klarifikasi: {
    title: "Permintaan Klarifikasi & Revisi",
    subtitle: "Tanggapi catatan telaah verifikator dan kirim versi berkas baru"
  },
  profil: {
    title: "Profil Fasilitas Kesehatan",
    subtitle: "Identitas instansi, sertifikat LIS, dan status kepatuhan integrasi"
  },
  insights: {
    title: "Wawasan Agregat Nasional BPJS",
    subtitle: "Analisis pola koding dan benchmark pada 1.699.219 kunjungan FKRTL"
  },
  "audit-chain": {
    title: "Rantai Segel & Log Audit Sistem",
    subtitle: "Penelusuran integritas rantai blok append-only dan jejak audit aktivitas"
  },
  "ai-settings": {
    title: "Konfigurasi Penyedia AI",
    subtitle: "Integrasi LLM aman, manajemen kunci terenkripsi, dan mode fallback deterministik"
  }
};

const HeaderBar = ({
  currentUser,
  activeTab,
  onOpenMobileSidebar,
  onSwitchRole,
  unverifiedCount = 0,
  clarificationCount = 0,
  claims = [],
  onSelectClaim,
  onNavigateTab
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const searchRef = useRef(null);
  const notifRef = useRef(null);

  const isAdmin = currentUser?.role === "admin";
  const currentTabInfo = TAB_TITLES[activeTab] || {
    title: "Dashboard VeriMed",
    subtitle: "Platform Integritas Klaim Pelayanan Kesehatan"
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setIsSearchFocused(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setIsNotifOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const visibleClaims = isAdmin
    ? claims
    : claims.filter((c) => c.facilityId === currentUser?.facilityId);

  const filteredClaims = searchQuery.trim()
    ? visibleClaims
        .filter(
          (c) =>
            c.claimNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
            c.patientPseudoId.toLowerCase().includes(searchQuery.toLowerCase()) ||
            c.primaryDiagnosis.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            c.inacbgCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (c.facilityName || "").toLowerCase().includes(searchQuery.toLowerCase())
        )
        .slice(0, 5)
    : [];

  const badgeCount = isAdmin ? unverifiedCount : clarificationCount;

  return (
    <header className="shrink-0 z-30 bg-white px-5 sm:px-8 lg:px-10 pt-5 pb-3 flex items-center justify-between gap-4">
      {/* Left: Mobile Menu & Borderless PinHome Search Bar */}
      <div className="flex items-center gap-3 flex-1 max-w-xl">
        <button
          type="button"
          onClick={onOpenMobileSidebar}
          className="min-[1100px]:hidden p-2 text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-xl transition-colors outline-none border-none"
          aria-label="Buka navigasi menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Clean Borderless Search Input (PinHome Style) */}
        <div ref={searchRef} className="relative flex-1 max-w-md">
          <div
            className={`flex items-center gap-2.5 px-3 py-2 rounded-full transition-colors duration-200 ${
              isSearchFocused ? "bg-[#D6F2EE]/40" : "bg-transparent hover:bg-slate-50"
            }`}
          >
            <Search
              className={`w-4 h-4 shrink-0 transition-colors ${
                isSearchFocused ? "text-[#0E947A]" : "text-slate-400"
              }`}
            />
            <input
              type="text"
              value={searchQuery}
              onFocus={() => setIsSearchFocused(true)}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={`Cari klaim, pasien, kode INA-CBG... (${currentTabInfo.title})`}
              className="w-full bg-transparent text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none border-none"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="p-0.5 text-slate-400 hover:text-slate-600 rounded-full outline-none border-none"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Live Search Results Dropdown */}
          <AnimatePresence>
            {isSearchFocused && searchQuery.trim().length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 6, scale: 0.98 }}
                transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                className="absolute left-0 right-0 top-full mt-2 bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden z-50"
              >
                <div className="px-3.5 py-2 bg-slate-50/70 flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Hasil Pencarian Berkas ({filteredClaims.length})
                  </span>
                </div>
                {filteredClaims.length > 0 ? (
                  <div className="divide-y divide-slate-50 max-h-72 overflow-y-auto">
                    {filteredClaims.map((c) => (
                      <button
                        type="button"
                        key={c.id}
                        onClick={() => {
                          if (onSelectClaim) onSelectClaim(c);
                          setIsSearchFocused(false);
                          setSearchQuery("");
                        }}
                        className="w-full px-4 py-3 text-left hover:bg-emerald-50/40 transition-colors flex items-center justify-between gap-3 group outline-none border-none"
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-mono font-bold text-slate-900 group-hover:text-[#0E947A]">
                              #{c.claimNumber}
                            </span>
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#D6F2EE] text-[#0E947A] font-bold">
                              {c.inacbgCode}
                            </span>
                          </div>
                          <p className="text-xs text-slate-600 truncate mt-0.5">
                            {c.primaryDiagnosis.name} • {c.patientPseudoId}
                          </p>
                        </div>
                        <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#0E947A] shrink-0" />
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="p-5 text-center text-xs text-slate-400">
                    Tidak ada berkas klaim yang cocok dengan &ldquo;{searchQuery}&rdquo;
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Right: Role Switcher + User Profile + Notification Bell */}
      <div className="flex items-center gap-3 sm:gap-5 shrink-0">
        {currentUser && (
          <>
            <motion.button
              type="button"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              onClick={onSwitchRole}
              className="hidden sm:flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#D6F2EE]/70 hover:bg-[#D6F2EE] text-[#0E947A] text-xs font-bold transition-colors cursor-pointer group outline-none border-none"
              title="Beralih Peran Simulasi"
            >
              <ArrowRightLeft className="w-3.5 h-3.5 text-[#0E947A] group-hover:rotate-180 transition-transform duration-500" />
              <span>{isAdmin ? "Mode Admin" : "Mode Faskes"}</span>
            </motion.button>

            <div className="flex items-center gap-3">
              <div className="hidden md:block text-right">
                <p className="text-xs font-extrabold text-slate-800 leading-tight">
                  {currentUser.name}
                </p>
                <p className="text-[10px] font-medium text-slate-400">
                  {isAdmin
                    ? "Verifikator Utama BPJS"
                    : currentUser.facilityName || "Faskes Mitra"}
                </p>
              </div>

              <div className="relative">
                <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-[#0E947A] to-[#2DD4BF] p-0.5">
                  <div className="w-full h-full rounded-full bg-emerald-950/10 flex items-center justify-center text-white font-extrabold text-xs">
                    {isAdmin ? "PW" : "RP"}
                  </div>
                </div>
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white" />
              </div>
            </div>

            <div ref={notifRef} className="relative">
              <motion.button
                type="button"
                whileTap={{ scale: 0.93 }}
                onClick={() => setIsNotifOpen((prev) => !prev)}
                className="relative p-2 rounded-full text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer outline-none border-none"
                aria-label="Notifikasi"
              >
                <Bell className="w-5 h-5 stroke-[2]" />
                {badgeCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white animate-pulse" />
                )}
              </motion.button>

              <AnimatePresence>
                {isNotifOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 6, scale: 0.96 }}
                    transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                    className="absolute right-0 mt-2 w-80 bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden z-50"
                  >
                    <div className="px-4 py-3 bg-slate-50/80 flex items-center justify-between">
                      <span className="text-xs font-extrabold text-slate-800">
                        Notifikasi Sistem
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#D6F2EE] text-[#0E947A]">
                        {badgeCount} Aktif
                      </span>
                    </div>

                    <div className="p-3 space-y-2 max-h-64 overflow-y-auto">
                      {isAdmin ? (
                        <button
                          type="button"
                          onClick={() => {
                            if (onNavigateTab) onNavigateTab("claims");
                            setIsNotifOpen(false);
                          }}
                          className="w-full p-3 rounded-2xl bg-slate-50 hover:bg-[#D6F2EE]/40 text-left transition-colors flex items-start gap-3 outline-none border-none"
                        >
                          <div className="w-8 h-8 rounded-xl bg-[#D6F2EE] text-[#0E947A] flex items-center justify-center shrink-0">
                            <FileText className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="text-xs font-bold text-slate-800">
                              {unverifiedCount} Klaim Menunggu Verifikasi
                            </p>
                            <p className="text-[11px] text-slate-500 mt-0.5">
                              Klik untuk membuka antrean prioritas telaah verifikator.
                            </p>
                          </div>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            if (onNavigateTab) onNavigateTab("klarifikasi");
                            setIsNotifOpen(false);
                          }}
                          className="w-full p-3 rounded-2xl bg-amber-50/70 hover:bg-amber-50 text-left transition-colors flex items-start gap-3 outline-none border-none"
                        >
                          <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                            <ShieldAlert className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="text-xs font-bold text-slate-800">
                              {clarificationCount} Permintaan Klarifikasi
                            </p>
                            <p className="text-[11px] text-slate-500 mt-0.5">
                              Tanggapi catatan verifikator dan segel revisi klaim.
                            </p>
                          </div>
                        </button>
                      )}

                      <div className="p-3 rounded-2xl bg-emerald-50/40 flex items-start gap-3">
                        <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                          <CheckCircle2 className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-800">
                            Mesin Kriptografi Ed25519 Aktif
                          </p>
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            Seluruh blok Merkle Tree tersinkronisasi dengan Vault.
                          </p>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </>
        )}
      </div>
    </header>
  );
};

export { HeaderBar };
