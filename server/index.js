import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import rateLimit from "express-rate-limit";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import crypto from "crypto";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
app.set("trust proxy", 1); // hinter Fly-Proxy: korrektes req.ip + x-forwarded-proto
const PORT = process.env.PORT || 3001;
const isProd = process.env.NODE_ENV === "production";
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const FREE_DAILY_LIMIT = parseInt(process.env.FREE_DAILY_LIMIT || "10", 10);

// ─── Freemium Usage Tracking (per IP, resets daily) ───
const usageMap = new Map();

function getUsageKey(ip) {
  const date = new Date().toISOString().slice(0, 10);
  return `${ip}:${date}`;
}

function getUsage(ip) {
  const key = getUsageKey(ip);
  return usageMap.get(key) || 0;
}

function incrementUsage(ip) {
  const key = getUsageKey(ip);
  const current = usageMap.get(key) || 0;
  usageMap.set(key, current + 1);
  // Cleanup old entries (keep only today)
  const today = new Date().toISOString().slice(0, 10);
  for (const k of usageMap.keys()) {
    if (!k.endsWith(today)) usageMap.delete(k);
  }
  return current + 1;
}

function getRemainingFree(ip) {
  return Math.max(0, FREE_DAILY_LIMIT - getUsage(ip));
}

// ─── Security ───
app.use(helmet({
  contentSecurityPolicy: isProd ? undefined : false,
  hsts: isProd ? { maxAge: 31536000, includeSubDomains: true } : false,
}));

app.use(compression());
app.use(express.json({ limit: "1mb" }));

// ─── CORS ───
const allowedOrigins = isProd
  ? [process.env.APP_URL || "http://localhost:5173"].filter(Boolean)
  : ["http://localhost:5173", "http://localhost:3001"];

app.use(cors({
  // Nie werfen (würde 500 verursachen — auch bei Same-Origin-Form-POST wie /__gate,
  // weil der Browser dort einen Origin-Header sendet). Erlaubte Origins bekommen
  // CORS-Header; alle anderen laufen ohne CORS-Header durch (Same-Origin bleibt ok,
  // echtes Cross-Origin blockt der Browser selbst).
  origin: isProd
    ? (origin, cb) => cb(null, !origin || allowedOrigins.includes(origin))
    : true,
  credentials: true,
}));

// ─── HTTPS redirect in production ───
if (isProd) {
  app.use((req, res, next) => {
    if (req.headers["x-forwarded-proto"] !== "https") {
      return res.redirect(301, `https://${req.hostname}${req.url}`);
    }
    next();
  });
}

// ─── Türsteher (Cookie-Gate, geteiltes Passwort) ───
// Aktiv sobald ACCESS_GATE_PASS gesetzt ist. Schützt alles außer /api/health
// und /__gate. Cookie ist HMAC-signiert (GATE_SECRET), kein cookie-parser nötig.
const GATE_PASS = process.env.ACCESS_GATE_PASS || "";
const GATE_SECRET = process.env.GATE_SECRET || GATE_PASS || "dev-gate-secret";
const GATE_COOKIE = "sm_gate";
const GATE_TTL_MS = 30 * 24 * 3600 * 1000;
const GATE_CSP = "default-src 'self'; style-src 'unsafe-inline'; img-src 'self' data:";

