import { ShieldCheck, Key, Mail, CheckCircle2 } from "lucide-react";
const ProfilFaskesView = ({ currentUser, claimsCount = 0 }) => {
  return <div className="space-y-6 max-w-4xl">
      <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-teal-600 text-white flex items-center justify-center font-bold">
            FK
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-900">
              Profil Fasilitas Kesehatan
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Informasi identitas institusi faskes dan sertifikat penandatanganan klaim digital
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-xs p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
            <span className="text-[10px] text-slate-400 font-bold uppercase">Nama Fasilitas</span>
            <p className="text-sm font-bold text-slate-900">{currentUser.facilityName}</p>
            <p className="text-slate-500">ID Faskes: <strong className="font-mono text-slate-700">{currentUser.facilityId}</strong></p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
            <span className="text-[10px] text-slate-400 font-bold uppercase">Penanggung Jawab / Koder</span>
            <p className="text-sm font-bold text-slate-900">{currentUser.name}</p>
            <p className="text-slate-500 flex items-center gap-1">
              <Mail className="w-3.5 h-3.5 text-slate-400" />
              <span>{currentUser.email}</span>
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
            <span className="text-[10px] text-slate-400 font-bold uppercase">Kode Kemitraan & Pairing Admin BPJS</span>
            <p className="text-sm font-bold text-emerald-700 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span className="font-mono">{currentUser.pairingCode || "BPJS-KC-JKT01"}</span>
            </p>
            <p className="text-slate-500">Terhubung ke Antrean Verifikator Cabang • <strong>{claimsCount} Klaim Tersegel</strong></p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
            <span className="text-[10px] text-slate-400 font-bold uppercase">Sertifikat LIS & Modalitas DICOM Level 2</span>
            <p className="text-sm font-bold text-slate-800 flex items-center gap-1.5 font-mono text-xs">
              <Key className="w-3.5 h-3.5 text-emerald-600" />
              <span>HMAC-SHA256 & DICOM TLS Registered</span>
            </p>
            <p className="text-[11px] text-slate-500">Terhubung: Sysmex XN-1000, Siemens MRI 1.5T, GE CT-Scan 128-Slice, Philips Echo</p>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-200 text-xs text-emerald-950 space-y-1">
          <p className="font-bold flex items-center gap-1.5 text-emerald-900">
            <ShieldCheck className="w-4 h-4 text-emerald-700" />
            Keamanan & Integritas Pengajuan (UU PDP & UU ITE)
          </p>
          <p className="leading-relaxed text-slate-700">
            Setiap pengajuan klaim dari {currentUser.facilityName} secara otomatis disegel menggunakan pohon Merkle dan rantai SHA-256. Faskes dapat memantau status keutuhan segel kapan saja pada menu <strong>Klaim Saya</strong>.
          </p>
        </div>
      </div>
    </div>;
};
export {
  ProfilFaskesView
};
