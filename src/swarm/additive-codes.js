/**
 * Deutsche Zusatzstoff-Kennzeichnung (nummeriert) — ZZulV / LMIV.
 *
 * In der deutschen Gastronomie werden ZUSATZSTOFFE mit ZAHLEN (1–13) und
 * ALLERGENE mit BUCHSTABEN (A–R, siehe allergen-codes.js) gekennzeichnet.
 * Dieses Modul ist das Zahlen-Gegenstück zu `allergen-codes.js`: es liefert die
 * nummerierte Legende plus eine konservative Ableitung der zutreffenden Nummern
 * aus den (verarbeiteten) Lebensmitteln eines Rezepts.
 *
 * Bewusst sparsam: Smart Meal kocht frisch. Frische Zutaten tragen KEINE
 * deklarationspflichtigen Zusatzstoffe — Nummern erscheinen nur bei typischen
 * verarbeiteten Produkten (Wurst, Schinken, Sojasauce, Essig …).
 */

// Nummerierte Zusatzstoff-Legende (Standard der deutschen Gastronomie).
export const ADDITIVE_NUMBER_LABELS = {
  1: "mit Farbstoff",
  2: "mit Konservierungsstoff",
  3: "mit Antioxidationsmittel",
  4: "mit Geschmacksverstärker",
  5: "geschwefelt",
  6: "geschwärzt",
  7: "gewachst",
  8: "mit Phosphat",
  9: "mit Süßungsmitteln",
  10: "enthält eine Phenylalaninquelle",
  11: "koffeinhaltig",
  12: "chininhaltig",
  13: "mit Taurin",
};

/**
 * Verarbeitete Lebensmittel → zutreffende Zusatzstoff-Nummern.
 * Schlüssel sind FOODS-IDs (siehe src/data/foods.js). Nur Produkte, die im
 * deutschen Handel praktisch immer deklarationspflichtige Zusatzstoffe tragen.
 */
const FOOD_ID_TO_NUMBERS = {
  wurst:    [2, 3, 8], // Brüh-/Kochwurst: Nitritpökelsalz, Antioxidation, Phosphat
  speck:    [2, 3],    // Pökelware
  schinken: [2, 8],    // Kochschinken: Pökelsalz + Phosphat
  sojasauce: [4],      // häufig Geschmacksverstärker
  miso:      [4],
  currypaste: [2],     // Konservierungsstoff in Pasten
  harissa:   [2],
  essig:     [5],      // Weinessig häufig geschwefelt
};

/**
 * Freitext-Heuristik für KI-/importierte Rezepte, deren Zutaten nicht aus der
 * FOODS-Datenbank stammen. Wortstamm (lowercase) → Nummern.
 */
const KEYWORD_TO_NUMBERS = [
  { match: ["wurst", "salami", "bratwurst", "wiener", "cabanossi", "chorizo"], numbers: [2, 3, 8] },
  { match: ["speck", "bacon", "schinken", "kassler", "pökel"], numbers: [2, 8] },
  { match: ["sojasauce", "sojasoße", "soy sauce", "miso", "maggi", "brühwürfel", "brühe (instant)", "fondor"], numbers: [4] },
  { match: ["essig", "weinessig", "balsamico"], numbers: [5] },
  { match: ["trockenfr", "rosinen", "aprikosen (getr", "sultaninen", "dörr"], numbers: [5] },
  // Spezifische Getränkenamen statt kurzer Stämme — "cola"/"mate" steckten sonst
  // in "Rucola"/"Tomate" und hätten Salat/Tomatengerichte als koffeinhaltig markiert.
  { match: ["coca-cola", "cola-getränk", "energydrink", "energy-drink", "club-mate", "mate-tee", "matetee", "guaraná", "guarana"], numbers: [11] },
  { match: ["tonic water", "tonicwater", "bitter lemon"], numbers: [12] },
  { match: ["light", "zero", "süßstoff", "diät"], numbers: [9] },
];

/**
 * Zusatzstoff-Nummern für ein einzelnes FOODS-Objekt.
 * @param {{ id?: string }} food
 * @returns {number[]}
 */
export function getFoodAdditiveNumbers(food) {
  if (!food?.id) return [];
  return FOOD_ID_TO_NUMBERS[food.id] || [];
}

/**
 * Zusatzstoff-Nummern aus einer Freitext-Zutatenzeile ableiten.
 * @param {string} text
 * @returns {number[]}
 */
export function getTextAdditiveNumbers(text) {
  if (!text) return [];
  const low = text.toLowerCase();
  const out = new Set();
  for (const { match, numbers } of KEYWORD_TO_NUMBERS) {
    if (match.some((m) => low.includes(m))) numbers.forEach((n) => out.add(n));
  }
  return [...out];
}

/**
 * Eindeutige, sortierte Zusatzstoff-Legende über eine Lebensmittelliste.
 * @param {Array<{ id?: string }>} foods
 * @returns {Array<{ number: number, label: string }>}
 */
export function summarizeAdditives(foods) {
  const all = new Set();
  for (const f of foods || []) {
    for (const n of getFoodAdditiveNumbers(f)) all.add(n);
  }
  return numbersToLegend(all);
}

/**
 * Zusatzstoff-Legende aus Freitext-Zutaten (KI-/Import-Rezepte).
 * @param {string[]} zutaten
 * @returns {Array<{ number: number, label: string }>}
 */
export function summarizeAdditivesFromText(zutaten) {
  const all = new Set();
  for (const line of zutaten || []) {
    for (const n of getTextAdditiveNumbers(line)) all.add(n);
  }
  return numbersToLegend(all);
}

function numbersToLegend(numberSet) {
  return [...numberSet]
    .sort((a, b) => a - b)
    .map((number) => ({ number, label: ADDITIVE_NUMBER_LABELS[number] || String(number) }));
}
