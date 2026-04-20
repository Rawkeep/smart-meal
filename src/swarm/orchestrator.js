/**
 * Swarm Orchestrator
 *
 * Coordinates all 6 agents to produce a structured recipe suggestion.
 * Algorithm:
 * 1. Load foods from IndexedDB
 * 2. Safety-filter all foods
 * 3. Select a matching recipe template
 * 4. For each slot, score candidates with all soft agents
 * 5. Weighted selection from top candidates
 * 6. Assemble final suggestion object
 */

import { getAllFoods } from "../db";
import { AGENT_WEIGHTS } from "./types";
import { scoreIngredientSafety } from "./ingredient-agent";
import { scoreNutrition } from "./nutrition-agent";
import { scoreVariety } from "./variety-agent";
import { scoreSeason } from "./season-agent";
import { scoreCuisine } from "./cuisine-agent";
import { scorePairing } from "./combination-agent";
import { findMatchingTemplates } from "./recipe-templates";
import { estimateNutrition } from "./nutrition-data";
import { getIngredientPreference, getTemplatePreference, recordGeneration } from "./learning-engine";
import { NUTRIENT_DEFICIENCIES, HEALTH_GOALS } from "../data/health";

// Recently used template tracker (session-level)
const recentTemplateIds = [];
const MAX_TEMPLATE_MEMORY = 10;

/**
 * Weighted random selection from top candidates
 * @param {Array} scored - sorted by score descending
 * @param {number} topN - how many to consider
 * @returns {Object} selected item
 */
function weightedPick(scored, topN = 5) {
  const candidates = scored.slice(0, Math.min(topN, scored.length));
  if (candidates.length === 0) return null;
  if (candidates.length === 1) return candidates[0];

  const totalWeight = candidates.reduce((sum, c) => sum + c.score, 0);
  if (totalWeight <= 0) return candidates[0];

  let random = Math.random() * totalWeight;
  for (const c of candidates) {
    random -= c.score;
    if (random <= 0) return c;
  }
  return candidates[0];
}

/**
 * Score a food with all soft agents and compute composite
 */
function scoreFood(food, context, selectedFoods, templateCuisine) {
  const scores = {
    nutrition: scoreNutrition(food, context),
    variety: scoreVariety(food, context),
    season: scoreSeason(food, context),
    cuisine: scoreCuisine(food, context, templateCuisine),
    pairing: scorePairing(food, selectedFoods, context),
  };

  // Learning engine preference boost (7th scoring dimension)
  const learnedPref = getIngredientPreference(food.id);
  const learningBoost = (learnedPref - 0.5) * 0.3; // -0.15..+0.15

  const composite = Object.entries(AGENT_WEIGHTS).reduce(
    (sum, [key, weight]) => sum + (scores[key] || 0) * weight,
    0
  ) + learningBoost;

  return { ...food, score: composite, scores };
}

/**
 * Select a template matching the context
 */
function selectTemplate(context) {
  const matching = findMatchingTemplates(context);
  if (matching.length === 0) return null;

  // Penalize recently used templates
  const fresh = matching.filter((t) => !recentTemplateIds.includes(t.id));
  const pool = fresh.length > 0 ? fresh : matching;

  // Prefer templates matching user's preferred cuisines + learned preference
  const preferredCuisines = context.profile.cuisines || [];
  const scored = pool.map((t) => {
    let cuisineBonus = 0;
    for (const tc of t.cuisines) {
      if (preferredCuisines.includes(tc)) cuisineBonus = 0.3;
    }
    const templatePref = getTemplatePreference(t.id);
    const learnedBonus = (templatePref - 0.5) * 0.4; // -0.2..+0.2
    return { ...t, templateScore: 0.5 + cuisineBonus + learnedBonus + Math.random() * 0.3 };
  });

  scored.sort((a, b) => b.templateScore - a.templateScore);
  const selected = scored[0];

  // Track usage
  recentTemplateIds.push(selected.id);
  if (recentTemplateIds.length > MAX_TEMPLATE_MEMORY) {
    recentTemplateIds.shift();
  }

  return selected;
}

/**
 * Fill a single slot with the best-scored ingredient
 */
