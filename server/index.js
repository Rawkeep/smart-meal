import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import rateLimit from "express-rate-limit";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import crypto from "crypto";
import * as store from "./db.js";
import { sendCodeEmail, mailEnabled } from "./mail.js";
import { providerFromKey, callGeminiText, callGeminiVision, callOpenAIText, callOpenAIVision } from "./providers.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
app.set("trust proxy", 1); // hinter Fly-Proxy: korrektes req.ip + x-forwarded-proto
const PORT = process.env.PORT || 3001;
const isProd = process.env.NODE_ENV === "production";
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const FREE_DAILY_LIMIT = parseInt(process.env.FREE_DAILY_LIMIT || "10", 10);
// Modell-Routing: schnelles Modell für Einzel-Vorschläge (Haiku ≈ 2–3× schneller),
// stärkeres Modell für den Wochenplan (Qualität). Per Env überschreibbar.
const MODEL_FAST = process.env.MODEL_FAST || "claude-haiku-4-5-20251001";
const MODEL_SMART = process.env.MODEL_SMART || "claude-sonnet-4-20250514";

// ─── Freemium Usage Tracking (per IP, resets daily) ───
// Persistiert in SQLite (server/db.js) → überlebt Restart & auto_stop_machines.
function getUsageKey(ip) {
  const date = new Date().toISOString().slice(0, 10);
  return `${ip}:${date}`;
}

function getUsage(ip) {
  return store.getUsageCount(getUsageKey(ip));
}

function incrementUsage(ip) {
  const today = new Date().toISOString().slice(0, 10);
  return store.incrementUsage(getUsageKey(ip), today);
}

function getRemainingFree(ip) {
  return Math.max(0, FREE_DAILY_LIMIT - getUsage(ip));
}

// ─── Security ───
app.use(helmet({
  contentSecurityPolicy: isProd
    ? {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", "data:", "https:"],
          fontSrc: ["'self'", "https://fonts.gstatic.com"],
          connectSrc: ["'self'", "https://api.anthropic.com", "https://api.openai.com", "https://generativelanguage.googleapis.com"],
          mediaSrc: ["'none'"],
          objectSrc: ["'none'"],
          frameAncestors: ["'none'"],
          baseUri: ["'self'"],
          formAction: ["'self'"],
        },
      }
    : false,
  hsts: isProd ? { maxAge: 31536000, includeSubDomains: true, preload: true } : false,
  referrerPolicy: { policy: "strict-origin-when-cross-origin" },
  permittedCrossDomainPolicies: false,
  crossOriginEmbedderPolicy: false, // keep false: BYOK CORS calls to external APIs require it
}));

// Permissions-Policy (not yet in helmet 8, so set manually)
app.use((_req, res, next) => {
  res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=(), payment=()");
  next();
});

app.use(compression());

// ─── Stripe-Webhook (VOR express.json — braucht den rohen Body für die
// Signaturprüfung). Früh registriert, damit der Route-Handler den Access-Gate
// kurzschließt (Stripe kann keinen Zugangscode mitschicken). Inert ohne
// STRIPE_WEBHOOK_SECRET. Implementiert in handleStripeWebhook (weiter unten). ───
app.post("/api/stripe/webhook", express.raw({ type: "application/json", limit: "1mb" }), (req, res) => handleStripeWebhook(req, res));

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
// Per-Käufer-Zugangscodes (kommagetrennt) — jeder Käufer bekommt einen eigenen.
// Plus optional ein geteiltes Alt-Passwort (ACCESS_GATE_PASS, Abwärtskompat).
const ACCESS_CODES = (process.env.ACCESS_CODES || "").split(",").map((s) => s.trim()).filter(Boolean);
const VALID_CODES = [...new Set([...ACCESS_CODES, ...(GATE_PASS ? [GATE_PASS] : [])])];
const GATE_ON = VALID_CODES.length > 0;
const GATE_COOKIE = "sm_gate";
const GATE_TTL_MS = 30 * 24 * 3600 * 1000;
// Signier-Secret STABIL & unabhängig von der Code-Liste: das Entfernen eines
// einzelnen Codes (Widerruf) entwertet nur dessen Cookies, nicht die der anderen
// Käufer. In Produktion ZWINGEND zufällig setzen: fly secrets set GATE_SECRET=<random>.
const GATE_SECRET = process.env.GATE_SECRET || GATE_PASS || "dev-gate-secret";
// Optional bypass for the published store apps (TWA/iOS): a shared token lets
// the apps through the gate while the password still protects the shared web
// link. Inert unless APP_BYPASS_TOKEN is set. Apps pass it via the
// `x-app-token` header (native fetch) or `?app=<token>` query (TWA start URL).
const APP_TOKEN = process.env.APP_BYPASS_TOKEN || "";
const GATE_CSP = "default-src 'self'; style-src 'unsafe-inline'; img-src 'self' data:";

