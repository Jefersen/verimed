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
app.use("/api/ai", aiRateLimiter);
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
  activeModel: envGeminiKey ? "gemini-3.5-flash-lite" : "",
  connected: !!envGeminiKey,
  testedAt: envGeminiKey ? (/* @__PURE__ */ new Date()).toISOString() : void 0,
  isFromEnv: !!envGeminiKey,
  mode: envGeminiKey ? "ai" : "fallback",
  availableModels: envGeminiKey ? ["gemini-3.5-flash-lite", "gemini-3.8-flash", "gemini-flash-latest"] : []
};
if (aiConfig && Array.isArray(aiConfig.availableModels)) {
  const nonTextKeywords = ["argon", "lyria", "robotics", "banana", "tts", "clip", "imagen", "embedding", "aqa", "image", "transcribe", "computer-use", "customtools", "audio"];
  aiConfig.availableModels = aiConfig.availableModels.filter(
    (m) => !nonTextKeywords.some((kw) => m.toLowerCase().includes(kw))
  );
}
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
        "aqa",
        "image",
        "transcribe",
        "computer-use",
        "customtools",
        "audio"
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
        "gemini-3.5-flash-lite",
        "gemini-flash-lite-latest",
        "gemini-3.8-flash",
        "gemini-flash-latest",
        "gemma-4-26b-a4b-it",
        "gemini-3.6-flash",
        "gemini-3.7-flash",
        "gemini-3.5-flash",
        "gemini-3.1-flash-lite",
        "gemini-2.5-flash",
        "gemini-2.5-pro"
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
  const timeout = setTimeout(() => controller.abort(), 20e3);
  try {
    if (provider === "gemini") {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`;
      let res;
      for (let attempt = 1; attempt <= 2; attempt++) {
        const attemptCtrl = new AbortController();
        const attemptTimer = setTimeout(() => attemptCtrl.abort(), 8000);
        try {
          res = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [
                {
                  role: "user",
                  parts: [{ text: "Tes sistem VeriMed: respon 1 kata AKTIF." }]
                }
              ],
              generationConfig: {
                maxOutputTokens: 25,
                temperature: 0.1
              }
            }),
            signal: attemptCtrl.signal
          });
          clearTimeout(attemptTimer);
          if (res.status !== 503 && res.status !== 429) break;
        } catch {
          clearTimeout(attemptTimer);
        }
        if (attempt < 2) await new Promise((r) => setTimeout(r, 1000));
      }
      clearTimeout(timeout);
      const latencyMs = Date.now() - startTime;
      if (!res || !res.ok) {
        const data2 = res ? await res.json().catch(() => ({})) : {};
        console.log('[DEBUG Google err]:', res ? res.status : 500, JSON.stringify(data2));
        const status = res ? res.status : 500;
        const msg = data2?.error?.message || `Google Gemini API mengembalikan kode ${status}`;
        const isBusy = status === 503 || status === 429;
        return {
          success: false,
          status,
          error: isBusy
            ? `Model ${model} saat ini sedang mengalami lonjakan beban (HTTP 503 High Demand) di server Google. Harap coba beberapa saat lagi atau pilih model flash-lite.`
            : `Model ${model} tidak dapat diakses atau gagal merespons: ${msg}`
        };
      }
      const data = await res.json();
      const parts = data?.candidates?.[0]?.content?.parts || [];
      const text = parts.filter((p) => typeof p.text === "string" && !p.thought).map((p) => p.text).join("").trim() || "Model terverifikasi.";
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
      return { success: false, error: `Batas waktu pengujian habis saat menghubungi model ${model}. Server Google atau model tersebut sedang sibuk, silakan coba lagi.` };
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
  aiConfig.activeModel = modelToTest;
  writeAiStoreFile({ aiConfig });
  res.json({
    success: true,
    latencyMs: testResult.latencyMs,
    provider: aiConfig.provider,
    activeModel: modelToTest,
    testedAt: testTimestamp,
    sampleOutput: {
      responseSnippet: testResult.outputSnippet,
      diagnoses: [{ code: "A91", name: "Dengue Hemorrhagic Fever", quote: testResult.outputSnippet }],
      confidence: 0.98,
      mode: aiConfig.mode
    }
  });
});
// Ganti model aktif tanpa memasukkan ulang API Key (dipanggil saat dropdown model diubah)
app.post("/api/settings/ai/model", requireAdmin, (req, res) => {
  const { model } = req.body || {};
  if (!model || typeof model !== "string") {
    return res.status(400).json({ success: false, error: "Nama model wajib diisi." });
  }
  if (!aiConfig.encryptedData) {
    return res.status(400).json({ success: false, error: "API Key belum dihubungkan. Hubungkan API Key terlebih dahulu." });
  }
  if (Array.isArray(aiConfig.availableModels) && aiConfig.availableModels.length > 0 && !aiConfig.availableModels.includes(model)) {
    return res.status(400).json({ success: false, error: `Model ${model} tidak ada di daftar model terdeteksi untuk API Key ini.` });
  }
  aiConfig.activeModel = model;
  writeAiStoreFile({ aiConfig });
  console.log(`[AI] Model aktif diganti ke: ${model}`);
  res.json({ success: true, activeModel: model, message: `Model aktif diganti ke ${model}.` });
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

// ============================================================================
// REAL LLM INFERENCE ENGINE & ENDPOINTS (VeriMed AI Co-Pilot & Auto-Grouper)
// ============================================================================

function extractJsonFromText(rawText) {
  if (!rawText || typeof rawText !== "string") return null;
  const trimmed = rawText.trim();
  const fencedMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fencedMatch ? fencedMatch[1].trim() : trimmed;
  try {
    return JSON.parse(candidate);
  } catch {
    const firstBrace = candidate.indexOf("{");
    const lastBrace = candidate.lastIndexOf("}");
    if (firstBrace !== -1 && lastBrace > firstBrace) {
      try {
        return JSON.parse(candidate.slice(firstBrace, lastBrace + 1));
      } catch {
        return null;
      }
    }
    return null;
  }
}

async function callActiveLlm({ systemPrompt, userPrompt, temperature = 0.75, maxTokens = 1200, clientConfig, responseSchema }) {
  let provider = clientConfig?.provider || aiConfig.provider || "gemini";
  let rawKey = "";
  let model = clientConfig?.model || aiConfig.activeModel || "";
  let baseUrl = clientConfig?.baseUrl || aiConfig.baseUrl || "";

  if (clientConfig && typeof clientConfig.apiKey === "string" && clientConfig.apiKey.trim()) {
    rawKey = clientConfig.apiKey.trim();
  } else if (aiConfig.encryptedData) {
    try {
      rawKey = decryptApiKey(aiConfig.encryptedData);
    } catch {
      rawKey = "";
    }
  }

  // Always keep server aiConfig synchronized with the user's latest selected model, provider & key
  if (rawKey) {
    const prevKey = aiConfig.encryptedData ? (() => {
      try { return decryptApiKey(aiConfig.encryptedData); } catch { return ""; }
    })() : "";
    const keyChanged = rawKey !== prevKey;
    const modelChanged = model && model !== aiConfig.activeModel;
    const providerChanged = provider && provider !== aiConfig.provider;

    if (keyChanged || modelChanged || providerChanged || !aiConfig.connected) {
      const encrypted = keyChanged || !aiConfig.encryptedData ? encryptApiKey(rawKey) : aiConfig.encryptedData;
      aiConfig = {
        ...aiConfig,
        provider,
        encryptedData: encrypted,
        keyHint: `••••••••${rawKey.slice(-4)}`,
        activeModel: model || aiConfig.activeModel || "gemini-3.7-flash",
        baseUrl: baseUrl || aiConfig.baseUrl || void 0,
        connected: true,
        mode: "ai",
        availableModels: aiConfig.availableModels?.length ? aiConfig.availableModels : (model ? [model] : [])
      };
      writeAiStoreFile({ aiConfig });
    }
  }

  if (!rawKey && provider !== "compat") {
    return {
      success: false,
      code: "NO_API_KEY",
      error: "API Key AI belum dimasukkan atau belum dihubungkan. Silakan masuk ke menu Konfigurasi AI (peran Admin) dan simpan API Key terlebih dahulu."
    };
  }

  if (!model) {
    model = provider === "gemini" ? "gemini-3.7-flash" : provider === "openai" ? "gpt-4o-mini" : provider === "anthropic" ? "claude-3-5-haiku-20241022" : "custom-model";
  }

  const startTime = Date.now();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 120000);

  try {
    if (provider === "gemini") {
      const generationConfig = {
        temperature,
        maxOutputTokens: Math.max(maxTokens, 8192),
        responseMimeType: "application/json",
        ...(responseSchema ? { responseSchema } : {})
      };

      const requestBody = JSON.stringify({
        systemInstruction: systemPrompt ? { parts: [{ text: systemPrompt }] } : void 0,
        contents: [
          {
            role: "user",
            parts: [{ text: userPrompt }]
          }
        ],
        generationConfig
      });

      // Utamakan model yang dipilih pengguna (model), dengan retry hingga 2x jika server Google sedang 503/429
      let res = null;
      let usedModel = model;
      let isFailover = false;

      // Coba model pilihan pengguna terlebih dahulu
      for (let attempt = 1; attempt <= 2; attempt++) {
        const attemptCtrl = new AbortController();
        const attemptTimer = setTimeout(() => attemptCtrl.abort(), 16000);
        try {
          const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(rawKey)}`;
          res = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: requestBody,
            signal: attemptCtrl.signal
          });
          clearTimeout(attemptTimer);
          if (res.ok) {
            usedModel = model;
            break;
          }
          if (res.status !== 503 && res.status !== 429) {
            break;
          }
          console.warn(`[AI] Model ${model} mengembalikan HTTP ${res.status}, mencoba ulang (${attempt}/2)...`);
          if (attempt < 2) await new Promise((r) => setTimeout(r, 1200));
        } catch (attemptErr) {
          clearTimeout(attemptTimer);
          console.warn(`[AI] Model ${model} batas waktu habis pada percobaan (${attempt}/2)...`);
          if (attempt < 2) await new Promise((r) => setTimeout(r, 1000));
        }
      }

      // Jika model pilihan pengguna sedang 503 atau overload, gunakan cadangan HANYA untuk permintaan saat ini
      // Pengaturan model pengguna di sistem TIDAK PERNAH diubah / di-overwrite!
      if (!res || !res.ok) {
        const backupModels = ["gemini-3.5-flash-lite", "gemini-flash-lite-latest", "gemini-3.8-flash"].filter((m) => m !== model);
        for (const backup of backupModels) {
          console.warn(`[AI] Menggunakan model cadangan sementara ${backup} untuk permintaan ini...`);
          const backupCtrl = new AbortController();
          const backupTimer = setTimeout(() => backupCtrl.abort(), 16000);
          try {
            const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(backup)}:generateContent?key=${encodeURIComponent(rawKey)}`;
            const backupRes = await fetch(url, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: requestBody,
              signal: backupCtrl.signal
            });
            clearTimeout(backupTimer);
            if (backupRes.ok) {
              res = backupRes;
              usedModel = backup;
              isFailover = true;
              break;
            }
          } catch {
            clearTimeout(backupTimer);
          }
        }
      }

      clearTimeout(timeout);
      const latencyMs = Date.now() - startTime;
      if (!res || !res.ok) {
        const errData = res ? await res.json().catch(() => ({})) : {};
        const status = res ? res.status : 500;
        const msg = errData?.error?.message || `Google Gemini API mengembalikan status ${status}`;
        console.warn(`[AI] Gagal ${usedModel}: ${status} ${msg}`);
        return {
          success: false,
          code: status === 503 || status === 429 ? "MODEL_BUSY" : "PROVIDER_ERROR",
          provider,
          model: usedModel,
          requestedModel: model,
          error: `Model ${model} sedang mengalami lonjakan beban tinggi (HTTP ${status}) di server Google Gemini. Silakan coba klik Analisis Ulang kembali.`
        };
      }

      const data = await res.json();
      const candidate = data?.candidates?.[0];
      // Gabungkan semua bagian teks (abaikan bagian "thought" internal model)
      const text = (candidate?.content?.parts || [])
        .filter((p) => typeof p.text === "string" && !p.thought)
        .map((p) => p.text)
        .join("")
        .trim();
      console.log(
        `[AI] ${usedModel} OK ${latencyMs}ms finish=${candidate?.finishReason} out=${data?.usageMetadata?.candidatesTokenCount} thoughts=${data?.usageMetadata?.thoughtsTokenCount || 0}`
      );
      if (!text) {
        return {
          success: false,
          code: "EMPTY_RESPONSE",
          provider,
          model: usedModel,
          error: `Model ${usedModel} mengembalikan respons kosong (finishReason: ${candidate?.finishReason || "-"}).`
        };
      }
      return {
        success: true,
        provider,
        model: usedModel,
        requestedModel: model,
        isFailover,
        latencyMs,
        rawText: text,
        parsed: extractJsonFromText(text)
      };
    }

    if (provider === "openai" || provider === "compat") {
      let url = "https://api.openai.com/v1/chat/completions";
      if (provider === "compat" || baseUrl) {
        const urlCheck = validateBaseUrl(baseUrl, provider === "compat" ? "http://localhost:11434/v1" : "https://api.openai.com/v1");
        if (!urlCheck.valid) {
          clearTimeout(timeout);
          return { success: false, code: "INVALID_URL", error: urlCheck.error };
        }
        url = `${urlCheck.url}/chat/completions`;
      }
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(rawKey ? { Authorization: `Bearer ${rawKey}` } : {})
        },
        body: JSON.stringify({
          model,
          messages: [
            ...(systemPrompt ? [{ role: "system", content: systemPrompt }] : []),
            { role: "user", content: userPrompt }
          ],
          temperature,
          max_tokens: maxTokens
        }),
        signal: controller.signal
      });
      clearTimeout(timeout);
      const latencyMs = Date.now() - startTime;
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        return {
          success: false,
          code: "PROVIDER_ERROR",
          provider,
          model,
          error: `Error dari ${provider.toUpperCase()} (${res.status}): ${errData?.error?.message || "Gagal memproses prompt."}`
        };
      }
      const data = await res.json();
      const text = data?.choices?.[0]?.message?.content?.trim() || "";
      return {
        success: true,
        provider,
        model,
        latencyMs,
        rawText: text,
        parsed: extractJsonFromText(text)
      };
    }

    if (provider === "anthropic") {
      const url = "https://api.anthropic.com/v1/messages";
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": rawKey,
          "anthropic-version": "2023-06-01"
        },
        body: JSON.stringify({
          model,
          system: systemPrompt || void 0,
          messages: [{ role: "user", content: userPrompt }],
          temperature,
          max_tokens: maxTokens
        }),
        signal: controller.signal
      });
      clearTimeout(timeout);
      const latencyMs = Date.now() - startTime;
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        return {
          success: false,
          code: "PROVIDER_ERROR",
          provider,
          model,
          error: `Anthropic API error (${res.status}): ${errData?.error?.message || "Gagal memproses prompt."}`
        };
      }
      const data = await res.json();
      const text = data?.content?.[0]?.text?.trim() || "";
      return {
        success: true,
        provider,
        model,
        latencyMs,
        rawText: text,
        parsed: extractJsonFromText(text)
      };
    }

    clearTimeout(timeout);
    return { success: false, code: "UNSUPPORTED_PROVIDER", error: "Provider AI tidak dikenali." };
  } catch (err) {
    clearTimeout(timeout);
    if (err.name === "AbortError") {
      return {
        success: false,
        code: "TIMEOUT",
        provider,
        model,
        error: `Waktu tunggu panggilan AI habis (Timeout 120s) pada model ${model}. Model mungkin sedang sibuk, coba lagi atau pilih model yang lebih ringan (misal varian "flash-lite").`
      };
    }
    return {
      success: false,
      code: "NETWORK_ERROR",
      provider,
      model,
      error: `Gagal menghubungi layanan AI (${provider}): ${err.message}`
    };
  }
}

app.get("/api/ai/status", (req, res) => {
  res.json({
    connected: aiConfig.connected && !!aiConfig.encryptedData,
    provider: aiConfig.provider,
    activeModel: aiConfig.activeModel,
    keyHint: aiConfig.keyHint,
    mode: aiConfig.connected && !!aiConfig.encryptedData ? "ai" : "fallback"
  });
});

app.post("/api/ai/analyze-claim", async (req, res) => {
  const { claim, reanalyzeCount = 1, clientConfig } = req.body || {};
  if (!claim) {
    return res.status(400).json({ success: false, error: "Data klaim tidak ditemukan." });
  }

  const claimNum = claim.claimNumber || claim.id || "KLAIM-001";
  const facility = claim.facilityName || claim.hospital || "Fasilitas Kesehatan Terdaftar";
  const billedTotal = Number(claim.billedAmount ?? claim.billedTariff ?? 0);
  const inacbgTariffVal = Number(claim.inacbgTariff ?? 0);
  const dxTitle = claim.primaryDiagnosis?.name || claim.diagnosis || "Diagnosis Klinis";
  const dxCode = claim.primaryDiagnosis?.code || (typeof claim.diagnosis === "string" ? (claim.diagnosis.match(/\(([^)]+)\)/)?.[1] || "A00") : "A00");
  const los = claim.losDays || claim.los || 1;
  const resume = claim.resumeText || claim.medicalNotes || "Resume medis pasien terlampir pada berkas.";
  const isTampered = !!claim.isTampered;
  const tamperInfo = claim.tamperReason || claim.tamperAnomalyText || (isTampered ? "Ketidakcocokan hash daun Merkle pasca-segel vault" : "Segel valid dan utuh");

  const vaultLeaf2 = claim.seal?.leaves?.find((l) => l.id === "L2")?.dataSnippet || "Data segel rincian tagihan (Leaf #2)";
  const vaultLeaf3 = claim.seal?.leaves?.find((l) => l.id === "L3")?.dataSnippet || "Data segel resume klinis (Leaf #3)";

  const currentItemsText = (claim.items || [])
    .map((it) => `${it.code}: ${it.description} (Rp ${Number(it.amount || 0).toLocaleString("id-ID")})`)
    .join("; ") || "Rincian item tagihan terlampir pada klaim";

  const labRefsText = (claim.labRefs || [])
    .map((lb) => `${lb.testName || lb.test}: ${lb.value} ${lb.unit || ""} (ID: ${lb.labResultId || lb.id})`)
    .join("; ") || "Tidak ada hasil lab terikat";

  const findingsText = (claim.findings || [])
    .map((f) => `[${f.ruleId}] ${f.title}: ${f.description}`)
    .join("\n") || (claim.appliedRules ? claim.appliedRules.join("\n") : "Tidak ada temuan pelanggaran aturan.");

  const styleAngles = [
    "Fokuskan gaya bahasa pada audit forensik kriptografi & kepatuhan regulasi klaim JKN-BPJS.",
    "Gunakan gaya bahasa auditor medis senior yang tajam, lugas, dan membedah bukti klinis vs rincian tagihan secara kontras.",
    "Sajikan dengan narasi investigasi verifikator klaim rumah sakit yang menyoroti risiko finansial, dampak integritas Merkle Tree, dan bukti objektif laboratorium.",
    "Gunakan sudut pandang konsultan Casemix INA-CBG & keamanan siber medis yang menguraikan kronologi anomali secara sistematis."
  ];
  const chosenAngle = styleAngles[(reanalyzeCount - 1) % styleAngles.length];

  const systemPrompt = `Anda adalah VeriMed AI Co-Pilot, sistem kecerdasan buatan audit klinis JKN-BPJS (Permenkes No. 3/2023) dan forensik kriptografi (SHA-256 Merkle Tree & tanda tangan digital Ed25519).
Tugas Anda: Menganalisis data klaim rumah sakit berikut dan menghasilkan penjelasan mendalam dalam format JSON murni.
Penting: Ini adalah pemanggilan analisis ke-${reanalyzeCount} (Timestamp: ${new Date().toISOString()}). ${chosenAngle} Susun kalimat yang segar, spesifik pada angka/item klaim ini, dan JANGAN menyalin kalimat template kaku.`;

  const userPrompt = `Analisis klaim berikut secara menyeluruh:
- Nomor Klaim: #${claimNum} (${facility})
- Paket INA-CBG: ${claim.inacbgCode || "-"} (${claim.inacbgDescription || ""}) | Severity: Level ${claim.severity || 1}
- Diagnosis Primer: ${dxTitle} (${dxCode})
- Lama Rawat (LOS): ${los} hari | Total Tagihan Billed: Rp ${billedTotal.toLocaleString("id-ID")} ${inacbgTariffVal ? `| Tarif Paket INA-CBG: Rp ${inacbgTariffVal.toLocaleString("id-ID")}` : ""}
- Status Integritas Segel Kriptografis: ${isTampered ? `RUSAK / TAMPERED (${tamperInfo})` : "UTUH & VALID (100% cocok dengan segel Ed25519 Vault)"}
- Data Asli Leaf #2 di Segel Vault: ${vaultLeaf2}
- Data Asli Leaf #3 di Segel Vault: ${vaultLeaf3}
- Rincian Item Tagihan Saat Ini: ${currentItemsText}
- Resume Medis Saat Ini: "${resume}"
- Bukti Lab/Mesin di Vault: ${labRefsText}
- Temuan Aturan:
${findingsText}

Kembalikan HANYA JSON valid dengan struktur:
{
  "badgeText": "Label singkat status AI (maks 6 kata)",
  "summary": "Ringkasan eksekutif 2 kalimat yang menjelaskan kesimpulan utama AI secara spesifik terhadap klaim #${claimNum}.",
  "details": [
    {
      "title": "1. [Judul poin 1 sesuai kasus]",
      "text": "Penjelasan spesifik menyebutkan item/angka/nilai lab pada klaim ini."
    },
    {
      "title": "2. [Judul poin 2]",
      "text": "Penjelasan mekanisme Merkle Tree SHA-256 atau Permenkes No. 3/2023."
    },
    {
      "title": "3. Rekomendasi Tindakan untuk Verifikator",
      "text": "Langkah konkret yang harus diambil verifikator."
    }
  ],
  "findingExplanations": {},
  "suggestedNote": "1-2 kalimat draft catatan verifikator resmi."
}`;

  const forensicSchema = {
    type: "OBJECT",
    properties: {
      badgeText: { type: "STRING" },
      summary: { type: "STRING" },
      details: {
        type: "ARRAY",
        items: {
          type: "OBJECT",
          properties: {
            title: { type: "STRING" },
            text: { type: "STRING" }
          },
          required: ["title", "text"]
        }
      },
      suggestedNote: { type: "STRING" }
    },
    required: ["summary", "details"]
  };

  const llmResult = await callActiveLlm({
    systemPrompt,
    userPrompt,
    temperature: reanalyzeCount > 1 ? 0.88 : 0.72,
    maxTokens: 1800,
    clientConfig,
    responseSchema: forensicSchema
  });

  if (!llmResult.success) {
    return res.status(400).json({
      success: false,
      code: llmResult.code,
      error: llmResult.error,
      provider: llmResult.provider,
      model: llmResult.model
    });
  }

  // Gracefully normalize output so PARSE_ERROR is never thrown if the model returned real text
  let parsed = llmResult.parsed;
  const rawText = String(llmResult.rawText || "").trim();

  if (!parsed || typeof parsed !== "object") {
    parsed = {
      badgeText: `Audit Live AI (${llmResult.model})`,
      summary: rawText.slice(0, 260) || `Hasil analisis otomatis AI untuk klaim #${claimNum} oleh model ${llmResult.model}.`,
      details: [
        {
          title: "1. Analisis Klinis & Kriptografi",
          text: rawText.length > 260 ? rawText.slice(260, 800) : (rawText || "Pemeriksaan live model AI selesai diproses.")
        },
        {
          title: "2. Evaluasi Integritas & Kesesuaian Tarif",
          text: isTampered ? `Ditemukan ketidaksesuaian integritas data pada segel klaim: ${tamperInfo}.` : "Integritas kriptografis segel utuh dan sesuai data awal."
        },
        {
          title: "3. Rekomendasi Verifikator",
          text: isTampered ? "Tolak berkas yang dimanipulasi atau minta faskes mengembalikan ke segel asli vault." : "Lanjutkan proses verifikasi sesuai bukti pendukung."
        }
      ]
    };
  } else {
    if (!parsed.summary) {
      parsed.summary = parsed.ringkasan || parsed.overview || parsed.kesimpulan || rawText.slice(0, 260) || "Pemeriksaan klaim live AI selesai.";
    }
    if (!Array.isArray(parsed.details) || parsed.details.length === 0) {
      const alt = parsed.analysis || parsed.points || parsed.poin || parsed.rincian || parsed.items;
      if (Array.isArray(alt) && alt.length > 0) {
        parsed.details = alt.map((it, idx) => {
          if (typeof it === "string") return { title: `${idx + 1}. Poin Analisis`, text: it };
          return { title: it.title || it.judul || `${idx + 1}. Poin Analisis`, text: it.text || it.deskripsi || it.penjelasan || "" };
        });
      } else {
        parsed.details = [
          {
            title: "1. Evaluasi AI",
            text: typeof parsed.summary === "string" ? parsed.summary : "Pemeriksaan klinis dan forensik AI berhasil."
          }
        ];
      }
    }
  }

  return res.json({
    success: true,
    provider: llmResult.provider,
    model: llmResult.model,
    requestedModel: llmResult.requestedModel,
    isFailover: !!llmResult.isFailover,
    latencyMs: llmResult.latencyMs,
    analyzedAt: new Date().toISOString(),
    reanalyzeCount,
    reasoning: {
      badgeText: parsed.badgeText || `Analisis Live AI (${llmResult.model})`,
      summary: parsed.summary,
      details: parsed.details.slice(0, 4),
      findingExplanations: parsed.findingExplanations || {},
      suggestedNote: parsed.suggestedNote || ""
    }
  });
});

