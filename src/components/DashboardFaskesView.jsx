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
    const requestCount = myClaims.length > 0 ? dailyRequestCounts[idx] : 0;
    const billedVal =
      myClaims.length > 0
        ? idx < myClaims.length
          ? myClaims[idx].billedAmount * Math.max(1, Math.round(requestCount / 2))
          : Math.round(16500000 * baseMultipliers[idx])
        : 0;

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
            data-tour="faskes-btn-new-claim"
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
            data-tour="faskes-btn-lab"
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
          className="p-4 sm:p-5 rounded-2xl bg-amber-50/80 border border-amber-200/70 text-amber-950 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
        >
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0 border border-amber-200/60">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-sm font-bold text-slate-900">
                  Tindakan Diperlukan: {clarificationClaims.length} Klaim
                  Membutuhkan Klarifikasi
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-100 text-amber-800">
                  Permintaan Verifikator
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
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleClarification}
            className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs transition-colors shrink-0 flex items-center gap-1.5 shadow-2xs self-start sm:self-auto cursor-pointer"
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
                          ? "bg-[#0E947A] shadow-md shadow-[#0E947A]/30"
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
          whileHover={{ y: -2 }}
          transition={{ type: "spring", stiffness: 320, damping: 24 }}
          className="bg-white p-4.5 rounded-2xl border border-slate-200/70 shadow-2xs"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Total Klaim Diajukan
            </span>
            <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900 mt-2 font-mono">
            {totalSubmitted}
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5 truncate">
            Billed: Rp {totalBilled.toLocaleString("id-ID")}
          </p>
        </motion.div>

        <motion.div
          whileHover={{ y: -2 }}
          transition={{ type: "spring", stiffness: 320, damping: 24 }}
          className="bg-white p-4.5 rounded-2xl border border-slate-200/70 shadow-2xs"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Sedang Diproses
            </span>
            <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center border border-slate-200/60">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900 mt-2 font-mono">
            {inProcessClaims.length}
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Dalam antrean verifikator
          </p>
        </motion.div>

        <motion.div
          whileHover={{ y: -2 }}
          transition={{ type: "spring", stiffness: 320, damping: 24 }}
          className="bg-white p-4.5 rounded-2xl border border-slate-200/70 shadow-2xs"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Butuh Klarifikasi
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center border border-amber-100">
              <AlertCircle className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900 mt-2 font-mono">
            {clarificationClaims.length}
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">
            {clarificationClaims.length > 0
              ? "Perlu tanggapan faskes"
              : "Semua tertangani"}
          </p>
        </motion.div>

        <motion.div
          whileHover={{ y: -2 }}
          transition={{ type: "spring", stiffness: 320, damping: 24 }}
          className="bg-white p-4.5 rounded-2xl border border-slate-200/70 shadow-2xs"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Selesai / Disetujui
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-[#0E947A] flex items-center justify-center border border-emerald-100">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900 mt-2 font-mono">
            {approvedClaims.length}
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Telah lolos verifikasi
          </p>
        </motion.div>
      </div>

      {/* Row 4: Split Section */}
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
              className="text-xs font-bold text-[#0E947A] hover:text-[#0B7A64] flex items-center gap-1 transition-colors cursor-pointer group"
            >
              <span>Lihat Semua Klaim Saya</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/70 shadow-2xs divide-y divide-slate-100 overflow-hidden">
            {recentClaims.length === 0 ? (
              <div className="p-12 text-center text-slate-400">
                <FileText className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                <p className="text-sm font-semibold text-slate-700">Belum ada klaim yang diajukan</p>
                <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                  Klik tombol "Buat Klaim Baru" di atas untuk mengajukan dan menyegel klaim pertama Anda.
                </p>
              </div>
            ) : (
              recentClaims.map((claim, idx) => {
              // Exactly 1 single primary indicator badge per record
              const singleStatusBadge = claim.status === "disetujui"
                ? { label: "Disetujui", cls: "bg-emerald-50 text-[#0E947A] border-emerald-200" }
                : claim.status === "klarifikasi"
                  ? { label: "Klarifikasi", cls: "bg-amber-50 text-amber-800 border-amber-200" }
                  : claim.status === "ditelaah"
                    ? { label: "Ditelaah", cls: "bg-sky-50 text-sky-700 border-sky-200" }
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
                    {/* Clean unified version badge */}
                    <div className="w-11 h-11 rounded-xl bg-slate-50 border border-slate-200/80 text-slate-700 flex flex-col items-center justify-center font-bold text-xs shrink-0 font-mono">
                      <span>V{claim.currentVersion}</span>
                      <span className="text-[8px] font-semibold text-slate-400 uppercase tracking-tighter">
                        Versi
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
                        • Pasien: {claim.patientPseudoId} • {claim.inacbgCode}
                      </p>

                      <p className="text-[11px] text-slate-400 mt-1 truncate">
                        Segel kriptografis terverifikasi • {claim.losDays} hari rawat • {new Date(claim.createdAt).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
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
            }))}
          </div>
        </div>

        {/* Right Column (4 cols): Calm, Professional Highlight Card */}
        <div className="lg:col-span-4">
          <div className="rounded-2xl bg-slate-50 border border-slate-200/80 p-6 relative overflow-hidden flex flex-col justify-between shadow-2xs">
            <div className="relative z-10">
              <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-[#0E947A] bg-emerald-50 border border-emerald-100 px-2.5 py-0.5 rounded-full mb-3">
                <Sparkles className="w-3 h-3" /> Bukti Objektif Level 2
              </span>
              <h3 className="text-base font-bold text-slate-900 leading-snug">
                Percepat Verifikasi Klaim
              </h3>
              <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                Kirim hasil laboratorium langsung dari LIS analyzer agar klaim
                mendapatkan jalur hijau Fast-Track otomatis.
              </p>

              <div className="mt-5 flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={onGoToLab}
                  className="px-4 py-2 rounded-xl bg-[#0E947A] hover:bg-[#0B7A64] text-white font-semibold text-xs shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <FlaskConical className="w-3.5 h-3.5" />
                  <span>Kirim Lab LIS</span>
                </button>

                {clarificationClaims.length > 0 && (
                  <button
                    type="button"
                    onClick={handleClarification}
                    className="px-3.5 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-700 font-semibold text-xs border border-slate-200 transition-colors cursor-pointer"
                  >
                    Klarifikasi ({clarificationClaims.length})
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export { DashboardFaskesView };