const _b64u = (buf) => Buffer.from(buf).toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
// Fingerprint eines Codes — landet im Cookie, NICHT der Code selbst. Erlaubt
// gezielten Widerruf: fällt der Code aus ACCESS_CODES, ist sein fp nicht mehr gültig.
const _codeFp = (code) => _b64u(crypto.createHmac("sha256", GATE_SECRET).update("fp:" + code).digest()).slice(0, 22);
// Aktuell gültige Fingerprints (Codes + Alt-Passwort + optional App-Bypass-Token).
// "__signed__" = Sammel-Fingerprint für selbst-signierte Codes (automatische
// Ausgabe nach Zahlung) — deren Cookies sind so gültig, ohne dass jeder einzelne
// Code in der Liste stehen muss.
const VALID_FPS = new Set([...VALID_CODES, ...(APP_TOKEN ? [APP_TOKEN] : []), "__signed__"].map(_codeFp));
function _gateToken(code) {
  const payload = `${Date.now() + GATE_TTL_MS}:${_codeFp(code)}`;
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
  const [expStr, fp] = payload.split(":");
  const exp = parseInt(expStr, 10);
  if (!(Number.isFinite(exp) && exp > Date.now())) return false;
  return !!fp && VALID_FPS.has(fp); // entzogener/unbekannter Code → Cookie ungültig
}
// ─── Selbst-signierte Codes (für automatische Ausgabe nach Zahlung) ───
// Format: SMP.<exp>.<sig> — gültig, wenn die Signatur (GATE_SECRET) stimmt und
// exp in der Zukunft liegt. Kein Speicher/Redeploy nötig: der Server kann sie
// jederzeit prägen (mintSignedCode) und akzeptiert sie sofort.
function mintSignedCode(days = 365) {
  const exp = Date.now() + days * 24 * 3600 * 1000;
  const sig = _b64u(crypto.createHmac("sha256", GATE_SECRET).update("signed:" + exp).digest()).slice(0, 24);
  return `SMP.${exp}.${sig}`;
}
function _isSignedCode(code) {
  if (typeof code !== "string" || !code.startsWith("SMP.")) return false;
  const [, expStr, sig] = code.split(".");
  if (!expStr || !sig) return false;
  const expected = _b64u(crypto.createHmac("sha256", GATE_SECRET).update("signed:" + expStr).digest()).slice(0, 24);
  if (sig.length !== expected.length) return false;
  if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return false;
  const exp = parseInt(expStr, 10);
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
  const feat = (icon, text) => `<div style="display:flex;align-items:flex-start;gap:11px;margin:0 0 11px"><div style="font-size:17px;line-height:1.4;flex-shrink:0">${icon}</div><div style="font-size:13px;color:#cbd5e1;line-height:1.45">${text}</div></div>`;
  return `<!doctype html><html lang="de"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Smart Meal — Dein KI-Essensberater</title></head>
<body style="margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;padding:24px;box-sizing:border-box;background:linear-gradient(180deg,rgba(11,16,30,.74),rgba(11,16,30,.93)),url('/smart-meal/img/hero-food.webp') center/cover no-repeat fixed,#0b1120;font-family:system-ui,-apple-system,sans-serif;color:#e2e8f0">
<main style="width:100%;max-width:380px;background:#161f33;border:1px solid #243049;padding:30px 28px;border-radius:20px;box-shadow:0 24px 70px rgba(0,0,0,.5)">
<div style="display:flex;align-items:center;gap:12px;margin-bottom:18px">
<div style="width:46px;height:46px;border-radius:13px;display:flex;align-items:center;justify-content:center;font-size:25px;background:linear-gradient(135deg,#e8896b,#c2415a);box-shadow:0 6px 18px rgba(194,65,90,.4)">🍽️</div>
<div><div style="font-size:19px;font-weight:700;letter-spacing:-.3px">Smart Meal</div><div style="font-size:12px;color:#8aa0c0">Dein KI-Essensberater</div></div>
</div>
<div style="margin:0 0 17px">
<p style="font-size:22px;font-weight:700;font-style:italic;color:#f2e4cb;line-height:1.2;margin:0 0 8px;letter-spacing:-.3px">„Was esse ich heute?"</p>
<p style="font-size:13px;color:#aebbd0;line-height:1.55;margin:0">Milliarden Menschen fragen sich das jeden Tag — genau dafür gibt es Smart Meal. Deine Antwort in Sekunden, abgestimmt auf dich.</p>
</div>
${feat("🥗", "Rezepte nach Vorlieben, Allergien &amp; Zielen — mit Nährwerten &amp; Allergen-Kennzeichnung")}
${feat("🌶️", "Mit Herkunft-Story, Schärfegrad &amp; cleveren Zutaten-Ersätzen")}
${feat("📸", "Zutaten per Foto erkennen, Reste verkochen &amp; Wochenplan")}
${feat("🛒", "Einkaufsliste direkt an Bring!, Picnic &amp; Co. übergeben")}
<form method="POST" action="/__gate" style="margin:20px 0 0;padding-top:18px;border-top:1px solid #243049">
<label for="code" style="display:block;font-size:12px;color:#8aa0c0;font-weight:600;margin-bottom:7px">Dein Zugangscode</label>
${msg ? `<div style="background:#7f1d1d;color:#fecaca;font-size:12px;padding:8px 10px;border-radius:8px;margin-bottom:10px">${_htmlAttr(msg)}</div>` : ""}
<input type="hidden" name="returnTo" value="${_htmlAttr(_safeReturn(returnTo))}">
<input id="code" name="code" type="text" inputmode="text" autocomplete="one-time-code" autocapitalize="characters" spellcheck="false" autofocus required placeholder="z. B. SMEAL-XXXX-XXXX" style="width:100%;box-sizing:border-box;padding:12px 13px;border-radius:10px;border:1px solid #334155;background:#0d1525;color:#e2e8f0;font-size:14px;margin-bottom:11px;letter-spacing:.5px">
<button type="submit" style="width:100%;padding:12px;border:0;border-radius:10px;background:linear-gradient(135deg,#e8896b,#c2415a);color:#fff;font-size:14px;font-weight:700;cursor:pointer">Eintreten →</button>
</form>
<p style="font-size:11px;color:#64748b;text-align:center;margin:14px 0 0;line-height:1.5">🔒 Funktioniert auch offline · keine Konten, kein Tracking</p>
</main></body></html>`;
}

