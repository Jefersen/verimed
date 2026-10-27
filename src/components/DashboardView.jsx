import {
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  FileText,
  PlusCircle,
  ArrowRight,
  ShieldAlert,
  Activity,
  Layers,
  Sparkles,
  Link as LinkIcon
} from "lucide-react";
import { motion } from "motion/react";
const DashboardView = ({
  claims,
  currentUser,
  onOpenNewClaimModal,
  onSelectClaim,
  onGoToInsights,
  onGoToAuditChain
}) => {
  const totalClaims = claims.length;
  const fastTrackClaims = claims.filter((c) => c.fastTrack).length;
  const highRiskClaims = claims.filter((c) => c.riskBand === "Tinggi").length;
  const mediumRiskClaims = claims.filter((c) => c.riskBand === "Sedang").length;
  const lowRiskClaims = claims.filter((c) => c.riskBand === "Rendah").length;
  const approvedClaims = claims.filter((c) => c.status === "disetujui").length;
  const reviewClaims = claims.filter((c) => c.status === "ditelaah").length;
  const clarificationClaims = claims.filter((c) => c.status === "klarifikasi").length;
  const waitingClaims = claims.filter((c) => c.status === "menunggu_verifikasi").length;
  const tamperedCount = claims.filter((c) => c.isTampered).length;
  const totalBilled = claims.reduce((acc, curr) => acc + curr.billedAmount, 0);
  const urgentClaims = [...claims].sort((a, b) => b.riskScore - a.riskScore).slice(0, 4);
  return <div className="space-y-6">
      {
    /* Welcome & Banner */
  }
      <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 rounded-2xl p-6 sm:p-8 text-white shadow-lg shadow-emerald-200/50 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-emerald-50 text-xs font-medium mb-3">
            <ShieldCheck className="w-4 h-4 text-emerald-200" />
            <span>Penyegelan Merkle & Rule Engine Aktif</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Selamat Datang, {currentUser.name}
          </h1>
          <p className="mt-1 text-sm text-emerald-100 max-w-2xl">
            {currentUser.role === "admin" ? "Dashboard terpadu Admin & Verifikator: pantau kepatuhan koding INA-CBG, verifikasi segel digital, dan telaah anomali klaim berbasis bukti objektif." : `Dashboard Fasilitas Kesehatan (${currentUser.facilityName}): kelola pengajuan klaim tersegel, pantau hasil pra-verifikasi aturan, dan tanggapi permintaan klarifikasi.`}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          {currentUser.role === "faskes" ? <button
    onClick={onOpenNewClaimModal}
    className="px-4 py-2.5 rounded-xl bg-white text-emerald-800 hover:bg-emerald-50 font-bold text-sm shadow-md transition-all flex items-center gap-2 group"
  >
              <PlusCircle className="w-4 h-4 text-emerald-600 group-hover:rotate-90 transition-transform" />
              <span>Ajukan Klaim Baru</span>
            </button> : <button
    onClick={onGoToAuditChain}
    className="px-4 py-2.5 rounded-xl bg-white/20 hover:bg-white/30 backdrop-blur-md text-white font-semibold text-sm border border-white/30 transition-all flex items-center gap-2"
  >
              <LinkIcon className="w-4 h-4" />
              <span>Audit Rantai Segel ({totalClaims} Blok)</span>
            </button>}

          <button
    onClick={onGoToInsights}
    className="px-4 py-2.5 rounded-xl bg-emerald-900/40 hover:bg-emerald-900/60 text-emerald-50 font-semibold text-sm border border-emerald-400/30 transition-all flex items-center gap-2"
  >
            <Sparkles className="w-4 h-4 text-emerald-300" />
            <span>Wawasan 1.69M Data Sampel</span>
          </button>
        </div>
      </div>

      {
    /* Primary KPI Metrics */
  }
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {
    /* Card 1: Total Claims */
  }
        <motion.div
    whileHover={{ y: -2 }}
    transition={{ duration: 0.15 }}
    className="bg-white p-5 rounded-2xl border border-emerald-100 shadow-xs flex items-center justify-between"
  >
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Total Klaim Tersegel
            </p>
            <p className="text-2xl font-black text-slate-900 mt-1">{totalClaims}</p>
            <p className="text-[11px] text-emerald-600 font-medium mt-0.5 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              100% Bersegel Kriptografis
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <FileText className="w-6 h-6" />
          </div>
        </motion.div>

        {
    /* Card 2: Fast-Track Qualified */
  }
        <motion.div
    whileHover={{ y: -2 }}
    transition={{ duration: 0.15 }}
    className="bg-white p-5 rounded-2xl border border-emerald-100 shadow-xs flex items-center justify-between"
  >
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Lolos Fast-Track
            </p>
            <p className="text-2xl font-black text-emerald-600 mt-1">{fastTrackClaims}</p>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Skor risiko &lt;30 & Segel Utuh
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </motion.div>

        {
    /* Card 3: Review / Clarification Needed */
  }
        <motion.div
    whileHover={{ y: -2 }}
    transition={{ duration: 0.15 }}
    className="bg-white p-5 rounded-2xl border border-amber-100 shadow-xs flex items-center justify-between"
  >
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Perlu Telaah / Klarifikasi
            </p>
            <p className="text-2xl font-black text-amber-600 mt-1">
              {reviewClaims + clarificationClaims}
            </p>
            <p className="text-[11px] text-amber-700 font-medium mt-0.5">
              {highRiskClaims} Risiko Tinggi terdeteksi
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <AlertTriangle className="w-6 h-6" />
          </div>
        </motion.div>

        {
    /* Card 4: Integrity Violation / Tamper Alert */
  }
        <motion.div
    whileHover={{ y: -2 }}
    transition={{ duration: 0.15 }}
    className={`p-5 rounded-2xl border shadow-xs flex items-center justify-between ${tamperedCount > 0 ? "bg-rose-50/70 border-rose-200" : "bg-white border-emerald-100"}`}
  >
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Pelanggaran Segel (R-SEAL)
            </p>
            <p
    className={`text-2xl font-black mt-1 ${tamperedCount > 0 ? "text-rose-600" : "text-slate-800"}`}
  >
              {tamperedCount} Klaim
            </p>
            <p
    className={`text-[11px] mt-0.5 font-medium ${tamperedCount > 0 ? "text-rose-700" : "text-emerald-600"}`}
  >
              {tamperedCount > 0 ? "Ketidakcocokan Merkle Leaf!" : "Semua Segel Valid"}
            </p>
          </div>
          <div
    className={`w-12 h-12 rounded-xl flex items-center justify-center ${tamperedCount > 0 ? "bg-rose-100 text-rose-600 animate-pulse" : "bg-emerald-50 text-emerald-600"}`}
  >
            <ShieldAlert className="w-6 h-6" />
          </div>
        </motion.div>
      </div>

      {
    /* Visual Chart & Distribution Section */
  }
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {
    /* Risk Distribution Breakdown */
  }
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Distribusi Pita Risiko</h2>
              <p className="text-xs text-slate-500">Klasifikasi skor risiko rule engine</p>
            </div>
            <Activity className="w-4 h-4 text-emerald-600" />
          </div>

          <div className="space-y-4">
            {
    /* High Risk Bar */
  }
            <div>
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span className="text-rose-700 flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                  Risiko Tinggi (Skor &ge; 70)
                </span>
                <span className="text-slate-700 font-bold">
                  {highRiskClaims} ({Math.round(highRiskClaims / totalClaims * 100)}%)
                </span>
              </div>
              <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                <div
    className="h-full bg-rose-500 rounded-full transition-all duration-500"
    style={{ width: `${highRiskClaims / totalClaims * 100}%` }}
  />
              </div>
            </div>

            {
    /* Medium Risk Bar */
  }
            <div>
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span className="text-amber-700 flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                  Risiko Sedang (Skor 30 - 69)
                </span>
                <span className="text-slate-700 font-bold">
                  {mediumRiskClaims} ({Math.round(mediumRiskClaims / totalClaims * 100)}%)
                </span>
              </div>
              <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                <div
    className="h-full bg-amber-500 rounded-full transition-all duration-500"
    style={{ width: `${mediumRiskClaims / totalClaims * 100}%` }}
  />
              </div>
            </div>

            {
    /* Low Risk Bar */
  }
            <div>
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span className="text-emerald-700 flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  Risiko Rendah (Skor &lt; 30)
                </span>
                <span className="text-slate-700 font-bold">
                  {lowRiskClaims} ({Math.round(lowRiskClaims / totalClaims * 100)}%)
                </span>
              </div>
              <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                <div
    className="h-full bg-emerald-500 rounded-full transition-all duration-500"
    style={{ width: `${lowRiskClaims / totalClaims * 100}%` }}
  />
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 text-[11px] text-slate-500 flex items-center justify-between">
            <span>Fast-track auto-approval:</span>
            <span className="font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
              {fastTrackClaims} dari {totalClaims} Klaim
            </span>
          </div>
        </div>

        {
    /* Claim Status Workflow */
  }
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Status Verifikasi Klaim</h2>
              <p className="text-xs text-slate-500">Alur telaah verifikator & faskes</p>
            </div>
            <Layers className="w-4 h-4 text-emerald-600" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-xl bg-emerald-50/60 border border-emerald-100 text-left">
              <span className="text-[10px] uppercase font-bold text-emerald-700 tracking-wider">
                Disetujui
              </span>
              <p className="text-xl font-bold text-emerald-800 mt-0.5">{approvedClaims}</p>
              <p className="text-[11px] text-emerald-600">Lolos verifikasi</p>
            </div>

            <div className="p-3 rounded-xl bg-amber-50/60 border border-amber-100 text-left">
              <span className="text-[10px] uppercase font-bold text-amber-700 tracking-wider">
                Ditelaah Medis
              </span>
              <p className="text-xl font-bold text-amber-800 mt-0.5">{reviewClaims}</p>
              <p className="text-[11px] text-amber-600">Kesesuaian koding</p>
            </div>

            <div className="p-3 rounded-xl bg-blue-50/60 border border-blue-100 text-left">
              <span className="text-[10px] uppercase font-bold text-blue-700 tracking-wider">
                Klarifikasi Faskes
              </span>
              <p className="text-xl font-bold text-blue-800 mt-0.5">{clarificationClaims}</p>
              <p className="text-[11px] text-blue-600">Menunggu respons RS</p>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-left">
              <span className="text-[10px] uppercase font-bold text-slate-600 tracking-wider">
                Antrian Baru
              </span>
              <p className="text-xl font-bold text-slate-800 mt-0.5">{waitingClaims}</p>
              <p className="text-[11px] text-slate-500">Belum diputuskan</p>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
            <span>Total Nilai Pengajuan:</span>
            <span className="font-bold text-slate-900">
              Rp {totalBilled.toLocaleString("id-ID")}
            </span>
          </div>
        </div>

        {
    /* National BPJS Reference Bridge Card */
  }
        <div className="bg-gradient-to-br from-emerald-50 via-white to-teal-50/70 p-6 rounded-2xl border border-emerald-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-emerald-800 text-xs font-bold mb-2">
              <Sparkles className="w-4 h-4 text-emerald-600" />
              <span>Analitik Nasional Edisi 2025</span>
            </div>
            <h2 className="text-base font-bold text-slate-900">
              Pola Sinyal pada 1.699.219 Data Sampel
            </h2>
            <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
              Aturan rule engine VeriMed (U1-U3, B1-B3, F-SEV2) dikalibrasi terhadap data nasional BPJS Kesehatan FKRTL untuk mendeteksi anomali tanpa bias tarif.
            </p>

            <div className="mt-4 space-y-2">
              <div className="flex justify-between items-center text-xs p-2 rounded-lg bg-white/80 border border-emerald-100">
                <span className="text-slate-600">Severity 2+ Tanpa Dx Sekunder:</span>
                <span className="font-bold text-slate-800 font-mono">94.036 (5.53%)</span>
              </div>
              <div className="flex justify-between items-center text-xs p-2 rounded-lg bg-white/80 border border-emerald-100">
                <span className="text-slate-600">Kunjungan Berimpit (≤ 7 Hari):</span>
                <span className="font-bold text-slate-800 font-mono">1.876 Pasang</span>
              </div>
            </div>
          </div>

          <button
    onClick={onGoToInsights}
    className="mt-5 w-full py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs transition-colors flex items-center justify-center gap-1.5 shadow-sm"
  >
            <span>Buka Modul Wawasan Data Sampel</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {
    /* Priority Action Table: Klaim Perlu Perhatian Segera */
  }
      <div className="bg-white rounded-2xl border border-slate-100 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Antrian Klaim Prioritas Telaah
            </h2>
            <p className="text-xs text-slate-500">
              Klaim dengan skor risiko tertinggi atau temuan aturan klinis yang memerlukan tindakan
            </p>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 self-start sm:self-auto">
            Urutan Berdasarkan Risiko
          </span>
        </div>

        <div className="divide-y divide-slate-100 overflow-x-auto">
          {urgentClaims.map((claim) => <div
    key={claim.id}
    onClick={() => onSelectClaim(claim)}
    className="p-4 sm:p-5 hover:bg-slate-50/80 transition-colors cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4 group"
  >
              <div className="flex items-start gap-3.5">
                {
    /* Risk score badge */
  }
                <div
    className={`w-11 h-11 rounded-xl flex flex-col items-center justify-center text-center shrink-0 font-bold ${claim.isTampered || claim.riskScore >= 70 ? "bg-rose-100 text-rose-700 border border-rose-200" : claim.riskScore >= 30 ? "bg-amber-100 text-amber-800 border border-amber-200" : "bg-emerald-100 text-emerald-800 border border-emerald-200"}`}
  >
                  <span className="text-sm leading-none">{claim.riskScore}</span>
                  <span className="text-[9px] uppercase tracking-tighter mt-0.5">Skor</span>
                </div>

                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-bold text-slate-900 group-hover:text-emerald-700 transition-colors font-mono">
                      #{claim.claimNumber}
                    </span>
                    <span className="text-xs font-medium text-slate-500">•</span>
                    <span className="text-xs font-semibold text-slate-700">
                      {claim.facilityName}
                    </span>
                    {claim.isTampered && <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-600 text-white animate-pulse">
                        SEGEL RUSAK
                      </span>}
                    {claim.fastTrack && <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                        FAST-TRACK
                      </span>}
                  </div>

                  <p className="text-xs text-slate-600 mt-1 line-clamp-1">
                    <strong className="text-slate-800">{claim.primaryDiagnosis.name}</strong> ({claim.inacbgCode})
                  </p>

                  <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                    {claim.findings.map((f) => <span
    key={f.id}
    className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200/70"
  >
                        {f.ruleId}: {f.type}
                      </span>)}
                    {claim.findings.length === 0 && <span className="text-[10px] text-emerald-700 font-medium">
                        Tidak ada pelanggaran aturan terdeteksi
                      </span>}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0 sm:text-right">
                <div>
                  <p className="text-xs font-bold text-slate-900">
                    Rp {claim.billedAmount.toLocaleString("id-ID")}
                  </p>
                  <p className="text-[11px] text-slate-500 capitalize">
                    Status: <strong className="text-slate-700">{claim.status.replace("_", " ")}</strong>
                  </p>
                </div>
                <div className="p-2 rounded-lg bg-slate-100 group-hover:bg-emerald-100 group-hover:text-emerald-800 text-slate-500 transition-colors">
                  <ArrowRight className="w-4 h-4" />
                </div>
              </div>
            </div>)}
        </div>
      </div>
    </div>;
};
export {
  DashboardView
};
