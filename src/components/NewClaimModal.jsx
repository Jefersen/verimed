import { useState } from "react";
import { motion } from "motion/react";
import {
  X,
  ShieldCheck,
  FileText,
  FlaskConical,
  GitBranch,
  Sparkles,
  Search,
  RefreshCw
} from "lucide-react";
import { CustomSelect } from "./CustomSelect";
import { buildClaimLeaves, createSeal } from "../utils/crypto";
import { evaluateClaimRules } from "../utils/rules";

const COMMON_INACBG = [
  { code: "D-4-10-I", name: "Demam Berdarah Dengue Ringan", defaultSev: 1, defaultAmount: 435e4, dxCode: "A91", dxName: "Dengue Hemorrhagic Fever", cmg: "CMG D — Hematologi & Imunologi" },
  { code: "G-4-14-III", name: "Stroke Iskemik Akut + Pencitraan MRI Brain 1.5T", defaultSev: 3, defaultAmount: 194e5, dxCode: "I63.9", dxName: "Cerebral Infarction (MRI Terkonfirmasi)", cmg: "CMG G — Sistem Saraf Pusat" },
  { code: "I-4-10-II", name: "Sindrom Koroner Akut (STEMI) + Echocardiography", defaultSev: 2, defaultAmount: 228e5, dxCode: "I21.9", dxName: "Acute Myocardial Infarction", cmg: "CMG I — Sistem Kardiovaskular" },
  { code: "G-1-10-III", name: "Bedah Craniotomy Tumor Otak + Navigasi MRI/CT", defaultSev: 3, defaultAmount: 385e5, dxCode: "D33.0", dxName: "Neoplasma Jinak Supratentorial Otak", cmg: "CMG G — Bedah Saraf Pusat" },
  { code: "J-4-16-II", name: "Pneumonia Berat + CT-Scan Thorax High-Res", defaultSev: 2, defaultAmount: 146e5, dxCode: "J18.9", dxName: "Pneumonia Berat Bilateral", cmg: "CMG J — Sistem Pernapasan" },
  { code: "D-4-10-II", name: "Anemia Berat Derajat Sedang-Tinggi", defaultSev: 2, defaultAmount: 89e5, dxCode: "D64.9", dxName: "Anemia Berat Gravis", cmg: "CMG D — Hematologi" },
  { code: "B-4-14-I", name: "Apendektomi Ringan (Paket Bedah)", defaultSev: 1, defaultAmount: 112e5, dxCode: "K35.8", dxName: "Apendisitis Akut Lainnya", cmg: "CMG K — Bedah Digestif" },
  { code: "W-4-10-I", name: "Seksio Sesarea Tanpa Penyulit", defaultSev: 1, defaultAmount: 135e5, dxCode: "O82.0", dxName: "Delivery by elective caesarean section", cmg: "CMG W — Obstetri & Ginekologi" },
  { code: "A-4-10-II", name: "Sepsis Berat Tanpa Ventilasi", defaultSev: 2, defaultAmount: 168e5, dxCode: "A41.9", dxName: "Sepsis, Tidak Terspesifikasi", cmg: "CMG A — Infeksi & Parasit Sistemik" }
];

