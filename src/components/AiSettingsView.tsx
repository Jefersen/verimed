import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AiConfigStatus, AiProvider, User } from '../types';
import {
  Cpu,
  ShieldCheck,
  Key,
  Globe,
  RefreshCw,
  Zap,
  CheckCircle2,
  AlertTriangle,
  Lock,
  Layers,
  PowerOff,
  Sparkles,
} from 'lucide-react';
import { CustomSelect } from './CustomSelect';

const DEFAULT_AI_CONFIG: AiConfigStatus = {
  connected: false,
  provider: 'gemini',
  keyHint: '',
  activeModel: '',
  modelsCount: 0,
  mode: 'fallback',
  availableModels: [],
};

interface AiSettingsViewProps {
  currentUser?: User;
  aiConfig?: AiConfigStatus;
  onUpdateAiConfig?: (newConfig: AiConfigStatus) => void;
  onShowToast?: (text: string, type?: 'success' | 'warning' | 'error') => void;
}

export const AiSettingsView: React.FC<AiSettingsViewProps> = ({
  currentUser,
  aiConfig: propAiConfig,
  onUpdateAiConfig,
  onShowToast = () => {},
}) => {
  const [currentConfig, setCurrentConfig] = useState<AiConfigStatus>(propAiConfig || DEFAULT_AI_CONFIG);
  const [provider, setProvider] = useState<AiProvider>(propAiConfig?.provider || 'gemini');
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [baseUrlInput, setBaseUrlInput] = useState('');
  const [detectedModels, setDetectedModels] = useState<string[]>(propAiConfig?.availableModels || []);
  const [selectedModel, setSelectedModel] = useState(propAiConfig?.activeModel || '');
  const [isDetecting, setIsDetecting] = useState(false);
  const [detectError, setDetectError] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [isSelectOpen, setIsSelectOpen] = useState(false);
  const [testResult, setTestResult] = useState<{
    latencyMs: number;
    testedAt: string;
    sampleOutput?: any;
  } | null>(null);
  const [testError, setTestError] = useState<string | null>(null);

  // Fetch current AI configuration from server on mount
  useEffect(() => {
    let isMounted = true;
    const fetchConfig = async () => {
      try {
        const userRole = currentUser?.role || 'admin';
        const res = await fetch('/api/settings/ai', {
          headers: { 'x-user-role': userRole },
        });
        if (res.ok && isMounted) {
          const data: AiConfigStatus = await res.json();
          setCurrentConfig(data);
          if (data.provider) setProvider(data.provider);
          if (Array.isArray(data.availableModels) && data.availableModels.length > 0) {
            setDetectedModels(data.availableModels);
            setSelectedModel(data.activeModel || data.availableModels[0]);
          } else {
            setDetectedModels([]);
            setSelectedModel('');
          }
        }
      } catch (e) {
        // Fallback / offline mode
      }
    };

    fetchConfig();
    return () => {
      isMounted = false;
    };
  }, [currentUser]);

  // Handle switching provider
  const handleProviderChange = (newP: AiProvider) => {
    setProvider(newP);
    setApiKeyInput('');
    setDetectError(null);
    // If server currently has connected key and models for this provider, show them
    if (currentConfig.connected && currentConfig.provider === newP && currentConfig.availableModels?.length > 0) {
      setDetectedModels(currentConfig.availableModels);
      setSelectedModel(currentConfig.activeModel || currentConfig.availableModels[0]);
    } else {
      setDetectedModels([]);
      setSelectedModel('');
    }
  };

  // Detect available models from provider using the given API key
  const handleDetectModels = async (keyOverride?: string) => {
    const keyToUse = (typeof keyOverride === 'string' ? keyOverride : apiKeyInput).trim();
    if (!keyToUse && !currentConfig.keyHint) {
      onShowToast('Harap masukkan API Key terlebih dahulu untuk mendeteksi model.', 'warning');
      return;
    }

    setIsDetecting(true);
    setDetectError(null);

    try {
      const userRole = currentUser?.role || 'admin';
      const res = await fetch('/api/settings/ai/detect-models', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-role': userRole,
        },
        body: JSON.stringify({
          provider,
          apiKey: keyToUse || undefined,
          baseUrl: baseUrlInput.trim() || undefined,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || 'Gagal mendeteksi model dari provider.');
      }

      if (Array.isArray(data.models) && data.models.length > 0) {
        setDetectedModels(data.models);
        if (!data.models.includes(selectedModel)) {
          setSelectedModel(data.models[0]);
        }
        onShowToast(`Berhasil mendeteksi ${data.models.length} model aktif dari ${provider.toUpperCase()}!`, 'success');
      } else {
        setDetectedModels([]);
        setSelectedModel('');
        throw new Error('Tidak ada model aktif yang ditemukan untuk API Key ini.');
      }
    } catch (err: any) {
      setDetectError(err.message || 'Gagal memindai model.');
      onShowToast(err.message || 'Gagal memindai model.', 'error');
    } finally {
      setIsDetecting(false);
    }
  };

  // Debounced auto-detection when user pastes a valid-length key
  useEffect(() => {
    const cleanKey = apiKeyInput.trim();
    if (cleanKey.length >= 28) {
      const timer = setTimeout(() => {
        handleDetectModels(cleanKey);
      }, 700);
      return () => clearTimeout(timer);
    }
  }, [apiKeyInput, provider]);

  // Connect and save selected AI configuration
  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!apiKeyInput.trim() && !currentConfig.keyHint) {
      onShowToast('Harap masukkan API Key provider AI.', 'warning');
      return;
    }
    if (!selectedModel && detectedModels.length === 0) {
      onShowToast('Silakan deteksi model terlebih dahulu sebelum menyimpan.', 'warning');
      return;
    }

    setIsConnecting(true);

    try {
      const userRole = currentUser?.role || 'admin';
      const res = await fetch('/api/settings/ai/connect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-role': userRole,
        },
        body: JSON.stringify({
          provider,
          apiKey: apiKeyInput.trim() || undefined,
          baseUrl: baseUrlInput.trim() || undefined,
          model: selectedModel || detectedModels[0],
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Gagal menghubungkan AI provider.');
      }

      const data = await res.json();
      setCurrentConfig(data.status);
      if (Array.isArray(data.status.availableModels)) {
        setDetectedModels(data.status.availableModels);
      }
      if (data.status.activeModel) {
        setSelectedModel(data.status.activeModel);
      }
      if (onUpdateAiConfig) {
        onUpdateAiConfig(data.status);
      }
      setApiKeyInput('');
      setDetectError(null);
      onShowToast(`Berhasil terhubung ke ${provider.toUpperCase()} (${data.status.activeModel}).`, 'success');
    } catch (err: any) {
      onShowToast(err.message || 'Koneksi AI gagal.', 'error');
    } finally {
      setIsConnecting(false);
    }
  };

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);
    setTestError(null);

    const targetModel = selectedModel || currentConfig.activeModel;

    try {
      const userRole = currentUser?.role || 'admin';
      const res = await fetch('/api/settings/ai/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-role': userRole,
        },
        body: JSON.stringify({
          model: targetModel,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `Pengujian model ${targetModel} gagal.`);
      }

      const data = await res.json();
      setTestResult({
        latencyMs: data.latencyMs || 185,
        testedAt: data.testedAt || new Date().toISOString(),
        sampleOutput: data.sampleOutput,
      });

      onShowToast(`Uji coba model ${targetModel} berhasil (${data.latencyMs} ms).`, 'success');
    } catch (err: any) {
      setTestError(err.message || 'Uji coba AI gagal.');
      onShowToast(err.message || 'Uji coba AI gagal.', 'error');
    } finally {
      setIsTesting(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      const userRole = currentUser?.role || 'admin';
      const res = await fetch('/api/settings/ai', {
        method: 'DELETE',
        headers: {
          'x-user-role': userRole,
        },
      });

      if (res.ok) {
        const data = await res.json();
        setCurrentConfig(data.status);
        setDetectedModels([]);
        setSelectedModel('');
        setApiKeyInput('');
        setDetectError(null);
        if (onUpdateAiConfig) {
          onUpdateAiConfig(data.status);
        }
        setTestResult(null);
        onShowToast('Koneksi AI diputus. Sistem beroperasi dalam Mode Fallback.', 'warning');
      }
    } catch (e) {
      onShowToast('Gagal memutuskan koneksi AI.', 'error');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-600 to-teal-700 text-white flex items-center justify-center shadow-xs">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-900">
                Pengaturan Koneksi Model AI (Admin Only)
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Konfigurasi provider LLM untuk ekstraksi entitas klinis otomatis resume medis berstandar evidence-grounding
              </p>
            </div>
          </div>

          <span
            className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 ${
              currentConfig.mode === 'ai' && currentConfig.connected
                ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                : 'bg-amber-100 text-amber-800 border border-amber-200'
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                currentConfig.mode === 'ai' && currentConfig.connected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
              }`}
            />
            <span>
              {currentConfig.mode === 'ai' && currentConfig.connected
                ? 'Mode AI Aktif'
                : 'Mode Fallback (Aturan)'}
            </span>
          </span>
        </div>
      </div>

      {/* Security & Architecture Note */}
      <div className="p-4 rounded-xl bg-emerald-50/80 border border-emerald-200 text-xs text-emerald-950 flex items-start gap-3">
        <Lock className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-bold">Standar Keamanan Kunci API (PRD Bagian 12 & 14):</p>
          <p className="text-emerald-900 leading-relaxed">
            Kunci API dienkripsi di sisi backend menggunakan <strong>AES-256-GCM (APP_SECRET)</strong>. Kunci tidak pernah disimpan di localStorage/sessionStorage, tidak pernah dikirim kembali ke browser secara utuh, dan disamarkan dengan *key hint* (contoh: <code>{currentConfig.keyHint || '••••••••a1b2'}</code>).
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Configuration Form */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-xs p-5 sm:p-6 space-y-5">
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-600" />
            <span>Konfigurasi Provider & Model AI</span>
          </h2>

          <form onSubmit={handleConnect} className="space-y-4">
            {/* Provider selection tabs */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-2">
                Pilih AI Provider:
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { id: 'gemini', label: 'Google Gemini', desc: 'Rekomendasi Cepat' },
                  { id: 'openai', label: 'OpenAI', desc: 'Standar Industri' },
                  { id: 'anthropic', label: 'Anthropic', desc: 'Penalaran Kompleks' },
                  { id: 'compat', label: 'OpenAI-Compat', desc: 'Endpoint Mandiri' },
                ].map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => handleProviderChange(p.id as AiProvider)}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      provider === p.id
                        ? 'border-emerald-500 bg-emerald-50/70 text-emerald-950 ring-1 ring-emerald-500'
                        : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <p className="text-xs font-bold leading-tight">{p.label}</p>
                    <p className="text-[10px] text-slate-400 mt-1">{p.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* API Key Input + Detect Button */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-slate-700">
                  API Key {provider.toUpperCase()}
                </label>
                {currentConfig.keyHint && (
                  <span className="text-[10px] text-emerald-700 font-mono bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    Tersimpan: {currentConfig.keyHint}
                  </span>
                )}
              </div>

              <div className="flex gap-2">
                <div className="relative flex-1">
                  <input
                    type="password"
                    value={apiKeyInput}
                    onChange={(e) => {
                      setApiKeyInput(e.target.value);
                      if (detectError) setDetectError(null);
                      if (!e.target.value.trim() && !currentConfig.keyHint) {
                        setDetectedModels([]);
                        setSelectedModel('');
                      }
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleDetectModels();
                      }
                    }}
                    placeholder={
                      currentConfig.keyHint
                        ? `Tersimpan terenkripsi: ${currentConfig.keyHint} (Ketik baru untuk mengganti)`
                        : `Masukkan API Key ${provider.toUpperCase()}...`
                    }
                    className="w-full px-3.5 py-2.5 text-xs font-mono border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-white"
                  />
                </div>

                <button
                  type="button"
                  onClick={() => handleDetectModels()}
                  disabled={isDetecting || (!apiKeyInput.trim() && !currentConfig.keyHint)}
                  className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:opacity-40 disabled:hover:bg-slate-900 text-white font-semibold text-xs transition-all flex items-center gap-1.5 shrink-0 shadow-xs cursor-pointer disabled:cursor-not-allowed"
                  title="Periksa API Key dan deteksi model yang tersedia"
                >
                  {isDetecting ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin text-emerald-400" />
                      <span>Mendeteksi...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                      <span>Deteksi Model</span>
                    </>
                  )}
                </button>
              </div>

              <p className="text-[10px] text-slate-400 mt-1">
                Kunci akan diverifikasi langsung ke server provider untuk mendeteksi katalog model yang aktif.
              </p>

              {/* Detect Error Alert */}
              {detectError && (
                <div className="mt-2 p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-[11px] flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-semibold">Gagal Mendeteksi Model</p>
                    <p className="text-[10px] text-rose-700 mt-0.5">{detectError}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Base URL (if custom compat) */}
            {provider === 'compat' && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Custom Base URL
                </label>
                <input
                  type="text"
                  value={baseUrlInput}
                  onChange={(e) => setBaseUrlInput(e.target.value)}
                  placeholder="https://api.my-endpoint.id/v1"
                  className="w-full px-3.5 py-2.5 text-xs font-mono border border-slate-200 rounded-xl bg-white"
                />
              </div>
            )}

            {/* Model Selection - ONLY SHOWN AFTER API KEY IS ENTERED AND MODELS DETECTED */}
            <AnimatePresence>
              {detectedModels.length > 0 ? (
                <motion.div
                  key="model-selector-section"
                  initial={{ opacity: 0, height: 0, y: -6 }}
                  animate={{ opacity: 1, height: 'auto', y: 0 }}
                  exit={{ opacity: 0, height: 0, y: -6 }}
                  transition={{ duration: 0.25, ease: 'easeOut' }}
                  className={`space-y-1.5 transition-all duration-300 ${isSelectOpen ? 'pb-48' : 'pb-0'}`}
                >
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-semibold text-slate-700">
                      Pilih Model Ekstraksi
                    </label>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        {detectedModels.length} Model Terdeteksi
                      </span>
                      <button
                        type="button"
                        onClick={() => handleDetectModels()}
                        disabled={isDetecting}
                        className="text-[10px] text-slate-500 hover:text-emerald-700 flex items-center gap-0.5 cursor-pointer"
                        title="Segarkan daftar model"
                      >
                        <RefreshCw className={`w-2.5 h-2.5 ${isDetecting ? 'animate-spin' : ''}`} />
                        <span>Segarkan</span>
                      </button>
                    </div>
                  </div>

                  <CustomSelect
                    value={selectedModel}
                    onChange={(val) => setSelectedModel(String(val))}
                    options={detectedModels.map((m) => ({
                      value: m,
                      label: m,
                      badge: provider.toUpperCase(),
                      badgeColor: 'bg-emerald-100 text-emerald-800 font-mono text-[10px]',
                    }))}
                    placeholder="Pilih Model AI yang terdeteksi..."
                    placement="bottom"
                    matchWidth={true}
                    onOpenChange={setIsSelectOpen}
                  />
                  <p className="text-[10px] text-slate-400">
                    Pilih model AI yang akan digunakan VeriMed untuk ekstraksi resume medis klinis.
                  </p>
                </motion.div>
              ) : (
                <motion.div
                  key="model-empty-state"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="p-3.5 rounded-xl border border-dashed border-slate-200 bg-slate-50/70 flex items-center gap-3 text-left"
                >
                  <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 text-slate-400 flex items-center justify-center shrink-0">
                    <Cpu className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-700">Pilihan Model Belum Ditampilkan</p>
                    <p className="text-[10px] text-slate-500 mt-0.5 leading-relaxed">
                      Masukkan API Key {provider.toUpperCase()} di atas dan klik <strong>Deteksi Model</strong> untuk memindai model yang dapat diakses.
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Action Buttons */}
            <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100">
              <div className="flex items-center gap-2">
                <button
                  type="submit"
                  disabled={isConnecting || detectedModels.length === 0}
                  className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 disabled:hover:bg-emerald-600 text-white font-bold text-xs shadow-xs transition-all flex items-center gap-2 cursor-pointer disabled:cursor-not-allowed"
                  title={detectedModels.length === 0 ? 'Deteksi model terlebih dahulu' : 'Simpan dan hubungkan model'}
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isConnecting ? 'animate-spin' : ''}`} />
                  <span>{isConnecting ? 'Menyimpan...' : 'Simpan & Hubungkan'}</span>
                </button>

                {currentConfig.connected && (
                  <button
                    type="button"
                    onClick={handleTestConnection}
                    disabled={isTesting}
                    className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <Zap className="w-3.5 h-3.5 text-amber-500" />
                    <span>{isTesting ? 'Menguji...' : 'Uji Asap (Test)'}</span>
                  </button>
                )}
              </div>

              {currentConfig.connected && (
                <button
                  type="button"
                  onClick={handleDisconnect}
                  className="px-3.5 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 rounded-xl border border-rose-200 flex items-center gap-1.5 cursor-pointer"
                >
                  <PowerOff className="w-3.5 h-3.5" />
                  <span>Putuskan AI</span>
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Right: AI Status & Live Test Output */}
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-xs p-5 space-y-3.5">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Status Operasional AI
            </h3>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Status Koneksi:</span>
                <span
                  className={`font-bold px-2 py-0.5 rounded-md ${
                    currentConfig.connected
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-slate-200 text-slate-700'
                  }`}
                >
                  {currentConfig.connected ? 'TERHUBUNG' : 'DISCONNECTED'}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-slate-500">Provider Aktif:</span>
                <strong className="text-slate-900 uppercase font-mono">
                  {currentConfig.provider}
                </strong>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-slate-500">Model Aktif:</span>
                <strong className="text-emerald-700 font-mono">
                  {currentConfig.activeModel || '(Belum dipilih)'}
                </strong>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-slate-500">Hint Kunci API:</span>
                <span className="font-mono text-slate-600">
                  {currentConfig.keyHint || 'Belum diatur'}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-slate-500">Model Terdeteksi:</span>
                <span className="font-mono text-slate-700 font-semibold">
                  {detectedModels.length > 0 ? `${detectedModels.length} model` : '-'}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-slate-500">Terakhir Diuji:</span>
                <span className="text-slate-600 font-mono text-[11px]">
                  {currentConfig.testedAt ? new Date(currentConfig.testedAt).toLocaleTimeString('id-ID') : '-'}
                </span>
              </div>
            </div>
          </div>

          {/* Test connection report if available */}
          {testResult && (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-xs p-5 space-y-2 text-xs">
              <div className="flex items-center justify-between font-bold text-slate-900">
                <span className="flex items-center gap-1.5 text-emerald-700">
                  <CheckCircle2 className="w-4 h-4" />
                  Hasil Uji Asap Berhasil
                </span>
                <span className="font-mono text-slate-500">{testResult.latencyMs} ms</span>
              </div>
              <p className="text-[11px] text-slate-500">
                Model merespons pemanggilan API secara langsung dan lolos verifikasi eksekusi.
              </p>
              {testResult.sampleOutput?.responseSnippet && (
                <div className="mt-1 p-2 bg-slate-50 rounded-lg border border-slate-200/80 font-mono text-[10px] text-slate-700">
                  Respon Model: &ldquo;{testResult.sampleOutput.responseSnippet}&rdquo;
                </div>
              )}
            </div>
          )}

          {/* Test failure report if available */}
          {testError && (
            <div className="bg-rose-50/80 rounded-2xl border border-rose-200 shadow-xs p-5 space-y-1.5 text-xs">
              <div className="flex items-center gap-1.5 font-bold text-rose-800">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>Uji Coba Model Gagal</span>
              </div>
              <p className="text-[11px] text-rose-700 leading-relaxed font-mono">
                {testError}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
