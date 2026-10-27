import express, { Request, Response, NextFunction } from 'express';
import { createServer as createViteServer } from 'vite';
import crypto from 'crypto';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json());

// In-memory or secret-derived encryption key
const APP_SECRET = process.env.APP_SECRET || 'verimed-healthkathon-secret-key-2026-auth';
const ENCRYPTION_KEY = crypto.createHash('sha256').update(APP_SECRET).digest(); // 32 bytes

function encryptApiKey(text: string): { iv: string; encrypted: string; tag: string } {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', ENCRYPTION_KEY, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const tag = cipher.getAuthTag().toString('hex');
  return { iv: iv.toString('hex'), encrypted, tag };
}

function decryptApiKey(data: { iv: string; encrypted: string; tag: string }): string {
  const decipher = crypto.createDecipheriv('aes-256-gcm', ENCRYPTION_KEY, Buffer.from(data.iv, 'hex'));
  decipher.setAuthTag(Buffer.from(data.tag, 'hex'));
  let decrypted = decipher.update(data.encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

// Stored AI configuration in memory
interface StoredAiConfig {
  provider: 'gemini' | 'openai' | 'anthropic' | 'compat';
  encryptedData: { iv: string; encrypted: string; tag: string } | null;
  keyHint: string;
  activeModel: string;
  baseUrl?: string;
  connected: boolean;
  testedAt?: string;
  isFromEnv: boolean;
  mode: 'ai' | 'fallback';
  availableModels: string[];
}

// Check if server environment already has GEMINI_API_KEY
const envGeminiKey = process.env.GEMINI_API_KEY;
let aiConfig: StoredAiConfig = {
  provider: 'gemini',
  encryptedData: envGeminiKey ? encryptApiKey(envGeminiKey) : null,
  keyHint: envGeminiKey ? `••••••••${envGeminiKey.slice(-4)}` : '',
  activeModel: envGeminiKey ? 'gemini-2.5-flash' : '',
  connected: !!envGeminiKey,
  testedAt: envGeminiKey ? new Date().toISOString() : undefined,
  isFromEnv: !!envGeminiKey,
  mode: envGeminiKey ? 'ai' : 'fallback',
  availableModels: envGeminiKey ? ['gemini-2.5-flash', 'gemini-1.5-flash', 'gemini-2.5-pro', 'gemini-1.5-pro'] : [],
};

// Actively query provider APIs to detect available models for a given API key
async function fetchProviderModels(
  provider: 'gemini' | 'openai' | 'anthropic' | 'compat',
  apiKey: string,
  baseUrl?: string
): Promise<{ success: boolean; models?: string[]; error?: string }> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    if (provider === 'gemini') {
      const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(apiKey)}`;
      const res = await fetch(url, { signal: controller.signal });
      clearTimeout(timeout);

      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as any;
        const msg = data?.error?.message || `API Google Gemini mengembalikan status error ${res.status}`;
        return { success: false, error: msg };
      }

      const data = (await res.json()) as any;
      if (!Array.isArray(data.models)) {
        return { success: false, error: 'Format respon daftar model Google Gemini tidak valid.' };
      }

      // Filter for models supporting generateContent and clinical text generation
      const excludedSubstrings = [
        'argon',
        'lyria',
        'robotics',
        'banana',
        'tts',
        'clip',
        'imagen',
        'embedding',
        'aqa',
      ];

      const geminiModels = data.models
        .filter((m: any) => {
          const methods = m.supportedGenerationMethods || [];
          return methods.includes('generateContent');
        })
        .map((m: any) => m.name.replace(/^models\//, ''))
        .filter((name: string) => {
          const lower = name.toLowerCase();
          if (!lower.includes('gemini') && !lower.includes('gemma')) return false;
          if (excludedSubstrings.some((sub) => lower.includes(sub))) return false;
          return true;
        });

      const priorityOrder = [
        'gemini-2.5-flash',
        'gemini-2.0-flash',
        'gemini-1.5-flash',
        'gemini-2.5-pro',
        'gemini-1.5-pro',
        'gemini-1.5-flash-8b',
      ];
      geminiModels.sort((a: string, b: string) => {
        const idxA = priorityOrder.indexOf(a);
        const idxB = priorityOrder.indexOf(b);
        if (idxA !== -1 && idxB !== -1) return idxA - idxB;
        if (idxA !== -1) return -1;
        if (idxB !== -1) return 1;
        return a.localeCompare(b);
      });

      if (geminiModels.length === 0) {
        return { success: false, error: 'Tidak ditemukan model Gemini generateContent yang aktif pada API Key ini.' };
      }

      return { success: true, models: geminiModels };
    }

    if (provider === 'openai') {
      const url = 'https://api.openai.com/v1/models';
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${apiKey}` },
        signal: controller.signal,
      });
      clearTimeout(timeout);

      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as any;
        return { success: false, error: data?.error?.message || `OpenAI API error (${res.status})` };
      }

      const data = (await res.json()) as any;
      const models = (data.data || [])
        .map((m: any) => m.id)
        .filter((id: string) => id.startsWith('gpt-'))
        .sort();

      return { success: true, models: models.length ? models : ['gpt-4o-mini', 'gpt-4o', 'gpt-3.5-turbo'] };
    }

    if (provider === 'anthropic') {
      const url = 'https://api.anthropic.com/v1/models';
      const res = await fetch(url, {
        headers: {
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
        },
        signal: controller.signal,
      });
      clearTimeout(timeout);

      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as any;
        return { success: false, error: data?.error?.message || `Anthropic API error (${res.status})` };
      }

      const data = (await res.json()) as any;
      const models = (data.data || []).map((m: any) => m.id);
      return { success: true, models: models.length ? models : ['claude-3-5-sonnet-20241022', 'claude-3-5-haiku-20241022'] };
    }

    if (provider === 'compat') {
      const endpoint = baseUrl ? `${baseUrl.replace(/\/+$/, '')}/models` : 'http://localhost:11434/v1/models';
      const res = await fetch(endpoint, {
        headers: apiKey ? { Authorization: `Bearer ${apiKey}` } : {},
        signal: controller.signal,
      });
      clearTimeout(timeout);

      if (!res.ok) {
        return { success: false, error: `Endpoint OpenAI-compat mengembalikan status ${res.status}` };
      }

      const data = (await res.json()) as any;
      const models = (data.data || []).map((m: any) => m.id);
      return { success: true, models: models.length ? models : ['custom-model'] };
    }

    return { success: false, error: 'Provider tidak didukung.' };
  } catch (err: any) {
    if (err.name === 'AbortError') {
      return { success: false, error: 'Batas waktu verifikasi ke provider AI habis (Timeout 8s).' };
    }
    return { success: false, error: `Gagal menghubungi server ${provider}: ${err.message}` };
  }
}