const _b64u = (buf) => Buffer.from(buf).toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
function _gateToken() {
  const payload = String(Date.now() + GATE_TTL_MS);
  const sig = _b64u(crypto.createHmac("sha256", GATE_SECRET).update(payload).digest());
  return `${payload}.${sig}`;
}
function _validGateToken(tok) {
  if (!tok) return false;
  const i = tok.lastIndexOf(".");
  if (i < 1) return false;
  const payload = tok.slice(0, i);
  const sig = tok.slice(i + 1);
  const expected = _b64u(crypto.createHmac("sha256", GATE_SECRET).update(payload).digest());
  if (sig.length !== expected.length) return false;
  if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return false;
  const exp = parseInt(payload, 10);
  return Number.isFinite(exp) && exp > Date.now();
}
function _readCookie(req, name) {
  const raw = req.headers.cookie || "";
  for (const part of raw.split(";")) {
    const idx = part.indexOf("=");
    if (idx < 0) continue;
    if (part.slice(0, idx).trim() === name) return decodeURIComponent(part.slice(idx + 1).trim());
  }
  return null;
}
const _hasGate = (req) => _validGateToken(_readCookie(req, GATE_COOKIE));
function _safeEq(a, b) {
  const ab = Buffer.from(String(a));
  const bb = Buffer.from(String(b));
  if (ab.length !== bb.length) return false;
  return crypto.timingSafeEqual(ab, bb);
}
const _htmlAttr = (s) => String(s).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const _safeReturn = (r) => {
  const v = String(r || "/smart-meal/");
  return v.startsWith("/") && !v.startsWith("//") ? v : "/smart-meal/";
};
function _gatePage(msg, returnTo) {
  return `<!doctype html><html lang="de"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Smart Meal — Zugang</title></head>
<body style="margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;background:#0f172a;font-family:system-ui,-apple-system,sans-serif;color:#e2e8f0">
<form method="POST" action="/__gate" style="background:#1e293b;padding:32px 28px;border-radius:16px;width:320px;box-shadow:0 10px 40px rgba(0,0,0,.4)">
<div style="font-size:32px;text-align:center;margin-bottom:6px">🍽️</div>
<h1 style="font-size:18px;margin:0 0 4px;text-align:center">Smart Meal</h1>
<p style="font-size:13px;color:#94a3b8;margin:0 0 18px;text-align:center">Bitte Zugangspasswort eingeben.</p>
${msg ? `<div style="background:#7f1d1d;color:#fecaca;font-size:12px;padding:8px 10px;border-radius:8px;margin-bottom:12px">${_htmlAttr(msg)}</div>` : ""}
<input type="hidden" name="returnTo" value="${_htmlAttr(_safeReturn(returnTo))}">
<input name="password" type="password" autocomplete="current-password" autofocus required placeholder="Passwort" style="width:100%;box-sizing:border-box;padding:11px 12px;border-radius:9px;border:1px solid #334155;background:#0f172a;color:#e2e8f0;font-size:14px;margin-bottom:12px">
<button type="submit" style="width:100%;padding:11px;border:0;border-radius:9px;background:#10b981;color:#fff;font-size:14px;font-weight:600;cursor:pointer">Eintreten</button>
</form></body></html>`;
}

if (GATE_PASS) {
  app.use(express.urlencoded({ extended: false, limit: "4kb" }));
  app.use((req, res, next) => {
    if (req.path === "/api/health") return next();
    // Öffentlich (auch für Store-Reviewer / TWA-Verifikation): Datenschutz + Asset-Links.
    if (req.path === "/privacy" || req.path === "/.well-known/assetlinks.json") return next();
    if (req.path === "/__gate") {
      if (req.method === "POST") {
        if (_safeEq((req.body && req.body.password) || "", GATE_PASS)) {
          res.cookie(GATE_COOKIE, _gateToken(), { httpOnly: true, secure: isProd, sameSite: "lax", path: "/", maxAge: GATE_TTL_MS });
          return res.redirect(302, _safeReturn(req.body && req.body.returnTo));
        }
        res.setHeader("Content-Security-Policy", GATE_CSP);
        return res.status(401).send(_gatePage("Falsches Passwort.", req.body && req.body.returnTo));
      }
      if (_hasGate(req)) return res.redirect(302, "/smart-meal/");
      res.setHeader("Content-Security-Policy", GATE_CSP);
      return res.send(_gatePage(null, req.query.returnTo));
    }
    if (_hasGate(req)) return next();
    if (req.method === "GET" && (req.get("accept") || "").includes("text/html")) {
      res.setHeader("Content-Security-Policy", GATE_CSP);
      return res.status(401).send(_gatePage(null, req.originalUrl));
    }
    return res.status(401).json({ error: "Zugang erforderlich" });
  });
}

// ─── Rate Limiting (API routes only) ───
const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Zu viele Anfragen. Bitte warte eine Minute." },
});

// ─── Input Validation ───
function sanitizeText(text) {
  if (typeof text !== "string") return "";
  return text.replace(/<[^>]*>/g, "").trim().slice(0, 10000);
}

function validateSuggestBody(body) {
  const errors = [];
  if (!body.prompt || typeof body.prompt !== "string") {
    errors.push("prompt is required and must be a string");
  }
  if (body.prompt && body.prompt.length > 10000) {
    errors.push("prompt must be under 10000 characters");
  }
  return errors;
}

function validateImageBody(body) {
  const errors = [];
  if (!body.image || typeof body.image !== "string") {
    errors.push("image is required and must be a base64 string");
  }
  if (!body.mediaType || typeof body.mediaType !== "string") {
    errors.push("mediaType is required");
  }
  if (body.mediaType && !["image/jpeg", "image/png", "image/gif", "image/webp"].includes(body.mediaType)) {
    errors.push("mediaType must be a valid image type");
  }
  return errors;
}

