import React, { useState, useRef, useEffect, useLayoutEffect } from 'react';
import { Claim, User, MerkleLeaf, ClarificationMessage } from '../types';
import {
  X,
  ShieldCheck,
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  FileText,
  FlaskConical,
  GitBranch,
  FileCheck,
  Send,
  Sparkles,
  Info,
  Clock,
  History,
  Building2,
  Calendar,
  Layers,
  HelpCircle,
  Copy,
  Check,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { buildClaimLeaves, verifySealLeaves } from '../utils/crypto';

interface ClaimDetailModalProps {
  claim: Claim;
  currentUser: User;
  onClose: () => void;
  onUpdateStatus: (claimId: string, newStatus: Claim['status'], note: string) => void;
  onToggleTamper: (claimId: string, shouldTamper: boolean, reason?: string) => void;
  onRequestClarification?: (claimId: string, message: string) => void;
  onOpenClarificationModal?: (claim: Claim) => void;
}

export const ClaimDetailModal: React.FC<ClaimDetailModalProps> = ({
  claim,
  currentUser,
  onClose,
  onUpdateStatus,
  onToggleTamper,
  onRequestClarification,
  onOpenClarificationModal,
}) => {
  const isAdmin = currentUser.role === 'admin';
  const [activeTab, setActiveTab] = useState<
    'rules' | 'merkle' | 'tamper_test' | 'billing_resume' | 'versions' | 'clarification'
  >(isAdmin ? 'rules' : 'billing_resume');
  const [reviewerNote, setReviewerNote] = useState('');
  const [clarificationText, setClarificationText] = useState('');
  const [copiedHash, setCopiedHash] = useState<string | null>(null);

  const contentInnerRef = useRef<HTMLDivElement>(null);
  const [contentHeight, setContentHeight] = useState<number | 'auto'>('auto');
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
    window.addEventListener('resize', measureAndSetHeight);
    return () => window.removeEventListener('resize', measureAndSetHeight);
  }, []);

  // Live recalculate leaves against current claim state
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
    version: claim.currentVersion,
  });

  const verificationResult = verifySealLeaves(claim.seal, currentLeaves);

  const handleCopyHash = (text: string, id: string) => {
    navigator.clipboard?.writeText(text);
    setCopiedHash(id);
    setTimeout(() => setCopiedHash(null), 2000);
  };

  const handleAction = (status: Claim['status']) => {
    onUpdateStatus(claim.id, status, reviewerNote || `Keputusan verifikator: ${status.replace('_', ' ')}.`);
    setReviewerNote('');
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.22, ease: 'easeOut' }}
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex justify-center items-start p-3 sm:p-5 py-6 sm:py-10"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 14 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.94, y: 14 }}
        transition={{ type: 'spring', damping: 28, stiffness: 360, mass: 0.85 }}
        className="bg-white w-full max-w-4xl rounded-3xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col"
      >
        {/* Modal Header */}
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

              {/* Status Badge */}
              <span
                className={`text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
                  claim.status === 'disetujui'
                    ? 'bg-emerald-100 text-emerald-800'
                    : claim.status === 'ditelaah'
                    ? 'bg-amber-100 text-amber-800'
                    : claim.status === 'klarifikasi'
                    ? 'bg-blue-100 text-blue-800'
                    : 'bg-slate-200 text-slate-700'
                }`}
              >
                {claim.status.replace('_', ' ')}
              </span>

              {claim.fastTrack && (
                <span className="text-[11px] font-bold bg-emerald-500 text-white px-2 py-0.5 rounded-full">
                  Fast-Track
                </span>
              )}
            </div>

            <h2 className="text-lg font-bold text-slate-900 mt-1">
              {claim.primaryDiagnosis.name}{' '}
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
                Tagihan: <strong className="text-emerald-700 font-bold">Rp {claim.billedAmount.toLocaleString('id-ID')}</strong>
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Navigation Tabs - Segmented Pill Slider */}
        <div className="px-5 sm:px-6 py-2.5 bg-slate-50/70 border-b border-slate-100 overflow-x-auto scrollbar-none">
          <div className="flex items-center gap-1 bg-slate-200/60 p-1 rounded-2xl w-max min-w-full sm:min-w-0">
            {(isAdmin
              ? [
                  { id: 'rules', label: 'Hasil Rule Engine & AI', icon: AlertTriangle, count: claim.findings.length },
                  { id: 'merkle', label: 'Segel Kriptografis & Merkle', icon: GitBranch },
                  { id: 'tamper_test', label: 'Uji Tamper & Integritas', icon: ShieldAlert, alert: claim.isTampered },
                  { id: 'billing_resume', label: 'Tagihan & Resume Medis', icon: FileText },
                  { id: 'clarification', label: 'Klarifikasi & Catatan', icon: HelpCircle, count: claim.clarificationHistory?.length || (claim.status === 'klarifikasi' ? 1 : 0) },
                  { id: 'versions', label: `Riwayat Versi (V${claim.currentVersion})`, icon: History },
                ]
              : [
                  { id: 'billing_resume', label: 'Tagihan & Resume Medis', icon: FileText },
                  { id: 'merkle', label: 'Integritas Segel Digital', icon: ShieldCheck },
                  { id: 'clarification', label: 'Catatan & Permintaan Klarifikasi', icon: HelpCircle, alert: claim.status === 'klarifikasi', count: claim.clarificationHistory?.length || (claim.status === 'klarifikasi' ? 1 : 0) },
                  { id: 'versions', label: `Riwayat Versi (V${claim.currentVersion})`, icon: History },
                ]
            ).map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`relative py-2 px-3.5 rounded-xl text-xs font-semibold whitespace-nowrap flex items-center gap-2 transition-colors z-10 ${
                    isActive
                      ? 'text-emerald-950 font-bold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="activeModalTabIndicator"
                      className="absolute inset-0 bg-white rounded-xl shadow-xs border border-slate-200/80 -z-10"
                      transition={{ type: 'spring', stiffness: 420, damping: 35 }}
                    />
                  )}
                  <Icon className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-emerald-600' : 'text-slate-400'}`} />
                  <span>{tab.label}</span>
                  {tab.count !== undefined && tab.count > 0 && (
                    <span
                      className={`px-1.5 py-0.5 text-[10px] font-bold rounded-full ${
                        isActive
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-slate-200/90 text-slate-700'
                      }`}
                    >
                      {tab.count}
                    </span>
                  )}
                  {tab.alert && (
                    <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping shrink-0"></span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Tab Content Body with Smooth Height Animation (Memanjang & Memendek) */}
        <motion.div
          animate={contentHeight !== 'auto' ? { height: contentHeight } : { height: 'auto' }}
          transition={{
            height: isInitialMount.current
              ? { duration: 0 }
              : { duration: 0.38, ease: [0.16, 1, 0.3, 1] },
          }}
          onAnimationStart={() => setIsHeightAnimating(true)}
          onAnimationComplete={() => setIsHeightAnimating(false)}
          className={`bg-white transition-colors ${
            isHeightAnimating ? 'overflow-hidden' : 'overflow-y-auto'
          }`}
          style={{ maxHeight: 'calc(85vh - 190px)' }}
        >
          <div ref={contentInnerRef} className="p-5 sm:p-6 space-y-5">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="space-y-5"
            >
          {/* TAB 1: RULES & CLINICAL FINDINGS */}
          {activeTab === 'rules' && (
            <div className="space-y-4">
              {/* Risk Score Summary Banner */}
              <div
                className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                  claim.isTampered || claim.riskBand === 'Tinggi'
                    ? 'bg-rose-50/70 border-rose-200'
                    : claim.riskBand === 'Sedang'
                    ? 'bg-amber-50/70 border-amber-200'
                    : 'bg-emerald-50/70 border-emerald-200'
                }`}
              >
                <div className="flex items-center gap-3.5">
                  <div
                    className={`w-12 h-12 rounded-xl flex flex-col items-center justify-center font-bold text-center ${
                      claim.isTampered || claim.riskBand === 'Tinggi'
                        ? 'bg-rose-600 text-white'
                        : claim.riskBand === 'Sedang'
                        ? 'bg-amber-500 text-white'
                        : 'bg-emerald-600 text-white'
                    }`}
                  >
                    <span className="text-base leading-none">{claim.riskScore}</span>
                    <span className="text-[9px] uppercase tracking-tighter">Skor</span>
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">
                      Pita Risiko: {claim.riskBand}
                    </h3>
                    <p className="text-xs text-slate-600">
                      {claim.isTampered
                        ? 'Integritas berkas terganggu (R-SEAL). Segel tidak cocok dengan data awal.'
                        : claim.riskBand === 'Tinggi'
                        ? 'Ditemukan anomali signifikan yang memerlukan telaah mendalam sebelum klaim dapat diproses.'
                        : claim.riskBand === 'Sedang'
                        ? 'Ditemukan peringatan koding atau potensi ketidaksesuaian paket tindakan.'
                        : 'Semua aturan klinis terpenuhi dengan bukti objektif pendukung lengkap.'}
                    </p>
                  </div>
                </div>

                <div className="text-xs font-semibold shrink-0">
                  {claim.fastTrack ? (
                    <span className="px-3 py-1.5 rounded-lg bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      Lolos Fast-Track
                    </span>
                  ) : (
                    <span className="px-3 py-1.5 rounded-lg bg-white/80 text-slate-700 border border-slate-200 flex items-center gap-1.5">
                      <AlertTriangle className="w-4 h-4 text-amber-600" />
                      Memerlukan Verifikasi
                    </span>
                  )}
                </div>
              </div>

              {/* Findings List */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  Rincian Temuan Aturan ({claim.findings.length})
                </h4>

                {claim.findings.length === 0 ? (
                  <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
                    <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                    <p className="text-sm font-semibold text-slate-800">
                      Klaim Bersih Tanpa Temuan Pelanggaran
                    </p>
                    <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                      Klaim ini lolos semua pengecekan upcoding (U1-U3), unbundling (B1-B3), dan integritas segel (R-SEAL).
                    </p>
                  </div>
                ) : (
                  claim.findings.map((finding) => (
                    <div
                      key={finding.id}
                      className={`p-4 rounded-xl border text-left space-y-3 ${
                        finding.ruleId === 'R-SEAL'
                          ? 'bg-rose-50/50 border-rose-300'
                          : finding.type === 'upcoding'
                          ? 'bg-amber-50/40 border-amber-200'
                          : 'bg-blue-50/40 border-blue-200'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2 py-0.5 rounded-md text-xs font-mono font-bold ${
                              finding.ruleId === 'R-SEAL'
                                ? 'bg-rose-600 text-white'
                                : finding.type === 'upcoding'
                                ? 'bg-amber-600 text-white'
                                : 'bg-blue-600 text-white'
                            }`}
                          >
                            {finding.ruleId}
                          </span>
                          <h5 className="text-sm font-bold text-slate-900">
                            {finding.title}
                          </h5>
                        </div>
                        <span className="text-[11px] font-semibold text-slate-500 bg-white px-2 py-0.5 rounded-md border border-slate-200">
                          Bobot: {finding.weight}
                        </span>
                      </div>

                      <p className="text-xs text-slate-700 leading-relaxed">
                        {finding.description}
                      </p>

                      {/* Evidence Trail Box (PRD 11.3: Setiap temuan menyimpan jejak bukti) */}
                      <div className="p-3 rounded-lg bg-white border border-slate-200/90 space-y-2 text-xs">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                          Jejak Bukti Objektif (Evidence Trail)
                        </span>

                        {finding.evidence.vaultValue && (
                          <div className="flex items-start gap-2">
                            <span className="font-semibold text-emerald-800 min-w-[120px]">
                              Data Vault Tersegel:
                            </span>
                            <span className="text-slate-800 font-mono bg-emerald-50 px-1.5 py-0.2 rounded-sm border border-emerald-200">
                              {finding.evidence.vaultValue}
                            </span>
                          </div>
                        )}

                        {finding.evidence.claimedValue && (
                          <div className="flex items-start gap-2">
                            <span className="font-semibold text-amber-800 min-w-[120px]">
                              Klaim Ditagihkan:
                            </span>
                            <span className="text-slate-800 font-mono bg-amber-50 px-1.5 py-0.2 rounded-sm border border-amber-200">
                              {finding.evidence.claimedValue}
                            </span>
                          </div>
                        )}

                        {finding.evidence.quote && (
                          <div className="flex items-start gap-2">
                            <span className="font-semibold text-slate-600 min-w-[120px]">
                              Kutipan Teks Resume:
                            </span>
                            <span className="text-slate-700 italic bg-slate-50 px-1.5 py-0.2 rounded-sm border border-slate-200">
                              {finding.evidence.quote}
                            </span>
                          </div>
                        )}

                        <div className="flex items-start gap-2 pt-1 border-t border-slate-100 text-[11px]">
                          <span className="font-semibold text-slate-500 min-w-[120px]">
                            Rujukan Regulasi/Klinis:
                          </span>
                          <span className="text-slate-600">
                            {finding.evidence.clinicalRef}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* TAB 2: MERKLE TREE & CRYPTOGRAPHIC SEAL */}
          {activeTab === 'merkle' && (
            <div className="space-y-4">
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
                  *Waktu Penyegelan: {new Date(claim.seal.createdAt).toLocaleString('id-ID')} WIB
                </p>
              </div>

              {/* Merkle Leaf Tree Breakdown */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <GitBranch className="w-4 h-4 text-emerald-600" />
                  Struktur 5 Daun Hash Merkle (PRD Section 7.2)
                </h4>

                <div className="space-y-2">
                  {claim.seal.leaves.map((leaf, index) => {
                    const candidateLeaf = currentLeaves[index];
                    const isLeafMatch = candidateLeaf && candidateLeaf.hash === leaf.hash;
                    return (
                      <div
                        key={leaf.id}
                        className={`p-3 rounded-xl border transition-colors ${
                          isLeafMatch
                            ? 'bg-white border-slate-200'
                            : 'bg-rose-50 border-rose-300'
                        }`}
                      >
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="font-bold text-slate-800 flex items-center gap-2">
                            <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center text-[10px] font-mono">
                              {index + 1}
                            </span>
                            {leaf.label}
                          </span>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                              isLeafMatch
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-rose-600 text-white animate-pulse'
                            }`}
                          >
                            {isLeafMatch ? 'Hash Cocok (Utuh)' : 'Hash Berubah!'}
                          </span>
                        </div>

                        <div className="bg-slate-50 p-2 rounded-lg text-xs space-y-1">
                          <div className="flex items-center justify-between font-mono text-[11px] text-slate-600">
                            <span className="truncate pr-2">Hash: {leaf.hash}</span>
                            <button
                              type="button"
                              onClick={() => handleCopyHash(leaf.hash, leaf.id)}
                              className="text-slate-400 hover:text-slate-700 p-1 rounded-sm"
                            >
                              {copiedHash === leaf.id ? (
                                <Check className="w-3.5 h-3.5 text-emerald-600" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </div>
                          {leaf.dataSnippet && (
                            <p className="text-[11px] text-slate-500 truncate">
                              Data: {leaf.dataSnippet}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: TAMPER & INTEGRITY TESTING SIMULATOR */}
          {activeTab === 'tamper_test' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-amber-50/80 border border-amber-200 text-xs text-amber-900 space-y-2">
                <div className="flex items-center gap-2 font-bold text-amber-800">
                  <ShieldAlert className="w-4 h-4 text-amber-700" />
                  <span>Simulator Pengujian Integritas & Tamper Faskes</span>
                </div>
                <p>
                  Sesuai PRD Bab 7.4 & 15: sistem VeriMed memverifikasi klaim dengan membandingkan salinan kerja yang diperlihatkan (working copy) terhadap segel asli di vault.
                </p>
                <p className="text-[11px] text-amber-700">
                  Uji kemampuan deteksi real-time dengan mensimulasikan modifikasi sepihak pada salinan faskes:
                </p>
              </div>

              {/* Current Tamper State Card */}
              <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">
                      Status Integritas Salinan Kerja Faskes
                    </h4>
                    <p className="text-xs text-slate-500">
                      {claim.isTampered
                        ? 'Salinan faskes ini sedang dalam status DIMODIFIKASI / TAMPERED'
                        : 'Salinan faskes ini 100% IDENTIK dengan segel vault'}
                    </p>
                  </div>

                  <span
                    className={`px-3 py-1 rounded-full text-xs font-bold ${
                      claim.isTampered
                        ? 'bg-rose-600 text-white animate-pulse'
                        : 'bg-emerald-100 text-emerald-800'
                    }`}
                  >
                    {claim.isTampered ? 'RUSAK / BERUBAH' : 'SEPARASI UTUH'}
                  </span>
                </div>

                {claim.isTampered && (
                  <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs">
                    <p className="font-bold">Alasan Ketidakcocokan:</p>
                    <p className="mt-0.5">{claim.tamperReason}</p>
                  </div>
                )}

                <div className="pt-2 flex flex-wrap gap-2.5">
                  {!claim.isTampered ? (
                    <>
                      <button
                        type="button"
                        onClick={() =>
                          onToggleTamper(
                            claim.id,
                            true,
                            'Nilai rincian tagihan (Leaf #2) dinaikkan +Rp 5.000.000 di salinan faskes setelah segel diterbitkan.'
                          )
                        }
                        className="px-3.5 py-2 rounded-xl bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 font-semibold text-xs transition-colors flex items-center gap-1.5"
                      >
                        <ShieldAlert className="w-3.5 h-3.5" />
                        Simulasikan Tamper Nilai Tagihan
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          onToggleTamper(
                            claim.id,
                            true,
                            'Teks resume klinis (Leaf #3) dimodifikasi untuk menghapus catatan kondisi fisik pasien.'
                          )
                        }
                        className="px-3.5 py-2 rounded-xl bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100 font-semibold text-xs transition-colors flex items-center gap-1.5"
                      >
                        <ShieldAlert className="w-3.5 h-3.5" />
                        Simulasikan Tamper Teks Resume
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      onClick={() => onToggleTamper(claim.id, false)}
                      className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs transition-colors flex items-center gap-1.5 shadow-xs"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Pulihkan Salinan ke Segel Asli Vault (Reset Tamper)
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: BILLING & MEDICAL RESUME */}
          {activeTab === 'billing_resume' && (
            <div className="space-y-4">
              {/* Medical Resume Box */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-emerald-600" />
                  Berkas Resume Klinis Pasien
                </h4>
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 leading-relaxed font-sans whitespace-pre-wrap">
                  {claim.resumeText}
                </div>
              </div>

              {/* Linked Lab Results from Vault */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <FlaskConical className="w-4 h-4 text-emerald-600" />
                  Rujukan Hasil Lab Tersegel di Vault ({claim.labRefs.length})
                </h4>

                {claim.labRefs.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">
                    Tidak ada rujukan hasil lab yang diikat pada klaim ini.
                  </p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {claim.labRefs.map((ref) => (
                      <div
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
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Billing Items Table */}
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
                      {claim.items.map((item) => (
                        <tr key={item.code} className="hover:bg-slate-50/50">
                          <td className="py-2 px-3 font-mono text-[11px] text-slate-600 font-bold">
                            {item.code}
                          </td>
                          <td className="py-2 px-3 text-slate-800">{item.description}</td>
                          <td className="py-2 px-3 text-right font-mono font-semibold text-slate-900">
                            Rp {item.amount.toLocaleString('id-ID')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-slate-50 font-bold text-slate-900 border-t border-slate-200">
                      <tr>
                        <td colSpan={2} className="py-2.5 px-3 text-right">
                          Total Tagihan Tertera:
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono text-emerald-800">
                          Rp {claim.billedAmount.toLocaleString('id-ID')}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: VERSIONS & AUDIT */}
          {activeTab === 'versions' && (
            <div className="space-y-4">
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

                {claim.currentVersion > 1 && (
                  <div className="p-3.5 rounded-xl border border-slate-200 bg-white text-xs space-y-1">
                    <div className="flex items-center justify-between font-bold text-slate-800">
                      <span>Versi 1 (Arsip Segel Awal)</span>
                      <span className="text-[10px] font-mono text-slate-400">
                        {claim.createdAt}
                      </span>
                    </div>
                    <p className="text-slate-600">
                      Pengajuan awal sebelum permintaan klarifikasi atau revisi berkas susulan.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 6: CLARIFICATION & INQUIRY THREAD */}
          {activeTab === 'clarification' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-blue-50/70 border border-blue-200 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <HelpCircle className="w-4 h-4 text-blue-700" />
                    <h4 className="text-xs font-bold text-blue-900 uppercase tracking-wider">
                      Jalur Komunikasi & Catatan Klarifikasi
                    </h4>
                  </div>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      claim.status === 'klarifikasi'
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    {claim.status === 'klarifikasi' ? 'Menunggu Tanggapan Faskes' : 'Status: ' + claim.status}
                  </span>
                </div>
                <p className="text-xs text-blue-800">
                  {isAdmin
                    ? 'Gunakan saluran ini untuk meminta penjelasan klinis, resume tambahan, atau perbaikan koding kepada pihak Faskes tanpa mengubah data lama.'
                    : 'Pihak Faskes dapat membaca catatan telaah dari verifikator Admin dan mengirimkan berkas revisi sebagai versi baru yang mengikat segel lama.'}
                </p>
              </div>

              {/* Messages Thread */}
              <div className="space-y-3">
                {(!claim.clarificationHistory || claim.clarificationHistory.length === 0) ? (
                  <div className="p-6 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
                    <p className="text-xs font-medium text-slate-500">
                      Belum ada permintaan klarifikasi resmi untuk klaim ini.
                    </p>
                  </div>
                ) : (
                  claim.clarificationHistory.map((item) => (
                    <div
                      key={item.id}
                      className={`p-3.5 rounded-xl border text-xs space-y-1.5 ${
                        item.senderRole === 'admin'
                          ? 'bg-blue-50/50 border-blue-200 mr-4'
                          : 'bg-emerald-50/50 border-emerald-200 ml-4'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-800 flex items-center gap-1.5">
                          <span
                            className={`w-2 h-2 rounded-full ${
                              item.senderRole === 'admin' ? 'bg-blue-600' : 'bg-emerald-600'
                            }`}
                          />
                          {item.senderName} ({item.senderRole === 'admin' ? 'Admin Verifikator' : 'Fasilitas Kesehatan'})
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {new Date(item.timestamp || item.requestedAt || Date.now()).toLocaleString('id-ID')}
                        </span>
                      </div>
                      <p className="text-slate-700 leading-relaxed whitespace-pre-wrap">
                        {item.message}
                      </p>
                    </div>
                  ))
                )}
              </div>

              {/* Faskes Action Prompt */}
              {!isAdmin && claim.status === 'klarifikasi' && onOpenClarificationModal && (
                <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
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
                </div>
              )}
            </div>
          )}
            </motion.div>
          </div>
        </motion.div>

        {/* Action Panel Footer */}
        {isAdmin ? (
          <div className="p-4 sm:p-5 border-t border-slate-100 bg-slate-50/90 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="w-full sm:flex-1">
              <input
                type="text"
                value={reviewerNote}
                onChange={(e) => setReviewerNote(e.target.value)}
                placeholder="Catatan telaah medis atau pertanyaan klarifikasi untuk faskes..."
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-white"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <button
                type="button"
                onClick={() => handleAction('klarifikasi')}
                className="px-3.5 py-2 rounded-xl bg-blue-50 text-blue-800 border border-blue-200 hover:bg-blue-100 font-semibold text-xs transition-colors"
              >
                Minta Klarifikasi
              </button>

              <button
                type="button"
                onClick={() => handleAction('ditelaah')}
                className="px-3.5 py-2 rounded-xl bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100 font-semibold text-xs transition-colors"
              >
                Tandai Telaah
              </button>

              <button
                type="button"
                onClick={() => handleAction('disetujui')}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-all flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Setujui Klaim</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="p-4 border-t border-slate-100 bg-slate-50/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
            <div className="flex items-center gap-2">
              <span>
                Peran Anda: <strong>Fasilitas Kesehatan ({claim.facilityName})</strong>
              </span>
              <span className="text-slate-300">•</span>
              <span className="text-emerald-700 font-semibold">Mode Pengajuan & Respon Revisi</span>
            </div>
            <div className="flex items-center gap-2 self-end sm:self-auto">
              {claim.status === 'klarifikasi' && onOpenClarificationModal && (
                <button
                  type="button"
                  onClick={() => onOpenClarificationModal(claim)}
                  className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold transition-colors"
                >
                  Tanggapi Klarifikasi
                </button>
              )}
              <button
                onClick={onClose}
                className="px-4 py-1.5 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-800 font-semibold transition-colors"
              >
                Tutup
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
};
