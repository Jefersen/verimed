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
      label: "Beranda Faskes",
      description: "Ringkasan & tren klaim",
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
      label: "Beranda Verifikasi",
      description: "Statistik & analitik klaim",
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
      label: "Wawasan Nasional",
      description: "Analitik 1.69M kunjungan",
      icon: BarChart3,
      isHighlighted: true
    },
    {
      id: "audit-chain",
      label: "Rantai Segel & Audit",
      description: "Integritas Ed25519 & log",
      icon: LinkIcon
    },
    {
      id: "ai-settings",
      label: "Pengaturan AI",
      description: "Provider, API Key & Model",
      icon: Cpu
    }
  ];

  const currentMenuItems = isAdmin ? adminMenuItems : faskesMenuItems;

  const handleNavClick = (id) => {
    setActiveTab(id);
    onCloseMobile();
  };

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isOpenMobile && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-slate-950/50 backdrop-blur-xs min-[1100px]:hidden"
          aria-hidden="true"
        />
      )}

      {/* PinHome-Inspired Green Sidebar (Top-Aligned Menu + Connected White Pill with Concave Curves) */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 min-[1100px]:z-20 w-72 min-[1100px]:static min-[1100px]:w-68 h-screen max-h-screen bg-[#0E947A] min-[1100px]:bg-transparent flex flex-col justify-between transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] min-[1100px]:translate-x-0 select-none shrink-0 ${
          isOpenMobile ? "translate-x-0 shadow-2xl" : "-translate-x-full"
        }`}
      >
        {/* Top Section: Brand + Top-Aligned Navigation */}
        <div className="flex flex-col flex-1 min-h-0">
          {/* Brand Logo Header */}
          <div className="px-6 pt-5 pb-3 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <motion.div
                whileHover={{ rotate: -6, scale: 1.06 }}
                transition={{ type: "spring", stiffness: 400, damping: 18 }}
                className="w-9 h-9 rounded-2xl bg-white/15 flex items-center justify-center text-white shrink-0"
              >
                <ShieldCheck className="w-5 h-5 stroke-[2.3]" />
              </motion.div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-lg font-extrabold tracking-tight text-white">
                    VeriMed
                  </span>
                  <span className="w-2 h-2 rounded-full bg-[#F5DF65]" />
                </div>
                <p className="text-[10px] text-emerald-100/80 font-medium leading-none mt-0.5">
                  {isAdmin ? "Portal Verifikator JKN" : "Portal Faskes Mitra"}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onCloseMobile}
              className="min-[1100px]:hidden p-1.5 text-emerald-100 hover:text-white hover:bg-white/10 rounded-xl transition-colors outline-none border-none"
              aria-label="Tutup menu samping"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Primary Navigation Items — Aligned at Top, With Connected White Concave Curves */}
          <nav className="flex-1 pl-4 pr-0 pt-2 space-y-1">
            {currentMenuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;

              return (
                <motion.button
                  key={item.id}
                  type="button"
                  onClick={() => handleNavClick(item.id)}
                  whileTap={{ scale: 0.99 }}
                  className={`w-full relative flex items-center justify-between pl-4 pr-5 py-2.5 rounded-l-full text-left transition-colors duration-200 group outline-none focus:outline-none focus-visible:outline-none border-none ring-0 ${
                    isActive
                      ? "text-slate-900 font-bold"
                      : "text-emerald-50/90 hover:text-white"
                  }`}
                >
                  {/* Connected Pure White Pill Background with Top & Bottom Concave Scoops */}
                  {isActive && (
                    <motion.div
                      layoutId="pinhomeActiveNavPill"
                      className="absolute inset-y-0 left-0 right-0 min-[1100px]:-right-3 bg-white rounded-l-full pointer-events-none"
                      transition={{
                        type: "spring",
                        stiffness: 290,
                        damping: 28,
                        mass: 0.85
                      }}
                    >
                      {/* Top-right concave curve connecting into the white main canvas */}
                      <svg
                        width="20"
                        height="20"
                        viewBox="0 0 20 20"
                        style={{ width: 20, height: 20 }}
                        className="hidden min-[1100px]:block absolute -top-[19px] right-3 w-5 h-5 fill-white pointer-events-none"
                      >
                        <path
                          d="M20 0v20H0C11.046 20 20 11.046 20 0Z"
                          fill="#ffffff"
                        />
                      </svg>
                      {/* Bottom-right concave curve connecting into the white main canvas */}
                      <svg
                        width="20"
                        height="20"
                        viewBox="0 0 20 20"
                        style={{ width: 20, height: 20 }}
                        className="hidden min-[1100px]:block absolute -bottom-[19px] right-3 w-5 h-5 fill-white pointer-events-none"
                      >
                        <path
                          d="M20 20V0H0c11.046 0 20 8.954 20 20Z"
                          fill="#ffffff"
                        />
                      </svg>
                    </motion.div>
                  )}

                  {/* Subtle hover highlight for inactive items */}
                  {!isActive && (
                    <div className="absolute inset-0 rounded-l-full bg-white/0 group-hover:bg-white/10 transition-colors duration-300 pointer-events-none" />
                  )}

                  <div className="relative z-10 flex items-center gap-3 min-w-0">
                    <div
                      className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 transition-all duration-300 ${
                        isActive
                          ? "bg-[#D6F2EE] text-[#0E947A] scale-105"
                          : item.isAction
                            ? "bg-[#F5DF65]/20 text-[#F5DF65] group-hover:bg-[#F5DF65] group-hover:text-slate-900"
                            : "bg-white/10 text-emerald-100 group-hover:bg-white/20 group-hover:text-white"
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5 stroke-[2.2]" />
                    </div>
                    <div className="min-w-0">
                      <p
                        className={`text-xs truncate leading-tight transition-colors ${
                          isActive
                            ? "font-extrabold text-slate-900"
                            : "font-semibold text-white/95 group-hover:text-white"
                        }`}
                      >
                        {item.label}
                      </p>
                      <p
                        className={`text-[10px] truncate mt-0.5 transition-colors ${
                          isActive
                            ? "text-[#0E947A] font-medium"
                            : "text-emerald-100/70 group-hover:text-emerald-100"
                        }`}
                      >
                        {item.description}
                      </p>
                    </div>
                  </div>

                  {/* Badges / Sparkles */}
                  <div className="relative z-10 flex items-center gap-1.5 shrink-0 ml-2">
                    {item.badge !== void 0 && (
                      <span
                        className={`px-2 py-0.5 text-[10px] font-extrabold rounded-full ${
                          isActive
                            ? "bg-[#0E947A] text-white"
                            : item.badgeAlert
                              ? "bg-[#F5DF65] text-slate-900 animate-pulse"
                              : "bg-white/25 text-white"
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                    {item.isHighlighted && !isActive && (
                      <Sparkles className="w-3.5 h-3.5 text-[#F5DF65]" />
                    )}
                  </div>
                </motion.button>
              );
            })}

            {/* Secondary Links (Switch Role & LogOut — Placed Right Below Menu Items) */}
            <div className="pt-3 mt-2 mr-4 space-y-0.5">
              <motion.button
                type="button"
                whileTap={{ scale: 0.98 }}
                onClick={onSwitchRole}
                className="w-full flex items-center justify-between px-4 py-2 rounded-2xl text-emerald-50/90 hover:text-white hover:bg-white/10 transition-all group outline-none border-none"
              >
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-lg bg-white/10 flex items-center justify-center text-emerald-100 group-hover:text-[#F5DF65] transition-colors">
                    <ArrowRightLeft className="w-3.5 h-3.5 group-hover:rotate-180 transition-transform duration-500" />
                  </div>
                  <span className="text-xs font-semibold">Beralih Peran</span>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/15 text-[#F5DF65]">
                  {isAdmin ? "Ke Faskes" : "Ke Admin"}
                </span>
              </motion.button>

              {currentUser && (
                <motion.button
                  type="button"
                  whileTap={{ scale: 0.98 }}
                  onClick={onLogout}
                  className="w-full flex items-center gap-3 px-4 py-2 rounded-2xl text-emerald-100/80 hover:text-white hover:bg-rose-500/20 transition-all group outline-none border-none"
                >
                  <div className="w-6 h-6 rounded-lg bg-white/10 flex items-center justify-center text-emerald-100 group-hover:text-rose-200 transition-colors">
                    <LogOut className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-xs font-semibold">Keluar Akun</span>
                </motion.button>
              )}
            </div>
          </nav>
        </div>

        {/* Bottom Promo / Quick Action Card */}
        <div className="px-5 pb-4 pt-1 shrink-0">
          <motion.div
            whileHover={{ y: -2 }}
            transition={{ type: "spring", stiffness: 300, damping: 24 }}
            className="relative rounded-[26px] bg-[#096E5A]/75 p-3.5 text-white overflow-hidden"
          >
            <div className="relative h-14 mb-1 flex items-center justify-center">
              <div className="w-10 h-10 rounded-full bg-[#F6B8C6] opacity-90 translate-x-4 -translate-y-0.5" />

              <svg
                viewBox="0 0 100 90"
                className="w-16 h-16 absolute left-6 -top-1"
                fill="none"
              >
                <path
                  d="M36 78 C24 78 20 68 22 54 C24 42 29 36 30 26 L27 12 L37 19 C41 18 46 18 50 19 L59 12 L56 26 C57 36 62 42 64 54 C66 68 62 78 50 78 Z"
                  fill="#181F38"
                />
                <path
                  d="M24 72 C12 72 10 58 18 52"
                  stroke="#181F38"
                  strokeWidth="6"
                  strokeLinecap="round"
                />
                <circle cx="43" cy="52" r="8" fill="#0E947A" />
                <path
                  d="M43 48v8M39 52h8"
                  stroke="#F5DF65"
                  strokeWidth="2.4"
                  strokeLinecap="round"
                />
              </svg>
            </div>

            <div className="relative z-10 text-center">
              <h4 className="text-xs font-extrabold tracking-tight text-white">
                {isAdmin ? "Audit Rantai Segel!" : "Segel Klaim Baru!"}
              </h4>
              <p className="text-[10px] text-emerald-100/85 mt-0.5 leading-snug">
                {isAdmin
                  ? "Verifikasi keutuhan Merkle Tree & Ed25519."
                  : "Ajukan klaim dengan proteksi Merkle Tree."}
              </p>

              <motion.button
                type="button"
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.96 }}
                onClick={() =>
                  handleNavClick(isAdmin ? "audit-chain" : "new-claim")
                }
                className="mt-2.5 w-full py-1.5 px-4 rounded-full bg-[#F5DF65] hover:bg-[#FACC15] text-slate-900 font-extrabold text-[11px] transition-colors cursor-pointer outline-none border-none"
              >
                {isAdmin ? "Cek Integritas" : "+ Ajukan Klaim"}
              </motion.button>
            </div>
          </motion.div>
        </div>
      </aside>
    </>
  );
};

export { Sidebar };