// Actively ping the selected provider and model to verify access and responsiveness
async function testModelLive(
  provider: 'gemini' | 'openai' | 'anthropic' | 'compat',
  apiKey: string,
  model: string,
  baseUrl?: string
): Promise<{ success: boolean; latencyMs?: number; outputSnippet?: string; error?: string }> {
  const startTime = Date.now();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12000);

  try {
    if (provider === 'gemini') {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              role: 'user',
              parts: [{ text: 'Halo. Konfirmasi status sistem VeriMed: respon singkat kata "AKTIF".' }],
            },
          ],
          generationConfig: {
            maxOutputTokens: 25,
            temperature: 0.1,
          },
        }),
        signal: controller.signal,
      });
      clearTimeout(timeout);
      const latencyMs = Date.now() - startTime;

      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as any;
        const msg = data?.error?.message || `Google Gemini API mengembalikan kode ${res.status}`;
        return {
          success: false,
          error: `Model ${model} tidak dapat diakses atau gagal merespons: ${msg}`,
        };
      }

      const data = (await res.json()) as any;
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || 'Model terverifikasi.';
      return {
        success: true,
        latencyMs,
        outputSnippet: text,
      };
    }

    if (provider === 'openai') {
      const url = baseUrl ? `${baseUrl.replace(/\/+$/, '')}/chat/completions` : 'https://api.openai.com/v1/chat/completions';
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          messages: [{ role: 'user', content: 'Konfirmasi status sistem VeriMed: respon singkat kata "AKTIF".' }],
          max_tokens: 15,
        }),
        signal: controller.signal,
      });
      clearTimeout(timeout);
      const latencyMs = Date.now() - startTime;

      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as any;
        return {
          success: false,
          error: `OpenAI error (${res.status}): ${data?.error?.message || 'Gagal menguji model.'}`,
        };
      }

      const data = (await res.json()) as any;
      const text = data?.choices?.[0]?.message?.content?.trim() || 'Model terverifikasi.';
      return { success: true, latencyMs, outputSnippet: text };
    }

    if (provider === 'anthropic') {
      const url = 'https://api.anthropic.com/v1/messages';
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model,
          messages: [{ role: 'user', content: 'Konfirmasi status sistem VeriMed: respon singkat kata "AKTIF".' }],
          max_tokens: 15,
        }),
        signal: controller.signal,
      });
      clearTimeout(timeout);
      const latencyMs = Date.now() - startTime;

      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as any;
        return {
          success: false,
          error: `Anthropic error (${res.status}): ${data?.error?.message || 'Gagal menguji model.'}`,
        };
      }

      const data = (await res.json()) as any;
      const text = data?.content?.[0]?.text?.trim() || 'Model terverifikasi.';
      return { success: true, latencyMs, outputSnippet: text };
    }

    if (provider === 'compat') {
      const endpoint = baseUrl ? `${baseUrl.replace(/\/+$/, '')}/chat/completions` : 'http://localhost:11434/v1/chat/completions';
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
        },
        body: JSON.stringify({
          model,
          messages: [{ role: 'user', content: 'Konfirmasi status sistem VeriMed: respon singkat kata "AKTIF".' }],
          max_tokens: 15,
        }),
        signal: controller.signal,
      });
      clearTimeout(timeout);
      const latencyMs = Date.now() - startTime;

      if (!res.ok) {
        return { success: false, error: `Endpoint OpenAI-compat mengembalikan status ${res.status}` };
      }

      return { success: true, latencyMs, outputSnippet: 'Model kompatibel aktif.' };
    }

    return { success: false, error: 'Provider tidak didukung.' };
  } catch (err: any) {
    clearTimeout(timeout);
    if (err.name === 'AbortError') {
      return { success: false, error: `Batas waktu pengujian habis (Timeout 12s) saat menghubungi model ${model}.` };
    }
    return { success: false, error: `Gagal memanggil API: ${err.message}` };
  }
}

