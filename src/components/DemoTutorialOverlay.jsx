import React, { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  X,
  ArrowRight,
  CheckCircle2,
  MousePointerClick,
  Lock,
  SkipForward,
  ChevronDown,
  ChevronUp
} from "lucide-react";

// Helper to check if two rectangles overlap (with safety margin)
function rectsOverlap(r1, r2, margin = 14) {
  return !(
    r1.right + margin < r2.left ||
    r1.left - margin > r2.right ||
    r1.bottom + margin < r2.top ||
    r1.top - margin > r2.bottom
  );
}

export const DemoTutorialOverlay = ({
  isOpen,
  onClose,
  currentUser,
  onNavigateTab,
  onSelectClaimById,
  onCloseAllModals,
  onOpenNewClaimModal,
  onOpenLabSimulator
}) => {
  const [stepIndex, setStepIndex] = useState(0);
  const [holeRect, setHoleRect] = useState(null);
  const [clickRect, setClickRect] = useState(null);
  const [cardSize, setCardSize] = useState({ width: 340, height: 240 });
  const [nudgeWarning, setNudgeWarning] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [isCardMinimized, setIsCardMinimized] = useState(false);

  const cardRef = useRef(null);
  const advanceTimerRef = useRef(null);

  const isAdmin = currentUser?.role === "admin";

  const adminSteps = [
    {
      id: "admin-step-1",
      title: "1. Pilih Klaim dengan Segel Bermasalah",
      actionHint: "Klik baris klaim teratas (#CLM-2026-004) yang disorot",
      badgeLabel: "KLIK DI SINI",
      description:
        "Selamat datang di tutorial VeriMed! Di Antrean Prioritas ini, AI sudah memberikan alasan awal mengapa klaim #CLM-2026-004 mencurigakan. Klik langsung baris klaim yang disorot untuk membuka pemeriksaannya!",
      highlightSelector: '[data-tour="admin-priority-claim"]',
      clickSelector: '[data-tour="admin-priority-claim"]',
      advanceDelayMs: 220,
      setup: () => {
        onCloseAllModals?.();
        onNavigateTab?.("dashboard");
      }
    },
    {
      id: "admin-step-2",
      title: "2. Baca Alasan AI & Klik 'Analisis Ulang AI'",
      actionHint: "Baca 3 poin analisis AI, lalu klik tombol 'Analisis Ulang AI'",
      badgeLabel: "KLIK DI SINI",
      description:
        "Seluruh kotak Diagnosis AI kini terbuka untuk Anda baca! Setelah selesai membaca 3 alasan mengapa segel tidak cocok, klik tombol 'Analisis Ulang AI' di kanan atas kotak tersebut untuk lanjut.",
      highlightSelector: '[data-tour="modal-ai-card"]',
      clickSelector: '[data-tour="modal-ai-reanalyze-btn"]',
      isFormStep: true,
      advanceDelayMs: 650,
      setup: () => {
        onSelectClaimById?.("CLM-004");
      }
    },
    {
      id: "admin-step-3",
      title: "3. Buka Tab 'Uji Tamper & Integritas'",
      actionHint: "Klik tab 'Uji Tamper & Integritas' yang disorot",
      badgeLabel: "KLIK DI SINI",
      description:
        "Sekarang mari kita lihat bukti forensik segelnya secara langsung. Klik tab 'Uji Tamper & Integritas' yang disorot di bagian atas jendela klaim!",
      highlightSelector: '[data-tour="modal-tab-tamper_test"]',
      clickSelector: '[data-tour="modal-tab-tamper_test"]',
      advanceDelayMs: 220,
      setup: () => {
        onSelectClaimById?.("CLM-004");
      }
    },
    {
      id: "admin-step-4",
      title: "4. Uji Pemulihan atau Manipulasi Segel",
      actionHint: "Klik tombol pemulihan / simulasi segel yang disorot",
      badgeLabel: "KLIK DI SINI",
      description:
        "Di sini Anda dapat menguji pemulihan data klaim kembali ke segel asli rumah sakit, atau mensimulasikan manipulasi tagihan untuk melihat deteksi AI secara langsung. Klik tombol yang disorot!",
      highlightSelector: '[data-tour="modal-btn-toggle-tamper"]',
      clickSelector: '[data-tour="modal-btn-toggle-tamper"]',
      advanceDelayMs: 380,
      setup: () => {
        onSelectClaimById?.("CLM-004");
        setTimeout(() => {
          if (!document.querySelector('[data-tour="modal-btn-toggle-tamper"]')) {
            document.querySelector('[data-tour="modal-tab-tamper_test"]')?.click();
          }
        }, 60);
      }
    },
    {
      id: "admin-step-5",
      title: "5. Tutup Jendela Pemeriksaan Klaim",
      actionHint: "Klik tombol Tutup (X) di pojok kanan atas modal",
      badgeLabel: "KLIK DI SINI",
      description:
        "Bagus! Anda sudah melihat bagaimana AI dan Merkle Tree mendeteksi perubahan sekecil apa pun pada klaim. Sekarang klik tombol Tutup (X) yang disorot.",
      highlightSelector: '[data-tour="modal-close-btn"]',
      clickSelector: '[data-tour="modal-close-btn"]',
      advanceDelayMs: 220,
      setup: () => {
        onSelectClaimById?.("CLM-004");
      }
    },
    {
      id: "admin-step-6",
      title: "6. Buka Brankas Bukti Mesin Lab (LIS)",
      actionHint: "Klik menu 'Vault Hasil Lab (LIS)' di navigasi kiri",
      badgeLabel: "KLIK DI SINI",
      description:
        "Terakhir, dari mana AI tahu hasil darah atau MRI pasien itu asli? Klik menu 'Vault Hasil Lab (LIS)' yang disorot di kiri untuk melihat brankas data mesin laboratorium!",
      highlightSelector: '[data-tour="sidebar-lab-vault"]',
      clickSelector: '[data-tour="sidebar-lab-vault"]',
      advanceDelayMs: 260,
      setup: () => {
        onCloseAllModals?.();
      }
    }
  ];

  const faskesSteps = [
    {
      id: "faskes-step-1",
      title: "1. Kirim Hasil Lab dari Mesin Analyzer",
      actionHint: "Klik tombol 'Kirim Hasil Lab LIS' yang disorot",
      badgeLabel: "KLIK DI SINI",
      description:
        "Selamat datang di tutorial Portal Faskes! Sebelum mengajukan klaim, bukti hasil lab pasien dikirim dari mesin analyzer ke brankas LIS. Klik tombol 'Kirim Hasil Lab LIS' yang disorot!",
      highlightSelector: '[data-tour="faskes-btn-lab"]',
      clickSelector: '[data-tour="faskes-btn-lab"]',
      advanceDelayMs: 280,
      setup: () => {
        onCloseAllModals?.();
        onNavigateTab?.("dashboard");
      }
    },
    {
      id: "faskes-step-2",
      title: "2. Silakan Coba Isi Form Lab / MRI, Lalu Segel",
      actionHint: "Coba ubah Mesin (misal ke MRI) & nilai, lalu klik 'Kirim & Segel ke Vault'",
      badgeLabel: "KLIK SAAT SELESAI ISI",
      description:
        "Seluruh form Simulator Lab kini terbuka! Silakan coba ganti Mesin Analyzer (misal ke MRI / CT-Scan), ubah ID Pasien atau nilai hasil. Jika sudah selesai mencoba, klik tombol 'Kirim & Segel ke Vault'!",
      highlightSelector: '[data-tour="lis-simulator-modal"]',
      clickSelector: '[data-tour="btn-submit-lis-simulator"]',
      isFormStep: true,
      advanceDelayMs: 280,
      setup: () => {
        onOpenLabSimulator?.();
      }
    },
    {
      id: "faskes-step-3",
      title: "3. Buka Menu 'Ajukan Klaim Baru'",
      actionHint: "Klik menu 'Ajukan Klaim Baru' di bilah navigasi kiri",
      badgeLabel: "KLIK DI SINI",
      description:
        "Hasil lab pasien sudah tersegel di Vault! Sekarang klik menu 'Ajukan Klaim Baru' yang disorot di sebelah kiri untuk membuat klaim INA-CBG.",
      highlightSelector: '[data-tour="sidebar-new-claim"]',
      clickSelector: '[data-tour="sidebar-new-claim"]',
      advanceDelayMs: 280,
      setup: () => {
        onCloseAllModals?.();
        onNavigateTab?.("lab-vault");
      }
    },
    {
      id: "faskes-step-4",
      title: "4. Silakan Isi Form Klaim & AI Grouper, Lalu Kirim",
      actionHint: "Coba fitur AI Auto-Grouper & ikat lab, lalu klik 'Segel & Kirim Klaim'",
      badgeLabel: "KLIK SAAT SELESAI ISI",
      description:
        "Seluruh form Klaim Baru kini terbuka! Silakan ketik penyakit di AI Auto-Grouper BPJS, pilih paket INA-CBG, dan ikat beberapa hasil mesin lab. Jika sudah siap, klik tombol 'Segel & Kirim Klaim' di bawah!",
      highlightSelector: '[data-tour="new-claim-modal"]',
      clickSelector: '[data-tour="btn-submit-new-claim"]',
      isFormStep: true,
      advanceDelayMs: 300,
      setup: () => {
        onOpenNewClaimModal?.();
      }
    }
  ];

  const steps = isAdmin ? adminSteps : faskesSteps;
  const currentStep = steps[stepIndex] || steps[0];

  const advanceStep = useCallback(() => {
    setIsCardMinimized(false);
    setStepIndex((prev) => {
      if (prev < steps.length - 1) {
        return prev + 1;
      } else {
        setIsCompleted(true);
        return prev;
      }
    });
  }, [steps.length]);

  // Reset when opened or role switched
  useEffect(() => {
    if (isOpen) {
      setStepIndex(0);
      setIsCompleted(false);
      setNudgeWarning(false);
      setIsCardMinimized(false);
    }
    return () => {
      if (advanceTimerRef.current) clearTimeout(advanceTimerRef.current);
    };
  }, [isOpen, isAdmin]);

  // Run step setup and scroll target into view when stepIndex changes
  useEffect(() => {
    if (!isOpen || isCompleted) return;
    const step = steps[stepIndex];
    if (step?.setup) {
      step.setup();
    }

    const scrollTimer = setTimeout(() => {
      const el = document.querySelector(step.highlightSelector);
      if (el && !step.isFormStep) {
        el.scrollIntoView({ behavior: "smooth", block: "center", inline: "nearest" });
      }
    }, 140);

    return () => clearTimeout(scrollTimer);
  }, [stepIndex, isOpen, isAdmin, isCompleted]);

  // Measure tooltip card dimensions whenever step changes
  useEffect(() => {
    if (!isOpen || isCompleted) return;
    if (cardRef.current) {
      const rect = cardRef.current.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        setCardSize({ width: Math.round(rect.width), height: Math.round(rect.height) });
      }
    }
  }, [isOpen, stepIndex, isCompleted, nudgeWarning, isCardMinimized]);

  // Continuously track both highlightRect (the unlocked area) and clickRect (the specific button that advances)
  useEffect(() => {
    if (!isOpen || isCompleted) return;
    let rafId;

    const updateRects = () => {
      const step = steps[stepIndex];
      if (step) {
        const highlightEl = document.querySelector(step.highlightSelector);
        const clickEl = document.querySelector(step.clickSelector || step.highlightSelector);

        if (highlightEl) {
          const r = highlightEl.getBoundingClientRect();
          if (r.width > 0 && r.height > 0) {
            setHoleRect((prev) => {
              const next = {
                top: Math.round(r.top),
                left: Math.round(r.left),
                width: Math.round(r.width),
                height: Math.round(r.height)
              };
              if (
                prev &&
                prev.top === next.top &&
                prev.left === next.left &&
                prev.width === next.width &&
                prev.height === next.height
              ) {
                return prev;
              }
              return next;
            });
          } else {
            setHoleRect(null);
          }
        } else {
          setHoleRect(null);
        }

        if (clickEl) {
          const cr = clickEl.getBoundingClientRect();
          if (cr.width > 0 && cr.height > 0) {
            setClickRect((prev) => {
              const next = {
                top: Math.round(cr.top),
                left: Math.round(cr.left),
                width: Math.round(cr.width),
                height: Math.round(cr.height)
              };
              if (
                prev &&
                prev.top === next.top &&
                prev.left === next.left &&
                prev.width === next.width &&
                prev.height === next.height
              ) {
                return prev;
              }
              return next;
            });
          } else {
            setClickRect(null);
          }
        } else {
          setClickRect(null);
        }
      }
      rafId = requestAnimationFrame(updateRects);
    };

    rafId = requestAnimationFrame(updateRects);
    return () => cancelAnimationFrame(rafId);
  }, [isOpen, stepIndex, isAdmin, isCompleted]);

  // Attach click listener to clickSelector so clicking the submit/target button advances the tutorial
  useEffect(() => {
    if (!isOpen || isCompleted) return;
    const step = steps[stepIndex];
    if (!step) return;

    let attachedEl = null;
    const handleTargetClick = () => {
      if (advanceTimerRef.current) clearTimeout(advanceTimerRef.current);
      advanceTimerRef.current = setTimeout(() => {
        advanceStep();
      }, step.advanceDelayMs || 220);
    };

    const pollInterval = setInterval(() => {
      const el = document.querySelector(step.clickSelector || step.highlightSelector);
      if (el && el !== attachedEl) {
        if (attachedEl) {
          attachedEl.removeEventListener("click", handleTargetClick);
        }
        attachedEl = el;
        attachedEl.addEventListener("click", handleTargetClick);
      }
    }, 100);

    return () => {
      clearInterval(pollInterval);
      if (attachedEl) {
        attachedEl.removeEventListener("click", handleTargetClick);
      }
    };
  }, [isOpen, stepIndex, isAdmin, isCompleted, advanceStep]);

  // Allow Escape key to skip tutorial
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !currentUser?.isDemo) return null;

  const handleLockedBackdropClick = (e) => {
    e.stopPropagation();
    e.preventDefault();
    setNudgeWarning(true);
    setTimeout(() => setNudgeWarning(false), 1400);
  };

  // Spotlight cutout coordinates (frames the entire form modal when isFormStep is true!)
  const pad = currentStep.isFormStep ? 6 : 8;
  const vw = typeof window !== "undefined" ? window.innerWidth : 1280;
  const vh = typeof window !== "undefined" ? window.innerHeight : 800;

  const hTop = holeRect ? Math.max(0, holeRect.top - pad) : Math.round(vh / 2);
  const hLeft = holeRect ? Math.max(0, holeRect.left - pad) : Math.round(vw / 2);
  const hWidth = holeRect ? Math.min(vw - hLeft, holeRect.width + pad * 2) : 0;
  const hHeight = holeRect ? Math.min(vh - hTop, holeRect.height + pad * 2) : 0;
  const hRight = hLeft + hWidth;
  const hBottom = hTop + hHeight;

  // Protected target zone
  const targetZone = {
    top: Math.max(0, hTop - 40),
    left: hLeft,
    right: hRight,
    bottom: hBottom
  };

  // Collision-free positioning for the floating tutorial card
  const cW = currentStep.isFormStep ? Math.min(295, vw - 24) : Math.min(345, vw - 24);
  const cH = cardSize.height || 235;
  const gap = 20;

  const clampX = (x) => Math.max(14, Math.min(vw - cW - 14, Math.round(x)));
  const clampY = (y) => Math.max(14, Math.min(vh - cH - 14, Math.round(y)));

  let chosenPos = { left: 16, top: vh - cH - 16 };

  if (currentStep.isFormStep) {
    // When user is filling out a centered modal form, dock the compact guide card in the bottom-left corner
    // (or top-left if bottom-left overlaps clickRect) so the form & submit button in the middle/right stay 100% free!
    const bottomLeftRect = { left: 16, top: vh - cH - 16, right: 16 + cW, bottom: vh - 16 };
    const clickZone = clickRect
      ? {
          left: clickRect.left - 12,
          top: clickRect.top - 36,
          right: clickRect.left + clickRect.width + 12,
          bottom: clickRect.top + clickRect.height + 12
        }
      : null;

    if (clickZone && rectsOverlap(bottomLeftRect, clickZone, 8)) {
      chosenPos = { left: 16, top: 64 };
    } else {
      chosenPos = { left: 16, top: clampY(vh - cH - 16) };
    }
  } else if (holeRect) {
    const candidates = [
      { left: clampX(hLeft), top: hBottom + gap },
      { left: clampX(hLeft), top: targetZone.top - cH - gap },
      { left: hRight + gap, top: clampY(hTop) },
      { left: hLeft - cW - gap, top: clampY(hTop) },
      { left: vw - cW - 18, top: vh - cH - 18 },
      { left: 18, top: vh - cH - 18 },
      { left: 18, top: 64 },
      { left: vw - cW - 18, top: 64 }
    ];

    const validCandidate = candidates.find((cand) => {
      const fitsViewport =
        cand.left >= 12 &&
        cand.top >= 12 &&
        cand.left + cW <= vw - 12 &&
        cand.top + cH <= vh - 12;
      if (!fitsViewport) return false;

      const candRect = {
        left: cand.left,
        top: cand.top,
        right: cand.left + cW,
        bottom: cand.top + cH
      };
      return !rectsOverlap(candRect, targetZone, 14);
    });

    if (validCandidate) {
      chosenPos = { left: Math.round(validCandidate.left), top: Math.round(validCandidate.top) };
    }
  }

  // Coordinates for the specific submit/action button badge (only if visible inside holeRect)
  const isClickInsideHole =
    clickRect &&
    holeRect &&
    clickRect.top >= hTop - 6 &&
    clickRect.top + clickRect.height <= hBottom + 6;
  const badgeTarget = isClickInsideHole ? clickRect : holeRect;

  return createPortal(
    <AnimatePresence>
      <div className="fixed inset-0 z-[9990] pointer-events-none overflow-hidden select-none">
        {/* Top-Right Always-Visible Skip Pill */}
        <div className="fixed top-4 right-4 z-[9999] pointer-events-auto flex items-center gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-2 rounded-full bg-slate-900/90 hover:bg-slate-800 text-white border border-white/15 shadow-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <SkipForward className="w-3.5 h-3.5 text-[#F5DF65]" />
            <span>Lewati Tutorial (Skip)</span>
          </button>
        </div>

        {/* Completion Celebration Modal */}
        {isCompleted ? (
          <div className="fixed inset-0 z-[9995] bg-slate-950/70 pointer-events-auto flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 text-center space-y-4"
            >
              <div className="w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-200 text-[#0E947A] flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-[#0E947A] border border-emerald-200">
                  Tutorial Selesai
                </span>
                <h3 className="text-lg font-extrabold text-slate-900 mt-2">
                  Anda Siap Menggunakan VeriMed!
                </h3>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  {isAdmin
                    ? "Anda telah mempelajari cara memeriksa alasan AI pada segel yang rusak, menjalankan simulasi uji tamper kriptografis, dan memvalidasi brankas hasil lab LIS."
                    : "Anda telah mempelajari cara mengirim hasil lab tersegel dari mesin analyzer serta mengajukan klaim INA-CBG bersegel Merkle Tree."}
                </p>
              </div>
              <div className="pt-2 flex items-center justify-center gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    setIsCompleted(false);
                    setStepIndex(0);
                  }}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
                >
                  Ulangi Tutorial
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-2.5 rounded-xl bg-[#0E947A] hover:bg-[#0B7A64] text-white text-xs font-bold shadow-md shadow-[#0E947A]/25 transition-colors cursor-pointer"
                >
                  Mulai Jelajahi Bebas
                </button>
              </div>
            </motion.div>
          </div>
        ) : (
          <>
            {/* 4 Invisible Click-Blocker Panels around the Cutout Hole (bg-transparent = ZERO visual seam lines!) */}
            <div
              onClick={handleLockedBackdropClick}
              style={{ top: 0, left: 0, right: 0, height: hTop }}
              className="fixed bg-transparent pointer-events-auto cursor-not-allowed"
            />
            <div
              onClick={handleLockedBackdropClick}
              style={{ top: hBottom, left: 0, right: 0, bottom: 0 }}
              className="fixed bg-transparent pointer-events-auto cursor-not-allowed"
            />
            <div
              onClick={handleLockedBackdropClick}
              style={{ top: hTop, left: 0, width: hLeft, height: hHeight }}
              className="fixed bg-transparent pointer-events-auto cursor-not-allowed"
            />
            <div
              onClick={handleLockedBackdropClick}
              style={{ top: hTop, left: hRight, right: 0, height: hHeight }}
              className="fixed bg-transparent pointer-events-auto cursor-not-allowed"
            />

            {/* Single Seamless Dark Spotlight Cutout + Glowing Frame */}
            {holeRect && (
              <div
                style={{
                  top: hTop,
                  left: hLeft,
                  width: hWidth,
                  height: hHeight,
                  boxShadow:
                    "0 0 0 9999px rgba(15, 23, 42, 0.72), 0 0 0 4px rgba(14, 148, 122, 0.55), 0 0 28px rgba(245, 223, 101, 0.65)"
                }}
                className="fixed z-[9992] rounded-3xl border-2 border-[#F5DF65] pointer-events-none"
              />
            )}

            {/* If isFormStep, also highlight the specific submit button inside the unlocked form */}
            {currentStep.isFormStep && isClickInsideHole && (
              <div
                style={{
                  top: clickRect.top - 4,
                  left: clickRect.left - 4,
                  width: clickRect.width + 8,
                  height: clickRect.height + 8
                }}
                className="fixed z-[9994] rounded-xl border-2 border-[#F5DF65] shadow-[0_0_18px_rgba(245,223,101,0.85)] pointer-events-none"
              />
            )}

            {/* Bouncing Pointer Badge pointing to the action/submit button */}
            {badgeTarget && (
              <motion.div
                animate={{ y: [0, -5, 0] }}
                transition={{ duration: 1.1, repeat: Infinity, ease: "easeInOut" }}
                style={{
                  top: Math.max(8, badgeTarget.top - 32),
                  left: Math.min(vw - 180, Math.max(8, badgeTarget.left))
                }}
                className="fixed z-[9996] pointer-events-none inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#F5DF65] text-slate-950 text-[10px] font-extrabold shadow-lg border border-slate-900/15"
              >
                <MousePointerClick className="w-3.5 h-3.5 text-slate-900" />
                <span>{currentStep.badgeLabel || "KLIK DI SINI"}</span>
              </motion.div>
            )}

            {/* Collision-Free Game-Style Guide Tooltip Card (with Minimize button so user can hide it while filling forms) */}
            <motion.div
              ref={cardRef}
              key={currentStep.id}
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{
                opacity: 1,
                scale: 1,
                x: nudgeWarning ? [0, -7, 7, -5, 5, 0] : 0
              }}
              transition={{ duration: 0.22 }}
              style={{
                top: chosenPos.top,
                left: chosenPos.left,
                width: cW
              }}
              className="fixed z-[9998] pointer-events-auto bg-white rounded-3xl shadow-[0_24px_60px_rgba(0,0,0,0.45)] border-2 border-[#0E947A] overflow-hidden"
            >
              {/* Header Bar */}
              <div className="px-3.5 py-2.5 bg-[#0E947A] text-white flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-white/15 flex items-center justify-center text-[#F5DF65] shrink-0">
                    <Sparkles className="w-3.5 h-3.5" />
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/20 text-[#F5DF65]">
                      Langkah {stepIndex + 1} / {steps.length}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setIsCardMinimized((prev) => !prev)}
                    className="p-1 rounded-lg text-emerald-100 hover:text-white hover:bg-white/15 transition-colors cursor-pointer"
                    title={isCardMinimized ? "Tampilkan penjelasan" : "Perkecil kartu panduan"}
                  >
                    {isCardMinimized ? (
                      <ChevronUp className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={onClose}
                    className="p-1 rounded-lg text-emerald-100 hover:text-white hover:bg-white/15 transition-colors cursor-pointer"
                    title="Tutup / Skip Tutorial"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="w-full h-1.5 bg-slate-100">
                <div
                  className="h-full bg-[#F5DF65] transition-all duration-300"
                  style={{ width: `${((stepIndex + 1) / steps.length) * 100}%` }}
                />
              </div>

              {/* Body */}
              <div className="p-3.5 space-y-2.5">
                <h3 className="text-xs sm:text-sm font-extrabold text-slate-900 leading-snug">
                  {currentStep.title}
                </h3>

                {!isCardMinimized && (
                  <>
                    <p className="text-[11px] text-slate-600 leading-relaxed">
                      {currentStep.description}
                    </p>

                    <div className="p-2 rounded-xl bg-emerald-50/90 border border-emerald-200 flex items-center gap-2 text-[11px] font-bold text-[#0E947A]">
                      <MousePointerClick className="w-3.5 h-3.5 shrink-0 animate-bounce" />
                      <span>{currentStep.actionHint}</span>
                    </div>
                  </>
                )}

                {nudgeWarning && (
                  <div className="p-2 rounded-xl bg-amber-50 border border-amber-200 text-[11px] font-semibold text-amber-800 flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                    <span>
                      Area luar dikunci sementara. Isi form yang disorot atau tekan{" "}
                      <strong>Lewati</strong>.
                    </span>
                  </div>
                )}

                {/* Footer Controls */}
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="text-[11px] font-bold text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
                  >
                    Lewati Tutorial
                  </button>

                  <button
                    type="button"
                    onClick={advanceStep}
                    className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-bold flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <span>Lanjut Manual</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </div>
    </AnimatePresence>,
    document.body
  );
};
