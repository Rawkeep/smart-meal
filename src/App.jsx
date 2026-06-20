import { useState, useEffect, useRef, useCallback } from "react";
import { initDB, getAllFoods, getFoodsFiltered } from "./db";
import { FOODS, FOOD_CATEGORIES } from "./data/foods";
import { CROSS_ALLERGIES, ADDITIVES, ADDITIVE_CATEGORIES, NUTRIENT_DEFICIENCIES, METABOLISM_CONDITIONS, HEALTH_GOALS } from "./data/health";
import { WELLNESS_CATEGORIES, WELLNESS_DISCLAIMER, NUTRITION_ARTICLES, SPORT_TIPS, HOME_REMEDIES, HEALTH_TIPS } from "./data/wellness";
import { generateOfflineSuggestion } from "./swarm/index";
import { buildDeclarationFromText, displayDeclaration } from "./swarm/declaration";
import { recordLike, recordDislike } from "./swarm/learning-engine";
import { generateOfflinePlan } from "./swarm/plan-generator";
import { PROVIDERS, DEFAULT_PROVIDER, getProvider, isValidKey, callTextProvider, callVisionProvider } from "./ai/providers";

// Backend base URL. Empty on the web (same-origin relative /api). The native
// builds (Capacitor iOS) bundle the assets and load from capacitor://localhost,
// so they set VITE_API_BASE to the absolute backend origin at build time.
const API_BASE = import.meta.env.VITE_API_BASE || "";
const api = (path) => `${API_BASE}${path}`;
// Store-app bypass token for the server access gate (set only in native builds).
const APP_TOKEN = import.meta.env.VITE_APP_TOKEN || "";
const withAppToken = (headers = {}) => (APP_TOKEN ? { ...headers, "x-app-token": APP_TOKEN } : headers);

// ─── Storage Keys ───
const K = {
  profile: "wei-profile-v2",
  history: "wei-history-v2",
  favorites: "wei-favorites-v2",
  streak: "wei-streak-v2",
  shoplist: "wei-shoplist-v2",
  shophistory: "wei-shophistory-v1",
  apiKey: "wei-api-key",
  provider: "wei-provider",
  reviewed: "wei-reviewed-v1",
  reminder: "wei-reminder-v1",
  theme: "wei-theme-v1",
};

// Map a free-text ingredient line (e.g. "200 g Hähnchenbrust") to a food
// category id for grouping the shopping list. Falls back to "sonstiges".
const categorizeIngredient = (raw) => {
  const s = (raw || "").toLowerCase();
  // Strip leading quantity/unit so the food name is easier to match.
  const cleaned = s.replace(/^[\d.,/\s]*(g|kg|ml|l|el|tl|stk|stück|prise|bund|dose|packung|pck|tasse|cup)?\.?\s*/i, "");
  const hit = FOODS.find(f => cleaned.includes(f.name.toLowerCase()) || s.includes(f.name.toLowerCase()));
  if (hit) return hit.category;
  // Heuristic keyword fallbacks for common pantry items not in FOODS.
  if (/(salz|pfeffer|öl|essig|sauce|soße|gewürz|paprikapulver|kreuzkümmel|curry|brühe|senf|honig|zucker)/.test(s)) return "gewürze";
  if (/(mehl|reis|nudel|pasta|brot|haferflocken|couscous|bulgur|quinoa|tortilla|wrap)/.test(s)) return "getreide";
  if (/(milch|käse|joghurt|quark|sahne|butter|skyr|frischkäse)/.test(s)) return "milch";
  if (/(huhn|hähnchen|rind|schwein|hack|fleisch|fisch|lachs|thunfisch|garnele|tofu|ei\b|eier|wurst|schinken)/.test(s)) return "protein";
  if (/(linse|bohne|kichererbse|erbse|hülsen)/.test(s)) return "hülsenfrüchte";
  if (/(nuss|nüsse|mandel|cashew|walnuss|samen|kerne)/.test(s)) return "nüsse";
  return "sonstiges";
};

// Ensure every recipe carries the full Kennzeichnung (Allergene + Zusatzstoffe
// + Alkohol). Offline-Rezepte bringen sie schon mit; KI-/importierte Rezepte
// werden hier aus dem Zutaten-/Schritttext abgeleitet. Idempotent.
const withDeclaration = (r) => {
  if (!r || r.error) return r;
  if (r.alkohol && r.zusatzstoffe && r.allergene?.length >= 0 && r._offline) return r;
  const d = buildDeclarationFromText(r.zutaten || [], r.schritte || []);
  return {
    ...r,
    allergene: r.allergene?.length ? r.allergene : d.allergene,
    zusatzstoffe: r.zusatzstoffe?.length ? r.zusatzstoffe : d.zusatzstoffe,
    alkohol: r.alkohol || d.alkohol,
  };
};

// Deterministische „Dish-Art": pro Rezept zwei warme Paletten-Töne aus einem
// Hash von Herkunft/Tag/Name — gibt jedem Gericht ein eigenes, offline-fähiges
// Hero-Motiv (kein Bild/Asset nötig).
const DISH_HUES = ["178,58,72", "126,90,134", "224,165,46", "94,140,79", "44,122,134", "138,46,72", "199,90,103"];
const hashStr = (s) => { let h = 0; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0; return h; };
const dishArt = (r) => {
  const seed = hashStr(String(r?.herkunft || r?.tags?.[0] || r?.name || "meal"));
  const a = DISH_HUES[seed % DISH_HUES.length];
  let b = DISH_HUES[(Math.floor(seed / 7)) % DISH_HUES.length];
  if (b === a) b = DISH_HUES[(seed + 3) % DISH_HUES.length];
  return { a, b };
};

// LMIV / data-source footer shown beside every allergen/nutrition block
const DATA_SOURCES = [
  "Allergene nach LMIV / FIC Reg. (EU) Nr. 1169/2011, Anhang II",
  "Nährwerte: BLS (Bundeslebensmittelschlüssel) und USDA FoodData Central (Referenzwerte pro 100 g)",
  "Saisonkalender: BZfE (Bundeszentrum für Ernährung)",
  "Kreuzallergien: DAAB (Deutscher Allergie- und Asthmabund)",
];
const DATA_DISCLAIMER = "Alle Angaben ohne Gewähr. Werte basieren auf Referenz-Datenbanken und sind keine Ersatz für eine individuelle Beratung. Bei Allergien und Unverträglichkeiten IMMER die Originalverpackung / den Hersteller verifizieren, insbesondere bei Gastronomie-Einsatz.";

// ─── Constants ───
const ALLERGIES = [
  { id: "gluten", label: "Gluten", emoji: "🌾" },
  { id: "laktose", label: "Laktose", emoji: "🥛" },
  { id: "ei", label: "Eier", emoji: "🥚" },
  { id: "soja", label: "Soja", emoji: "🫘" },
  { id: "fisch", label: "Fisch/Meeresfrüchte", emoji: "🐟" },
  { id: "sellerie", label: "Sellerie", emoji: "🥬" },
  { id: "senf", label: "Senf", emoji: "🟡" },
  { id: "sesam", label: "Sesam", emoji: "🫓" },
  { id: "sulfite", label: "Sulfite", emoji: "🍷" },
  { id: "fruktose", label: "Fruktose", emoji: "🍎" },
  { id: "sorbit", label: "Sorbit", emoji: "🍬" },
];

const NUT_ALLERGIES = [
  { id: "erdnuss", label: "Erdnuss", emoji: "🥜" },
  { id: "haselnuss", label: "Haselnuss", emoji: "🌰" },
  { id: "walnuss", label: "Walnuss", emoji: "🌰" },
  { id: "mandel", label: "Mandel", emoji: "🌰" },
  { id: "cashew", label: "Cashew", emoji: "🌰" },
  { id: "pistazie", label: "Pistazie", emoji: "🌰" },
  { id: "macadamia", label: "Macadamia", emoji: "🌰" },
  { id: "pekan", label: "Pekannuss", emoji: "🌰" },
  { id: "paranuss", label: "Paranuss", emoji: "🌰" },
];

const ALL_ALLERGIES = [...ALLERGIES, ...NUT_ALLERGIES];

const DIETS = [
  { id: "vegetarisch", label: "Vegetarisch", emoji: "🥗" },
  { id: "vegan", label: "Vegan", emoji: "🌱" },
  { id: "pescetarisch", label: "Pescetarisch", emoji: "🐠" },
  { id: "keto", label: "Keto", emoji: "🥑" },
  { id: "lowcarb", label: "Low Carb", emoji: "📉" },
  { id: "paleo", label: "Paleo", emoji: "🦴" },
  { id: "halal", label: "Halal", emoji: "☪️" },
  { id: "koscher", label: "Koscher", emoji: "✡️" },
  { id: "fodmap", label: "Low FODMAP", emoji: "🧬" },
];

const CUISINES = [
  { id: "deutsch", label: "Deutsch", emoji: "🇩🇪" },
  { id: "italienisch", label: "Italienisch", emoji: "🇮🇹" },
  { id: "asiatisch", label: "Asiatisch", emoji: "🥢" },
  { id: "mexikanisch", label: "Mexikanisch", emoji: "🌮" },
  { id: "indisch", label: "Indisch", emoji: "🇮🇳" },
  { id: "westafrikanisch", label: "Westafrikanisch", emoji: "🌍" },
  { id: "ostafrikanisch", label: "Ostafrikanisch", emoji: "🌍" },
  { id: "zentralafrikanisch", label: "Zentralafrikanisch", emoji: "🌍" },
  { id: "südafrikanisch", label: "Südafrikanisch", emoji: "🌍" },
  { id: "nordafrikanisch", label: "Nordafrikanisch", emoji: "🌍" },
  { id: "mediterran", label: "Mediterran", emoji: "🫒" },
  { id: "orientalisch", label: "Orientalisch", emoji: "🧆" },
  { id: "japanisch", label: "Japanisch", emoji: "🇯🇵" },
  { id: "koreanisch", label: "Koreanisch", emoji: "🇰🇷" },
  { id: "thai", label: "Thailändisch", emoji: "🇹🇭" },
  { id: "französisch", label: "Französisch", emoji: "🇫🇷" },
  { id: "karibisch", label: "Karibisch", emoji: "🏝️" },
];

const MEALS = [
  { id: "frühstück", label: "Frühstück", emoji: "🌅", h: [5, 10] },
  { id: "mittag", label: "Mittag", emoji: "☀️", h: [11, 14] },
  { id: "abend", label: "Abend", emoji: "🌙", h: [17, 22] },
  { id: "snack", label: "Snack", emoji: "🍿", h: null },
];

const TIMES = [
  { id: "blitz", label: "Blitz", sub: "< 10 Min", emoji: "⚡" },
  { id: "schnell", label: "Schnell", sub: "10–20 Min", emoji: "🏃" },
  { id: "normal", label: "Normal", sub: "20–40 Min", emoji: "🍳" },
  { id: "genuss", label: "Genuss", sub: "40–90 Min", emoji: "👨‍🍳" },
  { id: "projekt", label: "Projekt", sub: "90+ Min", emoji: "🏆" },
];

const MOODS = [
  { id: "comfort", label: "Comfort", emoji: "🛋️", color: "#E8943A" },
  { id: "leicht", label: "Leicht", emoji: "🥒", color: "#6AAF6A" },
  { id: "deftig", label: "Deftig", emoji: "🍖", color: "#B85C3A" },
  { id: "exotisch", label: "Exotisch", emoji: "🌶️", color: "#C44040" },
  { id: "süß", label: "Süß", emoji: "🍰", color: "#D48ABF" },
  { id: "gesund", label: "Gesund", emoji: "💚", color: "#4A9A5A" },
  { id: "proteinreich", label: "Protein", emoji: "💪", color: "#5A7ABF" },
  { id: "random", label: "Surprise!", emoji: "🎲", color: "#8A6ABF" },
];

const BUDGETS = [
  { id: "günstig", label: "Günstig", sub: "< 5€", emoji: "💰" },
  { id: "normal", label: "Normal", sub: "5–12€", emoji: "💳" },
  { id: "premium", label: "Premium", sub: "12€+", emoji: "✨" },
  { id: "egal", label: "Egal", sub: "", emoji: "🤷" },
];

// Optionale Verfeinerung à la Rezept-Blog: Art des Gerichts + Haupt-Protein.
const DISH_TYPES = [
  { id: "egal", label: "Egal", emoji: "🍽️" },
  { id: "suppe", label: "Suppe/Eintopf", emoji: "🍲" },
  { id: "nudeln", label: "Nudelgericht", emoji: "🍜" },
  { id: "reis", label: "Reisgericht", emoji: "🍚" },
  { id: "bowl", label: "Bowl/Salat", emoji: "🥗" },
  { id: "gegrillt", label: "Gegrilltes", emoji: "🔥" },
  { id: "wok", label: "Gebraten/Wok", emoji: "🍳" },
  { id: "geschmort", label: "Geschmort", emoji: "🥘" },
  { id: "ofen", label: "Aus dem Ofen", emoji: "🧑‍🍳" },
  { id: "street", label: "Street Food", emoji: "🌮" },
  { id: "süß", label: "Süßes/Dessert", emoji: "🍰" },
];

const PROTEINS = [
  { id: "egal", label: "Egal", emoji: "🍽️" },
  { id: "huhn", label: "Huhn", emoji: "🍗" },
  { id: "rind", label: "Rind", emoji: "🥩" },
  { id: "schwein", label: "Schwein", emoji: "🥓" },
  { id: "fisch", label: "Fisch", emoji: "🐟" },
  { id: "meeresfrüchte", label: "Meeresfrüchte", emoji: "🦐" },
  { id: "tofu", label: "Tofu/Soja", emoji: "🧈" },
  { id: "ei", label: "Ei", emoji: "🥚" },
  { id: "gemüse", label: "Nur Gemüse", emoji: "🥦" },
];

// Appetitanregendes Hero-Foto (public/img, base-pfad-sicher). Lizenz: Unsplash (frei).
const HERO_IMG = (import.meta.env.BASE_URL || "/") + "img/hero-food.webp";

// Beispiel-Rezepte (verschiedene Küchen) — zeigen auf der Startseite, wie ein
// Vorschlag aussieht. Variiert beim Laden + per Tipp (zeigt die Bandbreite).
const EXAMPLE_RECIPES = [
  { emoji: "🍲", name: "Bibimbap mit Rind & Sesam", beschreibung: "Buntes koreanisches Reisgericht: knackiges Gemüse, mariniertes Rind und ein Spiegelei auf warmem Reis — abgerundet mit nussig-würziger Gochujang-Sauce.", kultur: "„Bibimbap“ heißt wörtlich „gemischter Reis“ — vor dem Essen wird traditionell alles kräftig untergerührt.", zeit: "30 Min", kalorien: "ca. 540 kcal", schaerfe: 2, gerichtTyp: "Reisgericht", proteinTyp: "Rind" },
  { emoji: "🍜", name: "Pad Thai mit Garnelen", beschreibung: "Seidige Reisbandnudeln aus dem Wok, süß-salzig-sauer balanciert mit Tamarinde, knackigen Sprossen, Erdnüssen und einem Spritzer Limette.", kultur: "Thailands berühmtestes Street-Food — in den 1930ern als Nationalgericht populär gemacht.", zeit: "25 Min", kalorien: "ca. 480 kcal", schaerfe: 1, gerichtTyp: "Nudelgericht", proteinTyp: "Meeresfrüchte" },
  { emoji: "🍳", name: "Shakshuka", beschreibung: "In würziger Tomaten-Paprika-Sauce pochierte Eier mit Kreuzkümmel und frischer Petersilie — direkt aus der Pfanne, mit Brot zum Tunken.", kultur: "Aus Nordafrika stammend, heute im ganzen Nahen Osten ein Brunch-Klassiker.", zeit: "20 Min", kalorien: "ca. 320 kcal", schaerfe: 1, gerichtTyp: "Aus der Pfanne", proteinTyp: "Ei" },
  { emoji: "🍛", name: "Chana Masala", beschreibung: "Cremig-würziges Kichererbsen-Curry mit Tomaten, Ingwer und Garam Masala — herzhaft, vegan und voller Aroma.", kultur: "Ein nordindischer Klassiker; „chana“ bedeutet Kichererbsen.", zeit: "30 Min", kalorien: "ca. 410 kcal", schaerfe: 2, gerichtTyp: "Curry", proteinTyp: "Gemüse" },
  { emoji: "🥢", name: "Teriyaki-Lachs-Bowl", beschreibung: "Glasierter Lachs mit selbstgemachter Teriyaki-Sauce auf Reis, dazu Edamame, Avocado und Sesam — frisch und sättigend.", kultur: "„Teriyaki“ beschreibt die glänzende Glasur aus Sojasauce, Mirin und Zucker.", zeit: "25 Min", kalorien: "ca. 560 kcal", schaerfe: 0, gerichtTyp: "Bowl", proteinTyp: "Fisch" },
];

const SEASONS = {
  0: "Grünkohl,Rosenkohl,Feldsalat,Pastinaken,Sellerie,Rote Bete,Wirsing",
  1: "Grünkohl,Rosenkohl,Feldsalat,Pastinaken,Sellerie,Rote Bete,Chicorée",
  2: "Bärlauch,Spargel,Rhabarber,Radieschen,Spinat,Frühlingszwiebeln",
  3: "Spargel,Rhabarber,Radieschen,Erdbeeren,Kohlrabi,neue Kartoffeln",
  4: "Spargel,Erdbeeren,Kohlrabi,Mangold,Erbsen,Kirschen",
  5: "Tomaten,Zucchini,Paprika,Gurken,Bohnen,Beeren,Pfirsiche",
  6: "Tomaten,Zucchini,Paprika,Gurken,Pfifferlinge,Mais,Beeren",
  7: "Tomaten,Zucchini,Paprika,Pflaumen,Brombeeren,Steinpilze",
  8: "Kürbis,Äpfel,Birnen,Zwetschgen,Pilze,Trauben,Maronen",
  9: "Kürbis,Äpfel,Birnen,Pilze,Maronen,Nüsse,Quitten",
  10: "Kürbis,Äpfel,Grünkohl,Rosenkohl,Feldsalat,Pastinaken",
  11: "Grünkohl,Rosenkohl,Feldsalat,Pastinaken,Sellerie,Maronen",
};

const SEASON_NAMES = {
  0: "Winter", 1: "Winter", 2: "Frühling", 3: "Frühling", 4: "Frühling",
  5: "Sommer", 6: "Sommer", 7: "Sommer", 8: "Herbst", 9: "Herbst",
  10: "Herbst", 11: "Winter",
};

// ─── Helpers ───
const toggle = (arr, id) => arr.includes(id) ? arr.filter(x => x !== id) : [...arr, id];

const greet = () => {
  const h = new Date().getHours();
  if (h < 6) return "Gute Nacht";
  if (h < 11) return "Guten Morgen";
  if (h < 14) return "Mahlzeit";
  if (h < 18) return "Guten Nachmittag";
  return "Guten Abend";
};

const autoMeal = () => {
  const h = new Date().getHours();
  const m = MEALS.find(m => m.h && h >= m.h[0] && h <= m.h[1]);
  return m ? m.id : "";
};

const load = (key) => {
  try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : null; }
  catch { return null; }
};

const save = (key, data) => {
  try { localStorage.setItem(key, JSON.stringify(data)); } catch {}
};

// ─── UI Components ───
const ProviderSelect = ({ value, onChange }) => (
  <div style={{ marginBottom: "10px" }}>
    <label style={{ display: "block", fontSize: "12px", color: "var(--ink3)", fontWeight: 500, marginBottom: "4px" }}>
      KI-Anbieter
    </label>
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      style={{
        width: "100%", padding: "10px 12px", borderRadius: "var(--r)",
        border: "2px solid var(--card-border)", background: "var(--card)",
        fontFamily: "'Outfit',sans-serif", fontSize: "14px", color: "var(--ink)",
        outline: "none", boxSizing: "border-box", cursor: "pointer",
      }}
    >
      {PROVIDERS.map(p => (
        <option key={p.id} value={p.id}>{p.emoji} {p.label}</option>
      ))}
    </select>
  </div>
);

// Transparenter Gratis-Hinweis (Google Gemini, ohne Kreditkarte) — unter der
// Key-Eingabe. Grün = kostenlos. Theme-sicher über rgba auf Karten-Hintergrund.
const GeminiTip = () => (
  <div style={{
    background: "linear-gradient(135deg,rgba(74,143,94,0.12),rgba(74,143,94,0.04))",
    border: "1px solid rgba(74,143,94,0.24)", borderRadius: "var(--r)",
    padding: "11px 13px", marginBottom: "14px",
  }}>
    <p style={{ fontSize: "12px", color: "var(--ink)", fontWeight: 600, margin: "0 0 6px" }}>
      💚 Kostenlos nutzen — mit Google Gemini, ohne Kreditkarte
    </p>
    <ol style={{ paddingLeft: "16px", fontSize: "11.5px", color: "var(--ink2)", lineHeight: 1.7, margin: 0 }}>
      <li>Gratis-Key holen:{" "}
        <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer"
           style={{ color: "var(--accent)", fontWeight: 600 }}>aistudio.google.com</a>{" "}
        → „Create API key" (beginnt mit <code style={{ fontSize: "11px" }}>AIza…</code>)</li>
      <li>Oben <strong>Google Gemini</strong> wählen, Key einfügen</li>
      <li>Fertig — KI-Vorschläge laufen, <strong>0&nbsp;€</strong></li>
    </ol>
    <p style={{ fontSize: "11px", color: "var(--ink3)", margin: "6px 0 0", lineHeight: 1.5 }}>
      Ohne Key läuft die Offline-KI weiter (sofort, gratis, etwas einfacher).
    </p>
  </div>
);

const Chip = ({ active, onClick, children, color, small }) => (
  <button onClick={onClick} style={{
    padding: small ? "6px 12px" : "9px 16px",
    borderRadius: "24px",
    border: active ? `2px solid ${color || "var(--accent)"}` : "2px solid var(--card-border)",
    background: active ? `linear-gradient(135deg,${color || "var(--accent)"},${color || "var(--accent2)"})` : "var(--card)",
    color: active ? "#fff" : "var(--ink2)",
    fontSize: small ? "13px" : "14px",
    fontFamily: "'Outfit',sans-serif",
    fontWeight: active ? 600 : 400,
    cursor: "pointer",
    transition: "all 0.25s cubic-bezier(0.34,1.56,0.64,1)",
    transform: active ? "scale(1.04)" : "scale(1)",
    boxShadow: active ? `0 4px 14px ${color || "var(--accent)"}40` : "none",
    whiteSpace: "nowrap",
    letterSpacing: "0.2px",
  }}>{children}</button>
);

const ChipGrid = ({ options, selected, onToggle, multi = true, showSub, colorMap }) => (
  <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
    {options.map(o => (
      <Chip
        key={o.id}
        active={multi ? selected.includes(o.id) : selected === o.id}
        onClick={() => onToggle(o.id)}
        color={colorMap ? o.color : undefined}
      >
        {o.emoji} {o.label}{showSub && o.sub ? ` ${o.sub}` : ""}
      </Chip>
    ))}
  </div>
);

