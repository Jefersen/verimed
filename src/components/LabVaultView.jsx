import { useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "motion/react";
import {
  FlaskConical,
  ShieldCheck,
  PlusCircle,
  Lock,
  Send,
  Copy,
  Check,
  X,
  Cpu,
  Radio,
  RefreshCw
} from "lucide-react";
import { CustomSelect } from "./CustomSelect";
import { sha256Sync } from "../utils/crypto";
const COMMON_TESTS = [
  {
    name: "Hemoglobin (Hb)",
    unit: "g/dL",
    normalMin: 12,
    normalMax: 16,
    defaultVal: 11.4,
    deviceGroup: "hematology",
    isImaging: false
  },
  {
    name: "Hitung Leukosit (WBC)",
    unit: "/\xB5L",
    normalMin: 4e3,
    normalMax: 11e3,
    defaultVal: 7200,
    deviceGroup: "hematology",
    isImaging: false
  },
  {
    name: "Trombosit",
    unit: "/\xB5L",
    normalMin: 15e4,
    normalMax: 45e4,
    defaultVal: 78e3,
    deviceGroup: "hematology",
    isImaging: false
  },
  {
    name: "Ureum Darah",
    unit: "mg/dL",
    normalMin: 15,
    normalMax: 45,
    defaultVal: 142,
    deviceGroup: "chemistry",
    isImaging: false
  },
  {
    name: "Kreatinin Serum",
    unit: "mg/dL",
    normalMin: 0.6,
    normalMax: 1.2,
    defaultVal: 8.2,
    deviceGroup: "chemistry",
    isImaging: false
  },
  {
    name: "SGOT / AST",
    unit: "U/L",
    normalMin: 0,
    normalMax: 35,
    defaultVal: 28,
    deviceGroup: "chemistry",
    isImaging: false
  },
  {
    name: "MRI Brain 1.5T — Citra Axial DWI/FLAIR (Skor ASPECTS)",
    unit: "Skor ASPECTS",
    normalMin: 10,
    normalMax: 10,
    defaultVal: 6,
    normalVal: 10,
    deviceGroup: "mri",
    isImaging: true,
    modalityType: "MRI",
    dicomSeries: "SERIES-DWI-AXIAL-004.dcm",
    findingAbnormal: "Lesi hiperintens akut pada teritori MCA kiri (Infark Iskemik • ASPECTS 6/10)",
    findingNormal: "Parenkim serebri normal, tidak tampak lesi infark maupun perdarahan (ASPECTS 10/10)"
  },
  {
    name: "MRI Lumbosacral Spine T2W — Citra Sagittal",
    unit: "Derajat HNP",
    normalMin: 0,
    normalMax: 0,
    defaultVal: 3,
    normalVal: 0,
    deviceGroup: "mri",
    isImaging: true,
    modalityType: "MRI",
    dicomSeries: "SERIES-T2W-SAG-012.dcm",
    findingAbnormal: "Protrusi diskus intervertebralis L4-L5 menekan radiks saraf (Grade 3)",
    findingNormal: "Korda spinalis & diskus intervertebralis L1-S1 dalam batas normal (Grade 0)"
  },
  {
    name: "CT-Scan Thorax High-Res — Citra Axial Paru (Skor GGO)",
    unit: "Skor GGO",
    normalMin: 0,
    normalMax: 2,
    defaultVal: 14,
    normalVal: 0,
    deviceGroup: "ct",
    isImaging: true,
    modalityType: "CT",
    dicomSeries: "SERIES-HRCT-LUNG-088.dcm",
    findingAbnormal: "Ground-Glass Opacity (GGO) multifokal bilateral lobus bawah (Skor Keparahan 14/25)",
    findingNormal: "Lapang paru bersih kedua sisi, sinus kostofrenikus tajam (Skor 0/25)"
  },
  {
    name: "Echocardiography Doppler — Citra 4-Chamber (LVEF)",
    unit: "% LVEF",
    normalMin: 55,
    normalMax: 70,
    defaultVal: 38,
    normalVal: 62,
    deviceGroup: "echo",
    isImaging: true,
    modalityType: "ECHO",
    dicomSeries: "SERIES-ECHO-4CH-019.dcm",
    findingAbnormal: "Hipokinesia dinding anterior ventrikel kiri, penurunan fungsi pompa jantung (LVEF 38%)",
    findingNormal: "Kontraktilitas miokardium baik, katup jantung normal (LVEF 62%)"
  }
];

function getDeviceGroup(deviceName = "") {
  const lower = deviceName.toLowerCase();
  if (lower.includes("mri")) return "mri";
  if (lower.includes("ct-scan") || lower.includes("ct scan")) return "ct";
  if (lower.includes("echo")) return "echo";
  if (lower.includes("abbott") || lower.includes("cobas")) return "chemistry";
  return "hematology";
}
const INITIAL_DEVICES = [
  {
    value: "Sysmex XN-1000 Hematology",
    label: "Sysmex XN-1000 Hematology",
    description: "Level 2 Registered Analyzer (Hematologi • HL7 v2.5)",
    badge: "LIS L2",
    badgeColor: "bg-slate-100 text-slate-700 border border-slate-200/60",
    protocol: "HL7 v2.5 / ASTM",
    ip: "192.168.10.14:5100"
  },
  {
    value: "Siemens MAGNETOM Altea 1.5T MRI",
    label: "Siemens MAGNETOM Altea 1.5T MRI",
    description: "Modalitas Radiologi Neurologi & Vaskular (DICOM SR / PACS)",
    badge: "DICOM L2",
    badgeColor: "bg-slate-100 text-slate-700 border border-slate-200/60",
    protocol: "DICOM TLS / PACS",
    ip: "192.168.10.22:104"
  },
  {
    value: "GE Revolution CT-Scan 128-Slice",
    label: "GE Revolution CT-Scan 128-Slice",
    description: "Modalitas CT-Scan Thorax & Trauma (DICOM SR / PACS)",
    badge: "DICOM L2",
    badgeColor: "bg-slate-100 text-slate-700 border border-slate-200/60",
    protocol: "DICOM TLS / PACS",
    ip: "192.168.10.25:104"
  },
  {
    value: "Philips EPIQ CVx Echocardiography",
    label: "Philips EPIQ CVx Echocardiography",
    description: "Modalitas Kardiologi & Ultrasonografi Jantung (DICOM/HL7)",
    badge: "CARDIO L2",
    badgeColor: "bg-slate-100 text-slate-700 border border-slate-200/60",
    protocol: "DICOM / FHIR",
    ip: "192.168.10.31:104"
  },
  {
    value: "Abbott Architect c8000",
    label: "Abbott Architect c8000",
    description: "Clinical Chemistry & Immunoassay Analyzer",
    badge: "LIS L2",
    badgeColor: "bg-slate-100 text-slate-700 border border-slate-200/60",
    protocol: "HL7 v2.5",
    ip: "192.168.10.18:5100"
  }
];
const LabVaultView = ({
  labResults,
  currentUser,
  onAddLabResult,
  isOpenSimulator,
  onOpenSimulatorChange
}) => {
  const [internalSimulatorOpen, setInternalSimulatorOpen] = useState(false);
  const isSimulatorOpen = isOpenSimulator !== void 0 ? isOpenSimulator : internalSimulatorOpen;
  const setIsSimulatorOpen = (val) => {
    if (onOpenSimulatorChange) {
      onOpenSimulatorChange(val);
    }
    setInternalSimulatorOpen(val);
  };
  const [selectedTest, setSelectedTest] = useState(COMMON_TESTS[0].name);
  const [testValue, setTestValue] = useState(COMMON_TESTS[0].defaultVal);
  const [patientPseudoId, setPatientPseudoId] = useState("PASIEN-5566");
  const [encounterId, setEncounterId] = useState("ENC-2026-002");
  const [specimenId, setSpecimenId] = useState(`SPEC-${Math.floor(1e3 + Math.random() * 9e3)}`);
  const [sourceName, setSourceName] = useState("Sysmex XN-1000 Hematology");
  const [devices, setDevices] = useState(INITIAL_DEVICES);
  const [isScanningDevice, setIsScanningDevice] = useState(false);
  const [copiedId, setCopiedId] = useState(null);
  const [isTestSelectOpen, setIsTestSelectOpen] = useState(false);
  const [uploadedScanUrl, setUploadedScanUrl] = useState(null);
  const [uploadedScanName, setUploadedScanName] = useState("");

  const activeDeviceGroup = getDeviceGroup(sourceName);
  const availableTestsForDevice = COMMON_TESTS.filter(
    (t) => t.deviceGroup === activeDeviceGroup
  );
  const testConfig =
    COMMON_TESTS.find((t) => t.name === selectedTest) ||
    availableTestsForDevice[0] ||
    COMMON_TESTS[0];
  const isAbnormal = testValue < testConfig.normalMin || testValue > testConfig.normalMax;

  const handleDeviceChange = (newDeviceName) => {
    const devStr = String(newDeviceName);
    setSourceName(devStr);
    const grp = getDeviceGroup(devStr);
    const matchingTests = COMMON_TESTS.filter((t) => t.deviceGroup === grp);
    if (matchingTests.length > 0) {
      setSelectedTest(matchingTests[0].name);
      setTestValue(matchingTests[0].defaultVal);
    }
    setUploadedScanUrl(null);
    setUploadedScanName("");
    if (grp === "mri" || grp === "ct" || grp === "echo") {
      setSpecimenId(`DCM-${Math.floor(1e3 + Math.random() * 9e3)}`);
    } else {
      setSpecimenId(`SPEC-${Math.floor(1e3 + Math.random() * 9e3)}`);
    }
  };

  const handleScanImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadedScanName(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      setUploadedScanUrl(String(reader.result));
    };
    reader.readAsDataURL(file);
  };

  const handleScanPluggedDevice = () => {
    setIsScanningDevice(true);
    setTimeout(() => {
      setIsScanningDevice(false);
      const exists = devices.some((d) => d.value.includes("Cobas 6000"));
      if (!exists) {
        const pluggedDevice = {
          value: "Roche Cobas 6000 Modular (Auto-Detected)",
          label: "Roche Cobas 6000 Modular (Auto-Detected)",
          description: "Terdeteksi otomatis via Gateway HL7/ASTM Port 5102",
          badge: "PLUG & PLAY",
          badgeColor: "bg-amber-100 text-amber-800",
          protocol: "HL7 Auto-Handshake",
          ip: "192.168.10.44:5102"
        };
        setDevices((prev) => [pluggedDevice, ...prev]);
        handleDeviceChange(pluggedDevice.value);
      }
    }, 700);
  };
  const handleTestChange = (name) => {
    setSelectedTest(name);
    const found = COMMON_TESTS.find((t) => t.name === name);
    if (found) {
      setTestValue(found.defaultVal);
    }
  };
  const isAdmin = currentUser.role === "admin";
  const displayLabs = isAdmin ? labResults : labResults.filter((l) => !l.facilityId || l.facilityId === currentUser.facilityId);
  const handleSimulateSubmit = (e) => {
    e.preventDefault();
    const labId = `LAB-2026-${Date.now().toString().slice(-3)}`;
    const nowIso = (/* @__PURE__ */ new Date()).toISOString();
    const payload = `${sourceName}|${specimenId}|${patientPseudoId}|${selectedTest}|${testValue}|${nowIso}`;
    const payloadHash = sha256Sync(payload);
    const newLab = {
      id: labId,
      facilityId: currentUser.facilityId || "FASKES-01",
      sourceId: "LIS-AUTO-01",
      sourceName,
      specimenId,
      encounterId,
      patientPseudoId,
      test: selectedTest,
      value: testValue,
      unit: testConfig.unit,
      referenceRange: `${testConfig.normalMin} - ${testConfig.normalMax}`,
      isAbnormal,
      sampledAt: new Date(Date.now() - 36e5).toISOString(),
      receivedAt: nowIso,
      payloadHash,
      sealId: `SEAL-${labId}`,
      assuranceLevel: "Level 2",
      status: "valid"
    };
    onAddLabResult(newLab);
    setIsSimulatorOpen(false);
  };
  const handleCopy = (text, id) => {
    navigator.clipboard?.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2e3);
  };
  return <div className="space-y-6">
      {
    /* Controls Bar */
  }
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-slate-900">
            {isAdmin ? "Vault Hasil Laboratorium Nasional" : `Vault Hasil Lab \u2014 ${currentUser.facilityName || "Faskes"}`}
          </h2>
          <p className="text-xs text-slate-500">
            Total {displayLabs.length} hasil lab tersegel • Rujukan kebenaran faktual objektif (Ground Truth)
          </p>
        </div>

        <button
    data-tour="btn-open-lis-simulator"
    onClick={() => setIsSimulatorOpen(true)}
    className="self-start sm:self-auto px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-xs shadow-emerald-200 transition-all flex items-center gap-2"
  >
          <PlusCircle className="w-4 h-4" />
          <span>{isAdmin ? "Simulasi Ingestion LIS" : "Kirim Hasil Lab Faskes (LIS)"}</span>
        </button>
      </div>

      {
    /* Mandatory PRD Regulatory Disclaimer */
  }
      <div className="p-4 rounded-xl bg-emerald-50/80 border border-emerald-200/80 text-xs text-emerald-900 flex items-start gap-3">
        <Lock className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold text-emerald-950">
            Batas Jaminan Kriptografis (PRD Bagian 1 & 8):
          </span>{" "}
          Segel membuktikan apa yang diterima dan kapan, bukan keaslian pengukuran di sumber. Level 2 membuktikan sumber terdaftar dengan tanda tangan HMAC-SHA256 valid.
        </div>
      </div>

      {/* Connected Medical Analyzers & Radiology Modalities (HL7 / DICOM Auto-Detect) */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-xs p-4 sm:p-5 space-y-3.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#D6F2EE] text-[#0E947A] flex items-center justify-center shrink-0">
              <Cpu className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs sm:text-sm font-bold text-slate-900 flex items-center gap-2">
                <span>Mesin Medis & Modalitas Terhubung (Auto-Detect HL7 / DICOM)</span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700">
                  <Radio className="w-3 h-3 animate-pulse text-emerald-600" />
                  {devices.length} Mesin Online
                </span>
              </h3>
              <p className="text-[11px] text-slate-500">
                Alat Lab LIS, MRI, CT-Scan, dan Echocardiography terdeteksi otomatis lewat Gateway LAN/DICOM rumah sakit
              </p>
            </div>
          </div>

          <button
            type="button"
            data-tour="btn-scan-device"
            onClick={handleScanPluggedDevice}
            disabled={isScanningDevice}
            className="self-start sm:self-auto px-3 py-1.5 rounded-xl bg-[#F5F7F9] hover:bg-[#D6F2EE]/60 text-slate-700 hover:text-[#0E947A] text-[11px] font-bold flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isScanningDevice ? "animate-spin text-[#0E947A]" : ""}`} />
            <span>{isScanningDevice ? "Mendeteksi Port HL7/DICOM..." : "Scan Alat Baru (Plug & Play)"}</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
          {devices.map((dev) => (
            <div
              key={dev.value}
              className="p-3 rounded-xl bg-[#F8FAFC] border border-slate-200/70 flex items-start justify-between gap-2"
            >
              <div className="min-w-0">
                <p className="text-xs font-bold text-slate-800 truncate">{dev.label}</p>
                <p className="text-[10px] text-slate-500 truncate mt-0.5">{dev.description}</p>
                <p className="text-[10px] font-mono text-emerald-700 mt-1">
                  {dev.protocol} • {dev.ip}
                </p>
              </div>
              <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full shrink-0 ${dev.badgeColor}`}>
                {dev.badge}
              </span>
            </div>
          ))}
        </div>
      </div>

      {
    /* Simulator Modal Drawer (Portal to document.body) */
  }
      {typeof document !== "undefined" && createPortal(
      <AnimatePresence>
        {isSimulatorOpen && <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    transition={{ duration: 0.22, ease: "easeOut" }}
    className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex justify-center items-center p-3 sm:p-5"
    onClick={(e) => {
      if (e.target === e.currentTarget) setIsSimulatorOpen(false);
    }}
  >
            <motion.div
    layout
    data-tour="lis-simulator-modal"
    initial={{ opacity: 0, scale: 0.94, y: 14 }}
    animate={{ opacity: 1, scale: 1, y: 0 }}
    exit={{ opacity: 0, scale: 0.94, y: 14 }}
    transition={{
      layout: { duration: 0.35, ease: [0.16, 1, 0.3, 1] },
      opacity: { duration: 0.2 },
      scale: { duration: 0.2 }
    }}
    className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-slate-100 relative"
  >
              <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70 rounded-t-3xl">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center">
                    <FlaskConical className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">
                      Simulator Pengiriman Hasil Lab & Modalitas (LIS / DICOM)
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      Entri langsung tersegel Level 2 dari Mesin Lab, MRI, CT-Scan, atau Echo
                    </p>
                  </div>
                </div>
                <button
    onClick={() => {
      setIsSimulatorOpen(false);
      setIsTestSelectOpen(false);
    }}
    className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
  >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form
    onSubmit={(e) => {
      setIsTestSelectOpen(false);
      handleSimulateSubmit(e);
    }}
    className={`p-5 space-y-4 transition-[padding-bottom] duration-300 ease-out ${isTestSelectOpen ? "pb-52" : "pb-5"}`}
  >
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Pilih Mesin Analyzer / Modalitas (LIS & DICOM)
                  </label>
                  <CustomSelect
    value={sourceName}
    onChange={(val) => handleDeviceChange(val)}
    options={devices}
    placeholder="Pilih Mesin Analyzer / Modalitas..."
  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      {testConfig.isImaging ? "ID Studi DICOM / PACS" : "ID Spesimen Lab"}
                    </label>
                    <input
    type="text"
    value={specimenId}
    onChange={(e) => setSpecimenId(e.target.value)}
    required
    className="w-full px-3 py-2 text-xs font-mono border border-slate-200 rounded-xl bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
  />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      ID Pasien (Pseudonim)
                    </label>
                    <input
    type="text"
    value={patientPseudoId}
    onChange={(e) => setPatientPseudoId(e.target.value)}
    required
    className="w-full px-3 py-2 text-xs font-mono border border-slate-200 rounded-xl bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
  />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {testConfig.isImaging ? "Jenis Pencitraan / Sekuens Scan" : "Parameter Pemeriksaan"}
                  </label>
                  <CustomSelect
    value={selectedTest}
    onChange={(val) => handleTestChange(String(val))}
    onOpenChange={setIsTestSelectOpen}
    placement="bottom"
    options={availableTestsForDevice.map((t) => ({
      value: t.name,
      label: t.name,
      description: t.isImaging
        ? `File DICOM: ${t.dicomSeries} • Standar Normal: ${t.normalMin} ${t.unit}`
        : `Nilai Normal: ${t.normalMin} - ${t.normalMax} ${t.unit}`,
      badge: t.isImaging ? "CITRA DICOM" : t.unit,
      badgeColor: "bg-slate-100 text-slate-700 font-mono"
    }))}
    placeholder="Pilih Parameter Uji..."
  />
                </div>

                {testConfig.isImaging ? (
                  <div className="space-y-3 p-3.5 rounded-2xl bg-slate-900 text-white border border-slate-800">
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-400 block">
                          DICOM PACS IMAGE PREVIEW • {testConfig.modalityType}
                        </span>
                        <p className="text-xs font-bold text-white">
                          {uploadedScanName || testConfig.dicomSeries}
                        </p>
                      </div>

                      <label className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-[11px] font-semibold text-emerald-200 cursor-pointer transition-colors">
                        <span>Unggah Gambar Scan</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleScanImageUpload}
                          className="hidden"
                        />
                      </label>
                    </div>

                    {/* Medical Scan Visual Slice / Uploaded Image */}
                    <div className="flex items-center gap-3.5 bg-slate-950/90 p-3 rounded-xl border border-slate-800">
                      <div className="w-24 h-24 rounded-lg bg-black border border-slate-700 flex items-center justify-center overflow-hidden shrink-0 relative">
                        {uploadedScanUrl ? (
                          <img
                            src={uploadedScanUrl}
                            alt="Uploaded Medical Scan"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <svg viewBox="0 0 100 100" className="w-20 h-20">
                            <ellipse
                              cx="50"
                              cy="50"
                              rx="36"
                              ry="42"
                              fill="#1e293b"
                              stroke="#64748b"
                              strokeWidth="2.5"
                            />
                            <ellipse
                              cx="50"
                              cy="50"
                              rx="29"
                              ry="35"
                              fill="#0f172a"
                              stroke="#475569"
                              strokeWidth="1.5"
                            />
                            <path
                              d="M50 16 L50 84 M32 38 Q50 46 68 38 M34 62 Q50 54 66 62"
                              stroke="#334155"
                              strokeWidth="1.5"
                              fill="none"
                            />
                            {isAbnormal && (
                              <circle
                                cx="61"
                                cy="44"
                                r="9"
                                fill="rgba(244, 63, 94, 0.45)"
                                stroke="#fb7185"
                                strokeWidth="1.8"
                              />
                            )}
                          </svg>
                        )}
                        <span className="absolute bottom-1 right-1 text-[8px] font-mono bg-black/80 text-emerald-400 px-1 rounded">
                          512×512
                        </span>
                      </div>

                      <div className="min-w-0 flex-1 space-y-2">
                        <div className="flex flex-wrap gap-1.5">
                          <button
                            type="button"
                            onClick={() => setTestValue(testConfig.defaultVal)}
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors cursor-pointer ${
                              isAbnormal
                                ? "bg-amber-400 text-slate-950"
                                : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                            }`}
                          >
                            Citra Abnormal (Lesi +)
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              setTestValue(
                                testConfig.normalVal !== undefined
                                  ? testConfig.normalVal
                                  : testConfig.normalMin
                              )
                            }
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors cursor-pointer ${
                              !isAbnormal
                                ? "bg-emerald-500 text-slate-950"
                                : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                            }`}
                          >
                            Citra Normal (Bersih)
                          </button>
                        </div>

                        <p className="text-[11px] text-slate-300 leading-snug">
                          {isAbnormal ? testConfig.findingAbnormal : testConfig.findingNormal}
                        </p>

                        <p className="text-[10px] font-mono text-emerald-400">
                          Pembacaan Kuantitatif AI: {testValue} {testConfig.unit}
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Nilai Hasil ({testConfig.unit})
                    </label>
                    <div className="flex items-center gap-3">
                      <input
    type="number"
    step="any"
    value={testValue}
    onChange={(e) => setTestValue(parseFloat(e.target.value) || 0)}
    required
    className="w-full px-3 py-2 text-xs font-mono font-bold border border-slate-200 rounded-xl bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
  />
                      <span
    className={`text-xs px-2.5 py-1.5 rounded-lg font-bold shrink-0 ${isAbnormal ? "bg-amber-100 text-amber-800 border border-amber-200" : "bg-emerald-100 text-emerald-800 border border-emerald-200"}`}
  >
                        {isAbnormal ? "Di Luar Normal" : "Normal"}
                      </span>
                    </div>
                  </div>
                )}

                <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
                  <button
    type="button"
    onClick={() => {
      setIsSimulatorOpen(false);
      setIsTestSelectOpen(false);
    }}
    className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
  >
                    Batal
                  </button>
                  <button
    type="submit"
    data-tour="btn-submit-lis-simulator"
    className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm shadow-emerald-200 transition-all flex items-center gap-2"
  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Kirim & Segel ke Vault</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>}
      </AnimatePresence>,
      document.body
      )}

      {
    /* Lab Results Table */
  }
      <div className="bg-white rounded-2xl border border-slate-100 shadow-xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FlaskConical className="w-5 h-5 text-emerald-600" />
            <h2 className="text-sm font-bold text-slate-900">
              Daftar Hasil Lab Tersegel ({displayLabs.length} Rekam Uji)
            </h2>
          </div>
          <span className="text-xs text-emerald-700 font-semibold bg-emerald-50 px-2.5 py-1 rounded-full">
            Tingkat Jaminan Level 2 Aktif
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">ID Lab & Spesimen</th>
                <th className="py-3 px-4">Pasien & Kunjungan</th>
                <th className="py-3 px-4">Pemeriksaan</th>
                <th className="py-3 px-4 text-center">Nilai & Satuan</th>
                <th className="py-3 px-4">Sumber / Mesin LIS</th>
                <th className="py-3 px-4">Jaminan & Waktu</th>
                <th className="py-3 px-4 text-right">Hash Payload</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {displayLabs.map((lab) => <tr key={lab.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3.5 px-4 font-mono">
                    <span className="font-bold text-slate-900 block">{lab.id}</span>
                    <span className="text-[11px] text-slate-400">{lab.specimenId}</span>
                  </td>

                  <td className="py-3.5 px-4">
                    <span className="font-mono font-semibold text-slate-800 block">
                      {lab.patientPseudoId}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {lab.encounterId}
                    </span>
                  </td>

                  <td className="py-3.5 px-4 font-semibold text-slate-800">
                    {lab.test}
                  </td>

                  <td className="py-3.5 px-4 text-center">
                    <div className="inline-flex flex-col items-center">
                      <span
                        className={`font-mono font-bold text-xs px-2.5 py-0.5 rounded-md border ${
                          lab.isAbnormal
                            ? "bg-amber-50 text-amber-800 border-amber-200"
                            : "bg-emerald-50 text-emerald-800 border-emerald-200"
                        }`}
                      >
                        {lab.value} {lab.unit}
                      </span>
                      <span className="text-[10px] text-slate-400 mt-0.5">
                        Ref: {lab.referenceRange}
                      </span>
                    </div>
                  </td>

                  <td className="py-3.5 px-4 text-slate-600">
                    <span className="block font-medium">{lab.sourceName}</span>
                    <span className="text-[10px] text-slate-400 font-mono">{lab.sourceId}</span>
                  </td>

                  <td className="py-3.5 px-4">
                    <span className="text-[11px] font-medium text-slate-700 block">
                      {lab.assuranceLevel}
                    </span>
                    <span className="block text-[10px] text-slate-400 mt-0.5">
                      {new Date(lab.receivedAt).toLocaleTimeString("id-ID")} WIB
                    </span>
                  </td>

                  <td className="py-3.5 px-4 text-right">
                    <button
    type="button"
    onClick={() => handleCopy(lab.payloadHash, lab.id)}
    className="font-mono text-[10px] text-slate-500 hover:text-slate-900 bg-slate-100 px-2 py-1 rounded-md transition-colors inline-flex items-center gap-1"
  >
                      <span>{lab.payloadHash.slice(0, 8)}...</span>
                      {copiedId === lab.id ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                    </button>
                  </td>
                </tr>)}
            </tbody>
          </table>
        </div>
      </div>
    </div>;
};
export {
  LabVaultView
};
