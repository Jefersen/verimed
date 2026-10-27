import { NATIONAL_INSIGHTS } from "../data/mockData";
import {
  Sparkles,
  ShieldCheck,
  Info,
  Layers,
  Zap,
  Activity
} from "lucide-react";
const NationalInsightsView = () => {
  const { metadata, summary, signals, mlEvaluation, scaleTest } = NATIONAL_INSIGHTS;
  return <div className="space-y-6">
      {
    /* Hero Banner */
  }
      <div className="bg-gradient-to-r from-emerald-700 via-teal-700 to-emerald-800 rounded-2xl p-6 sm:p-8 text-white shadow-lg shadow-emerald-200/50">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-emerald-100 text-xs font-semibold mb-3">
              <Sparkles className="w-3.5 h-3.5 text-emerald-300" />
              <span>Modul Analitik Pola Klaim Nasional (PRD Bab 20)</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Wawasan Data Sampel BPJS Kesehatan
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-emerald-100 max-w-2xl leading-relaxed">
              Hasil analitik pola klaim berbasis Machine Learning pada <strong>1.699.219 kunjungan</strong> FKRTL 2024. Menjadi dasar kalibrasi bobot aturan rule engine VeriMed untuk mendeteksi anomali tanpa bias tarif seragam.
            </p>
          </div>

          <div className="flex flex-col gap-2 shrink-0 bg-white/10 backdrop-blur-md p-4 rounded-xl border border-white/20 text-xs">
            <span className="font-bold text-emerald-200">Inventaris Data Terverifikasi:</span>
            <div className="flex justify-between gap-4">
              <span>Total Kunjungan:</span>
              <strong className="font-mono text-white">1.699.219</strong>
            </div>
            <div className="flex justify-between gap-4">
              <span>Pasien Unik (PSTV01):</span>
              <strong className="font-mono text-white">1.214.880</strong>
            </div>
            <div className="flex justify-between gap-4">
              <span>Fasilitas Terdaftar:</span>
              <strong className="font-mono text-white">2.842 Faskes</strong>
            </div>
          </div>
        </div>
      </div>

      {
    /* Mandatory PRD Disclaimer Banner */
  }
      <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-950 flex items-start gap-3">
        <Info className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold">Batasan Etis & Regulasi Panitia (PRD Bab 14 & 20.7):</span>{" "}
          {metadata.legalNotice}
        </div>
      </div>

      {
    /* Primary Aggregate Statistics */
  }
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {
    /* Card 1: Inpatient vs Outpatient */
  }
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs font-semibold text-slate-500 mb-2">
              <span>Jenis Perawatan (Rawat Inap vs Jalan)</span>
              <Layers className="w-4 h-4 text-emerald-600" />
            </div>

            <div className="space-y-3 mt-4">
              <div>
                <div className="flex justify-between text-xs font-bold mb-1">
                  <span className="text-slate-700">Rawat Jalan (RJTL)</span>
                  <span className="text-emerald-700">
                    {summary.outpatientVisits.toLocaleString("id-ID")} ({summary.outpatientPercent}%)
                  </span>
                </div>
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
    className="h-full bg-emerald-500 rounded-full"
    style={{ width: `${summary.outpatientPercent}%` }}
  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-bold mb-1">
                  <span className="text-slate-700">Rawat Inap (RITL)</span>
                  <span className="text-teal-700">
                    {summary.inpatientVisits.toLocaleString("id-ID")} ({summary.inpatientPercent}%)
                  </span>
                </div>
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
    className="h-full bg-teal-600 rounded-full"
    style={{ width: `${summary.inpatientPercent}%` }}
  />
                </div>
              </div>
            </div>
          </div>

          <p className="text-[11px] text-slate-500 mt-4 pt-3 border-t border-slate-100">
            Rata-rata Lama Rawat Inap (LOS): <strong>{summary.avgLosInpatient} Hari</strong>
          </p>
        </div>

        {
    /* Card 2: Severity Level Distribution */
  }
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs md:col-span-2">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500 mb-2">
            <span>Distribusi Tingkat Keparahan (Severity Level 1 - 4)</span>
            <Activity className="w-4 h-4 text-emerald-600" />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
            {summary.severityDistribution.map((sev) => <div key={sev.level} className="p-3 rounded-xl bg-slate-50 border border-slate-200/70">
                <span className="text-[11px] font-bold text-slate-700 block truncate">
                  {sev.level}
                </span>
                <p className="text-lg font-black text-slate-900 mt-1">
                  {sev.percent}%
                </p>
                <p className="text-[10px] text-slate-500 font-mono mt-0.5">
                  {sev.count.toLocaleString("id-ID")} kunjungan
                </p>
              </div>)}
          </div>

          <p className="text-[11px] text-slate-500 mt-3 italic">
            *Tingkat keparahan 2-4 membutuhkan verifikasi penanda komplikasi klinis objektif.
          </p>
        </div>
      </div>

      {
    /* Top 5 Sinyal Pola Nasional (PRD Section 20.3) */
  }
      <div className="bg-white rounded-2xl border border-slate-100 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              5 Sinyal Pola Klaim Terverifikasi pada Populasi Nasional
            </h2>
            <p className="text-xs text-slate-500">
              Sinyal statistik yang diintegrasikan ke dalam bobot evaluasi rule engine VeriMed
            </p>
          </div>
          <span className="text-xs text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-full font-semibold self-start sm:self-auto">
            Volume Terverifikasi
          </span>
        </div>

        <div className="divide-y divide-slate-100">
          {signals.map((sig, index) => <div key={sig.id} className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50/60 transition-colors">
              <div className="flex items-start gap-3.5">
                <span className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center text-xs font-bold shrink-0 font-mono">
                  #{index + 1}
                </span>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-xs sm:text-sm font-bold text-slate-900">
                      {sig.name}
                    </h3>
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-slate-100 text-slate-700">
                      {sig.id}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 mt-0.5 max-w-2xl">
                    {sig.description}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between md:justify-end gap-6 shrink-0 md:text-right pl-10 md:pl-0">
                <div>
                  <p className="text-base font-black text-slate-900 font-mono">
                    {sig.count.toLocaleString("id-ID")}
                  </p>
                  <p className="text-[11px] font-semibold text-emerald-700">
                    {sig.percent}% dari populasi
                  </p>
                </div>
                <span className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 text-slate-700 shrink-0">
                  {sig.status}
                </span>
              </div>
            </div>)}
        </div>
      </div>

      {
    /* ML Model Performance & Evaluation (PRD 20.4 & 20.5) */
  }
      <div className="bg-white rounded-2xl border border-slate-100 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100">
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-700 uppercase tracking-wider mb-1">
            <Zap className="w-4 h-4 text-emerald-600" />
            <span>Kinerja Model Machine Learning</span>
          </div>
          <h2 className="text-base font-bold text-slate-900">
            Evaluasi Model Terhadap Label Pendekatan Selisih Tagihan & Verifikasi
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Evaluasi berstrata per grup INA-CBG dan rawat inap (1.631 kasus positif label pendekatan). Dilaporkan apa adanya sesuai pedoman evaluasi.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Nama Model & Pendekatan</th>
                <th className="py-3 px-4">Fitur Masukan (Tanpa Bias Tarif)</th>
                <th className="py-3 px-4 text-center">Lift @ 100</th>
                <th className="py-3 px-4 text-center">Precision @ 100</th>
                <th className="py-3 px-4 text-center">Lift @ 1.000</th>
                <th className="py-3 px-4 text-center">Precision @ 1.000</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {mlEvaluation.models.map((m, idx) => <tr key={m.modelName} className={idx === 1 ? "bg-emerald-50/30" : "hover:bg-slate-50"}>
                  <td className="py-3.5 px-4 font-semibold text-slate-900">
                    <span className="block">{m.modelName}</span>
                    <span className="text-[10px] text-slate-400 font-normal">{m.type}</span>
                  </td>
                  <td className="py-3.5 px-4 text-slate-600 max-w-xs">{m.features}</td>
                  <td className="py-3.5 px-4 text-center font-bold font-mono text-emerald-700">
                    {m.liftAt100}
                  </td>
                  <td className="py-3.5 px-4 text-center font-bold font-mono text-slate-800">
                    {m.precisionAt100}
                  </td>
                  <td className="py-3.5 px-4 text-center font-mono text-emerald-700">
                    {m.liftAt1000}
                  </td>
                  <td className="py-3.5 px-4 text-center font-mono text-slate-800">
                    {m.precisionAt1000}
                  </td>
                </tr>)}
            </tbody>
          </table>
        </div>
      </div>

      {
    /* Cryptographic Sealing Scale Test Benchmark (PRD 2. & 20.6) */
  }
      <div className="bg-gradient-to-br from-white to-emerald-50/50 p-6 rounded-2xl border border-emerald-200/80 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-600" />
            <h2 className="text-base font-bold text-slate-900">
              Uji Skala Penyegelan Kriptografis (Scale Test Benchmark)
            </h2>
          </div>
          <span className="text-xs font-semibold text-emerald-800 bg-emerald-100 px-2.5 py-1 rounded-full">
            Kesiapan Skala Produksi
          </span>
        </div>

        <p className="text-xs text-slate-600 leading-relaxed">
          Pengujian kapasitas throughput penyegelan Merkle tree dan tanda tangan digital Ed25519 pada 50.000 hingga 100.000 klaim sintetis. Menjamin tidak ada hambatan performa saat diimplementasikan pada jutaan klaim BPJS.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
          {scaleTest.benchmarks.map((bench) => <div key={bench.volume} className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs space-y-2 text-xs">
              <span className="font-bold text-slate-900 text-sm block">
                {bench.volume}
              </span>
              <div className="flex justify-between text-slate-600">
                <span>Waktu Total:</span>
                <strong className="font-mono text-slate-900">{bench.totalTimeSeconds} Detik</strong>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Latensi per 1.000 Klaim:</span>
                <strong className="font-mono text-emerald-700 font-bold">{bench.timePerThousandMs} ms</strong>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Waktu Verifikasi Segel:</span>
                <strong className="font-mono text-emerald-700 font-bold">{bench.avgVerificationTimeMs} ms / klaim</strong>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Deteksi Perubahan (Tamper Rate):</span>
                <strong className="font-mono text-emerald-700 font-bold">{bench.tamperDetectionRate}</strong>
              </div>
            </div>)}
        </div>
      </div>
    </div>;
};
export {
  NationalInsightsView
};
