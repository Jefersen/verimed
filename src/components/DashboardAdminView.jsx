import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  CheckCircle2,
  AlertTriangle,
  FileText,
  ArrowRight,
  ShieldAlert,
  Activity,
  Cpu,
  Inbox,
  Calendar,
  MoreVertical,
  Sparkles,
  BarChart3,
  Link as LinkIcon
} from "lucide-react";

const DashboardAdminView = ({
  claims,
  currentUser,
  aiConfig,
  onSelectClaim,
  onGoToQueue,
  onGoToVerificationQueue,
  onGoToInsights,
  onGoToAuditChain,
  onGoToAiSettings
}) => {
  const handleGoQueue = onGoToQueue || onGoToVerificationQueue || (() => {});

  const [activeBarIndex, setActiveBarIndex] = useState(null);

  const totalClaims = claims.length;
  const waitingReviewClaims = claims.filter(
    (c) => c.status === "menunggu_verifikasi" || c.status === "ditelaah"
  );
  const highRiskClaims = claims.filter(
    (c) => c.riskBand === "Tinggi" || c.isTampered
  );
  const clarificationClaims = claims.filter((c) => c.status === "klarifikasi");
  const upcodingCount = claims.filter((c) =>
    c.findings.some((f) => f.type === "upcoding")
  ).length;
  const unbundlingCount = claims.filter((c) =>
    c.findings.some((f) => f.type === "unbundling")
  ).length;
  const integrityCount = claims.filter(
    (c) => c.isTampered || c.findings.some((f) => f.ruleId === "R-SEAL")
  ).length;

  const priorityQueue = [...claims]
    .sort((a, b) => {
      if (a.isTampered && !b.isTampered) return -1;
      if (!a.isTampered && b.isTampered) return 1;
      return b.riskScore - a.riskScore;
    })
    .slice(0, 5);

  // Build 14-day analytical series showing Jumlah Permintaan Klaim & Total Harga yang Diminta
  const dailyRequestCounts = [3, 5, 6, 2, 5, 3, 2, 4, 5, 3, 2, 6, 3, 2];
  const baseMultipliers = [
    0.52, 0.78, 0.91, 0.46, 0.82, 0.48, 0.35, 0.54, 0.68, 0.47, 0.36, 0.83,
    0.49, 0.37
  ];

  const chartData = Array.from({ length: 14 }, (_, idx) => {
    const dayNum = idx + 1;
    const linkedClaim = claims[idx % claims.length];
    const requestCount = dailyRequestCounts[idx];
    const billedVal =
      idx < claims.length
        ? claims[idx].billedAmount * Math.max(1, Math.round(requestCount / 2))
        : Math.round(24500000 * baseMultipliers[idx]);

    return {
      day: dayNum,
      dateLabel: `${dayNum} Okt`,
      requestCount,
      billed: billedVal,
      claimObj: linkedClaim
    };
  });

  const maxBilled = Math.max(...chartData.map((d) => d.billed), 25000000);
  const totalPeriodRequests = chartData.reduce(
    (acc, d) => acc + d.requestCount,
    0
  );
  const totalPeriodBilled = chartData.reduce((acc, d) => acc + d.billed, 0);

  return (
    <div className="space-y-7">
      {/* Row 1: PinHome Title Header & Pill Action Buttons */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#D6F2EE]/80 text-[#0E947A] text-[11px] font-bold mb-2">
            <Cpu className="w-3.5 h-3.5" />
            <span>
              {aiConfig?.mode === "ai"
                ? `Mode AI Aktif: ${aiConfig.activeModel}`
                : "Mesin Verifikasi Kriptografis & Aturan Klinis Aktif"}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Pusat Verifikasi Klaim
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Selamat bertugas,{" "}
            <strong className="text-slate-700">{currentUser.name}</strong>.
            Pantau kepatuhan INA-CBG, bukti lab LIS, dan integritas segel.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <motion.button
            type="button"
            whileHover={{ scale: 1.03, y: -1 }}
            whileTap={{ scale: 0.97 }}
            onClick={handleGoQueue}
            className="px-5 py-2.5 rounded-full bg-[#0E947A] hover:bg-[#0B7A64] text-white font-bold text-xs shadow-md shadow-[#0E947A]/25 transition-colors flex items-center gap-2 cursor-pointer"
          >
            <Inbox className="w-4 h-4" />
            <span>Antrean Verifikasi ({waitingReviewClaims.length})</span>
          </motion.button>

          <motion.button
            type="button"
            whileHover={{ scale: 1.03, y: -1 }}
            whileTap={{ scale: 0.97 }}
            onClick={onGoToAiSettings}
            className="px-4 py-2.5 rounded-full bg-slate-100 hover:bg-[#D6F2EE]/60 text-slate-700 hover:text-[#0E947A] font-bold text-xs transition-colors flex items-center gap-2 cursor-pointer"
          >
            <Cpu className="w-4 h-4 text-[#0E947A]" />
            <span>Pengaturan AI</span>
          </motion.button>
        </div>
      </div>

      {/* Row 2: PinHome Chart — Jumlah Permintaan Klaim & Total Harga yang Diminta */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="bg-white rounded-[28px] border border-slate-100/90 p-5 sm:p-7 shadow-[0_8px_30px_rgb(0,0,0,0.03)]"
      >
        {/* Chart Top Header: Period + Summary Badges + Legend */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Periode:
            </span>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 text-slate-700 font-bold text-xs border border-slate-200/60">
              <Calendar className="w-3.5 h-3.5 text-[#0E947A]" />
              <span>1 Okt – 14 Okt</span>
            </div>

            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 text-slate-700 text-xs font-semibold border border-slate-200/60">
              <span>Total Permintaan:</span>
              <strong className="font-mono text-slate-900">{totalPeriodRequests} Klaim</strong>
            </span>

            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 text-[#0E947A] text-xs font-semibold border border-emerald-100">
              <span>Total Nilai:</span>
              <strong className="font-mono">
                Rp {(totalPeriodBilled / 1000000).toFixed(1)} Jt
              </strong>
            </span>
          </div>

          <div className="flex items-center gap-4 text-xs font-medium text-slate-500">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#0E947A] inline-block" />
              <span>Hari Terpilih</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#D6F2EE] inline-block" />
              <span>Tren Harian</span>
            </div>
          </div>
        </div>

        {/* Bar Chart Area with Y-Axis Labels & Floating Callout Tooltip */}
        <div className="relative pt-14 pb-3">
          <div className="flex items-end gap-3 sm:gap-5">
            {/* Y-Axis Labels (Total Harga yang Diminta) */}
            <div className="hidden sm:flex flex-col justify-between h-48 text-[11px] font-semibold text-slate-300 pb-7 pr-2 select-none shrink-0">
              <span>Rp 35Jt</span>
              <span>Rp 25Jt</span>
              <span>Rp 12Jt</span>
              <span>Rp 0</span>
            </div>

            {/* Bars Grid Container */}
            <div
              onMouseLeave={() => setActiveBarIndex(null)}
              className="relative flex-1 h-48 flex items-end justify-between gap-1.5 sm:gap-3 border-b border-slate-100 pb-7"
            >
              {/* Subtle Horizontal Grid Lines */}
              <div className="absolute inset-x-0 top-0 border-b border-slate-100/80 pointer-events-none" />
              <div className="absolute inset-x-0 top-1/3 border-b border-slate-100/80 pointer-events-none" />
              <div className="absolute inset-x-0 top-2/3 border-b border-slate-100/80 pointer-events-none" />

              {chartData.map((item, index) => {
                const isSelected = activeBarIndex === index;
                const heightPercent = Math.max(
                  18,
                  Math.min(100, Math.round((item.billed / maxBilled) * 100))
                );

                return (
                  <div
                    key={item.day}
                    onMouseEnter={() => setActiveBarIndex(index)}
                    onMouseLeave={() => setActiveBarIndex(null)}
                    onClick={() => {
                      if (item.claimObj) onSelectClaim(item.claimObj);
                    }}
                    className="relative flex-1 h-full flex flex-col items-center justify-end group cursor-pointer"
                  >
                    {/* Floating PinHome White Callout Card above the Active Bar */}
                    <AnimatePresence>
                      {isSelected && (
                        <motion.div
                          layoutId="adminChartCallout"
                          initial={{ opacity: 0, y: 8, scale: 0.92 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 6, scale: 0.92 }}
                          transition={{
                            type: "spring",
                            stiffness: 340,
                            damping: 26
                          }}
                          className={`absolute -top-16 z-20 bg-white px-3.5 py-2 rounded-2xl shadow-[0_10px_28px_rgba(14,148,122,0.16)] border border-emerald-100/80 text-center whitespace-nowrap pointer-events-none ${
                            index <= 1
                              ? "left-0"
                              : index >= 12
                                ? "right-0"
                                : "left-1/2 -translate-x-1/2"
                          }`}
                        >
                          <div className="inline-block px-2 py-0.5 rounded-full bg-[#D6F2EE] text-[#0E947A] text-[10px] font-extrabold mb-0.5">
                            {item.requestCount} Permintaan Klaim
                          </div>
                          <p className="text-xs sm:text-sm font-extrabold text-slate-900 font-mono">
                            Rp {item.billed.toLocaleString("id-ID")}
                          </p>
                          <p className="text-[10px] font-medium text-slate-400">
                            Total harga diminta ({item.dateLabel})
                          </p>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Vertical Pill Bar */}
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: `${heightPercent}%` }}
                      transition={{
                        type: "spring",
                        stiffness: 200,
                        damping: 22,
                        delay: index * 0.025
                      }}
                      className={`w-full max-w-[26px] rounded-t-2xl transition-colors duration-300 ${
                        isSelected
                          ? "bg-[#0E947A] shadow-md shadow-[#0E947A]/30"
                          : "bg-[#D6F2EE] group-hover:bg-[#B5E8DF]"
                      }`}
                    />

                    {/* X-Axis Day Number & Request Count */}
                    <div className="absolute -bottom-6 flex flex-col items-center leading-none">
                      <span
                        className={`text-[11px] transition-colors ${
                          isSelected
                            ? "font-extrabold text-slate-900"
                            : "font-medium text-slate-400"
                        }`}
                      >
                        {item.day}
                      </span>
                      <span
                        className={`text-[9px] mt-0.5 font-mono ${
                          isSelected
                            ? "font-bold text-[#0E947A]"
                            : "text-slate-300"
                        }`}
                      >
                        {item.requestCount}klm
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Row 3: Investigation KPI Cards & Clinical Flag Counters */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <motion.div
          whileHover={{ y: -2 }}
          transition={{ type: "spring", stiffness: 320, damping: 24 }}
          className="bg-white p-4.5 rounded-2xl border border-slate-200/70 shadow-2xs"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Total Klaim Masuk
            </span>
            <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900 mt-2 font-mono">
            {totalClaims}
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Seluruh faskes mitra
          </p>
        </motion.div>

        <motion.div
          whileHover={{ y: -2 }}
          transition={{ type: "spring", stiffness: 320, damping: 24 }}
          className="bg-white p-4.5 rounded-2xl border border-slate-200/70 shadow-2xs"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Klaim Risiko Tinggi
            </span>
            <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center border border-rose-100">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900 mt-2 font-mono">
            {highRiskClaims.length}
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Skor &ge; 70 atau anomali
          </p>
        </motion.div>

        <motion.div
          whileHover={{ y: -2 }}
          transition={{ type: "spring", stiffness: 320, damping: 24 }}
          className="bg-white p-4.5 rounded-2xl border border-slate-200/70 shadow-2xs"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Menunggu Klarifikasi
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center border border-amber-100">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900 mt-2 font-mono">
            {clarificationClaims.length}
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Menunggu berkas faskes
          </p>
        </motion.div>

        <motion.div
          whileHover={{ y: -2 }}
          transition={{ type: "spring", stiffness: 320, damping: 24 }}
          className="bg-white p-4.5 rounded-2xl border border-slate-200/70 shadow-2xs"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Integritas (R-SEAL)
            </span>
            <div
              className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                integrityCount > 0
                  ? "bg-rose-50 text-rose-600 border border-rose-100"
                  : "bg-emerald-50 text-[#0E947A] border border-emerald-100"
              }`}
            >
              <ShieldAlert className="w-4 h-4" />
            </div>
          </div>
          <p
            className={`text-2xl font-black mt-2 font-mono ${
              integrityCount > 0 ? "text-rose-600" : "text-slate-900"
            }`}
          >
            {integrityCount}
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">
            {integrityCount > 0
              ? "Perlu penyesuaian segel"
              : "Semua segel utuh"}
          </p>
        </motion.div>
      </div>

      {/* Clinical Rule Summary Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        <div className="px-4 py-3.5 rounded-2xl bg-white border border-slate-200/70 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500">
              Indikasi Upcoding (U1-U3)
            </span>
            <p className="text-lg font-bold text-slate-800 mt-0.5">
              {upcodingCount} Kasus
            </p>
            <p className="text-[11px] text-slate-400">
              Diagnosis berat tanpa bukti klinis
            </p>
          </div>
          <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center font-bold text-xs border border-slate-200/60">
            U1-3
          </div>
        </div>

        <div className="px-4 py-3.5 rounded-2xl bg-white border border-slate-200/70 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500">
              Indikasi Unbundling (B1-B3)
            </span>
            <p className="text-lg font-bold text-slate-800 mt-0.5">
              {unbundlingCount} Kasus
            </p>
            <p className="text-[11px] text-slate-400">
              Item paket ditagihkan terpisah
            </p>
          </div>
          <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center font-bold text-xs border border-slate-200/60">
            B1-3
          </div>
        </div>

        <div className="px-4 py-3.5 rounded-2xl bg-white border border-slate-200/70 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500">
              Fast-Track Auto-Approval
            </span>
            <p className="text-lg font-bold text-slate-800 mt-0.5">
              {claims.filter((c) => c.fastTrack).length} Kasus
            </p>
            <p className="text-[11px] text-slate-400">
              Segel utuh & skor risiko &lt; 30
            </p>
          </div>
          <div className="w-9 h-9 rounded-xl bg-emerald-50 text-[#0E947A] flex items-center justify-center border border-emerald-100">
            <CheckCircle2 className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* Row 4: Split Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-7 items-start">
        <div className="lg:col-span-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <h2 className="text-lg font-extrabold text-slate-900 tracking-tight">
                Antrean Prioritas Verifikasi Klaim
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-600 border border-slate-200/60">
                Prioritas Telaah
              </span>
            </div>

            <button
              type="button"
              onClick={handleGoQueue}
              className="text-xs font-bold text-[#0E947A] hover:text-[#0B7A64] flex items-center gap-1 transition-colors cursor-pointer group"
            >
              <span>Buka Seluruh Antrean</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/70 shadow-2xs divide-y divide-slate-100 overflow-hidden">
            {priorityQueue.map((claim, idx) => {
              // Exactly 1 single primary indicator badge per record (No rainbow clutter!)
              const singleStatusBadge = claim.isTampered
                ? { label: "Segel Tidak Cocok", cls: "bg-rose-50 text-rose-700 border-rose-200" }
                : claim.status === "klarifikasi"
                  ? { label: "Klarifikasi", cls: "bg-amber-50 text-amber-800 border-amber-200" }
                  : claim.status === "disetujui"
                    ? { label: "Disetujui", cls: "bg-emerald-50 text-[#0E947A] border-emerald-200" }
                    : claim.fastTrack
                      ? { label: "Fast-Track", cls: "bg-emerald-50 text-[#0E947A] border-emerald-200" }
                      : { label: "Menunggu Telaah", cls: "bg-slate-50 text-slate-600 border-slate-200" };

              return (
                <motion.div
                  key={claim.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.04, duration: 0.25 }}
                  onClick={() => onSelectClaim(claim)}
                  className="p-4 hover:bg-slate-50/70 transition-colors cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    {/* Clean unified score avatar */}
                    <div className="w-11 h-11 rounded-xl bg-slate-50 border border-slate-200/80 text-slate-800 flex flex-col items-center justify-center shrink-0">
                      <span className="text-xs font-black font-mono leading-none">
                        {claim.riskScore}
                      </span>
                      <span className="text-[8px] font-semibold text-slate-400 uppercase tracking-tighter mt-0.5">
                        Skor
                      </span>
                    </div>

                    <div className="min-w-0">
                      <p className="text-sm font-bold text-slate-900 group-hover:text-[#0E947A] transition-colors truncate">
                        {claim.primaryDiagnosis.name}
                      </p>

                      <p className="text-xs text-slate-500 mt-0.5 truncate">
                        <span className="font-mono font-medium text-slate-600">
                          #{claim.claimNumber}
                        </span>{" "}
                        • {claim.facilityName} • {claim.inacbgCode}
                      </p>

                      {/* Calm, readable single-line summary (No multiple colored chips!) */}
                      <p className="text-[11px] text-slate-400 mt-1 truncate">
                        {claim.isTampered ? (
                          <span className="text-rose-600 font-medium flex items-center gap-1">
                            <ShieldAlert className="w-3.5 h-3.5" />
                            Segel hash berbeda dari berkas asli vault
                          </span>
                        ) : claim.findings.length > 0 ? (
                          <span className="text-slate-500 font-medium">
                            {claim.findings.length} Indikasi Telaah:{" "}
                            {claim.findings.map((f) => f.ruleId).join(", ")}
                          </span>
                        ) : (
                          <span className="text-emerald-700 font-medium flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Lolos kepatuhan klinis & segel utuh
                          </span>
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0 sm:pl-3 border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-100">
                    {/* The 1 single primary indicator badge */}
                    <span
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border ${singleStatusBadge.cls}`}
                    >
                      {singleStatusBadge.label}
                    </span>

                    <div className="text-right min-w-[90px]">
                      <p className="text-xs font-bold text-slate-900 font-mono">
                        Rp {claim.billedAmount.toLocaleString("id-ID")}
                      </p>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        {claim.losDays} hari rawat
                      </p>
                    </div>

                    <div className="text-slate-300 group-hover:text-[#0E947A] transition-colors">
                      <ArrowRight className="w-4 h-4" />
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Right Column (4 cols): Calm, Professional Highlight Card */}
        <div className="lg:col-span-4">
          <div className="rounded-2xl bg-slate-50 border border-slate-200/80 p-6 relative overflow-hidden flex flex-col justify-between shadow-2xs">
            <div className="relative z-10">
              <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-[#0E947A] bg-emerald-50 border border-emerald-100 px-2.5 py-0.5 rounded-full mb-3">
                <Sparkles className="w-3 h-3" /> Analitik & Kriptografi
              </span>
              <h3 className="text-base font-bold text-slate-900 leading-snug">
                Wawasan Data & Rantai Segel
              </h3>
              <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                Telusuri data sampel 1,69 juta kunjungan BPJS Kesehatan atau uji
                integritas segel Merkle Tree Ed25519.
              </p>

              <div className="mt-5 flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={onGoToInsights}
                  className="px-4 py-2 rounded-xl bg-[#0E947A] hover:bg-[#0B7A64] text-white font-semibold text-xs shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <BarChart3 className="w-3.5 h-3.5" />
                  <span>Wawasan Nasional</span>
                </button>

                <button
                  type="button"
                  onClick={onGoToAuditChain}
                  className="px-3.5 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-700 font-semibold text-xs border border-slate-200 transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <LinkIcon className="w-3.5 h-3.5 text-slate-500" />
                  <span>Rantai Audit</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export { DashboardAdminView };
