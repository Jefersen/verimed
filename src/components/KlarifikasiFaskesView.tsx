import React, { useState } from 'react';
import { Claim, User } from '../types';
import {
  MessageSquare,
  AlertTriangle,
  Send,
  FileCheck2,
  Building2,
  Calendar,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  History,
} from 'lucide-react';

interface KlarifikasiFaskesViewProps {
  claims: Claim[];
  currentUser: User;
  onSelectClaim: (claim: Claim) => void;
  onSubmitClarification?: (claimId: string, answerText: string, updatedItems?: any) => void;
  onSubmitRevision?: (claimId: string, revisionNote: string, updatedDiagnosis?: string, additionalNotes?: string) => void;
}

export const KlarifikasiFaskesView: React.FC<KlarifikasiFaskesViewProps> = ({
  claims,
  currentUser,
  onSelectClaim,
  onSubmitClarification,
  onSubmitRevision,
}) => {
  // Only filter claims belonging to this Faskes that need clarification
  const clarificationClaims = claims.filter(
    (c) => c.facilityId === currentUser.facilityId && c.status === 'klarifikasi'
  );

  const [activeClaimId, setActiveClaimId] = useState<string | null>(
    clarificationClaims[0]?.id || null
  );
  const [responseAnswer, setResponseAnswer] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const activeClaim = claims.find((c) => c.id === activeClaimId);

  const handleSubmitResponse = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeClaim || !responseAnswer.trim()) return;

    setIsSubmitting(true);
    if (onSubmitRevision) {
      onSubmitRevision(activeClaim.id, responseAnswer);
    } else if (onSubmitClarification) {
      onSubmitClarification(activeClaim.id, responseAnswer);
    }
    setResponseAnswer('');
    setIsSubmitting(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center">
            <MessageSquare className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-900">
              Permintaan Klarifikasi & Revisi Klaim
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Daftar klaim {currentUser.facilityName} yang memerlukan tanggapan faskes atau revisi berkas klaim
            </p>
          </div>
        </div>
      </div>

      {clarificationClaims.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-100 shadow-xs space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <h2 className="text-base font-bold text-slate-800">
            Tidak Ada Permintaan Klarifikasi
          </h2>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Semua klaim yang diajukan {currentUser.facilityName} tidak sedang menunggu konfirmasi lanjutan. Semua berkas berjalan lancar di antrean verifikator.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: List of Claims needing clarification */}
          <div className="space-y-3">
            <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider px-1">
              Klaim Butuh Tanggapan ({clarificationClaims.length})
            </h2>

            <div className="space-y-2.5">
              {clarificationClaims.map((claim) => (
                <div
                  key={claim.id}
                  onClick={() => {
                    setActiveClaimId(claim.id);
                    setResponseAnswer('');
                  }}
                  className={`p-4 rounded-xl border text-left cursor-pointer transition-all ${
                    activeClaimId === claim.id
                      ? 'bg-amber-50/70 border-amber-300 ring-1 ring-amber-400 shadow-xs'
                      : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-mono font-bold text-slate-900">
                      #{claim.claimNumber}
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                      V{claim.currentVersion}
                    </span>
                  </div>

                  <p className="text-xs font-bold text-slate-800 line-clamp-1">
                    {claim.primaryDiagnosis.name}
                  </p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Paket: {claim.inacbgCode} • Rp {claim.billedAmount.toLocaleString('id-ID')}
                  </p>

                  <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                    <span className="text-amber-800 font-medium">Permintaan verifikator</span>
                    <span className="text-slate-400">
                      {new Date(claim.updatedAt).toLocaleDateString('id-ID')}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right: Response / Clarification Workspace */}
          {activeClaim && (
            <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-xs p-5 sm:p-6 space-y-5">
              {/* Active claim header */}
              <div className="flex items-start justify-between border-b border-slate-100 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-sm text-slate-900">
                      #{activeClaim.claimNumber}
                    </span>
                    <span className="text-xs text-slate-400">•</span>
                    <span className="text-xs font-mono text-slate-500">
                      Pasien: {activeClaim.patientPseudoId}
                    </span>
                    <span className="px-2 py-0.2 rounded-md bg-amber-100 text-amber-800 text-[10px] font-bold">
                      Versi {activeClaim.currentVersion}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-slate-900 mt-1">
                    {activeClaim.primaryDiagnosis.name} ({activeClaim.inacbgCode})
                  </h3>
                </div>

                <button
                  onClick={() => onSelectClaim(activeClaim)}
                  className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200"
                >
                  Buka Rincian Berkas
                </button>
              </div>

              {/* Admin Clarification Request Note */}
              <div className="p-4 rounded-xl bg-amber-50/80 border border-amber-200 text-xs text-amber-950 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold flex items-center gap-1.5 text-amber-900">
                    <MessageSquare className="w-4 h-4 text-amber-700" />
                    Permintaan dari Verifikator BPJS / Admin:
                  </span>
                  <span className="text-[10px] text-amber-700 font-mono">
                    {new Date(activeClaim.updatedAt).toLocaleDateString('id-ID')} WIB
                  </span>
                </div>

                <div className="bg-white p-3 rounded-lg border border-amber-200/80 font-sans text-slate-800 text-xs leading-relaxed">
                  {activeClaim.clarifications?.[0]?.question ||
                    'Mohon konfirmasi kesesuaian tindakan dan rincian item tagihan terhadap ketentuan paket INA-CBG.'}
                </div>
              </div>

              {/* Response Form */}
              <form onSubmit={handleSubmitResponse} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Tanggapan / Penjelasan Medis Faskes:
                  </label>
                  <p className="text-[11px] text-slate-500 mb-2">
                    Berikan penjelasan tertulis. Tanggapan ini akan dicatat dan diterbitkan sebagai <strong>Versi {activeClaim.currentVersion + 1}</strong> bersegel baru tanpa menimpa versi sebelumnya.
                  </p>
                  <textarea
                    rows={4}
                    value={responseAnswer}
                    onChange={(e) => setResponseAnswer(e.target.value)}
                    required
                    placeholder="Contoh: Kami telah meninjau kembali rincian tindakan. Kasa hemostatik digunakan atas indikasi perdarahan fokal intra-operasi. Terlampir penjelasan tambahan pada resume..."
                    className="w-full px-3.5 py-2.5 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-white"
                  />
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1">
                  <div className="flex items-center justify-between font-bold text-slate-800">
                    <span className="flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-emerald-600" />
                      Integritas Versi Baru (V{activeClaim.currentVersion + 1})
                    </span>
                    <span className="text-[10px] text-emerald-700 font-mono">
                      Append-Only Chain
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Setelah dikirim, klaim berpindah kembali ke status <strong>Menunggu Verifikasi</strong> di antrean verifikator Admin dengan jejak audit revisi lengkap.
                  </p>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    disabled={isSubmitting || !responseAnswer.trim()}
                    className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs shadow-xs shadow-emerald-200 transition-all flex items-center gap-2"
                  >
                    <Send className="w-4 h-4" />
                    <span>Kirim Tanggapan & Buat Revisi V{activeClaim.currentVersion + 1}</span>
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
