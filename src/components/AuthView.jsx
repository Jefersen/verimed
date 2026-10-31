import { useState } from "react";
import {
  ShieldCheck,
  UserCheck,
  Building2,
  ShieldAlert,
  Eye,
  EyeOff
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

const AuthView = ({ onLoginSuccess, demoUsers }) => {
  const [isRegister, setIsRegister] = useState(false);
  const [selectedRole, setSelectedRole] = useState("admin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [facilityName, setFacilityName] = useState("");
  const [pairingCode, setPairingCode] = useState("BPJS-KC-JKT01");
  const [errorMsg, setErrorMsg] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCustomSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    if (!email || !password) {
      setErrorMsg("Harap lengkapi email dan kata sandi.");
      return;
    }
    if (isRegister && !name) {
      setErrorMsg("Harap isi nama lengkap pengguna.");
      return;
    }
    if (isRegister && selectedRole === "faskes" && !facilityName) {
      setErrorMsg("Harap isi nama Rumah Sakit / Faskes.");
      return;
    }
    const cleanPairing = pairingCode.trim().toUpperCase() || "BPJS-KC-JKT01";

    setIsSubmitting(true);
    try {
      const endpoint = isRegister ? "/api/auth/register" : "/api/auth/login";
      const payload = {
        email: email.trim(),
        password,
        role: selectedRole,
        name: name.trim(),
        facilityName: facilityName.trim(),
        pairingCode: cleanPairing
      };
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) {
        setErrorMsg(data.error || "Gagal memproses autentikasi ke server.");
        setIsSubmitting(false);
        return;
      }
      if (data.token) {
        sessionStorage.setItem("verimed_token", data.token);
      }
      onLoginSuccess(data.user);
    } catch {
      // Fallback offline in case server is unreachable
      const fallbackUser = {
        id: `USR-${Date.now()}`,
        name: name || (email.split("@")[0] ?? "User"),
        email: email.trim(),
        role: selectedRole,
        isDemo: false,
        pairingCode: cleanPairing,
        facilityId:
          selectedRole === "faskes"
            ? `FK-${Date.now().toString().slice(-4)}`
            : void 0,
        facilityName:
          selectedRole === "faskes"
            ? facilityName || "Faskes Mandiri"
            : "Kantor BPJS Cabang"
      };
      onLoginSuccess(fallbackUser);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickLogin = (role, index) => {
    const target = demoUsers.find((u) => u.role === role) || demoUsers[index];
    if (target) {
      onLoginSuccess({ ...target, isDemo: true });
    }
  };

  const handleAutoFillDemo = () => {
    setErrorMsg("");
    if (selectedRole === "admin") {
      setEmail("budi.setiawan@bpjs-kesehatan.go.id");
      setPassword("verimed2026");
    } else {
      setEmail("rina.puspita@siloam-sejahtera.id");
      setPassword("faskes2026");
    }
  };

  return (
    <div className="h-screen max-h-screen w-full overflow-y-auto bg-[#EBF4F2] flex items-center justify-center p-3 sm:p-6 lg:p-8 select-none">
      {/* Main Split White Card (Reference Layout) */}
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-[1060px] bg-white rounded-[36px] sm:rounded-[42px] shadow-[0_25px_70px_-15px_rgba(14,148,122,0.14)] p-4 sm:p-6 lg:p-7 grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-stretch relative overflow-hidden"
      >
        {/* Top-Right Soft Blurred Ambient Glow (Matching Reference Card Corner Glow in Emerald/Mint) */}
        <div className="w-72 h-72 rounded-full bg-gradient-to-br from-[#2DD4BF]/30 via-[#0E947A]/20 to-transparent blur-3xl absolute -top-20 -right-20 pointer-events-none" />
        {/* Bottom-Left Soft Ambient Glow */}
        <div className="w-60 h-60 rounded-full bg-[#D6F2EE]/50 blur-3xl absolute -bottom-16 -left-16 pointer-events-none" />

        {/* LEFT COLUMN: Rounded Emerald Showcase Panel with 3D-Style Desk Character Illustration */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.55, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
          className="lg:col-span-6 rounded-[30px] sm:rounded-[34px] bg-gradient-to-b from-[#13A88B] via-[#0E947A] to-[#09735E] p-7 sm:p-10 text-white flex flex-col justify-between relative overflow-hidden min-h-[420px] lg:min-h-[560px] shadow-lg shadow-[#0E947A]/20"
        >
          {/* Subtle Ambient Radial Highlight Inside Left Card */}
          <div className="w-80 h-80 rounded-full bg-white/10 blur-3xl absolute bottom-10 left-1/2 -translate-x-1/2 pointer-events-none" />

          {/* Top Marketing / Platform Headline */}
          <div className="relative z-10">
            <motion.h2
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.16 }}
              className="text-2xl sm:text-3xl lg:text-[32px] font-extrabold leading-[1.22] tracking-tight text-white"
            >
              Sederhanakan manajemen & verifikasi klaim dengan dashboard kami
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.24 }}
              className="text-xs sm:text-[13px] text-emerald-50/85 mt-3.5 leading-relaxed max-w-sm font-medium"
            >
              Sederhanakan pengelolaan klaim INA-CBG faskes dan audit segel
              kriptografi Merkle Tree melalui dashboard yang ramah pengguna.
            </motion.p>
          </div>

          {/* Bottom 3D-Styled Character at Desk Illustration (Matching Reference Pose & Composition) */}
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.28, ease: [0.22, 1, 0.36, 1] }}
            className="relative z-10 mt-6 flex items-end justify-center"
          >
            <svg
              viewBox="0 0 420 290"
              className="w-full max-w-[390px] h-auto drop-shadow-[0_14px_24px_rgba(4,45,36,0.28)]"
              fill="none"
            >
              <defs>
                <linearGradient id="skinGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#FFD6C9" />
                  <stop offset="100%" stopColor="#F5B19C" />
                </linearGradient>
                <linearGradient id="sweaterGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#FFFFFF" />
                  <stop offset="100%" stopColor="#DCECE8" />
                </linearGradient>
                <linearGradient id="pantsGrad" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#096B58" />
                  <stop offset="100%" stopColor="#05473A" />
                </linearGradient>
                <linearGradient id="hatGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#F7C59F" />
                  <stop offset="100%" stopColor="#E09F70" />
                </linearGradient>
                <linearGradient id="deskGrad" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#075E4D" />
                  <stop offset="50%" stopColor="#0B7A64" />
                  <stop offset="100%" stopColor="#075E4D" />
                </linearGradient>
                <linearGradient id="monitorGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#263238" />
                  <stop offset="100%" stopColor="#11171A" />
                </linearGradient>
                <linearGradient id="laptopGrad" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#F5DF65" />
                  <stop offset="100%" stopColor="#E0B826" />
                </linearGradient>
                <linearGradient id="plantGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#A7F3D0" />
                  <stop offset="100%" stopColor="#34D399" />
                </linearGradient>
              </defs>

              {/* Floor Shadow Line */}
              <ellipse
                cx="210"
                cy="275"
                rx="175"
                ry="6"
                fill="#054A3C"
                opacity="0.55"
              />

              {/* Potted Plant on Left (Matching Reference Plant) */}
              <g>
                {/* Green Foliages */}
                <circle cx="54" cy="232" r="14" fill="url(#plantGrad)" />
                <circle cx="54" cy="214" r="11" fill="#6EE7B7" />
                {/* Terracotta Pot */}
                <path
                  d="M44 252 L64 252 L61 273 L47 273 Z"
                  fill="#C85A53"
                />
                <rect
                  x="42"
                  y="249"
                  width="24"
                  height="5"
                  rx="2.5"
                  fill="#E07A72"
                />
              </g>

              {/* Office Chair Base & Wheels (Center Under Desk) */}
              <g>
                <rect x="206" y="218" width="8" height="44" fill="#CBD5E1" />
                <path
                  d="M180 268 Q210 255 240 268"
                  stroke="#CBD5E1"
                  strokeWidth="5"
                  strokeLinecap="round"
                />
                <circle cx="180" cy="272" r="4" fill="#1E293B" />
                <circle cx="210" cy="272" r="4" fill="#1E293B" />
                <circle cx="240" cy="272" r="4" fill="#1E293B" />
                {/* Chair Cushion */}
                <rect
                  x="182"
                  y="206"
                  width="56"
                  height="14"
                  rx="7"
                  fill="#E58C8A"
                />
              </g>

              {/* Character Upper Body & Raised Peace-Sign Arm */}
              <motion.g
                animate={{ y: [0, -3, 0] }}
                transition={{
                  duration: 3.6,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              >
                {/* Raised Right Arm (Cheering with Peace Sign ✌️) */}
                <path
                  d="M242 152 L276 92"
                  stroke="url(#sweaterGrad)"
                  strokeWidth="18"
                  strokeLinecap="round"
                />
                {/* Peace Sign Hand */}
                <circle cx="280" cy="82" r="9" fill="url(#skinGrad)" />
                {/* Two Peace Fingers */}
                <path
                  d="M277 74 L274 60 M283 74 L288 61"
                  stroke="url(#skinGrad)"
                  strokeWidth="4.5"
                  strokeLinecap="round"
                />

                {/* Left Arm Resting on Desk */}
                <path
                  d="M178 154 L152 178"
                  stroke="url(#sweaterGrad)"
                  strokeWidth="17"
                  strokeLinecap="round"
                />
                <circle cx="148" cy="180" r="7" fill="url(#skinGrad)" />

                {/* White Turtleneck Sweater Torso */}
                <path
                  d="M174 142 C174 130 246 130 246 142 L252 192 L168 192 Z"
                  fill="url(#sweaterGrad)"
                />
                <rect
                  x="194"
                  y="122"
                  width="32"
                  height="14"
                  rx="6"
                  fill="#DCECE8"
                />

                {/* Head & Hat */}
                {/* Wide Brim Hat (Matching Reference Character) */}
                <ellipse
                  cx="210"
                  cy="74"
                  rx="38"
                  ry="9"
                  fill="url(#hatGrad)"
                />
                <path
                  d="M192 70 C192 56 228 56 228 70 Z"
                  fill="#E76F51"
                />
                {/* Dark Hair */}
                <path
                  d="M182 88 C182 70 238 70 238 88 L236 102 L184 102 Z"
                  fill="#1E1B2E"
                />
                {/* Face */}
                <rect
                  x="186"
                  y="80"
                  width="48"
                  height="44"
                  rx="22"
                  fill="url(#skinGrad)"
                />
                {/* Ears */}
                <circle cx="184" cy="102" r="6" fill="#F5B19C" />
                <circle cx="236" cy="102" r="6" fill="#F5B19C" />
                {/* Rosy Cheeks */}
                <circle cx="195" cy="106" r="5" fill="#F28482" opacity="0.55" />
                <circle cx="225" cy="106" r="5" fill="#F28482" opacity="0.55" />
                {/* Eyes */}
                <circle cx="199" cy="98" r="3.2" fill="#1E1B2E" />
                <circle cx="221" cy="98" r="3.2" fill="#1E1B2E" />
                <circle cx="200" cy="97" r="1" fill="#FFFFFF" />
                <circle cx="222" cy="97" r="1" fill="#FFFFFF" />
                {/* Cute Nose & Happy Smile */}
                <ellipse cx="210" cy="102" rx="3" ry="2.2" fill="#E59882" />
                <path
                  d="M203 111 Q210 117 217 111"
                  stroke="#9D5C50"
                  strokeWidth="2.4"
                  strokeLinecap="round"
                />
              </motion.g>

              {/* Desk Surface & Legs */}
              <g>
                {/* Desk Legs */}
                <rect x="88" y="190" width="9" height="82" fill="#065243" />
                <rect x="324" y="190" width="9" height="82" fill="#065243" />
                <rect
                  x="80"
                  y="269"
                  width="25"
                  height="5"
                  rx="2.5"
                  fill="#043D31"
                />
                <rect
                  x="316"
                  y="269"
                  width="25"
                  height="5"
                  rx="2.5"
                  fill="#043D31"
                />
                {/* Desk Top Bar */}
                <rect
                  x="64"
                  y="184"
                  width="292"
                  height="10"
                  rx="5"
                  fill="url(#deskGrad)"
                />
                {/* Sticky Note Hanging on Right of Desk */}
                <path
                  d="M306 192 L320 192 L323 207 L309 207 Z"
                  fill="#E2E8F0"
                />
              </g>

              {/* Character Crossed/Outstretched Legs Under Desk (Matching Reference) */}
              <g>
                {/* Left Leg */}
                <path
                  d="M196 196 L156 236"
                  stroke="url(#pantsGrad)"
                  strokeWidth="22"
                  strokeLinecap="round"
                />
                {/* Right Leg */}
                <path
                  d="M224 196 L264 236"
                  stroke="url(#pantsGrad)"
                  strokeWidth="22"
                  strokeLinecap="round"
                />
                {/* Left Sneaker */}
                <path
                  d="M134 232 L158 242 L152 252 L128 242 Z"
                  fill="#0E947A"
                />
                <path
                  d="M128 242 L152 252"
                  stroke="#FFFFFF"
                  strokeWidth="4"
                  strokeLinecap="round"
                />
                {/* Right Sneaker */}
                <path
                  d="M286 232 L262 242 L268 252 L292 242 Z"
                  fill="#0E947A"
                />
                <path
                  d="M292 242 L268 252"
                  stroke="#FFFFFF"
                  strokeWidth="4"
                  strokeLinecap="round"
                />
              </g>

              {/* Desktop Monitor on Left of Desk */}
              <g>
                {/* Sparkle Lines Above Monitor */}
                <path
                  d="M116 96 L112 84 M126 94 L126 80 M136 96 L142 85"
                  stroke="#FFFFFF"
                  strokeWidth="2.8"
                  strokeLinecap="round"
                />
                {/* Monitor Screen */}
                <rect
                  x="86"
                  y="108"
                  width="74"
                  height="54"
                  rx="6"
                  fill="url(#monitorGrad)"
                />
                {/* Sticky Note on Monitor */}
                <rect
                  x="136"
                  y="124"
                  width="11"
                  height="14"
                  rx="1.5"
                  fill="#FEF08A"
                />
                {/* Monitor Stand */}
                <path
                  d="M115 144 L131 144 L136 184 L110 184 Z"
                  fill="#CBD5E1"
                />
                <rect
                  x="104"
                  y="181"
                  width="38"
                  height="4"
                  rx="2"
                  fill="#94A3B8"
                />
              </g>

              {/* Laptop on Stand on Right of Desk */}
              <g>
                {/* Stand Base */}
                <path
                  d="M262 184 L298 184 L292 166 L268 166 Z"
                  fill="#94A3B8"
                />
                {/* Laptop Lid (Golden Yellow Accent) */}
                <path
                  d="M258 134 L310 134 L302 166 L250 166 Z"
                  fill="url(#laptopGrad)"
                />
                {/* Stickers on Laptop */}
                <circle cx="282" cy="148" r="4.5" fill="#0E947A" />
                <rect
                  x="264"
                  y="152"
                  width="9"
                  height="6"
                  rx="1.5"
                  fill="#F43F5E"
                />
              </g>
            </svg>
          </motion.div>
        </motion.div>

        {/* RIGHT COLUMN: Clean White Login / Register Form Area */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.55, delay: 0.14, ease: [0.22, 1, 0.36, 1] }}
          className="lg:col-span-6 flex flex-col justify-center px-2 sm:px-6 lg:px-8 py-4 relative z-10"
        >
          <div className="max-w-[400px] w-full mx-auto">
            {/* Top Centered Brand Logo (Matching "Logoipsum" Header in Reference) */}
            <div className="flex items-center justify-center gap-2.5">
              <motion.div
                whileHover={{ rotate: -8, scale: 1.08 }}
                transition={{ type: "spring", stiffness: 400, damping: 18 }}
                className="w-10 h-10 rounded-full bg-[#0E947A] text-white flex items-center justify-center shadow-md shadow-[#0E947A]/25"
              >
                <ShieldCheck className="w-5 h-5 stroke-[2.4]" />
              </motion.div>
              <span className="text-2xl font-extrabold tracking-tight text-[#0E947A]">
                VeriMed
              </span>
            </div>

            {/* Welcome Back Heading & Subtitle */}
            <div className="text-center mt-5">
              <h1 className="text-2xl sm:text-[30px] font-extrabold text-slate-900 tracking-tight">
                {isRegister ? "Buat Akun Baru" : "Selamat Datang"}
              </h1>
              <p className="text-xs sm:text-sm text-slate-400 font-medium mt-1.5">
                {isRegister
                  ? "Daftarkan akun faskes atau verifikator Anda"
                  : "Silakan masuk ke akun VeriMed Anda"}
              </p>
            </div>

            {/* Compact Mode & Role Pills (Preserving All Features Cleanly) */}
            <div className="mt-5 flex items-center justify-between gap-2 bg-[#F5F7F9] p-1.5 rounded-2xl">
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setIsRegister(false)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    !isRegister
                      ? "bg-white text-slate-900 shadow-2xs"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  Masuk
                </button>
                <button
                  type="button"
                  onClick={() => setIsRegister(true)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    isRegister
                      ? "bg-white text-slate-900 shadow-2xs"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  Daftar
                </button>
              </div>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setSelectedRole("admin")}
                  className={`px-2.5 py-1.5 rounded-xl text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer ${
                    selectedRole === "admin"
                      ? "bg-[#D6F2EE] text-[#0E947A]"
                      : "text-slate-400 hover:text-slate-700"
                  }`}
                >
                  <UserCheck className="w-3.5 h-3.5" />
                  <span>Admin</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedRole("faskes")}
                  className={`px-2.5 py-1.5 rounded-xl text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer ${
                    selectedRole === "faskes"
                      ? "bg-[#D6F2EE] text-[#0E947A]"
                      : "text-slate-400 hover:text-slate-700"
                  }`}
                >
                  <Building2 className="w-3.5 h-3.5" />
                  <span>Faskes</span>
                </button>
              </div>
            </div>

            {/* Error Alert */}
            <AnimatePresence>
              {errorMsg && (
                <motion.div
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  className="mt-4 p-3 rounded-2xl bg-rose-50 text-rose-700 text-xs font-semibold flex items-center gap-2"
                >
                  <ShieldAlert className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Login / Register Form (Exact Soft Rounded Input Style from Reference) */}
            <form onSubmit={handleCustomSubmit} className="mt-5 space-y-3.5">
              <AnimatePresence initial={false}>
                {isRegister && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-3.5 overflow-hidden"
                  >
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Nama Lengkap (cth: dr. Pratama Wijaya)"
                      className="w-full px-4 py-3.5 text-xs sm:text-sm font-medium rounded-2xl bg-[#F5F7F9] hover:bg-[#EDF1F5] focus:bg-white text-slate-800 placeholder:text-slate-400 border border-transparent focus:border-[#0E947A]/35 transition-all"
                    />

                    {selectedRole === "faskes" && (
                      <input
                        type="text"
                        value={facilityName}
                        onChange={(e) => setFacilityName(e.target.value)}
                        placeholder="Nama Rumah Sakit / Faskes"
                        className="w-full px-4 py-3.5 text-xs sm:text-sm font-medium rounded-2xl bg-[#F5F7F9] hover:bg-[#EDF1F5] focus:bg-white text-slate-800 placeholder:text-slate-400 border border-transparent focus:border-[#0E947A]/35 transition-all"
                      />
                    )}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Kode Kemitraan / Pairing Admin BPJS (Both Admin & Faskes) */}
              <div className="space-y-1">
                <div className="relative">
                  <input
                    type="text"
                    value={pairingCode}
                    onChange={(e) => setPairingCode(e.target.value.toUpperCase())}
                    placeholder={
                      selectedRole === "admin"
                        ? "Kode Cabang / Pairing (cth: BPJS-KC-JKT01)"
                        : "Kode Kemitraan Admin BPJS (cth: BPJS-KC-JKT01)"
                    }
                    className="w-full pl-4 pr-32 py-3.5 text-xs sm:text-sm font-mono font-bold rounded-2xl bg-[#F5F7F9] hover:bg-[#EDF1F5] focus:bg-white text-[#0E947A] placeholder:text-slate-400 placeholder:font-sans placeholder:font-medium border border-transparent focus:border-[#0E947A]/35 transition-all"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold px-2 py-1 rounded-lg bg-[#D6F2EE] text-[#0E947A]">
                    {selectedRole === "admin" ? "Kode Cabang" : "Kode Pairing"}
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 px-1 font-medium">
                  {selectedRole === "admin"
                    ? "Kode pairing kantor cabang untuk sinkronisasi data klaim & lab dari faskes mitra."
                    : "Samakan kode ini dengan kode kantor cabang verifikator BPJS mitra Anda."}
                </p>
              </div>

              {/* Email Input */}
              <div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={
                    selectedRole === "admin"
                      ? "Email (cth: admin@verimed.id)"
                      : "Email (cth: koder@rumahsakit.id)"
                  }
                  className="w-full px-4 py-3.5 text-xs sm:text-sm font-medium rounded-2xl bg-[#F5F7F9] hover:bg-[#EDF1F5] focus:bg-white text-slate-800 placeholder:text-slate-400 border border-transparent focus:border-[#0E947A]/35 transition-all"
                />
              </div>

              {/* Password Input with Eye Toggle Icon */}
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
                  className="w-full pl-4 pr-11 py-3.5 text-xs sm:text-sm font-medium rounded-2xl bg-[#F5F7F9] hover:bg-[#EDF1F5] focus:bg-white text-slate-800 placeholder:text-slate-400 border border-transparent focus:border-[#0E947A]/35 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                  aria-label="Tampilkan kata sandi"
                >
                  {showPassword ? (
                    <Eye className="w-4 h-4" />
                  ) : (
                    <EyeOff className="w-4 h-4" />
                  )}
                </button>
              </div>

              {/* Helper Link on Right (Matching "Forgot Password" Position in Reference) */}
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleAutoFillDemo}
                  className="text-[11px] font-semibold text-slate-400 hover:text-[#0E947A] transition-colors cursor-pointer"
                >
                  Isi Otomatis Akun {selectedRole === "admin" ? "Admin" : "Faskes"}
                </button>
              </div>

              {/* Primary Green Login CTA Button */}
              <motion.button
                type="submit"
                disabled={isSubmitting}
                whileHover={{ scale: isSubmitting ? 1 : 1.01, y: isSubmitting ? 0 : -1 }}
                whileTap={{ scale: isSubmitting ? 1 : 0.98 }}
                className={`w-full py-3.5 px-6 rounded-2xl bg-[#0E947A] hover:bg-[#0B7A64] text-white font-bold text-sm shadow-lg shadow-[#0E947A]/25 transition-all cursor-pointer ${
                  isSubmitting ? "opacity-75 cursor-not-allowed" : ""
                }`}
              >
                {isSubmitting ? "Memproses..." : isRegister ? "Daftar & Masuk" : "Login"}
              </motion.button>
            </form>

            {/* "or Login with" Divider (Matching Reference) */}
            <div className="relative my-6 flex items-center justify-center">
              <div className="w-full border-t border-slate-200/80" />
              <span className="px-3 bg-white text-[11px] font-medium text-slate-400 whitespace-nowrap">
                atau masuk cepat dengan
              </span>
              <div className="w-full border-t border-slate-200/80" />
            </div>

            {/* Two Side-by-Side Quick Demo Buttons (Matching Reference [Facebook] [Google] Layout) */}
            <div className="grid grid-cols-2 gap-3.5">
              <motion.button
                type="button"
                whileHover={{ y: -2, scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleQuickLogin("admin", 0)}
                className="flex items-center justify-center gap-2.5 py-3 px-4 rounded-2xl bg-white border border-slate-200/90 hover:border-[#0E947A]/50 hover:bg-[#D6F2EE]/25 transition-all cursor-pointer group shadow-2xs"
              >
                <div className="w-6 h-6 rounded-full bg-[#0E947A] text-white flex items-center justify-center text-[10px] font-extrabold shrink-0">
                  AD
                </div>
                <div className="text-left min-w-0">
                  <p className="text-xs font-extrabold text-slate-700 group-hover:text-[#0E947A] truncate leading-tight">
                    Demo Admin
                  </p>
                  <p className="text-[9px] text-slate-400 truncate">
                    dr. Budi Setiawan
                  </p>
                </div>
              </motion.button>

              <motion.button
                type="button"
                whileHover={{ y: -2, scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleQuickLogin("faskes", 1)}
                className="flex items-center justify-center gap-2.5 py-3 px-4 rounded-2xl bg-white border border-slate-200/90 hover:border-[#0E947A]/50 hover:bg-[#D6F2EE]/25 transition-all cursor-pointer group shadow-2xs"
              >
                <div className="w-6 h-6 rounded-full bg-[#F5DF65] text-slate-900 flex items-center justify-center text-[10px] font-extrabold shrink-0">
                  FK
                </div>
                <div className="text-left min-w-0">
                  <p className="text-xs font-extrabold text-slate-700 group-hover:text-[#0E947A] truncate leading-tight">
                    Demo Faskes
                  </p>
                  <p className="text-[9px] text-slate-400 truncate">
                    dr. Rina Puspita
                  </p>
                </div>
              </motion.button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
};

export { AuthView };
