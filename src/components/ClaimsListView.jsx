import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Search,
  Filter,
  ShieldCheck,
  ShieldAlert,
  CheckCircle2,
  PlusCircle,
  Building2,
  FileText,
  ArrowRight,
  Sparkles,
  Inbox,
  FileCheck2
} from "lucide-react";
import { CustomSelect } from "./CustomSelect";
import { generateAiClaimReasoning } from "../utils/rules";
const ClaimsListView = ({
  claims,
  currentUser,
  onSelectClaim,
  onOpenNewClaimModal,
  isVerificationQueue = false,
  initialSubTab
}) => {
  const isAdmin = currentUser.role === "admin";
  const [adminSubTab, setAdminSubTab] = useState(
    initialSubTab || (isVerificationQueue ? "queue" : "all")
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRiskBand, setSelectedRiskBand] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [selectedFacility, setSelectedFacility] = useState("all");
  const [selectedAnomalyType, setSelectedAnomalyType] = useState("all");
  const facilities = Array.from(new Set(claims.map((c) => c.facilityName)));
  const waitingCount = claims.filter(
    (c) => c.status === "menunggu_verifikasi" || c.status === "ditelaah"
  ).length;
  const anomalyCount = claims.filter(
    (c) => c.findings.length > 0 || c.isTampered
  ).length;
  const scopedClaims = isAdmin ? claims.filter((claim) => {
    if (adminSubTab === "queue") {
      return claim.status === "menunggu_verifikasi" || claim.status === "ditelaah";
    }
    if (adminSubTab === "findings") {
      return claim.findings.length > 0 || claim.isTampered;
    }
    return true;
  }) : claims.filter((c) => c.facilityId === currentUser.facilityId);
  const filteredClaims = scopedClaims.filter((claim) => {
    const matchesSearch = claim.claimNumber.toLowerCase().includes(searchQuery.toLowerCase()) || claim.patientPseudoId.toLowerCase().includes(searchQuery.toLowerCase()) || claim.primaryDiagnosis.name.toLowerCase().includes(searchQuery.toLowerCase()) || claim.primaryDiagnosis.code.toLowerCase().includes(searchQuery.toLowerCase()) || claim.inacbgCode.toLowerCase().includes(searchQuery.toLowerCase()) || claim.facilityName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRisk = selectedRiskBand === "all" ? true : selectedRiskBand === "fast_track" ? claim.fastTrack : claim.riskBand === selectedRiskBand;
    const matchesStatus = selectedStatus === "all" ? true : claim.status === selectedStatus;
    const matchesFacility = !isAdmin || selectedFacility === "all" ? true : claim.facilityName === selectedFacility;
    const matchesAnomaly = selectedAnomalyType === "all" ? true : selectedAnomalyType === "upcoding" ? claim.findings.some((f) => f.type === "upcoding") : selectedAnomalyType === "unbundling" ? claim.findings.some((f) => f.type === "unbundling") : selectedAnomalyType === "seal_tamper" ? claim.isTampered || claim.findings.some((f) => f.ruleId === "R-SEAL") : true;
    return matchesSearch && matchesRisk && matchesStatus && matchesFacility && matchesAnomaly;
  }).sort((a, b) => {
    if (isAdmin && adminSubTab === "queue") {
      if (a.isTampered && !b.isTampered) return -1;
      if (!a.isTampered && b.isTampered) return 1;
      const riskWeight = { Tinggi: 3, Sedang: 2, Rendah: 1 };
      const diff = riskWeight[b.riskBand] - riskWeight[a.riskBand];
      if (diff !== 0) return diff;
      return b.riskScore - a.riskScore;
    }
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
  return <div className="space-y-5">
      {
    /* Admin Top Segmented Tabs - Eliminates duplicate menu confusion */
  }
      {isAdmin && <div className="bg-slate-100 p-1 rounded-2xl flex flex-wrap gap-1 max-w-2xl border border-slate-200/80 shadow-2xs">
          <button
    onClick={() => {
      setAdminSubTab("queue");
      setSelectedStatus("all");
      setSelectedRiskBand("all");
      setSelectedAnomalyType("all");
    }}
    className={`relative flex-1 py-2.5 px-4 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-2 ${adminSubTab === "queue" ? "text-emerald-900 font-bold" : "text-slate-600 hover:text-slate-900"}`}
  >
            {adminSubTab === "queue" && <motion.div
    layoutId="activeAdminSubTabIndicator"
    className="absolute inset-0 bg-white rounded-xl shadow-xs"
    transition={{ type: "spring", stiffness: 380, damping: 32 }}
  />}
            <span className="relative z-10 flex items-center gap-2">
              <Inbox className="w-4 h-4 text-emerald-600" />
              <span>Antrean Verifikasi</span>
              {waitingCount > 0 && <span
    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${adminSubTab === "queue" ? "bg-emerald-100 text-emerald-800" : "bg-slate-200 text-slate-700"}`}
  >
                  {waitingCount}
                </span>}
            </span>
          </button>

          <button
    onClick={() => {
      setAdminSubTab("all");
      setSelectedStatus("all");
      setSelectedRiskBand("all");
      setSelectedAnomalyType("all");
    }}
    className={`relative flex-1 py-2.5 px-4 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-2 ${adminSubTab === "all" ? "text-emerald-900 font-bold" : "text-slate-600 hover:text-slate-900"}`}
  >
            {adminSubTab === "all" && <motion.div
    layoutId="activeAdminSubTabIndicator"
    className="absolute inset-0 bg-white rounded-xl shadow-xs"
    transition={{ type: "spring", stiffness: 380, damping: 32 }}
  />}
            <span className="relative z-10 flex items-center gap-2">
              <FileCheck2 className="w-4 h-4 text-emerald-600" />
              <span>Semua Klaim</span>
              <span
    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${adminSubTab === "all" ? "bg-emerald-100 text-emerald-800" : "bg-slate-200 text-slate-700"}`}
  >
                {claims.length}
              </span>
            </span>
          </button>

          <button
    onClick={() => {
      setAdminSubTab("findings");
      setSelectedStatus("all");
      setSelectedRiskBand("all");
      setSelectedAnomalyType("all");
    }}
    className={`relative flex-1 py-2.5 px-4 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-2 ${adminSubTab === "findings" ? "text-emerald-900 font-bold" : "text-slate-600 hover:text-slate-900"}`}
  >
            {adminSubTab === "findings" && <motion.div
    layoutId="activeAdminSubTabIndicator"
    className="absolute inset-0 bg-white rounded-xl shadow-xs"
    transition={{ type: "spring", stiffness: 380, damping: 32 }}
  />}
            <span className="relative z-10 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>Temuan Anomali & AI</span>
              {anomalyCount > 0 && <span
    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${adminSubTab === "findings" ? "bg-amber-100 text-amber-900" : "bg-slate-200 text-slate-700"}`}
  >
                  {anomalyCount}
                </span>}
            </span>
          </button>
        </div>}

      {
    /* Controls Bar */
  }
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-slate-900">
            {isAdmin ? adminSubTab === "queue" ? "Antrean Verifikasi Klaim (Prioritas Risiko)" : adminSubTab === "findings" ? "Klaim Terindikasi Anomali & Temuan AI" : "Daftar Seluruh Berkas Klaim Nasional" : `Klaim Saya \u2014 ${currentUser.facilityName || "Faskes"}`}
          </h2>
          <p className="text-xs text-slate-500">
            {isAdmin ? adminSubTab === "queue" ? `Menampilkan ${filteredClaims.length} klaim dalam antrean telaah (status menunggu verifikasi / ditelaah medis).` : adminSubTab === "findings" ? `Menampilkan ${filteredClaims.length} klaim yang memicu indikasi Upcoding, Unbundling, atau pelanggaran segel R-SEAL.` : `Total ${filteredClaims.length} berkas klaim dari seluruh rumah sakit dan fasilitas kesehatan terdaftar.` : `Total ${filteredClaims.length} berkas klaim milik fasilitas kesehatan Anda. Tersegel kriptografis & terdaftar.`}
          </p>
        </div>

        {currentUser.role === "faskes" && <button
    onClick={onOpenNewClaimModal}
    className="self-start sm:self-auto px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-xs shadow-emerald-200 transition-all flex items-center gap-2 group"
  >
            <PlusCircle className="w-4 h-4 text-emerald-100 group-hover:rotate-90 transition-transform" />
            <span>Ajukan Klaim Tersegel Baru</span>
          </button>}
      </div>

      {
    /* Filter & Search Bar */
  }
      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row gap-3">
          {
    /* Search Box */
  }
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
    type="text"
    value={searchQuery}
    onChange={(e) => setSearchQuery(e.target.value)}
    placeholder="Cari nomor klaim, ID pasien, diagnosis, atau kode INA-CBG..."
    className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-slate-50/50"
  />
          </div>

          {
    /* Facility Filter (Admin only) */
  }
          {isAdmin && <div className="w-full md:w-56">
              <CustomSelect
    value={selectedFacility}
    onChange={(val) => setSelectedFacility(String(val))}
    options={[
      { value: "all", label: "Semua RS / Faskes" },
      ...facilities.map((fac) => ({
        value: fac,
        label: fac,
        icon: <Building2 className="w-3.5 h-3.5 text-emerald-600" />
      }))
    ]}
    placeholder="Semua Faskes..."
  />
            </div>}

          {
    /* Status Filter */
  }
          <div className="w-full md:w-48">
            <CustomSelect
    value={selectedStatus}
    onChange={(val) => setSelectedStatus(val)}
    options={[
      { value: "all", label: "Semua Status Telaah" },
      {
        value: "menunggu_verifikasi",
        label: "Menunggu Verifikasi",
        badge: "Antrean",
        badgeColor: "bg-amber-100 text-amber-800"
      },
      {
        value: "ditelaah",
        label: "Ditelaah Medis",
        badge: "Telaah",
        badgeColor: "bg-sky-100 text-sky-800"
      },
      {
        value: "klarifikasi",
        label: "Klarifikasi Faskes",
        badge: "Revisi",
        badgeColor: "bg-indigo-100 text-indigo-800"
      },
      {
        value: "disetujui",
        label: "Disetujui",
        badge: "Lolos",
        badgeColor: "bg-emerald-100 text-emerald-800"
      }
    ]}
    placeholder="Status Telaah..."
  />
          </div>
        </div>

        {
    /* Risk and Anomaly Filters */
  }
        {isAdmin && <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1 border-t border-slate-100">
            <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none">
              <span className="text-[11px] font-semibold text-slate-400 mr-1 flex items-center gap-1">
                <Filter className="w-3 h-3" /> Filter Risiko:
              </span>
              {[
    { id: "all", label: "Semua Risiko" },
    { id: "fast_track", label: "Fast-Track Lolos" },
    { id: "Tinggi", label: "Risiko Tinggi" },
    { id: "Sedang", label: "Risiko Sedang" },
    { id: "Rendah", label: "Risiko Rendah" }
  ].map((pill) => <button
    key={pill.id}
    onClick={() => setSelectedRiskBand(pill.id)}
    className={`px-2.5 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${selectedRiskBand === pill.id ? "bg-emerald-600 text-white shadow-xs font-semibold" : "bg-slate-100/80 text-slate-600 hover:bg-slate-200/70"}`}
  >
                  {pill.label}
                </button>)}
            </div>

            {isVerificationQueue && <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none">
                <span className="text-[11px] font-semibold text-slate-400 mr-1">Tipe Anomali:</span>
                {[
    { id: "all", label: "Semua" },
    { id: "upcoding", label: "Upcoding" },
    { id: "unbundling", label: "Unbundling" },
    { id: "seal_tamper", label: "Integritas Gagal" }
  ].map((anom) => <button
    key={anom.id}
    onClick={() => setSelectedAnomalyType(anom.id)}
    className={`px-2 py-0.5 rounded-md text-[11px] font-semibold whitespace-nowrap transition-colors ${selectedAnomalyType === anom.id ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
  >
                    {anom.label}
                  </button>)}
              </div>}
          </div>}
      </div>

      {
    /* Claims List Table/Cards */
  }
      <div className="bg-white rounded-2xl border border-slate-100 shadow-xs overflow-hidden">
        <AnimatePresence mode="wait">
          {filteredClaims.length === 0 ? <motion.div
    key="empty"
    initial={{ opacity: 0, y: 8 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -8 }}
    transition={{ duration: 0.2, ease: "easeOut" }}
    className="p-12 text-center"
  >
              <FileText className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-700">
                {claims.length === 0 ? "Belum ada berkas klaim" : "Tidak ada klaim yang cocok"}
              </p>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                {claims.length === 0
                  ? (isAdmin
                      ? `Klaim yang diajukan oleh Faskes mitra (${currentUser.pairingCode || "BPJS-KC-JKT01"}) akan muncul di sini secara otomatis.`
                      : "Gunakan tombol 'Buat Klaim Baru' untuk mengajukan klaim INA-CBG pertama Anda.")
                  : "Coba sesuaikan kata kunci pencarian atau bersihkan filter yang aktif."}
              </p>
            </motion.div> : <motion.div
    key={(isAdmin ? adminSubTab : "faskes") + selectedStatus + selectedRiskBand + selectedAnomalyType}
    initial={{ opacity: 0, y: 8 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -8 }}
    transition={{ duration: 0.2, ease: "easeOut" }}
    className="divide-y divide-slate-100"
  >
              {filteredClaims.map((claim) => {
                // Exactly 1 single primary indicator badge per row (No rainbow clutter!)
                const singleStatusBadge = claim.isTampered
                  ? { label: "Segel Tidak Cocok", cls: "bg-rose-50 text-rose-700 border-rose-200" }
                  : claim.status === "klarifikasi"
                    ? { label: "Klarifikasi", cls: "bg-amber-50 text-amber-800 border-amber-200" }
                    : claim.status === "disetujui"
                      ? { label: "Disetujui", cls: "bg-emerald-50 text-[#0E947A] border-emerald-200" }
                      : claim.status === "ditelaah"
                        ? { label: "Ditelaah", cls: "bg-sky-50 text-sky-700 border-sky-200" }
                        : claim.fastTrack
                          ? { label: "Fast-Track", cls: "bg-emerald-50 text-[#0E947A] border-emerald-200" }
                          : { label: "Menunggu Telaah", cls: "bg-slate-50 text-slate-600 border-slate-200" };

                const aiReason = generateAiClaimReasoning(claim);

                return (
                  <div
                    key={claim.id}
                    onClick={() => onSelectClaim(claim)}
                    className="p-4 sm:p-5 hover:bg-slate-50/70 transition-all cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-4 group"
                  >
                    {/* Left block: Details */}
                    <div className="flex items-start gap-3.5 min-w-0">
                      {/* Left Clean Score/Version Box */}
                      {isAdmin ? (
                        <div className="w-11 h-11 rounded-xl bg-slate-50 border border-slate-200/80 text-slate-800 flex flex-col items-center justify-center shrink-0">
                          <span className="text-xs font-black font-mono leading-none">
                            {claim.riskScore}
                          </span>
                          <span className="text-[8px] font-semibold text-slate-400 uppercase tracking-tighter mt-0.5">
                            Skor
                          </span>
                        </div>
                      ) : (
                        <div className="w-11 h-11 rounded-xl bg-slate-50 border border-slate-200/80 text-slate-700 flex flex-col items-center justify-center shrink-0 font-mono">
                          <span className="text-xs font-bold leading-none">
                            V{claim.currentVersion}
                          </span>
                          <span className="text-[8px] font-semibold text-slate-400 uppercase tracking-tighter mt-0.5">
                            Versi
                          </span>
                        </div>
                      )}

                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-bold text-slate-900 group-hover:text-[#0E947A] font-mono">
                            #{claim.claimNumber}
                          </span>
                          {isAdmin && (
                            <>
                              <span className="text-xs text-slate-300">•</span>
                              <span className="text-xs text-slate-500 flex items-center gap-1 font-medium">
                                <Building2 className="w-3.5 h-3.5 text-slate-400" />
                                {claim.facilityName}
                              </span>
                            </>
                          )}
                        </div>

                        {/* Patient & Diagnosis */}
                        <div className="mt-1 flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                          <span className="text-sm font-bold text-slate-900">
                            {claim.primaryDiagnosis.name}
                          </span>
                          <span className="text-xs font-mono text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded-md">
                            {claim.primaryDiagnosis.code}
                          </span>
                          <span className="text-xs text-slate-400">
                            • INA-CBG: <strong className="text-slate-600 font-mono">{claim.inacbgCode}</strong> (Sev {claim.severity})
                          </span>
                        </div>

                        {/* Clean AI Reasoning Summary */}
                        <div className="text-[11px] text-slate-500 mt-1.5 flex items-start gap-1.5 leading-snug">
                          <Sparkles className="w-3.5 h-3.5 text-[#0E947A] shrink-0 mt-0.5" />
                          <span className="line-clamp-2">
                            <strong className="text-slate-700">Ringkasan Rule Engine:</strong>{" "}
                            {aiReason.shortReason}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Right block: Exactly 1 primary status badge + Amount + Arrow */}
                    <div className="flex items-center justify-between md:justify-end gap-4 shrink-0 md:text-right border-t md:border-t-0 pt-2.5 md:pt-0 border-slate-100">
                      <div className="flex flex-col md:items-end">
                        <span
                          className={`self-start md:self-end px-2.5 py-0.5 rounded-lg text-[10px] font-semibold border mb-1 ${singleStatusBadge.cls}`}
                        >
                          {singleStatusBadge.label}
                        </span>

                        <p className="text-xs font-bold text-slate-900 font-mono">
                          Rp {claim.billedAmount.toLocaleString("id-ID")}
                        </p>
                        <p className="text-[10px] text-slate-400">
                          {claim.losDays} hari rawat
                        </p>
                      </div>

                      <div className="p-2 rounded-xl bg-slate-50 group-hover:bg-[#0E947A] group-hover:text-white text-slate-400 transition-colors">
                        <ArrowRight className="w-4 h-4" />
                      </div>
                    </div>
                  </div>
                );
              })}
            </motion.div>}
        </AnimatePresence>
      </div>
    </div>;
};
export {
  ClaimsListView
};
