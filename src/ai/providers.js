/**
 * AI provider registry for the BYOK (bring-your-own-key) direct-browser path.
 *
 * The backend proxy (/api/suggest) and the freemium quota stay Claude-only.
 * These providers only kick in when the user pastes their own key and the app
 * talks to the provider's API straight from the browser. All three endpoints
 * support browser CORS, so no proxy is required.
 */

export const PROVIDERS = [
  {
    id: "claude",
    label: "Claude (Anthropic)",
    emoji: "🟣",
    keyPrefix: "sk-ant",
    placeholder: "sk-ant-api03-...",
    console: "console.anthropic.com",
    consoleUrl: "https://console.anthropic.com/settings/keys",
    model: "claude-sonnet-4-20250514",
  },
  {
    id: "openai",
    label: "OpenAI (GPT-4o)",
    emoji: "🟢",
    keyPrefix: "sk-",
    placeholder: "sk-...",
    console: "platform.openai.com",
    consoleUrl: "https://platform.openai.com/api-keys",
    model: "gpt-4o-mini",
  },
  {
    id: "gemini",
    label: "Google Gemini",
    emoji: "🔵",
    keyPrefix: "AIza",
    placeholder: "AIza...",
    console: "aistudio.google.com",
    consoleUrl: "https://aistudio.google.com/app/apikey",
    model: "gemini-1.5-flash",
  },
];

export const DEFAULT_PROVIDER = "claude";

export function getProvider(id) {
  return PROVIDERS.find((p) => p.id === id) || PROVIDERS[0];
}

/**
 * Whether a key looks valid for the given provider. Used only to enable the
 * connect button — the real validation is the API call itself.
 */
export function isValidKey(providerId, key) {
  if (!key) return false;
  const p = getProvider(providerId);
  return key.startsWith(p.keyPrefix);
}

async function readError(r) {
  const err = await r.json().catch(() => ({}));
  return (
    err.error?.message ||
    err.error?.[0]?.message ||
    err.message ||
    `API Fehler: ${r.status}`
  );
}

/**
 * Text-only generation. Returns the raw model text (caller strips ```json).
 */
export async function callTextProvider({ providerId, apiKey, prompt, maxTokens = 1500 }) {
  const p = getProvider(providerId);

  if (p.id === "claude") {
    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "anthropic-dangerous-direct-browser-access": "true",
      },
      body: JSON.stringify({
        model: p.model,
        max_tokens: maxTokens,
        messages: [{ role: "user", content: prompt }],
      }),
    });
    if (!r.ok) throw new Error(await readError(r));
    const d = await r.json();
    return d.content.map((c) => (c.type === "text" ? c.text : "")).join("");
  }

  if (p.id === "openai") {
    const r = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: p.model,
        max_tokens: maxTokens,
        messages: [{ role: "user", content: prompt }],
      }),
    });
    if (!r.ok) throw new Error(await readError(r));
    const d = await r.json();
    return d.choices?.[0]?.message?.content || "";
  }

  if (p.id === "gemini") {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${p.model}:generateContent?key=${encodeURIComponent(apiKey)}`;
    const r = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { maxOutputTokens: maxTokens },
      }),
    });
    if (!r.ok) throw new Error(await readError(r));
    const d = await r.json();
    return (
      d.candidates?.[0]?.content?.parts?.map((x) => x.text || "").join("") || ""
    );
  }

  throw new Error("Unbekannter Anbieter");
}

/**
 * Vision generation: send an image + prompt, return the model text.
 */
export async function callVisionProvider({ providerId, apiKey, base64, mediaType, prompt, maxTokens = 500 }) {
  const p = getProvider(providerId);

  if (p.id === "claude") {
    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "anthropic-dangerous-direct-browser-access": "true",
      },
      body: JSON.stringify({
        model: p.model,
        max_tokens: maxTokens,
        messages: [{
          role: "user",
          content: [
            { type: "image", source: { type: "base64", media_type: mediaType, data: base64 } },
            { type: "text", text: prompt },
          ],
        }],
      }),
    });
    if (!r.ok) throw new Error(await readError(r));
    const d = await r.json();
    return d.content?.map((c) => (c.type === "text" ? c.text : "")).join("") || "";
  }

  if (p.id === "openai") {
    const r = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: p.model,
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
    if (!r.ok) throw new Error(await readError(r));
    const d = await r.json();
    return d.choices?.[0]?.message?.content || "";
  }

  if (p.id === "gemini") {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${p.model}:generateContent?key=${encodeURIComponent(apiKey)}`;
    const r = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{
          parts: [
            { text: prompt },
            { inline_data: { mime_type: mediaType, data: base64 } },
          ],
        }],
        generationConfig: { maxOutputTokens: maxTokens },
      }),
    });
    if (!r.ok) throw new Error(await readError(r));
    const d = await r.json();
    return (
      d.candidates?.[0]?.content?.parts?.map((x) => x.text || "").join("") || ""
    );
  }

  throw new Error("Unbekannter Anbieter");
}
