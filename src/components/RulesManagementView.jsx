import { ShieldCheck } from "lucide-react";
const RulesManagementView = () => {
  const rules = [
    {
      id: "U1",
      type: "upcoding",
      name: "Anemia Berat Tanpa Dukungan Lab & Terapi",
      weight: 40,
      description: "Diagnosis mengklaim anemia berat, namun Hb dari vault melebihi ambang (>8.0 g/dL) dan tidak ada transfusi darah tercatat.",
      clinicalRef: "Panduan Praktik Klinis (PPK) Tata Laksana Anemia & Permenkes No. 26/2021",
      status: "Aktif"
    },
    {
      id: "U2",
      type: "upcoding",
      name: "Sepsis / Infeksi Berat Tanpa Penanda Klinis & Antibiotik",
      weight: 40,
      description: "Diagnosis sepsis, namun hitung leukosit/penanda infeksi normal dan tidak ada catatan pemberian antibiotik definitif.",
      clinicalRef: "Surviving Sepsis Campaign & Pedoman Nasional Pelayanan Kedokteran (PNPK) Sepsis",
      status: "Aktif"
    },
    {
      id: "U3",
      type: "upcoding",
      name: "Lama Rawat (LOS) Outlier Terhadap Peer INA-CBG",
      weight: 20,
      description: "Lama rawat aktual menyimpang jauh (>3 hari) dari rata-rata peer group INA-CBG tanpa catatan komplikasi bedah.",
      clinicalRef: "Model Prediksi Lama Rawat Nasional BPJS Kesehatan FKRTL 2024",
      status: "Aktif"
    },
    {
      id: "F-SEV2",
      type: "upcoding",
      name: "Tingkat Keparahan Severity 2+ Tanpa Diagnosis Sekunder",
      weight: 15,
      description: "Severity 2 atau lebih tanpa satupun diagnosis sekunder penyerta (ditemukan pada 5.53% kasus nasional).",
      clinicalRef: "Petunjuk Teknis Koding INA-CBG Kemenkes RI",
      status: "Aktif (Sinyal)"
    },
    {
      id: "B1",
      type: "unbundling",
      name: "Item Termasuk Paket Ditagih Terpisah",
      weight: 35,
      description: "Item BMHP atau tindakan yang sudah termasuk dalam paket tarif INA-CBG ditagihkan sebagai baris tagihan terpisah.",
      clinicalRef: "Permenkes No. 3 Tahun 2023 tentang Standar Tarif Pelayanan Kesehatan JKN",
      status: "Aktif"
    },
    {
      id: "B2",
      type: "unbundling",
      name: "Klaim Kunjungan Berimpit Pasien Sama (\u2264 7 Hari)",
      weight: 25,
      description: "Beberapa klaim pasien pseudonim sama di faskes yang sama dengan tanggal berimpit (potensi fragmentasi episode).",
      clinicalRef: "Pedoman Pencegahan Fragmentasi Episode Rawat Inap BPJS Kesehatan",
      status: "Aktif"
    },
    {
      id: "B3",
      type: "unbundling",
      name: "Intensitas Special Items Tinggi Terhadap Total Tagihan",
      weight: 20,
      description: "Intensitas special items (SA, SP, RR, SI, SD) menyimpang tinggi (>40% total tagihan) dibanding faskes sekelas.",
      clinicalRef: "Pedoman Pengajuan Special Procedure (SP) Permenkes No. 26/2021",
      status: "Aktif"
    },
    {
      id: "R-SEAL",
      type: "integritas",
      name: "Segel Kriptografis Tidak Cocok / Rusak",
      weight: 50,
      description: "Ketidakcocokan Merkle root atau daun hash berkas antara data working copy yang diperlihatkan dengan segel vault.",
      clinicalRef: "Pedoman Integritas Kriptografis VeriMed Bab 7.4 (Ed25519 & SHA-256 Merkle)",
      status: "Wajib (Kritis)"
    },
    {
      id: "R-AUDIT",
      type: "integritas",
      name: "Revisi Berkas Setelah Klarifikasi / Audit",
      weight: 15,
      description: "Menandai klaim yang mengalami revisi versi susulan untuk memastikan transparansi rekam jejak.",
      clinicalRef: "SOP Audit Klaim Susulan VeriMed v2.0",
      status: "Aktif"
    }
  ];
  return <div className="space-y-6">
      <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-900">
              Katalog Aturan Deteksi Rule Engine (Admin)
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Daftar aturan klinis (rules.yaml) untuk mendeteksi potensi upcoding, unbundling, dan pelanggaran integritas segel
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-xs overflow-hidden">
        <div className="divide-y divide-slate-100">
          {rules.map((rule) => <div key={rule.id} className="p-4 sm:p-5 hover:bg-slate-50/60 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-start gap-3.5">
                <span
    className={`w-12 h-9 rounded-xl flex items-center justify-center text-xs font-mono font-bold shrink-0 text-white ${rule.id === "R-SEAL" ? "bg-rose-600" : rule.type === "upcoding" ? "bg-amber-600" : "bg-blue-600"}`}
  >
                  {rule.id}
                </span>

                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-sm font-bold text-slate-900">{rule.name}</h3>
                    <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
                      {rule.type}
                    </span>
                    <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      {rule.status}
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 mt-1 max-w-2xl leading-relaxed">
                    {rule.description}
                  </p>

                  <p className="text-[11px] text-slate-400 mt-1">
                    Rujukan: <span className="text-slate-600">{rule.clinicalRef}</span>
                  </p>
                </div>
              </div>

              <div className="shrink-0 md:text-right pl-14 md:pl-0">
                <span className="text-[11px] text-slate-400 block">Bobot Skor Risiko</span>
                <span className="text-lg font-black text-slate-900 font-mono">
                  +{rule.weight} Poin
                </span>
              </div>
            </div>)}
        </div>
      </div>
    </div>;
};
export {
  RulesManagementView
};
