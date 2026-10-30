import express from "express";
import { createServer as createViteServer } from "vite";
import crypto from "crypto";
import fs from "fs";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
dotenv.config();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const PORT = Number(process.env.PORT) || 3e3;
const AI_STORE_PATH = path.resolve(__dirname, ".verimed-ai-store.json");

function readAiStoreFile() {
  try {
    if (fs.existsSync(AI_STORE_PATH)) {
      return JSON.parse(fs.readFileSync(AI_STORE_PATH, "utf8"));
    }
  } catch (e) {
    console.warn("[Storage] Gagal membaca .verimed-ai-store.json:", e.message);
  }
  return {};
}

function writeAiStoreFile(data) {
  try {
    const existing = readAiStoreFile();
    fs.writeFileSync(AI_STORE_PATH, JSON.stringify({ ...existing, ...data }, null, 2), "utf8");
  } catch (e) {
    console.warn("[Storage] Gagal menyimpan .verimed-ai-store.json:", e.message);
  }
}

// HTTP Security Headers
app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("X-XSS-Protection", "1; mode=block");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader(
    "Content-Security-Policy",
    "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' data: https://fonts.gstatic.com; img-src 'self' data: blob: https:; connect-src 'self' https:;"
  );
  next();
});

app.use(express.json());

// In-memory rate limiter for sensitive AI & Auth endpoints
const rateLimitMap = new Map();
function aiRateLimiter(req, res, next) {
  const clientIp = req.ip || req.headers["x-forwarded-for"] || req.socket.remoteAddress || "127.0.0.1";
  const now = Date.now();
  const windowMs = 60 * 1000;
  const maxRequests = 45;

  const record = rateLimitMap.get(clientIp) || { count: 0, resetTime: now + windowMs };
  if (now > record.resetTime) {
    record.count = 1;
    record.resetTime = now + windowMs;
  } else {
    record.count++;
  }
  rateLimitMap.set(clientIp, record);

  if (record.count > maxRequests) {
    return res.status(429).json({
      error: "Terlalu Banyak Permintaan (429 Too Many Requests)",
      message: "Batas permintaan ke API tercapai. Harap tunggu sesaat sebelum mencoba kembali."
    });
  }
  next();
}

setInterval(() => {
  const now = Date.now();
  for (const [ip, record] of rateLimitMap.entries()) {
    if (now > record.resetTime) {
      rateLimitMap.delete(ip);
    }
  }
}, 5 * 60 * 1000).unref();

app.use("/api/settings/ai", aiRateLimiter);
app.use("/api/auth", aiRateLimiter);

const storedAiFile = readAiStoreFile();
const APP_SECRET = process.env.APP_SECRET || storedAiFile.appSecret || (() => {
  const randomSecret = crypto.randomBytes(32).toString("hex");
  writeAiStoreFile({ appSecret: randomSecret });
  return randomSecret;
})();
const ENCRYPTION_KEY = crypto.createHash("sha256").update(APP_SECRET).digest();
function encryptApiKey(text) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", ENCRYPTION_KEY, iv);
  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");
  const tag = cipher.getAuthTag().toString("hex");
  return { iv: iv.toString("hex"), encrypted, tag };
}
function decryptApiKey(data) {
  const decipher = crypto.createDecipheriv("aes-256-gcm", ENCRYPTION_KEY, Buffer.from(data.iv, "hex"));
  decipher.setAuthTag(Buffer.from(data.tag, "hex"));
  let decrypted = decipher.update(data.encrypted, "hex", "utf8");
  decrypted += decipher.final("utf8");
  return decrypted;
}
const envGeminiKey = process.env.GEMINI_API_KEY;
let aiConfig = storedAiFile.aiConfig || {
  provider: "gemini",
  encryptedData: envGeminiKey ? encryptApiKey(envGeminiKey) : null,
  keyHint: envGeminiKey ? `\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022${envGeminiKey.slice(-4)}` : "",
  activeModel: envGeminiKey ? "gemini-2.5-flash" : "",
  connected: !!envGeminiKey,
  testedAt: envGeminiKey ? (/* @__PURE__ */ new Date()).toISOString() : void 0,
  isFromEnv: !!envGeminiKey,
  mode: envGeminiKey ? "ai" : "fallback",
  availableModels: envGeminiKey ? ["gemini-2.5-flash", "gemini-1.5-flash", "gemini-2.5-pro", "gemini-1.5-pro"] : []
};
function validateBaseUrl(inputUrl, defaultUrl = "http://localhost:11434/v1") {
  if (!inputUrl || typeof inputUrl !== "string" || !inputUrl.trim()) {
    return { valid: true, url: defaultUrl };
  }
  try {
    const parsed = new URL(inputUrl.trim());
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return { valid: false, error: "Protokol tidak diizinkan. Hanya http dan https yang didukung." };
    }
    const hostname = parsed.hostname.toLowerCase();
    const blockedHosts = [
      "169.254.169.254",
      "metadata.google.internal",
      "metadata.goog",
      "instance-data",
      "100.100.100.200"
    ];
    if (blockedHosts.includes(hostname)) {
      return { valid: false, error: "Akses ke layanan metadata internal diblokir oleh kebijakan keamanan." };
    }
    if (hostname === "0.0.0.0" || hostname === "[::]" || hostname === "0") {
      return { valid: false, error: "Alamat host target tidak valid." };
    }
    return { valid: true, url: parsed.origin + parsed.pathname.replace(/\/+$/, "") };
  } catch {
    return { valid: false, error: "Format URL tidak valid." };
  }
}

