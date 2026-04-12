/**
 * Ingredient Safety Agent
 *
 * Hard-filters foods based on allergies, histamine intolerance,
 * dietary restrictions, cross-allergies, and metabolism conditions.
 * Returns 0 (blocked) or 1 (safe).
 */

import { CROSS_ALLERGIES, METABOLISM_CONDITIONS } from "../data/health";

// Map cross-allergy trigger food names to food IDs
const FOOD_NAME_TO_ID = {
  apfel: "apfel", birne: "birne", kirsche: "kirsche", pfirsich: "pfirsich",
  pflaume: "pflaume", haselnuss: "haselnuss_food", walnuss: "walnuss_food",
  mandel: "mandel_food", erdnuss: "erdnuss_food", karotte: "karotte",
  sellerie: "sellerie", soja: "tofu", kiwi: "kiwi", tomate: "tomate",
  kartoffel: "kartoffel", fenchel: "fenchel", paprika: "paprika",
  knoblauch: "knoblauch", zwiebel: "zwiebel", mango: "mango",
  sonnenblumenkerne: "sonnenblumenkerne", gurke: "gurke", zucchini: "zucchini",
  kürbis: "kürbis", banane: "banane", avocado: "avocado", ananas: "ananas",
  garnelen: "garnelen", spinat: "spinat", senf: "senf_food",
};

// Build a lookup: foodId -> [{ crossAllergyId, severity }]
function buildCrossAllergyLookup(profileCrossAllergies) {
  const lookup = {};
  for (const caId of profileCrossAllergies) {
    const ca = CROSS_ALLERGIES.find((c) => c.id === caId);
    if (!ca) continue;
    for (const trigger of ca.triggers) {
      const foodName = trigger.food.toLowerCase();
      const foodId = FOOD_NAME_TO_ID[foodName];
      if (!foodId) continue;
      if (!lookup[foodId]) lookup[foodId] = [];
      lookup[foodId].push({ severity: trigger.severity });
    }
  }
  return lookup;
}

// Build avoid lookup from metabolism conditions
function buildMetabolismAvoidSet(profileMetabolism) {
  const avoidNames = new Set();
  for (const mId of profileMetabolism) {
    const mc = METABOLISM_CONDITIONS.find((c) => c.id === mId);
    if (!mc) continue;
    for (const item of mc.avoid) {
      avoidNames.add(item.toLowerCase());
    }
  }
  return avoidNames;
}

/**
 * Score ingredient safety (hard gate)
 * @param {Object} food - food object from IndexedDB
 * @param {Object} context - generation context
 * @returns {number} 0 (blocked) or 1 (safe)
 */
export function scoreIngredientSafety(food, context) {
  const { profile, guestMode, guestAllergies, guestHistamin, guestDiet } = context;

  // Combine user + guest allergies
  const allAllergies = [
    ...(profile.allergies || []),
    ...(profile.nutAllergies || []),
    ...(guestMode ? guestAllergies : []),
  ];

  // 1. Direct allergy check
  if (allAllergies.length > 0 && food.allergies?.length > 0) {
    if (food.allergies.some((a) => allAllergies.includes(a))) return 0;
  }

  // 2. Histamine check
  const hasHistamin = profile.histamin || (guestMode && guestHistamin);
  if (hasHistamin) {
    if (food.histamin === "high") return 0;
    if (food.histamin === "medium") return 0; // strict mode for safety
  }

  // 3. Diet restrictions
  const allDiets = [...(profile.diet || []), ...(guestMode ? guestDiet : [])];
  for (const diet of allDiets) {
    if (diet === "vegan" && !food.tags?.includes("vegan")) return 0;
    if (diet === "vegetarisch" && food.tags?.includes("fleisch")) return 0;
    if (diet === "pescetarisch" && food.tags?.includes("fleisch")) return 0;
    if (diet === "halal" && food.tags?.includes("fleisch") && !food.tags?.includes("halal")) return 0;
    if (diet === "keto" && !food.tags?.includes("keto") && !food.tags?.includes("lowcarb")) {
      // keto allows lowcarb and keto tagged items, plus proteins/fats
      if (!["protein", "milch", "nüsse", "gewürze"].includes(food.category)) return 0;
    }
    if (diet === "lowcarb" && !food.tags?.includes("lowcarb")) {
      if (["getreide", "hülsenfrüchte"].includes(food.category)) return 0;
    }
  }

  // 4. Cross-allergies (block high severity)
  const crossAllergies = profile.crossAllergies || [];
  if (crossAllergies.length > 0) {
    const caLookup = buildCrossAllergyLookup(crossAllergies);
    const triggers = caLookup[food.id];
    if (triggers) {
      const hasHigh = triggers.some((t) => t.severity === "high");
      if (hasHigh) return 0;
    }
  }

  // 5. Metabolism condition avoid lists
  const metabolism = profile.metabolism || [];
  if (metabolism.length > 0) {
    const avoidSet = buildMetabolismAvoidSet(metabolism);
    const foodName = food.name.toLowerCase();
    for (const avoid of avoidSet) {
      if (foodName.includes(avoid) || avoid.includes(foodName)) return 0;
    }
  }

  return 1;
}
