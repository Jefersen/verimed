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
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 text-slate-800 font-bold text-xs">
              <Calendar className="w-3.5 h-3.5 text-[#0E947A]" />
              <span>1 Okt – 14 Okt</span>
            </div>

            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#D6F2EE]/70 text-[#0E947A] text-xs font-extrabold">
              <span>Total Permintaan:</span>
              <strong className="font-mono">{totalPeriodRequests} Klaim</strong>
            </span>

            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#FEF6C7]/90 text-amber-900 text-xs font-extrabold">
              <span>Total Harga Diminta:</span>
              <strong className="font-mono">
                Rp {(totalPeriodBilled / 1000000).toFixed(1)} Jt
              </strong>
            </span>
          </div>

          <div className="flex items-center gap-5 text-xs font-bold text-slate-600">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#F5DF65] inline-block" />
              <span>Hari Dipilih</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#CBEFE8] inline-block" />
              <span>Jumlah Permintaan & Total Harga</span>
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
                          ? "bg-[#F5DF65] shadow-md shadow-amber-200/50"
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
          whileHover={{ y: -3 }}
          transition={{ type: "spring", stiffness: 320, damping: 24 }}
          className="bg-slate-50/70 hover:bg-white p-4 rounded-3xl border border-slate-100 transition-shadow hover:shadow-md"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Total Klaim Masuk
            </span>
            <div className="w-8 h-8 rounded-2xl bg-[#D6F2EE] text-[#0E947A] flex items-center justify-center">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900 mt-2 font-mono">
            {totalClaims}
          </p>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Dari seluruh rumah sakit mitra
          </p>
        </motion.div>

        <motion.div
          whileHover={{ y: -3 }}
          transition={{ type: "spring", stiffness: 320, damping: 24 }}
          className="bg-slate-50/70 hover:bg-white p-4 rounded-3xl border border-rose-100/80 transition-shadow hover:shadow-md"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Klaim Risiko Tinggi
            </span>
            <div className="w-8 h-8 rounded-2xl bg-rose-100/80 text-rose-600 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-rose-600 mt-2 font-mono">
            {highRiskClaims.length}
          </p>
          <p className="text-[11px] text-rose-700/80 font-medium mt-0.5">
            Skor &ge; 70 atau anomali berat
          </p>
        </motion.div>

        <motion.div
          whileHover={{ y: -3 }}
          transition={{ type: "spring", stiffness: 320, damping: 24 }}
          className="bg-slate-50/70 hover:bg-white p-4 rounded-3xl border border-amber-100/80 transition-shadow hover:shadow-md"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Menunggu Klarifikasi
            </span>
            <div className="w-8 h-8 rounded-2xl bg-[#FEF6C7] text-amber-700 flex items-center justify-center">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-amber-600 mt-2 font-mono">
            {clarificationClaims.length}
          </p>
          <p className="text-[11px] text-amber-700/80 font-medium mt-0.5">
            Menunggu berkas susulan faskes
          </p>
        </motion.div>

        <motion.div
          whileHover={{ y: -3 }}
          transition={{ type: "spring", stiffness: 320, damping: 24 }}
          className={`p-4 rounded-3xl border transition-shadow hover:shadow-md ${
            integrityCount > 0
              ? "bg-rose-50/70 border-rose-200"
              : "bg-slate-50/70 hover:bg-white border-emerald-100"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Integritas (R-SEAL)
            </span>
            <div
              className={`w-8 h-8 rounded-2xl flex items-center justify-center ${
                integrityCount > 0
                  ? "bg-rose-600 text-white animate-pulse"
                  : "bg-[#D6F2EE] text-[#0E947A]"
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
          <p
            className={`text-[11px] font-medium mt-0.5 ${
              integrityCount > 0 ? "text-rose-700" : "text-[#0E947A]"
            }`}
          >
            {integrityCount > 0
              ? "Ketidakcocokan Merkle hash!"
              : "Semua segel utuh"}
          </p>
        </motion.div>
      </div>

      {/* Clinical Rule Indicators Pill Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        <div className="px-4 py-3.5 rounded-2xl bg-white border border-slate-100 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500">
              Indikasi Upcoding (U1-U3)
            </span>
            <p className="text-lg font-extrabold text-amber-700 mt-0.5">
              {upcodingCount} Kasus
            </p>
            <p className="text-[11px] text-slate-400">
              Diagnosis berat tanpa bukti lab/terapi
            </p>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-[#FEF6C7] text-amber-800 flex items-center justify-center font-extrabold text-xs">
            U1-3
          </div>
        </div>

        <div className="px-4 py-3.5 rounded-2xl bg-white border border-slate-100 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500">
              Indikasi Unbundling (B1-B3)
            </span>
            <p className="text-lg font-extrabold text-teal-700 mt-0.5">
              {unbundlingCount} Kasus
            </p>
            <p className="text-[11px] text-slate-400">
              Item paket ditagihkan terpisah
            </p>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-[#D6F2EE] text-[#0E947A] flex items-center justify-center font-extrabold text-xs">
            B1-3
          </div>
        </div>

        <div className="px-4 py-3.5 rounded-2xl bg-white border border-slate-100 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500">
              Fast-Track Auto-Approval
            </span>
            <p className="text-lg font-extrabold text-[#0E947A] mt-0.5">
              {claims.filter((c) => c.fastTrack).length} Kasus
            </p>
            <p className="text-[11px] text-slate-400">
              Segel utuh & skor risiko &lt; 30
            </p>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-[#D6F2EE] text-[#0E947A] flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Row 4: PinHome Split Bottom Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-7 items-start">
        <div className="lg:col-span-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <h2 className="text-lg font-extrabold text-slate-900 tracking-tight">
                Antrean Prioritas Verifikasi Klaim
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800">
                Prioritas Risiko
              </span>
            </div>

            <button
              type="button"
              onClick={handleGoQueue}
              className="text-xs font-extrabold text-[#0E947A] hover:text-[#0B7A64] flex items-center gap-1 transition-colors cursor-pointer group"
            >
              <span>Buka Seluruh Antrean</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>

          <div className="divide-y divide-slate-100">
            {priorityQueue.map((claim, idx) => {
              const isHigh = claim.isTampered || claim.riskBand === "Tinggi";
              const isMed = claim.riskBand === "Sedang" && !claim.isTampered;

              return (
                <motion.div
                  key={claim.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05, duration: 0.3 }}
                  whileHover={{ x: 4 }}
                  onClick={() => onSelectClaim(claim)}
                  className="py-4 px-2 hover:bg-slate-50/70 rounded-2xl transition-colors cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4 group"
                >
                  <div className="flex items-center gap-4 min-w-0">
                    <div
                      className={`w-12 h-12 rounded-full flex flex-col items-center justify-center shrink-0 relative overflow-hidden shadow-2xs ${
                        isHigh
                          ? "bg-rose-100 text-rose-800"
                          : isMed
                            ? "bg-[#FEF6C7] text-amber-900"
                            : "bg-[#D6F2EE] text-[#0E947A]"
                      }`}
                    >
                      <div className="absolute -bottom-2 -right-2 w-6 h-6 rounded-full bg-white/40" />
                      <span className="text-sm font-black leading-none relative z-10 font-mono">
                        {claim.riskScore}
                      </span>
                      <span className="text-[8px] font-extrabold uppercase tracking-tighter mt-0.5 relative z-10">
                        {claim.riskBand}
                      </span>
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-extrabold text-slate-900 group-hover:text-[#0E947A] transition-colors truncate">
                          {claim.primaryDiagnosis.name}
                        </p>
                        {claim.isTampered && (
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-rose-600 text-white animate-pulse">
                            SEGEL RUSAK
                          </span>
                        )}
                        {claim.fastTrack && (
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-[#D6F2EE] text-[#0E947A]">
                            FAST-TRACK
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-slate-400 mt-0.5 truncate">
                        <span className="font-mono font-semibold text-slate-600">
                          #{claim.claimNumber}
                        </span>{" "}
                        • {claim.facilityName} • {claim.inacbgCode} (Sev{" "}
                        {claim.severity})
                      </p>

                      <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                        {claim.findings.map((f) => (
                          <span
                            key={f.id}
                            className={`text-[10px] font-semibold px-2 py-0.5 rounded-md ${
                              f.ruleId === "R-SEAL"
                                ? "bg-rose-100 text-rose-800"
                                : f.type === "upcoding"
                                  ? "bg-[#FEF6C7] text-amber-900"
                                  : "bg-[#D6F2EE]/70 text-[#0E947A]"
                            }`}
                          >
                            <strong>{f.ruleId}:</strong> {f.title.split("(")[0]}
                          </span>
                        ))}
                        {claim.findings.length === 0 && (
                          <span className="text-[10px] text-[#0E947A] font-semibold flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" />
                            Lolos aturan klinis
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-4 sm:gap-5 shrink-0">
                    <span
                      className={`px-3 py-1 rounded-lg text-[11px] font-bold capitalize ${
                        claim.status === "disetujui"
                          ? "bg-[#D6F2EE] text-[#0E947A]"
                          : claim.status === "ditelaah" ||
                              claim.status === "klarifikasi"
                            ? "bg-[#FEF6C7] text-amber-800"
                            : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {claim.status.replace("_", " ")}
                    </span>

                    <div className="text-right min-w-[95px]">
                      <p className="text-xs font-extrabold text-slate-900 font-mono">
                        Rp {claim.billedAmount.toLocaleString("id-ID")}
                      </p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        {claim.losDays} hari rawat
                      </p>
                    </div>

                    <div className="p-1.5 rounded-full text-slate-300 group-hover:text-[#0E947A] group-hover:bg-[#D6F2EE]/40 transition-colors">
                      <MoreVertical className="w-4 h-4" />
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Right Column (4 cols): PinHome Illustrated Pastel Card */}
        <div className="lg:col-span-4">
          <motion.div
            whileHover={{ y: -4 }}
            transition={{ type: "spring", stiffness: 280, damping: 22 }}
            className="rounded-[32px] bg-[#D6F2EE] p-6 sm:p-7 relative overflow-hidden min-h-[300px] flex flex-col justify-between shadow-xs"
          >
            <div className="relative z-10 max-w-[230px]">
              <span className="inline-flex items-center gap-1 text-[10px] font-extrabold uppercase tracking-wider text-[#0E947A] bg-white/70 px-2.5 py-1 rounded-full mb-3">
                <Sparkles className="w-3 h-3" /> Analitik & Kriptografi
              </span>
              <h3 className="text-xl font-extrabold text-slate-900 leading-tight">
                Wawasan Data & Rantai Segel!
              </h3>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                Telusuri benchmark 1,69 Juta kunjungan nasional BPJS atau uji
                ketahanan blok Merkle Tree Ed25519.
              </p>

              <div className="mt-5 flex flex-wrap items-center gap-2.5">
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.96 }}
                  onClick={onGoToInsights}
                  className="px-5 py-2.5 rounded-full bg-[#F5DF65] hover:bg-[#FACC15] text-slate-900 font-extrabold text-xs shadow-sm transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <BarChart3 className="w-3.5 h-3.5" />
                  <span>Wawasan</span>
                </motion.button>

                <motion.button
                  type="button"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.96 }}
                  onClick={onGoToAuditChain}
                  className="px-4 py-2.5 rounded-full bg-white/80 hover:bg-white text-[#0E947A] font-extrabold text-xs shadow-2xs transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <LinkIcon className="w-3.5 h-3.5" />
                  <span>Rantai Audit</span>
                </motion.button>
              </div>
            </div>

            <svg
              viewBox="0 0 260 150"
              className="w-full h-36 absolute bottom-0 right-0 left-0 pointer-events-none"
              fill="none"
            >
              <path
                d="M140 150 L140 120 L170 120 L170 95 L200 95 L200 70 L230 70 L230 45 L260 45 L260 150 Z"
                fill="#F6B8C6"
              />
              <path
                d="M215 95 C216 65 220 45 222 28"
                stroke="#0B6B58"
                strokeWidth="4"
                strokeLinecap="round"
              />
              <path
                d="M222 28 C205 20 192 28 188 36 C200 34 212 32 222 28 Z"
                fill="#0E947A"
              />
              <path
                d="M222 28 C236 16 250 22 256 32 C244 30 232 28 222 28 Z"
                fill="#0E947A"
              />
              <path
                d="M222 28 C208 36 198 48 196 56 C208 48 216 38 222 28 Z"
                fill="#0B6B58"
              />
              <path
                d="M15 150 C15 118 35 98 52 90 C48 115 38 135 28 150 Z"
                fill="#0B6B58"
              />
              <path
                d="M32 150 C42 115 68 96 92 92 C78 118 62 136 46 150 Z"
                fill="#0E947A"
              />
              <path
                d="M52 150 C72 126 98 116 122 118 C102 134 82 144 65 150 Z"
                fill="#14B897"
              />
            </svg>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export { DashboardAdminView };
