/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { User, Claim, LabResult, Seal, AuditLogItem, ClarificationMessage } from './types';
import {
  INITIAL_USERS,
  INITIAL_CLAIMS,
  INITIAL_SEALS,
  INITIAL_LAB_RESULTS,
  INITIAL_AUDIT_LOGS,
} from './data/mockData';
import { evaluateClaimRules } from './utils/rules';
import { buildClaimLeaves, generateMerkleRoot, sha256Sync } from './utils/crypto';
import { Sidebar } from './components/Sidebar';
import { HeaderBar } from './components/HeaderBar';
import { AuthView } from './components/AuthView';
import { DashboardFaskesView } from './components/DashboardFaskesView';
import { DashboardAdminView } from './components/DashboardAdminView';
import { ClaimsListView } from './components/ClaimsListView';
import { ClaimDetailModal } from './components/ClaimDetailModal';
import { NewClaimModal } from './components/NewClaimModal';
import { LabVaultView } from './components/LabVaultView';
import { KlarifikasiFaskesView } from './components/KlarifikasiFaskesView';
import { ProfilFaskesView } from './components/ProfilFaskesView';
import { AiSettingsView } from './components/AiSettingsView';
import { NationalInsightsView } from './components/NationalInsightsView';
import { AuditChainView } from './components/AuditChainView';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, AlertTriangle, ShieldAlert } from 'lucide-react';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(INITIAL_USERS[0]);
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [claims, setClaims] = useState<Claim[]>(INITIAL_CLAIMS);
  const [seals, setSeals] = useState<Seal[]>(INITIAL_SEALS);
  const [labResults, setLabResults] = useState<LabResult[]>(INITIAL_LAB_RESULTS);
  const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>(INITIAL_AUDIT_LOGS);
  const [selectedClaim, setSelectedClaim] = useState<Claim | null>(null);
  const [isNewClaimModalOpen, setIsNewClaimModalOpen] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'warning' | 'error' } | null>(null);

  const showToast = (text: string, type: 'success' | 'warning' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  const handleSwitchRole = () => {
    if (!currentUser) return;
    const nextUser =
      currentUser.role === 'admin'
        ? INITIAL_USERS[1] // Switch to Faskes (dr. Rina Puspita - RS Siloam Kebon Jeruk)
        : INITIAL_USERS[0]; // Switch to Admin (dr. Budi Setiawan - Tim Verifikasi Nasional)
    setCurrentUser(nextUser);
    setActiveTab('dashboard');
    showToast(`Beralih peran ke: ${nextUser.name} (${nextUser.role === 'admin' ? 'Admin & Verifikator' : 'Faskes'})`);
  };

  const handleUpdateClaimStatus = (claimId: string, newStatus: Claim['status'], note: string) => {
    const nowIso = new Date().toISOString();

    setClaims((prev) =>
      prev.map((c) => {
        if (c.id === claimId) {
          const updatedHistory: ClarificationMessage[] = [...(c.clarificationHistory || [])];
          if (newStatus === 'klarifikasi' && note) {
            updatedHistory.push({
              id: `msg-${Date.now()}`,
              senderRole: 'admin',
              senderName: currentUser?.name || 'Admin Verifikator',
              message: note,
              timestamp: nowIso,
            });
          }

          return {
            ...c,
            status: newStatus,
            clarificationHistory: updatedHistory,
            updatedAt: nowIso,
          };
        }
        return c;
      })
    );

    if (selectedClaim && selectedClaim.id === claimId) {
      setSelectedClaim((prev) => {
        if (!prev) return null;
        const updatedHistory: ClarificationMessage[] = [...(prev.clarificationHistory || [])];
        if (newStatus === 'klarifikasi' && note) {
          updatedHistory.push({
            id: `msg-${Date.now()}`,
            senderRole: 'admin',
            senderName: currentUser?.name || 'Admin Verifikator',
            message: note,
            timestamp: nowIso,
          });
        }
        return {
          ...prev,
          status: newStatus,
          clarificationHistory: updatedHistory,
          updatedAt: nowIso,
        };
      });
    }

    // Add audit entry
    const newLog: AuditLogItem = {
      id: `LOG-${Date.now().toString().slice(-4)}`,
      actor: currentUser?.name || 'Admin',
      role: currentUser?.role || 'admin',
      action: `KEPUTUSAN_${newStatus.toUpperCase()}`,
      ref: selectedClaim?.claimNumber || claimId,
      details: note || `Keputusan status klaim diubah menjadi ${newStatus}.`,
      timestamp: nowIso,
    };
    setAuditLogs((prev) => [newLog, ...prev]);

    showToast(`Keputusan verifikasi disimpan: ${newStatus.replace('_', ' ')}.`);
  };

  const handleToggleTamper = (claimId: string, shouldTamper: boolean, reason?: string) => {
    setClaims((prev) =>
      prev.map((c) => {
        if (c.id === claimId) {
          const updated: Claim = {
            ...c,
            isTampered: shouldTamper,
            tamperReason: shouldTamper ? reason || 'Salinan berkas faskes dimodifikasi sepihak' : undefined,
          };
          // Re-evaluate rules
          const evalResult = evaluateClaimRules(updated);
          return {
            ...updated,
            findings: evalResult.findings,
            riskScore: evalResult.riskScore,
            riskBand: evalResult.riskBand,
            fastTrack: evalResult.fastTrack,
          };
        }
        return c;
      })
    );

    if (selectedClaim && selectedClaim.id === claimId) {
      setSelectedClaim((prev) => {
        if (!prev) return null;
        const updated: Claim = {
          ...prev,
          isTampered: shouldTamper,
          tamperReason: shouldTamper ? reason || 'Salinan berkas faskes dimodifikasi sepihak' : undefined,
        };
        const evalResult = evaluateClaimRules(updated);
        return {
          ...updated,
          findings: evalResult.findings,
          riskScore: evalResult.riskScore,
          riskBand: evalResult.riskBand,
          fastTrack: evalResult.fastTrack,
        };
      });
    }

    const newLog: AuditLogItem = {
      id: `LOG-${Date.now().toString().slice(-4)}`,
      actor: currentUser?.name || 'Admin',
      role: currentUser?.role || 'admin',
      action: shouldTamper ? 'SIMULASI_TAMPER_AKTIF' : 'RESET_TAMPER_VAULT',
      ref: claimId,
      details: shouldTamper
        ? `Uji coba simulasi tamper diaktifkan: ${reason}`
        : 'Salinan faskes dipulihkan kembali sesuai segel asli vault.',
      timestamp: new Date().toISOString(),
    };
    setAuditLogs((prev) => [newLog, ...prev]);

    showToast(
      shouldTamper
        ? 'Simulasi Tamper Aktif: Segel terdeteksi TIDAK COCOK, aturan R-SEAL terpicu!'
        : 'Salinan dipulihkan ke segel asli vault. Integritas kembali normal.',
      shouldTamper ? 'error' : 'success'
    );
  };

  const handleAddNewClaim = (newClaim: Claim) => {
    setClaims((prev) => [newClaim, ...prev]);
    setSeals((prev) => [...prev, newClaim.seal]);

    const newLog: AuditLogItem = {
      id: `LOG-${Date.now().toString().slice(-4)}`,
      actor: currentUser?.name || 'Faskes',
      role: 'faskes',
      action: 'PENGAJUAN_KLAIM',
      ref: newClaim.claimNumber,
      details: `Pengajuan klaim baru ${newClaim.primaryDiagnosis.name} (${newClaim.inacbgCode}) tersegel Ed25519.`,
      timestamp: new Date().toISOString(),
    };
    setAuditLogs((prev) => [newLog, ...prev]);

    setIsNewClaimModalOpen(false);
    showToast(`Klaim #${newClaim.claimNumber} berhasil disegel dan ditambahkan ke rantai blok.`);
  };

  const handleAddLabResult = (newLab: LabResult) => {
    setLabResults((prev) => [newLab, ...prev]);

    const newLog: AuditLogItem = {
      id: `LOG-${Date.now().toString().slice(-4)}`,
      actor: currentUser?.name || 'LIS Simulator',
      role: currentUser?.role || 'faskes',
      action: 'INGESTION_LAB_LIS',
      ref: newLab.id,
      details: `Pemeriksaan ${newLab.test} (${newLab.value} ${newLab.unit}) diterima dan disegel Level 2.`,
      timestamp: new Date().toISOString(),
    };
    setAuditLogs((prev) => [newLog, ...prev]);

    showToast(`Hasil lab ${newLab.test} (${newLab.id}) tersegel di Vault.`);
  };

  const handleSubmitRevision = (
    claimId: string,
    revisionNote: string,
    updatedDiagnosis?: string,
    additionalNotes?: string
  ) => {
    const targetClaim = claims.find((c) => c.id === claimId);
    if (!targetClaim) return;

    const nextVersion = targetClaim.currentVersion + 1;
    const nowIso = new Date().toISOString();

    const newClarificationMsg: ClarificationMessage = {
      id: `msg-${Date.now()}`,
      senderRole: 'faskes',
      senderName: currentUser?.name || 'Fasilitas Kesehatan',
      message: `Tanggapan & Revisi Berkas (Versi ${nextVersion}):\n${revisionNote}${
        additionalNotes ? `\nCatatan Tambahan: ${additionalNotes}` : ''
      }`,
      timestamp: nowIso,
    };

    const updatedDiagnosisObj = updatedDiagnosis
      ? { ...targetClaim.primaryDiagnosis, name: updatedDiagnosis }
      : targetClaim.primaryDiagnosis;

    // Build new leaves and seal
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
      version: nextVersion,
    });

    const newMerkleRoot = generateMerkleRoot(updatedLeaves);
    const newSealHash = sha256Sync(`${newMerkleRoot}|${targetClaim.seal.sealHash}|${nowIso}`);

    const newSeal: Seal = {
      id: `SEAL-${claimId}-V${nextVersion}`,
      claimId,
      claimNumber: targetClaim.claimNumber,
      merkleRoot: newMerkleRoot,
      prevSealHash: targetClaim.seal.sealHash,
      sealHash: newSealHash,
      signature: `ed25519_sig_${newSealHash.slice(0, 32)}`,
      keyId: 'faskes-ed25519-prod-2026',
      createdAt: nowIso,
      leaves: updatedLeaves,
    };

    const updatedClaim: Claim = {
      ...targetClaim,
      currentVersion: nextVersion,
      primaryDiagnosis: updatedDiagnosisObj,
      status: 'menunggu_verifikasi',
      updatedAt: nowIso,
      seal: newSeal,
      isTampered: false,
      tamperReason: undefined,
      clarificationHistory: [
        ...(targetClaim.clarificationHistory || []),
        newClarificationMsg,
      ],
    };

    // Evaluate rules
    const evalResult = evaluateClaimRules(updatedClaim);
    const finalizedClaim: Claim = {
      ...updatedClaim,
      findings: evalResult.findings,
      riskScore: evalResult.riskScore,
      riskBand: evalResult.riskBand,
      fastTrack: evalResult.fastTrack,
    };

    setClaims((prev) => prev.map((c) => (c.id === claimId ? finalizedClaim : c)));
    setSeals((prev) => [...prev, newSeal]);

    if (selectedClaim && selectedClaim.id === claimId) {
      setSelectedClaim(finalizedClaim);
    }

    const newLog: AuditLogItem = {
      id: `LOG-${Date.now().toString().slice(-4)}`,
      actor: currentUser?.name || 'Faskes',
      role: 'faskes',
      action: 'REVISI_KLAIM_VERSI_BARU',
      ref: targetClaim.claimNumber,
      details: `Versi ${nextVersion} diajukan sebagai respon klarifikasi: "${revisionNote.slice(0, 80)}...". Segel baru terbentuk.`,
      timestamp: nowIso,
    };
    setAuditLogs((prev) => [newLog, ...prev]);

    showToast(`Revisi Klaim #${targetClaim.claimNumber} (Versi ${nextVersion}) berhasil diajukan dan disegel kembali.`);
  };

  if (!currentUser) {
    return (
      <AuthView
        demoUsers={INITIAL_USERS}
        onLoginSuccess={(user) => {
          setCurrentUser(user);
          setActiveTab('dashboard');
          showToast(`Berhasil masuk sebagai ${user.name}`);
        }}
      />
    );
  }

  const unverifiedCount = claims.filter(
    (c) => c.status === 'menunggu_verifikasi' || c.status === 'ditelaah'
  ).length;

  const clarificationCount = claims.filter(
    (c) =>
      c.status === 'klarifikasi' &&
      (currentUser.role === 'faskes' ? c.facilityId === currentUser.facilityId : true)
  ).length;

  const lastSealHash = seals[seals.length - 1]?.sealHash || '0'.repeat(64);
  const isAdmin = currentUser.role === 'admin';

  return (
    <div className="min-h-screen bg-slate-50/70 text-slate-800 flex flex-col antialiased selection:bg-emerald-100 selection:text-emerald-900">
      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`fixed top-4 right-4 z-50 p-4 rounded-xl shadow-lg border text-xs font-semibold flex items-center gap-2.5 max-w-md ${
              toastMessage.type === 'error'
                ? 'bg-rose-50 border-rose-300 text-rose-800'
                : toastMessage.type === 'warning'
                ? 'bg-amber-50 border-amber-300 text-amber-800'
                : 'bg-emerald-50 border-emerald-300 text-emerald-800'
            }`}
          >
            {toastMessage.type === 'error' ? (
              <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />
            ) : toastMessage.type === 'warning' ? (
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            )}
            <span>{toastMessage.text}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Left Sidebar Navigation */}
      <Sidebar
        currentUser={currentUser}
        activeTab={activeTab}
        setActiveTab={(tab) => {
          if (tab === 'new-claim') {
            setIsNewClaimModalOpen(true);
          } else {
            setActiveTab(tab);
          }
        }}
        onLogout={() => {
          setCurrentUser(null);
          showToast('Anda telah keluar.');
        }}
        onSwitchRole={handleSwitchRole}
        unverifiedCount={unverifiedCount}
        clarificationCount={clarificationCount}
        isOpenMobile={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
      />

      {/* Main Content Area */}
      <div className="min-[1100px]:pl-72 flex flex-col min-h-screen">
        {/* Top Header Bar */}
        <HeaderBar
          currentUser={currentUser}
          activeTab={activeTab}
          onOpenMobileSidebar={() => setIsMobileSidebarOpen(true)}
          onSwitchRole={handleSwitchRole}
          unverifiedCount={unverifiedCount}
        />

        {/* Main Content Container */}
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          <AnimatePresence mode="wait">
            {/* TAB: DASHBOARD (Distinct for Faskes vs Admin) */}
            {activeTab === 'dashboard' && (
              <motion.div
                key="dashboard"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
              >
                {isAdmin ? (
                  <DashboardAdminView
                    claims={claims}
                    currentUser={currentUser}
                    onSelectClaim={(c) => setSelectedClaim(c)}
                    onGoToQueue={() => setActiveTab('claims')}
                    onGoToVerificationQueue={() => setActiveTab('claims')}
                    onGoToInsights={() => setActiveTab('insights')}
                    onGoToAuditChain={() => setActiveTab('audit-chain')}
                    onGoToAiSettings={() => setActiveTab('ai-settings')}
                  />
                ) : (
                  <DashboardFaskesView
                    claims={claims}
                    currentUser={currentUser}
                    onOpenNewClaimModal={() => setIsNewClaimModalOpen(true)}
                    onSelectClaim={(c) => setSelectedClaim(c)}
                    onGoToClarifications={() => setActiveTab('klarifikasi')}
                  />
                )}
              </motion.div>
            )}

            {/* TAB: CLAIMS (Verifikasi & Daftar Klaim for Admin, Klaim Saya for Faskes) */}
            {(activeTab === 'claims' || activeTab === 'verification-queue' || activeTab === 'findings') && (
              <motion.div
                key="claims"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
              >
                <ClaimsListView
                  claims={claims}
                  currentUser={currentUser}
                  onSelectClaim={(c) => setSelectedClaim(c)}
                  onOpenNewClaimModal={() => setIsNewClaimModalOpen(true)}
                  initialSubTab={
                    activeTab === 'verification-queue'
                      ? 'queue'
                      : activeTab === 'findings'
                      ? 'findings'
                      : undefined
                  }
                />
              </motion.div>
            )}

            {/* TAB: LAB VAULT */}
            {activeTab === 'lab-vault' && (
              <motion.div
                key="lab-vault"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
              >
                <LabVaultView
                  labResults={labResults}
                  currentUser={currentUser}
                  onAddLabResult={handleAddLabResult}
                />
              </motion.div>
            )}

            {/* TAB: KLARIFIKASI (Faskes Only) */}
            {!isAdmin && activeTab === 'klarifikasi' && (
              <motion.div
                key="klarifikasi"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
              >
                <KlarifikasiFaskesView
                  claims={claims}
                  currentUser={currentUser}
                  onSubmitRevision={handleSubmitRevision}
                  onSelectClaim={(c) => setSelectedClaim(c)}
                />
              </motion.div>
            )}

            {/* TAB: PROFIL FASKES (Faskes Only) */}
            {!isAdmin && activeTab === 'profil' && (
              <motion.div
                key="profil"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
              >
                <ProfilFaskesView
                  currentUser={currentUser}
                  claimsCount={claims.filter((c) => c.facilityId === currentUser.facilityId).length}
                />
              </motion.div>
            )}

            {/* TAB: AI SETTINGS (Admin Only) */}
            {isAdmin && activeTab === 'ai-settings' && (
              <motion.div
                key="ai-settings"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
              >
                <AiSettingsView currentUser={currentUser} onShowToast={showToast} />
              </motion.div>
            )}

            {/* TAB: NATIONAL INSIGHTS (Admin Only) */}
            {isAdmin && activeTab === 'insights' && (
              <motion.div
                key="insights"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
              >
                <NationalInsightsView />
              </motion.div>
            )}

            {/* TAB: AUDIT CHAIN & AUDIT LOGS (Admin Only) */}
            {isAdmin && (activeTab === 'audit-chain' || activeTab === 'audit-logs') && (
              <motion.div
                key="audit-chain"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
              >
                <AuditChainView seals={seals} auditLogs={auditLogs} />
              </motion.div>
            )}
          </AnimatePresence>
        </main>

        {/* Clean Footer */}
        <footer className="border-t border-slate-200/80 bg-white py-4 mt-auto">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500">
            <p>
              <strong>VeriMed</strong> • Platform Integritas & Verifikasi Kriptografis Klaim Pelayanan Kesehatan
            </p>
            <p className="font-mono text-[11px] text-emerald-700 font-semibold">
              Ed25519 & SHA-256 Merkle Engine
            </p>
          </div>
        </footer>
      </div>

      {/* Claim Detail Modal */}
      <AnimatePresence>
        {selectedClaim && (
          <ClaimDetailModal
            claim={selectedClaim}
            currentUser={currentUser}
            onClose={() => setSelectedClaim(null)}
            onUpdateStatus={handleUpdateClaimStatus}
            onToggleTamper={handleToggleTamper}
            onOpenClarificationModal={(c) => {
              setSelectedClaim(null);
              if (!isAdmin) {
                setActiveTab('klarifikasi');
              }
            }}
          />
        )}
      </AnimatePresence>

      {/* New Claim Modal */}
      <AnimatePresence>
        {isNewClaimModalOpen && (
          <NewClaimModal
            currentUser={currentUser}
            availableLabs={labResults}
            lastSealHash={lastSealHash}
            onClose={() => setIsNewClaimModalOpen(false)}
            onSubmit={handleAddNewClaim}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
