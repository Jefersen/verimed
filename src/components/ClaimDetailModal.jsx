import { useState, useRef, useEffect, useLayoutEffect } from "react";
import {
  X,
  ShieldCheck,
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  FileText,
  FlaskConical,
  GitBranch,
  History,
  Building2,
  HelpCircle,
  Copy,
  Check,
  Sparkles,
  Cpu,
  RefreshCw
} from "lucide-react";
import { motion } from "motion/react";
import { buildClaimLeaves, verifySealLeaves } from "../utils/crypto";
import { generateAiClaimReasoning } from "../utils/rules";
import {
  fetchAiStatus,
  getSavedClientAiConfig,
  requestAiClaimAnalysis,
  requestAiDraftNote
} from "../utils/aiClient";
const ClaimDetailModal = ({
  claim,
  currentUser,
  onClose,
  onUpdateStatus,
  onToggleTamper,
  onRequestClarification,
  onOpenClarificationModal,
  onGoToAiSettings,
  onShowToast
}) => {
  const isAdmin = currentUser.role === "admin";
  const [activeTab, setActiveTab] = useState(isAdmin ? "rules" : "billing_resume");
  const [reviewerNote, setReviewerNote] = useState("");
  const [clarificationText, setClarificationText] = useState("");
  const [copiedHash, setCopiedHash] = useState(null);
  const [isAiScanning, setIsAiScanning] = useState(false);
  const [isDraftingNote, setIsDraftingNote] = useState(false);
  const [liveAiData, setLiveAiData] = useState(null);
  const [aiError, setAiError] = useState(null);
  const [reanalyzeCount, setReanalyzeCount] = useState(0);
  const [auditTestResult, setAuditTestResult] = useState(null);
  const [isAuditing, setIsAuditing] = useState(false);

  useEffect(() => {
    setAuditTestResult(null);
  }, [claim.id, claim.isTampered, claim.billedAmount, claim.resumeText]);

  const staticReasoning = generateAiClaimReasoning(claim);
  const aiReasoning = liveAiData?.reasoning || staticReasoning;

  // Auto-check AI status on open or when claim/tamper state changes
  useEffect(() => {
    let cancelled = false;
    setLiveAiData(null);
    setAiError(null);
    setReanalyzeCount(0);

    async function initAiCheck() {
      const localCfg = getSavedClientAiConfig();
      const status = await fetchAiStatus();
      if (cancelled) return;

      if (status.connected || localCfg?.apiKey) {
        setIsAiScanning(true);
        const res = await requestAiClaimAnalysis(claim, 1);
        if (cancelled) return;
        setIsAiScanning(false);
        if (res.success) {
          setLiveAiData(res);
          setReanalyzeCount(1);
          setAiError(null);
        } else {
          setAiError({
            code: res.code,
            message: res.error
          });
        }
      } else {
        setAiError({
          code: "NO_API_KEY",
          message:
            "API Key AI belum dimasukkan atau belum dihubungkan. Saat ini sistem menampilkan hasil Rule Engine statis lokal. Silakan masukkan API Key di menu Konfigurasi AI agar analisis memanggil model LLM secara nyata."
        });
      }
    }

    initAiCheck();
    return () => {
      cancelled = true;
    };
  }, [claim.id, claim.isTampered, claim.currentVersion]);

  const handleRunAiScan = async () => {
    setIsAiScanning(true);
    setAiError(null);
    const nextCount = reanalyzeCount + 1;
    const res = await requestAiClaimAnalysis(claim, nextCount);
    setIsAiScanning(false);

    if (res.success) {
      setLiveAiData(res);
      setReanalyzeCount(nextCount);
      setAiError(null);
      if (onShowToast) {
        onShowToast(
          `Analisis ulang AI ke-#${nextCount} berhasil diproses oleh ${res.model} (${res.latencyMs} ms).`,
          "success"
        );
      }
    } else {
      setAiError({
        code: res.code,
        message: res.error
      });
      if (onShowToast) {
        onShowToast(res.error, "error");
      }
    }
  };

  const handleRunIntegrityAudit = () => {
    setIsAuditing(true);
    setTimeout(() => {
      setIsAuditing(false);
      const res = verifySealLeaves(claim.seal, currentLeaves);
      setAuditTestResult(res);
      if (onShowToast) {
        if (res.isValid) {
          onShowToast("Audit Integritas: LULUS UJI! Semua 5 Daun Merkle cocok dengan Segel Vault.", "success");
        } else {
          onShowToast(`Audit Integritas: GAGAL UJI! ${res.tamperedLeaves.length} daun Merkle terdeteksi diubah.`, "error");
        }
      }
    }, 320);
  };

  const handleDraftNoteWithAi = async () => {
    setIsDraftingNote(true);
    const res = await requestAiDraftNote(claim, "admin");
    setIsDraftingNote(false);
    if (res.success && res.note) {
      setReviewerNote(res.note);
      if (onShowToast) {
        onShowToast(`Catatan verifikator disusun oleh AI (${res.model}).`, "success");
      }
    } else {
      setAiError({
        code: res.code,
        message: res.error
      });
      if (onShowToast) {
        onShowToast(res.error, "error");
      }
    }
  };
  const contentInnerRef = useRef(null);
  const [contentHeight, setContentHeight] = useState("auto");
  const [isHeightAnimating, setIsHeightAnimating] = useState(false);
  const isInitialMount = useRef(true);
  const measureAndSetHeight = () => {
    if (contentInnerRef.current) {
      const measured = contentInnerRef.current.scrollHeight;
      if (measured > 0) {
        const maxHeight = Math.round(window.innerHeight * 0.65);
        setContentHeight(Math.min(measured, maxHeight));
      }
    }
  };
  useLayoutEffect(() => {
    measureAndSetHeight();
    if (isInitialMount.current) {
      const timer = setTimeout(() => {
        isInitialMount.current = false;
      }, 60);
      return () => clearTimeout(timer);
    }
  }, [activeTab, claim]);
  useEffect(() => {
    const el = contentInnerRef.current;
    if (!el) return;
    const observer = new ResizeObserver(() => {
      measureAndSetHeight();
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [activeTab, claim]);
  useEffect(() => {
    window.addEventListener("resize", measureAndSetHeight);
    return () => window.removeEventListener("resize", measureAndSetHeight);
  }, []);
  const currentLeaves = buildClaimLeaves({
    encounterId: claim.encounterId,
    patientPseudoId: claim.patientPseudoId,
    admitDate: claim.admitDate,
    dischargeDate: claim.dischargeDate,
    inacbgCode: claim.inacbgCode,
    severity: claim.severity,
    billedAmount: claim.billedAmount,
    items: claim.items,
    resumeText: claim.resumeText,
    labRefs: claim.labRefs,
    version: claim.currentVersion
  });
  const verificationResult = verifySealLeaves(claim.seal, currentLeaves);
  const handleCopyHash = (text, id) => {
    navigator.clipboard?.writeText(text);
    setCopiedHash(id);
    setTimeout(() => setCopiedHash(null), 2e3);
  };
  const handleAction = (status) => {
    onUpdateStatus(claim.id, status, reviewerNote || `Keputusan verifikator: ${status.replace("_", " ")}.`);
    setReviewerNote("");
  };
  return <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    transition={{ duration: 0.22, ease: "easeOut" }}
    className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex justify-center items-start p-3 sm:p-5 py-6 sm:py-10"
    onClick={(e) => {
      if (e.target === e.currentTarget) onClose();
    }}
  >
      <motion.div
    initial={{ opacity: 0, scale: 0.94, y: 14 }}
    animate={{ opacity: 1, scale: 1, y: 0 }}
    exit={{ opacity: 0, scale: 0.94, y: 14 }}
    transition={{ type: "spring", damping: 28, stiffness: 360, mass: 0.85 }}
    className="bg-white w-full max-w-4xl rounded-3xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col"
  >
        {
    /* Modal Header */
  }
        <div className="p-5 sm:p-6 border-b border-slate-100 flex items-start justify-between gap-4 bg-slate-50/70">
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="text-sm font-black text-slate-900 font-mono">
                #{claim.claimNumber}
              </span>
              <span className="text-xs text-slate-400">•</span>
              <span className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                <Building2 className="w-3.5 h-3.5 text-slate-400" />
                {claim.facilityName}
              </span>

              {/* Exactly 1 Single Primary Status Badge */}
              {(() => {
                const singleBadge = claim.isTampered
                  ? { label: "Segel Tidak Cocok", cls: "bg-rose-50 text-rose-700 border-rose-200" }
                  : claim.status === "klarifikasi"
                    ? { label: "Klarifikasi", cls: "bg-amber-50 text-amber-800 border-amber-200" }
                    : claim.status === "disetujui"
                      ? { label: "Disetujui", cls: "bg-emerald-50 text-[#0E947A] border-emerald-200" }
                      : claim.status === "ditelaah"
                        ? { label: "Ditelaah", cls: "bg-sky-50 text-sky-700 border-sky-200" }
                        : claim.fastTrack
                          ? { label: "Fast-Track", cls: "bg-emerald-50 text-[#0E947A] border-emerald-200" }
                          : { label: "Menunggu Telaah", cls: "bg-slate-100 text-slate-700 border-slate-200" };

                return (
                  <span
                    className={`text-[11px] font-semibold tracking-wider px-2.5 py-0.5 rounded-full border ${singleBadge.cls}`}
                  >
                    {singleBadge.label}
                  </span>
                );
              })()}
            </div>

            <h2 className="text-lg font-bold text-slate-900 mt-1">
              {claim.primaryDiagnosis.name}{" "}
              <span className="text-xs font-mono font-semibold text-slate-500">
                ({claim.primaryDiagnosis.code})
              </span>
            </h2>

            <div className="flex items-center gap-4 text-xs text-slate-500 mt-1 flex-wrap">
              <span>
                Pasien ID: <strong className="text-slate-800 font-mono">{claim.patientPseudoId}</strong>
              </span>
              <span>•</span>
              <span>
                Paket INA-CBG: <strong className="text-slate-800 font-mono">{claim.inacbgCode}</strong> (Sev {claim.severity})
              </span>
              <span>•</span>
              <span>
                Lama Rawat: <strong className="text-slate-800">{claim.losDays} Hari</strong>
              </span>
              <span>•</span>
              <span>
                Tagihan: <strong className="text-emerald-700 font-bold">Rp {claim.billedAmount.toLocaleString("id-ID")}</strong>
              </span>
            </div>
          </div>

          <button
    data-tour="modal-close-btn"
    onClick={onClose}
    className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors"
  >
            <X className="w-5 h-5" />
          </button>
        </div>

        {
    /* Modal Navigation Tabs - Segmented Pill Slider */
  }
        <div className="px-5 sm:px-6 py-2.5 bg-slate-50/70 border-b border-slate-100 overflow-x-auto scrollbar-none">
          <div className="flex items-center gap-1 bg-slate-200/60 p-1 rounded-2xl w-max min-w-full sm:min-w-0">
            {(isAdmin ? [
    { id: "rules", label: "Hasil Rule Engine & AI", icon: AlertTriangle, count: claim.findings.length },
    { id: "merkle", label: "Segel Kriptografis & Merkle", icon: GitBranch },
    { id: "tamper_test", label: "Uji Tamper & Integritas", icon: ShieldAlert, alert: claim.isTampered },
    { id: "billing_resume", label: "Tagihan & Resume Medis", icon: FileText },
    { id: "clarification", label: "Klarifikasi & Catatan", icon: HelpCircle, count: claim.clarificationHistory?.length || (claim.status === "klarifikasi" ? 1 : 0) },
    { id: "versions", label: `Riwayat Versi (V${claim.currentVersion})`, icon: History }
  ] : [
    { id: "billing_resume", label: "Tagihan & Resume Medis", icon: FileText },
    { id: "merkle", label: "Integritas Segel Digital", icon: ShieldCheck },
    { id: "clarification", label: "Catatan & Permintaan Klarifikasi", icon: HelpCircle, alert: claim.status === "klarifikasi", count: claim.clarificationHistory?.length || (claim.status === "klarifikasi" ? 1 : 0) },
    { id: "versions", label: `Riwayat Versi (V${claim.currentVersion})`, icon: History }
  ]).map((tab) => {
    const Icon = tab.icon;
    const isActive = activeTab === tab.id;
    return <button
      key={tab.id}
      data-tour={`modal-tab-${tab.id}`}
      onClick={() => setActiveTab(tab.id)}
      className={`relative py-2 px-3.5 rounded-xl text-xs font-semibold whitespace-nowrap flex items-center gap-2 transition-colors z-10 ${isActive ? "text-emerald-950 font-bold" : "text-slate-600 hover:text-slate-900"}`}
    >
                  {isActive && <motion.div
      layoutId="activeModalTabIndicator"
      className="absolute inset-0 bg-white rounded-xl shadow-xs border border-slate-200/80 -z-10"
      transition={{ type: "spring", stiffness: 420, damping: 35 }}
    />}
                  <Icon className={`w-3.5 h-3.5 shrink-0 ${isActive ? "text-emerald-600" : "text-slate-400"}`} />
                  <span>{tab.label}</span>
                  {tab.count !== void 0 && tab.count > 0 && <span
      className={`px-1.5 py-0.5 text-[10px] font-bold rounded-full ${isActive ? "bg-emerald-100 text-emerald-800" : "bg-slate-200/90 text-slate-700"}`}
    >
                      {tab.count}
                    </span>}
                  {tab.alert && <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping shrink-0" />}
                </button>;
  })}
          </div>
        </div>

        {
    /* Tab Content Body with Smooth Height Animation (Memanjang & Memendek) */
  }
        <motion.div
    animate={contentHeight !== "auto" ? { height: contentHeight } : { height: "auto" }}
    transition={{
      height: isInitialMount.current ? { duration: 0 } : { duration: 0.38, ease: [0.16, 1, 0.3, 1] }
    }}
    onAnimationStart={() => setIsHeightAnimating(true)}
    onAnimationComplete={() => setIsHeightAnimating(false)}
    className={`bg-white transition-colors ${isHeightAnimating ? "overflow-hidden" : "overflow-y-auto"}`}
    style={{ maxHeight: "calc(85vh - 190px)" }}
  >
          <div ref={contentInnerRef} className="p-5 sm:p-6 space-y-5">
            <motion.div
    key={activeTab}
    initial={{ opacity: 0, y: 6 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.2, ease: "easeOut" }}
    className="space-y-5"
  >
          {
    /* TAB 1: RULES & CLINICAL FINDINGS */
  }
          {activeTab === "rules" && <div className="space-y-4">
              {
    /* Risk Score Summary Banner */
  }
              <div
    className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${claim.isTampered || claim.riskBand === "Tinggi" ? "bg-rose-50/70 border-rose-200" : claim.riskBand === "Sedang" ? "bg-amber-50/70 border-amber-200" : "bg-emerald-50/70 border-emerald-200"}`}
  >
                <div className="flex items-center gap-3.5">
                  <div
    className={`w-12 h-12 rounded-xl flex flex-col items-center justify-center font-bold text-center ${claim.isTampered || claim.riskBand === "Tinggi" ? "bg-rose-600 text-white" : claim.riskBand === "Sedang" ? "bg-amber-500 text-white" : "bg-emerald-600 text-white"}`}
  >
                    <span className="text-base leading-none">{claim.riskScore}</span>
                    <span className="text-[9px] uppercase tracking-tighter">Skor</span>
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">
                      Pita Risiko: {claim.riskBand}
                    </h3>
                    <p className="text-xs text-slate-600">
                      {claim.isTampered ? "Integritas berkas terganggu (R-SEAL). Segel tidak cocok dengan data awal." : claim.riskBand === "Tinggi" ? "Ditemukan anomali signifikan yang memerlukan telaah mendalam sebelum klaim dapat diproses." : claim.riskBand === "Sedang" ? "Ditemukan peringatan koding atau potensi ketidaksesuaian paket tindakan." : "Semua aturan klinis terpenuhi dengan bukti objektif pendukung lengkap."}
                    </p>
                  </div>
                </div>

                <div className="text-xs font-semibold shrink-0">
                  {claim.fastTrack ? <span className="px-3 py-1.5 rounded-lg bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      Lolos Fast-Track
                    </span> : <span className="px-3 py-1.5 rounded-lg bg-white/80 text-slate-700 border border-slate-200 flex items-center gap-1.5">
                      <AlertTriangle className="w-4 h-4 text-amber-600" />
                      Memerlukan Verifikasi
                    </span>}
                </div>
              </div>

              {/* Dedicated AI Co-Pilot Reasoning & Forensic Explanation Card */}
              <div data-tour="modal-ai-card" className="p-4 sm:p-5 rounded-2xl bg-slate-50/90 border border-slate-200/90 space-y-3.5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-slate-200/70">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-[#0E947A] text-white flex items-center justify-center shrink-0">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="text-xs sm:text-sm font-bold text-slate-900">
                          Diagnosis & Penjelasan AI (VeriMed AI Co-Pilot)
                        </h4>
                        {liveAiData && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-[#0E947A] border border-emerald-200">
                            {aiReasoning.badgeText}
                          </span>
                        )}
                        {liveAiData ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold border flex items-center gap-1 bg-teal-100/80 text-teal-900 border-teal-300">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            Live LLM: {liveAiData.model} ({(liveAiData.latencyMs / 1000).toFixed(1)} dtk) • Prompt #{liveAiData.reanalyzeCount}
                          </span>
                        ) : isAiScanning ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-sky-50 text-sky-800 border border-sky-200">
                            Sedang memanggil model AI...
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                            {aiError?.code === "NO_API_KEY" ? "API Key AI Belum Aktif" : "Jawaban AI Belum Tersedia"}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500">
                        Analisis otomatis alasan ketidakwajaran segel, bukti lab LIS, dan kepatuhan tarif INA-CBG
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    data-tour="modal-ai-reanalyze-btn"
                    onClick={handleRunAiScan}
                    disabled={isAiScanning}
                    className="self-start sm:self-auto px-3 py-1.5 rounded-xl bg-white hover:bg-emerald-50 text-slate-700 hover:text-[#0E947A] border border-slate-200 hover:border-emerald-300 text-[11px] font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 shadow-2xs"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 text-[#0E947A] ${isAiScanning ? "animate-spin" : ""}`} />
                    <span>{isAiScanning ? "Memanggil LLM AI..." : "Analisis Ulang AI"}</span>
                  </button>
                </div>

                {/* Clear Notice / Error Banner when AI is not connected or fails */}
                {aiError && !isAiScanning && (
                  <div className="p-3.5 rounded-xl bg-amber-50/90 border border-amber-200/90 text-xs text-amber-950 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-bold text-amber-900 text-[11px]">
                          {aiError.code === "NO_API_KEY"
                            ? "AI Belum Terpanggil: API Key Belum Dimasukkan"
                            : "Panggilan ke Model AI Gagal"}
                        </p>
                        <p className="text-[11px] text-amber-800 leading-relaxed mt-0.5">
                          {aiError.message}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 self-start sm:self-center">
                      <button
                        type="button"
                        onClick={handleRunAiScan}
                        className="px-3 py-1.5 rounded-lg bg-white hover:bg-amber-100 text-amber-900 border border-amber-300 font-semibold text-[11px] transition-colors cursor-pointer"
                      >
                        Coba Panggil Ulang
                      </button>
                      {isAdmin && onGoToAiSettings && (
                        <button
                          type="button"
                          onClick={() => {
                            onClose();
                            onGoToAiSettings();
                          }}
                          className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-semibold text-[11px] transition-colors cursor-pointer"
                        >
                          Buka Konfigurasi AI
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {isAiScanning ? (
                  <div className="p-6 rounded-xl bg-white border border-slate-200/80 flex flex-col items-center justify-center text-center space-y-2.5">
                    <RefreshCw className="w-6 h-6 text-[#0E947A] animate-spin" />
                    <p className="text-xs font-bold text-slate-800">
                      Menghubungi Model AI & Menganalisis Klaim #{claim.claimNumber}...
                    </p>
                    <p className="text-[11px] text-slate-500 max-w-md">
                      AI sedang memeriksa kecocokan hash 5 daun Merkle, rincian item tagihan, resume klinis, dan rujukan hasil lab secara real-time.
                    </p>
                  </div>
                ) : liveAiData ? (
                  <>
                    <p className="text-xs text-slate-700 leading-relaxed font-medium">
                      {liveAiData.reasoning.summary}
                    </p>

                    <div className="space-y-2.5">
                      {(liveAiData.reasoning.details || []).map((item, idx) => (
                        <div
                          key={idx}
                          className="p-3 rounded-xl bg-white border border-slate-200/80 space-y-1"
                        >
                          <p className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                            <Cpu className="w-3.5 h-3.5 text-[#0E947A] shrink-0" />
                            <span>{item.title}</span>
                          </p>
                          <p className="text-xs text-slate-600 leading-relaxed pl-5">
                            {item.text}
                          </p>
                        </div>
                      ))}
                    </div>
                  </>
                ) : null}

                {isAdmin && liveAiData?.reasoning?.suggestedNote && (
                  <div className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                    <div>
                      <span className="font-bold text-[#0E947A] text-[11px] block">
                        Rekomendasi Draft Catatan Verifikator (oleh {liveAiData.model}):
                      </span>
                      <span className="text-slate-700 text-[11px] italic">
                        "{liveAiData.reasoning.suggestedNote}"
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setReviewerNote(liveAiData.reasoning.suggestedNote);
                        if (onShowToast) {
                          onShowToast("Draft catatan AI disalin ke kolom catatan verifikator.", "success");
                        }
                      }}
                      className="px-2.5 py-1.5 rounded-lg bg-[#0E947A] hover:bg-[#0B7A64] text-white font-semibold text-[11px] shrink-0 transition-colors cursor-pointer self-start sm:self-center"
                    >
                      Pakai Catatan Ini
                    </button>
                  </div>
                )}
              </div>

              {
    /* Findings List */
  }
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  Rincian Temuan Aturan ({claim.findings.length})
                </h4>

                {claim.findings.length === 0 ? <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
                    <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                    <p className="text-sm font-semibold text-slate-800">
                      Klaim Bersih Tanpa Temuan Pelanggaran
                    </p>
                    <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                      Klaim ini lolos semua pengecekan upcoding (U1-U3), unbundling (B1-B3), dan integritas segel (R-SEAL).
                    </p>
                  </div> : claim.findings.map((finding) => <div
    key={finding.id}
    className="p-4 rounded-xl border border-slate-200 bg-white text-left space-y-3"
  >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <span
    className={`px-2 py-0.5 rounded-md text-xs font-mono font-bold border ${finding.ruleId === "R-SEAL" ? "bg-rose-50 text-rose-700 border-rose-200" : finding.type === "upcoding" ? "bg-amber-50 text-amber-800 border-amber-200" : "bg-slate-100 text-slate-700 border-slate-200"}`}
  >
                            {finding.ruleId}
                          </span>
                          <h5 className="text-sm font-bold text-slate-900">
                            {finding.title}
                          </h5>
                        </div>
                        <span className="text-[11px] font-semibold text-slate-500 bg-slate-50 px-2 py-0.5 rounded-md border border-slate-200">
                          Bobot: {finding.weight}
                        </span>
                      </div>

                      <p className="text-xs text-slate-700 leading-relaxed">
                        {finding.description}
                      </p>

                      {liveAiData?.reasoning?.findingExplanations?.[finding.ruleId] ? (
                        <div className="p-3 rounded-xl bg-emerald-50/60 border border-emerald-200/80 text-xs text-slate-800 space-y-1">
                          <p className="font-bold text-[#0E947A] flex items-center gap-1.5 text-[11px]">
                            <Sparkles className="w-3.5 h-3.5 shrink-0" />
                            <span>
                              Penjelasan AI Mengapa Ini Tidak Wajar (Live LLM: {liveAiData.model}):
                            </span>
                          </p>
                          <p className="leading-relaxed text-slate-700">
                            {liveAiData.reasoning.findingExplanations[finding.ruleId]}
                          </p>
                        </div>
                      ) : isAiScanning ? (
                        <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 text-[11px] text-slate-500 flex items-center gap-2">
                          <RefreshCw className="w-3.5 h-3.5 text-[#0E947A] animate-spin shrink-0" />
                          <span>Menunggu penjelasan spesifik AI untuk temuan {finding.ruleId}...</span>
                        </div>
                      ) : null}

                      {
    /* Evidence Trail Box (PRD 11.3: Setiap temuan menyimpan jejak bukti) */
  }
                      <div className="p-3 rounded-lg bg-white border border-slate-200/90 space-y-2 text-xs">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                          Jejak Bukti Objektif (Evidence Trail)
                        </span>

                        {finding.evidence.vaultValue && <div className="flex items-start gap-2">
                            <span className="font-semibold text-emerald-800 min-w-[120px]">
                              Data Vault Tersegel:
                            </span>
                            <span className="text-slate-800 font-mono bg-emerald-50 px-1.5 py-0.2 rounded-sm border border-emerald-200">
                              {finding.evidence.vaultValue}
                            </span>
                          </div>}

                        {finding.evidence.claimedValue && <div className="flex items-start gap-2">
                            <span className="font-semibold text-amber-800 min-w-[120px]">
                              Klaim Ditagihkan:
                            </span>
                            <span className="text-slate-800 font-mono bg-amber-50 px-1.5 py-0.2 rounded-sm border border-amber-200">
                              {finding.evidence.claimedValue}
                            </span>
                          </div>}

                        {finding.evidence.quote && <div className="flex items-start gap-2">
                            <span className="font-semibold text-slate-600 min-w-[120px]">
                              Kutipan Teks Resume:
                            </span>
                            <span className="text-slate-700 italic bg-slate-50 px-1.5 py-0.2 rounded-sm border border-slate-200">
                              {finding.evidence.quote}
                            </span>
                          </div>}

                        <div className="flex items-start gap-2 pt-1 border-t border-slate-100 text-[11px]">
                          <span className="font-semibold text-slate-500 min-w-[120px]">
                            Rujukan Regulasi/Klinis:
                          </span>
                          <span className="text-slate-600">
                            {finding.evidence.clinicalRef}
                          </span>
                        </div>
                      </div>
                    </div>)}
              </div>
            </div>}

          {
    /* TAB 2: MERKLE TREE & CRYPTOGRAPHIC SEAL */
  }
          {activeTab === "merkle" && <div className="space-y-4">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    Parameter Segel Digital (Ed25519 & SHA-256)
                  </span>
                  <span className="text-[11px] font-mono text-emerald-700 font-semibold bg-emerald-100 px-2 py-0.5 rounded-full">
                    {claim.seal.keyId}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  <div className="p-2.5 rounded-lg bg-white border border-slate-200">
                    <span className="text-[10px] text-slate-400 font-bold block">MERKLE ROOT HASH</span>
                    <span className="font-mono text-[11px] text-slate-800 break-all select-all font-semibold">
                      {claim.seal.merkleRoot}
                    </span>
                  </div>

                  <div className="p-2.5 rounded-lg bg-white border border-slate-200">
                    <span className="text-[10px] text-slate-400 font-bold block">PREVIOUS SEAL HASH (RANTAI)</span>
                    <span className="font-mono text-[11px] text-slate-800 break-all select-all font-semibold">
                      {claim.seal.prevSealHash}
                    </span>
                  </div>

                  <div className="p-2.5 rounded-lg bg-white border border-slate-200">
                    <span className="text-[10px] text-slate-400 font-bold block">SEAL HASH</span>
                    <span className="font-mono text-[11px] text-slate-800 break-all select-all font-semibold">
                      {claim.seal.sealHash}
                    </span>
                  </div>

                  <div className="p-2.5 rounded-lg bg-white border border-slate-200">
                    <span className="text-[10px] text-slate-400 font-bold block">ED25519 DIGITAL SIGNATURE</span>
                    <span className="font-mono text-[11px] text-slate-800 break-all select-all font-semibold">
                      {claim.seal.signature}
                    </span>
                  </div>
                </div>

                <p className="text-[11px] text-slate-500 italic">
                  *Waktu Penyegelan: {new Date(claim.seal.createdAt).toLocaleString("id-ID")} WIB
                </p>
              </div>

              {/* Merkle Leaf Tree Breakdown */}
              <div className="space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                    <GitBranch className="w-4 h-4 text-emerald-600" />
                    Struktur 5 Daun Hash Merkle (PRD Section 7.2)
                  </h4>
                  <span
                    className={`text-[11px] font-bold px-2.5 py-1 rounded-lg border flex items-center gap-1.5 ${
                      verificationResult.isValid
                        ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                        : "bg-rose-50 text-rose-700 border-rose-300"
                    }`}
                  >
                    {verificationResult.isValid ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Status: 5/5 Daun Cocok • Segel Utuh</span>
                      </>
                    ) : (
                      <>
                        <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
                        <span>Status: {verificationResult.tamperedLeaves.length} Daun Berubah • Segel Rusak</span>
                      </>
                    )}
                  </span>
                </div>

                <div className="space-y-2">
                  {claim.seal.leaves.map((leaf, index) => {
    const candidateLeaf = currentLeaves[index];
    const isLeafMatch = candidateLeaf && candidateLeaf.hash === leaf.hash;
    return <div
      key={leaf.id}
      className={`p-3 rounded-xl border transition-colors ${isLeafMatch ? "bg-white border-slate-200" : "bg-rose-50 border-rose-300"}`}
    >
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="font-bold text-slate-800 flex items-center gap-2">
                            <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center text-[10px] font-mono">
                              {index + 1}
                            </span>
                            {leaf.label}
                          </span>
                          <span
      className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${isLeafMatch ? "bg-emerald-100 text-emerald-800" : "bg-rose-600 text-white animate-pulse"}`}
    >
                            {isLeafMatch ? "Hash Cocok (Utuh)" : "Hash Berubah!"}
                          </span>
                        </div>

                        <div className={`${isLeafMatch ? "bg-slate-50" : "bg-white/90 border border-rose-200"} p-2 rounded-lg text-xs space-y-1.5`}>
                          <div className="flex items-center justify-between font-mono text-[11px] text-slate-600">
                            <span className="truncate pr-2">
                              {isLeafMatch ? `Hash: ${leaf.hash}` : `Hash Segel Vault: ${leaf.hash}`}
                            </span>
                            <button
      type="button"
      onClick={() => handleCopyHash(leaf.hash, leaf.id)}
      className="text-slate-400 hover:text-slate-700 p-1 rounded-sm"
    >
                              {copiedHash === leaf.id ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                            </button>
                          </div>
                          {leaf.dataSnippet && <p className="text-[11px] text-slate-500 truncate">
                              {isLeafMatch ? `Data: ${leaf.dataSnippet}` : `Data Asli Vault: ${leaf.dataSnippet}`}
                            </p>}
                          {!isLeafMatch && candidateLeaf && (
                            <div className="pt-1.5 border-t border-rose-100 space-y-0.5">
                              <p className="font-mono text-[11px] text-rose-700 font-semibold truncate">
                                Hash Salinan Diubah: {candidateLeaf.hash}
                              </p>
                              {candidateLeaf.dataSnippet && (
                                <p className="text-[11px] text-rose-600 font-medium truncate">
                                  Data Salinan Saat Ini: {candidateLeaf.dataSnippet}
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                      </div>;
  })}
                </div>
              </div>
            </div>}

          {
    /* TAB 3: TAMPER & INTEGRITY TESTING SIMULATOR */
  }
          {activeTab === "tamper_test" && <div className="space-y-4">
              <div className="p-4 rounded-xl bg-amber-50/80 border border-amber-200 text-xs text-amber-900 space-y-2">
                <div className="flex items-center gap-2 font-bold text-amber-800">
                  <ShieldAlert className="w-4 h-4 text-amber-700" />
                  <span>Simulator Pengujian Integritas & Tamper Faskes</span>
                </div>
                <p>
                  Sesuai PRD Bab 7.4 & 15: sistem VeriMed memverifikasi klaim dengan membandingkan salinan kerja yang diperlihatkan faskes (working copy) terhadap segel asli di vault.
                </p>
              </div>

              {/* Status Card & Real-Time Integrity Audit */}
              <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">
                      Status Integritas Salinan Kerja Saat Ini
                    </h4>
                    <p className="text-xs text-slate-500">
                      {claim.isTampered
                        ? "Salinan faskes ini sedang dalam status DIMODIFIKASI SEPIHAK (TAMPERED)"
                        : "Salinan faskes ini 100% IDENTIK & COCOK dengan segel asli vault"}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold ${
                        claim.isTampered
                          ? "bg-rose-600 text-white animate-pulse"
                          : "bg-emerald-100 text-emerald-800"
                      }`}
                    >
                      {claim.isTampered ? "RUSAK / DIMODIFIKASI" : "SEPARASI UTUH"}
                    </span>
                  </div>
                </div>

                {/* Audit Integritas Button & Trigger */}
                <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                  <div className="text-xs text-slate-600">
                    <span className="font-semibold text-slate-800">Uji Validasi Kriptografi:</span>{" "}
                    Verifikasi hash SHA-256 seluruh 5 daun salinan terhadap segel Ed25519 Vault.
                  </div>
                  <button
                    type="button"
                    onClick={handleRunIntegrityAudit}
                    disabled={isAuditing}
                    className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs transition-colors flex items-center justify-center gap-1.5 shrink-0 shadow-xs cursor-pointer"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isAuditing ? "animate-spin" : ""}`} />
                    <span>{isAuditing ? "Memeriksa Hash..." : "Jalankan Audit Integritas"}</span>
                  </button>
                </div>

                {/* Manual Audit Result Box */}
                {auditTestResult && (
                  <motion.div
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`p-3.5 rounded-xl border text-xs space-y-1.5 ${
                      auditTestResult.isValid
                        ? "bg-emerald-50 border-emerald-300 text-emerald-950"
                        : "bg-rose-50 border-rose-300 text-rose-950"
                    }`}
                  >
                    <div className="flex items-center gap-2 font-bold text-xs">
                      {auditTestResult.isValid ? (
                        <>
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                          <span>HASIL AUDIT KRIPTOGRAFIS: LULUS UJI (100% VALID & UTUH)</span>
                        </>
                      ) : (
                        <>
                          <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />
                          <span>HASIL AUDIT KRIPTOGRAFIS: GAGAL UJI (SEGEL RUSAK / MODIFIKASI TERDETEKSI)</span>
                        </>
                      )}
                    </div>
                    <p className="text-[11px] leading-relaxed">
                      {auditTestResult.isValid
                        ? "Merkle Root salinan cocok sempurna dengan Merkle Root di Vault. Seluruh 5 daun hash SHA-256 identik tanpa perubahan satu karakter pun."
                        : `Terdeteksi ${auditTestResult.tamperedLeaves.length} daun Merkle yang tidak cocok dengan segel Vault (${auditTestResult.tamperedLeaves.map((t) => t.label).join(", ")}). Salinan kerja ini terbukti telah dimanipulasi secara sepihak.`}
                    </p>
                  </motion.div>
                )}

                {/* AI Forensic Explanation Card when Tampered */}
                {claim.isTampered && (
                  <div className="p-4 rounded-xl bg-rose-50/70 border border-rose-200 text-rose-900 text-xs space-y-2.5">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-2 font-bold text-rose-800">
                        <Sparkles className="w-4 h-4 text-rose-600 shrink-0" />
                        <span>
                          Deteksi & Penjelasan Forensik AI{" "}
                          {liveAiData ? `(${liveAiData.model})` : ""}:
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={handleRunAiScan}
                        disabled={isAiScanning}
                        className="px-2.5 py-1 rounded-lg bg-white hover:bg-rose-100 text-rose-800 border border-rose-200 text-[11px] font-semibold flex items-center gap-1.5 cursor-pointer"
                      >
                        <RefreshCw className={`w-3 h-3 ${isAiScanning ? "animate-spin" : ""}`} />
                        <span>{isAiScanning ? "Menganalisis..." : "Analisis Ulang AI"}</span>
                      </button>
                    </div>
                    {isAiScanning ? (
                      <p className="text-slate-600 italic text-[11px]">
                        Sedang memanggil model AI untuk menganalisis perubahan daun Merkle...
                      </p>
                    ) : liveAiData ? (
                      <>
                        <p className="text-slate-700 leading-relaxed font-medium">
                          {liveAiData.reasoning.summary}
                        </p>
                        <div className="space-y-2 pt-1">
                          {(liveAiData.reasoning.details || []).map((d, i) => (
                            <div key={i} className="p-2.5 rounded-lg bg-white border border-rose-200/70">
                              <p className="font-bold text-slate-900 text-[11px]">{d.title}</p>
                              <p className="text-slate-600 mt-0.5 leading-relaxed text-[11px]">{d.text}</p>
                            </div>
                          ))}
                        </div>
                      </>
                    ) : (
                      <p className="text-amber-900 text-[11px]">
                        {aiError?.message || "Klik Analisis Ulang AI untuk memanggil penjelasan forensik dari model LLM."}
                      </p>
                    )}
                  </div>
                )}

                {/* Restore Button when Tampered */}
                {claim.isTampered && (
                  <div className="pt-2 border-t border-slate-100">
                    <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <p className="text-xs font-bold text-emerald-900">
                          Pulihkan Salinan ke Segel Asli Vault
                        </p>
                        <p className="text-[11px] text-emerald-700 mt-0.5">
                          Kembalikan data salinan faskes saat ini kembali ke data awal yang sah sesuai segel Vault (Tagihan: Rp 4.500.000).
                        </p>
                      </div>
                      <button
                        type="button"
                        data-tour="modal-btn-toggle-tamper"
                        onClick={() => onToggleTamper(claim.id, false)}
                        className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-colors flex items-center justify-center gap-1.5 shadow-sm cursor-pointer shrink-0"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Pulihkan Salinan ke Asli (Reset Tamper)</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Zona Demonstrasi Manipulasi / Tamper Injection */}
              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/90 shadow-2xs space-y-3">
                <div>
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                    <ShieldAlert className="w-4 h-4 text-amber-600" />
                    Zona Simulator Demonstrasi Kecurangan (Tamper Injection)
                  </h4>
                  <p className="text-xs text-slate-500 mt-1">
                    Gunakan tombol di bawah ini untuk sengaja <strong>MENYUNTIKKAN MANIPULASI / FRAUD</strong> pada salinan kerja faskes guna menguji bagaimana sistem deteksi kriptografi dan AI VeriMed langsung mendeteksi kecurangan secara real-time:
                  </p>
                </div>

                <div className="flex flex-wrap gap-2.5 pt-1">
                  <button
                    type="button"
                    onClick={() =>
                      onToggleTamper(
                        claim.id,
                        true,
                        claim._tamperedData
                          ? "Nilai rincian tagihan (Leaf #2) dimanipulasi dengan akomodasi VIP Rp 9.500.000 dan obat khusus Rp 5.000.000 (total tagihan membengkak jadi Rp 14.500.000)."
                          : "Nilai rincian tagihan (Leaf #2) dinaikkan +Rp 5.000.000 di salinan faskes setelah segel diterbitkan."
                      )
                    }
                    className="px-3.5 py-2.5 rounded-xl bg-white hover:bg-rose-50 text-rose-700 border border-rose-300 font-semibold text-xs transition-colors flex items-center gap-2 cursor-pointer shadow-2xs"
                  >
                    <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>
                      {claim.id === "CLM-004"
                        ? "⚡ Suntik Manipulasi: Mark-up Tagihan VIP (Rp 14.500.000)"
                        : "⚡ Suntik Manipulasi: Naikkan Tagihan (+Rp 5.000.000)"}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      onToggleTamper(
                        claim.id,
                        true,
                        "Teks resume klinis (Leaf #3) dimodifikasi untuk menghapus catatan kondisi fisik pasien."
                      )
                    }
                    className="px-3.5 py-2.5 rounded-xl bg-white hover:bg-amber-50 text-amber-800 border border-amber-300 font-semibold text-xs transition-colors flex items-center gap-2 cursor-pointer shadow-2xs"
                  >
                    <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>⚡ Suntik Manipulasi: Ubah Isi Teks Resume Klinis</span>
                  </button>
                </div>
              </div>
            </div>}

          {
    /* TAB 4: BILLING & MEDICAL RESUME */
  }
          {activeTab === "billing_resume" && <div className="space-y-4">
              {
    /* Medical Resume Box */
  }
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-emerald-600" />
                  Berkas Resume Klinis Pasien
                </h4>
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 leading-relaxed font-sans whitespace-pre-wrap">
                  {claim.resumeText}
                </div>
              </div>

              {
    /* Linked Lab Results from Vault */
  }
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <FlaskConical className="w-4 h-4 text-emerald-600" />
                  Rujukan Hasil Lab Tersegel di Vault ({claim.labRefs.length})
                </h4>

                {claim.labRefs.length === 0 ? <p className="text-xs text-slate-400 italic">
                    Tidak ada rujukan hasil lab yang diikat pada klaim ini.
                  </p> : <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {claim.labRefs.map((ref) => <div
    key={ref.labResultId}
    className="p-3 rounded-xl bg-white border border-slate-200 text-xs space-y-1"
  >
                        <div className="flex items-center justify-between font-semibold">
                          <span className="text-slate-800">{ref.testName}</span>
                          <span className="font-mono text-emerald-700 font-bold">
                            {ref.value} {ref.unit}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-400 font-mono truncate">
                          ID: {ref.labResultId} • Seal: {ref.labSealHash.slice(0, 16)}...
                        </p>
                      </div>)}
                  </div>}
              </div>

              {
    /* Billing Items Table */
  }
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Rincian Item Tagihan ({claim.items.length})
                </h4>

                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                      <tr>
                        <th className="py-2.5 px-3">Kode Item</th>
                        <th className="py-2.5 px-3">Deskripsi Tindakan / BMHP</th>
                        <th className="py-2.5 px-3 text-right">Tarif Tagih</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {claim.items.map((item) => <tr key={item.code} className="hover:bg-slate-50/50">
                          <td className="py-2 px-3 font-mono text-[11px] text-slate-600 font-bold">
                            {item.code}
                          </td>
                          <td className="py-2 px-3 text-slate-800">{item.description}</td>
                          <td className="py-2 px-3 text-right font-mono font-semibold text-slate-900">
                            Rp {item.amount.toLocaleString("id-ID")}
                          </td>
                        </tr>)}
                    </tbody>
                    <tfoot className="bg-slate-50 font-bold text-slate-900 border-t border-slate-200">
                      <tr>
                        <td colSpan={2} className="py-2.5 px-3 text-right">
                          Total Tagihan Tertera:
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono text-emerald-800">
                          Rp {claim.billedAmount.toLocaleString("id-ID")}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            </div>}

          {
    /* TAB 5: VERSIONS & AUDIT */
  }
          {activeTab === "versions" && <div className="space-y-4">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
                <span className="font-bold text-slate-800">
                  Status Versi: Versi {claim.currentVersion} (Immutable Append-Only)
                </span>
                <p className="text-slate-600">
                  Sesuai PRD Bab 6: setiap revisi klaim disimpan sebagai versi baru yang mengikat segel versi sebelumnya. Baris lama tidak dapat ditimpa atau dihapus.
                </p>
              </div>

              <div className="space-y-3">
                <div className="p-3.5 rounded-xl border border-emerald-200 bg-emerald-50/40 text-xs space-y-1">
                  <div className="flex items-center justify-between font-bold text-emerald-900">
                    <span>Versi {claim.currentVersion} (Aktif)</span>
                    <span className="text-[10px] font-mono text-emerald-700">
                      {claim.updatedAt}
                    </span>
                  </div>
                  <p className="text-slate-700">
                    Versi terkini yang diajukan ke antrian verifikator VeriMed.
                  </p>
                </div>

                {claim.currentVersion > 1 && <div className="p-3.5 rounded-xl border border-slate-200 bg-white text-xs space-y-1">
                    <div className="flex items-center justify-between font-bold text-slate-800">
                      <span>Versi 1 (Arsip Segel Awal)</span>
                      <span className="text-[10px] font-mono text-slate-400">
                        {claim.createdAt}
                      </span>
                    </div>
                    <p className="text-slate-600">
                      Pengajuan awal sebelum permintaan klarifikasi atau revisi berkas susulan.
                    </p>
                  </div>}
              </div>
            </div>}

          {
    /* TAB 6: CLARIFICATION & INQUIRY THREAD */
  }
          {activeTab === "clarification" && <div className="space-y-4">
              <div className="p-4 rounded-xl bg-blue-50/70 border border-blue-200 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <HelpCircle className="w-4 h-4 text-blue-700" />
                    <h4 className="text-xs font-bold text-blue-900 uppercase tracking-wider">
                      Jalur Komunikasi & Catatan Klarifikasi
                    </h4>
                  </div>
                  <span
    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${claim.status === "klarifikasi" ? "bg-blue-600 text-white" : "bg-slate-200 text-slate-700"}`}
  >
                    {claim.status === "klarifikasi" ? "Menunggu Tanggapan Faskes" : "Status: " + claim.status}
                  </span>
                </div>
                <p className="text-xs text-blue-800">
                  {isAdmin ? "Gunakan saluran ini untuk meminta penjelasan klinis, resume tambahan, atau perbaikan koding kepada pihak Faskes tanpa mengubah data lama." : "Pihak Faskes dapat membaca catatan telaah dari verifikator Admin dan mengirimkan berkas revisi sebagai versi baru yang mengikat segel lama."}
                </p>
              </div>

              {
    /* Messages Thread */
  }
              <div className="space-y-3">
                {!claim.clarificationHistory || claim.clarificationHistory.length === 0 ? <div className="p-6 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
                    <p className="text-xs font-medium text-slate-500">
                      Belum ada permintaan klarifikasi resmi untuk klaim ini.
                    </p>
                  </div> : claim.clarificationHistory.map((item) => <div
    key={item.id}
    className={`p-3.5 rounded-xl border text-xs space-y-1.5 ${item.senderRole === "admin" ? "bg-blue-50/50 border-blue-200 mr-4" : "bg-emerald-50/50 border-emerald-200 ml-4"}`}
  >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-800 flex items-center gap-1.5">
                          <span
    className={`w-2 h-2 rounded-full ${item.senderRole === "admin" ? "bg-blue-600" : "bg-emerald-600"}`}
  />
                          {item.senderName} ({item.senderRole === "admin" ? "Admin Verifikator" : "Fasilitas Kesehatan"})
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {new Date(item.timestamp || item.requestedAt || Date.now()).toLocaleString("id-ID")}
                        </span>
                      </div>
                      <p className="text-slate-700 leading-relaxed whitespace-pre-wrap">
                        {item.message}
                      </p>
                    </div>)}
              </div>

              {
    /* Faskes Action Prompt */
  }
              {!isAdmin && claim.status === "klarifikasi" && onOpenClarificationModal && <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div>
                    <h5 className="font-bold text-amber-900">Perlu Respons Klinis Faskes</h5>
                    <p className="text-amber-800 text-[11px] mt-0.5">
                      Klaim ini membutuhkan justifikasi atau perbaikan berkas. Kirim revisi untuk membentuk Versi {claim.currentVersion + 1}.
                    </p>
                  </div>
                  <button
    type="button"
    onClick={() => onOpenClarificationModal(claim)}
    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shrink-0 transition-colors shadow-xs"
  >
                    Buka Formulir Klarifikasi & Revisi
                  </button>
                </div>}
            </div>}
            </motion.div>
          </div>
        </motion.div>

        {
    /* Action Panel Footer */
  }
        {isAdmin ? <div className="p-4 sm:p-5 border-t border-slate-100 bg-slate-50/90 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="w-full sm:flex-1 flex items-center gap-2">
              <input
                type="text"
                value={reviewerNote}
                onChange={(e) => setReviewerNote(e.target.value)}
                placeholder="Catatan telaah medis atau pertanyaan klarifikasi untuk faskes..."
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-white"
              />
              <button
                type="button"
                onClick={handleDraftNoteWithAi}
                disabled={isDraftingNote}
                title="Susun otomatis kalimat catatan verifikator menggunakan AI"
                className="px-3 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-[#0E947A] border border-emerald-200 text-xs font-semibold flex items-center gap-1.5 shrink-0 transition-colors cursor-pointer"
              >
                <Sparkles className={`w-3.5 h-3.5 ${isDraftingNote ? "animate-spin" : ""}`} />
                <span className="hidden md:inline">{isDraftingNote ? "Menyusun..." : "Susun Catatan AI"}</span>
              </button>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <button
    type="button"
    onClick={() => handleAction("klarifikasi")}
    className="px-3.5 py-2 rounded-xl bg-blue-50 text-blue-800 border border-blue-200 hover:bg-blue-100 font-semibold text-xs transition-colors"
  >
                Minta Klarifikasi
              </button>

              <button
    type="button"
    onClick={() => handleAction("ditelaah")}
    className="px-3.5 py-2 rounded-xl bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100 font-semibold text-xs transition-colors"
  >
                Tandai Telaah
              </button>

              <button
    type="button"
    onClick={() => handleAction("disetujui")}
    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-all flex items-center gap-1.5"
  >
                <CheckCircle2 className="w-4 h-4" />
                <span>Setujui Klaim</span>
              </button>
            </div>
          </div> : <div className="p-4 border-t border-slate-100 bg-slate-50/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
            <div className="flex items-center gap-2">
              <span>
                Peran Anda: <strong>Fasilitas Kesehatan ({claim.facilityName})</strong>
              </span>
              <span className="text-slate-300">•</span>
              <span className="text-emerald-700 font-semibold">Mode Pengajuan & Respon Revisi</span>
            </div>
            <div className="flex items-center gap-2 self-end sm:self-auto">
              {claim.status === "klarifikasi" && onOpenClarificationModal && <button
    type="button"
    onClick={() => onOpenClarificationModal(claim)}
    className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold transition-colors"
  >
                  Tanggapi Klarifikasi
                </button>}
              <button
    onClick={onClose}
    className="px-4 py-1.5 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-800 font-semibold transition-colors"
  >
                Tutup
              </button>
            </div>
          </div>}
      </motion.div>
    </motion.div>;
};
export {
  ClaimDetailModal
};
