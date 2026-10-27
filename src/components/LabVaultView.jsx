import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  FlaskConical,
  ShieldCheck,
  PlusCircle,
  Lock,
  Send,
  Copy,
  Check,
  X
} from "lucide-react";
import { CustomSelect } from "./CustomSelect";
import { sha256Sync } from "../utils/crypto";
const COMMON_TESTS = [
  { name: "Hemoglobin (Hb)", unit: "g/dL", normalMin: 12, normalMax: 16, defaultVal: 11.4 },
  { name: "Hitung Leukosit (WBC)", unit: "/\xB5L", normalMin: 4e3, normalMax: 11e3, defaultVal: 7200 },
  { name: "Trombosit", unit: "/\xB5L", normalMin: 15e4, normalMax: 45e4, defaultVal: 78e3 },
  { name: "Ureum Darah", unit: "mg/dL", normalMin: 15, normalMax: 45, defaultVal: 142 },
  { name: "Kreatinin Serum", unit: "mg/dL", normalMin: 0.6, normalMax: 1.2, defaultVal: 8.2 },
  { name: "SGOT / AST", unit: "U/L", normalMin: 0, normalMax: 35, defaultVal: 28 }
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
  const [copiedId, setCopiedId] = useState(null);
  const [isTestSelectOpen, setIsTestSelectOpen] = useState(false);
  const testConfig = COMMON_TESTS.find((t) => t.name === selectedTest) || COMMON_TESTS[0];
  const isAbnormal = testValue < testConfig.normalMin || testValue > testConfig.normalMax;
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

      {
    /* Simulator Modal Drawer */
  }
      <AnimatePresence>
        {isSimulatorOpen && <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    transition={{ duration: 0.22, ease: "easeOut" }}
    className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex justify-center items-start p-4 py-8 sm:py-14"
    onClick={(e) => {
      if (e.target === e.currentTarget) setIsSimulatorOpen(false);
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
    className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-slate-100 relative"
  >
              <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70 rounded-t-3xl">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center">
                    <FlaskConical className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">
                      Simulator Pengiriman Hasil Lab (LIS Ingestion)
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      Entri langsung tersegel Level 2 LIS
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
                    Pilih Mesin Analyzer / LIS
                  </label>
                  <CustomSelect
    value={sourceName}
    onChange={(val) => setSourceName(String(val))}
    options={[
      {
        value: "Sysmex XN-1000 Hematology",
        label: "Sysmex XN-1000 Hematology",
        description: "Level 2 Registered Analyzer (Hematologi)",
        badge: "LIS L2",
        badgeColor: "bg-emerald-100 text-emerald-800"
      },
      {
        value: "Abbott Architect c8000",
        label: "Abbott Architect c8000",
        description: "Clinical Chemistry & Immunoassay Analyzer",
        badge: "LIS L2",
        badgeColor: "bg-sky-100 text-sky-800"
      },
      {
        value: "Cobas 6000 Clinical Chemistry",
        label: "Cobas 6000 Clinical Chemistry",
        description: "Roche Diagnostics Modular Analyzer",
        badge: "LIS L2",
        badgeColor: "bg-indigo-100 text-indigo-800"
      }
    ]}
    placeholder="Pilih Mesin Analyzer..."
  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      ID Spesimen
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
                    Parameter Pemeriksaan
                  </label>
                  <CustomSelect
    value={selectedTest}
    onChange={(val) => handleTestChange(String(val))}
    onOpenChange={setIsTestSelectOpen}
    placement="bottom"
    options={COMMON_TESTS.map((t) => ({
      value: t.name,
      label: t.name,
      description: `Nilai Normal: ${t.normalMin} - ${t.normalMax} ${t.unit}`,
      badge: t.unit,
      badgeColor: "bg-slate-100 text-slate-700 font-mono"
    }))}
    placeholder="Pilih Parameter Uji..."
  />
                </div>

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
    className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm shadow-emerald-200 transition-all flex items-center gap-2"
  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Kirim & Segel ke Vault</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>}
      </AnimatePresence>

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
    className={`font-mono font-bold text-xs px-2 py-0.5 rounded-md ${lab.isAbnormal ? "bg-amber-100 text-amber-800" : "bg-emerald-100 text-emerald-800"}`}
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
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                      <ShieldCheck className="w-3 h-3 text-emerald-600" />
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