app.post("/api/ai/group-inacbg", async (req, res) => {
  const { query, severity = 1, clientConfig } = req.body || {};
  if (!query || !String(query).trim()) {
    return res.status(400).json({ success: false, error: "Keluhan atau nama penyakit wajib diisi." });
  }

  const rom = severity === 3 || severity === 4 ? "III" : severity === 2 ? "II" : "I";
  const systemPrompt = `Anda adalah Sistem AI Auto-Grouper INA-CBG JKN-BPJS Kesehatan sesuai Standar Tarif Permenkes RI No. 3 Tahun 2023 dan ICD-10.
Tugas Anda adalah memetakan keluhan klinis, penyakit, atau tindakan medis yang diketik petugas rumah sakit ke dalam kode ICD-10, Casemix Main Group (CMG), kode paket INA-CBG (format: [Huruf CMG]-[Digit Tipe 1 untuk Prosedur Bedah / 4 untuk Rawat Inap Non-Bedah]-[2 digit kelompok]-[Romawi Severity I/II/III]), estimasi tarif paket BPJS yang realistis (dalam Rupiah), serta draf resume medis klinis.`;

  const userPrompt = `Petakan input penyakit/tindakan berikut ke paket INA-CBG BPJS Kesehatan:
- Input Keluhan / Penyakit / Tindakan: "${String(query).trim()}"
- Tingkat Keparahan (Severity) yang dipilih: Severity ${severity} (Romawi: ${rom})

Kembalikan HANYA objek JSON valid dengan struktur persis berikut:
{
  "code": "Kode INA-CBG berakhiran -${rom} (contoh: A-4-14-${rom} atau I-4-10-${rom} atau M-1-50-${rom})",
  "name": "Nama Paket INA-CBG Bahasa Indonesia yang spesifik dan resmi",
  "defaultSev": ${Number(severity) || 1},
  "defaultAmount": 5500000,
  "dxCode": "Kode ICD-10 Primer yang akurat (contoh: A01.0, E11.9, J45.9, I63.9)",
  "dxName": "Nama Diagnosis ICD-10 resmi",
  "cmg": "Nama CMG (contoh: CMG A — Penyakit Infeksi & Parasit Sistemik)",
  "resume": "Paragraf resume medis klinis (2-3 kalimat) yang memuat keluhan utama, pemeriksaan fisik/penunjang, dan terapi yang diberikan sesuai standar klaim BPJS.",
  "aiReason": "Penjelasan singkat (2 kalimat) dari AI mengapa keluhan tersebut dipetakan ke ICD-10, CMG, dan kode tarif INA-CBG tersebut berdasarkan Permenkes No. 3/2023."
}`;

  const groupingSchema = {
    type: "OBJECT",
    properties: {
      code: { type: "STRING" },
      name: { type: "STRING" },
      defaultSev: { type: "INTEGER" },
      defaultAmount: { type: "INTEGER" },
      dxCode: { type: "STRING" },
      dxName: { type: "STRING" },
      cmg: { type: "STRING" },
      resume: { type: "STRING" },
      aiReason: { type: "STRING" }
    },
    required: ["code", "name", "dxCode", "dxName"]
  };

  const llmResult = await callActiveLlm({
    systemPrompt,
    userPrompt,
    temperature: 0.65,
    maxTokens: 1200,
    clientConfig,
    responseSchema: groupingSchema
  });

  if (!llmResult.success) {
    return res.status(400).json({
      success: false,
      code: llmResult.code,
      error: llmResult.error,
      provider: llmResult.provider,
      model: llmResult.model
    });
  }

  const parsed = llmResult.parsed || {};
  const codeVal = parsed.code || "A-4-10-" + rom;
  const dxCodeVal = parsed.dxCode || "A00";

  return res.json({
    success: true,
    provider: llmResult.provider,
    model: llmResult.model,
    latencyMs: llmResult.latencyMs,
    grouped: {
      code: String(codeVal).toUpperCase(),
      name: parsed.name || `Paket INA-CBG ${codeVal}`,
      defaultSev: Number(parsed.defaultSev) || Number(severity) || 1,
      defaultAmount: Number(parsed.defaultAmount) || 4850000,
      dxCode: String(dxCodeVal).toUpperCase(),
      dxName: parsed.dxName || String(query).trim(),
      cmg: parsed.cmg || "CMG — Kelompok Kasus Medis JKN",
      resume: parsed.resume || "",
      aiReason: parsed.aiReason || ""
    }
  });
});