// ─── Proxy to Claude API ───
async function callClaude(messages, maxTokens = 1500) {
  if (!ANTHROPIC_API_KEY) {
    throw new Error("ANTHROPIC_API_KEY not configured on server");
  }

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: maxTokens,
      messages,
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    const status = response.status;
    throw { status, message: err.error?.message || `Claude API error: ${status}` };
  }

  return response.json();
}

// ─── BYOK Proxy to Claude API ───
async function callClaudeWithKey(apiKey, messages, maxTokens = 1500) {
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: maxTokens,
      messages,
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw { status: response.status, message: err.error?.message || `Claude API error: ${response.status}` };
  }

  return response.json();
}

// ─── Freemium guard middleware ───
function freemiumGuard(req, res, next) {
  const userKey = req.headers["x-user-api-key"];
  if (userKey) {
    req.useByok = true;
    req.userApiKey = userKey;
    return next();
  }
  if (!ANTHROPIC_API_KEY) {
    return res.status(503).json({ error: "Server hat keinen API-Key. Bitte eigenen Key verwenden.", needsKey: true });
  }
  const remaining = getRemainingFree(req.ip);
  if (remaining <= 0) {
    return res.status(429).json({
      error: `Tageslimit erreicht (${FREE_DAILY_LIMIT} kostenlose Anfragen). Eigenen API-Key eingeben für unbegrenzte Nutzung.`,
      needsKey: true,
      remaining: 0,
    });
  }
  next();
}

// ─── Health Check (no rate limit) ───
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    hasApiKey: !!ANTHROPIC_API_KEY,
    freemium: !!ANTHROPIC_API_KEY,
    remaining: ANTHROPIC_API_KEY ? getRemainingFree(req.ip) : 0,
    dailyLimit: FREE_DAILY_LIMIT,
  });
});

// ─── Digital Asset Links (Android TWA / Play) ───
// Muss öffentlich unter https://<domain>/.well-known/assetlinks.json liegen.
// Fingerprint nach dem TWA-Build via `fly secrets set ANDROID_CERT_SHA256=...`.
app.get("/.well-known/assetlinks.json", (_req, res) => {
  res.json([
    {
      relation: ["delegate_permission/common.handle_all_urls"],
      target: {
        namespace: "android_app",
        package_name: process.env.ANDROID_PACKAGE || "com.rawkeep.smartmeal",
        sha256_cert_fingerprints: [
          process.env.ANDROID_CERT_SHA256 || "REPLACE_WITH_SHA256_FINGERPRINT_AFTER_TWA_BUILD",
        ],
      },
    },
  ]);
});

// ─── Datenschutzerklärung (öffentlich, Store-Pflicht) ───
app.get("/privacy", (_req, res) => {
  res.setHeader("Content-Security-Policy", "default-src 'self'; style-src 'unsafe-inline'");
  res.type("html").send(`<!doctype html><html lang="de"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Smart Meal — Datenschutz</title></head>
<body style="margin:0;background:#FFF8F0;color:#2a2a2a;font-family:system-ui,-apple-system,sans-serif;line-height:1.6">
<main style="max-width:720px;margin:0 auto;padding:40px 22px">
<h1 style="color:#C8611A">Datenschutzerklärung — Smart Meal</h1>
<p>Smart Meal ist ein KI-gestützter Rezept-/Ernährungsassistent. Wir halten die Datenverarbeitung minimal.</p>
<h2>Verantwortlicher</h2>
<p>Rawkeep (Betreiber). Kontakt: <a href="mailto:datenschutz@rawkeep.com">datenschutz@rawkeep.com</a></p>
<h2>Welche Daten verarbeitet werden</h2>
<ul>
<li><strong>Keine Konten, kein Tracking, keine Werbung.</strong> Es werden keine Cookies zu Analysezwecken gesetzt.</li>
<li><strong>KI-Anfragen:</strong> Deine Eingaben (z. B. Zutaten, Vorlieben, optional Foto) werden zur Rezept-Generierung an <a href="https://www.anthropic.com/legal/privacy" rel="noopener">Anthropic (Claude API, USA)</a> übermittelt. Anthropic verarbeitet sie als Auftragsverarbeiter und nutzt API-Daten nicht zum Modelltraining.</li>
<li><strong>Eigener API-Schlüssel (BYOK):</strong> Falls du einen eigenen Anthropic-Key eingibst, wird er nur für deine Anfragen an Anthropic verwendet und nicht serverseitig gespeichert.</li>
<li><strong>Nutzungslimit:</strong> Für das kostenlose Kontingent wird die Anzahl Anfragen pro Tag flüchtig pro IP im Arbeitsspeicher gezählt (kein dauerhaftes Protokoll, Reset täglich).</li>
<li><strong>Lokale Speicherung:</strong> Einstellungen, Vorlieben und Verlauf bleiben über den Browser-Speicher (localStorage) auf deinem Gerät und werden nicht an uns übertragen.</li>
</ul>
<h2>Weitergabe</h2>
<p>Außer der genannten Übermittlung an Anthropic zur KI-Verarbeitung geben wir keine Daten an Dritte weiter.</p>
<h2>Hinweis</h2>
<p>Smart Meal ersetzt keine medizinische oder ernährungswissenschaftliche Beratung. Bei Allergien/Unverträglichkeiten Angaben stets selbst prüfen.</p>
<p style="color:#888;font-size:13px;margin-top:28px">Stand: 2026-05. Hosting: Fly.io (Frankfurt).</p>
</main></body></html>`);
});