const _validAppToken = (req) => {
  if (!APP_TOKEN) return false;
  const t = req.get("x-app-token") || (req.query && req.query.app) || "";
  return !!t && _safeEq(t, APP_TOKEN);
};

// ─── Automatischer Kauf → Zugangscode (Stripe Checkout success_url) ───
// Bei Stripe als success_url eintragen:
//   https://smartmeal.rawkeep.com/buy/success?session_id={CHECKOUT_SESSION_ID}
// Inert ohne STRIPE_SECRET_KEY. Verifiziert die Session serverseitig (REST, keine
// Extra-Dependency) und prägt bei bezahltem Status sofort einen gültigen Code.
const STRIPE_KEY = process.env.STRIPE_SECRET_KEY || "";
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || "";
const YEAR_MS = 365 * 24 * 3600 * 1000;

// Prüft die Stripe-Signatur manuell (HMAC-SHA256 über `t.<rawBody>`), ohne das
// Stripe-SDK — gleiche stateless-REST-Philosophie wie der Rest der Datei.
function _verifyStripeSig(rawBody, sigHeader, secret, toleranceSec = 300) {
  if (!secret || !sigHeader || !Buffer.isBuffer(rawBody)) return false;
  const parts = {};
  for (const kv of String(sigHeader).split(",")) {
    const i = kv.indexOf("=");
    if (i > 0) parts[kv.slice(0, i).trim()] = kv.slice(i + 1).trim();
  }
  const t = parts.t;
  const v1 = parts.v1;
  if (!t || !v1) return false;
  const expected = crypto.createHmac("sha256", secret).update(`${t}.`).update(rawBody).digest("hex");
  let ok = false;
  try {
    ok = v1.length === expected.length && crypto.timingSafeEqual(Buffer.from(v1), Buffer.from(expected));
  } catch {
    return false;
  }
  if (!ok) return false;
  const age = Math.floor(Date.now() / 1000) - parseInt(t, 10);
  return Number.isFinite(age) && Math.abs(age) <= toleranceSec;
}

