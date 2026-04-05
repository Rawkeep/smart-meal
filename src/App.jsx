import { useState, useEffect, useRef, useCallback } from "react";

// ─── Storage Keys ───
const K = {
  profile: "wei-profile-v2",
  history: "wei-history-v2",
  favorites: "wei-favorites-v2",
  streak: "wei-streak-v2",
  shoplist: "wei-shoplist-v2",
  apiKey: "wei-api-key",
};

// ─── Constants ───
const ALLERGIES = [
  { id: "gluten", label: "Gluten", emoji: "🌾" },
  { id: "laktose", label: "Laktose", emoji: "🥛" },
  { id: "nüsse", label: "Nüsse", emoji: "🥜" },
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

const Card = ({ children, style, anim, delay }) => (
  <div style={{
    background: "var(--card)",
    backdropFilter: "blur(24px) saturate(1.3)",
    WebkitBackdropFilter: "blur(24px) saturate(1.3)",
    borderRadius: "var(--R)",
    padding: "24px",
    border: "1px solid var(--card-border)",
    boxShadow: "var(--shadow)",
    animation: anim ? `${anim} 0.5s cubic-bezier(0.16,1,0.3,1) both` : undefined,
    animationDelay: delay || "0s",
    ...style,
  }}>{children}</div>
);

const ST = ({ children, sub }) => (
  <div style={{ marginBottom: "10px" }}>
    <h3 style={{
      fontFamily: "'Fraunces',serif", fontSize: "17px", fontWeight: 700,
      color: "var(--ink)", letterSpacing: "-0.3px",
    }}>{children}</h3>
    {sub && <p style={{
      fontFamily: "'Outfit',sans-serif", fontSize: "13px",
      color: "var(--ink3)", marginTop: "2px",
    }}>{sub}</p>}
  </div>
);

const Btn = ({ children, onClick, disabled, secondary, style: s }) => (
  <button onClick={onClick} disabled={disabled} style={{
    width: "100%", padding: "16px", borderRadius: "16px",
    border: secondary ? "2px solid var(--card-border)" : "none",
    background: secondary ? "var(--card)" : disabled ? "var(--ink3)" : "linear-gradient(135deg,var(--accent) 0%,#A8500F 100%)",
    color: secondary ? "var(--ink2)" : "#fff",
    fontSize: "15px", fontWeight: 700, fontFamily: "'Outfit',sans-serif",
    cursor: disabled ? "not-allowed" : "pointer",
    boxShadow: secondary || disabled ? "none" : "0 6px 20px rgba(200,97,26,0.35)",
    transition: "all 0.25s ease", letterSpacing: "0.3px",
    opacity: disabled ? 0.5 : 1,
    ...s,
  }}>{children}</button>
);

const Badge = ({ icon, text }) => (
  <div style={{
    padding: "5px 12px", borderRadius: "20px", background: "var(--card)",
    border: "1px solid var(--card-border)", fontSize: "12px", color: "var(--ink2)",
    fontWeight: 500, fontFamily: "'Outfit',sans-serif",
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

const Layout = ({ children }) => (
  <div style={{
    minHeight: "100vh",
    background: "linear-gradient(160deg,var(--bg1) 0%,var(--bg2) 40%,var(--bg3) 100%)",
    backgroundSize: "200% 200%",
    animation: "bgShift 20s ease infinite",
    fontFamily: "'Outfit',sans-serif",
  }}>
    <div style={{ maxWidth: "520px", margin: "0 auto", padding: "16px 16px 48px", position: "relative", zIndex: 1 }}>
      {children}
    </div>
  </div>
);

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

// ─── Default State ───
const defaultProfile = { allergies: [], histamin: false, diet: [], cuisines: [], dislikes: "", name: "", persons: 2 };

// ─── Main App ───
export default function App() {
  const [profile, setProfile] = useState(defaultProfile);
  const [view, setView] = useState("loading");
  const [onbStep, setOnbStep] = useState(0);
  const [meal, setMeal] = useState("");
  const [cookTime, setCookTime] = useState("");
  const [mood, setMood] = useState("");
  const [budget, setBudget] = useState("egal");
  const [persons, setPersons] = useState(2);
  const [fridgeInput, setFridgeInput] = useState("");
  const [guestMode, setGuestMode] = useState(false);
  const [guestAllergies, setGuestAllergies] = useState([]);
  const [guestHistamin, setGuestHistamin] = useState(false);
  const [guestDiet, setGuestDiet] = useState([]);
  const [suggestion, setSuggestion] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadMsg, setLoadMsg] = useState("");
  const [history, setHistory] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [streak, setStreak] = useState({ count: 0, lastDate: "" });
  const [shopList, setShopList] = useState([]);
  const [mode, setMode] = useState("quick");
  const [overlay, setOverlay] = useState(null);
  const [weekPlan, setWeekPlan] = useState(null);
  const [planLoading, setPlanLoading] = useState(false);
  const [apiKey, setApiKey] = useState("");
  const [showKeyInput, setShowKeyInput] = useState(false);
  const mounted = useRef(false);

  // ─── Init ───
  useEffect(() => {
    if (mounted.current) return;
    mounted.current = true;

    const p = load(K.profile);
    const h = load(K.history);
    const f = load(K.favorites);
    const s = load(K.streak);
    const sh = load(K.shoplist);
    const key = load(K.apiKey);

    if (p) { setProfile(p); setView("home"); } else setView("onboarding");
    if (h) setHistory(h);
    if (f) setFavorites(f);
    if (s) setStreak(s);
    if (sh) setShopList(sh);
    if (key) setApiKey(key);
    setMeal(autoMeal());
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

  const toggleFav = useCallback((dish) => {
    const exists = favorites.find(f => f.name === dish.name);
    const u = exists
      ? favorites.filter(f => f.name !== dish.name)
      : [...favorites, { ...dish, savedAt: new Date().toISOString() }];
    setFavorites(u);
    save(K.favorites, u);
  }, [favorites]);

  const addToShopList = useCallback((items) => {
    const nl = [
      ...shopList,
      ...items.filter(i => !shopList.find(s => s.name === i)).map(i => ({ name: i, checked: false })),
    ];
    setShopList(nl);
    save(K.shoplist, nl);
  }, [shopList]);

  const toggleShopItem = useCallback((i) => {
    const u = shopList.map((item, j) => j === i ? { ...item, checked: !item.checked } : item);
    setShopList(u);
    save(K.shoplist, u);
  }, [shopList]);

  const clearShopList = useCallback(() => { setShopList([]); save(K.shoplist, []); }, []);

  const saveApiKey = useCallback((key) => { setApiKey(key); save(K.apiKey, key); }, []);

  // ─── Prompt Builder ───
  const buildPrompt = useCallback((m) => {
    const an = [...profile.allergies, ...(guestMode ? guestAllergies : [])].map(a => ALLERGIES.find(o => o.id === a)?.label).filter(Boolean);
    const hi = profile.histamin || (guestMode && guestHistamin);
    const dn = [...profile.diet, ...(guestMode ? guestDiet : [])].map(d => DIETS.find(o => o.id === d)?.label).filter(Boolean);
    const cn = profile.cuisines.map(c => CUISINES.find(o => o.id === c)?.label).filter(Boolean);
    const recent = history.slice(-8).map(h => h.name).join(", ");
    const mo = new Date().getMonth();

    const base = `Du bist ein weltklasse Koch-Assistent. Du kennst internationale Küche, afrikanische Spezialitäten und saisonale deutsche Küche.

PROFIL:
- Allergien: ${an.length ? an.join(", ") : "keine"}
- Histaminintoleranz: ${hi ? "JA – STRENG vermeiden: gereifter Käse, Wurst, Schinken, Salami, Tomaten, Tomatenmark, Spinat, Avocado, Aubergine, fermentiertes (Sauerkraut, Kimchi, Sojasauce, Miso, Tempeh), Essig, Alkohol, Konserven, Hefeextrakt, Zitrusfrüchte, Erdbeeren, Ananas, Walnüsse, Cashews, Schokolade, Kakao, lang gelagertes Fleisch/Fisch, Räucherfisch, Thunfisch. NUR frische Lebensmittel!" : "nein"}
- Ernährung: ${dn.length ? dn.join(", ") : "omnivor"}
- Küchen: ${cn.length ? cn.join(", ") : "international"}
- Abneigungen: ${profile.dislikes || "keine"}
- Portionen: ${persons}
${guestMode ? "- ⚠️ GÄSTE-MODUS: Alle Gäste-Einschränkungen beachten!" : ""}

SAISON (${SEASON_NAMES[mo]}): ${SEASONS[mo]}`;

    if (m === "fridge") return `${base}\n\nKÜHLSCHRANK-MODUS: Zutaten: ${fridgeInput}\nNur diese + Grundzutaten verwenden.\n${recent ? `Nicht wiederholen: ${recent}` : ""}\n\nNUR JSON (kein Markdown):\n{"name":"...","beschreibung":"1 Satz","zutaten":["..."],"schritte":["..."],"zeit":"XX Min","kalorien":"ca. XXX kcal","protein":"ca. XX g","tipp":"...","emoji":"...","schwierigkeit":"Leicht|Mittel|Anspruchsvoll","tags":["..."],"herkunft":"Land/Region"}`;

    if (m === "plan") return `${base}\n\nWOCHENPLAN: 5 Werktage (Mo–Fr), je Frühstück/Mittag/Abend. Budget: ${BUDGETS.find(b => b.id === budget)?.label || "normal"}. Abwechslungsreich!\n\nNUR JSON:\n{"plan":[{"tag":"Montag","frühstück":{"name":"...","emoji":"...","zeit":"XX Min"},"mittag":{"name":"...","emoji":"...","zeit":"XX Min"},"abend":{"name":"...","emoji":"...","zeit":"XX Min"}},...],  "einkaufsliste":["Zutat 1","Zutat 2",...]}`;

    return `${base}\n\n- Mahlzeit: ${MEALS.find(x => x.id === meal)?.label || ""}\n- Kochzeit: ${TIMES.find(x => x.id === cookTime)?.label || ""}\n- Stimmung: ${MOODS.find(x => x.id === mood)?.label || ""}\n- Budget: ${BUDGETS.find(x => x.id === budget)?.label || ""}\n${recent ? `- NICHT wiederholen: ${recent}` : ""}\n\nNUR JSON:\n{"name":"...","beschreibung":"1 Satz","zutaten":["Menge + Zutat"],"schritte":["..."],"zeit":"XX Min","kalorien":"ca. XXX kcal","protein":"ca. XX g","tipp":"...","emoji":"...","schwierigkeit":"Leicht|Mittel|Anspruchsvoll","tags":["..."],"herkunft":"Land/Region","weinempfehlung":"passender Wein/Getränk"}`;
  }, [profile, guestMode, guestAllergies, guestHistamin, guestDiet, history, persons, fridgeInput, budget, meal, cookTime, mood]);

  // ─── API Call ───
  const callAPI = useCallback(async (prompt) => {
    if (!apiKey) throw new Error("Kein API-Key");
    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "anthropic-dangerous-direct-browser-access": "true",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1500,
        messages: [{ role: "user", content: prompt }],
      }),
    });
    if (!r.ok) {
      const err = await r.json().catch(() => ({}));
      throw new Error(err.error?.message || `API Fehler: ${r.status}`);
    }
    const d = await r.json();
    const t = d.content.map(c => c.type === "text" ? c.text : "").join("");
    return JSON.parse(t.replace(/```json|```/g, "").trim());
  }, [apiKey]);

  // ─── Generate ───
  const generate = useCallback(async (m) => {
    if (!apiKey) { setShowKeyInput(true); return; }
    setLoading(true);
    setSuggestion(null);
    const msgs = ["Schaue in die Vorratskammer...", "Wähle die besten Zutaten...", "Kreiere dein Gericht...", "Perfektioniere das Rezept..."];
    let mi = 0;
    setLoadMsg(msgs[0]);
    const iv = setInterval(() => { mi = (mi + 1) % msgs.length; setLoadMsg(msgs[mi]); }, 1800);
    try {
      const r = await callAPI(buildPrompt(m || "quick"));
      setSuggestion(r);
      const nh = [...history, { name: r.name, date: new Date().toISOString(), emoji: r.emoji }].slice(-30);
      setHistory(nh);
      save(K.history, nh);
      updateStreak();
      setView("result");
    } catch (e) {
      setSuggestion({ error: true, message: e.message });
      setView("result");
    }
    clearInterval(iv);
    setLoading(false);
  }, [apiKey, callAPI, buildPrompt, history, updateStreak]);

  const generatePlan = useCallback(async () => {
    if (!apiKey) { setShowKeyInput(true); return; }
    setPlanLoading(true);
    setWeekPlan(null);
    try { setWeekPlan(await callAPI(buildPrompt("plan"))); }
    catch { setWeekPlan({ error: true }); }
    setPlanLoading(false);
  }, [apiKey, callAPI, buildPrompt]);

  const reset = useCallback(() => {
    setMeal(autoMeal()); setCookTime(""); setMood(""); setBudget("egal");
    setSuggestion(null); setView("home"); setFridgeInput("");
    setGuestMode(false); setGuestAllergies([]); setGuestHistamin(false); setGuestDiet([]);
  }, []);

  // ─── API Key Modal ───
  if (showKeyInput) return (
    <Layout>
      <div style={{ paddingTop: "40px" }}>
        <Card anim="scaleIn" style={{ textAlign: "center" }}>
          <div style={{ fontSize: "48px", marginBottom: "12px" }}>🔑</div>
          <h2 style={{ fontFamily: "'Fraunces',serif", color: "var(--ink)", fontSize: "20px", marginBottom: "8px" }}>API-Key benötigt</h2>
          <p style={{ color: "var(--ink3)", fontSize: "13px", marginBottom: "16px", lineHeight: 1.5 }}>
            Gib deinen Anthropic API-Key ein, um Rezepte zu generieren. Der Key wird nur lokal in deinem Browser gespeichert.
          </p>
          <input
            type="password"
            value={apiKey}
            onChange={e => setApiKey(e.target.value)}
            placeholder="sk-ant-..."
            style={{
              width: "100%", padding: "12px 14px", borderRadius: "var(--r)",
              border: "2px solid var(--card-border)", background: "var(--card)",
              fontFamily: "'Outfit',sans-serif", fontSize: "14px", color: "var(--ink)",
              outline: "none", boxSizing: "border-box", marginBottom: "12px",
            }}
          />
          <Btn onClick={() => { saveApiKey(apiKey); setShowKeyInput(false); }} disabled={!apiKey.startsWith("sk-")}>
            Speichern
          </Btn>
          {view !== "loading" && (
            <div style={{ marginTop: "8px" }}>
              <Btn secondary onClick={() => setShowKeyInput(false)}>Abbrechen</Btn>
            </div>
          )}
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
          <ChipGrid options={ALLERGIES} selected={profile.allergies} onToggle={id => setProfile(p => ({ ...p, allergies: toggle(p.allergies, id) }))} />
          <div style={{ marginTop: "14px" }}>
            <Chip active={profile.histamin} onClick={() => setProfile(p => ({ ...p, histamin: !p.histamin }))} color="#C44040">⚠️ Histaminintoleranz</Chip>
          </div>
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
        t: "API-Key", s: "Dein Anthropic API-Key (wird lokal gespeichert)",
        c: <input type="password" value={apiKey} onChange={e => setApiKey(e.target.value)} placeholder="sk-ant-..." style={{
          width: "100%", padding: "14px 16px", borderRadius: "var(--r)",
          border: "2px solid var(--card-border)", background: "var(--card)",
          fontFamily: "'Outfit',sans-serif", fontSize: "14px", color: "var(--ink)",
          outline: "none", boxSizing: "border-box",
        }} />,
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
            <Card key={i} anim="fadeUp" delay={`${i * 0.05}s`}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <span style={{ fontSize: "20px", marginRight: "8px" }}>{f.emoji}</span>
                  <strong style={{ fontFamily: "'Fraunces',serif", color: "var(--ink)" }}>{f.name}</strong>
                  <div style={{ fontSize: "12px", color: "var(--ink3)", marginTop: "2px" }}>
                    {f.beschreibung} · {f.zeit} · {f.herkunft}
                  </div>
                  {f.tags && (
                    <div style={{ display: "flex", gap: "4px", marginTop: "4px", flexWrap: "wrap" }}>
                      {f.tags.slice(0, 4).map((t, j) => (
                        <span key={j} style={{ fontSize: "10px", padding: "2px 8px", borderRadius: "8px", background: "var(--bg2)", color: "var(--ink3)" }}>#{t}</span>
                      ))}
                    </div>
                  )}
                </div>
                <button onClick={() => toggleFav(f)} style={{ background: "none", border: "none", fontSize: "20px", cursor: "pointer" }}>🗑️</button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </Layout>
  );

  if (overlay === "shop") return (
    <Layout>
      <CloseBar title="🛒 Einkaufsliste" onClose={() => setOverlay(null)} />
      {shopList.length === 0 ? (
        <Card anim="fadeUp"><p style={{ color: "var(--ink3)", textAlign: "center", padding: "24px 0" }}>Liste leer. Füge Zutaten aus Rezepten hinzu!</p></Card>
      ) : (
        <>
          <Card anim="fadeUp">
            <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
              {shopList.map((item, i) => (
                <div key={i} onClick={() => toggleShopItem(i)} style={{
                  display: "flex", alignItems: "center", gap: "10px", cursor: "pointer",
                  padding: "10px 0", borderBottom: i < shopList.length - 1 ? "1px solid var(--card-border)" : "none",
                }}>
                  <div style={{
                    width: "22px", height: "22px", borderRadius: "6px",
                    border: item.checked ? "2px solid var(--accent)" : "2px solid var(--ink3)",
                    background: item.checked ? "var(--accent)" : "transparent",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    color: "#fff", fontSize: "14px", transition: "all 0.2s ease", flexShrink: 0,
                  }}>{item.checked ? "✓" : ""}</div>
                  <span style={{
                    fontSize: "14px", color: item.checked ? "var(--ink3)" : "var(--ink)",
                    textDecoration: item.checked ? "line-through" : "none", transition: "all 0.2s ease",
                  }}>{item.name}</span>
                </div>
              ))}
            </div>
          </Card>
          <div style={{ marginTop: "10px" }}><Btn secondary onClick={clearShopList}>🗑️ Liste leeren</Btn></div>
        </>
      )}
    </Layout>
  );

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
          <ST sub="Dein Name">👤 Name</ST>
          <InputField value={profile.name} onChange={e => setProfile(p => ({ ...p, name: e.target.value }))} />
        </Card>
        <Card anim="fadeUp" delay="0.05s">
          <ST sub="Was du nicht verträgst">⚠️ Allergien</ST>
          <ChipGrid options={ALLERGIES} selected={profile.allergies} onToggle={id => setProfile(p => ({ ...p, allergies: toggle(p.allergies, id) }))} />
          <div style={{ marginTop: "12px" }}>
            <Chip active={profile.histamin} onClick={() => setProfile(p => ({ ...p, histamin: !p.histamin }))} color="#C44040">⚠️ Histaminintoleranz</Chip>
          </div>
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
          <ST sub="Dein Anthropic API-Key">🔑 API-Key</ST>
          <input type="password" value={apiKey} onChange={e => setApiKey(e.target.value)} placeholder="sk-ant-..." style={{
            width: "100%", padding: "10px 14px", borderRadius: "var(--r)",
            border: "2px solid var(--card-border)", background: "var(--card)",
            fontFamily: "'Outfit',sans-serif", fontSize: "14px", color: "var(--ink)",
            outline: "none", boxSizing: "border-box",
          }} />
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

  // ─── Home ───
  if (view === "home") {
    const ready = mode === "fridge" ? fridgeInput.trim().length > 2 : (meal && cookTime && mood);
    const mo = new Date().getMonth();

    return (
      <Layout>
        {/* Header */}
        <div style={{ padding: "20px 0 8px", animation: "fadeUp 0.4s ease both" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <p style={{ fontSize: "14px", color: "var(--ink3)", marginBottom: "2px" }}>{greet()}{profile.name ? `, ${profile.name}` : ""} 👋</p>
              <h1 style={{ fontFamily: "'Fraunces',serif", fontSize: "28px", fontWeight: 900, color: "var(--ink)", letterSpacing: "-1px" }}>Was esse ich?</h1>
            </div>
            {streak.count > 0 && (
              <div style={{
                display: "inline-flex", alignItems: "center", gap: "4px", padding: "4px 10px",
                borderRadius: "12px",
                background: streak.count >= 7 ? "linear-gradient(135deg,#E8943A,#D4731A)" : "var(--card)",
                border: "1px solid var(--card-border)", fontSize: "12px", fontWeight: 600,
                color: streak.count >= 7 ? "#fff" : "var(--ink2)",
              }}>🔥 {streak.count} Tage</div>
            )}
          </div>
          <div style={{ display: "flex", gap: "6px", marginTop: "8px", flexWrap: "wrap" }}>
            {profile.histamin && <Badge icon="⚠️" text="Histamin" />}
            {profile.allergies.length > 0 && <Badge icon="🛡️" text={`${profile.allergies.length} Allergien`} />}
            {profile.diet.slice(0, 2).map(d => <Badge key={d} icon={DIETS.find(o => o.id === d)?.emoji} text={DIETS.find(o => o.id === d)?.label} />)}
            {guestMode && <Badge icon="👥" text="Gäste aktiv" />}
            {!apiKey && <Badge icon="🔑" text="Key fehlt" />}
          </div>
        </div>

        {/* Quick actions */}
        <div style={{ display: "flex", gap: "8px", marginTop: "12px", animation: "fadeUp 0.4s ease both", animationDelay: "0.05s" }}>
          {[
            { i: "❤️", l: "Favoriten", a: () => setOverlay("favs"), n: favorites.length },
            { i: "🛒", l: "Einkauf", a: () => setOverlay("shop"), n: shopList.filter(s => !s.checked).length },
            { i: "📖", l: "Verlauf", a: () => setOverlay("history"), n: history.length },
            { i: "👥", l: "Gäste", a: () => setOverlay("guest"), n: guestMode ? "!" : 0 },
            { i: "⚙️", l: "Profil", a: () => setOverlay("settings") },
          ].map((a, i) => (
            <button key={i} onClick={a.a} style={{
              flex: 1, padding: "10px 4px", borderRadius: "var(--r)",
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
          background: "linear-gradient(135deg,rgba(200,97,26,0.06),rgba(245,166,35,0.06))",
          border: "1px solid rgba(200,97,26,0.12)",
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
        </div>

        {/* Quick Mode */}
        {mode === "quick" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginTop: "14px" }}>
            <Card anim="fadeUp" delay="0.15s"><ST sub="Was wird's?">🍽️ Mahlzeit</ST><ChipGrid options={MEALS} selected={meal} onToggle={id => setMeal(id === meal ? "" : id)} multi={false} /></Card>
            <Card anim="fadeUp" delay="0.2s"><ST sub="Wie viel Zeit hast du?">⏱️ Kochzeit</ST><ChipGrid options={TIMES} selected={cookTime} onToggle={id => setCookTime(id === cookTime ? "" : id)} multi={false} showSub /></Card>
            <Card anim="fadeUp" delay="0.25s"><ST>🎨 Stimmung</ST><ChipGrid options={MOODS} selected={mood} onToggle={id => setMood(id === mood ? "" : id)} multi={false} colorMap /></Card>
            <Card anim="fadeUp" delay="0.3s"><ST>💰 Budget</ST><ChipGrid options={BUDGETS} selected={budget} onToggle={id => setBudget(id === budget ? "egal" : id)} multi={false} showSub /></Card>
            <Card anim="fadeUp" delay="0.35s">
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
              <ST sub="Was hast du noch da? Einfach aufzählen.">🧊 Kühlschrank-Check</ST>
              <InputField multiline value={fridgeInput} onChange={e => setFridgeInput(e.target.value)} placeholder="z.B. Hähnchenbrust, Reis, Paprika, Zwiebeln, Kokosmilch..." style={{ minHeight: "120px" }} />
              <p style={{ fontSize: "11px", color: "var(--ink3)", marginTop: "6px" }}>Grundzutaten (Salz, Pfeffer, Öl, Gewürze) sind immer vorhanden.</p>
            </Card>
            <div style={{ animation: "fadeUp 0.4s ease both", animationDelay: "0.2s" }}>
              <Btn onClick={() => generate("fridge")} disabled={!ready || loading}>
                {loading ? "Schaue was geht... 🔍" : "Daraus mach was! 🍳"}
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
                        <div key={t} style={{ display: "flex", alignItems: "center", gap: "8px", padding: "6px 0", borderBottom: "1px solid var(--card-border)" }}>
                          <span style={{ fontSize: "20px" }}>{m.emoji}</span>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: "13px", fontWeight: 600, color: "var(--ink)" }}>{m.name}</div>
                            <div style={{ fontSize: "11px", color: "var(--ink3)" }}>{m.zeit}</div>
                          </div>
                        </div>
                      );
                    })}
                  </Card>
                ))}
                {weekPlan.einkaufsliste && (
                  <Btn onClick={() => { addToShopList(weekPlan.einkaufsliste); setOverlay("shop"); }}>
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

    return (
      <Layout>
        {/* Hero */}
        <div style={{ textAlign: "center", padding: "24px 0 12px", animation: "scaleIn 0.5s cubic-bezier(0.16,1,0.3,1) both" }}>
          <div style={{ fontSize: "72px", animation: "float 3s ease infinite", filter: "drop-shadow(0 4px 12px rgba(0,0,0,0.1))" }}>{suggestion.emoji || "🍽️"}</div>
          <h1 style={{ fontFamily: "'Fraunces',serif", fontSize: "26px", fontWeight: 900, color: "var(--ink)", marginTop: "8px", letterSpacing: "-0.5px", lineHeight: 1.2, padding: "0 16px" }}>{suggestion.name}</h1>
          <p style={{ fontSize: "14px", color: "var(--ink3)", marginTop: "6px", lineHeight: 1.5, padding: "0 20px" }}>{suggestion.beschreibung}</p>
        </div>

        {/* Meta */}
        <div style={{ display: "flex", gap: "6px", justifyContent: "center", flexWrap: "wrap", marginBottom: "12px", animation: "fadeUp 0.5s ease both", animationDelay: "0.1s" }}>
          <Badge icon="⏱️" text={suggestion.zeit} />
          <Badge icon="🔥" text={suggestion.kalorien} />
          {suggestion.protein && <Badge icon="💪" text={suggestion.protein} />}
          {suggestion.schwierigkeit && <Badge icon="📊" text={suggestion.schwierigkeit} />}
          {suggestion.herkunft && <Badge icon="🌍" text={suggestion.herkunft} />}
        </div>

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
          <button onClick={() => { addToShopList(suggestion.zutaten); setOverlay("shop"); }} style={{
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
              <span key={i} style={{ fontSize: "11px", padding: "3px 10px", borderRadius: "10px", background: "rgba(200,97,26,0.08)", color: "var(--accent)", fontWeight: 500, border: "1px solid rgba(200,97,26,0.15)" }}>#{t}</span>
            ))}
          </div>
        )}

        {/* Ingredients */}
        <Card anim="fadeUp" delay="0.2s" style={{ marginBottom: "12px" }}>
          <ST sub={`Für ${persons} Person${persons > 1 ? "en" : ""}`}>🧾 Zutaten</ST>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {suggestion.zutaten?.map((z, i) => (
              <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: "10px", fontSize: "14px", color: "var(--ink)", lineHeight: 1.4 }}>
                <span style={{ width: "7px", height: "7px", borderRadius: "50%", marginTop: "6px", background: "linear-gradient(135deg,var(--accent),var(--accent3))", flexShrink: 0 }} />
                <span>{z}</span>
              </div>
            ))}
          </div>
        </Card>

        {/* Steps */}
        <Card anim="fadeUp" delay="0.25s" style={{ marginBottom: "12px" }}>
          <ST>👨‍🍳 Zubereitung</ST>
          <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            {suggestion.schritte?.map((s, i) => (
              <div key={i} style={{ display: "flex", gap: "12px" }}>
                <div style={{ width: "28px", height: "28px", borderRadius: "50%", flexShrink: 0, background: "linear-gradient(135deg,var(--accent),var(--accent2))", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "13px", fontWeight: 700, boxShadow: "0 2px 8px rgba(200,97,26,0.25)" }}>{i + 1}</div>
                <p style={{ fontSize: "14px", color: "var(--ink)", lineHeight: 1.6, margin: 0, paddingTop: "3px" }}>{s}</p>
              </div>
            ))}
          </div>
        </Card>

        {/* Tip */}
        {suggestion.tipp && (
          <Card anim="fadeUp" delay="0.3s" style={{ marginBottom: "12px", background: "linear-gradient(135deg,rgba(200,97,26,0.05),rgba(245,166,35,0.05))", border: "1px solid rgba(200,97,26,0.15)" }}>
            <p style={{ margin: 0, fontSize: "14px", color: "var(--ink2)", lineHeight: 1.6 }}>
              <strong style={{ color: "var(--accent)" }}>💡 Tipp:</strong> {suggestion.tipp}
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

        {/* Bottom actions */}
        <div style={{ display: "flex", flexDirection: "column", gap: "8px", animation: "fadeUp 0.5s ease both", animationDelay: "0.35s" }}>
          <Btn onClick={() => generate(mode === "fridge" ? "fridge" : "quick")}>Anderer Vorschlag 🔄</Btn>
          <Btn secondary onClick={reset}>← Zurück zum Start</Btn>
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
