import React from 'react';
import { Claim, User, LabResult } from '../types';
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
  Calendar,
  MessageSquare,
  AlertTriangle,
} from 'lucide-react';
import { motion } from 'motion/react';

interface DashboardFaskesViewProps {
  claims: Claim[];
  currentUser: User;
  onOpenNewClaimModal: () => void;
  onSelectClaim: (claim: Claim) => void;
  onGoToKlarifikasi?: () => void;
  onGoToClarifications?: () => void;
  onGoToLab?: () => void;
  onGoToKlaimSaya?: () => void;
}

export const DashboardFaskesView: React.FC<DashboardFaskesViewProps> = ({
  claims,
  currentUser,
  onOpenNewClaimModal,
  onSelectClaim,
  onGoToKlarifikasi,
  onGoToClarifications,
  onGoToLab = () => {},
  onGoToKlaimSaya = () => {},
}) => {
  const handleClarification = onGoToClarifications || onGoToKlarifikasi || (() => {});
  // STRICT FILTER: Faskes only sees their own claims!
  const myClaims = claims.filter((c) => c.facilityId === currentUser.facilityId);

  const totalSubmitted = myClaims.length;
  const inProcessClaims = myClaims.filter(
    (c) => c.status === 'menunggu_verifikasi' || c.status === 'ditelaah'
  );
  const clarificationClaims = myClaims.filter((c) => c.status === 'klarifikasi');
  const approvedClaims = myClaims.filter((c) => c.status === 'disetujui');

  const totalBilled = myClaims.reduce((acc, c) => acc + c.billedAmount, 0);

  // Recent claims submitted by this hospital
  const recentClaims = [...myClaims].slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Welcome Banner for Faskes */}
      <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 rounded-2xl p-6 sm:p-7 text-white shadow-lg shadow-emerald-200/50 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-emerald-50 text-xs font-medium mb-3">
            <Building2 className="w-4 h-4 text-emerald-200" />
            <span>Fasilitas Kesehatan Mitra JKN</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Selamat Datang, {currentUser.name}
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-emerald-100 max-w-2xl leading-relaxed">
            Portal Pengajuan Klaim {currentUser.facilityName}. Kelola berkas klaim pelayanan, pantau progres telaah verifikator, dan tindak lanjuti permintaan klarifikasi dokumen.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <button
            onClick={onOpenNewClaimModal}
            className="px-4 py-2.5 rounded-xl bg-white text-emerald-800 hover:bg-emerald-50 font-bold text-xs shadow-md transition-all flex items-center gap-2 group"
          >
            <PlusCircle className="w-4 h-4 text-emerald-600 group-hover:rotate-90 transition-transform" />
            <span>Ajukan Klaim Baru</span>
          </button>

          <button
            onClick={onGoToLab}
            className="px-4 py-2.5 rounded-xl bg-white/20 hover:bg-white/30 backdrop-blur-md text-white font-semibold text-xs border border-white/30 transition-all flex items-center gap-2"
          >
            <FlaskConical className="w-4 h-4" />
            <span>Kirim Hasil Lab LIS</span>
          </button>
        </div>
      </div>

      {/* Urgent Clarification Action Banner */}
      {clarificationClaims.length > 0 && (
        <div className="p-4 sm:p-5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-amber-950">
                  Tindakan Diperlukan: {clarificationClaims.length} Klaim Membutuhkan Klarifikasi
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-200 text-amber-900">
                  Permintaan Admin
                </span>
              </div>
              <p className="text-xs text-amber-800 mt-0.5">
                Verifikator mengajukan pertanyaan atau meminta konfirmasi item klaim. Segera berikan tanggapan atau ajukan versi revisi.
              </p>
            </div>
          </div>

          <button
            onClick={handleClarification}
            className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs transition-colors shrink-0 flex items-center gap-1.5 shadow-2xs self-start sm:self-auto"
          >
            <span>Buka Daftar Klarifikasi</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Faskes Operational Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Total Submitted */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Total Klaim Diajukan
            </span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <FileText className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900 mt-2">{totalSubmitted}</p>
          <p className="text-[11px] text-slate-500 mt-1">
            Nilai Billed: <strong className="text-slate-800">Rp {totalBilled.toLocaleString('id-ID')}</strong>
          </p>
        </div>

        {/* Metric 2: In Process */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Sedang Diproses
            </span>
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-black text-blue-600 mt-2">{inProcessClaims.length}</p>
          <p className="text-[11px] text-slate-500 mt-1">
            Dalam antrean verifikator BPJS
          </p>
        </div>

        {/* Metric 3: Clarification Needed */}
        <div className="bg-white p-5 rounded-2xl border border-amber-100 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Butuh Klarifikasi
            </span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <AlertCircle className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-black text-amber-600 mt-2">{clarificationClaims.length}</p>
          <p className="text-[11px] text-amber-700 font-medium mt-1">
            {clarificationClaims.length > 0 ? 'Menunggu tanggapan faskes' : 'Semua klaim tertangani'}
          </p>
        </div>

        {/* Metric 4: Approved */}
        <div className="bg-white p-5 rounded-2xl border border-emerald-100 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Selesai / Disetujui
            </span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-black text-emerald-600 mt-2">{approvedClaims.length}</p>
          <p className="text-[11px] text-emerald-700 font-medium mt-1">
            Telah lolos verifikasi
          </p>
        </div>
      </div>

      {/* Recent Submissions by this Hospital */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Riwayat Pengajuan Klaim {currentUser.facilityName}
            </h2>
            <p className="text-xs text-slate-500">
              Daftar pengajuan klaim terbaru dengan status verifikasi & integritas segel
            </p>
          </div>

          <button
            onClick={onGoToKlaimSaya}
            className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
          >
            <span>Lihat Semua Klaim Saya</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="divide-y divide-slate-100">
          {recentClaims.map((claim) => (
            <div
              key={claim.id}
              onClick={() => onSelectClaim(claim)}
              className="p-4 sm:p-5 hover:bg-slate-50/70 transition-colors cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4 group"
            >
              <div className="flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-xs shrink-0 font-mono">
                  V{claim.currentVersion}
                </div>

                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-bold text-slate-900 font-mono group-hover:text-emerald-700 transition-colors">
                      #{claim.claimNumber}
                    </span>
                    <span className="text-xs text-slate-400">•</span>
                    <span className="text-xs text-slate-500 font-mono">
                      Pasien: {claim.patientPseudoId}
                    </span>
                    <span className="px-2 py-0.2 rounded-md text-[10px] font-semibold bg-emerald-100 text-emerald-800 flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3 text-emerald-600" />
                      Segel Terverifikasi
                    </span>
                  </div>

                  <p className="text-xs font-bold text-slate-800 mt-1">
                    {claim.primaryDiagnosis.name}{' '}
                    <span className="text-slate-500 font-normal">
                      ({claim.inacbgCode} • Severity {claim.severity})
                    </span>
                  </p>

                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Lama Rawat: {claim.losDays} Hari • Diajukan: {new Date(claim.createdAt).toLocaleDateString('id-ID')}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between sm:justify-end gap-5 shrink-0 sm:text-right">
                <div>
                  <p className="text-xs font-bold text-slate-900">
                    Rp {claim.billedAmount.toLocaleString('id-ID')}
                  </p>
                  <span
                    className={`inline-block text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md mt-0.5 ${
                      claim.status === 'disetujui'
                        ? 'bg-emerald-100 text-emerald-800'
                        : claim.status === 'ditelaah'
                        ? 'bg-amber-100 text-amber-800'
                        : claim.status === 'klarifikasi'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {claim.status.replace('_', ' ')}
                  </span>
                </div>

                <div className="p-2 rounded-lg bg-slate-100 group-hover:bg-emerald-600 group-hover:text-white text-slate-600 transition-colors">
                  <ArrowRight className="w-4 h-4" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