// Idempotente Kauf-Erfüllung: prägt einen signierten Code, persistiert Kauf +
// Code (Schlüssel = Stripe-Session) und mailt den Code beim ERSTEN Anlegen.
// Von Webhook UND /buy/success genutzt → egal welcher Pfad zuerst kommt, der
// Käufer sieht/bekommt denselben Code.
async function fulfillSession({ id, paymentIntent, email, amountTotal, currency }) {
  const existing = store.getPurchaseBySession(id);
  if (existing) return { code: existing.code, created: false };
  const code = mintSignedCode(365);
  const expiresAt = new Date(Date.now() + YEAR_MS).toISOString();
  const { created } = store.recordPurchase({ sessionId: id, paymentIntent, email, code, amountTotal, currency, expiresAt });
  if (!created) {
    // Race: ein anderer Pfad hat zwischen Lookup und Insert angelegt → dessen Code gewinnt.
    const winner = store.getPurchaseBySession(id);
    return { code: winner?.code || code, created: false };
  }
  if (email && mailEnabled()) {
    const r = await sendCodeEmail({ to: email, code, expiresAt });
    if (!r.sent) console.warn("[mail] Code-Mail nicht gesendet:", r.reason);
  }
  return { code, created: true };
}

// Stripe-Webhook (Wahrheitsquelle für Käufe). Registriert weiter oben mit
// express.raw. Behandelt Zahlung → Code anlegen/mailen und Erstattung/Dispute →
// Code widerrufen. Antwortet 5xx bei internen Fehlern, damit Stripe es (idempotent) erneut zustellt.
async function handleStripeWebhook(req, res) {
  if (!STRIPE_WEBHOOK_SECRET) return res.status(503).json({ error: "Webhook nicht konfiguriert" });
  if (!_verifyStripeSig(req.body, req.get("stripe-signature"), STRIPE_WEBHOOK_SECRET)) {
    return res.status(400).json({ error: "Ungültige Signatur" });
  }
  let event;
  try {
    event = JSON.parse(req.body.toString("utf8"));
  } catch {
    return res.status(400).json({ error: "Ungültiger JSON-Body" });
  }
  try {
    if (event.type === "checkout.session.completed") {
      const s = event.data.object;
      if (s.payment_status === "paid") {
        await fulfillSession({
          id: s.id,
          paymentIntent: s.payment_intent || null,
          email: s.customer_details?.email || s.customer_email || null,
          amountTotal: s.amount_total ?? null,
          currency: s.currency || null,
        });
      }
    } else if (event.type === "charge.refunded" || event.type === "charge.dispute.created") {
      const pi = event.data.object?.payment_intent;
      const n = store.revokeByPaymentIntent(pi, event.type);
      if (n) console.log(`[stripe] ${n} Code(s) widerrufen für ${pi} (${event.type})`);
    }
  } catch (err) {
    console.error("[stripe] Webhook-Handler-Fehler:", err);
    return res.status(500).json({ error: "Handler-Fehler" });
  }
  return res.json({ received: true });
}

function _buyPage(msg, code) {
  const body = code
    ? `<p style="font-size:13px;color:#94a3b8;margin:0 0 10px">Zahlung bestätigt — danke! Dein persönlicher Zugangscode (1 Jahr gültig, bitte sichern):</p>
<div style="font-family:ui-monospace,monospace;font-size:15px;letter-spacing:.5px;background:#0f172a;border:1px solid #334155;border-radius:9px;padding:12px;word-break:break-all;color:#a7f3d0;margin-bottom:14px">${_htmlAttr(code)}</div>
<form method="POST" action="/__gate"><input type="hidden" name="code" value="${_htmlAttr(code)}"><input type="hidden" name="returnTo" value="/smart-meal/"><button type="submit" style="width:100%;padding:11px;border:0;border-radius:9px;background:#10b981;color:#fff;font-size:14px;font-weight:600;cursor:pointer">Jetzt eintreten →</button></form>`
    : `<div style="background:#7f1d1d;color:#fecaca;font-size:13px;padding:10px 12px;border-radius:8px">${_htmlAttr(msg || "Fehler")}</div>`;
  return `<!doctype html><html lang="de"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Smart Meal — Kauf</title></head>
<body style="margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;background:#0f172a;font-family:system-ui,-apple-system,sans-serif;color:#e2e8f0">
<div style="background:#1e293b;padding:32px 28px;border-radius:16px;width:340px;box-shadow:0 10px 40px rgba(0,0,0,.4)">
<div style="font-size:32px;text-align:center;margin-bottom:6px">🍽️</div>
<h1 style="font-size:18px;margin:0 0 14px;text-align:center">Smart Meal</h1>${body}</div></body></html>`;
}
app.get("/buy/success", async (req, res) => {
  res.setHeader("Content-Security-Policy", GATE_CSP);
  const sid = String((req.query && req.query.session_id) || "");
  if (!STRIPE_KEY || !/^cs_[A-Za-z0-9_]+$/.test(sid)) {
    return res.status(400).send(_buyPage("Kein gültiger Zahlungsnachweis.", null));
  }
  try {
    const r = await fetch(`https://api.stripe.com/v1/checkout/sessions/${encodeURIComponent(sid)}`, {
      headers: { Authorization: `Bearer ${STRIPE_KEY}` },
    });
    const s = await r.json();
    if (!r.ok || s.payment_status !== "paid") {
      return res.status(402).send(_buyPage("Zahlung noch nicht bestätigt. Bei Fragen melde dich bitte.", null));
    }
    // Idempotent erfüllen: gibt den (ggf. vom Webhook bereits angelegten) Code
    // zur Session zurück und mailt ihn beim ersten Anlegen.
    const { code } = await fulfillSession({
      id: s.id,
      paymentIntent: s.payment_intent || null,
      email: s.customer_details?.email || s.customer_email || null,
      amountTotal: s.amount_total ?? null,
      currency: s.currency || null,
    });
    return res.send(_buyPage(null, code));
  } catch {
    return res.status(502).send(_buyPage("Zahlung konnte gerade nicht geprüft werden — Seite später erneut öffnen.", null));
  }
});