function fillSlot(slot, safeFoods, context, selectedFoods, templateCuisine, template) {
  // Filter to matching category
  let candidates = safeFoods.filter((f) => f.category === slot.category);

  // Explicit slot.preferred always wins — the template author knows the dish
  // and a typed list of IDs is more authoritative than a generic meal gate.
  if (slot.preferred?.length > 0) {
    const preferred = candidates.filter((f) => slot.preferred.includes(f.id));
    if (preferred.length > 0) {
      candidates = preferred;
    }
  } else {
    // Meal-type coherence gate (only runs when no explicit preferred list).
    // Prevents "160g Nudeln" showing up as the grain in a breakfast granola
    // bowl, or "Müsli" as the starch in a lunch pasta dish.
    if (template?.mealType === "frühstück" && slot.category === "getreide") {
      const breakfastGrains = candidates.filter((f) => f.tags?.includes("frühstück"));
      if (breakfastGrains.length > 0) candidates = breakfastGrains;
    }
    if ((template?.mealType === "mittag" || template?.mealType === "abend") && slot.category === "getreide") {
      const nonBreakfast = candidates.filter((f) => !f.tags?.includes("frühstück"));
      if (nonBreakfast.length > 0) candidates = nonBreakfast;
    }
    // Milch gate: "milch" category lumps drinkable dairy (milch, joghurt,
    // hafermilch) together with hard cheeses (parmesan, gouda). Breakfast
    // bowls must never grab Parmesan — filter to the "milch-frühstück"
    // subset for breakfast templates.
    if (template?.mealType === "frühstück" && slot.category === "milch") {
      const breakfastDairy = candidates.filter((f) => f.tags?.includes("milch-frühstück"));
      if (breakfastDairy.length > 0) candidates = breakfastDairy;
    }
    // Obst gate: citrus like Zitrone/Limette works as a sauce flavor but
    // reads absurd as "2 Stuck Zitrone" on a sweet breakfast bowl. Exclude
    // pure citrus IDs from breakfast obst unless explicitly preferred.
    if (template?.mealType === "frühstück" && slot.category === "obst") {
      const citrusIds = ["zitrone", "limette"];
      const nonCitrus = candidates.filter((f) => !citrusIds.includes(f.id));
      if (nonCitrus.length > 0) candidates = nonCitrus;
    }
  }

  // Handle fixed food
  if (slot.fixed) {
    const fixed = candidates.find((f) => f.id === slot.fixed);
    if (fixed) return [fixed];
  }

  if (candidates.length === 0) return [];

  // Score all candidates
  const scored = candidates
    .map((f) => scoreFood(f, context, selectedFoods, templateCuisine))
    .sort((a, b) => b.score - a.score);

  // Select min..max items
  const count = slot.min + Math.floor(Math.random() * (slot.max - slot.min + 1));
  const selected = [];

  for (let i = 0; i < count && scored.length > 0; i++) {
    const pick = weightedPick(scored);
    if (!pick) break;
    selected.push(pick);
    // Remove picked from candidates to avoid duplicates
    const idx = scored.indexOf(pick);
    if (idx > -1) scored.splice(idx, 1);
  }

  return selected;
}

/**
 * Fill template placeholders with ingredient names
 */
function fillTemplate(template, slotFills) {
  const roleToNames = {};

  for (const [role, foods] of Object.entries(slotFills)) {
    roleToNames[role] = foods.map((f) => f.name).join(" und ");
  }

  // Whether a step depends on a slot that never got filled — used to drop
  // orphan steps instead of leaving nonsense like "daruber streuen und ..."
  // when an optional {NUSS} slot was skipped.
  const hasUnfilledPlaceholder = (str) => {
    const matches = str.match(/\{([A-Z]+\d?)\}/g) || [];
    return matches.some((m) => {
      const role = m.slice(1, -1);
      return !roleToNames[role];
    });
  };

  const replace = (str) => {
    let result = str;
    for (const [role, names] of Object.entries(roleToNames)) {
      const placeholder = `{${role}}`;
      result = result.split(placeholder).join(names || "");
    }
    // Strip any remaining orphan placeholders
    result = result.replace(/\{[A-Z]+\d?\}/g, "").replace(/\s+/g, " ").trim();
    // Clean up leading/trailing commas and empty constructs
    result = result.replace(/,\s*,/g, ",").replace(/,\s*$/g, "").replace(/^\s*,/g, "");
    // Capitalize first letter so orphaned-placeholder steps don't start
    // with lowercase like "daruber streuen..."
    if (result.length > 0) result = result[0].toUpperCase() + result.slice(1);
    return result;
  };

  // Drop steps that reference placeholders which were never filled (e.g. an
  // optional {NUSS} slot that was skipped) — leaving them creates nonsense
  // sentences like "daruber streuen und mit Honig sussen." without subject.
  const schritte = template.stepsTemplate
    .filter((s) => !hasUnfilledPlaceholder(s))
    .map(replace)
    .filter((s) => s.length > 5);

  return {
    name: replace(template.name),
    beschreibung: replace(template.beschreibung),
    schritte,
  };
}

