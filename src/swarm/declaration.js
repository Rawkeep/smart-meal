/**
 * Lebensmittel-Kennzeichnung („Deklaration") für ein Rezept.
 *
 * Bündelt die drei Pflicht-/Orientierungsangaben, die Smart Meal pro Gericht
 * ausweist, in EINER Quelle — für Offline-Rezepte (aus FOODS-Objekten) wie für
 * KI-/importierte Rezepte (aus Freitext-Zutaten):
 *   - allergene:   EU-LMIV Buchstabencodes (A–R)      → allergen-codes.js
 *   - zusatzstoffe: deutsche Zahlen-Kennzeichnung (1–13) → additive-codes.js
 *   - alkohol:     { enthalten, label, hinweis }
 *
 * @typedef {{ code: string, label: string }} AllergenEntry
 * @typedef {{ number: number, label: string }} AdditiveEntry
 * @typedef {{ enthalten: boolean, label: string, hinweis?: string }} AlcoholInfo
 * @typedef {{ allergene: AllergenEntry[], zusatzstoffe: AdditiveEntry[], alkohol: AlcoholInfo }} Declaration
 */
import { FOODS } from "../data/foods.js";
import {
  getFoodAllergenCodes,
  summarizeAllergens,
  EU_ALLERGEN_LABELS,
} from "./allergen-codes.js";
import {
  getFoodAdditiveNumbers,
  getTextAdditiveNumbers,
  summarizeAdditives,
  summarizeAdditivesFromText,
} from "./additive-codes.js";

// Alkoholhaltige Zutaten (Wortstämme, lowercase). Wein als reine
// Getränkeempfehlung zählt NICHT — nur Alkohol IM Gericht.
const ALCOHOL_KEYWORDS = [
  "weißwein", "rotwein", "rosé", "wein ", "kochwein", "sekt", "champagner",
  "bier", "stout", "ale", "rum", "cognac", "weinbrand", "brandy", "sherry",
  "portwein", "marsala", "madeira", "wodka", "vodka", "whisky", "whiskey",
  "likör", "amaretto", "baileys", "grappa", "calvados", "schnaps", "obstler",
  "mirin", "sake", "reiswein", "kirschwasser", "cointreau", "pernod",
];

const ALCOHOL_FREE = Object.freeze({
  enthalten: false,
  label: "0,0 % vol · alkoholfrei",
});

/**
 * Alkoholgehalt aus Zutaten- und Schritttexten ableiten.
 * @param {string[]} zutaten
 * @param {string[]} schritte
 * @returns {AlcoholInfo}
 */
export function detectAlcohol(zutaten = [], schritte = []) {
  const haystack = [...zutaten, ...schritte].join(" \n ").toLowerCase();
  const hit = ALCOHOL_KEYWORDS.find((k) => haystack.includes(k));
  if (!hit) return ALCOHOL_FREE;

  // Kochalkohol verdampft beim Erhitzen nur teilweise — ehrlich kennzeichnen,
  // statt einen exakten %-Wert zu erfinden.
  const cooked = /(köche|kochen|schmor|reduzier|einkoch|ablösch|flambier|simmer|köchel)/.test(
    haystack
  );
  return {
    enthalten: true,
    label: cooked ? "enthält Alkohol (Restanteil nach dem Kochen)" : "enthält Alkohol",
    hinweis:
      "Mit Alkohol zubereitet – nicht für Kinder, Schwangere, in der Stillzeit oder bei Alkoholverzicht geeignet.",
  };
}

/**
 * Vollständige Deklaration aus FOODS-Objekten (Offline-Pfad).
 * @param {Array<object>} foods
 * @param {{ zutaten?: string[], schritte?: string[] }} [recipe]
 * @returns {Declaration}
 */
export function buildDeclarationFromFoods(foods = [], recipe = {}) {
  return {
    allergene: summarizeAllergens(foods),
    zusatzstoffe: summarizeAdditives(foods),
    alkohol: detectAlcohol(recipe.zutaten, recipe.schritte),
  };
}

// Längere Lebensmittelnamen zuerst → "schwarze bohnen" matcht vor "bohnen".
const FOODS_BY_NAME_LEN = [...FOODS].sort(
  (a, b) => (b.name?.length || 0) - (a.name?.length || 0)
);

/**
 * Eine Freitext-Zutatenzeile auf ein FOODS-Objekt abbilden (Namens-Substring).
 * @param {string} line
 * @returns {object | null}
 */
function matchFood(line) {
  const low = line.toLowerCase();
  return FOODS_BY_NAME_LEN.find((f) => f.name && low.includes(f.name.toLowerCase())) || null;
}

/**
 * Vollständige Deklaration aus Freitext-Zutaten (KI-/Import-Pfad).
 * Kombiniert FOODS-Treffer (Allergene + Zusatzstoffe) mit Stichwort-Heuristik.
 * @param {string[]} zutaten
 * @param {string[]} [schritte]
 * @returns {Declaration}
 */
export function buildDeclarationFromText(zutaten = [], schritte = []) {
  const allergenCodes = new Set();
  const additiveNumbers = new Set();

  for (const line of zutaten) {
    const food = matchFood(line);
    if (food) {
      getFoodAllergenCodes(food).forEach((c) => allergenCodes.add(c));
      getFoodAdditiveNumbers(food).forEach((n) => additiveNumbers.add(n));
    }
    getTextAdditiveNumbers(line).forEach((n) => additiveNumbers.add(n));
  }

  const allergene = [...allergenCodes].sort().map((code) => ({
    code,
    label: EU_ALLERGEN_LABELS[code] || code,
  }));
  const textAdditives = summarizeAdditivesFromText(zutaten);
  textAdditives.forEach((a) => additiveNumbers.add(a.number));

  return {
    allergene,
    zusatzstoffe: [...additiveNumbers].sort((a, b) => a - b).map((number) => ({
      number,
      label: textAdditives.find((t) => t.number === number)?.label || numberLabel(number),
    })),
    alkohol: detectAlcohol(zutaten, schritte),
  };
}

function numberLabel(number) {
  // Lazy import-free Lookup: dieselbe Tabelle wie additive-codes.
  const labels = {
    1: "mit Farbstoff", 2: "mit Konservierungsstoff", 3: "mit Antioxidationsmittel",
    4: "mit Geschmacksverstärker", 5: "geschwefelt", 6: "geschwärzt", 7: "gewachst",
    8: "mit Phosphat", 9: "mit Süßungsmitteln", 10: "enthält eine Phenylalaninquelle",
    11: "koffeinhaltig", 12: "chininhaltig", 13: "mit Taurin",
  };
  return labels[number] || String(number);
}

/**
 * Pro Zutatenzeile die Orientierungs-Codes (Allergen-Buchstaben +
 * Zusatzstoff-Zahlen) ermitteln — für die Hochzahlen direkt an der Zutat.
 * @param {string} line
 * @returns {{ allergens: string[], additives: number[] }}
 */
export function lineDeclarationCodes(line) {
  const food = matchFood(line);
  const allergens = food ? getFoodAllergenCodes(food) : [];
  const additives = new Set(food ? getFoodAdditiveNumbers(food) : []);
  getTextAdditiveNumbers(line).forEach((n) => additives.add(n));
  return { allergens, additives: [...additives].sort((a, b) => a - b) };
}
