import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Link as LinkIcon,
  ShieldCheck,
  ShieldAlert,
  CheckCircle2,
  Layers,
  History,
  Copy,
  Check
} from "lucide-react";
import { verifyChainIntegrity } from "../utils/crypto";
const AuditChainView = ({ seals, auditLogs }) => {
  const [activeSection, setActiveSection] = useState("all");
  const [verificationReport, setVerificationReport] = useState(null);
  const [copiedHash, setCopiedHash] = useState(null);
  const handleVerifyChain = () => {
    const res = verifyChainIntegrity(seals);
    setVerificationReport({
      isChainIntact: res.isChainIntact,
      message: res.message,
      verifiedAt: (/* @__PURE__ */ new Date()).toLocaleTimeString("id-ID")
    });
  };
  const handleCopy = (text, id) => {
    navigator.clipboard?.writeText(text);
    setCopiedHash(id);
    setTimeout(() => setCopiedHash(null), 2e3);
  };
  return <div className="space-y-6">
      {
    /* Controls Bar & Segmented Switcher */
  }
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        {
    /* View Switcher with smooth sliding indicator */
  }
        <div className="bg-slate-100 p-1 rounded-2xl flex flex-wrap gap-1 w-full md:w-auto border border-slate-200/80 shadow-2xs">
          <button
    onClick={() => setActiveSection("all")}
    className={`relative py-2 px-3.5 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5 ${activeSection === "all" ? "text-emerald-900 font-bold" : "text-slate-600 hover:text-slate-900"}`}
  >
            {activeSection === "all" && <motion.div
    layoutId="activeAuditViewIndicator"
    className="absolute inset-0 bg-white rounded-xl shadow-xs"
    transition={{ type: "spring", stiffness: 380, damping: 32 }}
  />}
            <span className="relative z-10 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5" />
              <span>Semua Tampilan</span>
            </span>
          </button>

          <button
    onClick={() => setActiveSection("chain")}
    className={`relative py-2 px-3.5 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5 ${activeSection === "chain" ? "text-emerald-900 font-bold" : "text-slate-600 hover:text-slate-900"}`}
  >
            {activeSection === "chain" && <motion.div
    layoutId="activeAuditViewIndicator"
    className="absolute inset-0 bg-white rounded-xl shadow-xs"
    transition={{ type: "spring", stiffness: 380, damping: 32 }}
  />}
            <span className="relative z-10 flex items-center gap-1.5">
              <LinkIcon className="w-3.5 h-3.5 text-emerald-600" />
              <span>Rantai Segel ({seals.length})</span>
            </span>
          </button>

          <button
    onClick={() => setActiveSection("logs")}
    className={`relative py-2 px-3.5 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5 ${activeSection === "logs" ? "text-emerald-900 font-bold" : "text-slate-600 hover:text-slate-900"}`}
  >
            {activeSection === "logs" && <motion.div
    layoutId="activeAuditViewIndicator"
    className="absolute inset-0 bg-white rounded-xl shadow-xs"
    transition={{ type: "spring", stiffness: 380, damping: 32 }}
  />}
            <span className="relative z-10 flex items-center gap-1.5">
              <History className="w-3.5 h-3.5 text-emerald-600" />
              <span>Log Audit ({auditLogs.length})</span>
            </span>
          </button>
        </div>

        <button
    onClick={handleVerifyChain}
    className="self-start md:self-auto px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-xs shadow-emerald-200 transition-all flex items-center gap-2"
  >
          <ShieldCheck className="w-4 h-4" />
          <span>Verifikasi Keutuhan Rantai Sekarang</span>
        </button>
      </div>

      {
    /* Verification Result Banner */
  }
      {verificationReport && <div
    className={`p-4 rounded-xl border flex items-center justify-between text-xs ${verificationReport.isChainIntact ? "bg-emerald-50 border-emerald-300 text-emerald-900" : "bg-rose-50 border-rose-300 text-rose-900"}`}
  >
          <div className="flex items-center gap-2.5">
            {verificationReport.isChainIntact ? <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" /> : <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0" />}
            <div>
              <p className="font-bold text-sm">
                {verificationReport.isChainIntact ? "Audit Kriptografis: Rantai 100% Utuh & Valid" : "Peringatan: Rantai Segel Rusak!"}
              </p>
              <p className="text-xs mt-0.5">{verificationReport.message}</p>
            </div>
          </div>
          <span className="text-[10px] font-mono text-slate-500 shrink-0">
            Diverifikasi: {verificationReport.verifiedAt} WIB
          </span>
        </div>}

      <AnimatePresence mode="wait">
        <motion.div
    key={activeSection}
    initial={{ opacity: 0, y: 8 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -8 }}
    transition={{ duration: 0.2, ease: "easeOut" }}
    className="space-y-6"
  >
          {
    /* Chain Explorer Cards */
  }
          {(activeSection === "all" || activeSection === "chain") && <div className="bg-white rounded-2xl border border-slate-100 shadow-xs overflow-hidden">
              <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <LinkIcon className="w-5 h-5 text-emerald-600" />
                  <h2 className="text-sm font-bold text-slate-900">
                    Blok Rantai Segel Kriptografis ({seals.length} Blok Terdaftar)
                  </h2>
                </div>
                <span className="text-xs font-mono font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full">
                  Kunci: KEY-ED25519-VM-2026
                </span>
              </div>

              <div className="p-5 space-y-4">
                <div className="relative pl-6 sm:pl-8 space-y-6 before:absolute before:left-3 sm:before:left-4 before:top-2 before:bottom-2 before:w-0.5 before:bg-emerald-200">
                  {seals.map((seal, index) => <motion.div
    key={seal.id}
    initial={{ opacity: 0, y: 8 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.2, delay: index * 0.03, ease: "easeOut" }}
    className="relative group"
  >
                      {
    /* Node icon on line */
  }
                      <div className="absolute -left-6 sm:-left-8 top-1.5 w-6 h-6 rounded-full bg-white border-2 border-emerald-500 flex items-center justify-center text-[10px] font-mono font-bold text-emerald-700 shadow-xs">
                        {index + 1}
                      </div>

                      {
    /* Block Content */
  }
                      <div className="p-4 rounded-xl bg-slate-50 hover:bg-slate-50/80 border border-slate-200/80 transition-all text-xs space-y-2">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900 text-sm">
                              Blok #{index + 1}: {seal.refId}
                            </span>
                            <span className="px-2 py-0.2 rounded-md bg-emerald-100 text-emerald-800 font-mono text-[10px] font-bold">
                              {(seal.kind || "claim").toUpperCase()} V{seal.version || 1}
                            </span>
                          </div>
                          <span className="text-[11px] text-slate-400">
                            {new Date(seal.createdAt).toLocaleString("id-ID")} WIB
                          </span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[11px] font-mono pt-1">
                          <div className="bg-white p-2 rounded-lg border border-slate-200 truncate flex items-center justify-between">
                            <span className="text-slate-500 truncate mr-2">
                              Merkle Root: <strong className="text-slate-800">{seal.merkleRoot}</strong>
                            </span>
                            <button
    onClick={() => handleCopy(seal.merkleRoot, `root-${seal.id}`)}
    className="text-slate-400 hover:text-slate-600 shrink-0"
  >
                              {copiedHash === `root-${seal.id}` ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                            </button>
                          </div>

                          <div className="bg-white p-2 rounded-lg border border-slate-200 truncate flex items-center justify-between">
                            <span className="text-slate-500 truncate mr-2">
                              Prev Hash: <strong className="text-slate-800">{seal.prevSealHash.slice(0, 16)}...</strong>
                            </span>
                            <button
    onClick={() => handleCopy(seal.prevSealHash, `prev-${seal.id}`)}
    className="text-slate-400 hover:text-slate-600 shrink-0"
  >
                              {copiedHash === `prev-${seal.id}` ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                            </button>
                          </div>
                        </div>

                        <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1">
                          <span>
                            Daun Merkle Tersegel:{" "}
                            <strong className="text-slate-700">{seal.leaves.length} Daun Hash</strong>
                          </span>
                          <span className="font-mono text-emerald-700 font-semibold truncate max-w-xs">
                            Sig: {seal.signature.slice(0, 24)}...
                          </span>
                        </div>
                      </div>
                    </motion.div>)}
                </div>
              </div>
            </div>}

          {
    /* Append-Only Audit Trail Table */
  }
          {(activeSection === "all" || activeSection === "logs") && <div className="bg-white rounded-2xl border border-slate-100 shadow-xs overflow-hidden">
              <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <History className="w-5 h-5 text-emerald-600" />
                  <h2 className="text-sm font-bold text-slate-900">
                    Log Audit Aktivitas (Append-Only)
                  </h2>
                </div>
                <span className="text-xs text-slate-400">
                  Penegakan SQLite BEFORE UPDATE/DELETE RAISE(ABORT)
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                    <tr>
                      <th className="py-3 px-4">Waktu (WIB)</th>
                      <th className="py-3 px-4">Pelaku (Aktor)</th>
                      <th className="py-3 px-4">Tindakan</th>
                      <th className="py-3 px-4">Referensi Klaim</th>
                      <th className="py-3 px-4">Rincian Aktivitas</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {auditLogs.map((log) => <tr key={log.id} className="hover:bg-slate-50/60">
                        <td className="py-3 px-4 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                          {new Date(log.timestamp).toLocaleTimeString("id-ID")} WIB
                        </td>
                        <td className="py-3 px-4 font-medium text-slate-800">
                          <span className="block">{log.actor}</span>
                          <span className="text-[10px] text-slate-400 uppercase font-mono">
                            {log.role}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-slate-100 text-slate-700">
                            {log.action}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-mono font-semibold text-emerald-800">
                          {log.ref}
                        </td>
                        <td className="py-3 px-4 text-slate-600 max-w-md">{log.details}</td>
                      </tr>)}
                  </tbody>
                </table>
              </div>
            </div>}
        </motion.div>
      </AnimatePresence>
    </div>;
};
export {
  AuditChainView
};