/**
 * Generate health hint based on profile
 */
function generateHealthHint(selectedFoods, context) {
  const hints = [];
  const { profile } = context;

  // Check deficiencies
  for (const defId of profile.deficiencies || []) {
    const nd = NUTRIENT_DEFICIENCIES.find((d) => d.id === defId);
    if (!nd) continue;
    const matching = selectedFoods.filter((f) =>
      nd.foods.some((nf) =>
        f.name.toLowerCase().includes(nf.toLowerCase()) ||
        nf.toLowerCase().includes(f.name.toLowerCase())
      )
    );
    if (matching.length > 0) {
      hints.push(`${nd.label}: ${nd.tips.split(".")[0]}.`);
    }
  }

  // Check goals
  for (const goalId of profile.goals || []) {
    const g = HEALTH_GOALS.find((h) => h.id === goalId);
    if (g) hints.push(g.tip);
  }

  return hints.length > 0 ? hints[0] : null;
}

/**
 * Generate wine/drink recommendation based on cuisine and meal
 */
function generateWineHint(template, selectedFoods) {
  // Breakfast never pairs with wine — pick context-appropriate morning drinks.
  if (template.mealType === "frühstück") {
    const sweet = template.tags?.includes("süß") || template.moods?.includes("süß");
    if (sweet) return "Kaffee, Kakao oder Orangensaft";
    return "Kaffee, Schwarztee oder frisch gepresster Saft";
  }
  if (template.mealType === "snack") return "Wasser, Tee oder ein Smoothie";

  const hasFish = selectedFoods.some((f) =>
    f.tags?.includes("fisch") || f.tags?.includes("pescetarisch")
  );
  const hasMeat = selectedFoods.some((f) => f.tags?.includes("fleisch"));
  const isAsian = template.cuisines.some((c) =>
    ["asiatisch", "japanisch", "koreanisch", "thai", "indisch"].includes(c)
  );
  const isItalian = template.cuisines.includes("italienisch");
  const isMediterran = template.cuisines.includes("mediterran");

  if (isAsian) return "Jasmin-Tee oder ein leichtes Bier";
  if (hasFish && (isItalian || isMediterran)) return "Pinot Grigio oder Vermentino";
  if (hasFish) return "Trockener Weisswein oder Riesling";
  if (hasMeat && isItalian) return "Chianti oder Primitivo";
  if (hasMeat) return "Spatburgunder oder ein kraftiger Rotwein";
  return "Mineralwasser mit Zitrone oder Krautertee";
}

/**
 * Handle fridge mode - restrict to user's ingredients
 */
function filterForFridgeMode(safeFoods, context) {
  if (!context.fridgeItems || context.fridgeItems.length === 0) return safeFoods;

  const fridgeNormalized = context.fridgeItems.map((i) => i.toLowerCase().trim());
  const pantry = ["zwiebel", "knoblauch", "olivenöl", "salz", "pfeffer", "butter"];

  return safeFoods.filter((f) => {
    const name = f.name.toLowerCase();
    const id = f.id.toLowerCase();
    return (
      fridgeNormalized.some((fi) => name.includes(fi) || fi.includes(name) || id.includes(fi)) ||
      pantry.some((p) => id.includes(p))
    );
  });
}

/**
 * Main orchestration function
 * @param {Object} context - generation context
 * @returns {Object} suggestion matching Claude API output shape
 */
