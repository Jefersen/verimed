import { useState } from "react";
import { motion } from "motion/react";
import {
  X,
  ShieldCheck,
  FileText,
  FlaskConical,
  GitBranch
} from "lucide-react";
import { CustomSelect } from "./CustomSelect";
import { buildClaimLeaves, createSeal } from "../utils/crypto";
import { evaluateClaimRules } from "../utils/rules";
const COMMON_INACBG = [
  { code: "D-4-10-I", name: "Demam Berdarah Dengue Ringan", defaultSev: 1, defaultAmount: 435e4, dxCode: "A91", dxName: "Dengue Hemorrhagic Fever" },
  { code: "D-4-10-II", name: "Anemia Berat Derajat Sedang-Tinggi", defaultSev: 2, defaultAmount: 89e5, dxCode: "D64.9", dxName: "Anemia Berat Gravis" },
  { code: "B-4-14-I", name: "Apendektomi Ringan (Paket Bedah)", defaultSev: 1, defaultAmount: 112e5, dxCode: "K35.8", dxName: "Apendisitis Akut Lainnya" },
  { code: "W-4-10-I", name: "Seksio Sesarea Tanpa Penyulit", defaultSev: 1, defaultAmount: 135e5, dxCode: "O82.0", dxName: "Delivery by elective caesarean section" },
  { code: "A-4-10-II", name: "Sepsis Berat Tanpa Ventilasi", defaultSev: 2, defaultAmount: 168e5, dxCode: "A41.9", dxName: "Sepsis, Tidak Terspesifikasi" }
];
const NewClaimModal = ({
  currentUser,
  availableLabs,
  lastSealHash,
  onClose,
  onSubmit
}) => {
  const [encounterId, setEncounterId] = useState(`ENC-${Date.now().toString().slice(-4)}`);
  const [patientPseudoId, setPatientPseudoId] = useState(`PASIEN-${Math.floor(1e3 + Math.random() * 9e3)}`);
  const [admitDate, setAdmitDate] = useState("2026-10-20");
  const [dischargeDate, setDischargeDate] = useState("2026-10-23");
  const [selectedInacbg, setSelectedInacbg] = useState(COMMON_INACBG[0].code);
  const [severity, setSeverity] = useState(1);
  const [billedAmount, setBilledAmount] = useState(435e4);
  const [primaryDxCode, setPrimaryDxCode] = useState("A91");
  const [primaryDxName, setPrimaryDxName] = useState("Dengue Hemorrhagic Fever");
  const [secondaryDxCode, setSecondaryDxCode] = useState("");
  const [secondaryDxName, setSecondaryDxName] = useState("");
  const [selectedLabId, setSelectedLabId] = useState("");
  const [resumeText, setResumeText] = useState(
    "Pasien mengeluh demam tinggi disertai nyeri retro-orbital selama 3 hari. Dilakukan pemeriksaan laboratorium dan hidrasi cairan intravena ringer laktat. Pasien mengalami perbaikan klinis dan dipulangkan dalam kondisi stabil."
  );
  const losDays = Math.max(
    1,
    Math.round(
      (new Date(dischargeDate).getTime() - new Date(admitDate).getTime()) / (24 * 3600 * 1e3)
    )
  );
  const handleInacbgChange = (code) => {
    setSelectedInacbg(code);
    const found = COMMON_INACBG.find((item) => item.code === code);
    if (found) {
      setSeverity(found.defaultSev);
      setBilledAmount(found.defaultAmount);
      setPrimaryDxCode(found.dxCode);
      setPrimaryDxName(found.dxName);
    }
  };
  const labRef = availableLabs.find((l) => l.id === selectedLabId);
  const labRefs = labRef ? [
    {
      labResultId: labRef.id,
      labSealHash: labRef.payloadHash,
      testName: labRef.test,
      value: labRef.value,
      unit: labRef.unit
    }
  ] : [];
  const tempLeaves = buildClaimLeaves({
    encounterId,
    patientPseudoId,
    admitDate,
    dischargeDate,
    inacbgCode: selectedInacbg,
    severity,
    billedAmount,
    items: [{ code: "PAKET-INA", description: `Tarif Paket ${selectedInacbg}`, amount: billedAmount }],
    resumeText,
    labRefs,
    version: 1
  });
  const handleSubmit = (e) => {
    e.preventDefault();
    const claimId = `CLM-${Date.now().toString().slice(-4)}`;
    const claimNumber = `CLM-2026-${Date.now().toString().slice(-3)}`;
    const nowIso = (/* @__PURE__ */ new Date()).toISOString();
    const seal = createSeal({
      kind: "claim",
      refId: claimId,
      version: 1,
      leaves: tempLeaves,
      prevSealHash: lastSealHash,
      createdAt: nowIso
    });
    const secDx = secondaryDxCode ? [{ code: secondaryDxCode, name: secondaryDxName || "Diagnosis Sekunder" }] : [];
    const inacbgMeta = COMMON_INACBG.find((c) => c.code === selectedInacbg);
    const partialClaim = {
      id: claimId,
      claimNumber,
      facilityId: currentUser.facilityId || "FASKES-01",
      facilityName: currentUser.facilityName || "RS Siloam Sejahtera",
      encounterId,
      patientPseudoId,
      patientAge: 35,
      patientGender: "L",
      admitDate,
      dischargeDate,
      losDays,
      inacbgCode: selectedInacbg,
      inacbgDescription: inacbgMeta ? inacbgMeta.name : "Paket INA-CBG Rawat Inap",
      severity,
      billedAmount,
      primaryDiagnosis: {
        code: primaryDxCode,
        name: primaryDxName
      },
      secondaryDiagnoses: secDx,
      procedures: [],
      specialItems: [],
      items: [
        {
          code: "PAKET-INA",
          description: `Tarif Paket ${selectedInacbg} (Severity ${severity})`,
          amount: billedAmount
        }
      ],
      resumeText,
      currentVersion: 1,
      status: "menunggu_verifikasi",
      riskScore: 0,
      riskBand: "Rendah",
      fastTrack: true,
      findings: [],
      seal,
      labRefs,
      createdAt: nowIso,
      updatedAt: nowIso
    };
    const evalResult = evaluateClaimRules(partialClaim);
    const fullClaim = {
      ...partialClaim,
      findings: evalResult.findings,
      riskScore: evalResult.riskScore,
      riskBand: evalResult.riskBand,
      fastTrack: evalResult.fastTrack
    };
    onSubmit(fullClaim);
  };
  const inacbgOptions = COMMON_INACBG.map((item) => ({
    value: item.code,
    label: `${item.code} \u2014 ${item.name}`,
    description: `Tarif Billed Rp ${item.defaultAmount.toLocaleString("id-ID")} \u2022 Rekomendasi Sev ${item.defaultSev}`,
    badge: item.code,
    badgeColor: "bg-emerald-100 text-emerald-800 font-mono text-[10px]"
  }));
  const severityOptions = [
    {
      value: 1,
      label: "Severity 1 (Ringan)",
      description: "Kasus rawat inap standar tanpa komplikasi mayor",
      badge: "Tingkat 1",
      badgeColor: "bg-emerald-100 text-emerald-800"
    },
    {
      value: 2,
      label: "Severity 2 (Sedang)",
      description: "Kasus dengan manifestasi komorbiditas sedang",
      badge: "Tingkat 2",
      badgeColor: "bg-sky-100 text-sky-800"
    },
    {
      value: 3,
      label: "Severity 3 (Berat)",
      description: "Kasus kritis, komplikasi mayor berat, atau kegagalan organ",
      badge: "Tingkat 3",
      badgeColor: "bg-amber-100 text-amber-800"
    },
    {
      value: 4,
      label: "Severity 4 (Kritis)",
      description: "Perawatan intensif ICU/ICCU dengan pemantauan ketat",
      badge: "Tingkat 4",
      badgeColor: "bg-rose-100 text-rose-800"
    }
  ];
  const labOptions = [
    {
      value: "",
      label: "-- Tidak Mengaitkan Hasil Lab --",
      description: "Hasil pemeriksaan laboratorium tidak disertakan dalam segel"
    },
    ...availableLabs.map((lab) => ({
      value: lab.id,
      label: `${lab.test}: ${lab.value} ${lab.unit}`,
      description: `${lab.id} \u2022 ${lab.sourceName} \u2022 Segel: ${lab.payloadHash.slice(0, 14)}...`,
      badge: lab.isAbnormal ? "ABNORMAL" : "LIS-L2",
      badgeColor: lab.isAbnormal ? "bg-amber-100 text-amber-800 font-bold" : "bg-emerald-100 text-emerald-800 font-bold"
    }))
  ];
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
    layout
    initial={{ opacity: 0, scale: 0.94, y: 14 }}
    animate={{ opacity: 1, scale: 1, y: 0 }}
    exit={{ opacity: 0, scale: 0.94, y: 14 }}
    transition={{
      layout: { duration: 0.35, ease: [0.16, 1, 0.3, 1] },
      opacity: { duration: 0.2 },
      scale: { duration: 0.2 }
    }}
    className="bg-white w-full max-w-3xl rounded-3xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[88vh]"
  >
        {
    /* Header */
  }
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Pengajuan Klaim Tersegel Kriptografis Baru
              </h2>
              <p className="text-xs text-slate-500">
                Data akan otomatis dihitung ke 5 daun Merkle dan disegel dengan Ed25519
              </p>
            </div>
          </div>
          <button
    onClick={onClose}
    className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg"
  >
            <X className="w-5 h-5" />
          </button>
        </div>

        {
    /* Form Body */
  }
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                ID Kunjungan (Encounter ID)
              </label>
              <input
    type="text"
    value={encounterId}
    onChange={(e) => setEncounterId(e.target.value)}
    required
    className="w-full px-3 py-2 text-xs font-mono border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-white"
  />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                ID Pseudonim Pasien (UU PDP)
              </label>
              <input
    type="text"
    value={patientPseudoId}
    onChange={(e) => setPatientPseudoId(e.target.value)}
    required
    className="w-full px-3 py-2 text-xs font-mono border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-white"
  />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Tanggal Masuk (Admit Date)
              </label>
              <input
    type="date"
    value={admitDate}
    onChange={(e) => setAdmitDate(e.target.value)}
    required
    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-white"
  />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Tanggal Pulang (Discharge Date) • LOS: {losDays} Hari
              </label>
              <input
    type="date"
    value={dischargeDate}
    onChange={(e) => setDischargeDate(e.target.value)}
    required
    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-white"
  />
            </div>
          </div>

          {
    /* INA-CBG & Severity */
  }
          <div className="grid grid-cols-1 sm:grid-cols-5 gap-3.5 pt-2 border-t border-slate-100">
            <div className="sm:col-span-3">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Pilih Paket INA-CBG
              </label>
              <CustomSelect
    value={selectedInacbg}
    onChange={(val) => handleInacbgChange(String(val))}
    options={inacbgOptions}
    placeholder="Pilih Paket INA-CBG..."
  />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Tingkat Keparahan (Severity)
              </label>
              <CustomSelect
    value={severity}
    onChange={(val) => setSeverity(Number(val))}
    options={severityOptions}
    placeholder="Pilih Severity..."
  />
            </div>
          </div>

          {
    /* Diagnosis & Amount */
  }
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Kode Diagnosis Primer (ICD-10)
              </label>
              <input
    type="text"
    value={primaryDxCode}
    onChange={(e) => setPrimaryDxCode(e.target.value)}
    required
    className="w-full px-3 py-2 text-xs font-mono border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-white"
  />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nama Diagnosis Primer
              </label>
              <input
    type="text"
    value={primaryDxName}
    onChange={(e) => setPrimaryDxName(e.target.value)}
    required
    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-white"
  />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Tarif Billed Ditagihkan (Rp)
              </label>
              <input
    type="number"
    value={billedAmount}
    onChange={(e) => setBilledAmount(Number(e.target.value))}
    required
    className="w-full px-3 py-2 text-xs font-mono font-bold border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-white"
  />
            </div>
          </div>

          {
    /* Optional Secondary Dx */
  }
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                Diagnosis Sekunder (ICD-10) - Opsional
              </label>
              <input
    type="text"
    value={secondaryDxCode}
    onChange={(e) => setSecondaryDxCode(e.target.value)}
    placeholder="Contoh: R50.9 / K29.7"
    className="w-full px-3 py-2 text-xs font-mono border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-white"
  />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                Nama Diagnosis Sekunder
              </label>
              <input
    type="text"
    value={secondaryDxName}
    onChange={(e) => setSecondaryDxName(e.target.value)}
    placeholder="Demam Tidak Terspesifikasi"
    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-white"
  />
            </div>
          </div>

          {
    /* Link Lab Result from Vault */
  }
          <div className="pt-2 border-t border-slate-100">
            <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
              <FlaskConical className="w-3.5 h-3.5 text-emerald-600" />
              Ikat Hasil Lab dari Vault Tersegel (Level 2 LIS)
            </label>
            <CustomSelect
    value={selectedLabId}
    onChange={(val) => setSelectedLabId(String(val))}
    options={labOptions}
    placeholder="-- Pilih Hasil Lab Vault (Opsional) --"
  />
          </div>

          {
    /* Medical Resume Text */
  }
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-emerald-600" />
              Teks Resume Medis Pasien (Leaf #3)
            </label>
            <textarea
    rows={3}
    value={resumeText}
    onChange={(e) => setResumeText(e.target.value)}
    required
    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-white"
  />
          </div>

          {
    /* Live Preview of Merkle Sealing */
  }
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
            <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
              <GitBranch className="w-3.5 h-3.5 text-emerald-600" />
              Pratinjau Daun Merkle & Segel Kriptografis (Live Hashing)
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[10px]">
              {tempLeaves.slice(0, 4).map((l, i) => <div key={l.id} className="p-2 rounded-lg bg-white border border-slate-200 truncate">
                  <span className="font-bold text-slate-700">Daun #{i + 1}:</span>{" "}
                  <span className="font-mono text-slate-500">{l.hash.slice(0, 24)}...</span>
                </div>)}
            </div>
            <p className="text-[10px] text-emerald-700 italic font-mono truncate">
              Menghubungkan ke Prev Seal: {lastSealHash.slice(0, 32)}...
            </p>
          </div>

          {
    /* Submit button */
  }
          <div className="pt-2 flex items-center justify-end gap-3">
            <button
    type="button"
    onClick={onClose}
    className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
  >
              Batal
            </button>

            <button
    type="submit"
    className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm shadow-emerald-200 transition-all flex items-center gap-2"
  >
              <ShieldCheck className="w-4 h-4" />
              <span>Segel & Kirim Klaim ke Antrian Verifikator</span>
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>;
};
export {
  NewClaimModal
};
