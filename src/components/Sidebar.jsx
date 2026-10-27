import { motion } from "motion/react";
import {
  ShieldCheck,
  LayoutDashboard,
  FileCheck2,
  FlaskConical,
  BarChart3,
  Link as LinkIcon,
  ArrowRightLeft,
  LogOut,
  Sparkles,
  X,
  PlusCircle,
  MessageSquare,
  Cpu,
  Building2
} from "lucide-react";
const Sidebar = ({
  currentUser,
  activeTab,
  setActiveTab,
  onLogout,
  onSwitchRole,
  unverifiedCount,
  clarificationCount = 0,
  isOpenMobile,
  onCloseMobile
}) => {
  const isAdmin = currentUser?.role === "admin";
  const faskesMenuItems = [
    {
      id: "dashboard",
      label: "Dashboard Faskes",
      description: "Ringkasan aktivitas faskes",
      icon: LayoutDashboard
    },
    {
      id: "new-claim",
      label: "Ajukan Klaim Baru",
      description: "Input berkas & segel Merkle",
      icon: PlusCircle,
      isAction: true
    },
    {
      id: "claims",
      label: "Klaim Saya",
      description: "Daftar & status verifikasi",
      icon: FileCheck2
    },
    {
      id: "lab-vault",
      label: "Data Lab (LIS)",
      description: "Kirim & lihat hasil lab",
      icon: FlaskConical
    },
    {
      id: "klarifikasi",
      label: "Klarifikasi & Revisi",
      description: "Permintaan verifikator",
      icon: MessageSquare,
      badge: clarificationCount > 0 ? clarificationCount : void 0,
      badgeAlert: true
    },
    {
      id: "profil",
      label: "Profil Faskes",
      description: "Identitas & sertifikat LIS",
      icon: Building2
    }
  ];
  const adminMenuItems = [
    {
      id: "dashboard",
      label: "Dashboard Verifikasi",
      description: "Statistik pengawasan klaim",
      icon: LayoutDashboard
    },
    {
      id: "claims",
      label: "Verifikasi & Klaim",
      description: "Antrean telaah & daftar klaim",
      icon: FileCheck2,
      badge: unverifiedCount > 0 ? unverifiedCount : void 0
    },
    {
      id: "lab-vault",
      label: "Vault Hasil Lab (LIS)",
      description: "Ground truth rujukan objektif",
      icon: FlaskConical
    },
    {
      id: "insights",
      label: "Wawasan Data Sampel",
      description: "Analitik 1.69M kunjungan",
      icon: BarChart3,
      isHighlighted: true
    },
    {
      id: "audit-chain",
      label: "Rantai Segel & Log Audit",
      description: "Integritas Ed25519 & audit trail",
      icon: LinkIcon
    },
    {
      id: "ai-settings",
      label: "Pengaturan Koneksi AI",
      description: "Provider, API Key & Model",
      icon: Cpu
    }
  ];
  const currentMenuItems = isAdmin ? adminMenuItems : faskesMenuItems;
  const handleNavClick = (id) => {
    setActiveTab(id);
    onCloseMobile();
  };
  return <>
      {
    /* Mobile Backdrop Overlay */
  }
      {isOpenMobile && <div
    onClick={onCloseMobile}
    className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-xs min-[1100px]:hidden"
    aria-hidden="true"
  />}

      {
    /* Main Sidebar */
  }
      <aside
    className={`fixed top-0 bottom-0 left-0 z-50 w-72 bg-white border-r border-slate-200/80 flex flex-col transition-transform duration-300 ease-in-out min-[1100px]:translate-x-0 ${isOpenMobile ? "translate-x-0" : "-translate-x-full"}`}
  >
        {
    /* Brand Header */
  }
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-md shadow-emerald-200 shrink-0">
              <ShieldCheck className="w-6 h-6 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center">
                <span className="text-xl font-bold tracking-tight text-slate-900">
                  Veri<span className="text-emerald-600">Med</span>
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium">
                Integritas Klaim Kriptografis
              </p>
            </div>
          </div>

          <button
    onClick={onCloseMobile}
    className="min-[1100px]:hidden p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg"
    aria-label="Tutup menu samping"
  >
            <X className="w-5 h-5" />
          </button>
        </div>

        {
    /* Role Identification Header */
  }
        <div className="px-5 pt-3.5 pb-2">
          <div
    className={`flex items-center justify-between px-3.5 py-2 rounded-xl text-xs border ${isAdmin ? "bg-emerald-50/70 border-emerald-200/80 text-emerald-950" : "bg-teal-50/70 border-teal-200/80 text-teal-950"}`}
  >
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="font-semibold">
                {isAdmin ? "Portal Admin & Verifikator" : "Portal Faskes Pengaju"}
              </span>
            </div>
            <span className="text-[10px] font-mono font-bold uppercase text-slate-500">
              {currentUser?.role}
            </span>
          </div>
        </div>

        {
    /* Navigation Menu */
  }
        <nav className="flex-1 px-3.5 py-2 space-y-1 overflow-y-auto">
          <div className="px-3 pb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            {isAdmin ? "Menu Pengawasan & Verifikasi" : "Menu Layanan Faskes"}
          </div>

          {currentMenuItems.map((item) => {
    const Icon = item.icon;
    const isActive = activeTab === item.id;
    return <button
      key={item.id}
      onClick={() => handleNavClick(item.id)}
      className={`w-full relative flex items-center justify-between px-3 py-2.5 rounded-xl text-left transition-colors group ${isActive ? "text-white font-semibold" : "text-slate-700 hover:bg-emerald-50/60 hover:text-emerald-900"}`}
    >
                {isActive && <motion.div
      layoutId="activeNavIndicator"
      className="absolute inset-0 bg-emerald-600 rounded-xl shadow-xs shadow-emerald-200"
      transition={{ type: "spring", stiffness: 380, damping: 32 }}
    />}
                <div className="relative z-10 flex items-center gap-3 min-w-0">
                  <div
      className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-colors ${isActive ? "bg-white/20 text-white" : "bg-slate-100 text-slate-500 group-hover:bg-emerald-100 group-hover:text-emerald-700"}`}
    >
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                  <div className="min-w-0">
                    <p className={`text-xs font-bold truncate leading-tight ${isActive ? "text-white" : "text-slate-800"}`}>
                      {item.label}
                    </p>
                    <p
      className={`text-[10px] truncate mt-0.5 ${isActive ? "text-emerald-100" : "text-slate-400 group-hover:text-slate-500"}`}
    >
                      {item.description}
                    </p>
                  </div>
                </div>

                <div className="relative z-10 flex items-center gap-1.5 shrink-0 ml-2">
                  {item.badge !== void 0 && <span
      className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${isActive ? "bg-white text-emerald-800 font-bold" : item.badgeAlert ? "bg-amber-500 text-white animate-pulse" : "bg-emerald-600 text-white"}`}
    >
                      {item.badge}
                    </span>}
                  {item.isHighlighted && !isActive && <Sparkles className="w-3.5 h-3.5 text-emerald-500" />}
                </div>
              </button>;
  })}
        </nav>

        {
    /* Footer / User Profile & Role Switcher */
  }
        {currentUser && <div className="p-4 border-t border-slate-100 bg-slate-50/70 space-y-2.5">
            {
    /* Quick Role Switcher Button */
  }
            <button
    onClick={onSwitchRole}
    className="w-full flex items-center justify-between px-3 py-2 rounded-xl border border-emerald-200 text-xs font-semibold text-emerald-800 bg-white hover:bg-emerald-50/80 transition-colors shadow-2xs group"
  >
              <div className="flex items-center gap-2">
                <ArrowRightLeft className="w-3.5 h-3.5 text-emerald-600 group-hover:rotate-180 transition-transform duration-300" />
                <span>Beralih Peran</span>
              </div>
              <span className="text-[10px] font-mono text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded-md font-bold">
                {currentUser.role === "admin" ? "Ke Faskes" : "Ke Admin"}
              </span>
            </button>

            {
    /* User Profile Card */
  }
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-white border border-slate-200/80 shadow-2xs">
              <div className="flex items-center gap-2.5 min-w-0">
                <div
    className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold text-white shrink-0 shadow-2xs ${currentUser.role === "admin" ? "bg-gradient-to-br from-emerald-600 to-teal-700" : "bg-gradient-to-br from-teal-600 to-emerald-700"}`}
  >
                  {currentUser.role === "admin" ? "AD" : "FK"}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-slate-900 truncate leading-tight">
                    {currentUser.name}
                  </p>
                  <p className="text-[10px] text-slate-500 truncate mt-0.5">
                    {currentUser.role === "admin" ? "Admin & Verifikator" : currentUser.facilityName || "Faskes"}
                  </p>
                </div>
              </div>

              <button
    onClick={onLogout}
    title="Keluar dari Akun"
    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors shrink-0 ml-1"
    aria-label="Logout"
  >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>}
      </aside>
    </>;
};
export {
  Sidebar
};