// RBAC Middleware: Enforces that Admin-only routes cannot be accessed by Faskes
function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const role = req.headers['x-user-role'];
  if (role !== 'admin') {
    return res.status(403).json({
      error: 'Akses Ditolak (403 Forbidden)',
      message: 'Hanya peran Admin & Verifikator yang memiliki izin mengakses data/pengaturan ini.',
    });
  }
  next();
}

// -------------------------------------------------------------
// AI SETTINGS ROUTES (ADMIN ONLY)
// -------------------------------------------------------------
app.get('/api/settings/ai', requireAdmin, (req: Request, res: Response) => {
  res.json({
    connected: aiConfig.connected,
    provider: aiConfig.provider,
    keyHint: aiConfig.keyHint,
    activeModel: aiConfig.activeModel,
    modelsCount: aiConfig.availableModels.length,
    availableModels: aiConfig.availableModels,
    testedAt: aiConfig.testedAt,
    isFromEnv: aiConfig.isFromEnv,
    mode: aiConfig.mode,
  });
});

// Detect models endpoint: Validates API key against provider and returns available models
app.post('/api/settings/ai/detect-models', requireAdmin, async (req: Request, res: Response) => {
  const { provider = 'gemini', apiKey, baseUrl } = req.body;

  const cleanKey = apiKey ? apiKey.trim() : (aiConfig.encryptedData ? decryptApiKey(aiConfig.encryptedData) : '');
  if (!cleanKey) {
    return res.status(400).json({ error: 'API Key wajib diisi untuk mendeteksi model yang tersedia.' });
  }

  const result = await fetchProviderModels(provider, cleanKey, baseUrl);
  if (!result.success || !result.models || result.models.length === 0) {
    return res.status(400).json({
      error: result.error || 'Gagal memindai model dari provider. Pastikan API Key valid dan aktif.',
    });
  }

  res.json({
    success: true,
    provider,
    models: result.models,
    modelsCount: result.models.length,
    message: `Berhasil mendeteksi ${result.models.length} model aktif dari ${provider.toUpperCase()}.`,
  });
});

