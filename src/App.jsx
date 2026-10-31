/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import { useState, useEffect } from "react";
import {
  INITIAL_USERS,
  INITIAL_CLAIMS,
  INITIAL_SEALS,
  INITIAL_LAB_RESULTS,
  INITIAL_AUDIT_LOGS
} from "./data/mockData";
import { evaluateClaimRules } from "./utils/rules";
import { buildClaimLeaves, generateMerkleRoot, sha256Sync } from "./utils/crypto";
import { Sidebar } from "./components/Sidebar";
import { HeaderBar } from "./components/HeaderBar";
import { AuthView } from "./components/AuthView";
import { DashboardFaskesView } from "./components/DashboardFaskesView";
import { DashboardAdminView } from "./components/DashboardAdminView";
import { ClaimsListView } from "./components/ClaimsListView";
import { ClaimDetailModal } from "./components/ClaimDetailModal";
import { NewClaimModal } from "./components/NewClaimModal";
import { LabVaultView } from "./components/LabVaultView";
import { KlarifikasiFaskesView } from "./components/KlarifikasiFaskesView";
import { ProfilFaskesView } from "./components/ProfilFaskesView";
import { AiSettingsView } from "./components/AiSettingsView";
import { NationalInsightsView } from "./components/NationalInsightsView";
import { AuditChainView } from "./components/AuditChainView";
import { DemoTutorialOverlay } from "./components/DemoTutorialOverlay";
import { motion, AnimatePresence } from "motion/react";
import { CheckCircle2, AlertTriangle, ShieldAlert } from "lucide-react";
function App() {
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const sess = sessionStorage.getItem("verimed_active_user");
      if (sess) return JSON.parse(sess);
      const loc = localStorage.getItem("verimed_active_user");
      if (loc) return JSON.parse(loc);
    } catch {}
    return INITIAL_USERS[0];
  });
  const [activeTab, setActiveTab] = useState("dashboard");
  const [claims, setClaims] = useState(() => currentUser?.isDemo === false ? [] : INITIAL_CLAIMS);
  const [seals, setSeals] = useState(() => currentUser?.isDemo === false ? [] : INITIAL_SEALS);
  const [labResults, setLabResults] = useState(() => currentUser?.isDemo === false ? [] : INITIAL_LAB_RESULTS);
  const [auditLogs, setAuditLogs] = useState(() => currentUser?.isDemo === false ? [] : INITIAL_AUDIT_LOGS);
  const [selectedClaim, setSelectedClaim] = useState(null);
  const [isNewClaimModalOpen, setIsNewClaimModalOpen] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isLabSimulatorOpen, setIsLabSimulatorOpen] = useState(false);
  const [isTutorialOpen, setIsTutorialOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);
  const showToast = (text, type = "success") => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  // Sync real tenant data across browser tabs and backend database
  useEffect(() => {
    if (!currentUser) return;

    if (currentUser.isDemo) {
      setClaims(INITIAL_CLAIMS);
      setLabResults(INITIAL_LAB_RESULTS);
      setSeals(INITIAL_SEALS);
      setAuditLogs(INITIAL_AUDIT_LOGS);
      return;
    }

    const pairing = currentUser.pairingCode || "BPJS-KC-JKT01";
    let isMounted = true;

    const fetchSyncData = async () => {
      try {
        const res = await fetch(`/api/sync?pairingCode=${encodeURIComponent(pairing)}&isDemo=false`);
        const data = await res.json().catch(() => ({}));
        if (data.success && isMounted) {
          setClaims(data.claims || []);
          setLabResults(data.labResults || []);
          setSeals(data.seals || []);
          setAuditLogs(data.auditLogs || []);
        }
      } catch (err) {
        console.warn("[VeriMed Sync] Warning:", err);
      }
    };

    fetchSyncData();

    let channel = null;
    try {
      channel = new BroadcastChannel("verimed_sync");
      channel.onmessage = (event) => {
        if (event.data?.type === "REFRESH" && event.data?.pairingCode === pairing) {
          fetchSyncData();
        }
      };
    } catch {}

    const interval = setInterval(fetchSyncData, 2500);

    return () => {
      isMounted = false;
      clearInterval(interval);
      if (channel) channel.close();
    };
  }, [currentUser?.id, currentUser?.isDemo, currentUser?.pairingCode]);

  const handleSwitchRole = () => {
    if (!currentUser) return;
    if (currentUser.isDemo) {
      const nextUser = currentUser.role === "admin" ? INITIAL_USERS[1] : INITIAL_USERS[0];
      setCurrentUser(nextUser);
      try {
        sessionStorage.setItem("verimed_active_user", JSON.stringify(nextUser));
      } catch {}
      setActiveTab("dashboard");
      showToast(`Beralih peran ke: ${nextUser.name} (${nextUser.role === "admin" ? "Admin & Verifikator" : "Faskes"})`);
    } else {
      const nextRole = currentUser.role === "admin" ? "faskes" : "admin";
      const switched = {
        ...currentUser,
        role: nextRole,
        facilityId: nextRole === "faskes" ? (currentUser.facilityId || "FK-001") : undefined,
        facilityName: nextRole === "faskes" ? (currentUser.facilityName || "RS Mitra Mandiri") : "Kantor BPJS Cabang"
      };
      setCurrentUser(switched);
      try {
        sessionStorage.setItem("verimed_active_user", JSON.stringify(switched));
      } catch {}
      setActiveTab("dashboard");
      showToast(`Beralih simulasi peran ke: ${switched.name} (${nextRole === "admin" ? "Admin & Verifikator" : "Faskes"})`);
    }
  };
  const handleUpdateClaimStatus = (claimId, newStatus, note) => {
    const nowIso = (/* @__PURE__ */ new Date()).toISOString();
    setClaims(
      (prev) => prev.map((c) => {
        if (c.id === claimId) {
          const updatedHistory = [...c.clarificationHistory || []];
          if (newStatus === "klarifikasi" && note) {
            updatedHistory.push({
              id: `msg-${Date.now()}`,
              senderRole: "admin",
              senderName: currentUser?.name || "Admin Verifikator",
              message: note,
              timestamp: nowIso
            });
          }
          return {
            ...c,
            status: newStatus,
            clarificationHistory: updatedHistory,
            updatedAt: nowIso
          };
        }
        return c;
      })
    );
    if (selectedClaim && selectedClaim.id === claimId) {
      setSelectedClaim((prev) => {
        if (!prev) return null;
        const updatedHistory = [...prev.clarificationHistory || []];
        if (newStatus === "klarifikasi" && note) {
          updatedHistory.push({
            id: `msg-${Date.now()}`,
            senderRole: "admin",
            senderName: currentUser?.name || "Admin Verifikator",
            message: note,
            timestamp: nowIso
          });
        }
        return {
          ...prev,
          status: newStatus,
          clarificationHistory: updatedHistory,
          updatedAt: nowIso
        };
      });
    }
    const newLog = {
      id: `LOG-${Date.now().toString().slice(-4)}`,
      actor: currentUser?.name || "Admin",
      role: currentUser?.role || "admin",
      action: `KEPUTUSAN_${newStatus.toUpperCase()}`,
      ref: selectedClaim?.claimNumber || claimId,
      details: note || `Keputusan status klaim diubah menjadi ${newStatus}.`,
      timestamp: nowIso
    };
    setAuditLogs((prev) => [newLog, ...prev]);
    showToast(`Keputusan verifikasi disimpan: ${newStatus.replace("_", " ")}.`);

    if (!currentUser?.isDemo) {
      fetch(`/api/claims/${claimId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: newStatus,
          note,
          actor: currentUser?.name || "Admin Verifikator",
          role: currentUser?.role || "admin",
          pairingCode: currentUser?.pairingCode
        })
      })
        .then(() => {
          try {
            const ch = new BroadcastChannel("verimed_sync");
            ch.postMessage({ type: "REFRESH", pairingCode: currentUser?.pairingCode });
            ch.close();
          } catch {}
        })
        .catch((e) => console.error("Sync status error:", e));
    }
  };
  const handleToggleTamper = (claimId, shouldTamper, reason) => {
    const applyTamperTransform = (c) => {
      const orig = c._originalUntampered || {
        billedAmount: c.billedAmount,
        items: c.items,
        resumeText: c.resumeText
      };
      let nextBilled = orig.billedAmount;
      let nextItems = orig.items;
      let nextResume = orig.resumeText;

      if (shouldTamper) {
        const isResumeTamper = reason && reason.toLowerCase().includes("resume");
        if (isResumeTamper) {
          nextResume = `${orig.resumeText} [Teks resume klinis dimodifikasi sepihak pasca-segel]`;
        } else if (c._tamperedData) {
          nextBilled = c._tamperedData.billedAmount;
          nextItems = c._tamperedData.items;
          nextResume = c._tamperedData.resumeText || orig.resumeText;
        } else {
          nextBilled = orig.billedAmount + 5e6;
          nextItems = [
            ...(orig.items || []),
            {
              code: "TAMPER-VIP",
              description: "Tambahan Manipulasi Tagihan Sepihak Pasca-Segel",
              amount: 5e6
            }
          ];
        }
      }

      const updated = {
        ...c,
        _originalUntampered: orig,
        billedAmount: nextBilled,
        items: nextItems,
        resumeText: nextResume,
        isTampered: shouldTamper,
        tamperReason: shouldTamper ? reason || "Salinan berkas faskes dimodifikasi sepihak" : void 0
      };
      const evalResult = evaluateClaimRules(updated);
      return {
        ...updated,
        findings: evalResult.findings,
        riskScore: evalResult.riskScore,
        riskBand: evalResult.riskBand,
        fastTrack: evalResult.fastTrack
      };
    };

    setClaims((prev) => prev.map((c) => (c.id === claimId ? applyTamperTransform(c) : c)));
    if (selectedClaim && selectedClaim.id === claimId) {
      setSelectedClaim((prev) => (prev ? applyTamperTransform(prev) : null));
    }
    const newLog = {
      id: `LOG-${Date.now().toString().slice(-4)}`,
      actor: currentUser?.name || "Admin",
      role: currentUser?.role || "admin",
      action: shouldTamper ? "SIMULASI_TAMPER_AKTIF" : "RESET_TAMPER_VAULT",
      ref: claimId,
      details: shouldTamper ? `Uji coba simulasi tamper diaktifkan: ${reason}` : "Salinan faskes dipulihkan kembali sesuai segel asli vault.",
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    };
    setAuditLogs((prev) => [newLog, ...prev]);
    showToast(
      shouldTamper ? "Simulasi Tamper Aktif: Segel terdeteksi TIDAK COCOK, aturan R-SEAL terpicu!" : "Salinan dipulihkan ke segel asli vault. Integritas kembali normal.",
      shouldTamper ? "error" : "success"
    );

    if (!currentUser?.isDemo) {
      fetch(`/api/claims/${claimId}/tamper`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          shouldTamper,
          reason,
          pairingCode: currentUser?.pairingCode,
          actor: currentUser?.name || "Admin"
        })
      })
        .then(() => {
          try {
            const ch = new BroadcastChannel("verimed_sync");
            ch.postMessage({ type: "REFRESH", pairingCode: currentUser?.pairingCode });
            ch.close();
          } catch {}
        })
        .catch((e) => console.error("Sync tamper error:", e));
    }
  };
  const handleAddNewClaim = (newClaim) => {
    setClaims((prev) => [newClaim, ...prev]);
    setSeals((prev) => [...prev, newClaim.seal]);
    const newLog = {
      id: `LOG-${Date.now().toString().slice(-4)}`,
      actor: currentUser?.name || "Faskes",
      role: "faskes",
      action: "PENGAJUAN_KLAIM",
      ref: newClaim.claimNumber,
      details: `Pengajuan klaim baru ${newClaim.primaryDiagnosis.name} (${newClaim.inacbgCode}) tersegel Ed25519.`,
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    };
    setAuditLogs((prev) => [newLog, ...prev]);
    setIsNewClaimModalOpen(false);
    showToast(`Klaim #${newClaim.claimNumber} berhasil disegel dan ditambahkan ke rantai blok.`);

    if (!currentUser?.isDemo) {
      fetch("/api/claims", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ claim: newClaim, pairingCode: currentUser?.pairingCode })
      })
        .then(() => {
          try {
            const ch = new BroadcastChannel("verimed_sync");
            ch.postMessage({ type: "REFRESH", pairingCode: currentUser?.pairingCode });
            ch.close();
          } catch {}
        })
        .catch((e) => console.error("Sync claim error:", e));
    }
  };
  const handleAddLabResult = (newLab) => {
    setLabResults((prev) => [newLab, ...prev]);
    const newLog = {
      id: `LOG-${Date.now().toString().slice(-4)}`,
      actor: currentUser?.name || "LIS Simulator",
      role: currentUser?.role || "faskes",
      action: "INGESTION_LAB_LIS",
      ref: newLab.id,
      details: `Pemeriksaan ${newLab.test} (${newLab.value} ${newLab.unit}) diterima dan disegel Level 2.`,
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    };
    setAuditLogs((prev) => [newLog, ...prev]);
    showToast(`Hasil lab ${newLab.test} (${newLab.id}) tersegel di Vault.`);

    if (!currentUser?.isDemo) {
      fetch("/api/lab-results", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ labResult: newLab, pairingCode: currentUser?.pairingCode })
      })
        .then(() => {
          try {
            const ch = new BroadcastChannel("verimed_sync");
            ch.postMessage({ type: "REFRESH", pairingCode: currentUser?.pairingCode });
            ch.close();
          } catch {}
        })
        .catch((e) => console.error("Sync lab error:", e));
    }
  };
  const handleSubmitRevision = (claimId, revisionNote, updatedDiagnosis, additionalNotes) => {
    const targetClaim = claims.find((c) => c.id === claimId);
    if (!targetClaim) return;
    const nextVersion = targetClaim.currentVersion + 1;
    const nowIso = (/* @__PURE__ */ new Date()).toISOString();
    const newClarificationMsg = {
      id: `msg-${Date.now()}`,
      senderRole: "faskes",
      senderName: currentUser?.name || "Fasilitas Kesehatan",
      message: `Tanggapan & Revisi Berkas (Versi ${nextVersion}):
${revisionNote}${additionalNotes ? `
Catatan Tambahan: ${additionalNotes}` : ""}`,
      timestamp: nowIso
    };
    const updatedDiagnosisObj = updatedDiagnosis ? { ...targetClaim.primaryDiagnosis, name: updatedDiagnosis } : targetClaim.primaryDiagnosis;
    const updatedLeaves = buildClaimLeaves({
      encounterId: targetClaim.encounterId,
      patientPseudoId: targetClaim.patientPseudoId,
      admitDate: targetClaim.admitDate,
      dischargeDate: targetClaim.dischargeDate,
      inacbgCode: targetClaim.inacbgCode,
      severity: targetClaim.severity,
      billedAmount: targetClaim.billedAmount,
      items: targetClaim.items,
      resumeText: targetClaim.resumeText,
      labRefs: targetClaim.labRefs,
      version: nextVersion
    });
    const newMerkleRoot = generateMerkleRoot(updatedLeaves);
    const newSealHash = sha256Sync(`${newMerkleRoot}|${targetClaim.seal.sealHash}|${nowIso}`);
    const newSeal = {
      id: `SEAL-${claimId}-V${nextVersion}`,
      claimId,
      claimNumber: targetClaim.claimNumber,
      merkleRoot: newMerkleRoot,
      prevSealHash: targetClaim.seal.sealHash,
      sealHash: newSealHash,
      signature: `ed25519_sig_${newSealHash.slice(0, 32)}`,
      keyId: "faskes-ed25519-prod-2026",
      createdAt: nowIso,
      leaves: updatedLeaves
    };
    const updatedClaim = {
      ...targetClaim,
      currentVersion: nextVersion,
      primaryDiagnosis: updatedDiagnosisObj,
      status: "menunggu_verifikasi",
      updatedAt: nowIso,
      seal: newSeal,
      isTampered: false,
      tamperReason: void 0,
      clarificationHistory: [
        ...targetClaim.clarificationHistory || [],
        newClarificationMsg
      ]
    };
    const evalResult = evaluateClaimRules(updatedClaim);
    const finalizedClaim = {
      ...updatedClaim,
      findings: evalResult.findings,
      riskScore: evalResult.riskScore,
      riskBand: evalResult.riskBand,
      fastTrack: evalResult.fastTrack
    };
    setClaims((prev) => prev.map((c) => c.id === claimId ? finalizedClaim : c));
    setSeals((prev) => [...prev, newSeal]);
    if (selectedClaim && selectedClaim.id === claimId) {
      setSelectedClaim(finalizedClaim);
    }
    const newLog = {
      id: `LOG-${Date.now().toString().slice(-4)}`,
      actor: currentUser?.name || "Faskes",
      role: "faskes",
      action: "REVISI_KLAIM_VERSI_BARU",
      ref: targetClaim.claimNumber,
      details: `Versi ${nextVersion} diajukan sebagai respon klarifikasi: "${revisionNote.slice(0, 80)}...". Segel baru terbentuk.`,
      timestamp: nowIso
    };
    setAuditLogs((prev) => [newLog, ...prev]);
    showToast(`Revisi Klaim #${targetClaim.claimNumber} (Versi ${nextVersion}) berhasil diajukan dan disegel kembali.`);

    if (!currentUser?.isDemo) {
      fetch(`/api/claims/${claimId}/revision`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          updatedClaim: finalizedClaim,
          newSeal,
          pairingCode: currentUser?.pairingCode,
          actor: currentUser?.name || "Faskes",
          revisionNote
        })
      })
        .then(() => {
          try {
            const ch = new BroadcastChannel("verimed_sync");
            ch.postMessage({ type: "REFRESH", pairingCode: currentUser?.pairingCode });
            ch.close();
          } catch {}
        })
        .catch((e) => console.error("Sync revision error:", e));
    }
  };
  if (!currentUser) {
    return <AuthView
      demoUsers={INITIAL_USERS}
      onLoginSuccess={(user) => {
        setCurrentUser(user);
        try {
          sessionStorage.setItem("verimed_active_user", JSON.stringify(user));
        } catch {}
        setActiveTab("dashboard");
        showToast(`Berhasil masuk sebagai ${user.name}`);
      }}
    />;
  }
  const unverifiedCount = claims.filter(
    (c) => c.status === "menunggu_verifikasi" || c.status === "ditelaah"
  ).length;
  const clarificationCount = claims.filter(
    (c) => c.status === "klarifikasi" && (currentUser.role === "faskes" ? c.facilityId === currentUser.facilityId : true)
  ).length;
  const lastSealHash = seals[seals.length - 1]?.sealHash || "0".repeat(64);
  const isAdmin = currentUser.role === "admin";
  return <div className="h-screen max-h-screen overflow-hidden bg-[#0E947A] text-slate-800 flex flex-col min-[1100px]:flex-row antialiased selection:bg-emerald-100 selection:text-emerald-900">
      {
    /* Toast Notification */
  }
      <AnimatePresence>
        {toastMessage && <motion.div
    initial={{ opacity: 0, y: -24, scale: 0.96 }}
    animate={{ opacity: 1, y: 0, scale: 1 }}
    exit={{ opacity: 0, y: -16, scale: 0.96 }}
    transition={{ type: "spring", stiffness: 360, damping: 28 }}
    className={`fixed top-5 right-6 z-50 px-4 py-3.5 rounded-2xl shadow-xl border text-xs font-semibold flex items-center gap-2.5 max-w-md backdrop-blur-md ${toastMessage.type === "error" ? "bg-rose-50/95 border-rose-300 text-rose-800" : toastMessage.type === "warning" ? "bg-amber-50/95 border-amber-300 text-amber-800" : "bg-white/95 border-emerald-200 text-emerald-900"}`}
  >
            {toastMessage.type === "error" ? <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" /> : toastMessage.type === "warning" ? <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" /> : <CheckCircle2 className="w-4 h-4 text-[#0E947A] shrink-0" />}
            <span>{toastMessage.text}</span>
          </motion.div>}
      </AnimatePresence>

      {
    /* Left Sidebar Navigation (Sits on Green Outer Frame) */
  }
      <Sidebar
    currentUser={currentUser}
    activeTab={activeTab}
    setActiveTab={(tab) => {
      if (tab === "new-claim") {
        setIsNewClaimModalOpen(true);
      } else {
        setActiveTab(tab);
      }
    }}
    onLogout={() => {
      setCurrentUser(null);
      try {
        sessionStorage.removeItem("verimed_active_user");
        localStorage.removeItem("verimed_active_user");
      } catch {}
      showToast("Anda telah keluar.");
    }}
    onSwitchRole={handleSwitchRole}
    onStartTutorial={() => setIsTutorialOpen(true)}
    unverifiedCount={unverifiedCount}
    clarificationCount={clarificationCount}
    isOpenMobile={isMobileSidebarOpen}
    onCloseMobile={() => setIsMobileSidebarOpen(false)}
  />

      {
    /* Main Rounded White Canvas (Locked to 1 Window Frame, Only Inner Content Scrolls) */
  }
      <div className="flex-1 flex flex-col h-screen max-h-screen min-w-0 min-[1100px]:py-3.5 min-[1100px]:pr-3.5 overflow-hidden">
        <div className="flex-1 bg-white min-[1100px]:rounded-[38px] flex flex-col h-full overflow-hidden relative">
          {
    /* Top Header Bar inside White Canvas (Pinned, Borderless) */
  }
          <HeaderBar
    currentUser={currentUser}
    activeTab={activeTab}
    onOpenMobileSidebar={() => setIsMobileSidebarOpen(true)}
    onSwitchRole={handleSwitchRole}
    onStartTutorial={() => setIsTutorialOpen(true)}
    unverifiedCount={unverifiedCount}
    clarificationCount={clarificationCount}
    claims={claims}
    onSelectClaim={(c) => setSelectedClaim(c)}
    onNavigateTab={(tab) => setActiveTab(tab)}
  />

          {
    /* Scrollable Inner Content Area */
  }
          <main className="flex-1 overflow-y-auto overflow-x-hidden px-5 sm:px-8 lg:px-10 pt-2 pb-8 scroll-smooth">
            <div className="max-w-7xl w-full mx-auto">
              <AnimatePresence mode="wait">
                {
    /* TAB: DASHBOARD (Distinct for Faskes vs Admin) */
  }
                {activeTab === "dashboard" && <motion.div
    key="dashboard"
    initial={{ opacity: 0, y: 14, scale: 0.992 }}
    animate={{ opacity: 1, y: 0, scale: 1 }}
    exit={{ opacity: 0, y: -10, scale: 0.995 }}
    transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
  >
                    {isAdmin ? <DashboardAdminView
    claims={claims}
    currentUser={currentUser}
    onSelectClaim={(c) => setSelectedClaim(c)}
    onGoToQueue={() => setActiveTab("claims")}
    onGoToVerificationQueue={() => setActiveTab("claims")}
    onGoToInsights={() => setActiveTab("insights")}
    onGoToAuditChain={() => setActiveTab("audit-chain")}
    onGoToAiSettings={() => setActiveTab("ai-settings")}
  /> : <DashboardFaskesView
    claims={claims}
    currentUser={currentUser}
    onOpenNewClaimModal={() => setIsNewClaimModalOpen(true)}
    onSelectClaim={(c) => setSelectedClaim(c)}
    onGoToClarifications={() => setActiveTab("klarifikasi")}
    onGoToLab={() => {
      setIsLabSimulatorOpen(true);
      setActiveTab("lab-vault");
    }}
    onGoToKlaimSaya={() => setActiveTab("claims")}
  />}
                  </motion.div>}

                {
    /* TAB: CLAIMS (Verifikasi & Daftar Klaim for Admin, Klaim Saya for Faskes) */
  }
                {(activeTab === "claims" || activeTab === "verification-queue" || activeTab === "findings") && <motion.div
    key="claims"
    initial={{ opacity: 0, y: 14, scale: 0.992 }}
    animate={{ opacity: 1, y: 0, scale: 1 }}
    exit={{ opacity: 0, y: -10, scale: 0.995 }}
    transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
  >
                    <ClaimsListView
    claims={claims}
    currentUser={currentUser}
    onSelectClaim={(c) => setSelectedClaim(c)}
    onOpenNewClaimModal={() => setIsNewClaimModalOpen(true)}
    initialSubTab={activeTab === "verification-queue" ? "queue" : activeTab === "findings" ? "findings" : void 0}
  />
                  </motion.div>}

                {
    /* TAB: LAB VAULT */
  }
                {activeTab === "lab-vault" && <motion.div
    key="lab-vault"
    initial={{ opacity: 0, y: 14, scale: 0.992 }}
    animate={{ opacity: 1, y: 0, scale: 1 }}
    exit={{ opacity: 0, y: -10, scale: 0.995 }}
    transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
  >
                    <LabVaultView
    labResults={labResults}
    currentUser={currentUser}
    onAddLabResult={handleAddLabResult}
    isOpenSimulator={isLabSimulatorOpen}
    onOpenSimulatorChange={setIsLabSimulatorOpen}
  />
                  </motion.div>}

                {
    /* TAB: KLARIFIKASI (Faskes Only) */
  }
                {!isAdmin && activeTab === "klarifikasi" && <motion.div
    key="klarifikasi"
    initial={{ opacity: 0, y: 14, scale: 0.992 }}
    animate={{ opacity: 1, y: 0, scale: 1 }}
    exit={{ opacity: 0, y: -10, scale: 0.995 }}
    transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
  >
                    <KlarifikasiFaskesView
    claims={claims}
    currentUser={currentUser}
    onSubmitRevision={handleSubmitRevision}
    onSelectClaim={(c) => setSelectedClaim(c)}
  />
                  </motion.div>}

                {
    /* TAB: PROFIL FASKES (Faskes Only) */
  }
                {!isAdmin && activeTab === "profil" && <motion.div
    key="profil"
    initial={{ opacity: 0, y: 14, scale: 0.992 }}
    animate={{ opacity: 1, y: 0, scale: 1 }}
    exit={{ opacity: 0, y: -10, scale: 0.995 }}
    transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
  >
                    <ProfilFaskesView
    currentUser={currentUser}
    claimsCount={claims.filter((c) => c.facilityId === currentUser.facilityId).length}
  />
                  </motion.div>}

                {
    /* TAB: AI SETTINGS (Admin Only) */
  }
                {isAdmin && activeTab === "ai-settings" && <motion.div
    key="ai-settings"
    initial={{ opacity: 0, y: 14, scale: 0.992 }}
    animate={{ opacity: 1, y: 0, scale: 1 }}
    exit={{ opacity: 0, y: -10, scale: 0.995 }}
    transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
  >
                    <AiSettingsView currentUser={currentUser} onShowToast={showToast} />
                  </motion.div>}

                {
    /* TAB: NATIONAL INSIGHTS (Admin Only) */
  }
                {isAdmin && activeTab === "insights" && <motion.div
    key="insights"
    initial={{ opacity: 0, y: 14, scale: 0.992 }}
    animate={{ opacity: 1, y: 0, scale: 1 }}
    exit={{ opacity: 0, y: -10, scale: 0.995 }}
    transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
  >
                    <NationalInsightsView />
                  </motion.div>}

                {
    /* TAB: AUDIT CHAIN & AUDIT LOGS (Admin Only) */
  }
                {isAdmin && (activeTab === "audit-chain" || activeTab === "audit-logs") && <motion.div
    key="audit-chain"
    initial={{ opacity: 0, y: 14, scale: 0.992 }}
    animate={{ opacity: 1, y: 0, scale: 1 }}
    exit={{ opacity: 0, y: -10, scale: 0.995 }}
    transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
  >
                    <AuditChainView seals={seals} auditLogs={auditLogs} />
                  </motion.div>}
              </AnimatePresence>
            </div>
          </main>
        </div>
      </div>

      {
    /* Claim Detail Modal */
  }
      <AnimatePresence>
        {selectedClaim && <ClaimDetailModal
    claim={selectedClaim}
    currentUser={currentUser}
    onClose={() => setSelectedClaim(null)}
    onUpdateStatus={handleUpdateClaimStatus}
    onToggleTamper={handleToggleTamper}
    onGoToAiSettings={() => setActiveTab("ai-settings")}
    onShowToast={showToast}
    onOpenClarificationModal={(c) => {
      setSelectedClaim(null);
      if (!isAdmin) {
        setActiveTab("klarifikasi");
      }
    }}
  />}
      </AnimatePresence>

      {
    /* New Claim Modal */
  }
      <AnimatePresence>
        {isNewClaimModalOpen && <NewClaimModal
    currentUser={currentUser}
    availableLabs={labResults}
    lastSealHash={lastSealHash}
    onClose={() => setIsNewClaimModalOpen(false)}
    onSubmit={handleAddNewClaim}
  />}
      </AnimatePresence>

      {
    /* Interactive Guided Tutorial (Demo Accounts Only) */
  }
      <DemoTutorialOverlay
    isOpen={isTutorialOpen}
    onClose={() => setIsTutorialOpen(false)}
    currentUser={currentUser}
    onNavigateTab={(tab) => setActiveTab(tab)}
    onSelectClaimById={(id) => {
      const found = claims.find((c) => c.id === id);
      if (found) setSelectedClaim(found);
    }}
    onCloseAllModals={() => {
      setSelectedClaim(null);
      setIsNewClaimModalOpen(false);
      setIsLabSimulatorOpen(false);
    }}
    onOpenNewClaimModal={() => setIsNewClaimModalOpen(true)}
    onOpenLabSimulator={() => {
      setActiveTab("lab-vault");
      setIsLabSimulatorOpen(true);
    }}
  />
    </div>;
}
export {
  App as default
};
