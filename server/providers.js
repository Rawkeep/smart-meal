/**
 * Server-seitige BYOK-Provider jenseits von Anthropic (Gemini, OpenAI).
 *
 * Der Freemium-Pfad (Server-Key) bleibt Anthropic-only — diese Helfer greifen
 * nur, wenn ein Nutzer SEINEN eigenen Key schickt. Der Anbieter wird am
 * Key-Präfix erkannt (providerFromKey), sodass das Frontend nichts mitschicken
 * muss: ein `AIza…`-Key landet bei Gemini (Gratis-Tier), `sk-…` bei OpenAI,
 * `sk-ant…`/sonst bei Anthropic.
 *
 * Alle Funktionen liefern NORMALISIERT den reinen Antworttext (String) und
 * werfen bei Fehlern `{ status, message }` — passend zur Fehlerbehandlung der
 * Routen in index.js.
 */
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-1.5-flash";
const OPENAI_MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";

/** Anbieter am Key-Präfix bestimmen. Default Anthropic (= bisheriges Verhalten). */
export function providerFromKey(key) {
  if (typeof key !== "string") return "anthropic";
  if (key.startsWith("AIza")) return "gemini";
  if (key.startsWith("sk-ant")) return "anthropic";
  if (key.startsWith("sk-")) return "openai";
  return "anthropic";
}

async function _fail(r) {
  const err = await r.json().catch(() => ({}));
  const message = err.error?.message || err.error?.[0]?.message || err.message || `API-Fehler: ${r.status}`;
  return { status: r.status, message };
}

// ─── Gemini (Google Generative Language API) ─────────────────────────────────

const _geminiUrl = (key) =>
  `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${encodeURIComponent(key)}`;

const _geminiText = (d) =>
  d.candidates?.[0]?.content?.parts?.map((x) => x.text || "").join("") || "";

export async function callGeminiText(apiKey, prompt, maxTokens = 1500) {
  const r = await fetch(_geminiUrl(apiKey), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { maxOutputTokens: maxTokens },
    }),
  });
  if (!r.ok) throw await _fail(r);
  return _geminiText(await r.json());
}

export async function callGeminiVision(apiKey, base64, mediaType, prompt, maxTokens = 500) {
  const r = await fetch(_geminiUrl(apiKey), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }, { inline_data: { mime_type: mediaType, data: base64 } }] }],
      generationConfig: { maxOutputTokens: maxTokens },
    }),
  });
  if (!r.ok) throw await _fail(r);
  return _geminiText(await r.json());
}

// ─── OpenAI (Chat Completions) ───────────────────────────────────────────────

const _openaiText = (d) => d.choices?.[0]?.message?.content || "";

export async function callOpenAIText(apiKey, prompt, maxTokens = 1500) {
  const r = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: OPENAI_MODEL,
      max_tokens: maxTokens,
      messages: [{ role: "user", content: prompt }],
    }),
  });
  if (!r.ok) throw await _fail(r);
  return _openaiText(await r.json());
}

export async function callOpenAIVision(apiKey, base64, mediaType, prompt, maxTokens = 500) {
  const r = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: OPENAI_MODEL,
      max_tokens: maxTokens,
      messages: [{
        role: "user",
        content: [
          { type: "text", text: prompt },
          { type: "image_url", image_url: { url: `data:${mediaType};base64,${base64}` } },
        ],
      }],
    }),
  });
  if (!r.ok) throw await _fail(r);
  return _openaiText(await r.json());
}