// Select-all / clear toggle for multi-select chip lists (e.g. allergies)
const BulkToggle = ({ options, selected, onSelectAll, onClear, label = "Allergien" }) => {
  const allSelected = options.length > 0 && options.every(o => selected.includes(o.id));
  const noneSelected = selected.length === 0;
  return (
    <div style={{ display: "flex", gap: "8px", marginBottom: "10px", flexWrap: "wrap" }}>
      <Chip
        small
        active={allSelected}
        onClick={allSelected ? onClear : onSelectAll}
        color="#C44040"
      >
        {allSelected ? `✓ Alle ${label} ausgewählt` : `✅ Alle ${label} auswählen`}
      </Chip>
      {!noneSelected && !allSelected && (
        <Chip small onClick={onClear} color="#8A8070">✕ Zurücksetzen</Chip>
      )}
    </div>
  );
};

const Card = ({ children, style, anim, delay }) => (
  <div style={{
    background: "var(--card)",
    backdropFilter: "blur(24px) saturate(1.3)",
    WebkitBackdropFilter: "blur(24px) saturate(1.3)",
    borderRadius: "var(--R)",
    padding: "26px",
    border: "1px solid var(--card-border)",
    boxShadow: "var(--inset-hi), var(--shadow)",
    animation: anim ? `${anim} 0.5s cubic-bezier(0.16,1,0.3,1) both` : undefined,
    animationDelay: delay || "0s",
    ...style,
  }}>{children}</div>
);

// Schlanke Stroke-Icons (24px, currentColor) — professioneller als Emojis in
// den Section-Headern. Bewusst minimal gehalten; erweiterbar.
const ICON_PATHS = {
  ingredients: <><path d="M4 7h11M4 12h11M4 17h7" /><circle cx="19" cy="7" r="1.3" /><circle cx="19" cy="12" r="1.3" /></>,
  steps: <><path d="M5 6h14M5 6l1.4 12.5a1.5 1.5 0 0 0 1.5 1.3h8.2a1.5 1.5 0 0 0 1.5-1.3L19 6" /><path d="M9 3.5h6" /><path d="M9.5 10v6M14.5 10v6" /></>,
  nutrition: <path d="M4 13l3.5-.0 2-4.5 3 9 2.2-5 1.8 0.5H21" />,
  alert: <><path d="M12 3 2.5 20h19L12 3Z" /><path d="M12 10v4.5M12 17.4v.1" /></>,
  label: <><path d="M3 12l8.3-8.3a2 2 0 0 1 1.4-.6H19a2 2 0 0 1 2 2v6.3a2 2 0 0 1-.6 1.4L12 21a2 2 0 0 1-2.8 0L3 14.8a2 2 0 0 1 0-2.8Z" /><circle cx="16.5" cy="7.5" r="1.3" /></>,
  sun: <><circle cx="12" cy="12" r="4" /><path d="M12 2v2.5M12 19.5V22M2 12h2.5M19.5 12H22M4.9 4.9l1.8 1.8M17.3 17.3l1.8 1.8M19.1 4.9l-1.8 1.8M6.7 17.3l-1.8 1.8" /></>,
  moon: <path d="M21 12.8A8.5 8.5 0 1 1 11.2 3a6.6 6.6 0 0 0 9.8 9.8Z" />,
};

const Icon = ({ name, size = 19, color = "var(--accent)", style: s }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color}
    strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"
    style={{ flexShrink: 0, ...s }}>
    {ICON_PATHS[name]}
  </svg>
);

// Respektiert die System-Einstellung „weniger Bewegung" (lazy init → kein
// setState im Effect-Body).
const usePrefersReducedMotion = () => {
  const [reduce, setReduce] = useState(
    () => typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches || false
  );
  useEffect(() => {
    const m = window.matchMedia("(prefers-reduced-motion: reduce)");
    const handler = () => setReduce(m.matches);
    m.addEventListener("change", handler);
    return () => m.removeEventListener("change", handler);
  }, []);
  return reduce;
};

// Zahl zählt beim Erscheinen sanft hoch (easeOutCubic) — premiumiges Detail.
const CountUp = ({ end, decimals = 0, duration = 900 }) => {
  const reduce = usePrefersReducedMotion();
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (reduce) return; // kein State-Set im Effect-Body — Wert wird unten direkt gezeigt
    let raf, start;
    const step = (t) => {
      if (start == null) start = t;
      const p = Math.min((t - start) / duration, 1);
      setVal(end * (1 - Math.pow(1 - p, 3))); // setState nur im rAF-Callback
      if (p < 1) raf = requestAnimationFrame(step);
      else setVal(end);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [end, duration, reduce]);
  const shown = reduce ? end : val;
  return <>{Number(shown).toFixed(decimals)}</>;
};

const ST = ({ children, sub, icon }) => (
  <div style={{ marginBottom: "10px" }}>
    <h3 style={{
      display: "flex", alignItems: "center", gap: "9px",
      fontFamily: "'Fraunces',serif", fontSize: "17px", fontWeight: 700,
      color: "var(--ink)", letterSpacing: "-0.3px",
    }}>
      {icon && <Icon name={icon} />}
      {children}
    </h3>
    {sub && <p style={{
      fontFamily: "'Outfit',sans-serif", fontSize: "13px",
      color: "var(--ink3)", marginTop: "2px", marginLeft: icon ? "28px" : 0,
    }}>{sub}</p>}
  </div>
);

const Btn = ({ children, onClick, disabled, secondary, style: s }) => (
  <button onClick={onClick} disabled={disabled} style={{
    width: "100%", padding: "16px", borderRadius: "16px",
    border: secondary ? "2px solid var(--card-border)" : "none",
    background: secondary ? "var(--card)" : disabled ? "var(--ink3)" : "linear-gradient(135deg,var(--berry) 0%,var(--plum) 100%)",
    color: secondary ? "var(--ink2)" : "#fff",
    fontSize: "15px", fontWeight: 700, fontFamily: "'Outfit',sans-serif",
    cursor: disabled ? "not-allowed" : "pointer",
    boxShadow: secondary || disabled ? "none" : "0 6px 20px rgba(178,58,72,0.32)",
    transition: "all 0.25s ease", letterSpacing: "0.3px",
    opacity: disabled ? 0.5 : 1,
    ...s,
  }}>{children}</button>
);

const Badge = ({ icon, text }) => (
  <div style={{
    padding: "5px 12px", borderRadius: "20px", background: "var(--card)",
    border: "1px solid var(--card-border)", fontSize: "12px", color: "var(--ink2)",
    fontWeight: 500, fontFamily: "'Outfit',sans-serif", fontVariantNumeric: "tabular-nums",
    display: "inline-flex", alignItems: "center", gap: "4px",
  }}>{icon} {text}</div>
);

const CloseBar = ({ title, onClose }) => (
  <div style={{
    display: "flex", justifyContent: "space-between", alignItems: "center",
    padding: "16px 0", animation: "fadeUp 0.3s ease both",
  }}>
    <h2 style={{ fontFamily: "'Fraunces',serif", fontSize: "24px", color: "var(--ink)", fontWeight: 800 }}>{title}</h2>
    <button onClick={onClose} style={{ background: "none", border: "none", fontSize: "24px", cursor: "pointer", color: "var(--ink2)" }}>✕</button>
  </div>
);

const Layout = ({ children, photo }) => {
  // Parallax: die feste Foto-Ebene wird beim Scrollen langsamer mitbewegt
  // (direkt per Ref, kein React-Re-Render). Mobil-sicher (kein background-
  // attachment:fixed, das auf iOS bricht). Respektiert „Reduzierte Bewegung".
  const bgRef = useRef(null);
  useEffect(() => {
    if (!photo || !bgRef.current) return;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
    const el = bgRef.current;
    let raf = 0;
    const apply = () => {
      raf = 0;
      const y = window.scrollY || window.pageYOffset || 0;
      const ty = Math.min(y * 0.3, window.innerHeight * 0.25); // gedeckelt → keine Kanten
      el.style.transform = `translate3d(0, ${ty}px, 0) scale(1.08)`;
    };
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(apply); };
    window.addEventListener("scroll", onScroll, { passive: true });
    apply();
    return () => { window.removeEventListener("scroll", onScroll); if (raf) cancelAnimationFrame(raf); };
  }, [photo]);

  if (photo) {
    return (
      <div style={{ minHeight: "100vh", position: "relative", background: "var(--bg1)", fontFamily: "'Outfit',sans-serif" }}>
        <div ref={bgRef} aria-hidden="true" style={{
          position: "fixed", left: 0, right: 0, top: "-30vh", height: "160vh", zIndex: 0, pointerEvents: "none",
          backgroundImage: `url(${HERO_IMG})`, backgroundSize: "cover", backgroundPosition: "center top",
          willChange: "transform",
        }} />
        <div aria-hidden="true" style={{ position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none", background: "var(--photo-scrim)" }} />
        <div style={{ maxWidth: "560px", margin: "0 auto", padding: "22px 20px 64px", position: "relative", zIndex: 1 }}>
          {children}
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(160deg,var(--bg1) 0%,var(--bg2) 40%,var(--bg3) 100%)",
      backgroundSize: "200% 200%",
      animation: "bgShift 20s ease infinite",
      fontFamily: "'Outfit',sans-serif",
    }}>
      <div style={{ maxWidth: "560px", margin: "0 auto", padding: "22px 20px 64px", position: "relative", zIndex: 1 }}>
        {children}
      </div>
    </div>
  );
};

const InputField = ({ value, onChange, placeholder, multiline, style: s }) => {
  const base = {
    width: "100%", padding: "14px 16px", borderRadius: "var(--r)",
    border: "2px solid var(--card-border)", background: "var(--card)",
    fontFamily: "'Outfit',sans-serif", fontSize: "14px", color: "var(--ink)",
    outline: "none", boxSizing: "border-box", ...s,
  };
  if (multiline) return <textarea value={value} onChange={onChange} placeholder={placeholder} style={{ ...base, minHeight: "90px", resize: "vertical", lineHeight: 1.6 }} />;
  return <input value={value} onChange={onChange} placeholder={placeholder} style={{ ...base, fontSize: "16px" }} />;
};