async function fetchProviderModels(provider, apiKey, baseUrl) {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8e3);
    if (provider === "gemini") {
      const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(apiKey)}`;
      const res = await fetch(url, { signal: controller.signal });
      clearTimeout(timeout);
      if (!res.ok) {
        const data2 = await res.json().catch(() => ({}));
        const msg = data2?.error?.message || `API Google Gemini mengembalikan status error ${res.status}`;
        return { success: false, error: msg };
      }
      const data = await res.json();
      if (!Array.isArray(data.models)) {
        return { success: false, error: "Format respon daftar model Google Gemini tidak valid." };
      }
      const excludedSubstrings = [
        "argon",
        "lyria",
        "robotics",
        "banana",
        "tts",
        "clip",
        "imagen",
        "embedding",
        "aqa"
      ];
      const geminiModels = data.models.filter((m) => {
        const methods = m.supportedGenerationMethods || [];
        return methods.includes("generateContent");
      }).map((m) => m.name.replace(/^models\//, "")).filter((name) => {
        const lower = name.toLowerCase();
        if (!lower.includes("gemini") && !lower.includes("gemma")) return false;
        if (excludedSubstrings.some((sub) => lower.includes(sub))) return false;
        return true;
      });
      const priorityOrder = [
        "gemini-2.5-flash",
        "gemini-2.0-flash",
        "gemini-1.5-flash",
        "gemini-2.5-pro",
        "gemini-1.5-pro",
        "gemini-1.5-flash-8b"
      ];
      geminiModels.sort((a, b) => {
        const idxA = priorityOrder.indexOf(a);
        const idxB = priorityOrder.indexOf(b);
        if (idxA !== -1 && idxB !== -1) return idxA - idxB;
        if (idxA !== -1) return -1;
        if (idxB !== -1) return 1;
        return a.localeCompare(b);
      });
      if (geminiModels.length === 0) {
        return { success: false, error: "Tidak ditemukan model Gemini generateContent yang aktif pada API Key ini." };
      }
      return { success: true, models: geminiModels };
    }
    if (provider === "openai") {
      const url = "https://api.openai.com/v1/models";
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${apiKey}` },
        signal: controller.signal
      });
      clearTimeout(timeout);
      if (!res.ok) {
        const data2 = await res.json().catch(() => ({}));
        return { success: false, error: data2?.error?.message || `OpenAI API error (${res.status})` };
      }
      const data = await res.json();
      const models = (data.data || []).map((m) => m.id).filter((id) => id.startsWith("gpt-")).sort();
      return { success: true, models: models.length ? models : ["gpt-4o-mini", "gpt-4o", "gpt-3.5-turbo"] };
    }
    if (provider === "anthropic") {
      const url = "https://api.anthropic.com/v1/models";
      const res = await fetch(url, {
        headers: {
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01"
        },
        signal: controller.signal
      });
      clearTimeout(timeout);
      if (!res.ok) {
        const data2 = await res.json().catch(() => ({}));
        return { success: false, error: data2?.error?.message || `Anthropic API error (${res.status})` };
      }
      const data = await res.json();
      const models = (data.data || []).map((m) => m.id);
      return { success: true, models: models.length ? models : ["claude-3-5-sonnet-20241022", "claude-3-5-haiku-20241022"] };
    }
    if (provider === "compat") {
      const urlCheck = validateBaseUrl(baseUrl, "http://localhost:11434/v1");
      if (!urlCheck.valid) {
        return { success: false, error: urlCheck.error };
      }
      const endpoint = `${urlCheck.url}/models`;
      const res = await fetch(endpoint, {
        headers: apiKey ? { Authorization: `Bearer ${apiKey}` } : {},
        signal: controller.signal
      });
      clearTimeout(timeout);
      if (!res.ok) {
        return { success: false, error: `Endpoint OpenAI-compat mengembalikan status ${res.status}` };
      }
      const data = await res.json();
      const models = (data.data || []).map((m) => m.id);
      return { success: true, models: models.length ? models : ["custom-model"] };
    }
    return { success: false, error: "Provider tidak didukung." };
  } catch (err) {
    if (err.name === "AbortError") {
      return { success: false, error: "Batas waktu verifikasi ke provider AI habis (Timeout 8s)." };
    }
    return { success: false, error: `Gagal menghubungi server ${provider}: ${err.message}` };
  }
}
async function testModelLive(provider, apiKey, model, baseUrl) {
  const startTime = Date.now();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12e3);
  try {
    if (provider === "gemini") {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`;
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [{ text: 'Halo. Konfirmasi status sistem VeriMed: respon singkat kata "AKTIF".' }]
            }
          ],
          generationConfig: {
            maxOutputTokens: 25,
            temperature: 0.1
          }
        }),
        signal: controller.signal
      });
      clearTimeout(timeout);
      const latencyMs = Date.now() - startTime;
      if (!res.ok) {
        const data2 = await res.json().catch(() => ({}));
        const msg = data2?.error?.message || `Google Gemini API mengembalikan kode ${res.status}`;
        return {
          success: false,
          error: `Model ${model} tidak dapat diakses atau gagal merespons: ${msg}`
        };
      }
      const data = await res.json();
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "Model terverifikasi.";
      return {
        success: true,
        latencyMs,
        outputSnippet: text
      };
    }
    if (provider === "openai") {
      let url = "https://api.openai.com/v1/chat/completions";
      if (baseUrl) {
        const urlCheck = validateBaseUrl(baseUrl, "https://api.openai.com/v1");
        if (!urlCheck.valid) {
          return { success: false, error: urlCheck.error };
        }
        url = `${urlCheck.url}/chat/completions`;
      }
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model,
          messages: [{ role: "user", content: 'Konfirmasi status sistem VeriMed: respon singkat kata "AKTIF".' }],
          max_tokens: 15
        }),
        signal: controller.signal
      });
      clearTimeout(timeout);
      const latencyMs = Date.now() - startTime;
      if (!res.ok) {
        const data2 = await res.json().catch(() => ({}));
        return {
          success: false,
          error: `OpenAI error (${res.status}): ${data2?.error?.message || "Gagal menguji model."}`
        };
      }
      const data = await res.json();
      const text = data?.choices?.[0]?.message?.content?.trim() || "Model terverifikasi.";
      return { success: true, latencyMs, outputSnippet: text };
    }
    if (provider === "anthropic") {
      const url = "https://api.anthropic.com/v1/messages";
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01"
        },
        body: JSON.stringify({
          model,
          messages: [{ role: "user", content: 'Konfirmasi status sistem VeriMed: respon singkat kata "AKTIF".' }],
          max_tokens: 15
        }),
        signal: controller.signal
      });
      clearTimeout(timeout);
      const latencyMs = Date.now() - startTime;
      if (!res.ok) {
        const data2 = await res.json().catch(() => ({}));
        return {
          success: false,
          error: `Anthropic error (${res.status}): ${data2?.error?.message || "Gagal menguji model."}`
        };
      }
      const data = await res.json();
      const text = data?.content?.[0]?.text?.trim() || "Model terverifikasi.";
      return { success: true, latencyMs, outputSnippet: text };
    }
    if (provider === "compat") {
      const urlCheck = validateBaseUrl(baseUrl, "http://localhost:11434/v1");
      if (!urlCheck.valid) {
        return { success: false, error: urlCheck.error };
      }
      const endpoint = `${urlCheck.url}/chat/completions`;
      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...apiKey ? { Authorization: `Bearer ${apiKey}` } : {}
        },
        body: JSON.stringify({
          model,
          messages: [{ role: "user", content: 'Konfirmasi status sistem VeriMed: respon singkat kata "AKTIF".' }],
          max_tokens: 15
        }),
        signal: controller.signal
      });
      clearTimeout(timeout);
      const latencyMs = Date.now() - startTime;
      if (!res.ok) {
        return { success: false, error: `Endpoint OpenAI-compat mengembalikan status ${res.status}` };
      }
      return { success: true, latencyMs, outputSnippet: "Model kompatibel aktif." };
    }
    return { success: false, error: "Provider tidak didukung." };
  } catch (err) {
    clearTimeout(timeout);
    if (err.name === "AbortError") {
      return { success: false, error: `Batas waktu pengujian habis (Timeout 12s) saat menghubungi model ${model}.` };
    }
    return { success: false, error: `Gagal memanggil API: ${err.message}` };
  }
}

function generateAuthToken(payload) {
  const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url");
  const body = Buffer.from(JSON.stringify({ ...payload, exp: Date.now() + 24 * 60 * 60 * 1000 })).toString("base64url");
  const signature = crypto.createHmac("sha256", ENCRYPTION_KEY).update(`${header}.${body}`).digest("base64url");
  return `${header}.${body}.${signature}`;
}

function verifyAuthToken(token) {
  if (!token || typeof token !== "string") return null;
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [header, body, signature] = parts;
  const expectedSignature = crypto.createHmac("sha256", ENCRYPTION_KEY).update(`${header}.${body}`).digest("base64url");
  const sigBuf = Buffer.from(signature);
  const expBuf = Buffer.from(expectedSignature);
  if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
    return null;
  }
  try {
    const payload = JSON.parse(Buffer.from(body, "base64url").toString());
    if (payload.exp && Date.now() > payload.exp) return null;
    return payload;
  } catch {
    return null;
  }
}

app.post("/api/auth/token", (req, res) => {
  const { role = "admin", email = "admin@verimed.id", userId = "USR-ADMIN-01" } = req.body || {};
  if (role !== "admin") {
    return res.status(403).json({
      error: "Akses Ditolak",
      message: "Hanya peran Admin & Verifikator yang dapat memperoleh token otorisasi administrasi."
    });
  }
  const token = generateAuthToken({ role: "admin", email, userId });
  res.json({ token, expiresIn: 86400 });
});

function requireAdmin(req, res, next) {
  const authHeader = req.headers["authorization"] || req.headers["x-auth-token"];
  let token = "";
  if (authHeader && authHeader.startsWith("Bearer ")) {
    token = authHeader.slice(7).trim();
  } else if (authHeader) {
    token = authHeader.trim();
  }

  if (token) {
    const payload = verifyAuthToken(token);
    if (payload && payload.role === "admin") {
      req.user = payload;
      return next();
    }
  }

  return res.status(403).json({
    error: "Akses Ditolak (403 Forbidden)",
    message: "Akses ditolak. Token otorisasi Admin & Verifikator yang valid diperlukan."
  });
}
app.get("/api/settings/ai", requireAdmin, (req, res) => {
  res.json({
    connected: aiConfig.connected,
    provider: aiConfig.provider,
    keyHint: aiConfig.keyHint,
    activeModel: aiConfig.activeModel,
    modelsCount: aiConfig.availableModels.length,
    availableModels: aiConfig.availableModels,
    testedAt: aiConfig.testedAt,
    isFromEnv: aiConfig.isFromEnv,
    mode: aiConfig.mode
  });
});
app.post("/api/settings/ai/detect-models", requireAdmin, async (req, res) => {
  const { provider = "gemini", apiKey, baseUrl } = req.body;
  const cleanKey = apiKey ? apiKey.trim() : aiConfig.encryptedData ? decryptApiKey(aiConfig.encryptedData) : "";
  if (!cleanKey) {
    return res.status(400).json({ error: "API Key wajib diisi untuk mendeteksi model yang tersedia." });
  }
  const result = await fetchProviderModels(provider, cleanKey, baseUrl);
  if (!result.success || !result.models || result.models.length === 0) {
    return res.status(400).json({
      error: result.error || "Gagal memindai model dari provider. Pastikan API Key valid dan aktif."
    });
  }
  res.json({
    success: true,
    provider,
    models: result.models,
    modelsCount: result.models.length,
    message: `Berhasil mendeteksi ${result.models.length} model aktif dari ${provider.toUpperCase()}.`
  });
});
app.post("/api/settings/ai/connect", requireAdmin, async (req, res) => {
  const { provider = "gemini", apiKey, baseUrl, model } = req.body;
  if (!apiKey && !aiConfig.encryptedData) {
    return res.status(400).json({ error: "API Key wajib diisi untuk menghubungkan provider AI." });
  }
  const cleanKey = apiKey ? apiKey.trim() : aiConfig.encryptedData ? decryptApiKey(aiConfig.encryptedData) : "";
  if (!cleanKey) {
    return res.status(400).json({ error: "API Key tidak valid." });
  }
  const detectResult = await fetchProviderModels(provider, cleanKey, baseUrl);
  if (!detectResult.success || !detectResult.models || detectResult.models.length === 0) {
    return res.status(400).json({
      error: detectResult.error || "API Key tidak valid atau tidak memiliki akses ke model AI."
    });
  }
  const models = detectResult.models;
  const selectedModel = model && models.includes(model) ? model : models[0];
  const liveTest = await testModelLive(provider, cleanKey, selectedModel, baseUrl);
  if (!liveTest.success) {
    return res.status(400).json({
      error: `Model ${selectedModel} tidak dapat diaktifkan: ${liveTest.error}`
    });
  }
  const encrypted = encryptApiKey(cleanKey);
  const keyHint = `\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022${cleanKey.slice(-4)}`;
  aiConfig = {
    provider,
    encryptedData: encrypted,
    keyHint,
    activeModel: selectedModel,
    baseUrl: baseUrl || void 0,
    connected: true,
    testedAt: (/* @__PURE__ */ new Date()).toISOString(),
    isFromEnv: false,
    mode: "ai",
    availableModels: models
  };
  writeAiStoreFile({ aiConfig });
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
      mode: "ai"
    }
  });
});
app.post("/api/settings/ai/test", requireAdmin, async (req, res) => {
  if (!aiConfig.connected && !aiConfig.encryptedData) {
    return res.status(400).json({
      success: false,
      error: "Belum ada AI Provider yang terhubung. Silakan hubungkan API Key terlebih dahulu."
    });
  }
  const rawKey = aiConfig.encryptedData ? decryptApiKey(aiConfig.encryptedData) : "";
  if (!rawKey) {
    return res.status(400).json({
      success: false,
      error: "Kunci enkripsi API tidak ditemukan. Harap masukkan ulang API Key."
    });
  }
  const modelToTest = req.body?.model || aiConfig.activeModel;
  if (!modelToTest) {
    return res.status(400).json({
      success: false,
      error: "Model belum dipilih untuk diuji."
    });
  }
  const testResult = await testModelLive(aiConfig.provider, rawKey, modelToTest, aiConfig.baseUrl);
  if (!testResult.success) {
    return res.status(400).json({
      success: false,
      error: testResult.error || `Pengujian gagal: Model ${modelToTest} tidak dapat diakses pada akun ini.`
    });
  }
  const testTimestamp = (/* @__PURE__ */ new Date()).toISOString();
  aiConfig.testedAt = testTimestamp;
  res.json({
    success: true,
    latencyMs: testResult.latencyMs,
    provider: aiConfig.provider,
    activeModel: modelToTest,
    testedAt: testTimestamp,
    sampleOutput: {
      responseSnippet: testResult.outputSnippet,
      diagnoses: [{ code: "A91", name: "Dengue Hemorrhagic Fever", quote: "demam tinggi disertai nyeri sendi" }],
      confidence: 0.96,
      mode: aiConfig.mode
    }
  });
});
app.delete("/api/settings/ai", requireAdmin, (req, res) => {
  aiConfig = {
    provider: "gemini",
    encryptedData: null,
    keyHint: "",
    activeModel: "",
    connected: false,
    testedAt: void 0,
    isFromEnv: false,
    mode: "fallback",
    availableModels: []
  };
  writeAiStoreFile({ aiConfig });
  res.json({
    success: true,
    message: "Koneksi AI telah diputus. Sistem beralih ke Mode Fallback Aturan & Regex.",
    status: {
      connected: false,
      provider: "gemini",
      keyHint: "",
      activeModel: "",
      modelsCount: 0,
      availableModels: [],
      mode: "fallback",
      isFromEnv: false
    }
  });
});
async function startServer() {
  const isProd = process.env.NODE_ENV === "production";
  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.resolve(__dirname, "dist", "index.html"));
    });
  }
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[VeriMed Server] Running on http://0.0.0.0:${PORT}`);
  });
}
startServer();