// Basis Data AI Auto-Grouper INA-CBG sesuai Standar Permenkes No. 3 Tahun 2023 (JKN-BPJS)
const BPJS_AI_GROUPER_CATALOG = [
  {
    keywords: ["tifus", "tipes", "tifoid", "typhoid", "salmonella", "demam tifoid"],
    baseCode: "A-4-14",
    name: "Penyakit Infeksi Bakteri & Parasit Lainnya (Demam Tifoid)",
    dxCode: "A01.0",
    dxName: "Typhoid Fever (Infeksi Salmonella typhi)",
    cmg: "CMG A — Penyakit Infeksi & Parasit Sistemik",
    defaultSev: 1,
    tariffs: { 1: 4180000, 2: 5650000, 3: 7890000 },
    resume: "Pasien dirawat dengan demam step-ladder 5 hari, lidah kotor, nyeri abdomen, dan hasil uji Tubex TF positif (+6). Diberikan terapi antibiotik Seftriakson IV dan cairan rumatan."
  },
  {
    keywords: ["diabetes", "gula darah", "kencing manis", "hiperglikemia", "ketoasidosis", "dm tipe 2"],
    baseCode: "E-4-10",
    name: "Penyakit Diabetes Melitus & Gangguan Nutrisi/Metabolik",
    dxCode: "E11.9",
    dxName: "Type 2 Diabetes Mellitus without complications",
    cmg: "CMG E — Sistem Endokrin, Nutrisi & Metabolik",
    defaultSev: 2,
    tariffs: { 1: 4620000, 2: 6850000, 3: 10450000 },
    resume: "Pasien masuk dengan keluhan lemas, poliuria, dan kadar Gula Darah Sewaktu (GDS) 412 mg/dL. Dilakukan regulasi cepat insulin drip intravena dan koreksi elektrolit."
  },
  {
    keywords: ["asma", "sesak napas", "wheezing", "mengi", "bronkospasme", "ppok", "copd"],
    baseCode: "J-4-17",
    name: "Penyakit Paru Obstruktif Kronis & Asma Bronkial Akut",
    dxCode: "J45.9",
    dxName: "Asthma, Unspecified (Eksaserbasi Akut)",
    cmg: "CMG J — Sistem Pernapasan (Respirasi)",
    defaultSev: 1,
    tariffs: { 1: 4450000, 2: 6320000, 3: 9150000 },
    resume: "Pasien datang dengan sesak napas akut, wheezing ekspirasi bilateral, dan SpO2 91%. Diberikan nebulisasi bronkodilator berkala, oksigenasi nasal kanul, dan kortikosteroid sistemik."
  },
  {
    keywords: ["patah tulang", "fraktur", "orif", "kecelakaan", "tulang paha", "femur", "tibia", "ortopedi"],
    baseCode: "M-1-50",
    name: "Prosedur Jaringan Lunak & Fiksasi Interna Fraktur (ORIF)",
    dxCode: "S72.3",
    dxName: "Fracture of shaft of femur (Fraktur Diafisis Femur)",
    cmg: "CMG M — Sistem Muskuloskeletal & Jaringan Ikat (Prosedur Bedah)",
    defaultSev: 2,
    tariffs: { 1: 14800000, 2: 19650000, 3: 26400000 },
    resume: "Pasien mengalami deformitas dan nyeri hebat pasca-trauma. Rontgen menunjukkan fraktur komplit, telah dilakukan tindakan operasi Open Reduction Internal Fixation (ORIF) plate & screw."
  },
  {
    keywords: ["maag", "gastritis", "dispepsia", "asam lambung", "gerd", "tukak lambung", "muntah darah", "melena"],
    baseCode: "K-4-18",
    name: "Gastritis, Dispepsia Akut & Gangguan Sistem Pencernaan",
    dxCode: "K29.7",
    dxName: "Gastritis, Unspecified",
    cmg: "CMG K — Sistem Pencernaan (Digestif)",
    defaultSev: 1,
    tariffs: { 1: 3650000, 2: 5120000, 3: 7450000 },
    resume: "Pasien mengeluh nyeri ulu hati akut disertai mual muntah berulang sehingga tidak dapat makan per oral. Diberikan terapi Proton Pump Inhibitor (Omeprazole IV) dan antiemetik."
  },
  {
    keywords: ["diare", "mencret", "muntaber", "gastroenteritis", "ge", "dehidrasi"],
    baseCode: "K-4-17",
    name: "Nyeri Abdomen & Gastroenteritis Akut dengan Dehidrasi",
    dxCode: "A09",
    dxName: "Infectious Gastroenteritis and Colitis",
    cmg: "CMG K — Sistem Pencernaan (Digestif)",
    defaultSev: 1,
    tariffs: { 1: 3520000, 2: 4980000, 3: 6890000 },
    resume: "Pasien mengalami diare cair >8x/hari disertai tanda dehidrasi ringan-sedang. Dilakukan rehidrasi cairan Ringer Laktat intravena dan pemberian Zinc serta probiotik."
  },
  {
    keywords: ["ginjal", "cuci darah", "hemodialisa", "hemodialisis", "ckd", "gagal ginjal", "ureum"],
    baseCode: "N-4-10",
    name: "Gagal Ginjal Kronis (CKD Stage V) dengan Hemodialisis",
    dxCode: "N18.5",
    dxName: "Chronic Kidney Disease, Stage 5",
    cmg: "CMG N — Sistem Nefro-Urologi",
    defaultSev: 2,
    tariffs: { 1: 6450000, 2: 9250000, 3: 13800000 },
    resume: "Pasien CKD Stage V dengan overload cairan dan peningkatan ureum-kreatinin serum. Telah dilakukan tindakan hemodialisis reguler dan koreksi asidosis metabolik."
  },
  {
    keywords: ["batu ginjal", "batu saluran kemih", "kolik renal", "urs", "eswl", "urolitiasis", "isk"],
    baseCode: "N-4-12",
    name: "Batu Saluran Kemih / Infeksi Traktus Urinarius Atas",
    dxCode: "N20.0",
    dxName: "Calculus of Kidney (Nefrolitiasis)",
    cmg: "CMG N — Sistem Nefro-Urologi",
    defaultSev: 1,
    tariffs: { 1: 4850000, 2: 6750000, 3: 9400000 },
    resume: "Pasien masuk dengan nyeri kolik pinggang menjalar ke lipat paha dan hematuria mikroskopis. USG urologi menunjukkan nefrolitiasis, diberikan analgesik parenteral dan terapi ekspulsif."
  },
  {
    keywords: ["katarak", "mata", "phaco", "fakoemulsifikasi", "lensa mata", "glaukoma"],
    baseCode: "H-1-30",
    name: "Prosedur Lensa & Operasi Katarak (Phacoemulsification)",
    dxCode: "H25.9",
    dxName: "Senile Cataract, Unspecified",
    cmg: "CMG H — Mata & Adneksa",
    defaultSev: 1,
    tariffs: { 1: 7950000, 2: 10200000, 3: 13400000 },
    resume: "Pasien mengalami penurunan tajam penglihatan progresif (visus 1/60) akibat kekeruhan lensa matur. Telah dilakukan tindakan Phacoemulsification + pemasangan Intraocular Lens (IOL)."
  },
  {
    keywords: ["jantung", "gagal jantung", "chf", "hipertensi", "darah tinggi", "aritmia", "angina"],
    baseCode: "I-4-12",
    name: "Gagal Jantung Kongestif (CHF) & Krisis Hipertensi",
    dxCode: "I50.0",
    dxName: "Congestive Heart Failure",
    cmg: "CMG I — Sistem Kardiovaskular",
    defaultSev: 2,
    tariffs: { 1: 5850000, 2: 8650000, 3: 13200000 },
    resume: "Pasien masuk dengan sesak saat berbaring (ortopnea), edema tungkai bilateral, dan kardiomegali. Diberikan diuretik Furosemid IV, pemantauan balans cairan ketat, dan terapi ACE-inhibitor."
  },
  {
    keywords: ["tbc", "tuberkulosis", "tb paru", "batuk darah", "hemoptisis"],
    baseCode: "A-4-12",
    name: "Tuberkulosis Paru Aktif dengan Komplikasi Pernapasan",
    dxCode: "A15.0",
    dxName: "Tuberculosis of lung, confirmed by sputum microscopy",
    cmg: "CMG A — Penyakit Infeksi & Parasit Sistemik",
    defaultSev: 2,
    tariffs: { 1: 5250000, 2: 7450000, 3: 10900000 },
    resume: "Pasien dengan batuk kronis >3 minggu, penurunan berat badan, dan tes cepat molekuler (TCM) MTB terdeteksi. Dirawat di ruang isolasi untuk inisiasi OAT dan stabilisasi hemoptisis."
  }
];

