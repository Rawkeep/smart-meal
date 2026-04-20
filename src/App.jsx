import { useState, useEffect, useRef, useCallback } from "react";
import { initDB, getAllFoods, getFoodsFiltered } from "./db";
import { FOODS, FOOD_CATEGORIES } from "./data/foods";
import { CROSS_ALLERGIES, ADDITIVES, ADDITIVE_CATEGORIES, NUTRIENT_DEFICIENCIES, METABOLISM_CONDITIONS, HEALTH_GOALS } from "./data/health";
import { generateOfflineSuggestion } from "./swarm/index";
import { recordLike, recordDislike } from "./swarm/learning-engine";
import { generateOfflinePlan } from "./swarm/plan-generator";

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
const PhotoUpload = ({ onResult, apiKey, backendAvailable }) => {
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
        const headers = { "Content-Type": "application/json" };
        if (apiKey) headers["x-user-api-key"] = apiKey;
        const r = await fetch("/api/recognize", {
          method: "POST",
          headers,
          body: JSON.stringify({ image: base64, mediaType: file.type }),
        });
        const d = await r.json();
        if (d.needsKey) { setShowKeyInput(true); setUploading(false); return; }
        items = JSON.parse(d.text.replace(/```json|```/g, "").trim());
      } else {
        if (!apiKey) { setShowKeyInput(true); setUploading(false); return; }
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
            max_tokens: 500,
            messages: [{
              role: "user",
              content: [
                { type: "image", source: { type: "base64", media_type: file.type, data: base64 } },
                { type: "text", text: "Erkenne alle Lebensmittel/Zutaten auf diesem Foto. Antworte NUR mit einem JSON-Array der Zutatennamen auf Deutsch, z.B. [\"Tomaten\",\"Käse\",\"Hähnchenbrust\"]. Keine Erklärung, nur das Array." },
              ],
            }],
          }),
        });
        const d = await r.json();
        const t = d.content?.map(c => c.type === "text" ? c.text : "").join("") || "[]";
        items = JSON.parse(t.replace(/```json|```/g, "").trim());
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
};

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
  const [streak, setStreak] = useState({ count: 0, lastDate: "" });
  const [shopList, setShopList] = useState([]);
  const [mode, setMode] = useState("quick");
  const [overlay, setOverlay] = useState(null);
  const [weekPlan, setWeekPlan] = useState(null);
  const [planLoading, setPlanLoading] = useState(false);
  const [apiKey, setApiKey] = useState("");
  const [showKeyInput, setShowKeyInput] = useState(false);
  const [offlineMode, setOfflineMode] = useState(false);
  const [isOnline, setIsOnline] = useState(typeof navigator !== "undefined" ? navigator.onLine : true);
  const mounted = useRef(false);

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
    if (key) setApiKey(key);
    setMeal(autoMeal());

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

    // Shared rule block: every mode must honor meal-type + ingredient coherence.
    const coherenceRule = `\n\nKONSISTENZREGELN (STRIKT):\n- Jede in "zutaten" genannte Zutat MUSS in "schritte" vorkommen. Jede in "schritte" erwähnte Zutat MUSS in "zutaten" stehen.\n- Alle zutaten im Format "Menge + Einheit + Zutat" (z.B. "200 g Haferflocken").\n- Schritte konkret und chronologisch, 4–7 Stück.\n- Gericht-Name muss zum Mahlzeitentyp passen.`;

    if (m === "fridge") return `${base}\n\nKÜHLSCHRANK-MODUS: Zutaten: ${fridgeItems.join(", ")}\nNur diese + Grundzutaten verwenden.${meal ? `\n- Mahlzeit: ${mealLabel} → ${mealRule}` : ""}\n${recent ? `Nicht wiederholen: ${recent}` : ""}${coherenceRule}\n\nNUR JSON (kein Markdown):\n{"name":"...","beschreibung":"1 Satz","zutaten":["Menge + Zutat"],"schritte":["..."],"zeit":"XX Min","kalorien":"ca. XXX kcal","protein":"ca. XX g","tipp":"...","emoji":"...","schwierigkeit":"Leicht|Mittel|Anspruchsvoll","tags":["..."],"herkunft":"Land/Region","gesundheitshinweis":"..."}`;

    if (m === "plan") return `${base}\n\nWOCHENPLAN: 5 Werktage (Mo–Fr), je Frühstück/Mittag/Abend. Budget: ${BUDGETS.find(b => b.id === budget)?.label || "normal"}. Abwechslungsreich!\n- Frühstück: NUR typische Frühstücksgerichte (Oats, Bowl, Toast, Rührei).\n- Mittag: sättigende Hauptgerichte.\n- Abend: eher leichter als Mittag.\n\nNUR JSON:\n{"plan":[{"tag":"Montag","frühstück":{"name":"...","emoji":"...","zeit":"XX Min"},"mittag":{"name":"...","emoji":"...","zeit":"XX Min"},"abend":{"name":"...","emoji":"...","zeit":"XX Min"}},...],  "einkaufsliste":["Zutat 1","Zutat 2",...]}`;

    return `${base}\n\n- Mahlzeit: ${mealLabel} → ${mealRule}\n- Kochzeit: ${TIMES.find(x => x.id === cookTime)?.label || ""}\n- Stimmung: ${MOODS.find(x => x.id === mood)?.label || ""}\n- Budget: ${BUDGETS.find(x => x.id === budget)?.label || ""}\n${recent ? `- NICHT wiederholen: ${recent}` : ""}${coherenceRule}\n\nNUR JSON:\n{"name":"...","beschreibung":"1 Satz","zutaten":["Menge + Zutat"],"schritte":["..."],"zeit":"XX Min","kalorien":"ca. XXX kcal","protein":"ca. XX g","tipp":"...","emoji":"...","schwierigkeit":"Leicht|Mittel|Anspruchsvoll","tags":["..."],"herkunft":"Land/Region","weinempfehlung":"passender Wein/Getränk","gesundheitshinweis":"..."}`;
  }, [profile, guestMode, guestAllergies, guestHistamin, guestDiet, history, persons, fridgeInput, selectedIngredients, budget, meal, cookTime, mood]);

  // ─── Backend availability check ───
  const [backendAvailable, setBackendAvailable] = useState(null);
  const [freemiumInfo, setFreemiumInfo] = useState({ remaining: 0, dailyLimit: 10, freemium: false });
  useEffect(() => {
    fetch("/api/health").then(r => r.json())
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
      const headers = { "Content-Type": "application/json" };
      if (apiKey) headers["x-user-api-key"] = apiKey;
      const r = await fetch(endpoint, {
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

    // Fallback: direct browser access (demo / GitHub Pages mode)
    if (!apiKey) { setShowKeyInput(true); throw new Error("Kein API-Key"); }
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
  }, [apiKey, backendAvailable]);

  // ─── Generate ───
  const generate = useCallback(async (m) => {
    setLoading(true);
    setSuggestion(null);
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
        setSuggestion(r);
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
  }, []);

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

          <div style={{ background: "var(--bg2)", borderRadius: "var(--r)", padding: "14px", marginBottom: "16px" }}>
            <p style={{ fontSize: "13px", color: "var(--ink)", fontWeight: 600, marginBottom: "8px" }}>So geht's (2 Minuten):</p>
            <ol style={{ paddingLeft: "18px", fontSize: "12px", color: "var(--ink2)", lineHeight: 1.8, margin: 0 }}>
              <li>Erstelle einen Account auf <strong>console.anthropic.com</strong></li>
              <li>Gehe zu <strong>API Keys</strong> im Menü</li>
              <li>Klicke auf <strong>"Create Key"</strong></li>
              <li>Kopiere den Key und füge ihn unten ein</li>
            </ol>
          </div>

          <input
            type="password"
            value={apiKey}
            onChange={e => setApiKey(e.target.value)}
            placeholder="sk-ant-api03-..."
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
          <Btn onClick={() => { saveApiKey(apiKey); setShowKeyInput(false); }} disabled={!apiKey.startsWith("sk-")}>
            Verbinden & Loslegen
          </Btn>
          {view !== "loading" && (
            <div style={{ marginTop: "8px" }}>
              <Btn secondary onClick={() => setShowKeyInput(false)}>Später einrichten</Btn>
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
            <div style={{ marginTop: "10px", padding: "10px", borderRadius: "var(--r)", background: "rgba(200,97,26,0.06)", border: "1px solid rgba(200,97,26,0.12)" }}>
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
        <Card anim="fadeUp" delay="0.45s">
          <ST sub={apiKey ? "Eigener Key aktiv — unbegrenzte Nutzung" : freemiumInfo.freemium ? `Kostenlos: ${freemiumInfo.remaining}/${freemiumInfo.dailyLimit} Anfragen heute` : "Für KI-Rezepte wird ein Key benötigt"}>🔑 API-Key (optional)</ST>
          <input type="password" value={apiKey} onChange={e => setApiKey(e.target.value)} placeholder="sk-ant-... (leer lassen für Freemium)" style={{
            width: "100%", padding: "10px 14px", borderRadius: "var(--r)",
            border: "2px solid var(--card-border)", background: "var(--card)",
            fontFamily: "'Outfit',sans-serif", fontSize: "14px", color: "var(--ink)",
            outline: "none", boxSizing: "border-box",
          }} />
          {apiKey && <button onClick={() => { setApiKey(""); save(K.apiKey, ""); }} style={{
            marginTop: "6px", background: "none", border: "none", color: "var(--ink3)",
            fontSize: "12px", cursor: "pointer", padding: "4px 0",
          }}>Key entfernen (zurück zu Freemium)</button>}
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

  // ─── Home ───
  if (view === "home") {
    const ready = mode === "fridge" ? (selectedIngredients.length > 0 || fridgeInput.trim().length > 2) : (meal && cookTime && mood);
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
            {apiKey ? <Badge icon="🔓" text="Eigener Key" /> :
              freemiumInfo.freemium ? <Badge icon="✨" text={`${freemiumInfo.remaining}/${freemiumInfo.dailyLimit} frei`} /> :
              <Badge icon="🔑" text="Key fehlt" />}
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
                background: offlineMode ? "linear-gradient(135deg,rgba(200,97,26,0.08),rgba(245,166,35,0.08))" : "var(--card)",
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
                <PhotoUpload apiKey={apiKey} backendAvailable={backendAvailable} onResult={addIngredientsFromPhoto} />
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
          {suggestion._fallbackFromApi && <Badge icon="🧠" text="Offline-Fallback" />}
        </div>

        {/* Full macros panel */}
        {suggestion.makros && (
          <Card anim="fadeUp" delay="0.12s" style={{ marginBottom: "12px" }}>
            <ST sub="pro Person">🥗 Nährwerte</ST>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(90px, 1fr))", gap: "8px", marginTop: "8px" }}>
              {[
                { label: "Energie", value: `${suggestion.makros.kcal} kcal` },
                { label: "Protein", value: `${suggestion.makros.protein} g` },
                { label: "Fett", value: `${suggestion.makros.fat} g`, sub: `davon ges. ${suggestion.makros.satFat} g` },
                { label: "Kohlenhydrate", value: `${suggestion.makros.carbs} g`, sub: `davon Zucker ${suggestion.makros.sugar} g` },
                { label: "Ballaststoffe", value: `${suggestion.makros.fiber} g` },
                { label: "Salz", value: `${suggestion.makros.salt} g` },
              ].map(m => (
                <div key={m.label} style={{
                  padding: "10px", borderRadius: "10px",
                  background: "rgba(200,97,26,0.05)",
                  border: "1px solid rgba(200,97,26,0.1)",
                }}>
                  <div style={{ fontSize: "11px", color: "var(--ink3)", fontWeight: 500 }}>{m.label}</div>
                  <div style={{ fontSize: "15px", color: "var(--ink)", fontWeight: 700, fontFamily: "'Fraunces',serif" }}>{m.value}</div>
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

        {/* Health warnings */}
        {suggestion.warnungen?.length > 0 && (
          <Card anim="fadeUp" delay="0.13s" style={{ marginBottom: "12px" }}>
            <ST sub="Von unserem Ernährungsberater">⚠️ Hinweise</ST>
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
          {suggestion.allergene?.length > 0 && (
            <div style={{ marginTop: "14px", paddingTop: "12px", borderTop: "1px solid var(--card-border)" }}>
              <p style={{ fontSize: "11px", color: "var(--ink3)", fontWeight: 600, marginBottom: "8px", letterSpacing: "0.3px", textTransform: "uppercase" }}>
                Allergenkennzeichnung (EU-LMIV)
              </p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                {suggestion.allergene.map(a => (
                  <span key={a.code} style={{
                    display: "inline-flex", alignItems: "center", gap: "6px",
                    padding: "4px 10px", borderRadius: "999px",
                    background: "rgba(200,97,26,0.08)",
                    border: "1px solid rgba(200,97,26,0.18)",
                    fontSize: "11px", color: "var(--ink2)", fontWeight: 500,
                  }}>
                    <strong style={{ color: "var(--accent)", fontFamily: "'Fraunces',serif", fontWeight: 700 }}>{a.code}</strong>
                    {a.label}
                  </span>
                ))}
              </div>
            </div>
          )}
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

        {/* Bottom actions */}
        <div style={{ display: "flex", flexDirection: "column", gap: "8px", animation: "fadeUp 0.5s ease both", animationDelay: "0.35s" }}>
          <Btn onClick={() => {
            // Learning signal: dislike when skipping (offline recipes)
            if (suggestion?._offline && suggestion?._foodIds) {
              recordDislike(suggestion, suggestion._foodIds, suggestion._templateId);
            }
            generate(mode === "fridge" ? "fridge" : "quick");
          }}>Anderer Vorschlag 🔄</Btn>
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
