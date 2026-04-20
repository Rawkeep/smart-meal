/**
 * EU Allergen Code Mapping (LMIV / FIC Regulation 1169/2011).
 *
 * German gastro standard uses letter codes next to each ingredient on the
 * menu. This module maps the internal allergy IDs used on FOODS entries to
 * those EU codes plus human-readable labels.
 *
 * Crustaceans / molluscs are inferred from food.id because the base
 * `allergies` array just says "fisch" for the whole category.
 */

export const EU_ALLERGEN_LABELS = {
  A:  "Glutenhaltiges Getreide",
  B:  "Krebstiere",
  C:  "Eier",
  D:  "Fisch",
  E:  "Erdnüsse",
  F:  "Soja",
  G:  "Milch / Laktose",
  H:  "Schalenfrüchte (Nüsse)",
  H1: "Mandeln",
  H2: "Haselnüsse",
  H3: "Walnüsse",
  H4: "Cashewnüsse",
  H5: "Pistazien",
  H6: "Macadamia",
  H7: "Pekannüsse",
  H8: "Paranüsse",
  L:  "Sellerie",
  M:  "Senf",
  N:  "Sesamsamen",
  O:  "Schwefeldioxid / Sulfite",
  P:  "Lupinen",
  R:  "Weichtiere",
};

// Mapping from internal allergy IDs (used on FOODS entries) to EU codes.
const ALLERGY_ID_TO_CODE = {
  gluten:    "A",
  ei:        "C",
  fisch:     "D",   // fine-tuned per food.id below for B/R
  erdnuss:   "E",
  soja:      "F",
  laktose:   "G",
  mandel:    "H1",
  haselnuss: "H2",
  walnuss:   "H3",
  cashew:    "H4",
  pistazie:  "H5",
  macadamia: "H6",
  pekan:     "H7",
  paranuss:  "H8",
  sellerie:  "L",
  senf:      "M",
  sesam:     "N",
  sulfite:   "O",
};

// Crustaceans / molluscs — override the "fisch" default for these IDs.
const CRUSTACEAN_IDS = new Set(["garnelen", "krebs", "hummer", "scampi"]);
const MOLLUSC_IDS = new Set(["miesmuschel", "tintenfisch", "oktopus", "calamari", "auster", "jakobsmuschel"]);

/**
 * Return sorted unique allergen codes for a single food.
 * @param {Object} food - food entry from FOODS array
 * @returns {string[]}
 */
export function getFoodAllergenCodes(food) {
  const codes = new Set();
  if (!food?.allergies) return [];

  for (const id of food.allergies) {
    if (id === "fisch") {
      if (CRUSTACEAN_IDS.has(food.id)) codes.add("B");
      else if (MOLLUSC_IDS.has(food.id)) codes.add("R");
      else codes.add("D");
      continue;
    }
    const code = ALLERGY_ID_TO_CODE[id];
    if (code) codes.add(code);
  }

  return [...codes].sort();
}

/**
 * Aggregate unique allergen codes across a list of selected foods.
 * @param {Array<Object>} foods
 * @returns {Array<{ code: string, label: string }>}
 */
export function summarizeAllergens(foods) {
  const all = new Set();
  for (const f of foods) {
    for (const c of getFoodAllergenCodes(f)) all.add(c);
  }
  return [...all].sort().map((code) => ({
    code,
    label: EU_ALLERGEN_LABELS[code] || code,
  }));
}
