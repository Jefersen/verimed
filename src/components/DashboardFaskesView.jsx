import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  FileText,
  Clock,
  AlertCircle,
  CheckCircle2,
  PlusCircle,
  ShieldCheck,
  FlaskConical,
  ArrowRight,
  Building2,
  MessageSquare,
  Calendar,
  MoreVertical,
  Sparkles
} from "lucide-react";

const DashboardFaskesView = ({
  claims,
  currentUser,
  onOpenNewClaimModal,
  onSelectClaim,
  onGoToKlarifikasi,
  onGoToClarifications,
  onGoToLab = () => {},
  onGoToKlaimSaya = () => {}
}) => {
  const handleClarification =
    onGoToClarifications || onGoToKlarifikasi || (() => {});

  const [activeBarIndex, setActiveBarIndex] = useState(null);

  const myClaims = claims.filter(
    (c) => c.facilityId === currentUser.facilityId
  );
  const totalSubmitted = myClaims.length;
  const inProcessClaims = myClaims.filter(
    (c) => c.status === "menunggu_verifikasi" || c.status === "ditelaah"
  );
  const clarificationClaims = myClaims.filter(
    (c) => c.status === "klarifikasi"
  );
  const approvedClaims = myClaims.filter((c) => c.status === "disetujui");
  const totalBilled = myClaims.reduce((acc, c) => acc + c.billedAmount, 0);
  const recentClaims = [...myClaims].slice(0, 5);

  // Build 14-day Faskes series showing Jumlah Permintaan Klaim & Total Harga yang Diminta
  const dailyRequestCounts = [2, 3, 4, 1, 3, 2, 1, 2, 3, 2, 1, 4, 2, 1];
  const baseMultipliers = [
    0.48, 0.72, 0.86, 0.44, 0.79, 0.45, 0.32, 0.5, 0.65, 0.43, 0.34, 0.78,
    0.44, 0.33
  ];

  const chartData = Array.from({ length: 14 }, (_, idx) => {
    const dayNum = idx + 1;
    const linkedClaim =
      myClaims.length > 0 ? myClaims[idx % myClaims.length] : null;
    const requestCount = dailyRequestCounts[idx];
    const billedVal =
      idx < myClaims.length
        ? myClaims[idx].billedAmount * Math.max(1, Math.round(requestCount / 2))
        : Math.round(16500000 * baseMultipliers[idx]);

    return {
      day: dayNum,
      dateLabel: `${dayNum} Okt`,
      requestCount,
      billed: billedVal,
      claimObj: linkedClaim
    };
  });

  const maxBilled = Math.max(...chartData.map((d) => d.billed), 18000000);
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
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#D6F2EE]/80 text-[#0E947A] text-[11px] font-bold mb-2">
            <Building2 className="w-3.5 h-3.5" />
            <span>
              Fasilitas Kesehatan Mitra JKN • {currentUser.facilityName}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Klaim & Layanan Faskes
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Selamat datang,{" "}
            <strong className="text-slate-700">{currentUser.name}</strong>.
            Kelola berkas klaim INA-CBG, pantau verifikasi, dan kirim hasil lab
            LIS.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <motion.button
            type="button"
            whileHover={{ scale: 1.03, y: -1 }}
            whileTap={{ scale: 0.97 }}
            onClick={onOpenNewClaimModal}
            className="px-5 py-2.5 rounded-full bg-[#0E947A] hover:bg-[#0B7A64] text-white font-bold text-xs shadow-md shadow-[#0E947A]/25 transition-colors flex items-center gap-2 cursor-pointer group"
          >
            <PlusCircle className="w-4 h-4 group-hover:rotate-90 transition-transform duration-300" />
            <span>Ajukan Klaim Baru</span>
          </motion.button>

          <motion.button
            type="button"
            whileHover={{ scale: 1.03, y: -1 }}
            whileTap={{ scale: 0.97 }}
            onClick={onGoToLab}
            className="px-4 py-2.5 rounded-full bg-[#D6F2EE]/70 hover:bg-[#D6F2EE] text-[#0E947A] font-bold text-xs transition-colors flex items-center gap-2 cursor-pointer"
          >
            <FlaskConical className="w-4 h-4" />
            <span>Kirim Hasil Lab LIS</span>
          </motion.button>
        </div>
      </div>

      {/* Urgent Clarification Action Banner */}
      {clarificationClaims.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 sm:p-5 rounded-3xl bg-[#FEF6C7]/70 border border-amber-200/80 text-amber-950 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
        >
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-2xl bg-[#F5DF65] text-slate-900 flex items-center justify-center shrink-0 shadow-2xs">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-sm font-extrabold text-slate-900">
                  Tindakan Diperlukan: {clarificationClaims.length} Klaim
                  Membutuhkan Klarifikasi
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-200/80 text-amber-900">
                  Permintaan Admin
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-0.5">
                Verifikator meminta konfirmasi dokumen klaim. Segera berikan
                tanggapan atau ajukan versi revisi.
              </p>
            </div>
          </div>

          <motion.button
            type="button"
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={handleClarification}
            className="px-4 py-2 rounded-full bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-colors shrink-0 flex items-center gap-1.5 shadow-xs self-start sm:self-auto cursor-pointer"
          >
            <span>Buka Daftar Klarifikasi</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </motion.button>
        </motion.div>
      )}

      {/* Row 2: PinHome Chart — Jumlah Permintaan Klaim & Total Harga yang Diminta */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="bg-white rounded-[28px] border border-slate-100/90 p-5 sm:p-7 shadow-[0_8px_30px_rgb(0,0,0,0.03)]"
      >
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

        {/* Bar Chart Area */}
        <div className="relative pt-14 pb-3">
          <div className="flex items-end gap-3 sm:gap-5">
            <div className="hidden sm:flex flex-col justify-between h-48 text-[11px] font-semibold text-slate-300 pb-7 pr-2 select-none shrink-0">
              <span>Rp 25Jt</span>
              <span>Rp 15Jt</span>
              <span>Rp 8Jt</span>
              <span>Rp 0</span>
            </div>

            <div
              onMouseLeave={() => setActiveBarIndex(null)}
              className="relative flex-1 h-48 flex items-end justify-between gap-1.5 sm:gap-3 border-b border-slate-100 pb-7"
            >
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
                    <AnimatePresence>
                      {isSelected && (
                        <motion.div
                          layoutId="faskesChartCallout"
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

      {/* Row 3: Faskes Operational Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <motion.div
          whileHover={{ y: -3 }}
          transition={{ type: "spring", stiffness: 320, damping: 24 }}
          className="bg-slate-50/70 hover:bg-white p-4 rounded-3xl border border-slate-100 transition-shadow hover:shadow-md"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Total Klaim Diajukan
            </span>
            <div className="w-8 h-8 rounded-2xl bg-[#D6F2EE] text-[#0E947A] flex items-center justify-center">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900 mt-2 font-mono">
            {totalSubmitted}
          </p>
          <p className="text-[11px] text-slate-500 mt-0.5 truncate">
            Billed:{" "}
            <strong className="text-slate-800">
              Rp {totalBilled.toLocaleString("id-ID")}
            </strong>
          </p>
        </motion.div>

        <motion.div
          whileHover={{ y: -3 }}
          transition={{ type: "spring", stiffness: 320, damping: 24 }}
          className="bg-slate-50/70 hover:bg-white p-4 rounded-3xl border border-slate-100 transition-shadow hover:shadow-md"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Sedang Diproses
            </span>
            <div className="w-8 h-8 rounded-2xl bg-sky-100/80 text-sky-700 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-sky-600 mt-2 font-mono">
            {inProcessClaims.length}
          </p>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Dalam antrean verifikator BPJS
          </p>
        </motion.div>

        <motion.div
          whileHover={{ y: -3 }}
          transition={{ type: "spring", stiffness: 320, damping: 24 }}
          className="bg-slate-50/70 hover:bg-white p-4 rounded-3xl border border-amber-100/80 transition-shadow hover:shadow-md"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Butuh Klarifikasi
            </span>
            <div className="w-8 h-8 rounded-2xl bg-[#FEF6C7] text-amber-700 flex items-center justify-center">
              <AlertCircle className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-amber-600 mt-2 font-mono">
            {clarificationClaims.length}
          </p>
          <p className="text-[11px] text-amber-700/80 font-medium mt-0.5">
            {clarificationClaims.length > 0
              ? "Menunggu tanggapan faskes"
              : "Semua klaim tertangani"}
          </p>
        </motion.div>

        <motion.div
          whileHover={{ y: -3 }}
          transition={{ type: "spring", stiffness: 320, damping: 24 }}
          className="bg-slate-50/70 hover:bg-white p-4 rounded-3xl border border-emerald-100/80 transition-shadow hover:shadow-md"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Selesai / Disetujui
            </span>
            <div className="w-8 h-8 rounded-2xl bg-[#D6F2EE] text-[#0E947A] flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-[#0E947A] mt-2 font-mono">
            {approvedClaims.length}
          </p>
          <p className="text-[11px] text-[#0E947A] font-medium mt-0.5">
            Telah lolos verifikasi
          </p>
        </motion.div>
      </div>

      {/* Row 4: PinHome Split Bottom Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-7 items-start">
        <div className="lg:col-span-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-extrabold text-slate-900 tracking-tight">
                Riwayat Pengajuan Klaim {currentUser.facilityName}
              </h2>
            </div>

            <button
              type="button"
              onClick={onGoToKlaimSaya}
              className="text-xs font-extrabold text-[#0E947A] hover:text-[#0B7A64] flex items-center gap-1 transition-colors cursor-pointer group"
            >
              <span>Lihat Semua Klaim Saya</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>

          <div className="divide-y divide-slate-100">
            {recentClaims.map((claim, idx) => (
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
                  <div className="w-12 h-12 rounded-full bg-[#D6F2EE] text-[#0E947A] flex flex-col items-center justify-center font-extrabold text-xs shrink-0 font-mono relative overflow-hidden shadow-2xs">
                    <div className="absolute -bottom-2 -right-2 w-6 h-6 rounded-full bg-[#F6B8C6]/60" />
                    <span className="relative z-10">
                      V{claim.currentVersion}
                    </span>
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-extrabold text-slate-900 group-hover:text-[#0E947A] transition-colors truncate">
                        {claim.primaryDiagnosis.name}
                      </p>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#D6F2EE]/80 text-[#0E947A] flex items-center gap-1">
                        <ShieldCheck className="w-3 h-3" />
                        Segel Terverifikasi
                      </span>
                    </div>

                    <p className="text-xs text-slate-400 mt-0.5 truncate">
                      <span className="font-mono font-semibold text-slate-600">
                        #{claim.claimNumber}
                      </span>{" "}
                      • Pasien: {claim.patientPseudoId} • {claim.inacbgCode}{" "}
                      (Sev {claim.severity})
                    </p>
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
                      {claim.losDays} Hari •{" "}
                      {new Date(claim.createdAt).toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "short"
                      })}
                    </p>
                  </div>

                  <div className="p-1.5 rounded-full text-slate-300 group-hover:text-[#0E947A] group-hover:bg-[#D6F2EE]/40 transition-colors">
                    <MoreVertical className="w-4 h-4" />
                  </div>
                </div>
              </motion.div>
            ))}
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
                <Sparkles className="w-3 h-3" /> Bukti Objektif Level 2
              </span>
              <h3 className="text-xl font-extrabold text-slate-900 leading-tight">
                Percepat Verifikasi Klaim!
              </h3>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                Kirim hasil laboratorium langsung dari LIS analyzer agar klaim
                mendapatkan jalur hijau Fast-Track.
              </p>

              <div className="mt-5 flex flex-wrap items-center gap-2.5">
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.96 }}
                  onClick={onGoToLab}
                  className="px-5 py-2.5 rounded-full bg-[#F5DF65] hover:bg-[#FACC15] text-slate-900 font-extrabold text-xs shadow-sm transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <FlaskConical className="w-3.5 h-3.5" />
                  <span>Kirim Lab LIS</span>
                </motion.button>

                {clarificationClaims.length > 0 && (
                  <motion.button
                    type="button"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.96 }}
                    onClick={handleClarification}
                    className="px-4 py-2.5 rounded-full bg-white/80 hover:bg-white text-[#0E947A] font-extrabold text-xs shadow-2xs transition-colors cursor-pointer"
                  >
                    Klarifikasi ({clarificationClaims.length})
                  </motion.button>
                )}
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

export { DashboardFaskesView };