// ─── Ingredient Picker (Chips by Category) ───
const IngredientPicker = ({ selected, onToggle, profile }) => {
  const [activeCategory, setActiveCategory] = useState("gemüse");
  const [search, setSearch] = useState("");
  const [filteredFoods, setFilteredFoods] = useState([]);
  const [allFoods, setAllFoods] = useState([]);

  useEffect(() => {
    getFoodsFiltered(profile).then(setAllFoods).catch(() => setAllFoods(FOODS));
  }, [profile]);

  useEffect(() => {
    if (search.trim()) {
      const q = search.toLowerCase();
      setFilteredFoods(allFoods.filter(f => f.name.toLowerCase().includes(q)));
    } else {
      setFilteredFoods(allFoods.filter(f => f.category === activeCategory));
    }
  }, [activeCategory, search, allFoods]);

  return (
    <div>
      <input
        value={search}
        onChange={e => setSearch(e.target.value)}
        placeholder="🔍 Zutat suchen..."
        style={{
          width: "100%", padding: "10px 14px", borderRadius: "var(--r)",
          border: "2px solid var(--card-border)", background: "var(--card)",
          fontFamily: "'Outfit',sans-serif", fontSize: "14px", color: "var(--ink)",
          outline: "none", boxSizing: "border-box", marginBottom: "10px",
        }}
      />
      {!search && (
        <div style={{ display: "flex", gap: "4px", overflowX: "auto", paddingBottom: "8px", marginBottom: "8px", WebkitOverflowScrolling: "touch" }}>
          {FOOD_CATEGORIES.map(cat => (
            <button key={cat.id} onClick={() => setActiveCategory(cat.id)} style={{
              padding: "5px 10px", borderRadius: "16px", border: "none",
              background: activeCategory === cat.id ? "var(--accent)" : "var(--bg2)",
              color: activeCategory === cat.id ? "#fff" : "var(--ink3)",
              fontSize: "12px", fontWeight: 500, cursor: "pointer", whiteSpace: "nowrap",
              fontFamily: "'Outfit',sans-serif", transition: "all 0.2s ease",
            }}>{cat.emoji} {cat.label}</button>
          ))}
        </div>
      )}
      <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", maxHeight: "180px", overflowY: "auto" }}>
        {filteredFoods.map(food => {
          const isSelected = selected.includes(food.name);
          return (
            <button key={food.id} onClick={() => onToggle(food.name)} style={{
              padding: "5px 10px", borderRadius: "16px",
              border: isSelected ? "2px solid var(--accent)" : "1.5px solid var(--card-border)",
              background: isSelected ? "linear-gradient(135deg,var(--accent),var(--accent2))" : "var(--card)",
              color: isSelected ? "#fff" : "var(--ink2)",
              fontSize: "12px", fontWeight: isSelected ? 600 : 400, cursor: "pointer",
              fontFamily: "'Outfit',sans-serif", transition: "all 0.2s ease",
              display: "flex", alignItems: "center", gap: "3px",
            }}>
              <span>{food.emoji}</span>
              <span>{food.name}</span>
              {food.histamin === "high" && <span title="Histamin" style={{ fontSize: "9px" }}>⚠️</span>}
            </button>
          );
        })}
        {filteredFoods.length === 0 && (
          <p style={{ fontSize: "12px", color: "var(--ink3)", padding: "8px" }}>Keine passenden Zutaten gefunden.</p>
        )}
      </div>
      {selected.length > 0 && (
        <div style={{ marginTop: "10px", padding: "8px 12px", borderRadius: "var(--r)", background: "var(--bg2)" }}>
          <p style={{ fontSize: "11px", color: "var(--ink3)", marginBottom: "6px" }}>Ausgewählt ({selected.length}):</p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "4px" }}>
            {selected.map(name => (
              <span key={name} onClick={() => onToggle(name)} style={{
                padding: "3px 8px", borderRadius: "10px",
                background: "var(--accent)", color: "#fff", fontSize: "11px",
                cursor: "pointer", fontWeight: 500,
              }}>{name} ✕</span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Photo Upload Component ───
const PhotoUpload = ({ onResult, apiKey, backendAvailable, provider = "claude", onNeedKey }) => {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState(null);
  const fileRef = useRef(null);

  const handleFile = async (file) => {
    if (!file || (!backendAvailable && !apiKey)) return;
    setUploading(true);
    setPreview(URL.createObjectURL(file));

    try {
      const base64 = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result.split(",")[1]);
        reader.readAsDataURL(file);
      });

      let items;
      if (backendAvailable) {
        const headers = withAppToken({ "Content-Type": "application/json" });
        if (apiKey) headers["x-user-api-key"] = apiKey;
        const r = await fetch(api("/api/recognize"), {
          method: "POST",
          headers,
          body: JSON.stringify({ image: base64, mediaType: file.type }),
        });
        const d = await r.json();
        if (d.needsKey) { onNeedKey?.(); setUploading(false); return; }
        items = JSON.parse(d.text.replace(/```json|```/g, "").trim());
      } else {
        if (!apiKey) { onNeedKey?.(); setUploading(false); return; }
        const t = await callVisionProvider({
          providerId: provider,
          apiKey,
          base64,
          mediaType: file.type,
          prompt: "Erkenne alle Lebensmittel/Zutaten auf diesem Foto. Antworte NUR mit einem JSON-Array der Zutatennamen auf Deutsch, z.B. [\"Tomaten\",\"Käse\",\"Hähnchenbrust\"]. Keine Erklärung, nur das Array.",
        });
        items = JSON.parse((t || "[]").replace(/```json|```/g, "").trim());
      }
      onResult(items);
    } catch (e) {
      console.error("Foto-Erkennung fehlgeschlagen:", e);
    }
    setUploading(false);
  };

  return (
    <div>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={e => handleFile(e.target.files[0])}
        style={{ display: "none" }}
      />
      <button onClick={() => fileRef.current?.click()} disabled={uploading || !apiKey} style={{
        width: "100%", padding: "14px", borderRadius: "var(--r)",
        border: "2px dashed var(--card-border)", background: "var(--bg2)",
        color: "var(--ink2)", fontSize: "14px", fontWeight: 500,
        cursor: uploading ? "wait" : "pointer", fontFamily: "'Outfit',sans-serif",
        transition: "all 0.2s ease", display: "flex", alignItems: "center",
        justifyContent: "center", gap: "8px",
      }}>
        {uploading ? (
          <><span style={{ animation: "cookSpin 1.5s ease infinite", display: "inline-block" }}>📷</span> KI erkennt Zutaten...</>
        ) : (
          <>📸 Foto vom Kühlschrank</>
        )}
      </button>
      {!apiKey && <p style={{ fontSize: "11px", color: "#C44040", marginTop: "4px" }}>API-Key benötigt für Foto-Erkennung</p>}
      {preview && (
        <div style={{ marginTop: "8px", borderRadius: "var(--r)", overflow: "hidden", maxHeight: "150px" }}>
          <img src={preview} alt="Kühlschrank" style={{ width: "100%", objectFit: "cover", borderRadius: "var(--r)" }} />
        </div>
      )}
    </div>
  );
};

// ─── Default State ───
const defaultProfile = {
  allergies: [], nutAllergies: [], histamin: false, diet: [], cuisines: [],
  dislikes: "", name: "", persons: 2,
  crossAllergies: [], avoidAdditives: [], deficiencies: [],
  metabolism: [], goals: [],
  // Personalization
  avatar: "🧑‍🍳", age: "", activity: "", cookSkill: "normal", favoriteDish: "",
};

// Cooking experience levels — drive how detailed the steps are written.
const COOK_SKILLS = [
  { id: "anfänger", label: "Anfänger", emoji: "🐣", sub: "Erklär mir alles" },
  { id: "normal", label: "Geübt", emoji: "🍳", sub: "Solide Basics" },
  { id: "profi", label: "Profi", emoji: "👨‍🍳", sub: "Knapp & schnell" },
];

const ACTIVITY_LEVELS = [
  { id: "niedrig", label: "Wenig aktiv", emoji: "🪑" },
  { id: "mittel", label: "Mäßig aktiv", emoji: "🚶" },
  { id: "hoch", label: "Sehr aktiv", emoji: "🏃" },
];

const AVATARS = ["🧑‍🍳", "👩‍🍳", "👨‍🍳", "🦊", "🐻", "🐰", "🦉", "🌻", "🥑", "🌶️", "🍋", "🫐"];

// ─── Main App ───
export default function App() {
  const [profile, setProfile] = useState(defaultProfile);
  const [theme, setTheme] = useState(() => load(K.theme) || "light");
  const [view, setView] = useState("loading");
  const [onbStep, setOnbStep] = useState(0);
  const [meal, setMeal] = useState("");
  const [cookTime, setCookTime] = useState("");
  const [mood, setMood] = useState("");
  const [budget, setBudget] = useState("egal");
  const [persons, setPersons] = useState(2);
  const [dishType, setDishType] = useState("egal");   // optional: Art des Gerichts
  const [proteinPref, setProteinPref] = useState("egal"); // optional: Haupt-Protein
  const [shopMsg, setShopMsg] = useState("");          // kurze Bestätigung in der Einkaufsliste
  const [showMoreOpts, setShowMoreOpts] = useState(false); // Startseite: optionale Filter einklappen
  const [exampleIdx, setExampleIdx] = useState(() => Math.floor(Math.random() * EXAMPLE_RECIPES.length)); // Beispiel-Vorschau variiert
  const [fridgeInput, setFridgeInput] = useState("");
  const [selectedIngredients, setSelectedIngredients] = useState([]);
  const [fridgeInputMode, setFridgeInputMode] = useState("chips"); // chips | text | photo
  const [guestMode, setGuestMode] = useState(false);
  const [guestAllergies, setGuestAllergies] = useState([]);
  const [guestHistamin, setGuestHistamin] = useState(false);
  const [guestDiet, setGuestDiet] = useState([]);
  const [suggestion, setSuggestion] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadMsg, setLoadMsg] = useState("");
  const [history, setHistory] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [reviewedRecipes, setReviewedRecipes] = useState({});
  const [streak, setStreak] = useState({ count: 0, lastDate: "" });
  const [shopList, setShopList] = useState([]);
  const [shopHistory, setShopHistory] = useState([]);
  const [shopTab, setShopTab] = useState("list");      // list | history
  const [shopGroupBy, setShopGroupBy] = useState("category"); // category | recipe
  const [mode, setMode] = useState("quick");
  const [overlay, setOverlay] = useState(null);
  const [sourcesOpen, setSourcesOpen] = useState(false); // Quellen & Nachweis collapsed by default
  const [viewingSaved, setViewingSaved] = useState(false); // true when viewing a saved/imported recipe
  const recipeReturn = useRef(null); // where "back" returns to after viewing a saved recipe
  const [wellnessTab, setWellnessTab] = useState("ernährung");
  const [importText, setImportText] = useState("");
  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState("");
  const [reminder, setReminder] = useState({ enabled: false, time: "18:00" });
  const [weekPlan, setWeekPlan] = useState(null);
  const [planLoading, setPlanLoading] = useState(false);
  const [apiKey, setApiKey] = useState("");
  const [provider, setProvider] = useState(DEFAULT_PROVIDER);
  const [showKeyInput, setShowKeyInput] = useState(false);
  const [offlineMode, setOfflineMode] = useState(false);
  const [isOnline, setIsOnline] = useState(typeof navigator !== "undefined" ? navigator.onLine : true);
  const mounted = useRef(false);

  // ─── Theme (Light / Luxus-Dark) ───
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    save(K.theme, theme);
  }, [theme]);

  // ─── Network status listener ───
  // Auto-flip to offline AI when the device drops connectivity, and flip back
  // to online mode when the network returns (but only if the user didn't
  // explicitly pin offline mode during the session).
  const offlinePinnedByUser = useRef(false);
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      if (!offlinePinnedByUser.current) setOfflineMode(false);
    };
    const handleOffline = () => {
      setIsOnline(false);
      setOfflineMode(true);
    };
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // ─── Init ───
  useEffect(() => {
    if (mounted.current) return;
    mounted.current = true;

    const p = load(K.profile);
    const h = load(K.history);
    const f = load(K.favorites);
    const s = load(K.streak);
    const sh = load(K.shoplist);
    const shh = load(K.shophistory);
    const key = load(K.apiKey);

    if (p) {
      // Migrate old profiles without nutAllergies
      if (!p.nutAllergies) p.nutAllergies = [];
      // Migrate old "nüsse" allergy to all nut types
      if (p.allergies?.includes("nüsse")) {
        p.allergies = p.allergies.filter(a => a !== "nüsse");
        p.nutAllergies = NUT_ALLERGIES.map(n => n.id);
      }
      setProfile(p);
      setView("home");
    } else setView("onboarding");
    if (h) setHistory(h);
    if (f) setFavorites(f);
    if (s) setStreak(s);
    if (sh) setShopList(sh);
    if (shh) setShopHistory(shh);
    if (key) setApiKey(key);
    const prov = load(K.provider);
    if (prov && PROVIDERS.some(p => p.id === prov)) setProvider(prov);
    const rv = load(K.reviewed);
    if (rv) setReviewedRecipes(rv);
    const rem = load(K.reminder);
    if (rem) setReminder(rem);
    setMeal(autoMeal());

    // Deep links / PWA app-shortcuts (?mode=plan|fridge|quick, ?view=shop|wellness)
    if (p && typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const qpMode = params.get("mode");
      if (["quick", "fridge", "plan"].includes(qpMode)) setMode(qpMode);
      const qpView = params.get("view");
      if (qpView === "shop") { setShopTab("list"); setOverlay("shop"); }
      else if (qpView === "wellness") setOverlay("wellness");
      else if (qpView === "favs") setOverlay("favs");
    }

    // Init IndexedDB
    initDB(FOODS).catch(() => {});
  }, []);

  // ─── Persistence ───
  const saveProfile = useCallback((p) => { setProfile(p); save(K.profile, p); }, []);

  const updateStreak = useCallback(() => {
    const today = new Date().toISOString().slice(0, 10);
    const yest = new Date(Date.now() - 864e5).toISOString().slice(0, 10);
    let ns;
    if (streak.lastDate === today) ns = streak;
    else if (streak.lastDate === yest) ns = { count: streak.count + 1, lastDate: today };
    else ns = { count: 1, lastDate: today };
    setStreak(ns);
    save(K.streak, ns);
  }, [streak]);

  const toggleIngredient = useCallback((name) => {
    setSelectedIngredients(prev =>
      prev.includes(name) ? prev.filter(n => n !== name) : [...prev, name]
    );
  }, []);

  const addIngredientsFromPhoto = useCallback((items) => {
    setSelectedIngredients(prev => {
      const newItems = items.filter(i => !prev.includes(i));
      return [...prev, ...newItems];
    });
  }, []);

  const toggleFav = useCallback((dish) => {
    const exists = favorites.find(f => f.name === dish.name);
    const u = exists
      ? favorites.filter(f => f.name !== dish.name)
      : [...favorites, { ...dish, savedAt: new Date().toISOString() }];
    // Learning signal: like when adding to favorites (offline recipes)
    if (!exists && dish._offline && dish._foodIds) {
      recordLike(dish, dish._foodIds, dish._templateId);
    }
    setFavorites(u);
    save(K.favorites, u);
  }, [favorites]);

  // Add items to the shopping list, tagging each with its source recipe and
  // a food category so the list can be grouped meaningfully.
  const addToShopList = useCallback((items, recipeName = "") => {
    const nl = [
      ...shopList,
      ...items
        .filter(i => !shopList.find(s => s.name === i))
        .map(i => ({ name: i, checked: false, recipe: recipeName, category: categorizeIngredient(i) })),
    ];
    setShopList(nl);
    save(K.shoplist, nl);
  }, [shopList]);

  const toggleShopItem = useCallback((name) => {
    const u = shopList.map(item => item.name === name ? { ...item, checked: !item.checked } : item);
    setShopList(u);
    save(K.shoplist, u);
  }, [shopList]);

  const removeShopItem = useCallback((name) => {
    const u = shopList.filter(item => item.name !== name);
    setShopList(u);
    save(K.shoplist, u);
  }, [shopList]);

  const clearShopList = useCallback(() => { setShopList([]); save(K.shoplist, []); }, []);

  // Archive the current list into history (e.g. "shopping done") and start fresh.
  const archiveShopList = useCallback(() => {
    if (shopList.length === 0) return;
    const entry = {
      date: new Date().toISOString(),
      items: shopList,
      total: shopList.length,
      checked: shopList.filter(s => s.checked).length,
      recipes: [...new Set(shopList.map(s => s.recipe).filter(Boolean))],
    };
    const nh = [entry, ...shopHistory].slice(0, 20);
    setShopHistory(nh);
    save(K.shophistory, nh);
    setShopList([]);
    save(K.shoplist, []);
  }, [shopList, shopHistory]);

  // Restore an archived shopping list back into the active list.
  const restoreShopList = useCallback((entry) => {
    const merged = [...shopList];
    entry.items.forEach(it => {
      if (!merged.find(s => s.name === it.name)) merged.push({ ...it, checked: false });
    });
    setShopList(merged);
    save(K.shoplist, merged);
    setShopTab("list");
  }, [shopList]);

  const deleteShopHistory = useCallback((date) => {
    const nh = shopHistory.filter(e => e.date !== date);
    setShopHistory(nh);
    save(K.shophistory, nh);
  }, [shopHistory]);

  const saveApiKey = useCallback((key) => { setApiKey(key); save(K.apiKey, key); }, []);
  const saveProvider = useCallback((id) => { setProvider(id); save(K.provider, id); }, []);

  // ─── Daily cooking reminder (local notification, no server) ───
  const updateReminder = useCallback(async (next) => {
    // When enabling, ask for notification permission first.
    if (next.enabled && !reminder.enabled) {
      if (typeof Notification === "undefined") {
        alert("Dieses Gerät unterstützt keine Benachrichtigungen.");
        return;
      }
      if (Notification.permission !== "granted") {
        const perm = await Notification.requestPermission();
        if (perm !== "granted") {
          alert("Benachrichtigungen wurden nicht erlaubt. Du kannst sie in den Geräte-Einstellungen freigeben.");
          return;
        }
      }
    }
    setReminder(next);
    save(K.reminder, next);
  }, [reminder.enabled]);

  // Schedule the reminder while the app/tab is alive. Reliable scheduling in
  // the background needs the installed PWA or the native app; this is a
  // best-effort timer that re-arms for the next day after firing.
  useEffect(() => {
    if (!reminder.enabled) return;
    if (typeof Notification === "undefined" || Notification.permission !== "granted") return;
    let timer;
    const arm = () => {
      const [h, m] = (reminder.time || "18:00").split(":").map(Number);
      const now = new Date();
      const next = new Date();
      next.setHours(h || 18, m || 0, 0, 0);
      if (next <= now) next.setDate(next.getDate() + 1);
      timer = setTimeout(async () => {
        try {
          const opts = {
            body: "Zeit zu kochen! Brauchst du eine Idee für heute? 🍳",
            icon: "/smart-meal/icons/icon-192.png",
            badge: "/smart-meal/icons/icon-192.png",
            tag: "smart-meal-reminder",
          };
          const reg = await navigator.serviceWorker?.getRegistration();
          if (reg?.showNotification) await reg.showNotification("Smart Meal 🍽️", opts);
          else new Notification("Smart Meal 🍽️", opts);
        } catch { /* notifications are best-effort */ }
        arm(); // re-arm for the next day
      }, next.getTime() - now.getTime());
    };
    arm();
    return () => clearTimeout(timer);
  }, [reminder]);

  // ─── Prompt Builder ───
  const buildPrompt = useCallback((m) => {
    const allAllergies = [...profile.allergies, ...(guestMode ? guestAllergies : [])];
    const an = allAllergies.map(a => ALL_ALLERGIES.find(o => o.id === a)?.label).filter(Boolean);
    const nutLabels = (profile.nutAllergies || []).map(n => NUT_ALLERGIES.find(o => o.id === n)?.label).filter(Boolean);
    if (nutLabels.length > 0) an.push(`Nüsse: ${nutLabels.join(", ")}`);
    const hi = profile.histamin || (guestMode && guestHistamin);
    const dn = [...profile.diet, ...(guestMode ? guestDiet : [])].map(d => DIETS.find(o => o.id === d)?.label).filter(Boolean);
    const cn = profile.cuisines.map(c => CUISINES.find(o => o.id === c)?.label).filter(Boolean);
    const recent = history.slice(-8).map(h => h.name).join(", ");
    const mo = new Date().getMonth();

    // Cross-allergies
    const crossAllergyInfo = (profile.crossAllergies || []).map(id => {
      const ca = CROSS_ALLERGIES.find(c => c.id === id);
      if (!ca) return null;
      const highFoods = ca.triggers.filter(t => t.severity === "high").map(t => t.food);
      const medFoods = ca.triggers.filter(t => t.severity === "medium").map(t => t.food);
      return `${ca.label}: STRENG meiden: ${highFoods.join(", ")}. Vorsicht: ${medFoods.join(", ")}`;
    }).filter(Boolean);

    // Metabolism conditions
    const metaInfo = (profile.metabolism || []).map(id => {
      const mc = METABOLISM_CONDITIONS.find(c => c.id === id);
      if (!mc) return null;
      return `${mc.label}: Regeln: ${mc.dietRules.slice(0, 3).join("; ")}. Meiden: ${mc.avoid.join(", ")}. Bevorzugen: ${mc.prefer.join(", ")}`;
    }).filter(Boolean);

    // Nutrient deficiencies
    const defInfo = (profile.deficiencies || []).map(id => {
      const nd = NUTRIENT_DEFICIENCIES.find(d => d.id === id);
      if (!nd) return null;
      return `${nd.label}: Bevorzuge: ${nd.foods.join(", ")}. Tipp: ${nd.tips}`;
    }).filter(Boolean);

    // Health goals
    const goalInfo = (profile.goals || []).map(id => {
      const g = HEALTH_GOALS.find(h => h.id === id);
      return g ? `${g.label} (${g.tip})` : null;
    }).filter(Boolean);

    // Avoided additives
    const addInfo = (profile.avoidAdditives || []).map(id => {
      const a = ADDITIVES.find(x => x.id === id);
      return a ? a.label : null;
    }).filter(Boolean);

    const base = `Du bist ein weltklasse Koch-Assistent und Ernährungsberater. Du kennst internationale Küche, afrikanische Spezialitäten und saisonale deutsche Küche. Du nimmst Unverträglichkeiten und gesundheitliche Einschränkungen SEHR ERNST.

PROFIL:
- Allergien: ${an.length ? an.join(", ") : "keine"}
- Histaminintoleranz: ${hi ? "JA – STRENG vermeiden: gereifter Käse, Wurst, Schinken, Salami, Tomaten, Tomatenmark, Spinat, Avocado, Aubergine, fermentiertes (Sauerkraut, Kimchi, Sojasauce, Miso, Tempeh), Essig, Alkohol, Konserven, Hefeextrakt, Zitrusfrüchte, Erdbeeren, Ananas, Walnüsse, Cashews, Schokolade, Kakao, lang gelagertes Fleisch/Fisch, Räucherfisch, Thunfisch. NUR frische Lebensmittel!" : "nein"}
- Ernährung: ${dn.length ? dn.join(", ") : "omnivor"}
- Küchen: ${cn.length ? cn.join(", ") : "international"}
- Abneigungen: ${profile.dislikes || "keine"}
- Portionen: ${persons}
${guestMode ? "- ⚠️ GÄSTE-MODUS: Alle Gäste-Einschränkungen beachten!" : ""}
${crossAllergyInfo.length ? `\nKREUZALLERGIEN (⚠️ STRENG BEACHTEN):\n${crossAllergyInfo.map(c => `- ${c}`).join("\n")}` : ""}
${metaInfo.length ? `\nSTOFFWECHSEL-ERKRANKUNGEN (⚠️ STRENG BEACHTEN):\n${metaInfo.map(m => `- ${m}`).join("\n")}` : ""}
${defInfo.length ? `\nNÄHRSTOFFMANGEL (gezielt einbauen):\n${defInfo.map(d => `- ${d}`).join("\n")}` : ""}
${goalInfo.length ? `\nGESUNDHEITSZIELE:\n${goalInfo.map(g => `- ${g}`).join("\n")}` : ""}
${addInfo.length ? `\nZUSATZSTOFFE VERMEIDEN:\n- ${addInfo.join(", ")}\n- Rezepte nur mit natürlichen Zutaten, keine Fertigprodukte mit diesen E-Stoffen empfehlen!` : ""}

SAISON (${SEASON_NAMES[mo]}): ${SEASONS[mo]}`;

    const fridgeItems = [...selectedIngredients, ...(fridgeInput.trim() ? fridgeInput.split(/[,\n]+/).map(s => s.trim()).filter(Boolean) : [])];

    const mealLabel = MEALS.find(x => x.id === meal)?.label || "";
    const mealRule = meal === "frühstück"
      ? "STRIKT ein FRÜHSTÜCK – typische Frühstücksgerichte (Porridge, Müsli, Overnight Oats, Bowl, Joghurt, Toast, Rührei, Pancakes, Shakshuka, Croque). KEIN Mittag- oder Abendessen, KEINE Pasta/Pizza/Eintöpfe/Currys/Steaks als Hauptgericht."
      : meal === "mittag"
      ? "STRIKT ein MITTAGESSEN – sättigend, ausgewogen. KEIN Frühstück (keine Porridge/Pancakes/Müsli)."
      : meal === "abend"
      ? "STRIKT ein ABENDESSEN – warm oder kalt, eher leichter als Mittag. KEIN Frühstück."
      : meal === "snack"
      ? "STRIKT ein SNACK – kleine Portion, keine vollständige Hauptmahlzeit."
      : "";

    // Step detail scales with the user's self-rated cooking experience.
    const skill = profile.cookSkill || "normal";
    const stepRule = skill === "anfänger"
      ? `Schritte ausführlich und anfängerfreundlich, 6–9 Stück. Erkläre Technik-Begriffe kurz (z.B. "anschwitzen = bei mittlerer Hitze glasig braten"), nenne konkrete Temperaturen/Stufen, Zeiten ("ca. 5 Min, bis goldbraun") und woran man erkennt, dass etwas fertig ist. Keine Roman-Sätze – klar und schrittweise.`
      : skill === "profi"
      ? `Schritte knapp und effizient, 4–6 Stück. Setze Grundtechniken voraus, keine Erklärungen von Basics.`
      : `Schritte konkret und chronologisch, 5–7 Stück. Mit Zeiten und Hitzestufen, kurze Hinweise auf Gar-Erkennung. Nicht übererklären.`;

    // Shared rule block: every mode must honor meal-type + ingredient coherence.
    const coherenceRule = `\n\nKONSISTENZREGELN (STRIKT):\n- Jede in "zutaten" genannte Zutat MUSS in "schritte" vorkommen. Jede in "schritte" erwähnte Zutat MUSS in "zutaten" stehen.\n- Alle zutaten im Format "Menge + Einheit + Zutat" (z.B. "200 g Haferflocken").\n- ${stepRule}\n- Gib bei jedem Schritt, wo sinnvoll, Zeit und Hitze an.\n- Gericht-Name muss zum Mahlzeitentyp passen.`;

    // Redaktioneller Mehrwert wie auf einem guten Rezept-Blog: appetitliche
    // Beschreibung, Kultur-Story, Schärfegrad, Gericht-Typ/Protein, Zutaten-Ersatz.
    const styleRule = `\n\nSTIL & MEHRWERT (wichtig):\n- "beschreibung": appetitlich & einladend wie ein gutes Food-Magazin, 1–2 Sätze – mach Lust aufs Gericht (Aromen, Textur), nicht nur sachlich.\n- "kultur": kurze Herkunft/Bedeutung des Gerichts (Story, Region, ggf. wörtliche Übersetzung des Namens), 1–2 Sätze. Bei schlichten Alltagsgerichten knapp halten.\n- "schaerfe": Schärfegrad 0–3 (0=nicht scharf, 1=mild, 2=mittelscharf, 3=scharf) – ehrlich einschätzen.\n- "gerichtTyp": Art des Gerichts (z.B. Suppe, Nudelgericht, Reisgericht, Bowl, Gegrilltes, Wok, Geschmortes, Street Food, Dessert).\n- "proteinTyp": Haupt-Protein/Hauptzutat (z.B. Huhn, Rind, Fisch, Tofu, Gemüse).\n- "ersatz": NUR für ungewöhnliche/Spezialzutaten (z.B. Gochujang, Fischsauce, Miso, Tamarinde): je {"zutat","was" (1 kurze Erklärung, was es ist),"ersatz" (leicht erhältliche Supermarkt-Alternative)}. Leeres Array [], wenn nichts Exotisches dabei ist.`;

    // Optionale Verfeinerung (nur wenn gesetzt): Gericht-Typ + Haupt-Protein.
    const prefLine = `${dishType && dishType !== "egal" ? `\n- Art des Gerichts: ${DISH_TYPES.find(d => d.id === dishType)?.label}` : ""}${proteinPref && proteinPref !== "egal" ? `\n- Haupt-Protein: ${PROTEINS.find(p => p.id === proteinPref)?.label}` : ""}`;

    // Erweiterte JSON-Felder (Mehrwert) — an beide Detail-Rezept-Prompts angehängt.
    const extraFields = `,"kultur":"1-2 Sätze Herkunft/Story","schaerfe":0,"gerichtTyp":"...","proteinTyp":"...","ersatz":[{"zutat":"...","was":"kurze Erklärung","ersatz":"Supermarkt-Alternative"}]`;

    if (m === "fridge") return `${base}\n\nKÜHLSCHRANK-MODUS: Zutaten: ${fridgeItems.join(", ")}\nNur diese + Grundzutaten verwenden.${meal ? `\n- Mahlzeit: ${mealLabel} → ${mealRule}` : ""}${prefLine}\n${recent ? `Nicht wiederholen: ${recent}` : ""}${coherenceRule}${styleRule}\n\nNUR JSON (kein Markdown):\n{"name":"...","beschreibung":"appetitlich, 1-2 Sätze","zutaten":["Menge + Zutat"],"schritte":["..."],"zeit":"XX Min","kalorien":"ca. XXX kcal","protein":"ca. XX g","tipp":"...","emoji":"...","schwierigkeit":"Leicht|Mittel|Anspruchsvoll","tags":["..."],"herkunft":"Land/Region","gesundheitshinweis":"..."${extraFields}}`;

    if (m === "plan") return `${base}\n\nWOCHENPLAN: 5 Werktage (Mo–Fr), je Frühstück/Mittag/Abend. Budget: ${BUDGETS.find(b => b.id === budget)?.label || "normal"}. Abwechslungsreich!\n- Frühstück: NUR typische Frühstücksgerichte (Oats, Bowl, Toast, Rührei).\n- Mittag: sättigende Hauptgerichte.\n- Abend: eher leichter als Mittag.\n\nNUR JSON:\n{"plan":[{"tag":"Montag","frühstück":{"name":"...","emoji":"...","zeit":"XX Min"},"mittag":{"name":"...","emoji":"...","zeit":"XX Min"},"abend":{"name":"...","emoji":"...","zeit":"XX Min"}},...],  "einkaufsliste":["Zutat 1","Zutat 2",...]}`;

    return `${base}\n\n- Mahlzeit: ${mealLabel} → ${mealRule}\n- Kochzeit: ${TIMES.find(x => x.id === cookTime)?.label || ""}\n- Stimmung: ${MOODS.find(x => x.id === mood)?.label || ""}\n- Budget: ${BUDGETS.find(x => x.id === budget)?.label || ""}${prefLine}\n${recent ? `- NICHT wiederholen: ${recent}` : ""}${coherenceRule}${styleRule}\n\nNUR JSON:\n{"name":"...","beschreibung":"appetitlich, 1-2 Sätze","zutaten":["Menge + Zutat"],"schritte":["..."],"zeit":"XX Min","kalorien":"ca. XXX kcal","protein":"ca. XX g","tipp":"...","emoji":"...","schwierigkeit":"Leicht|Mittel|Anspruchsvoll","tags":["..."],"herkunft":"Land/Region","weinempfehlung":"passender Wein/Getränk","gesundheitshinweis":"..."${extraFields}}`;
  }, [profile, guestMode, guestAllergies, guestHistamin, guestDiet, history, persons, fridgeInput, selectedIngredients, budget, meal, cookTime, mood, dishType, proteinPref]);

  // ─── Backend availability check ───
  const [backendAvailable, setBackendAvailable] = useState(null);
  const [freemiumInfo, setFreemiumInfo] = useState({ remaining: 0, dailyLimit: 10, freemium: false });
  useEffect(() => {
    fetch(api("/api/health")).then(r => r.json())
      .then(d => {
        setBackendAvailable(d.status === "ok" && (d.hasApiKey || d.freemium));
        setFreemiumInfo({ remaining: d.remaining ?? 0, dailyLimit: d.dailyLimit ?? 10, freemium: !!d.freemium });
      })
      .catch(() => setBackendAvailable(false));
  }, []);

  // ─── API Call (backend proxy with freemium/BYOK, direct-browser fallback) ───
  const callAPI = useCallback(async (prompt, endpoint = "/api/suggest") => {
    // Try backend first (freemium or BYOK)
    if (backendAvailable) {
      const headers = withAppToken({ "Content-Type": "application/json" });
      if (apiKey) headers["x-user-api-key"] = apiKey;
      const r = await fetch(api(endpoint), {
        method: "POST",
        headers,
        body: JSON.stringify({ prompt }),
      });
      if (!r.ok) {
        const err = await r.json().catch(() => ({}));
        if (err.needsKey) { setShowKeyInput(true); throw new Error(err.error); }
        throw new Error(err.error || `API Fehler: ${r.status}`);
      }
      const d = await r.json();
      if (d.remaining != null) setFreemiumInfo(prev => ({ ...prev, remaining: d.remaining }));
      return JSON.parse(d.text.replace(/```json|```/g, "").trim());
    }

    // Fallback: direct browser access (demo / GitHub Pages mode), routed to the
    // user-selected provider (Claude / OpenAI / Gemini).
    if (!apiKey) { setShowKeyInput(true); throw new Error("Kein API-Key"); }
    const t = await callTextProvider({ providerId: provider, apiKey, prompt, maxTokens: 1500 });
    return JSON.parse(t.replace(/```json|```/g, "").trim());
  }, [apiKey, backendAvailable, provider]);

  // ─── Generate ───
  const generate = useCallback(async (m) => {
    setLoading(true);
    setSuggestion(null);
    setViewingSaved(false);
    setSourcesOpen(false);
    const useOffline = offlineMode || (!backendAvailable && !apiKey);
    const msgs = useOffline
      ? ["Schwarm-Agenten starten...", "Zutaten analysieren...", "Rezept zusammenstellen...", "Nährwerte berechnen..."]
      : ["KI-Anfrage läuft (Offline-Fallback bereit)...", "Zutaten werden ausgewählt...", "Rezept wird erstellt...", "Falls offline: Schwarm-Intelligenz übernimmt..."];
    let mi = 0;
    setLoadMsg(msgs[0]);
    const iv = setInterval(() => { mi = (mi + 1) % msgs.length; setLoadMsg(msgs[mi]); }, 1800);

    // Run offline swarm engine with current context. Shared by primary and
    // fallback paths so the API-failure retry never drifts from user input.
    const runOffline = () => {
      const fridgeItems = [...selectedIngredients, ...(fridgeInput.trim() ? fridgeInput.split(/[,\n]+/).map(s => s.trim()).filter(Boolean) : [])];
      return generateOfflineSuggestion({
        profile, meal, cookTime, mood, budget, persons, history,
        fridgeItems: m === "fridge" ? fridgeItems : [],
        guestMode, guestAllergies, guestHistamin, guestDiet,
      });
    };

    try {
      let r;
      if (useOffline && m !== "plan") {
        r = await runOffline();
      } else {
        try {
          r = await callAPI(buildPrompt(m || "quick"));
        } catch (apiErr) {
          // Graceful API → Offline-AI fallback so the user never hits a dead end.
          if (m !== "plan") {
            setLoadMsg("API nicht erreichbar – wechsle zu Offline-KI...");
            r = await runOffline();
            r._fallbackFromApi = true;
          } else {
            throw apiErr;
          }
        }
      }
      if (r.error) {
        setSuggestion(r);
      } else {
        setSuggestion(withDeclaration(r));
        const nh = [...history, { name: r.name, date: new Date().toISOString(), emoji: r.emoji }].slice(-30);
        setHistory(nh);
        save(K.history, nh);
        updateStreak();
      }
      setView("result");
    } catch (e) {
      setSuggestion({ error: true, message: e.message });
      setView("result");
    }
    clearInterval(iv);
    setLoading(false);
  }, [apiKey, backendAvailable, offlineMode, callAPI, buildPrompt, history, updateStreak, profile, meal, cookTime, mood, budget, persons, fridgeInput, selectedIngredients, guestMode, guestAllergies, guestHistamin, guestDiet]);

  const generatePlan = useCallback(async () => {
    setPlanLoading(true);
    setWeekPlan(null);
    const useOffline = offlineMode || (!backendAvailable && !apiKey);
    try {
      if (useOffline) {
        const result = await generateOfflinePlan({
          profile, meal, cookTime, mood, budget, persons, history,
          guestMode, guestAllergies, guestHistamin, guestDiet,
        });
        setWeekPlan(result);
      } else {
        setWeekPlan(await callAPI(buildPrompt("plan"), "/api/meal-plan"));
      }
    } catch { setWeekPlan({ error: true }); }
    setPlanLoading(false);
  }, [apiKey, backendAvailable, offlineMode, callAPI, buildPrompt, profile, meal, cookTime, mood, budget, persons, history, guestMode, guestAllergies, guestHistamin, guestDiet]);

  const reset = useCallback(() => {
    setMeal(autoMeal()); setCookTime(""); setMood(""); setBudget("egal");
    setSuggestion(null); setView("home"); setFridgeInput(""); setSelectedIngredients([]);
    setGuestMode(false); setGuestAllergies([]); setGuestHistamin(false); setGuestDiet([]);
    setViewingSaved(false);
  }, []);

  // ─── Open a saved / imported / plan recipe in the result detail view ───
  const openRecipe = useCallback((recipe, ret = { view: "home" }) => {
    if (!recipe) return;
    recipeReturn.current = ret;
    setSuggestion(withDeclaration(recipe));
    setViewingSaved(true);
    setSourcesOpen(false);
    setOverlay(null);
    setView("result");
    if (typeof window !== "undefined") window.scrollTo(0, 0);
  }, []);

  // Return from a saved-recipe detail view to wherever it was opened from.
  const closeRecipe = useCallback(() => {
    const ret = recipeReturn.current;
    setViewingSaved(false);
    setSuggestion(null);
    if (ret?.overlay) { setView("home"); setOverlay(ret.overlay); }
    else if (ret?.mode) { setMode(ret.mode); setView("home"); }
    else setView("home");
    recipeReturn.current = null;
  }, []);

  // ─── PDF export via print window (no external dependency) ───
  const downloadRecipePDF = useCallback((r) => {
    if (!r) return;
    const esc = (t) => String(t ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    const li = (arr) => (arr || []).map(x => `<li>${esc(x)}</li>`).join("");
    const steps = (r.schritte || []).map((s, i) => `<li><span class="num">${i + 1}</span>${esc(s)}</li>`).join("");
    const allerg = r.allergene?.length
      ? `<p class="meta"><strong>Allergene:</strong> ${r.allergene.map(a => `${esc(a.code)} ${esc(a.label)}`).join(", ")}</p>` : "";
    const zusatz = r.zusatzstoffe?.length
      ? `<p class="meta"><strong>Zusatzstoffe:</strong> ${r.zusatzstoffe.map(zs => `${esc(zs.number)} ${esc(zs.label)}`).join(", ")}</p>` : "";
    const alk = r.alkohol
      ? `<p class="meta"><strong>Alkoholgehalt:</strong> ${esc(r.alkohol.label)}</p>` : "";
    const makros = r.makros
      ? `<table class="macros"><tr><td>Energie</td><td>${r.makros.kcal} kcal</td></tr><tr><td>Protein</td><td>${r.makros.protein} g</td></tr><tr><td>Fett</td><td>${r.makros.fat} g</td></tr><tr><td>Kohlenhydrate</td><td>${r.makros.carbs} g</td></tr><tr><td>Ballaststoffe</td><td>${r.makros.fiber} g</td></tr><tr><td>Salz</td><td>${r.makros.salt} g</td></tr></table>`
      : (r.kalorien ? `<p class="meta">${esc(r.kalorien)}${r.protein ? " · " + esc(r.protein) : ""}</p>` : "");
    const html = `<!doctype html><html lang="de"><head><meta charset="utf-8"><title>${esc(r.name)}</title>
<style>
  @page { margin: 18mm; }
  body { font-family: Georgia, 'Times New Roman', serif; color: #2C2016; line-height: 1.55; max-width: 720px; margin: 0 auto; padding: 24px; }
  h1 { font-size: 26px; margin: 0 0 4px; }
  .emoji { font-size: 40px; }
  .desc { color: #5A4A38; font-style: italic; margin-bottom: 12px; }
  .meta { font-size: 13px; color: #5A4A38; margin: 4px 0; }
  h2 { font-size: 16px; border-bottom: 2px solid #B23A48; padding-bottom: 4px; margin: 22px 0 10px; color: #8E2A3A; }
  ul, ol { padding-left: 20px; } li { margin-bottom: 6px; }
  ol { list-style: none; padding-left: 0; }
  ol li { display: flex; gap: 10px; align-items: flex-start; }
  .num { display: inline-flex; align-items: center; justify-content: center; min-width: 22px; height: 22px; border-radius: 50%; background: #B23A48; color: #fff; font-size: 12px; font-family: sans-serif; flex-shrink: 0; }
  table.macros { border-collapse: collapse; font-size: 13px; }
  table.macros td { border: 1px solid #ddd; padding: 4px 12px; }
  .tip { background: #FBF3E9; border-left: 3px solid #B23A48; padding: 10px 14px; margin: 14px 0; font-size: 14px; }
  .footer { margin-top: 28px; font-size: 10px; color: #9A8A76; border-top: 1px solid #ccc; padding-top: 8px; }
</style></head><body>
  <div class="emoji">${esc(r.emoji || "🍽️")}</div>
  <h1>${esc(r.name)}</h1>
  ${r.beschreibung ? `<p class="desc">${esc(r.beschreibung)}</p>` : ""}
  <p class="meta">⏱️ ${esc(r.zeit || "")}${r.schwierigkeit ? " · 📊 " + esc(r.schwierigkeit) : ""}${r.herkunft ? " · 🌍 " + esc(r.herkunft) : ""} · 👤 ${persons} Portion(en)</p>
  ${allerg}
  ${zusatz}
  ${alk}
  <h2>Inhaltsstoffe</h2><ul>${li(r.zutaten)}</ul>
  <h2>Zubereitung</h2><ol>${steps}</ol>
  ${r.tipp ? `<div class="tip">💡 ${esc(r.tipp)}</div>` : ""}
  ${makros ? `<h2>Nährwerte (pro Portion)</h2>${makros}` : ""}
  ${r.gesundheitshinweis ? `<div class="tip">🩺 ${esc(r.gesundheitshinweis)}</div>` : ""}
  <div class="footer">Erstellt mit „Was esse ich?“ · Angaben ohne Gewähr. Bei Allergien Originalverpackung prüfen.</div>
  <script>window.onload=function(){window.print();}</script>
</body></html>`;
    const w = window.open("", "_blank");
    if (!w) { alert("Bitte Pop-ups für den PDF-Export erlauben."); return; }
    w.document.write(html);
    w.document.close();
  }, [persons]);

  // ─── Import a recipe from pasted text (e.g. an Instagram caption) ───
  const importRecipe = useCallback(async () => {
    const text = importText.trim();
    if (text.length < 15) { setImportError("Bitte den Rezept-Text einfügen (Caption, Zutaten, Schritte)."); return; }
    setImporting(true);
    setImportError("");
    const prompt = `Du bekommst den Text eines Social-Media-Rezepts (z.B. Instagram-Caption). Extrahiere ein strukturiertes Rezept auf Deutsch. Rechne Mengen auf ${persons} Portion(en) um, falls erkennbar. Wenn Angaben fehlen, ergänze sinnvoll und realistisch.

TEXT:
"""
${text.slice(0, 4000)}
"""

Antworte NUR mit JSON (kein Markdown):
{"name":"...","beschreibung":"1 Satz","zutaten":["Menge + Zutat"],"schritte":["..."],"zeit":"XX Min","kalorien":"ca. XXX kcal","protein":"ca. XX g","tipp":"...","emoji":"...","schwierigkeit":"Leicht|Mittel|Anspruchsvoll","tags":["..."],"herkunft":"...","gesundheitshinweis":"kurzer Hinweis"}`;
    try {
      const r = await callAPI(prompt);
      if (!r || !r.name || !Array.isArray(r.zutaten)) throw new Error("Konnte kein Rezept erkennen.");
      r._imported = true;
      setImportText("");
      openRecipe(r, { overlay: "import" });
    } catch (e) {
      setImportError(
        backendAvailable || apiKey
          ? `Import fehlgeschlagen: ${e.message}. Bitte Text prüfen oder erneut versuchen.`
          : "Für den Import wird ein KI-Anbieter benötigt (API-Key in den Einstellungen, oder Freemium online)."
      );
    }
    setImporting(false);
  }, [importText, persons, callAPI, openRecipe, backendAvailable, apiKey]);

  // ─── Open a meal from the weekly plan as a full recipe ───
  // Offline plans already carry the full suggestion in `_full`. API plans only
  // have name/emoji/zeit, so we ask the AI (or offline swarm) to flesh it out.
  const openPlanMeal = useCallback(async (m, mealType) => {
    if (!m) return;
    if (m._full) { openRecipe(m._full, { mode: "plan" }); return; }
    setSuggestion(null);
    setView("result");
    setLoading(true);
    setViewingSaved(false);
    setLoadMsg(`Rezept für „${m.name}" wird geladen...`);
    try {
      const prompt = `${buildPrompt(mealType === "frühstück" ? "quick" : "quick").split("NUR JSON")[0]}
Erstelle das vollständige Rezept für genau dieses Gericht: "${m.name}" (${mealType}).
Halte dich an Allergien/Unverträglichkeiten aus dem Profil oben.

NUR JSON (kein Markdown):
{"name":"${m.name}","beschreibung":"1 Satz","zutaten":["Menge + Zutat"],"schritte":["..."],"zeit":"${m.zeit || "XX Min"}","kalorien":"ca. XXX kcal","protein":"ca. XX g","tipp":"...","emoji":"${m.emoji || "🍽️"}","schwierigkeit":"Leicht|Mittel|Anspruchsvoll","tags":["..."],"herkunft":"...","gesundheitshinweis":"..."}`;
      const r = await callAPI(prompt);
      setLoading(false);
      openRecipe(r, { mode: "plan" });
    } catch {
      setLoading(false);
      // Fallback: show what we have so the click is never a dead end.
      openRecipe({
        name: m.name, emoji: m.emoji || "🍽️", zeit: m.zeit, beschreibung: "",
        zutaten: [], schritte: ["Für dieses Gericht aus dem Plan liegt offline kein Detail-Rezept vor. Erstelle es im Schnell-Modus neu, um alle Schritte zu sehen."],
      }, { mode: "plan" });
    }
  }, [openRecipe, buildPrompt, callAPI]);

  // ─── API Key Modal ───
  if (showKeyInput) return (
    <Layout>
      <div style={{ paddingTop: "40px" }}>
        <Card anim="scaleIn">
          <div style={{ textAlign: "center", marginBottom: "16px" }}>
            <div style={{ fontSize: "48px", marginBottom: "12px" }}>🔑</div>
            <h2 style={{ fontFamily: "'Fraunces',serif", color: "var(--ink)", fontSize: "20px", marginBottom: "8px" }}>
              {freemiumInfo.freemium && freemiumInfo.remaining <= 0 ? "Tageslimit erreicht" : "Eigenen API-Key verwenden"}
            </h2>
            <p style={{ color: "var(--ink3)", fontSize: "13px", lineHeight: 1.5 }}>
              {freemiumInfo.freemium && freemiumInfo.remaining <= 0
                ? `Deine ${freemiumInfo.dailyLimit} kostenlosen Anfragen für heute sind aufgebraucht. Mit eigenem Key hast du unbegrenzte Nutzung.`
                : "Für unbegrenzte Nutzung kannst du deinen eigenen API-Schlüssel verwenden."}
            </p>
          </div>

          <div style={{
            background: "linear-gradient(135deg,rgba(178,58,72,0.08),rgba(126,90,134,0.08))",
            border: "1px solid rgba(178,58,72,0.15)", borderRadius: "var(--r)",
            padding: "12px 14px", marginBottom: "16px",
          }}>
            <p style={{ fontSize: "12px", color: "var(--ink2)", lineHeight: 1.5, margin: 0 }}>
              🧠 <strong>Kein Key nötig:</strong> Die App funktioniert komplett ohne API-Key.
              Die eingebaute Offline-KI (Schwarm-Intelligenz) erstellt Rezepte direkt auf
              deinem Gerät. Ein eigener Key schaltet zusätzlich die KI-Anbieter unten frei.
            </p>
          </div>

          <ProviderSelect value={provider} onChange={saveProvider} />

          <GeminiTip />

          <div style={{ background: "var(--bg2)", borderRadius: "var(--r)", padding: "14px", marginBottom: "16px" }}>
            <p style={{ fontSize: "13px", color: "var(--ink)", fontWeight: 600, marginBottom: "8px" }}>So geht's (2 Minuten):</p>
            <ol style={{ paddingLeft: "18px", fontSize: "12px", color: "var(--ink2)", lineHeight: 1.8, margin: 0 }}>
              <li>Account auf <strong>{getProvider(provider).console}</strong> erstellen</li>
              <li>Zu den <strong>API Keys</strong> gehen</li>
              <li>Neuen Key erstellen</li>
              <li>Key kopieren und unten einfügen</li>
            </ol>
          </div>

          <input
            type="password"
            value={apiKey}
            onChange={e => setApiKey(e.target.value)}
            placeholder={getProvider(provider).placeholder}
            style={{
              width: "100%", padding: "12px 14px", borderRadius: "var(--r)",
              border: "2px solid var(--card-border)", background: "var(--card)",
              fontFamily: "'Outfit',sans-serif", fontSize: "14px", color: "var(--ink)",
              outline: "none", boxSizing: "border-box", marginBottom: "4px",
            }}
          />
          <p style={{ fontSize: "11px", color: "var(--ink3)", marginBottom: "12px" }}>
            🔒 Dein Key bleibt lokal in deinem Browser. Er wird nie an uns gesendet.
          </p>
          <Btn onClick={() => { saveApiKey(apiKey); setShowKeyInput(false); }} disabled={!isValidKey(provider, apiKey)}>
            Verbinden & Loslegen
          </Btn>
          <div style={{ marginTop: "8px" }}>
            <Btn secondary onClick={() => { offlinePinnedByUser.current = true; setOfflineMode(true); setShowKeyInput(false); }}>
              🧠 Ohne API-Key nutzen (Offline-KI)
            </Btn>
          </div>
        </Card>
      </div>
    </Layout>
  );

  // ─── Loading Screen ───
  if (view === "loading") return (
    <Layout>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "90vh" }}>
        <div style={{ textAlign: "center", animation: "scaleIn 0.5s ease both" }}>
          <div style={{ fontSize: "72px", animation: "float 2s ease infinite" }}>🍽️</div>
          <h1 style={{ fontFamily: "'Fraunces',serif", fontSize: "28px", color: "var(--ink)", marginTop: "12px", fontWeight: 900 }}>Was esse ich?</h1>
        </div>
      </div>
    </Layout>
  );

  // ─── Onboarding ───
  if (view === "onboarding") {
    const steps = [
      {
        t: "Wie heißt du?", s: "Damit wir dich begrüßen können",
        c: <InputField value={profile.name} onChange={e => setProfile(p => ({ ...p, name: e.target.value }))} placeholder="Dein Name..." style={{ fontSize: "16px" }} />,
      },
      {
        t: "Unverträglichkeiten", s: "Was verträgst du nicht?",
        c: <>
          <BulkToggle
            options={ALLERGIES}
            selected={profile.allergies}
            onSelectAll={() => setProfile(p => ({ ...p, allergies: ALLERGIES.map(a => a.id) }))}
            onClear={() => setProfile(p => ({ ...p, allergies: [] }))}
            label="Allergien"
          />
          <ChipGrid options={ALLERGIES} selected={profile.allergies} onToggle={id => setProfile(p => ({ ...p, allergies: toggle(p.allergies, id) }))} />
          <div style={{ marginTop: "14px" }}>
            <Chip active={profile.histamin} onClick={() => setProfile(p => ({ ...p, histamin: !p.histamin }))} color="#C44040">⚠️ Histaminintoleranz</Chip>
          </div>
        </>,
      },
      {
        t: "Nussallergien", s: "Welche Nüsse verträgst du nicht? (Einzeln wählbar)",
        c: <>
          <BulkToggle
            options={NUT_ALLERGIES}
            selected={profile.nutAllergies || []}
            onSelectAll={() => setProfile(p => ({ ...p, nutAllergies: NUT_ALLERGIES.map(n => n.id) }))}
            onClear={() => setProfile(p => ({ ...p, nutAllergies: [] }))}
            label="Nüsse"
          />
          <ChipGrid options={NUT_ALLERGIES} selected={profile.nutAllergies || []} onToggle={id => setProfile(p => ({ ...p, nutAllergies: toggle(p.nutAllergies || [], id) }))} />
        </>,
      },
      {
        t: "Ernährungsform", s: "Wie ernährst du dich?",
        c: <ChipGrid options={DIETS} selected={profile.diet} onToggle={id => setProfile(p => ({ ...p, diet: toggle(p.diet, id) }))} />,
      },
      {
        t: "Lieblingsküchen", s: "Was isst du am liebsten?",
        c: <ChipGrid options={CUISINES} selected={profile.cuisines} onToggle={id => setProfile(p => ({ ...p, cuisines: toggle(p.cuisines, id) }))} />,
      },
      {
        t: "No-Gos", s: "Was magst du gar nicht?",
        c: <InputField multiline value={profile.dislikes} onChange={e => setProfile(p => ({ ...p, dislikes: e.target.value }))} placeholder="z.B. Koriander, Rosenkohl, Innereien, Pilze..." />,
      },
      {
        t: "Kreuzallergien", s: "Pollen- oder Latexallergien?",
        c: <>
          <p style={{ fontSize: "12px", color: "var(--ink3)", marginBottom: "10px", lineHeight: 1.5 }}>
            Bei Pollenallergie reagiert dein Körper oft auch auf bestimmte Lebensmittel (z.B. Birke → Apfel, Haselnuss). Die App warnt dich automatisch.
          </p>
          <ChipGrid options={CROSS_ALLERGIES.map(c => ({ id: c.id, label: c.label, emoji: c.emoji }))} selected={profile.crossAllergies || []} onToggle={id => setProfile(p => ({ ...p, crossAllergies: toggle(p.crossAllergies || [], id) }))} />
        </>,
      },
      {
        t: "Stoffwechsel", s: "Stoffwechselbedingte Besonderheiten?",
        c: <div style={{ display: "flex", flexDirection: "column", gap: "6px", maxHeight: "280px", overflowY: "auto" }}>
          {METABOLISM_CONDITIONS.map(m => {
            const active = (profile.metabolism || []).includes(m.id);
            return <button key={m.id} onClick={() => setProfile(p => ({ ...p, metabolism: toggle(p.metabolism || [], m.id) }))} style={{
              padding: "10px 14px", borderRadius: "var(--r)", textAlign: "left",
              border: active ? "2px solid var(--accent)" : "2px solid var(--card-border)",
              background: active ? "linear-gradient(135deg,var(--accent),var(--accent2))" : "var(--card)",
              color: active ? "#fff" : "var(--ink2)", cursor: "pointer", fontFamily: "'Outfit',sans-serif",
              transition: "all 0.2s ease",
            }}>
              <div style={{ fontSize: "14px", fontWeight: 600 }}>{m.emoji} {m.label}</div>
              <div style={{ fontSize: "11px", opacity: 0.8, marginTop: "2px" }}>{m.description}</div>
            </button>;
          })}
        </div>,
      },
      {
        t: "Nährstoffmangel", s: "Bekannte Mängel? (Optional)",
        c: <>
          <p style={{ fontSize: "12px", color: "var(--ink3)", marginBottom: "10px", lineHeight: 1.5 }}>
            Die App schlägt gezielt nährstoffreiche Rezepte vor, um deine Mängel auszugleichen.
          </p>
          <ChipGrid options={NUTRIENT_DEFICIENCIES.map(n => ({ id: n.id, label: n.label, emoji: n.emoji }))} selected={profile.deficiencies || []} onToggle={id => setProfile(p => ({ ...p, deficiencies: toggle(p.deficiencies || [], id) }))} />
        </>,
      },
      {
        t: "Deine Ziele", s: "Was willst du mit Ernährung erreichen?",
        c: <ChipGrid options={HEALTH_GOALS} selected={profile.goals || []} onToggle={id => setProfile(p => ({ ...p, goals: toggle(p.goals || [], id) }))} />,
      },
      {
        t: "Zusatzstoffe", s: "Welche Zusatzstoffe willst du meiden?",
        c: <>
          <p style={{ fontSize: "12px", color: "var(--ink3)", marginBottom: "10px", lineHeight: 1.5 }}>
            Optional: Die App berücksichtigt diese bei Rezeptvorschlägen und warnt bei problematischen Zutaten.
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px", maxHeight: "250px", overflowY: "auto" }}>
            {ADDITIVE_CATEGORIES.map(cat => {
              const items = ADDITIVES.filter(a => a.category === cat.id);
              return <div key={cat.id}>
                <p style={{ fontSize: "12px", fontWeight: 600, color: "var(--ink)", marginBottom: "4px" }}>{cat.emoji} {cat.label}</p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "4px" }}>
                  {items.map(a => {
                    const active = (profile.avoidAdditives || []).includes(a.id);
                    return <button key={a.id} onClick={() => setProfile(p => ({ ...p, avoidAdditives: toggle(p.avoidAdditives || [], a.id) }))} title={a.note} style={{
                      padding: "3px 8px", borderRadius: "12px", fontSize: "11px",
                      border: active ? "1.5px solid var(--accent)" : "1.5px solid var(--card-border)",
                      background: active ? "var(--accent)" : "var(--card)",
                      color: active ? "#fff" : a.risk === "high" ? "#C44040" : "var(--ink2)",
                      fontWeight: active ? 600 : a.risk === "high" ? 500 : 400,
                      cursor: "pointer", fontFamily: "'Outfit',sans-serif",
                    }}>{a.label}</button>;
                  })}
                </div>
              </div>;
            })}
          </div>
        </>,
      },
      {
        t: "KI verbinden", s: "Damit die App Rezepte erstellen kann",
        c: <>
          <div style={{ background: "var(--bg2)", borderRadius: "var(--r)", padding: "12px", marginBottom: "12px" }}>
            <ol style={{ paddingLeft: "18px", fontSize: "12px", color: "var(--ink2)", lineHeight: 1.8, margin: 0 }}>
              <li>Öffne <strong>console.anthropic.com</strong></li>
              <li>Erstelle einen kostenlosen Account</li>
              <li>Gehe zu <strong>API Keys → Create Key</strong></li>
              <li>Kopiere den Key hierher</li>
            </ol>
          </div>
          <input type="password" value={apiKey} onChange={e => setApiKey(e.target.value)} placeholder="sk-ant-api03-..." style={{
            width: "100%", padding: "14px 16px", borderRadius: "var(--r)",
            border: "2px solid var(--card-border)", background: "var(--card)",
            fontFamily: "'Outfit',sans-serif", fontSize: "14px", color: "var(--ink)",
            outline: "none", boxSizing: "border-box",
          }} />
          <p style={{ fontSize: "11px", color: "var(--ink3)", marginTop: "6px" }}>🔒 Bleibt lokal in deinem Browser gespeichert. Optional – du kannst das auch später machen.</p>
        </>,
      },
    ];
    const cs = steps[onbStep];

    return (
      <Layout>
        <div style={{ textAlign: "center", padding: "28px 0 20px", animation: "fadeUp 0.5s ease both" }}>
          <div style={{ fontSize: "56px", animation: "float 3s ease infinite" }}>🍽️</div>
          <h1 style={{ fontFamily: "'Fraunces',serif", fontSize: "32px", color: "var(--ink)", fontWeight: 900, marginTop: "8px", letterSpacing: "-1px" }}>Was esse ich?</h1>
          <p style={{ fontSize: "14px", color: "var(--ink3)", marginTop: "4px" }}>Dein persönlicher Essens-Berater</p>
        </div>
        <div style={{ display: "flex", gap: "6px", justifyContent: "center", marginBottom: "16px" }}>
          {steps.map((_, i) => (
            <div key={i} style={{
              width: i === onbStep ? "28px" : "8px", height: "8px", borderRadius: "4px",
              background: i === onbStep ? "var(--accent)" : i < onbStep ? "var(--accent3)" : "var(--card-border)",
              transition: "all 0.35s cubic-bezier(0.34,1.56,0.64,1)",
            }} />
          ))}
        </div>
        <Card anim="fadeUp" delay="0.1s">
          {onbStep === 0 && (
            <div style={{
              background: "linear-gradient(135deg,rgba(178,58,72,0.08),rgba(126,90,134,0.08))",
              border: "1px solid rgba(178,58,72,0.15)", borderRadius: "var(--r)",
              padding: "12px 14px", marginBottom: "16px",
            }}>
              <p style={{ fontSize: "12.5px", color: "var(--ink2)", lineHeight: 1.55, margin: 0 }}>
                👋 <strong>Kurz zu dir:</strong> Die folgenden Fragen helfen Smart Meal, Rezepte genau auf
                dich zuzuschneiden — Allergien, Vorlieben und Ziele. Alles ist <strong>optional</strong> und
                jederzeit in den <strong>Einstellungen</strong> änderbar.
              </p>
            </div>
          )}
          <ST sub={cs.s}>{cs.t}</ST>
          <div style={{ animation: "fadeUp 0.3s ease both" }}>{cs.c}</div>
          <div style={{ display: "flex", gap: "10px", marginTop: "20px" }}>
            {onbStep > 0 && <Btn secondary onClick={() => setOnbStep(s => s - 1)} style={{ flex: 1 }}>Zurück</Btn>}
            <Btn onClick={() => {
              if (onbStep < steps.length - 1) setOnbStep(s => s + 1);
              else { saveProfile(profile); saveApiKey(apiKey); setView("home"); }
            }} style={{ flex: 1 }}>
              {onbStep < steps.length - 1 ? "Weiter →" : "Los geht's! 🚀"}
            </Btn>
          </div>
          <button onClick={() => { saveProfile(profile); saveApiKey(apiKey); setView("home"); }} style={{
            display: "block", margin: "14px auto 0", background: "none", border: "none",
            color: "var(--ink3)", fontSize: "12.5px", cursor: "pointer", padding: "4px 8px", textDecoration: "underline",
          }}>
            Überspringen — später in den Einstellungen einrichten
          </button>
        </Card>
      </Layout>
    );
  }

  // ─── Overlays ───
  if (overlay === "favs") return (
    <Layout>
      <CloseBar title="❤️ Favoriten" onClose={() => setOverlay(null)} />
      {favorites.length === 0 ? (
        <Card anim="fadeUp"><p style={{ color: "var(--ink3)", textAlign: "center", padding: "24px 0" }}>Noch keine Favoriten gespeichert.</p></Card>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {favorites.map((f, i) => (
            <Card key={i} anim="fadeUp" delay={`${i * 0.05}s`} style={{ cursor: "pointer" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "10px" }}>
                <div onClick={() => openRecipe(f, { overlay: "favs" })} style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ fontSize: "20px", marginRight: "8px" }}>{f.emoji}</span>
                  <strong style={{ fontFamily: "'Fraunces',serif", color: "var(--ink)" }}>{f.name}</strong>
                  <div style={{ fontSize: "12px", color: "var(--ink3)", marginTop: "2px" }}>
                    {[f.beschreibung, f.zeit, f.herkunft].filter(Boolean).join(" · ")}
                  </div>
                  {f.tags && (
                    <div style={{ display: "flex", gap: "4px", marginTop: "4px", flexWrap: "wrap" }}>
                      {f.tags.slice(0, 4).map((t, j) => (
                        <span key={j} style={{ fontSize: "10px", padding: "2px 8px", borderRadius: "8px", background: "var(--bg2)", color: "var(--ink3)" }}>#{t}</span>
                      ))}
                    </div>
                  )}
                  <div style={{ fontSize: "11px", color: "var(--accent)", marginTop: "6px", fontWeight: 600 }}>Antippen zum Öffnen →</div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "6px", flexShrink: 0 }}>
                  <button onClick={(e) => { e.stopPropagation(); openRecipe(f, { overlay: "favs" }); }} title="Rezept ansehen" style={{ background: "none", border: "none", fontSize: "20px", cursor: "pointer" }}>👁️</button>
                  <button onClick={(e) => { e.stopPropagation(); toggleFav(f); }} title="Entfernen" style={{ background: "none", border: "none", fontSize: "18px", cursor: "pointer" }}>🗑️</button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </Layout>
  );

  if (overlay === "shop") {
    const openCount = shopList.filter(s => !s.checked).length;
    // Build the grouped view: by food category or by source recipe.
    const groups = {};
    shopList.forEach((item) => {
      const key = shopGroupBy === "recipe"
        ? (item.recipe || "Sonstige Zutaten")
        : (FOOD_CATEGORIES.find(c => c.id === item.category)?.id || "sonstiges");
      (groups[key] = groups[key] || []).push(item);
    });
    const groupOrder = shopGroupBy === "category"
      ? FOOD_CATEGORIES.map(c => c.id).filter(id => groups[id])
      : Object.keys(groups).sort();
    const groupLabel = (key) => shopGroupBy === "recipe"
      ? `🍽️ ${key}`
      : (() => { const c = FOOD_CATEGORIES.find(x => x.id === key); return c ? `${c.emoji} ${c.label}` : "🫙 Sonstiges"; })();

    return (
      <Layout>
        <CloseBar title="🛒 Einkaufsliste" onClose={() => setOverlay(null)} />

        {/* Tabs: active list vs. history */}
        <div style={{ display: "flex", background: "var(--card)", borderRadius: "14px", padding: "4px", border: "1px solid var(--card-border)", gap: "2px", marginBottom: "12px" }}>
          {[{ id: "list", l: `📝 Liste${openCount ? ` (${openCount})` : ""}` }, { id: "history", l: `🗂️ Verlauf${shopHistory.length ? ` (${shopHistory.length})` : ""}` }].map(t => (
            <button key={t.id} onClick={() => setShopTab(t.id)} style={{
              flex: 1, padding: "9px 6px", borderRadius: "10px", border: "none",
              background: shopTab === t.id ? "linear-gradient(135deg,var(--accent),var(--accent2))" : "transparent",
              color: shopTab === t.id ? "#fff" : "var(--ink3)", fontSize: "13px",
              fontWeight: shopTab === t.id ? 600 : 400, fontFamily: "'Outfit',sans-serif", cursor: "pointer",
            }}>{t.l}</button>
          ))}
        </div>

        {shopTab === "list" && (shopList.length === 0 ? (
          <Card anim="fadeUp"><p style={{ color: "var(--ink3)", textAlign: "center", padding: "24px 0" }}>Liste leer. Füge Zutaten aus einem Rezept oder Wochenplan hinzu!</p></Card>
        ) : (
          <>
            {/* Grouping toggle */}
            <div style={{ display: "flex", gap: "6px", marginBottom: "10px" }}>
              {[{ id: "category", l: "Nach Kategorie" }, { id: "recipe", l: "Nach Gericht" }].map(g => (
                <Chip key={g.id} small active={shopGroupBy === g.id} onClick={() => setShopGroupBy(g.id)}>{g.l}</Chip>
              ))}
            </div>

            {groupOrder.map((gkey, gi) => (
              <Card key={gkey} anim="fadeUp" delay={`${gi * 0.04}s`} style={{ marginBottom: "10px", padding: "16px 18px" }}>
                <p style={{ fontSize: "12px", fontWeight: 700, color: "var(--accent)", marginBottom: "6px", letterSpacing: "0.3px" }}>{groupLabel(gkey)}</p>
                <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                  {groups[gkey].map((item) => (
                    <div key={item.name} style={{
                      display: "flex", alignItems: "center", gap: "10px",
                      padding: "9px 0", borderBottom: "1px solid var(--card-border)",
                    }}>
                      <div onClick={() => toggleShopItem(item.name)} style={{
                        width: "22px", height: "22px", borderRadius: "6px", cursor: "pointer",
                        border: item.checked ? "2px solid var(--accent)" : "2px solid var(--ink3)",
                        background: item.checked ? "var(--accent)" : "transparent",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        color: "#fff", fontSize: "14px", transition: "all 0.2s ease", flexShrink: 0,
                      }}>{item.checked ? "✓" : ""}</div>
                      <span onClick={() => toggleShopItem(item.name)} style={{
                        flex: 1, cursor: "pointer", fontSize: "14px", color: item.checked ? "var(--ink3)" : "var(--ink)",
                        textDecoration: item.checked ? "line-through" : "none", transition: "all 0.2s ease",
                      }}>
                        {item.name}
                        {shopGroupBy === "category" && item.recipe && (
                          <span style={{ fontSize: "10px", color: "var(--ink3)", marginLeft: "6px" }}>· {item.recipe}</span>
                        )}
                      </span>
                      <button onClick={() => removeShopItem(item.name)} style={{ background: "none", border: "none", fontSize: "14px", cursor: "pointer", color: "var(--ink3)", flexShrink: 0 }}>✕</button>
                    </div>
                  ))}
                </div>
              </Card>
            ))}

            {/* An App / Lieferdienst übergeben — universelles Teilen (Web Share)
                + Such-Deeplinks. Direkter Warenkorb-Import ist bei Picnic & Co.
                technisch nicht möglich; die Liste wird kopiert und übergeben. */}
            {(() => {
              const open = shopList.filter(s => !s.checked);
              const items = open.length ? open : shopList;
              const recipeNames = [...new Set(shopList.map(s => s.recipe).filter(Boolean))];
              const listText = `🛒 Einkaufsliste – Smart Meal${recipeNames.length ? ` (${recipeNames.join(", ")})` : ""}\n\n${items.map(i => `• ${i.name}`).join("\n")}`;
              const flash = (m) => { setShopMsg(m); setTimeout(() => setShopMsg(""), 2400); };
              const share = async () => {
                try { if (navigator.share) { await navigator.share({ title: "Einkaufsliste – Smart Meal", text: listText }); return; } }
                catch (e) { if (e?.name === "AbortError") return; }
                try { await navigator.clipboard.writeText(listText); flash("Liste kopiert – in deiner App einfügen 📋"); } catch { flash("Teilen nicht verfügbar"); }
              };
              const copy = async () => { try { await navigator.clipboard.writeText(listText); flash("Liste kopiert ✓"); } catch { flash("Kopieren nicht verfügbar"); } };
              const toStore = async (label, url) => { try { await navigator.clipboard.writeText(listText); } catch { /* ignore */ } flash(`Liste kopiert – im ${label}-Shop einfügen/suchen`); window.open(url, "_blank", "noopener"); };
              const STORES = [
                { label: "Picnic", emoji: "🚐", url: "https://picnic.app" },
                { label: "Rewe", emoji: "🛒", url: "https://shop.rewe.de" },
                { label: "Flink", emoji: "🛵", url: "https://www.goflink.com/de-DE/" },
                { label: "Knuspr", emoji: "🥕", url: "https://www.knuspr.de" },
                { label: "Bring!", emoji: "📝", url: "https://www.getbring.com/" },
              ];
              return (
                <Card anim="fadeUp" style={{ marginBottom: "10px" }}>
                  <ST sub="Teilen oder im Lieferdienst weiter einkaufen">📦 An App übergeben</ST>
                  <div style={{ display: "flex", gap: "8px", marginTop: "8px" }}>
                    <Btn onClick={share} style={{ flex: 1 }}>📤 Teilen / an App senden</Btn>
                    <Btn secondary onClick={copy} style={{ flexShrink: 0 }}>📋 Kopieren</Btn>
                  </div>
                  <p style={{ fontSize: "11.5px", color: "var(--ink3)", margin: "12px 0 7px" }}>Direkt im Lieferdienst weiter (Liste wird kopiert – dort einfügen/suchen):</p>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "7px" }}>
                    {STORES.map(s => (
                      <button key={s.label} onClick={() => toStore(s.label, s.url)} style={{
                        display: "inline-flex", alignItems: "center", gap: "6px", padding: "7px 12px",
                        borderRadius: "999px", border: "1px solid var(--card-border)", background: "var(--card)",
                        color: "var(--ink2)", fontSize: "12.5px", fontWeight: 600, cursor: "pointer", fontFamily: "'Outfit',sans-serif",
                      }}>{s.emoji} {s.label}</button>
                    ))}
                  </div>
                  <p style={{ fontSize: "10.5px", color: "var(--ink3)", margin: "9px 0 0", lineHeight: 1.45 }}>
                    Ein direkter Warenkorb-Import ist bei diesen Diensten technisch nicht möglich — die Liste wird kopiert; du fügst sie im Shop ein bzw. suchst die Artikel.
                  </p>
                  {shopMsg && <p style={{ fontSize: "12px", color: "var(--herb)", margin: "10px 0 0", fontWeight: 600 }}>{shopMsg}</p>}
                </Card>
              );
            })()}

            <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginTop: "4px" }}>
              <Btn onClick={archiveShopList}>✅ Einkauf erledigt — archivieren</Btn>
              <Btn secondary onClick={clearShopList}>🗑️ Liste leeren</Btn>
            </div>
          </>
        ))}

        {shopTab === "history" && (shopHistory.length === 0 ? (
          <Card anim="fadeUp"><p style={{ color: "var(--ink3)", textAlign: "center", padding: "24px 0" }}>Noch keine archivierten Listen. Schließe einen Einkauf ab, um ihn hier wiederzufinden.</p></Card>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {shopHistory.map((entry, i) => (
              <Card key={entry.date} anim="fadeUp" delay={`${i * 0.04}s`}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div>
                    <div style={{ fontSize: "14px", fontWeight: 700, color: "var(--ink)", fontFamily: "'Fraunces',serif" }}>
                      {new Date(entry.date).toLocaleDateString("de-DE", { weekday: "short", day: "numeric", month: "short" })}
                    </div>
                    <div style={{ fontSize: "11px", color: "var(--ink3)", marginTop: "2px" }}>
                      {entry.total} Zutaten · {entry.checked}/{entry.total} abgehakt
                    </div>
                    {entry.recipes?.length > 0 && (
                      <div style={{ fontSize: "11px", color: "var(--ink3)", marginTop: "3px" }}>🍽️ {entry.recipes.slice(0, 3).join(", ")}{entry.recipes.length > 3 ? "…" : ""}</div>
                    )}
                  </div>
                  <button onClick={() => deleteShopHistory(entry.date)} style={{ background: "none", border: "none", fontSize: "16px", cursor: "pointer" }}>🗑️</button>
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "4px", marginTop: "8px" }}>
                  {entry.items.slice(0, 8).map((it, j) => (
                    <span key={j} style={{ fontSize: "10px", padding: "2px 8px", borderRadius: "8px", background: "var(--bg2)", color: "var(--ink3)" }}>{it.name}</span>
                  ))}
                  {entry.items.length > 8 && <span style={{ fontSize: "10px", color: "var(--ink3)", padding: "2px 4px" }}>+{entry.items.length - 8}</span>}
                </div>
                <div style={{ marginTop: "10px" }}>
                  <Chip small active onClick={() => restoreShopList(entry)}>↩️ Erneut auf die Liste</Chip>
                </div>
              </Card>
            ))}
          </div>
        ))}
      </Layout>
    );
  }

  if (overlay === "history") return (
    <Layout>
      <CloseBar title="📖 Verlauf" onClose={() => setOverlay(null)} />
      {history.length === 0 ? (
        <Card anim="fadeUp"><p style={{ color: "var(--ink3)", textAlign: "center", padding: "24px 0" }}>Noch keine Gerichte generiert.</p></Card>
      ) : (
        <Card anim="fadeUp">
          <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
            {[...history].reverse().map((h, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: "8px", padding: "8px 0", borderBottom: "1px solid var(--card-border)" }}>
                <span style={{ fontSize: "18px" }}>{h.emoji || "🍽️"}</span>
                <div>
                  <div style={{ fontSize: "14px", fontWeight: 500, color: "var(--ink)" }}>{h.name}</div>
                  <div style={{ fontSize: "11px", color: "var(--ink3)" }}>
                    {new Date(h.date).toLocaleDateString("de-DE", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </Layout>
  );

  if (overlay === "settings") return (
    <Layout>
      <CloseBar title="⚙️ Profil" onClose={() => setOverlay(null)} />
      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        <Card anim="fadeUp">
          <ST sub="So begrüßt dich die App">👤 Über dich</ST>
          <InputField value={profile.name} onChange={e => setProfile(p => ({ ...p, name: e.target.value }))} placeholder="Dein Name..." />
          <p style={{ fontSize: "12px", color: "var(--ink3)", margin: "12px 0 6px", fontWeight: 500 }}>Dein Avatar</p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
            {AVATARS.map(av => (
              <button key={av} onClick={() => setProfile(p => ({ ...p, avatar: av }))} style={{
                width: "42px", height: "42px", borderRadius: "12px", fontSize: "22px", cursor: "pointer",
                border: profile.avatar === av ? "2px solid var(--accent)" : "1.5px solid var(--card-border)",
                background: profile.avatar === av ? "rgba(178,58,72,0.1)" : "var(--card)",
                transition: "all 0.2s ease",
              }}>{av}</button>
            ))}
          </div>
          <p style={{ fontSize: "12px", color: "var(--ink3)", margin: "14px 0 6px", fontWeight: 500 }}>👨‍🍳 Koch-Erfahrung <span style={{ fontWeight: 400 }}>(steuert, wie ausführlich die Schritte sind)</span></p>
          <ChipGrid options={COOK_SKILLS} selected={profile.cookSkill || "normal"} onToggle={id => setProfile(p => ({ ...p, cookSkill: id }))} multi={false} showSub />
          <p style={{ fontSize: "12px", color: "var(--ink3)", margin: "14px 0 6px", fontWeight: 500 }}>🏃 Aktivitätslevel <span style={{ fontWeight: 400 }}>(für Portions- & Nährwert-Hinweise)</span></p>
          <ChipGrid options={ACTIVITY_LEVELS} selected={profile.activity || ""} onToggle={id => setProfile(p => ({ ...p, activity: id === profile.activity ? "" : id }))} multi={false} />
          <div style={{ display: "flex", gap: "10px", marginTop: "14px" }}>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: "12px", color: "var(--ink3)", marginBottom: "6px", fontWeight: 500 }}>Alter (optional)</p>
              <InputField value={profile.age || ""} onChange={e => setProfile(p => ({ ...p, age: e.target.value.replace(/[^\d]/g, "").slice(0, 3) }))} placeholder="z.B. 32" />
            </div>
            <div style={{ flex: 2 }}>
              <p style={{ fontSize: "12px", color: "var(--ink3)", marginBottom: "6px", fontWeight: 500 }}>Lieblingsgericht (optional)</p>
              <InputField value={profile.favoriteDish || ""} onChange={e => setProfile(p => ({ ...p, favoriteDish: e.target.value }))} placeholder="z.B. Lasagne" />
            </div>
          </div>
        </Card>
        <Card anim="fadeUp" delay="0.05s">
          <ST sub="Was du nicht verträgst">⚠️ Allergien</ST>
          <BulkToggle
            options={ALLERGIES}
            selected={profile.allergies}
            onSelectAll={() => setProfile(p => ({ ...p, allergies: ALLERGIES.map(a => a.id) }))}
            onClear={() => setProfile(p => ({ ...p, allergies: [] }))}
            label="Allergien"
          />
          <ChipGrid options={ALLERGIES} selected={profile.allergies} onToggle={id => setProfile(p => ({ ...p, allergies: toggle(p.allergies, id) }))} />
          <div style={{ marginTop: "12px" }}>
            <Chip active={profile.histamin} onClick={() => setProfile(p => ({ ...p, histamin: !p.histamin }))} color="#C44040">⚠️ Histaminintoleranz</Chip>
          </div>
        </Card>
        <Card anim="fadeUp" delay="0.08s">
          <ST sub="Einzeln auswählbar">🥜 Nussallergien</ST>
          <BulkToggle
            options={NUT_ALLERGIES}
            selected={profile.nutAllergies || []}
            onSelectAll={() => setProfile(p => ({ ...p, nutAllergies: NUT_ALLERGIES.map(n => n.id) }))}
            onClear={() => setProfile(p => ({ ...p, nutAllergies: [] }))}
            label="Nüsse"
          />
          <ChipGrid options={NUT_ALLERGIES} selected={profile.nutAllergies || []} onToggle={id => setProfile(p => ({ ...p, nutAllergies: toggle(p.nutAllergies || [], id) }))} />
        </Card>
        <Card anim="fadeUp" delay="0.1s">
          <ST>🥗 Ernährungsform</ST>
          <ChipGrid options={DIETS} selected={profile.diet} onToggle={id => setProfile(p => ({ ...p, diet: toggle(p.diet, id) }))} />
        </Card>
        <Card anim="fadeUp" delay="0.15s">
          <ST>🌍 Lieblingsküchen</ST>
          <ChipGrid options={CUISINES} selected={profile.cuisines} onToggle={id => setProfile(p => ({ ...p, cuisines: toggle(p.cuisines, id) }))} />
        </Card>
        <Card anim="fadeUp" delay="0.2s">
          <ST>🚫 Abneigungen</ST>
          <InputField multiline value={profile.dislikes} onChange={e => setProfile(p => ({ ...p, dislikes: e.target.value }))} placeholder="z.B. Koriander, Pilze..." />
        </Card>
        <Card anim="fadeUp" delay="0.25s">
          <ST sub="Pollen-/Latexallergien die Lebensmittel beeinflussen">🌳 Kreuzallergien</ST>
          <ChipGrid options={CROSS_ALLERGIES.map(c => ({ id: c.id, label: c.label, emoji: c.emoji }))} selected={profile.crossAllergies || []} onToggle={id => setProfile(p => ({ ...p, crossAllergies: toggle(p.crossAllergies || [], id) }))} />
          {(profile.crossAllergies || []).length > 0 && (
            <div style={{ marginTop: "10px", padding: "10px", borderRadius: "var(--r)", background: "rgba(178,58,72,0.06)", border: "1px solid rgba(178,58,72,0.12)" }}>
              <p style={{ fontSize: "11px", color: "var(--ink2)", fontWeight: 600, marginBottom: "4px" }}>⚠️ Betroffene Lebensmittel:</p>
              {(profile.crossAllergies || []).map(id => {
                const ca = CROSS_ALLERGIES.find(c => c.id === id);
                if (!ca) return null;
                return <div key={id} style={{ fontSize: "11px", color: "var(--ink3)", marginBottom: "4px" }}>
                  <strong>{ca.emoji} {ca.label}:</strong> {ca.triggers.filter(t => t.severity === "high").map(t => t.food).join(", ")}
                </div>;
              })}
            </div>
          )}
        </Card>
        <Card anim="fadeUp" delay="0.3s">
          <ST sub="Stoffwechselbedingte Besonderheiten">🔬 Stoffwechsel</ST>
          <ChipGrid options={METABOLISM_CONDITIONS.map(m => ({ id: m.id, label: m.label, emoji: m.emoji }))} selected={profile.metabolism || []} onToggle={id => setProfile(p => ({ ...p, metabolism: toggle(p.metabolism || [], id) }))} />
        </Card>
        <Card anim="fadeUp" delay="0.35s">
          <ST sub="Bekannte Nährstoffmängel">💊 Nährstoffmangel</ST>
          <ChipGrid options={NUTRIENT_DEFICIENCIES.map(n => ({ id: n.id, label: n.label, emoji: n.emoji }))} selected={profile.deficiencies || []} onToggle={id => setProfile(p => ({ ...p, deficiencies: toggle(p.deficiencies || [], id) }))} />
        </Card>
        <Card anim="fadeUp" delay="0.4s">
          <ST sub="Was du erreichen möchtest">🎯 Gesundheitsziele</ST>
          <ChipGrid options={HEALTH_GOALS} selected={profile.goals || []} onToggle={id => setProfile(p => ({ ...p, goals: toggle(p.goals || [], id) }))} />
        </Card>
        <Card anim="fadeUp" delay="0.42s">
          <ST sub="Tägliche Erinnerung ans Kochen">🔔 Koch-Erinnerung</ST>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
            <Chip active={reminder.enabled} onClick={() => updateReminder({ ...reminder, enabled: !reminder.enabled })} color="#4A9A5A">
              {reminder.enabled ? "✓ Aktiv" : "Erinnerung aktivieren"}
            </Chip>
            {reminder.enabled && (
              <label style={{ display: "inline-flex", alignItems: "center", gap: "8px", fontSize: "13px", color: "var(--ink2)" }}>
                um
                <input
                  type="time"
                  value={reminder.time}
                  onChange={e => updateReminder({ ...reminder, time: e.target.value })}
                  style={{
                    padding: "8px 10px", borderRadius: "var(--r)", border: "2px solid var(--card-border)",
                    background: "var(--card)", color: "var(--ink)", fontFamily: "'Outfit',sans-serif", fontSize: "14px",
                  }}
                />
                Uhr
              </label>
            )}
          </div>
          <p style={{ fontSize: "11px", color: "var(--ink3)", marginTop: "10px", lineHeight: 1.5 }}>
            Funktioniert am zuverlässigsten als <strong>installierte App</strong> (zum Home-Bildschirm hinzufügen). Es werden keine Daten gesendet — die Erinnerung läuft lokal auf deinem Gerät.
          </p>
        </Card>
        <Card anim="fadeUp" delay="0.45s">
          <ST sub={apiKey ? `${getProvider(provider).label} aktiv — unbegrenzte Nutzung` : freemiumInfo.freemium ? `Kostenlos: ${freemiumInfo.remaining}/${freemiumInfo.dailyLimit} Anfragen heute` : "Optional — die App läuft auch ohne Key mit Offline-KI"}>🔑 KI-Anbieter & API-Key (optional)</ST>
          <p style={{ fontSize: "12px", color: "var(--ink3)", lineHeight: 1.5, marginBottom: "10px" }}>
            🧠 Ohne Key erstellt die <strong>Offline-KI</strong> Rezepte direkt auf deinem Gerät.
            Mit eigenem Key nutzt du den gewählten Anbieter für noch kreativere Vorschläge.
          </p>
          <ProviderSelect value={provider} onChange={saveProvider} />
          <input type="password" value={apiKey} onChange={e => setApiKey(e.target.value)} placeholder={`${getProvider(provider).placeholder} (leer lassen für Offline-KI)`} style={{
            width: "100%", padding: "10px 14px", borderRadius: "var(--r)",
            border: "2px solid var(--card-border)", background: "var(--card)",
            fontFamily: "'Outfit',sans-serif", fontSize: "14px", color: "var(--ink)",
            outline: "none", boxSizing: "border-box",
          }} />
          {apiKey && <button onClick={() => { setApiKey(""); save(K.apiKey, ""); }} style={{
            marginTop: "6px", background: "none", border: "none", color: "var(--ink3)",
            fontSize: "12px", cursor: "pointer", padding: "4px 0",
          }}>Key entfernen (zurück zu Offline-KI / Freemium)</button>}
          <div style={{ marginTop: "12px" }}><GeminiTip /></div>
        </Card>
        <Btn onClick={() => { saveProfile(profile); saveApiKey(apiKey); setOverlay(null); }}>💾 Profil speichern</Btn>
      </div>
    </Layout>
  );

  if (overlay === "guest") return (
    <Layout>
      <CloseBar title="👥 Gäste-Modus" onClose={() => setOverlay(null)} />
      <Card anim="fadeUp">
        <p style={{ fontSize: "13px", color: "var(--ink3)", marginBottom: "16px", lineHeight: 1.5 }}>
          Füge die Einschränkungen deiner Gäste hinzu. Diese werden mit deinen kombiniert.
        </p>
        <ST>Gäste-Allergien</ST>
        <BulkToggle
          options={ALLERGIES}
          selected={guestAllergies}
          onSelectAll={() => setGuestAllergies(ALLERGIES.map(a => a.id))}
          onClear={() => setGuestAllergies([])}
          label="Allergien"
        />
        <ChipGrid options={ALLERGIES} selected={guestAllergies} onToggle={id => setGuestAllergies(a => toggle(a, id))} />
        <div style={{ marginTop: "12px" }}>
          <Chip active={guestHistamin} onClick={() => setGuestHistamin(h => !h)} color="#C44040">⚠️ Histaminintoleranz</Chip>
        </div>
        <div style={{ marginTop: "16px" }}>
          <ST>Gäste-Ernährung</ST>
          <ChipGrid options={DIETS} selected={guestDiet} onToggle={id => setGuestDiet(d => toggle(d, id))} />
        </div>
        <div style={{ display: "flex", gap: "8px", marginTop: "16px" }}>
          <Btn secondary onClick={() => { setGuestMode(false); setGuestAllergies([]); setGuestHistamin(false); setGuestDiet([]); setOverlay(null); }} style={{ flex: 1 }}>Deaktivieren</Btn>
          <Btn onClick={() => { setGuestMode(true); setOverlay(null); }} style={{ flex: 1 }}>✅ Aktivieren</Btn>
        </div>
      </Card>
    </Layout>
  );

  // ─── Instagram / Recipe Import ───
  if (overlay === "import") return (
    <Layout>
      <CloseBar title="📲 Rezept importieren" onClose={() => { setOverlay(null); setImportError(""); }} />
      <Card anim="fadeUp">
        <p style={{ fontSize: "13px", color: "var(--ink2)", lineHeight: 1.6, marginBottom: "12px" }}>
          Gefällt dir ein Rezept auf <strong>Instagram</strong>, TikTok oder einem Blog? Kopiere den
          Text (Caption mit Zutaten & Schritten) und füge ihn hier ein — die KI macht ein
          sauberes, auf <strong>{persons} Portion{persons > 1 ? "en" : ""}</strong> umgerechnetes Rezept daraus,
          inklusive Allergen- und Nährwert-Check.
        </p>
        <div style={{ background: "var(--bg2)", borderRadius: "var(--r)", padding: "10px 12px", marginBottom: "12px" }}>
          <p style={{ fontSize: "11px", color: "var(--ink3)", lineHeight: 1.5, margin: 0 }}>
            💡 So geht's: In Instagram beim Beitrag auf <strong>•••</strong> → „Link kopieren" reicht
            nicht — öffne die Caption, markiere den Text und kopiere ihn. Bei Reels steht das Rezept
            oft in der Beschreibung oder den Kommentaren des Erstellers.
          </p>
        </div>
        <InputField
          multiline
          value={importText}
          onChange={e => setImportText(e.target.value)}
          placeholder={"Hier den Rezept-Text einfügen...\n\nz.B.\n🍝 Cremige Tomatenpasta\nZutaten: 200g Pasta, 1 Dose Tomaten, 100g Frischkäse...\nSchritte: 1. Pasta kochen 2. Sauce..."}
          style={{ minHeight: "160px" }}
        />
        {importError && (
          <p style={{ fontSize: "12px", color: "#C44040", marginTop: "8px", lineHeight: 1.5 }}>{importError}</p>
        )}
        <div style={{ marginTop: "12px" }}>
          <Btn onClick={importRecipe} disabled={importing || importText.trim().length < 15}>
            {importing ? "KI analysiert das Rezept... ✨" : "Rezept erstellen 🍳"}
          </Btn>
        </div>
        <p style={{ fontSize: "11px", color: "var(--ink3)", marginTop: "10px", lineHeight: 1.5 }}>
          Hinweis: Der Import nutzt deinen KI-Anbieter (Freemium oder eigener Key). Bitte respektiere
          die Urheberrechte der Ersteller — der Import ist für deinen privaten Gebrauch gedacht.
        </p>
      </Card>
    </Layout>
  );

  // ─── Health / Wellness Blog ───
  if (overlay === "wellness") {
    const renderArticles = (list) => (
      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        {list.map((a, i) => (
          <Card key={a.id} anim="fadeUp" delay={`${i * 0.04}s`}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: "10px" }}>
              <span style={{ fontSize: "26px" }}>{a.emoji}</span>
              <div style={{ flex: 1 }}>
                <h3 style={{ fontFamily: "'Fraunces',serif", fontSize: "16px", fontWeight: 700, color: "var(--ink)" }}>{a.title}</h3>
                <p style={{ fontSize: "12px", color: "var(--ink3)", marginTop: "2px", lineHeight: 1.5 }}>{a.summary}</p>
              </div>
            </div>
            <ul style={{ margin: "10px 0 0", paddingLeft: "18px", display: "flex", flexDirection: "column", gap: "6px" }}>
              {a.body.map((b, j) => <li key={j} style={{ fontSize: "13px", color: "var(--ink2)", lineHeight: 1.55 }}>{b}</li>)}
            </ul>
          </Card>
        ))}
      </div>
    );

    return (
      <Layout>
        <CloseBar title="💚 Gesundheit" onClose={() => setOverlay(null)} />

        <div style={{ display: "flex", gap: "6px", overflowX: "auto", paddingBottom: "8px", marginBottom: "12px", WebkitOverflowScrolling: "touch" }}>
          {WELLNESS_CATEGORIES.map(c => (
            <button key={c.id} onClick={() => setWellnessTab(c.id)} style={{
              padding: "8px 14px", borderRadius: "20px", whiteSpace: "nowrap",
              border: wellnessTab === c.id ? "2px solid var(--accent)" : "1px solid var(--card-border)",
              background: wellnessTab === c.id ? "linear-gradient(135deg,var(--accent),var(--accent2))" : "var(--card)",
              color: wellnessTab === c.id ? "#fff" : "var(--ink2)",
              fontSize: "13px", fontWeight: wellnessTab === c.id ? 600 : 400,
              fontFamily: "'Outfit',sans-serif", cursor: "pointer", flexShrink: 0,
            }}>{c.emoji} {c.label}</button>
          ))}
        </div>

        {wellnessTab === "ernährung" && renderArticles(NUTRITION_ARTICLES)}
        {wellnessTab === "sport" && renderArticles(SPORT_TIPS)}

        {wellnessTab === "hausmittel" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {HOME_REMEDIES.map((r, i) => (
              <Card key={r.id} anim="fadeUp" delay={`${i * 0.04}s`}>
                <h3 style={{ fontFamily: "'Fraunces',serif", fontSize: "16px", fontWeight: 700, color: "var(--ink)", marginBottom: "8px" }}>{r.emoji} {r.title}</h3>
                <ul style={{ margin: 0, paddingLeft: "18px", display: "flex", flexDirection: "column", gap: "6px" }}>
                  {r.remedies.map((x, j) => <li key={j} style={{ fontSize: "13px", color: "var(--ink2)", lineHeight: 1.55 }}>{x}</li>)}
                </ul>
                <div style={{ marginTop: "10px", padding: "8px 12px", borderRadius: "8px", background: "rgba(196,64,64,0.06)", border: "1px solid rgba(196,64,64,0.15)", fontSize: "11px", color: "var(--ink2)", lineHeight: 1.5 }}>
                  <strong style={{ color: "#C44040" }}>⚠️ Wichtig:</strong> {r.warn}
                </div>
              </Card>
            ))}
          </div>
        )}

        {wellnessTab === "tipps" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {HEALTH_TIPS.map((t, i) => (
              <Card key={i} anim="fadeUp" delay={`${i * 0.03}s`} style={{ padding: "14px 18px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <span style={{ fontSize: "22px" }}>{t.emoji}</span>
                  <p style={{ fontSize: "13px", color: "var(--ink2)", lineHeight: 1.5, margin: 0 }}>{t.text}</p>
                </div>
              </Card>
            ))}
            {/* Personalized hooks from the user's own profile */}
            {(profile.deficiencies?.length > 0 || profile.goals?.length > 0) && (
              <Card anim="fadeUp" style={{ background: "linear-gradient(135deg,rgba(34,139,34,0.05),rgba(60,179,113,0.05))", border: "1px solid rgba(34,139,34,0.15)" }}>
                <h3 style={{ fontFamily: "'Fraunces',serif", fontSize: "15px", fontWeight: 700, color: "#228B22", marginBottom: "8px" }}>🎯 Für dich persönlich</h3>
                {(profile.goals || []).map(id => {
                  const g = HEALTH_GOALS.find(h => h.id === id);
                  return g ? <p key={id} style={{ fontSize: "12px", color: "var(--ink2)", lineHeight: 1.5, marginBottom: "4px" }}><strong>{g.emoji} {g.label}:</strong> {g.tip}</p> : null;
                })}
                {(profile.deficiencies || []).map(id => {
                  const nd = NUTRIENT_DEFICIENCIES.find(d => d.id === id);
                  return nd ? <p key={id} style={{ fontSize: "12px", color: "var(--ink2)", lineHeight: 1.5, marginBottom: "4px" }}><strong>{nd.emoji} {nd.label}:</strong> {nd.foods.slice(0, 5).join(", ")}</p> : null;
                })}
              </Card>
            )}
          </div>
        )}

        <Card anim="fadeUp" style={{ marginTop: "12px", background: "rgba(0,0,0,0.02)" }}>
          <p style={{ fontSize: "11px", color: "var(--ink3)", lineHeight: 1.5, margin: 0 }}>
            <strong>ℹ️ Hinweis:</strong> {WELLNESS_DISCLAIMER}
          </p>
        </Card>
      </Layout>
    );
  }

  // ─── Home ───
  if (view === "home") {
    const ready = mode === "fridge" ? (selectedIngredients.length > 0 || fridgeInput.trim().length > 2) : (meal && cookTime && mood);
    const mo = new Date().getMonth();
    const ex = EXAMPLE_RECIPES[exampleIdx % EXAMPLE_RECIPES.length];

    return (
      <Layout photo>
        {/* Hero-Header — großes appetitanregendes Food-Foto mit Begrüßung darüber */}
        <div style={{
          position: "relative", marginTop: "10px", borderRadius: "20px", overflow: "hidden",
          minHeight: "172px", display: "flex", flexDirection: "column", justifyContent: "space-between",
          backgroundImage: `linear-gradient(168deg, rgba(18,11,16,.22) 0%, rgba(18,11,16,.5) 52%, rgba(18,11,16,.88) 100%), url(${HERO_IMG})`,
          backgroundSize: "cover", backgroundPosition: "center",
          boxShadow: "0 14px 36px rgba(40,20,12,0.22)", animation: "fadeUp 0.4s ease both",
        }}>
          <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", gap: "8px", padding: "12px 12px 0" }}>
            {streak.count > 0 && (
              <div style={{
                display: "inline-flex", alignItems: "center", gap: "4px", padding: "4px 10px", borderRadius: "12px",
                background: "rgba(0,0,0,.34)", border: "1px solid rgba(255,255,255,.22)", fontSize: "12px", fontWeight: 600, color: "#fff",
              }}>🔥 {streak.count} Tage</div>
            )}
            <button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              aria-label={theme === "dark" ? "Helles Design" : "Dunkles Design"}
              title={theme === "dark" ? "Zu hellem Design wechseln" : "Zu dunklem Design wechseln"}
              style={{
                width: "38px", height: "38px", borderRadius: "12px", flexShrink: 0,
                display: "inline-flex", alignItems: "center", justifyContent: "center",
                background: "rgba(0,0,0,.34)", border: "1px solid rgba(255,255,255,.22)", cursor: "pointer", color: "#fff",
              }}>
              <Icon name={theme === "dark" ? "sun" : "moon"} size={18} color="#fff" />
            </button>
          </div>
          <div style={{ padding: "0 18px 16px", color: "#fff" }}>
            <p style={{ fontSize: "13.5px", margin: "0 0 2px", opacity: .94, textShadow: "0 1px 6px rgba(0,0,0,.55)" }}>{profile.avatar || "🧑‍🍳"} {greet()}{profile.name ? `, ${profile.name}` : ""} 👋</p>
            <h1 style={{ fontFamily: "'Fraunces',serif", fontSize: "30px", fontWeight: 900, letterSpacing: "-1px", margin: 0, color: "#fff", textShadow: "0 2px 16px rgba(0,0,0,.6)" }}>Was esse ich heute?</h1>
          </div>
        </div>
        <div style={{ display: "flex", gap: "6px", marginTop: "10px", flexWrap: "wrap", animation: "fadeUp 0.4s ease both", animationDelay: "0.05s" }}>
          {profile.histamin && <Badge icon="⚠️" text="Histamin" />}
          {profile.allergies.length > 0 && <Badge icon="🛡️" text={`${profile.allergies.length} Allergien`} />}
          {profile.diet.slice(0, 2).map(d => <Badge key={d} icon={DIETS.find(o => o.id === d)?.emoji} text={DIETS.find(o => o.id === d)?.label} />)}
          {guestMode && <Badge icon="👥" text="Gäste aktiv" />}
          {apiKey ? <Badge icon="🔓" text="Eigener Key" /> :
            freemiumInfo.freemium ? <Badge icon="✨" text={`${freemiumInfo.remaining}/${freemiumInfo.dailyLimit} frei`} /> :
            <Badge icon="🧠" text="Offline-KI" />}
        </div>

        {/* Quick actions — wraps to a second row as more tools are added */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "8px", marginTop: "12px", animation: "fadeUp 0.4s ease both", animationDelay: "0.05s" }}>
          {[
            { i: "❤️", l: "Favoriten", a: () => setOverlay("favs"), n: favorites.length },
            { i: "🛒", l: "Einkauf", a: () => { setShopTab("list"); setOverlay("shop"); }, n: shopList.filter(s => !s.checked).length },
            { i: "💚", l: "Gesundheit", a: () => setOverlay("wellness") },
            { i: "📲", l: "Import", a: () => { setImportError(""); setOverlay("import"); } },
            { i: "📖", l: "Verlauf", a: () => setOverlay("history"), n: history.length },
            { i: "👥", l: "Gäste", a: () => setOverlay("guest"), n: guestMode ? "!" : 0 },
            { i: "⚙️", l: "Profil", a: () => setOverlay("settings") },
          ].map((a, i) => (
            <button key={i} onClick={a.a} style={{
              padding: "10px 4px", borderRadius: "var(--r)",
              border: "1px solid var(--card-border)", background: "var(--card)",
              cursor: "pointer", textAlign: "center", position: "relative",
              fontFamily: "'Outfit',sans-serif", transition: "all 0.2s ease",
            }}>
              <div style={{ fontSize: "18px" }}>{a.i}</div>
              <div style={{ fontSize: "10px", color: "var(--ink3)", marginTop: "2px", fontWeight: 500 }}>{a.l}</div>
              {a.n > 0 && (
                <div style={{
                  position: "absolute", top: "-4px", right: "-4px", width: "18px", height: "18px",
                  borderRadius: "9px", background: a.n === "!" ? "#C44040" : "var(--accent)",
                  color: "#fff", fontSize: "10px", fontWeight: 700,
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>{a.n === "!" ? "!" : a.n}</div>
              )}
            </button>
          ))}
        </div>

        {/* Season */}
        <div style={{
          marginTop: "12px", padding: "10px 16px", borderRadius: "var(--r)",
          background: "linear-gradient(135deg,rgba(178,58,72,0.06),rgba(126,90,134,0.06))",
          border: "1px solid rgba(178,58,72,0.12)",
          animation: "fadeUp 0.4s ease both", animationDelay: "0.1s",
        }}>
          <p style={{ fontSize: "12px", color: "var(--ink2)" }}>
            <strong>🌿 {SEASON_NAMES[mo]}saison:</strong> {SEASONS[mo]}
          </p>
        </div>

        {/* Mode tabs */}
        <div style={{ marginTop: "16px", animation: "fadeUp 0.4s ease both", animationDelay: "0.12s" }}>
          <div style={{ display: "flex", background: "var(--card)", borderRadius: "16px", padding: "4px", border: "1px solid var(--card-border)", gap: "2px" }}>
            {[
              { id: "quick", e: "⚡", l: "Schnell" },
              { id: "fridge", e: "🧊", l: "Kühlschrank" },
              { id: "plan", e: "📅", l: "Wochenplan" },
            ].map(t => (
              <button key={t.id} onClick={() => setMode(t.id)} style={{
                flex: 1, padding: "10px 6px", borderRadius: "12px", border: "none",
                background: mode === t.id ? "linear-gradient(135deg,var(--accent),var(--accent2))" : "transparent",
                color: mode === t.id ? "#fff" : "var(--ink3)",
                fontSize: "13px", fontWeight: mode === t.id ? 600 : 400,
                fontFamily: "'Outfit',sans-serif", cursor: "pointer", transition: "all 0.25s ease",
              }}>
                <div style={{ fontSize: "18px" }}>{t.e}</div>
                <div style={{ marginTop: "2px" }}>{t.l}</div>
              </button>
            ))}
          </div>

          {/* Offline Intelligence Toggle */}
          <div style={{ marginTop: "8px", display: "flex", justifyContent: "center", gap: "8px", flexWrap: "wrap" }}>
            <button
              onClick={() => {
                const next = !offlineMode;
                setOfflineMode(next);
                offlinePinnedByUser.current = next;
              }}
              disabled={!isOnline}
              style={{
                display: "flex", alignItems: "center", gap: "6px",
                padding: "6px 14px", borderRadius: "20px",
                border: offlineMode ? "2px solid var(--accent)" : "1px solid var(--card-border)",
                background: offlineMode ? "linear-gradient(135deg,rgba(178,58,72,0.08),rgba(126,90,134,0.08))" : "var(--card)",
                color: offlineMode ? "var(--accent)" : "var(--ink3)",
                fontSize: "12px", fontWeight: offlineMode ? 600 : 400,
                fontFamily: "'Outfit',sans-serif",
                cursor: isOnline ? "pointer" : "not-allowed",
                opacity: isOnline ? 1 : 0.85,
                transition: "all 0.25s ease",
              }}
            >
              <span style={{ fontSize: "14px" }}>{offlineMode ? "🧠" : "📡"}</span>
              {offlineMode ? "Offline-KI aktiv" : "Online-Modus"}
            </button>
            {!isOnline && (
              <span style={{
                display: "flex", alignItems: "center", gap: "4px",
                padding: "6px 12px", borderRadius: "20px",
                background: "rgba(196,64,64,0.1)", color: "#C44040",
                fontSize: "11px", fontWeight: 600, fontFamily: "'Outfit',sans-serif",
                border: "1px solid rgba(196,64,64,0.25)",
              }}>
                🔌 Kein Netz – Offline-Modus
              </span>
            )}
          </div>
        </div>

        {/* Quick Mode */}
        {mode === "quick" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginTop: "14px" }}>
            {/* Beispiel-Vorschau — variiert (verschiedene Küchen), tippen für ein anderes */}
            <Card anim="fadeUp" delay="0.12s" style={{ padding: 0, overflow: "hidden", cursor: "pointer" }}
              onClick={() => setExampleIdx(i => (i + 1) % EXAMPLE_RECIPES.length)}
              title="Tippen für ein anderes Beispiel">
              <div style={{ display: "flex", gap: "12px", alignItems: "center", padding: "12px 14px 6px" }}>
                <div style={{ fontSize: "38px", lineHeight: 1, flexShrink: 0 }}>{ex.emoji}</div>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px" }}>
                    <div style={{ fontSize: "10px", fontWeight: 700, color: "var(--accent)", letterSpacing: ".4px", textTransform: "uppercase" }}>Beispiel · so sieht dein Vorschlag aus</div>
                    <span style={{ fontSize: "11px", color: "var(--ink3)", flexShrink: 0 }}>🔄</span>
                  </div>
                  <div style={{ fontFamily: "'Fraunces',serif", fontSize: "17px", fontWeight: 800, color: "var(--ink)", lineHeight: 1.2 }}>{ex.name}</div>
                </div>
              </div>
              <div style={{ padding: "0 14px 13px" }}>
                <p style={{ fontSize: "12.5px", color: "var(--ink2)", lineHeight: 1.5, margin: "0 0 8px", fontStyle: "italic", fontFamily: "'Fraunces',serif" }}>{ex.beschreibung}</p>
                <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginBottom: "8px" }}>
                  <Badge icon="⏱️" text={ex.zeit} />
                  <Badge icon="🔥" text={ex.kalorien} />
                  <Badge icon="🍴" text={ex.gerichtTyp} />
                  <Badge icon="🍗" text={ex.proteinTyp} />
                  {ex.schaerfe > 0 && <Badge icon="🌶️" text={["", "leicht scharf", "mittelscharf", "scharf"][ex.schaerfe]} />}
                </div>
                <p style={{ fontSize: "11.5px", color: "var(--ink3)", lineHeight: 1.5, margin: 0 }}><strong style={{ color: "var(--saffron)" }}>📖 Herkunft:</strong> {ex.kultur}</p>
              </div>
            </Card>

            <Card anim="fadeUp" delay="0.15s"><ST sub="Was wird's?">🍽️ Mahlzeit</ST><ChipGrid options={MEALS} selected={meal} onToggle={id => setMeal(id === meal ? "" : id)} multi={false} /></Card>
            <Card anim="fadeUp" delay="0.2s"><ST sub="Wie viel Zeit hast du?">⏱️ Kochzeit</ST><ChipGrid options={TIMES} selected={cookTime} onToggle={id => setCookTime(id === cookTime ? "" : id)} multi={false} showSub /></Card>
            <Card anim="fadeUp" delay="0.25s"><ST>🎨 Stimmung</ST><ChipGrid options={MOODS} selected={mood} onToggle={id => setMood(id === mood ? "" : id)} multi={false} colorMap /></Card>

            {/* Optionale Verfeinerung — eingeklappt, hält die Startseite aufgeräumt */}
            <div>
              <button onClick={() => setShowMoreOpts(v => !v)} style={{
                width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "13px 16px", borderRadius: "var(--r)", cursor: "pointer",
                background: "var(--card)", border: "1px solid var(--card-border)",
                color: "var(--ink2)", fontFamily: "'Outfit',sans-serif", fontSize: "14px", fontWeight: 600,
              }}>
                <span>⚙️ Mehr Optionen <span style={{ color: "var(--ink3)", fontWeight: 400, fontSize: "12px" }}>· Budget, Art, Protein</span>
                  {(budget !== "egal" || dishType !== "egal" || proteinPref !== "egal") && <span style={{ marginLeft: "8px", fontSize: "10px", color: "#fff", background: "var(--accent)", borderRadius: "8px", padding: "1px 7px", fontWeight: 700 }}>aktiv</span>}
                </span>
                <span style={{ color: "var(--ink3)", display: "inline-block", transition: "transform .2s", transform: showMoreOpts ? "rotate(180deg)" : "none" }}>▾</span>
              </button>
              {showMoreOpts && (
                <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginTop: "12px", animation: "fadeUp 0.3s ease both" }}>
                  <Card><ST>💰 Budget</ST><ChipGrid options={BUDGETS} selected={budget} onToggle={id => setBudget(id === budget ? "egal" : id)} multi={false} showSub /></Card>
                  <Card><ST sub="Lust auf etwas Bestimmtes?">🍴 Art des Gerichts</ST><ChipGrid options={DISH_TYPES} selected={dishType} onToggle={setDishType} multi={false} /></Card>
                  <Card><ST>🍗 Protein</ST><ChipGrid options={PROTEINS} selected={proteinPref} onToggle={setProteinPref} multi={false} /></Card>
                </div>
              )}
            </div>

            <Card anim="fadeUp" delay="0.3s">
              <ST>👤 Portionen</ST>
              <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                <button onClick={() => setPersons(Math.max(1, persons - 1))} style={{ width: "40px", height: "40px", borderRadius: "50%", border: "2px solid var(--card-border)", background: "var(--card)", fontSize: "20px", cursor: "pointer", color: "var(--ink)" }}>−</button>
                <span style={{ fontFamily: "'Fraunces',serif", fontSize: "28px", fontWeight: 700, color: "var(--ink)", minWidth: "30px", textAlign: "center" }}>{persons}</span>
                <button onClick={() => setPersons(Math.min(12, persons + 1))} style={{ width: "40px", height: "40px", borderRadius: "50%", border: "2px solid var(--card-border)", background: "var(--card)", fontSize: "20px", cursor: "pointer", color: "var(--ink)" }}>+</button>
              </div>
            </Card>
            <div style={{ animation: "fadeUp 0.4s ease both", animationDelay: "0.4s" }}>
              <Btn onClick={() => generate("quick")} disabled={!ready || loading}>
                {loading ? "Kreiere dein Gericht... 🔥" : "Was esse ich? ✨"}
              </Btn>
            </div>
          </div>
        )}

        {/* Fridge Mode */}
        {mode === "fridge" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginTop: "14px" }}>
            <Card anim="fadeUp" delay="0.15s">
              <ST sub="Wähle Zutaten aus oder mach ein Foto">🧊 Kühlschrank-Check</ST>
              {/* Input mode tabs */}
              <div style={{ display: "flex", gap: "4px", marginBottom: "12px" }}>
                {[
                  { id: "chips", emoji: "🏷️", label: "Auswählen" },
                  { id: "text", emoji: "✏️", label: "Tippen" },
                  { id: "photo", emoji: "📸", label: "Foto" },
                ].map(t => (
                  <button key={t.id} onClick={() => setFridgeInputMode(t.id)} style={{
                    flex: 1, padding: "8px 4px", borderRadius: "10px", border: "none",
                    background: fridgeInputMode === t.id ? "var(--accent)" : "var(--bg2)",
                    color: fridgeInputMode === t.id ? "#fff" : "var(--ink3)",
                    fontSize: "12px", fontWeight: fridgeInputMode === t.id ? 600 : 400,
                    cursor: "pointer", fontFamily: "'Outfit',sans-serif",
                    transition: "all 0.2s ease",
                  }}>{t.emoji} {t.label}</button>
                ))}
              </div>

              {fridgeInputMode === "chips" && (
                <IngredientPicker
                  selected={selectedIngredients}
                  onToggle={toggleIngredient}
                  profile={profile}
                />
              )}
              {fridgeInputMode === "text" && (
                <>
                  <InputField multiline value={fridgeInput} onChange={e => setFridgeInput(e.target.value)} placeholder="z.B. Hähnchenbrust, Reis, Paprika, Zwiebeln, Kokosmilch..." style={{ minHeight: "120px" }} />
                  <p style={{ fontSize: "11px", color: "var(--ink3)", marginTop: "6px" }}>Grundzutaten (Salz, Pfeffer, Öl, Gewürze) sind immer vorhanden.</p>
                </>
              )}
              {fridgeInputMode === "photo" && (
                <PhotoUpload apiKey={apiKey} backendAvailable={backendAvailable} provider={provider} onNeedKey={() => setShowKeyInput(true)} onResult={addIngredientsFromPhoto} />
              )}
            </Card>
            <div style={{ animation: "fadeUp 0.4s ease both", animationDelay: "0.2s" }}>
              <Btn onClick={() => generate("fridge")} disabled={!ready || loading}>
                {loading ? "Schaue was geht... 🔍" : `Daraus mach was! 🍳${selectedIngredients.length > 0 ? ` (${selectedIngredients.length} Zutaten)` : ""}`}
              </Btn>
            </div>
          </div>
        )}

        {/* Plan Mode */}
        {mode === "plan" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginTop: "14px" }}>
            <Card anim="fadeUp" delay="0.15s">
              <ST sub="5 Tage, 3 Mahlzeiten, perfekt auf dich abgestimmt.">📅 Wochenplan</ST>
              <p style={{ fontSize: "13px", color: "var(--ink2)", lineHeight: 1.6 }}>
                Generiert einen ausgewogenen Essensplan für Mo–Fr basierend auf deinem Profil, Allergien und der aktuellen Saison.
              </p>
            </Card>
            <div style={{ animation: "fadeUp 0.4s ease both", animationDelay: "0.2s" }}>
              <Btn onClick={generatePlan} disabled={planLoading}>
                {planLoading ? "Plane deine Woche... 📋" : "Wochenplan erstellen 📅"}
              </Btn>
            </div>
            {planLoading && (
              <Card anim="fadeUp" style={{ textAlign: "center", padding: "32px" }}>
                <div style={{ fontSize: "48px", animation: "cookSpin 2s ease infinite" }}>📋</div>
                <p style={{ color: "var(--ink3)", marginTop: "12px", fontSize: "14px" }}>Stelle deinen perfekten Plan zusammen...</p>
              </Card>
            )}
            {weekPlan && !weekPlan.error && (
              <div style={{ display: "flex", flexDirection: "column", gap: "10px", animation: "fadeUp 0.4s ease both" }}>
                {weekPlan.plan?.map((day, i) => (
                  <Card key={i} anim="fadeUp" delay={`${i * 0.06}s`}>
                    <h4 style={{ fontFamily: "'Fraunces',serif", fontSize: "16px", color: "var(--ink)", marginBottom: "10px", fontWeight: 700 }}>{day.tag}</h4>
                    {["frühstück", "mittag", "abend"].map(t => {
                      const m = day[t];
                      if (!m) return null;
                      return (
                        <div key={t} onClick={() => openPlanMeal(m, t)} style={{ display: "flex", alignItems: "center", gap: "8px", padding: "8px 0", borderBottom: "1px solid var(--card-border)", cursor: "pointer", transition: "all 0.2s ease" }}>
                          <span style={{ fontSize: "20px" }}>{m.emoji}</span>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: "11px", color: "var(--accent)", fontWeight: 600, textTransform: "capitalize" }}>{t}</div>
                            <div style={{ fontSize: "13px", fontWeight: 600, color: "var(--ink)" }}>{m.name}</div>
                            <div style={{ fontSize: "11px", color: "var(--ink3)" }}>{m.zeit}</div>
                          </div>
                          <span style={{ fontSize: "16px", color: "var(--ink3)" }}>›</span>
                        </div>
                      );
                    })}
                  </Card>
                ))}
                {weekPlan.einkaufsliste && (
                  <Btn onClick={() => { addToShopList(weekPlan.einkaufsliste, "Wochenplan"); setShopTab("list"); setOverlay("shop"); }}>
                    🛒 Einkaufsliste übernehmen ({weekPlan.einkaufsliste.length} Zutaten)
                  </Btn>
                )}
              </div>
            )}
          </div>
        )}
      </Layout>
    );
  }

  // ─── Loading Animation ───
  if (loading) return (
    <Layout>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "80vh" }}>
        <div style={{ textAlign: "center", animation: "scaleIn 0.4s ease both" }}>
          <div style={{ fontSize: "64px", animation: "cookSpin 2.5s ease infinite" }}>🍳</div>
          <p style={{ fontFamily: "'Fraunces',serif", fontSize: "20px", color: "var(--ink)", marginTop: "16px", fontWeight: 700 }}>{loadMsg}</p>
          <div style={{ marginTop: "16px", height: "3px", width: "160px", borderRadius: "2px", background: "var(--card-border)", overflow: "hidden", margin: "16px auto 0" }}>
            <div style={{ height: "100%", width: "40%", borderRadius: "2px", background: "linear-gradient(90deg,var(--accent),var(--accent3))", animation: "shimmer 1.5s ease infinite", backgroundSize: "200% 100%" }} />
          </div>
        </div>
      </div>
    </Layout>
  );

  // ─── Result ───
  if (view === "result" && suggestion) {
    if (suggestion.error) return (
      <Layout>
        <div style={{ paddingTop: "40px" }}>
          <Card anim="scaleIn" style={{ textAlign: "center" }}>
            <div style={{ fontSize: "56px", marginBottom: "12px" }}>😅</div>
            <h2 style={{ fontFamily: "'Fraunces',serif", color: "var(--ink)", fontSize: "20px" }}>Ups!</h2>
            <p style={{ color: "var(--ink3)", marginTop: "6px", fontSize: "14px" }}>
              {suggestion.message || "Konnte kein Gericht generieren. Versuch's nochmal!"}
            </p>
            <div style={{ marginTop: "16px", display: "flex", flexDirection: "column", gap: "8px" }}>
              <Btn onClick={reset}>← Zurück</Btn>
              <Btn secondary onClick={() => setShowKeyInput(true)}>🔑 API-Key ändern</Btn>
            </div>
          </Card>
        </div>
      </Layout>
    );

    const isFav = favorites.some(f => f.name === suggestion.name);
    const art = dishArt(suggestion);

    return (
      <Layout>
        {/* Hero */}
        <div style={{ textAlign: "center", padding: "28px 0 12px", animation: "scaleIn 0.5s cubic-bezier(0.16,1,0.3,1) both", position: "relative" }}>
          {/* Generative „Dish-Art": Teller-Komposition mit rezepteigenem
              Verlauf — edler & appetitlicher als ein nacktes Emoji, voll offline. */}
          <div style={{
            position: "absolute", top: "-6px", left: "50%", transform: "translateX(-50%)",
            width: "210px", height: "210px", borderRadius: "50%", pointerEvents: "none", zIndex: 0,
            background: `radial-gradient(circle at 40% 36%, rgba(${art.a},0.22) 0%, transparent 62%), radial-gradient(circle at 64% 66%, rgba(${art.b},0.18) 0%, transparent 64%)`,
            filter: "blur(14px)", animation: "glowPulse 6s ease-in-out infinite",
          }} />
          <div style={{
            position: "relative", width: "172px", height: "172px", margin: "0 auto", borderRadius: "50%",
            display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden",
            background: `radial-gradient(circle at 36% 30%, rgba(${art.a},0.5) 0%, rgba(${art.a},0.14) 46%, transparent 70%), radial-gradient(circle at 70% 72%, rgba(${art.b},0.42) 0%, transparent 58%), radial-gradient(circle at 50% 50%, var(--bg2) 0%, var(--bg3) 100%)`,
            boxShadow: "var(--inset-hi), 0 20px 44px rgba(58,38,18,0.18), inset 0 0 0 1px rgba(255,255,255,0.22)",
          }}>
            {/* Tellerrand */}
            <div style={{ position: "absolute", inset: "13px", borderRadius: "50%", border: "1px solid rgba(255,255,255,0.28)", boxShadow: "inset 0 2px 12px rgba(58,38,18,0.12)" }} />
            {/* Lichtreflex */}
            <div style={{ position: "absolute", top: "12%", left: "20%", width: "44%", height: "30%", borderRadius: "50%", background: "radial-gradient(circle, rgba(255,255,255,0.28) 0%, transparent 70%)", filter: "blur(3px)" }} />
            <div style={{ position: "relative", fontSize: "82px", animation: "float 3s ease infinite", filter: "drop-shadow(0 10px 16px rgba(60,30,10,0.30))" }}>{suggestion.emoji || "🍽️"}</div>
          </div>
          <h1 style={{ position: "relative", fontFamily: "'Fraunces',serif", fontSize: "27px", fontWeight: 900, color: "var(--ink)", marginTop: "10px", letterSpacing: "-0.5px", lineHeight: 1.15, padding: "0 16px" }}>{suggestion.name}</h1>
          <p style={{ position: "relative", fontSize: "14px", color: "var(--ink2)", marginTop: "8px", lineHeight: 1.55, padding: "0 22px", fontStyle: "italic", fontFamily: "'Fraunces',serif", fontWeight: 400 }}>{suggestion.beschreibung}</p>
        </div>

        {/* Meta */}
        <div style={{ display: "flex", gap: "6px", justifyContent: "center", flexWrap: "wrap", marginBottom: "12px", animation: "fadeUp 0.5s ease both", animationDelay: "0.1s" }}>
          <Badge icon="⏱️" text={suggestion.zeit} />
          <Badge icon="🔥" text={suggestion.kalorien} />
          {suggestion.protein && <Badge icon="💪" text={suggestion.protein} />}
          {suggestion.schwierigkeit && <Badge icon="📊" text={suggestion.schwierigkeit} />}
          {suggestion.herkunft && <Badge icon="🌍" text={suggestion.herkunft} />}
          {suggestion.gerichtTyp && <Badge icon="🍴" text={suggestion.gerichtTyp} />}
          {suggestion.proteinTyp && <Badge icon="🍗" text={suggestion.proteinTyp} />}
          {Number(suggestion.schaerfe) > 0 && <Badge icon="🌶️" text={["", "leicht scharf", "mittelscharf", "scharf"][Math.min(3, Number(suggestion.schaerfe))]} />}
          {suggestion._fallbackFromApi && <Badge icon="🧠" text="Offline-Fallback" />}
          {suggestion._imported && <Badge icon="📲" text="Importiert" />}
        </div>

        {/* Kultur / Herkunft-Story — redaktioneller Mehrwert wie auf einem Rezept-Blog */}
        {suggestion.kultur && (
          <Card anim="fadeUp" delay="0.1s" style={{ marginBottom: "12px", background: "linear-gradient(135deg,rgba(232,148,58,0.07),rgba(178,58,72,0.05))", border: "1px solid rgba(232,148,58,0.18)" }}>
            <p style={{ margin: 0, fontSize: "13.5px", color: "var(--ink2)", lineHeight: 1.6 }}>
              <strong style={{ color: "var(--saffron)" }}>📖 Herkunft:</strong> {suggestion.kultur}
            </p>
          </Card>
        )}

        {/* Health warnings */}
        {suggestion.warnungen?.length > 0 && (
          <Card anim="fadeUp" delay="0.13s" style={{ marginBottom: "12px" }}>
            <ST icon="alert" sub="Von unserem Ernährungsberater">Hinweise</ST>
            <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginTop: "8px" }}>
              {suggestion.warnungen.map((w, i) => (
                <div key={i} style={{
                  padding: "8px 12px", borderRadius: "8px",
                  background: w.level === "warn" ? "rgba(196,64,64,0.08)" : "rgba(232,148,58,0.07)",
                  border: `1px solid ${w.level === "warn" ? "rgba(196,64,64,0.18)" : "rgba(232,148,58,0.15)"}`,
                  fontSize: "12px", color: "var(--ink2)", lineHeight: 1.5,
                }}>{w.text}</div>
              ))}
            </div>
          </Card>
        )}

        {/* Actions */}
        <div style={{ display: "flex", gap: "8px", marginBottom: "12px", animation: "fadeUp 0.5s ease both", animationDelay: "0.15s" }}>
          <button onClick={() => toggleFav(suggestion)} style={{
            flex: 1, padding: "12px", borderRadius: "var(--r)",
            border: isFav ? "2px solid #E05555" : "2px solid var(--card-border)",
            background: isFav ? "linear-gradient(135deg,#E05555,#C44040)" : "var(--card)",
            color: isFav ? "#fff" : "var(--ink2)",
            fontSize: "14px", fontWeight: 600, cursor: "pointer",
            fontFamily: "'Outfit',sans-serif", transition: "all 0.3s ease",
            animation: isFav ? "heartPop 0.4s ease" : "none",
          }}>{isFav ? "❤️ Gespeichert" : "🤍 Speichern"}</button>
          <button onClick={() => { addToShopList(suggestion.zutaten, suggestion.name); setShopTab("list"); setOverlay("shop"); }} style={{
            flex: 1, padding: "12px", borderRadius: "var(--r)",
            border: "2px solid var(--card-border)", background: "var(--card)",
            color: "var(--ink2)", fontSize: "14px", fontWeight: 600,
            cursor: "pointer", fontFamily: "'Outfit',sans-serif",
          }}>🛒 Einkaufsliste</button>
        </div>

        {/* Tags */}
        {suggestion.tags?.length > 0 && (
          <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginBottom: "12px", animation: "fadeUp 0.5s ease both", animationDelay: "0.18s" }}>
            {suggestion.tags.map((t, i) => (
              <span key={i} style={{ fontSize: "11px", padding: "3px 10px", borderRadius: "10px", background: "color-mix(in srgb, var(--herb) 11%, transparent)", color: "var(--herb)", fontWeight: 600, border: "1px solid color-mix(in srgb, var(--herb) 26%, transparent)" }}>#{t}</span>
            ))}
          </div>
        )}

        {/* Inhaltsstoffe — nummeriert, mit farbcodierten Allergen-/Zusatzstoff-
            Markern direkt an der Zutat. Marker + Legende stammen aus EINER
            Quelle (displayDeclaration), damit nie ein Code unerklärt bleibt. */}
        {(() => {
          const decl = displayDeclaration(suggestion);
          // Semantische Palette: Allergene (Beere), Zusatzstoffe (Petrol),
          // Alkohol (Wein/Kräutergrün) — bewusst getrennte Farbwelten.
          const C = {
            allergen: { fg: "var(--berry)", bg: "color-mix(in srgb, var(--berry) 10%, transparent)", bd: "color-mix(in srgb, var(--berry) 28%, transparent)" },
            additive: { fg: "var(--petrol)", bg: "color-mix(in srgb, var(--petrol) 10%, transparent)", bd: "color-mix(in srgb, var(--petrol) 28%, transparent)" },
          };
          const aLabel = Object.fromEntries(decl.allergene.map(a => [a.code, a.label]));
          const zLabel = Object.fromEntries(decl.zusatzstoffe.map(z => [z.number, z.label]));
          const markStyle = (k) => ({
            display: "inline-block", marginLeft: "4px", padding: "1px 6px", borderRadius: "6px",
            fontSize: "10px", fontWeight: 800, lineHeight: 1.5, verticalAlign: "1px", cursor: "help",
            fontFamily: "'Fraunces',serif", color: C[k].fg, background: C[k].bg, border: `1px solid ${C[k].bd}`,
          });
          const chip = (bg, bd) => ({
            display: "inline-flex", alignItems: "center", gap: "7px", padding: "5px 11px",
            borderRadius: "999px", background: bg, border: `1px solid ${bd}`,
            fontSize: "11.5px", color: "var(--ink2)", fontWeight: 500,
          });
          const badge = (fg) => ({
            minWidth: "22px", height: "22px", borderRadius: "999px", display: "inline-flex",
            alignItems: "center", justifyContent: "center", fontSize: "11px", fontWeight: 800,
            color: "#fff", background: fg, fontFamily: "'Fraunces',serif",
          });
          const alk = decl.alkohol || {};
          return (
            <Card anim="fadeUp" delay="0.2s" style={{ marginBottom: "12px" }}>
              <ST icon="ingredients" sub={`Für ${persons} Person${persons > 1 ? "en" : ""}`}>Inhaltsstoffe</ST>
              <div style={{ display: "flex", flexDirection: "column", gap: "9px" }}>
                {decl.lines.map((l, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: "11px", fontSize: "14px", color: "var(--ink)", lineHeight: 1.5 }}>
                    <span style={{ minWidth: "22px", height: "22px", borderRadius: "8px", marginTop: "1px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "11px", fontWeight: 700, color: "var(--herb)", background: "color-mix(in srgb, var(--herb) 10%, transparent)", border: "1px solid color-mix(in srgb, var(--herb) 24%, transparent)", flexShrink: 0, fontFamily: "'Fraunces',serif" }}>{i + 1}</span>
                    <span>
                      {l.text}
                      {l.allergens.map(code => (
                        <span key={`a${code}`} style={markStyle("allergen")} title={`Allergen ${code}: ${aLabel[code] || code}`}>{code}</span>
                      ))}
                      {l.additives.map(n => (
                        <span key={`z${n}`} style={markStyle("additive")} title={`Zusatzstoff ${n}: ${zLabel[n] || n}`}>{n}</span>
                      ))}
                    </span>
                  </div>
                ))}
              </div>

              {/* Kennzeichnung — farbcodierte Legende, erklärt jeden Marker oben. */}
              <div style={{ marginTop: "16px", paddingTop: "13px", borderTop: "1px solid var(--card-border)", display: "flex", flexDirection: "column", gap: "13px" }}>
                <div>
                  <p style={{ display: "flex", alignItems: "center", gap: "7px", fontSize: "12px", color: "var(--ink2)", fontWeight: 700, margin: "0 0 2px", fontFamily: "'Fraunces',serif" }}>
                    <Icon name="label" size={15} /> Kennzeichnung — alles offen erklärt
                  </p>
                  <p style={{ fontSize: "11px", color: "var(--ink3)", margin: 0, lineHeight: 1.5 }}>
                    Wir nehmen deine Unverträglichkeiten ernst. Die kleinen Marker hinter manchen Zutaten bedeuten: <strong style={{ color: "var(--berry)" }}>Buchstabe = Allergen</strong>, <strong style={{ color: "var(--petrol)" }}>Zahl = Zusatzstoff</strong>. Tippe einen Marker an (oder fahre mit der Maus darüber), um den Klartext zu sehen — die vollständige Übersicht steht direkt darunter.
                  </p>
                </div>

                <div>
                  <p style={{ fontSize: "10px", color: C.allergen.fg, fontWeight: 700, margin: "0 0 6px", letterSpacing: "0.3px", textTransform: "uppercase" }}>Allergene · EU-LMIV</p>
                  {decl.allergene.length > 0 ? (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "7px" }}>
                      {decl.allergene.map(a => (
                        <span key={a.code} style={chip(C.allergen.bg, C.allergen.bd)}>
                          <strong style={{ color: C.allergen.fg, fontFamily: "'Fraunces',serif", fontWeight: 800 }}>{a.code}</strong>
                          {a.label}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p style={{ fontSize: "11px", color: "var(--ink3)", margin: 0 }}>keine der 14 EU-Allergene enthalten 🌿</p>
                  )}
                </div>

                <div>
                  <p style={{ fontSize: "10px", color: C.additive.fg, fontWeight: 700, margin: "0 0 6px", letterSpacing: "0.3px", textTransform: "uppercase" }}>Zusatzstoffe</p>
                  {decl.zusatzstoffe.length > 0 ? (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "7px" }}>
                      {decl.zusatzstoffe.map(zs => (
                        <span key={zs.number} style={chip(C.additive.bg, C.additive.bd)}>
                          <span style={badge(C.additive.fg)}>{zs.number}</span>
                          {zs.label}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p style={{ fontSize: "11px", color: "var(--ink3)", margin: 0 }}>keine deklarationspflichtigen Zusatzstoffe – frisch &amp; ehrlich zubereitet 🌱</p>
                  )}
                </div>

                <div>
                  <p style={{ fontSize: "10px", color: alk.enthalten ? "var(--wine)" : "var(--herb)", fontWeight: 700, margin: "0 0 6px", letterSpacing: "0.3px", textTransform: "uppercase" }}>Alkoholgehalt</p>
                  <span style={chip(
                    alk.enthalten ? "color-mix(in srgb, var(--wine) 12%, transparent)" : "color-mix(in srgb, var(--herb) 12%, transparent)",
                    alk.enthalten ? "color-mix(in srgb, var(--wine) 30%, transparent)" : "color-mix(in srgb, var(--herb) 30%, transparent)",
                  )}>
                    <span style={{ fontSize: "13px" }}>{alk.enthalten ? "🍷" : "🌿"}</span>
                    {alk.label}
                  </span>
                  {alk.hinweis && (
                    <p style={{ fontSize: "10px", color: "var(--ink3)", margin: "6px 0 0", lineHeight: 1.4 }}>{alk.hinweis}</p>
                  )}
                </div>
              </div>
            </Card>
          );
        })()}

        {/* Spezialzutaten & Ersatz — authentisch einkaufen oder clever ersetzen */}
        {suggestion.ersatz?.length > 0 && (
          <Card anim="fadeUp" delay="0.22s" style={{ marginBottom: "12px" }}>
            <ST icon="ingredients" sub="authentisch einkaufen oder clever ersetzen">Zutaten-Kunde &amp; Ersatz</ST>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "8px" }}>
              {suggestion.ersatz.map((e, i) => (
                <div key={i} style={{ padding: "10px 12px", borderRadius: "10px", background: "var(--bg2)", border: "1px solid var(--card-border)" }}>
                  <div style={{ fontSize: "13.5px", fontWeight: 700, color: "var(--ink)" }}>{e.zutat}</div>
                  {e.was && <div style={{ fontSize: "12px", color: "var(--ink3)", marginTop: "2px", lineHeight: 1.45 }}>{e.was}</div>}
                  {e.ersatz && <div style={{ fontSize: "12px", color: "var(--herb)", marginTop: "4px", lineHeight: 1.45 }}>↔ Ersatz: {e.ersatz}</div>}
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Steps */}
        <Card anim="fadeUp" delay="0.25s" style={{ marginBottom: "12px" }}>
          <ST icon="steps">Zubereitung</ST>
          <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            {suggestion.schritte?.map((s, i) => (
              <div key={i} style={{ display: "flex", gap: "12px" }}>
                <div style={{ width: "28px", height: "28px", borderRadius: "50%", flexShrink: 0, background: "linear-gradient(135deg,var(--petrol),#3C9AA8)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "13px", fontWeight: 700, boxShadow: "0 2px 8px rgba(44,122,134,0.3)" }}>{i + 1}</div>
                <p style={{ fontSize: "14px", color: "var(--ink)", lineHeight: 1.6, margin: 0, paddingTop: "3px" }}>{s}</p>
              </div>
            ))}
          </div>
        </Card>

        {/* Full macros panel — bewusst nach der Zubereitung: erst Gericht,
            Zutaten & Schritte, dann die Nährwert-Referenz (Kcal/Protein stehen
            für den schnellen Blick schon oben in den Badges). */}
        {suggestion.makros && (
          <Card anim="fadeUp" delay="0.27s" style={{ marginBottom: "12px" }}>
            <ST icon="nutrition" sub="pro Person">Nährwerte</ST>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(90px, 1fr))", gap: "8px", marginTop: "8px" }}>
              {[
                { label: "Energie", n: suggestion.makros.kcal, unit: "kcal", c: "var(--saffron)" },
                { label: "Protein", n: suggestion.makros.protein, unit: "g", c: "var(--berry)" },
                { label: "Fett", n: suggestion.makros.fat, unit: "g", sub: `davon ges. ${suggestion.makros.satFat} g`, c: "var(--accent)" },
                { label: "Kohlenhydrate", n: suggestion.makros.carbs, unit: "g", sub: `davon Zucker ${suggestion.makros.sugar} g`, c: "var(--petrol)" },
                { label: "Ballaststoffe", n: suggestion.makros.fiber, unit: "g", c: "var(--herb)" },
                { label: "Salz", n: suggestion.makros.salt, unit: "g", dec: 1, c: "var(--plum)" },
              ].map(m => (
                <div key={m.label} style={{
                  padding: "10px", borderRadius: "10px",
                  background: `color-mix(in srgb, ${m.c} 9%, transparent)`,
                  border: `1px solid color-mix(in srgb, ${m.c} 22%, transparent)`,
                  borderLeft: `3px solid ${m.c}`,
                }}>
                  <div style={{ fontSize: "11px", color: "var(--ink3)", fontWeight: 500 }}>{m.label}</div>
                  <div style={{ fontSize: "16px", color: m.c, fontWeight: 700, fontFamily: "'Fraunces',serif", fontVariantNumeric: "tabular-nums" }}>
                    <CountUp end={Number(m.n) || 0} decimals={m.dec || 0} />
                    <span style={{ fontSize: "11px", color: "var(--ink3)", fontWeight: 600, marginLeft: "3px" }}>{m.unit}</span>
                  </div>
                  {m.sub && <div style={{ fontSize: "10px", color: "var(--ink3)", marginTop: "2px" }}>{m.sub}</div>}
                </div>
              ))}
            </div>
            {suggestion.makros.coverage < 0.8 && (
              <p style={{ fontSize: "11px", color: "var(--ink3)", marginTop: "8px" }}>
                ⚠️ Einige Zutaten ohne Nährwert-Referenz — Werte geschätzt.
              </p>
            )}
          </Card>
        )}

        {/* Tip */}
        {suggestion.tipp && (
          <Card anim="fadeUp" delay="0.3s" style={{ marginBottom: "12px", background: "linear-gradient(135deg,rgba(178,58,72,0.05),rgba(126,90,134,0.05))", border: "1px solid rgba(178,58,72,0.15)" }}>
            <p style={{ margin: 0, fontSize: "14px", color: "var(--ink2)", lineHeight: 1.6 }}>
              <strong style={{ color: "var(--accent)" }}>💡 Tipp:</strong> {suggestion.tipp}
            </p>
          </Card>
        )}

        {/* Health hint */}
        {suggestion.gesundheitshinweis && (
          <Card anim="fadeUp" delay="0.35s" style={{ marginBottom: "12px", background: "linear-gradient(135deg,rgba(34,139,34,0.05),rgba(60,179,113,0.05))", border: "1px solid rgba(34,139,34,0.15)" }}>
            <p style={{ margin: 0, fontSize: "14px", color: "var(--ink2)", lineHeight: 1.6 }}>
              <strong style={{ color: "#228B22" }}>🩺 Gesundheit:</strong> {suggestion.gesundheitshinweis}
            </p>
          </Card>
        )}

        {/* Wine */}
        {suggestion.weinempfehlung && (
          <Card anim="fadeUp" delay="0.33s" style={{ marginBottom: "12px", background: "linear-gradient(135deg,rgba(120,40,60,0.05),rgba(160,60,80,0.05))", border: "1px solid rgba(120,40,60,0.12)" }}>
            <p style={{ margin: 0, fontSize: "14px", color: "var(--ink2)", lineHeight: 1.6 }}>
              <strong style={{ color: "#7A2840" }}>🍷 Dazu passt:</strong> {suggestion.weinempfehlung}
            </p>
          </Card>
        )}

        {/* Sources, disclaimer and manual verification — required for
            serious nutrition and Gastro use. See DATA_SOURCES and
            DATA_DISCLAIMER constants. */}
        {(suggestion.makros || suggestion.allergene?.length > 0) && (() => {
          const reviewKey = suggestion._templateId
            ? `${suggestion._templateId}::${suggestion.name}`
            : suggestion.name;
          const review = reviewedRecipes[reviewKey];
          const isReviewed = !!review;

          const exportText = () => {
            const lines = [];
            lines.push(`REZEPT: ${suggestion.name}`);
            lines.push(`Portionen: ${persons}  |  Zeit: ${suggestion.zeit}  |  ${suggestion.schwierigkeit || ""}`);
            lines.push("");
            lines.push("ZUTATEN (inkl. Allergenkennzeichnung nach LMIV):");
            (suggestion.zutaten || []).forEach(z => lines.push(`  - ${z}`));
            if (suggestion.allergene?.length) {
              lines.push("");
              lines.push("ALLERGENE:");
              suggestion.allergene.forEach(a => lines.push(`  ${a.code} = ${a.label}`));
            }
            if (suggestion.zusatzstoffe?.length) {
              lines.push("");
              lines.push("ZUSATZSTOFFE:");
              suggestion.zusatzstoffe.forEach(zs => lines.push(`  ${zs.number} = ${zs.label}`));
            }
            if (suggestion.alkohol) {
              lines.push("");
              lines.push(`ALKOHOLGEHALT: ${suggestion.alkohol.label}`);
            }
            if (suggestion.makros) {
              lines.push("");
              lines.push("NÄHRWERTE PRO PORTION:");
              lines.push(`  Energie: ${suggestion.makros.kcal} kcal`);
              lines.push(`  Eiweiß: ${suggestion.makros.protein} g`);
              lines.push(`  Fett: ${suggestion.makros.fat} g (davon gesättigt ${suggestion.makros.satFat} g)`);
              lines.push(`  Kohlenhydrate: ${suggestion.makros.carbs} g (davon Zucker ${suggestion.makros.sugar} g)`);
              lines.push(`  Ballaststoffe: ${suggestion.makros.fiber} g`);
              lines.push(`  Salz: ${suggestion.makros.salt} g`);
            }
            if (suggestion.warnungen?.length) {
              lines.push("");
              lines.push("ERNÄHRUNGSHINWEISE:");
              suggestion.warnungen.forEach(w => lines.push(`  • ${w.text}`));
            }
            lines.push("");
            lines.push("QUELLEN:");
            DATA_SOURCES.forEach(s => lines.push(`  - ${s}`));
            lines.push("");
            lines.push(`HAFTUNGSAUSSCHLUSS: ${DATA_DISCLAIMER}`);
            if (isReviewed) {
              lines.push("");
              lines.push(`MANUELL GEPRÜFT: ${new Date(review.date).toLocaleString("de-DE")}`);
              if (review.by) lines.push(`VON: ${review.by}`);
            }
            return lines.join("\n");
          };

          const toggleReview = () => {
            const next = { ...reviewedRecipes };
            if (isReviewed) {
              delete next[reviewKey];
            } else {
              next[reviewKey] = {
                date: new Date().toISOString(),
                by: profile.name || "Nutzer",
              };
            }
            setReviewedRecipes(next);
            save(K.reviewed, next);
          };

          const exportToClipboard = async () => {
            try {
              await navigator.clipboard.writeText(exportText());
              alert("Gastro-Kennzeichnung in Zwischenablage kopiert ✓");
            } catch {
              alert("Kopieren fehlgeschlagen – bitte manuell markieren.");
            }
          };

          return (
            <Card anim="fadeUp" delay="0.36s" style={{ marginBottom: "12px", background: "rgba(0,0,0,0.02)", border: "1px solid var(--card-border)" }}>
              {/* Collapsible header — collapsed by default to keep the recipe clean */}
              <button onClick={() => setSourcesOpen(o => !o)} style={{
                width: "100%", background: "none", border: "none", cursor: "pointer",
                display: "flex", justifyContent: "space-between", alignItems: "center",
                padding: 0, fontFamily: "'Outfit',sans-serif", textAlign: "left",
              }}>
                <div>
                  <h3 style={{ fontFamily: "'Fraunces',serif", fontSize: "17px", fontWeight: 700, color: "var(--ink)", letterSpacing: "-0.3px" }}>
                    📋 Quellen & Nachweis
                  </h3>
                  <p style={{ fontSize: "13px", color: "var(--ink3)", marginTop: "2px" }}>
                    LMIV-konform · {isReviewed ? "✓ geprüft" : "Export & Prüfung"}
                  </p>
                </div>
                <span style={{ fontSize: "20px", color: "var(--ink3)", transform: sourcesOpen ? "rotate(180deg)" : "none", transition: "transform 0.25s ease" }}>⌄</span>
              </button>

              {sourcesOpen && (
                <div style={{ animation: "fadeUp 0.25s ease both" }}>
                  <div style={{ marginTop: "12px", fontSize: "11px", color: "var(--ink3)", lineHeight: 1.55 }}>
                    <p style={{ margin: 0, fontWeight: 600, color: "var(--ink2)", marginBottom: "4px" }}>Datenquellen:</p>
                    <ul style={{ margin: 0, paddingLeft: "16px" }}>
                      {DATA_SOURCES.map((s, i) => <li key={i} style={{ marginBottom: "2px" }}>{s}</li>)}
                    </ul>
                  </div>

                  <div style={{ marginTop: "12px", padding: "10px 12px", borderRadius: "8px", background: "rgba(196,64,64,0.06)", border: "1px solid rgba(196,64,64,0.15)", fontSize: "11px", color: "var(--ink2)", lineHeight: 1.5 }}>
                    <strong style={{ color: "#C44040" }}>⚠️ Haftungsausschluss:</strong> {DATA_DISCLAIMER}
                  </div>

                  <div style={{ marginTop: "12px", display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center" }}>
                    <button onClick={toggleReview} style={{
                      display: "inline-flex", alignItems: "center", gap: "6px",
                      padding: "8px 14px", borderRadius: "20px",
                      border: isReviewed ? "2px solid #228B22" : "1px solid var(--card-border)",
                      background: isReviewed ? "rgba(34,139,34,0.1)" : "var(--card)",
                      color: isReviewed ? "#228B22" : "var(--ink3)",
                      fontSize: "12px", fontWeight: isReviewed ? 600 : 500,
                      fontFamily: "'Outfit',sans-serif", cursor: "pointer",
                    }}>
                      {isReviewed ? "✓ Manuell geprüft" : "☐ Manuell prüfen & freigeben"}
                    </button>
                    <button onClick={exportToClipboard} style={{
                      display: "inline-flex", alignItems: "center", gap: "6px",
                      padding: "8px 14px", borderRadius: "20px",
                      border: "1px solid var(--card-border)", background: "var(--card)",
                      color: "var(--ink2)", fontSize: "12px", fontWeight: 500,
                      fontFamily: "'Outfit',sans-serif", cursor: "pointer",
                    }}>📋 Gastro-Export (Text)</button>
                  </div>

                  {isReviewed && (
                    <p style={{ marginTop: "10px", fontSize: "11px", color: "#228B22", fontWeight: 500 }}>
                      Geprüft am {new Date(review.date).toLocaleDateString("de-DE")} von {review.by || "Nutzer"}
                    </p>
                  )}
                </div>
              )}
            </Card>
          );
        })()}

        {/* PDF export — available for any recipe (download/print) */}
        <div style={{ marginBottom: "12px", animation: "fadeUp 0.5s ease both", animationDelay: "0.34s" }}>
          <button onClick={() => downloadRecipePDF(suggestion)} style={{
            width: "100%", padding: "12px", borderRadius: "var(--r)",
            border: "2px solid var(--card-border)", background: "var(--card)",
            color: "var(--ink2)", fontSize: "14px", fontWeight: 600,
            cursor: "pointer", fontFamily: "'Outfit',sans-serif",
          }}>📄 Rezept als PDF speichern</button>
        </div>

        {/* Bottom actions */}
        <div style={{ display: "flex", flexDirection: "column", gap: "8px", animation: "fadeUp 0.5s ease both", animationDelay: "0.35s" }}>
          {viewingSaved ? (
            <Btn secondary onClick={closeRecipe}>← Zurück</Btn>
          ) : (
            <>
              <Btn onClick={() => {
                // Learning signal: dislike when skipping (offline recipes)
                if (suggestion?._offline && suggestion?._foodIds) {
                  recordDislike(suggestion, suggestion._foodIds, suggestion._templateId);
                }
                generate(mode === "fridge" ? "fridge" : "quick");
              }}>Anderer Vorschlag 🔄</Btn>
              <Btn secondary onClick={reset}>← Zurück zum Start</Btn>
            </>
          )}
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div style={{ padding: "40px 0", textAlign: "center" }}>
        <p style={{ color: "var(--ink3)" }}>Lade...</p>
      </div>
    </Layout>
  );
}