if (GATE_ON) {
  app.use(express.urlencoded({ extended: false, limit: "4kb" }));
  app.use((req, res, next) => {
    if (req.path === "/api/health") return next();
    // Öffentlich (auch für Store-Reviewer / TWA-Verifikation): Datenschutz + Asset-Links.
    if (req.path === "/privacy" || req.path === "/.well-known/assetlinks.json") return next();
    // Kauf-Erfolgsseite (Stripe success_url) — muss ohne Code erreichbar sein,
    // sie GIBT den Code ja erst aus.
    if (req.path === "/buy/success") return next();
    // Öffentliche, nicht-sensible PWA-Metadaten: Manifest, Icons, Screenshots.
    // Nötig für Installierbarkeit, Lighthouse/PWA-Audits und Bubblewrap (das die
    // Manifest-URL öffentlich abruft). Die App-Shell selbst bleibt gegated.
    if (req.path === "/smart-meal/manifest.json" ||
        req.path.startsWith("/smart-meal/icons/") ||
        req.path.startsWith("/smart-meal/screenshots/") ||
        req.path.startsWith("/smart-meal/img/")) return next();
    if (req.path === "/__gate") {
      if (req.method === "POST") {
        const submitted = ((req.body && (req.body.code || req.body.password)) || "").trim();
        const matched = VALID_CODES.find((c) => _safeEq(submitted, c));
        const isSigned = !matched && _isSignedCode(submitted);
        // Erstatteter/strittiger Kauf → Code in der DB als widerrufen markiert.
        // (Greift bei der Einlösung; bereits gesetzte Cookies laufen erst nach
        // GATE_TTL ab — für eine kleine Paywall vertretbar.)
        if (isSigned && store.isCodeRevoked(submitted)) {
          res.setHeader("Content-Security-Policy", GATE_CSP);
          return res.status(401).send(_gatePage("Dieser Zugangscode wurde widerrufen (z. B. nach Erstattung).", req.body && req.body.returnTo));
        }
        if (matched || isSigned) {
          res.cookie(GATE_COOKIE, _gateToken(matched || "__signed__"), { httpOnly: true, secure: isProd, sameSite: "lax", path: "/", maxAge: GATE_TTL_MS });
          return res.redirect(302, _safeReturn(req.body && req.body.returnTo));
        }
        res.setHeader("Content-Security-Policy", GATE_CSP);
        return res.status(401).send(_gatePage("Ungültiger Zugangscode.", req.body && req.body.returnTo));
      }
      if (_hasGate(req)) return res.redirect(302, "/smart-meal/");
      res.setHeader("Content-Security-Policy", GATE_CSP);
      return res.send(_gatePage(null, req.query.returnTo));
    }
    // Store-App-Bypass: gültiger App-Token → durchlassen und (für TWA-Navigation)
    // Gate-Cookie setzen, damit Folge-Requests ohne Token passieren.
    if (_validAppToken(req)) {
      if (!_hasGate(req)) {
        res.cookie(GATE_COOKIE, _gateToken(APP_TOKEN), { httpOnly: true, secure: isProd, sameSite: "lax", path: "/", maxAge: GATE_TTL_MS });
      }
      return next();
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
async function callClaude(messages, maxTokens = 1500, model = MODEL_SMART) {
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
      model,
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
async function callClaudeWithKey(apiKey, messages, maxTokens = 1500, model = MODEL_SMART) {
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model,
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
    req.userProvider = providerFromKey(userKey); // gemini/openai/anthropic am Präfix
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
<li><strong>Eigener API-Schlüssel (BYOK):</strong> Falls du einen eigenen Key eingibst, gehen deine Anfragen an den dazugehörigen Anbieter — Anthropic (Claude), Google (Gemini) oder OpenAI, je nach Key. Der Key wird nur für deine Anfragen verwendet und nicht serverseitig gespeichert.</li>
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

// ─── Antworttext aus Anthropic-Response normalisieren ───
const anthropicText = (data) => data.content?.map(c => c.type === "text" ? c.text : "").join("") || "";

// ─── Text-Generierung mit Freemium oder BYOK (provider-aware) ───
// Freemium (Server-Key) ist immer Anthropic. BYOK wird am Key-Präfix geroutet:
// Gemini (Gratis-Tier) / OpenAI / Anthropic. Liefert normalisiert den Text.
async function generateText(req, prompt, maxTokens, fast) {
  const model = fast ? MODEL_FAST : MODEL_SMART;
  if (req.useByok) {
    if (req.userProvider === "gemini") return callGeminiText(req.userApiKey, prompt, maxTokens);
    if (req.userProvider === "openai") return callOpenAIText(req.userApiKey, prompt, maxTokens);
    return anthropicText(await callClaudeWithKey(req.userApiKey, [{ role: "user", content: prompt }], maxTokens, model));
  }
  const data = await callClaude([{ role: "user", content: prompt }], maxTokens, model);
  incrementUsage(req.ip);
  return anthropicText(data);
}

// ─── Bild-Erkennung mit Freemium oder BYOK (provider-aware) ───
async function generateVision(req, { base64, mediaType, prompt, maxTokens }) {
  if (req.useByok) {
    if (req.userProvider === "gemini") return callGeminiVision(req.userApiKey, base64, mediaType, prompt, maxTokens);
    if (req.userProvider === "openai") return callOpenAIVision(req.userApiKey, base64, mediaType, prompt, maxTokens);
    return anthropicText(await callClaudeWithKey(req.userApiKey, [{
      role: "user",
      content: [
        { type: "image", source: { type: "base64", media_type: mediaType, data: base64 } },
        { type: "text", text: prompt },
      ],
    }], maxTokens, MODEL_SMART));
  }
  const data = await callClaude([{
    role: "user",
    content: [
      { type: "image", source: { type: "base64", media_type: mediaType, data: base64 } },
      { type: "text", text: prompt },
    ],
  }], maxTokens, MODEL_SMART);
  incrementUsage(req.ip);
  return anthropicText(data);
}

// ─── Suggest Route ───
app.post("/api/suggest", apiLimiter, freemiumGuard, async (req, res) => {
  const errors = validateSuggestBody(req.body);
  if (errors.length) return res.status(400).json({ error: errors.join("; ") });

  try {
    const prompt = sanitizeText(req.body.prompt);
    // Einzel-Vorschlag → schnelles Modell (Haiku); Wochenplan unten bleibt Sonnet.
    const text = await generateText(req, prompt, 1500, true);
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
    const text = await generateText(req, prompt, 3000, false);
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
    const text = await generateVision(req, {
      base64: req.body.image,
      mediaType: req.body.mediaType,
      prompt: "Erkenne alle Lebensmittel/Zutaten auf diesem Foto. Antworte NUR mit einem JSON-Array der Zutatennamen auf Deutsch, z.B. [\"Tomaten\",\"Käse\",\"Hähnchenbrust\"]. Keine Erklärung, nur das Array.",
      maxTokens: 500,
    }) || "[]";
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
  // Digital Asset Links an der Origin-Root (ungated — der Gate whitelistet den
  // Pfad bereits). Ermöglicht eine verifizierte, vollbildige TWA, sobald die
  // App auf dieser (eigenen) Domain ungated ausgeliefert wird.
  app.get("/.well-known/assetlinks.json", (_req, res) => {
    res.type("application/json").sendFile(join(distPath, ".well-known", "assetlinks.json"));
  });
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