// ─── Helper: call Claude with freemium or BYOK ───
async function callClaudeAuto(req, messages, maxTokens = 1500) {
  let data;
  if (req.useByok) {
    data = await callClaudeWithKey(req.userApiKey, messages, maxTokens);
  } else {
    data = await callClaude(messages, maxTokens);
    incrementUsage(req.ip);
  }
  return data;
}

// ─── Suggest Route ───
app.post("/api/suggest", apiLimiter, freemiumGuard, async (req, res) => {
  const errors = validateSuggestBody(req.body);
  if (errors.length) return res.status(400).json({ error: errors.join("; ") });

  try {
    const prompt = sanitizeText(req.body.prompt);
    const data = await callClaudeAuto(req, [{ role: "user", content: prompt }]);
    const text = data.content.map(c => c.type === "text" ? c.text : "").join("");
    const remaining = req.useByok ? null : getRemainingFree(req.ip);
    res.json({ text, remaining });
  } catch (err) {
    const status = err.status || 500;
    res.status(status).json({ error: err.message || "Internal server error" });
  }
});

// ─── Meal Plan Route ───
app.post("/api/meal-plan", apiLimiter, freemiumGuard, async (req, res) => {
  const errors = validateSuggestBody(req.body);
  if (errors.length) return res.status(400).json({ error: errors.join("; ") });

  try {
    const prompt = sanitizeText(req.body.prompt);
    const data = await callClaudeAuto(req, [{ role: "user", content: prompt }], 3000);
    const text = data.content.map(c => c.type === "text" ? c.text : "").join("");
    const remaining = req.useByok ? null : getRemainingFree(req.ip);
    res.json({ text, remaining });
  } catch (err) {
    const status = err.status || 500;
    res.status(status).json({ error: err.message || "Internal server error" });
  }
});

// ─── Image Recognition Route ───
app.post("/api/recognize", apiLimiter, freemiumGuard, async (req, res) => {
  const errors = validateImageBody(req.body);
  if (errors.length) return res.status(400).json({ error: errors.join("; ") });

  try {
    const data = await callClaudeAuto(req, [{
      role: "user",
      content: [
        { type: "image", source: { type: "base64", media_type: req.body.mediaType, data: req.body.image } },
        { type: "text", text: "Erkenne alle Lebensmittel/Zutaten auf diesem Foto. Antworte NUR mit einem JSON-Array der Zutatennamen auf Deutsch, z.B. [\"Tomaten\",\"Käse\",\"Hähnchenbrust\"]. Keine Erklärung, nur das Array." },
      ],
    }], 500);
    const text = data.content?.map(c => c.type === "text" ? c.text : "").join("") || "[]";
    const remaining = req.useByok ? null : getRemainingFree(req.ip);
    res.json({ text, remaining });
  } catch (err) {
    const status = err.status || 500;
    res.status(status).json({ error: err.message || "Internal server error" });
  }
});

// ─── Serve static frontend in production ───
if (isProd) {
  const distPath = join(__dirname, "..", "dist");
  app.use("/smart-meal", express.static(distPath));
  app.get("/smart-meal/*splat", (_req, res) => {
    res.sendFile(join(distPath, "index.html"));
  });
  app.get("/", (_req, res) => res.redirect("/smart-meal/"));
}

// ─── Start ───
app.listen(PORT, () => {
  console.log(`Smart Meal server running on port ${PORT}`);
  console.log(`Environment: ${isProd ? "production" : "development"}`);
  console.log(`API key configured: ${!!ANTHROPIC_API_KEY}`);
});