function romanSeverity(sev) {
  if (sev === 3 || sev === 4) return "III";
  if (sev === 2) return "II";
  return "I";
}

function runBpjsAiGrouper(queryText, currentSev = 1) {
  const q = queryText.trim().toLowerCase();
  const rom = romanSeverity(currentSev);

  // Cari kecocokan di katalog penyakit BPJS
  for (const item of BPJS_AI_GROUPER_CATALOG) {
    if (item.keywords.some((kw) => q.includes(kw))) {
      const sevToUse = currentSev || item.defaultSev;
      const finalRom = romanSeverity(sevToUse);
      const code = `${item.baseCode}-${finalRom}`;
      const amount = item.tariffs[sevToUse] || item.tariffs[2] || item.tariffs[1];
      return {
        code,
        name: item.name,
        defaultSev: sevToUse,
        defaultAmount: amount,
        dxCode: item.dxCode,
        dxName: item.dxName,
        cmg: item.cmg,
        resume: item.resume,
        aiReason: `AI Grouper memetakan keluhan "${queryText}" ke ${item.cmg} dengan diagnosis ICD-10 ${item.dxCode} (${item.dxName}). Sesuai Permenkes No. 3/2023, kode paket INA-CBG yang berlaku adalah ${code} (Tarif Paket Rp ${amount.toLocaleString("id-ID")}).`
      };
    }
  }

  // Fallback cerdas untuk nama penyakit bebas apa pun yang diketik pengguna
  const cleanTitle = queryText.trim().replace(/\b\w/g, (c) => c.toUpperCase());
  const isSurgical =
    q.includes("operasi") || q.includes("bedah") || q.includes("eksisi") || q.includes("angkat");
  const baseCode = isSurgical ? "Z-1-20" : "Z-4-12";
  const code = `${baseCode}-${rom}`;
  const baseTariff = isSurgical ? 11500000 : 4850000;
  const mult = currentSev === 3 ? 1.65 : currentSev === 2 ? 1.3 : 1.0;
  const amount = Math.round((baseTariff * mult) / 10000) * 10000;

  return {
    code,
    name: `${ isSurgical ? "Paket Prosedur Bedah" : "Paket Rawat Inap Medis" } — ${cleanTitle}`,
    defaultSev: currentSev || 1,
    defaultAmount: amount,
    dxCode: isSurgical ? "Z98.8" : "R69",
    dxName: cleanTitle,
    cmg: isSurgical ? "CMG Z — Kelompok Prosedur Terklasifikasi" : "CMG Z — Kelompok Rawat Inap Medis",
    resume: `Pasien menjalani perawatan rawat inap atas indikasi medis ${cleanTitle}. Telah dilakukan pemeriksaan penunjang laboratorium, observasi tanda vital berkala, serta pemberian terapi farmakologis sesuai panduan praktik klinis rumah sakit.`,
    aiReason: `AI Grouper mengklasifikasikan "${cleanTitle}" ke dalam ${isSurgical ? "Kelompok Prosedur Bedah (Tipe 1)" : "Kelompok Rawat Inap Non-Bedah (Tipe 4)"} dengan kode paket INA-CBG ${code} dan standar tarif JKN Rp ${amount.toLocaleString("id-ID")}.`
  };
}
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
  const [inacbgList, setInacbgList] = useState(COMMON_INACBG);
  const [selectedInacbg, setSelectedInacbg] = useState(COMMON_INACBG[0].code);
  const [severity, setSeverity] = useState(1);
  const [billedAmount, setBilledAmount] = useState(435e4);
  const [primaryDxCode, setPrimaryDxCode] = useState("A91");
  const [primaryDxName, setPrimaryDxName] = useState("Dengue Hemorrhagic Fever");
  const [secondaryDxCode, setSecondaryDxCode] = useState("");
  const [secondaryDxName, setSecondaryDxName] = useState("");
  const [selectedLabIds, setSelectedLabIds] = useState([]);
  const [resumeText, setResumeText] = useState(
    "Pasien mengeluh demam tinggi disertai nyeri retro-orbital selama 3 hari. Dilakukan pemeriksaan laboratorium dan hidrasi cairan intravena ringer laktat. Pasien mengalami perbaikan klinis dan dipulangkan dalam kondisi stabil."
  );

  // AI Auto-Grouper BPJS state
  const [aiDiseaseQuery, setAiDiseaseQuery] = useState("");
  const [isAiGrouping, setIsAiGrouping] = useState(false);
  const [aiGroupingResult, setAiGroupingResult] = useState(null);

  const losDays = Math.max(
    1,
    Math.round(
      (new Date(dischargeDate).getTime() - new Date(admitDate).getTime()) / (24 * 3600 * 1e3)
    )
  );
  const handleInacbgChange = (code) => {
    setSelectedInacbg(code);
    const found = inacbgList.find((item) => item.code === code);
    if (found) {
      setSeverity(found.defaultSev);
      setBilledAmount(found.defaultAmount);
      setPrimaryDxCode(found.dxCode);
      setPrimaryDxName(found.dxName);
      if (found.resume) {
        setResumeText(found.resume);
      }
    }
  };

  const handleRunAiGrouper = (customQuery) => {
    const query = (typeof customQuery === "string" ? customQuery : aiDiseaseQuery).trim();
    if (!query) return;
    if (typeof customQuery === "string") {
      setAiDiseaseQuery(customQuery);
    }
    setIsAiGrouping(true);
    setTimeout(() => {
      const grouped = runBpjsAiGrouper(query, severity);
      setInacbgList((prev) => {
        const exists = prev.some((item) => item.code === grouped.code);
        return exists ? prev : [grouped, ...prev];
      });
      setSelectedInacbg(grouped.code);
      setSeverity(grouped.defaultSev);
      setBilledAmount(grouped.defaultAmount);
      setPrimaryDxCode(grouped.dxCode);
      setPrimaryDxName(grouped.dxName);
      setResumeText(grouped.resume);
      setAiGroupingResult(grouped);
      setIsAiGrouping(false);
    }, 380);
  };
  const handleAddLabRef = (labId) => {
    if (!labId) return;
    setSelectedLabIds((prev) => (prev.includes(labId) ? prev : [...prev, labId]));
  };

  const handleRemoveLabRef = (labId) => {
    setSelectedLabIds((prev) => prev.filter((id) => id !== labId));
  };

  const selectedLabs = selectedLabIds
    .map((id) => availableLabs.find((l) => l.id === id))
    .filter(Boolean);

  const labRefs = selectedLabs.map((labRef) => ({
    labResultId: labRef.id,
    labSealHash: labRef.payloadHash,
    testName: labRef.test,
    value: labRef.value,
    unit: labRef.unit
  }));
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
    const inacbgMeta = inacbgList.find((c) => c.code === selectedInacbg);
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
  const inacbgOptions = inacbgList.map((item) => ({
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
    data-tour="new-claim-modal"
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
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0 overflow-hidden">
          <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-4">
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
    /* AI Auto-Grouper BPJS (Permenkes No. 3/2023) */
  }
          <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2.5">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-[#0E947A] text-white flex items-center justify-center shrink-0">
                  <Sparkles className="w-3.5 h-3.5" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-900">
                    AI Auto-Grouper INA-CBG (Standar Permenkes No. 3/2023 BPJS)
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Ketik penyakit/tindakan apa saja — AI otomatis memetakan kode ICD-10, Kelompok CMG, dan Tarif Paket BPJS
                  </p>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-[#0E947A] border border-emerald-200">
                1.077 Kelompok Paket JKN
              </span>
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={aiDiseaseQuery}
                  onChange={(e) => setAiDiseaseQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleRunAiGrouper();
                    }
                  }}
                  placeholder="Ketik penyakit apa saja (misal: Tifus, Diabetes, Patah Tulang, Asma, Katarak, Gagal Ginjal...)"
                  className="w-full pl-8 pr-3 py-2 text-xs border border-slate-200 rounded-xl bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>

              <button
                type="button"
                onClick={() => handleRunAiGrouper()}
                disabled={isAiGrouping || !aiDiseaseQuery.trim()}
                className="px-4 py-2 rounded-xl bg-[#0E947A] hover:bg-[#0B7A64] disabled:opacity-50 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shrink-0"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isAiGrouping ? "animate-spin" : ""}`} />
                <span>{isAiGrouping ? "Memetakan..." : "Grouping AI BPJS"}</span>
              </button>
            </div>

            {/* Quick Disease Suggestion Chips */}
            <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
              <span className="text-[10px] font-semibold text-slate-400 mr-0.5">Contoh Cepat:</span>
              {[
                "Demam Tifoid / Tifus",
                "Diabetes Melitus",
                "Asma Bronkial",
                "Patah Tulang Paha (ORIF)",
                "Gagal Ginjal + Cuci Darah",
                "Operasi Katarak Mata",
                "Gastritis / Maag Akut"
              ].map((sample) => (
                <button
                  key={sample}
                  type="button"
                  onClick={() => handleRunAiGrouper(sample)}
                  className="px-2.5 py-1 rounded-lg bg-white hover:bg-emerald-50 text-slate-600 hover:text-[#0E947A] border border-slate-200/80 text-[10px] font-semibold transition-colors cursor-pointer"
                >
                  + {sample}
                </button>
              ))}
            </div>

            {/* AI Grouping Explanation Output */}
            {aiGroupingResult && (
              <div className="p-3 rounded-xl bg-white border border-emerald-200 text-xs space-y-1">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <span className="font-bold text-[#0E947A] flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Hasil Pemetaan AI Grouper BPJS:</span>
                  </span>
                  <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
                    {aiGroupingResult.cmg}
                  </span>
                </div>
                <p className="text-slate-600 leading-relaxed text-[11px]">
                  {aiGroupingResult.aiReason}
                </p>
              </div>
            )}
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
          <div className="pt-2 border-t border-slate-100 space-y-2.5">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <label className="block text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                <FlaskConical className="w-3.5 h-3.5 text-emerald-600" />
                <span>
                  Ikat Hasil Pemeriksaan dari Beberapa Mesin (Lab LIS / MRI / CT / Echo) — Leaf #4
                </span>
              </label>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-[#0E947A] border border-emerald-200">
                {selectedLabs.length} Hasil Mesin Terikat
              </span>
            </div>

            <CustomSelect
    value=""
    onChange={(val) => handleAddLabRef(String(val))}
    options={labOptions}
    placeholder="+ Pilih & Tambah Hasil Mesin Lab / Radiologi dari Vault..."
  />

            {selectedLabs.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                {selectedLabs.map((lab) => (
                  <div
                    key={lab.id}
                    className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/90 flex items-start justify-between gap-2"
                  >
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-900 truncate">
                        {lab.test}:{" "}
                        <span className="text-[#0E947A] font-mono">
                          {lab.value} {lab.unit}
                        </span>
                      </p>
                      <p className="text-[10px] text-slate-500 truncate mt-0.5">
                        {lab.sourceName} • <span className="font-mono">{lab.id}</span>
                      </p>
                      <p className="text-[10px] font-mono text-slate-400 truncate mt-0.5">
                        Segel: {lab.payloadHash.slice(0, 18)}...
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveLabRef(lab.id)}
                      className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer shrink-0"
                      title="Lepas hasil lab ini"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
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
          </div>

          {
    /* Pinned Footer Submit Bar (Always Visible at Bottom of Modal) */
  }
          <div className="px-5 sm:px-6 py-3.5 border-t border-slate-100 bg-slate-50/80 flex items-center justify-end gap-3 shrink-0">
            <button
    type="button"
    onClick={onClose}
    className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
  >
              Batal
            </button>

            <button
    type="submit"
    data-tour="btn-submit-new-claim"
    className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm shadow-emerald-200 transition-all flex items-center gap-2 cursor-pointer"
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
