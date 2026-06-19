/**
 * SQLite-Persistenz für Smart Meal (Käufe, ausgegebene Codes, Freemium-Zähler).
 *
 * Liegt in Produktion auf einem Fly-Volume (DB_PATH=/data/smartmeal.db), damit
 * Käufe/Codes Restarts und `auto_stop_machines` überleben. In Entwicklung wird
 * standardmäßig ./data/smartmeal.db angelegt.
 *
 * better-sqlite3 ist synchron — für diese kleine, schreibarme Paywall ideal und
 * deutlich einfacher als ein async-Treiber.
 */
import Database from "better-sqlite3";
import { dirname } from "path";
import { mkdirSync } from "fs";

const DB_PATH = process.env.DB_PATH || "./data/smartmeal.db";

let _db = null;

/** Lazy-Open + Migration. Beim ersten Zugriff initialisiert. */
function db() {
  if (_db) return _db;
  mkdirSync(dirname(DB_PATH), { recursive: true });
  _db = new Database(DB_PATH);
  _db.pragma("journal_mode = WAL");
  _db.pragma("busy_timeout = 5000");
  _db.exec(`
    CREATE TABLE IF NOT EXISTS purchases (
      id              INTEGER PRIMARY KEY AUTOINCREMENT,
      stripe_session  TEXT UNIQUE,
      payment_intent  TEXT,
      email           TEXT,
      code            TEXT NOT NULL,
      amount_total    INTEGER,
      currency        TEXT,
      created_at      TEXT NOT NULL,
      expires_at      TEXT,
      revoked         INTEGER NOT NULL DEFAULT 0,
      revoked_at      TEXT,
      revoked_reason  TEXT
    );
    CREATE INDEX IF NOT EXISTS idx_purchases_pi   ON purchases(payment_intent);
    CREATE INDEX IF NOT EXISTS idx_purchases_code ON purchases(code);

    CREATE TABLE IF NOT EXISTS usage (
      key    TEXT PRIMARY KEY,
      count  INTEGER NOT NULL DEFAULT 0
    );
  `);
  return _db;
}

const nowIso = () => new Date().toISOString();

// ─── Käufe / Codes ───────────────────────────────────────────────────────────

/**
 * Speichert einen Kauf samt ausgegebenem Code idempotent (Schlüssel:
 * stripe_session). Doppelte Webhook-/Success-Aufrufe für dieselbe Session
 * erzeugen keinen zweiten Datensatz.
 * @returns {{ created: boolean }} created=false, wenn die Session schon existierte
 */
export function recordPurchase({ sessionId, paymentIntent, email, code, amountTotal, currency, expiresAt }) {
  const info = db()
    .prepare(
      `INSERT INTO purchases (stripe_session, payment_intent, email, code, amount_total, currency, created_at, expires_at)
       VALUES (@sessionId, @paymentIntent, @email, @code, @amountTotal, @currency, @createdAt, @expiresAt)
       ON CONFLICT(stripe_session) DO NOTHING`
    )
    .run({
      sessionId: sessionId || null,
      paymentIntent: paymentIntent || null,
      email: email || null,
      code,
      amountTotal: amountTotal ?? null,
      currency: currency || null,
      createdAt: nowIso(),
      expiresAt: expiresAt || null,
    });
  return { created: info.changes === 1 };
}

/** @returns {object|null} Kauf-Datensatz zur Stripe-Checkout-Session */
export function getPurchaseBySession(sessionId) {
  if (!sessionId) return null;
  return db().prepare("SELECT * FROM purchases WHERE stripe_session = ?").get(sessionId) || null;
}

/** true, wenn der Code in der DB liegt UND als widerrufen markiert ist. */
export function isCodeRevoked(code) {
  if (!code) return false;
  const row = db().prepare("SELECT revoked FROM purchases WHERE code = ?").get(code);
  return !!row && row.revoked === 1;
}

/**
 * Widerruft alle Codes zu einem Stripe-PaymentIntent (z. B. nach Erstattung).
 * @returns {number} Anzahl betroffener Codes
 */
export function revokeByPaymentIntent(paymentIntent, reason) {
  if (!paymentIntent) return 0;
  const info = db()
    .prepare(
      `UPDATE purchases SET revoked = 1, revoked_at = ?, revoked_reason = ?
       WHERE payment_intent = ? AND revoked = 0`
    )
    .run(nowIso(), reason || "refund", paymentIntent);
  return info.changes;
}

// ─── Freemium-Nutzung (überlebt Restart/auto-stop) ───────────────────────────

/** @returns {number} Zähler für key (`ip:date`), 0 falls unbekannt */
export function getUsageCount(key) {
  const row = db().prepare("SELECT count FROM usage WHERE key = ?").get(key);
  return row ? row.count : 0;
}

/**
 * Erhöht den Tageszähler für key und räumt veraltete Tage auf.
 * @param {string} key   `ip:date`
 * @param {string} today YYYY-MM-DD des aktuellen Tages
 * @returns {number} neuer Zählerstand
 */
export function incrementUsage(key, today) {
  db().prepare(
    "INSERT INTO usage (key, count) VALUES (?, 1) ON CONFLICT(key) DO UPDATE SET count = count + 1"
  ).run(key);
  db().prepare("DELETE FROM usage WHERE key NOT LIKE ?").run("%:" + today);
  return getUsageCount(key);
}
