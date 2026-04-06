import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import rateLimit from "express-rate-limit";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
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
  origin: isProd
    ? (origin, cb) => {
        if (!origin || allowedOrigins.includes(origin)) cb(null, true);
        else cb(new Error("CORS not allowed"));
      }
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
  app.get("/smart-meal/*", (_req, res) => {
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