export async function orchestrate(context) {
  // 1. Load all foods
  let allFoods = await getAllFoods();
  if (!allFoods || allFoods.length === 0) {
    throw new Error("Keine Lebensmittel in der Datenbank gefunden.");
  }

  // 2. Safety filter
  const safeFoods = allFoods.filter(
    (f) => scoreIngredientSafety(f, context) === 1
  );

  if (safeFoods.length < 3) {
    throw new Error(
      "Zu wenige sichere Zutaten gefunden. Uberprufe dein Allergie-Profil."
    );
  }

  // 3. Fridge mode filtering
  const availableFoods = context.fridgeItems?.length > 0
    ? filterForFridgeMode(safeFoods, context)
    : safeFoods;

  if (availableFoods.length < 2) {
    throw new Error(
      "Zu wenige passende Zutaten im Kuhlschrank. Fuge mehr hinzu."
    );
  }

  // 4. Select template
  const template = selectTemplate(context);
  if (!template) {
    throw new Error("Kein passendes Rezept-Template gefunden.");
  }

  const templateCuisine = template.cuisines[0] || null;

  // 5. Fill each slot
  const selectedFoods = [];
  const slotFills = {};

  for (const slot of template.slots) {
    if (slot.optional && Math.random() < 0.3) continue; // skip some optionals

    const fills = fillSlot(
      slot,
      availableFoods,
      context,
      selectedFoods,
      templateCuisine,
      template
    );

    if (fills.length === 0 && !slot.optional) {
      // Try with full safe foods if fridge mode was too restrictive
      const fallbackFills = fillSlot(
        slot,
        safeFoods,
        context,
        selectedFoods,
        templateCuisine,
        template
      );
      if (fallbackFills.length > 0) {
        selectedFoods.push(...fallbackFills);
        slotFills[slot.role] = fallbackFills;
        continue;
      }
    }

    if (fills.length > 0) {
      selectedFoods.push(...fills);
      slotFills[slot.role] = fills;
    }
  }

  if (selectedFoods.length < 2) {
    throw new Error(
      "Konnte nicht genug Zutaten fur dieses Rezept finden."
    );
  }

  // 6. Assemble the suggestion
  const filled = fillTemplate(template, slotFills);
  const allFoodIds = selectedFoods.map((f) => f.id);
  const nutrition = estimateNutrition(allFoodIds, context.persons || 2);

  // Build ingredient list with approximate quantities
  const zutaten = selectedFoods.map((f) => {
    const portion = getApproxPortion(f, context.persons || 2);
    return `${portion} ${f.name}`;
  });

  // Diet tags
  const tags = [];
  if (selectedFoods.every((f) => f.tags?.includes("vegan"))) tags.push("vegan");
  else if (selectedFoods.every((f) => !f.tags?.includes("fleisch"))) tags.push("vegetarisch");
  if (selectedFoods.some((f) => f.tags?.includes("lowcarb"))) tags.push("lowcarb");
  if (selectedFoods.some((f) => f.tags?.includes("keto"))) tags.push("keto");
  tags.push(...(template.tags || []).filter((t) => !tags.includes(t)));

  const healthHint = generateHealthHint(selectedFoods, context);
  const wineHint = generateWineHint(template, selectedFoods);

  const result = {
    name: filled.name,
    beschreibung: filled.beschreibung,
    zutaten,
    schritte: filled.schritte,
    zeit: template.zeit,
    kalorien: `ca. ${nutrition.kcal} kcal`,
    protein: `ca. ${nutrition.protein} g`,
    tipp: generateCookingTip(template, selectedFoods),
    emoji: template.emoji,
    schwierigkeit: template.schwierigkeit,
    tags,
    herkunft: template.herkunft,
    weinempfehlung: wineHint,
    gesundheitshinweis: healthHint,
    _offline: true,
    _templateId: template.id,
    _foodIds: allFoodIds,
  };

  // Record generation for learning engine
  recordGeneration(result, template.id, allFoodIds);

  return result;
}

/**
 * Get approximate portion string for a food
 */
function getApproxPortion(food, persons) {
  const portionMap = {
    protein: (p) => `${150 * p}g`,
    gemüse: (p) => `${200 * p}g`,
    getreide: (p) => `${80 * p}g`,
    milch: (p) => `${100 * p}ml`,
    hülsenfrüchte: (p) => `${100 * p}g`,
    nüsse: (p) => `${20 * p}g`,
    gewürze: () => "nach Geschmack",
    obst: (p) => `${p} Stuck`,
    sonstiges: () => "nach Bedarf",
  };
  const fn = portionMap[food.category] || (() => "nach Bedarf");
  return fn(persons);
}

/**
 * Generate a cooking tip
 */
function generateCookingTip(template, selectedFoods) {
  const tips = [
    "Alle Zutaten vor dem Kochen vorbereiten (Mise en Place) spart Zeit und Stress.",
    "Frische Krauter erst am Ende hinzufugen, damit sie ihr Aroma behalten.",
    "Die Pfanne richtig heiss werden lassen, bevor du das Protein hineingibst.",
    "Gemuse nicht zu lange garen - knackig ist gesunder und schmeckt besser.",
    "Ein Schuss Zitronensaft am Ende hebt alle Aromen.",
    "Salz schrittweise zugeben und immer wieder abschmecken.",
    "Olivenol nicht zu stark erhitzen - fur heisses Braten Sonnenblumenol nehmen.",
    "Reste eignen sich perfekt als Meal Prep fur den nachsten Tag.",
    "Frisch gemahlener Pfeffer macht geschmacklich einen grossen Unterschied.",
    "Das Gericht mit frischen Krautern oder Nussen garnieren fur den Wow-Effekt.",
  ];
  return tips[Math.floor(Math.random() * tips.length)];
}