app.post("/api/ai/draft-note", async (req, res) => {
  const { claim, role = "admin", clientConfig } = req.body || {};
  if (!claim) {
    return res.status(400).json({ success: false, error: "Data klaim wajib disertakan." });
  }

  const findingsSummary = (claim.findings || [])
    .map((f) => `${f.ruleId} (${f.title}): ${f.description}`)
    .join("; ") || "Tidak ada temuan pelanggaran.";

  const systemPrompt = role === "admin"
    ? "Anda adalah Verifikator Senior BPJS Kesehatan pada sistem VeriMed. Buat 1 paragraf (2-3 kalimat) catatan telaah verifikator / permintaan klarifikasi yang sopan, tegas, dan spesifik merujuk pada temuan klaim."
    : "Anda adalah Dokter Penanggung Jawab Pelayanan (DPJP) / Tim Casemix RS pada sistem VeriMed. Buat 1 paragraf (2-3 kalimat) tanggapan klarifikasi klinis yang profesional untuk menjawab pertanyaan verifikator berdasarkan data resume dan lab.";

  const userPrompt = `Data Klaim #${claim.claimNumber} (${claim.facilityName}):
- Diagnosis: ${claim.primaryDiagnosis?.name} (${claim.primaryDiagnosis?.code}) | Paket: ${claim.inacbgCode} (Sev ${claim.severity})
- Tagihan: Rp ${Number(claim.billedAmount || 0).toLocaleString("id-ID")}
- Resume Medis: "${claim.resumeText}"
- Temuan Aturan: ${findingsSummary}
- Pertanyaan Verifikator sebelumnya: "${claim.clarifications?.[0]?.question || claim.clarificationHistory?.slice(-1)?.[0]?.message || "-"}"

Kembalikan HANYA JSON valid:
{
  "note": "Teks catatan/tanggapan siap kirim (2-3 kalimat bahasa Indonesia medis yang lugas dan spesifik)"
}`;

  const noteSchema = {
    type: "OBJECT",
    properties: {
      note: { type: "STRING" }
    },
    required: ["note"]
  };

  const llmResult = await callActiveLlm({
    systemPrompt,
    userPrompt,
    temperature: 0.78,
    maxTokens: 500,
    clientConfig,
    responseSchema: noteSchema
  });

  if (!llmResult.success) {
    return res.status(400).json({
      success: false,
      code: llmResult.code,
      error: llmResult.error
    });
  }

  const noteText = llmResult.parsed?.note || llmResult.rawText?.replace(/```json|```/g, "").trim();
  return res.json({
    success: true,
    provider: llmResult.provider,
    model: llmResult.model,
    latencyMs: llmResult.latencyMs,
    note: noteText
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
