// Client-side helper to call VeriMed Backend Real AI Endpoints
// Automatically forwards saved localStorage AI credentials if the backend session was reset

const AI_STORAGE_KEY = "verimed_ai_persistent_v1";

export function getSavedClientAiConfig() {
  try {
    const raw = localStorage.getItem(AI_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    const provider = parsed.provider || parsed.currentConfig?.provider || "gemini";
    const apiKey =
      parsed.apiKeysByProvider?.[provider] ||
      parsed.apiKeys?.[provider] ||
      parsed.apiKey ||
      "";
    const model = parsed.selectedModel || parsed.currentConfig?.activeModel || "";
    const baseUrl = parsed.baseUrls?.[provider] || parsed.baseUrlInput || "";
    if (!apiKey && provider !== "compat") return null;
    return { provider, apiKey, model, baseUrl };
  } catch {
    return null;
  }
}

export async function fetchAiStatus() {
  try {
    const localCfg = getSavedClientAiConfig();
    const res = await fetch("/api/ai/status");
    if (!res.ok) {
      if (localCfg?.apiKey) {
        return {
          connected: true,
          provider: localCfg.provider,
          activeModel: localCfg.model,
          mode: "ai"
        };
      }
      return { connected: false, mode: "fallback" };
    }
    const data = await res.json();
    if (localCfg?.apiKey) {
      return {
        ...data,
        connected: true,
        provider: localCfg.provider,
        activeModel: localCfg.model || data.activeModel,
        mode: "ai"
      };
    }
    return data;
  } catch {
    const localCfg = getSavedClientAiConfig();
    if (localCfg?.apiKey) {
      return {
        connected: true,
        provider: localCfg.provider,
        activeModel: localCfg.model,
        mode: "ai"
      };
    }
    return { connected: false, mode: "fallback" };
  }
}

export async function requestAiClaimAnalysis(claim, reanalyzeCount = 1) {
  const clientConfig = getSavedClientAiConfig();
  const res = await fetch("/api/ai/analyze-claim", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      claim,
      reanalyzeCount,
      clientConfig
    })
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.success) {
    return {
      success: false,
      code: data.code || "ERROR",
      error:
        data.error ||
        "Gagal memanggil model AI. Pastikan API Key sudah dimasukkan dan dihubungkan di menu Konfigurasi AI."
    };
  }
  return data;
}

export async function requestAiInacbgGrouper(query, severity = 1) {
  const clientConfig = getSavedClientAiConfig();
  const res = await fetch("/api/ai/group-inacbg", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      query,
      severity,
      clientConfig
    })
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.success) {
    return {
      success: false,
      code: data.code || "ERROR",
      error:
        data.error ||
        "Gagal memanggil AI Auto-Grouper. Pastikan API Key AI sudah dihubungkan di menu Konfigurasi AI."
    };
  }
  return data;
}

export async function requestAiDraftNote(claim, role = "admin") {
  const clientConfig = getSavedClientAiConfig();
  const res = await fetch("/api/ai/draft-note", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      claim,
      role,
      clientConfig
    })
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.success) {
    return {
      success: false,
      code: data.code || "ERROR",
      error:
        data.error ||
        "Gagal menyusun catatan dengan AI. Pastikan API Key AI sudah dimasukkan di menu Konfigurasi AI."
    };
  }
  return data;
}