app.post('/api/settings/ai/connect', requireAdmin, async (req: Request, res: Response) => {
  const { provider = 'gemini', apiKey, baseUrl, model } = req.body;

  if (!apiKey && !aiConfig.encryptedData) {
    return res.status(400).json({ error: 'API Key wajib diisi untuk menghubungkan provider AI.' });
  }

  const cleanKey = apiKey ? apiKey.trim() : (aiConfig.encryptedData ? decryptApiKey(aiConfig.encryptedData) : '');
  if (!cleanKey) {
    return res.status(400).json({ error: 'API Key tidak valid.' });
  }

  // Actively detect available models for this key
  const detectResult = await fetchProviderModels(provider, cleanKey, baseUrl);
  if (!detectResult.success || !detectResult.models || detectResult.models.length === 0) {
    return res.status(400).json({
      error: detectResult.error || 'API Key tidak valid atau tidak memiliki akses ke model AI.',
    });
  }

  const models = detectResult.models;
  const selectedModel = model && models.includes(model) ? model : models[0];

  // Verify that the chosen model is truly accessible before activating
  const liveTest = await testModelLive(provider, cleanKey, selectedModel, baseUrl);
  if (!liveTest.success) {
    return res.status(400).json({
      error: `Model ${selectedModel} tidak dapat diaktifkan: ${liveTest.error}`,
    });
  }

  // Encrypt and store key safely
  const encrypted = encryptApiKey(cleanKey);
  const keyHint = `••••••••${cleanKey.slice(-4)}`;

  aiConfig = {
    provider,
    encryptedData: encrypted,
    keyHint,
    activeModel: selectedModel,
    baseUrl: baseUrl || undefined,
    connected: true,
    testedAt: new Date().toISOString(),
    isFromEnv: false,
    mode: 'ai',
    availableModels: models,
  };

  res.json({
    success: true,
    message: `Koneksi AI berhasil terhubung ke ${provider.toUpperCase()} (Model: ${selectedModel}).`,
    status: {
      connected: true,
      provider: aiConfig.provider,
      keyHint,
      activeModel: selectedModel,
      modelsCount: models.length,
      availableModels: models,
      testedAt: aiConfig.testedAt,
      isFromEnv: false,
      mode: 'ai',
    },
  });
});

app.post('/api/settings/ai/test', requireAdmin, async (req: Request, res: Response) => {
  if (!aiConfig.connected && !aiConfig.encryptedData) {
    return res.status(400).json({
      success: false,
      error: 'Belum ada AI Provider yang terhubung. Silakan hubungkan API Key terlebih dahulu.',
    });
  }

  const rawKey = aiConfig.encryptedData ? decryptApiKey(aiConfig.encryptedData) : '';
  if (!rawKey) {
    return res.status(400).json({
      success: false,
      error: 'Kunci enkripsi API tidak ditemukan. Harap masukkan ulang API Key.',
    });
  }

  const modelToTest = req.body?.model || aiConfig.activeModel;
  if (!modelToTest) {
    return res.status(400).json({
      success: false,
      error: 'Model belum dipilih untuk diuji.',
    });
  }

  // Actively test live against the provider API
  const testResult = await testModelLive(aiConfig.provider, rawKey, modelToTest, aiConfig.baseUrl);

  if (!testResult.success) {
    return res.status(400).json({
      success: false,
      error: testResult.error || `Pengujian gagal: Model ${modelToTest} tidak dapat diakses pada akun ini.`,
    });
  }

  const testTimestamp = new Date().toISOString();
  aiConfig.testedAt = testTimestamp;

  res.json({
    success: true,
    latencyMs: testResult.latencyMs,
    provider: aiConfig.provider,
    activeModel: modelToTest,
    testedAt: testTimestamp,
    sampleOutput: {
      responseSnippet: testResult.outputSnippet,
      diagnoses: [{ code: 'A91', name: 'Dengue Hemorrhagic Fever', quote: 'demam tinggi disertai nyeri sendi' }],
      confidence: 0.96,
      mode: aiConfig.mode,
    },
  });
});

app.delete('/api/settings/ai', requireAdmin, (req: Request, res: Response) => {
  aiConfig = {
    provider: 'gemini',
    encryptedData: null,
    keyHint: '',
    activeModel: '',
    connected: false,
    testedAt: undefined,
    isFromEnv: false,
    mode: 'fallback',
    availableModels: [],
  };

  res.json({
    success: true,
    message: 'Koneksi AI telah diputus. Sistem beralih ke Mode Fallback Aturan & Regex.',
    status: {
      connected: false,
      provider: 'gemini',
      keyHint: '',
      activeModel: '',
      modelsCount: 0,
      availableModels: [],
      mode: 'fallback',
      isFromEnv: false,
    },
  });
});

// -------------------------------------------------------------
// VITE SPA DEV & STATIC SERVING
// -------------------------------------------------------------
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[VeriMed Server] Running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
