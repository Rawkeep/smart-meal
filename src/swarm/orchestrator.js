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
import { getFoodAllergenCodes, summarizeAllergens } from "./allergen-codes";
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
    // Protein gate: a breakfast toast should not pull Hähnchenbrust or Lamm.
    // Prefer proteins tagged "protein-frühstück" (ei, wurst, speck, tofu,
    // räucherlachs, schinken, frischkäse) for breakfast templates.
    if (template?.mealType === "frühstück" && slot.category === "protein") {
      const breakfastProteins = candidates.filter((f) => f.tags?.includes("protein-frühstück"));
      if (breakfastProteins.length > 0) candidates = breakfastProteins;
    }

    // Cuisine coherence: a Ramen or Pad Thai must never pick Kohlrabi,
    // Rosenkohl or Rote Bete as its vegetable. Exclude central-European
    // winter vegetables from clearly Asian templates unless explicitly
    // preferred.
    const asianCuisines = ["asiatisch", "japanisch", "koreanisch", "thai", "indisch"];
    if (slot.category === "gemüse" && template?.cuisines?.some((c) => asianCuisines.includes(c))) {
      const nonEuropean = ["kohlrabi", "rosenkohl", "rote_bete", "grünkohl", "sellerie", "mangold", "pastinake", "topinambur", "rhabarber", "spargel"];
      const filtered = candidates.filter((f) => !nonEuropean.includes(f.id));
      if (filtered.length > 0) candidates = filtered;
    }
    // Same idea for Mexican/West-African where those veggies never feature.
    if (slot.category === "gemüse" && template?.cuisines?.some((c) => ["mexikanisch", "westafrikanisch", "karibisch"].includes(c))) {
      const nonEuropean = ["kohlrabi", "rosenkohl", "rote_bete", "grünkohl", "sellerie", "mangold", "pastinake", "rhabarber", "spargel"];
      const filtered = candidates.filter((f) => !nonEuropean.includes(f.id));
      if (filtered.length > 0) candidates = filtered;
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

  // Natural German list joining: "A", "A und B", "A, B und C" — instead of
  // the clumsy "A und B und C und D" from a naive join.
  const joinNames = (names) => {
    if (names.length === 0) return "";
    if (names.length === 1) return names[0];
    if (names.length === 2) return `${names[0]} und ${names[1]}`;
    return `${names.slice(0, -1).join(", ")} und ${names[names.length - 1]}`;
  };

  for (const [role, foods] of Object.entries(slotFills)) {
    roleToNames[role] = joinNames(foods.map((f) => f.name));
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
  const persons = context.persons || 2;

  // Build ingredient list with approximate quantities and keep the exact
  // gram figure so the nutrition calc matches the plate (no more 100 g
  // reference values when the recipe actually uses 300 g).
  // EU LMIV allergen codes are appended to each line so the user sees
  // A/C/D/G/H1/... style flags just like on a German restaurant menu.
  const zutaten = [];
  const zutatenDetail = [];
  const portionRecords = [];
  for (const f of selectedFoods) {
    const { label, grams } = getApproxPortion(f, persons);
    const codes = getFoodAllergenCodes(f);
    const suffix = codes.length > 0 ? ` (${codes.join(",")})` : "";
    zutaten.push(`${label} ${f.name}${suffix}`);
    zutatenDetail.push({ name: f.name, portion: label, allergens: codes });
    portionRecords.push({ id: f.id, grams });
  }

  const allergenLegend = summarizeAllergens(selectedFoods);

  const nutrition = estimateNutrition(portionRecords, persons);
  const allFoodIds = selectedFoods.map((f) => f.id);

  // Diet tags
  const tags = [];
  if (selectedFoods.every((f) => f.tags?.includes("vegan"))) tags.push("vegan");
  else if (selectedFoods.every((f) => !f.tags?.includes("fleisch"))) tags.push("vegetarisch");
  if (selectedFoods.some((f) => f.tags?.includes("lowcarb"))) tags.push("lowcarb");
  if (selectedFoods.some((f) => f.tags?.includes("keto"))) tags.push("keto");
  tags.push(...(template.tags || []).filter((t) => !tags.includes(t)));

  // Health warnings surfaced directly on the card so the user sees them.
  const warnings = buildHealthWarnings(template, selectedFoods, nutrition);

  const healthHint = generateHealthHint(selectedFoods, context);
  const wineHint = generateWineHint(template, selectedFoods);

  const result = {
    name: filled.name,
    beschreibung: filled.beschreibung,
    zutaten,
    schritte: filled.schritte,
    zeit: template.zeit,
    kalorien: `ca. ${nutrition.kcalPerPerson} kcal / Person`,
    protein: `ca. ${nutrition.proteinPerPerson} g / Person`,
    makros: {
      kcal: nutrition.kcalPerPerson,
      protein: nutrition.proteinPerPerson,
      fat: nutrition.fatPerPerson,
      satFat: Math.round((nutrition.satFat / persons) * 10) / 10,
      carbs: nutrition.carbsPerPerson,
      sugar: Math.round((nutrition.sugar / persons) * 10) / 10,
      fiber: nutrition.fiberPerPerson,
      salt: nutrition.saltPerPerson,
      coverage: nutrition.coverage,
    },
    allergene: allergenLegend,
    zutatenDetail,
    tipp: generateCookingTip(template, selectedFoods),
    emoji: template.emoji,
    schwierigkeit: template.schwierigkeit,
    tags,
    herkunft: template.herkunft,
    weinempfehlung: wineHint,
    gesundheitshinweis: healthHint,
    warnungen: warnings,
    _offline: true,
    _templateId: template.id,
    _foodIds: allFoodIds,
  };

  // Record generation for learning engine
  recordGeneration(result, template.id, allFoodIds);

  return result;
}

/**
 * Per-food portion overrides. Each entry returns BOTH the display label
 * shown in the ingredient list AND the actual grams consumed so the
 * nutrition engine sees the same quantity the reader sees.
 *
 * Values tuned to realistic single-portion chef standards (Ei: 2/Person
 * for breakfast-size scramble, Hähnchen: 150g/Person raw, Parmesan: 15g
 * grated per plate, Olivenöl: 1 EL = 10g total for searing).
 */
const PORTION_OVERRIDES = {
  // Proteins in slices/pieces
  wurst:         (p) => ({ label: `${2 * p} Scheiben`, grams: 60 * p }),
  schinken:      (p) => ({ label: `${2 * p} Scheiben`, grams: 30 * p }),
  speck:         (p) => ({ label: `${2 * p} Scheiben`, grams: 20 * p }),
  räucherlachs:  (p) => ({ label: `${60 * p} g`,       grams: 60 * p }),
  ei:            (p) => ({ label: `${3 * p} Stück`,    grams: 60 * p * 3 / p }), // 3 eggs/person, ~60g each
  frischkäse_p:  (p) => ({ label: `${30 * p} g`,       grams: 30 * p }),
  halloumi:      (p) => ({ label: `${80 * p} g`,       grams: 80 * p }),
  // Hard cheeses (milch cat) sold grated, not drunk
  parmesan:      (p) => ({ label: `${15 * p} g (gerieben)`, grams: 15 * p }),
  feta:          (p) => ({ label: `${50 * p} g`,       grams: 50 * p }),
  mozzarella:    (p) => ({ label: `${60 * p} g`,       grams: 60 * p }),
  gouda:         (p) => ({ label: `${30 * p} g (gerieben)`, grams: 30 * p }),
  cheddar:       (p) => ({ label: `${30 * p} g (gerieben)`, grams: 30 * p }),
  frischkäse:    (p) => ({ label: `${30 * p} g`,       grams: 30 * p }),
  ricotta:       (p) => ({ label: `${60 * p} g`,       grams: 60 * p }),
  butter:        (p) => ({ label: `1 EL`,              grams: 15 }),
  sahne:         (p) => ({ label: `${50 * p} ml`,      grams: 50 * p }),
  // Breakfast grains — single-portion realism
  haferflocken:  (p) => ({ label: `${50 * p} g`,       grams: 50 * p }),
  müsli:         (p) => ({ label: `${50 * p} g`,       grams: 50 * p }),
  granola:       (p) => ({ label: `${40 * p} g`,       grams: 40 * p }),
  brot:          (p) => ({ label: `${2 * p} Scheiben`, grams: 50 * p }),
  vollkornbrot:  (p) => ({ label: `${2 * p} Scheiben`, grams: 50 * p }),
  roggenbrot:    (p) => ({ label: `${2 * p} Scheiben`, grams: 50 * p }),
  tortilla:      (p) => ({ label: `${p} Stück`,        grams: 60 * p }),
  nori:          (p) => ({ label: `${p} Blätter`,      grams: 3 * p }),
  // Fruit & veg sold by piece
  avocado:       (p) => ({ label: `${Math.max(1, Math.ceil(p / 2))} Stück`, grams: 80 * Math.max(1, Math.ceil(p / 2)) }),
  banane:        (p) => ({ label: `${p} Stück`,        grams: 120 * p }),
  zitrone:       (p) => ({ label: `1/2 Stück`,         grams: 30 }),
  limette:       (p) => ({ label: `1/2 Stück`,         grams: 20 }),
  ingwer_food:   (p) => ({ label: `ein Stück (~2 cm)`, grams: 10 }),
  knoblauch:     (p) => ({ label: `${p} Zehen`,        grams: 3 * p }),
  zwiebel:       (p) => ({ label: `${Math.ceil(p / 2)} Stück`, grams: 80 * Math.ceil(p / 2) }),
  frühlingszwiebel:(p)=> ({ label: `${p} Stück`,       grams: 20 * p }),
  rhabarber:     (p) => ({ label: `${150 * p} g (1-2 Stangen)`, grams: 150 * p }),
  // Rich oils priced per tablespoon
  olivenöl:      () => ({ label: `1-2 EL`,             grams: 15 }),
  sesamöl:       () => ({ label: `1 TL`,               grams: 5 }),
};

/**
 * @param {Object} food
 * @param {number} persons
 * @returns {{ label: string, grams: number }} — label is for the UI,
 * grams feeds the nutrition engine.
 */
function getApproxPortion(food, persons) {
  if (PORTION_OVERRIDES[food.id]) {
    return PORTION_OVERRIDES[food.id](persons);
  }
  // Category defaults kept conservative and realistic for one meal.
  const categoryMap = {
    protein:       (p) => ({ label: `${150 * p} g`,   grams: 150 * p }),
    gemüse:        (p) => ({ label: `${200 * p} g`,   grams: 200 * p }),
    getreide:      (p) => ({ label: `${60 * p} g (roh)`, grams: 60 * p }),
    milch:         (p) => ({ label: `${150 * p} ml`,  grams: 150 * p }),
    hülsenfrüchte: (p) => ({ label: `${100 * p} g`,   grams: 100 * p }),
    nüsse:         (p) => ({ label: `${20 * p} g`,    grams: 20 * p }),
    gewürze:       () => ({ label: `nach Geschmack`,  grams: 5 }),
    obst:          (p) => ({ label: `${p} Stück`,     grams: 120 * p }),
    sonstiges:     () => ({ label: `nach Bedarf`,     grams: 10 }),
  };
  const fn = categoryMap[food.category] || (() => ({ label: "nach Bedarf", grams: 10 }));
  return fn(persons);
}

/**
 * Surface medical/health warnings the dish should carry. Kept terse so
 * they render inline on the card.
 *
 * - Processed meat (WHO Gruppe 1 carcinogen): advise moderation.
 * - Multiple high-GI starches together: flag for diabetics.
 * - High salt (>2.5 g/Person): surface a warning.
 * - Large saturated fat dose (>15 g/Person): flag for heart health.
 */
function buildHealthWarnings(template, selectedFoods, nutrition) {
  const warnings = [];
  const ids = selectedFoods.map((f) => f.id);

  const processedMeats = ["wurst", "speck", "schinken", "räucherlachs"];
  const hasProcessedMeat = ids.some((id) => processedMeats.includes(id));
  if (hasProcessedMeat) {
    warnings.push({
      level: "info",
      text: "Verarbeitetes Fleisch (WHO Gruppe 1) — maximal 1-2×/Woche empfohlen.",
    });
  }

  const highGI = ["reis", "nudeln", "kartoffel", "brot", "vollkornbrot", "roggenbrot", "couscous", "kartoffelpüree", "tortilla"];
  const giCount = ids.filter((id) => highGI.includes(id)).length;
  if (giCount >= 2) {
    warnings.push({
      level: "info",
      text: "Mehrere stärkehaltige Komponenten — für Diabetiker ggf. Portion reduzieren.",
    });
  }

  if ((nutrition.saltPerPerson ?? 0) > 2.5) {
    warnings.push({
      level: "info",
      text: `Salzgehalt hoch (${nutrition.saltPerPerson} g/Person) — Richtwert WHO: < 5 g/Tag gesamt.`,
    });
  }

  const satFatPerPerson = nutrition.satFat / Math.max(1, (selectedFoods.length > 0 ? (nutrition.kcal / (nutrition.kcalPerPerson || nutrition.kcal)) : 2));
  if ((nutrition.satFat ?? 0) / Math.max(1, (nutrition.kcal / (nutrition.kcalPerPerson || 1))) > 10) {
    warnings.push({
      level: "info",
      text: "Reich an gesättigten Fetten — bei Herz-Risiko seltener einplanen.",
    });
  }

  if (ids.includes("rhabarber")) {
    warnings.push({
      level: "note",
      text: "Rhabarber immer dünsten oder kochen — roh enthält er Oxalsäure.",
    });
  }

  return warnings;
}

/**
 * Generate a context-aware cooking tip. Pool is scoped by meal type and
 * by what's actually on the plate, so breakfast porridges no longer get
 * "Die Pfanne richtig heiss werden lassen" and sweet dishes no longer
 * get salt-tasting advice.
 */
function generateCookingTip(template, selectedFoods) {
  const mealType = template?.mealType;
  const hasFish = selectedFoods.some((f) => f.tags?.includes("fisch"));
  const hasMeat = selectedFoods.some((f) => f.tags?.includes("fleisch"));
  const hasFresh = selectedFoods.some((f) => f.category === "gemüse");
  const hasNuts = selectedFoods.some((f) => f.category === "nüsse");
  const isSweet = template?.moods?.includes("süß") || template?.tags?.includes("süß");
  const isBowl = template?.emoji === "🥣" || template?.emoji === "🍚" || template?.tags?.includes("bowl");

  const pool = [];

  if (mealType === "frühstück") {
    pool.push(
      "Am Vorabend vorbereiten spart morgens 10 Min Zeit.",
      "Warme Haferflocken mit einer Prise Zimt bekommen Tiefe.",
      "Toast goldbraun — lieber ein Auge zu viel auf dem Toaster als ein verkohltes Frühstück.",
    );
    if (isSweet) pool.push("Ahornsirup oder Honig erst am Schluss drauf, nicht mitkochen.");
    if (hasNuts) pool.push("Nüsse kurz in der trockenen Pfanne rösten — das hebt das Aroma spürbar.");
    if (isBowl) pool.push("Toppings immer erst kurz vor dem Servieren — so bleibt alles knackig.");
  } else if (mealType === "snack") {
    pool.push(
      "Kleine Portionen — lieber oft nachlegen als einmal zu viel.",
      "Snacks lassen sich gut im Voraus portionieren, perfekt fürs Büro.",
    );
  } else {
    pool.push(
      "Alle Zutaten vor dem Kochen vorbereiten (Mise en Place) spart Zeit und Nerven.",
      "Salz schrittweise zugeben und immer wieder abschmecken.",
      "Frisch gemahlener Pfeffer macht geschmacklich einen großen Unterschied.",
    );
    if (hasFresh) pool.push("Gemüse nicht zu lange garen — knackig ist gesünder und schmeckt besser.");
    if (hasMeat) pool.push("Die Pfanne richtig heiß werden lassen, bevor das Fleisch hineinkommt.");
    if (hasFish) pool.push("Fisch nur kurz braten — lieber zu kurz als zu lang, er gart nach.");
    if (hasNuts) pool.push("Nüsse am Ende drüber — so bleiben sie knackig und rösten nicht durch.");
    pool.push("Frische Kräuter erst am Ende einrühren, damit sie ihr Aroma behalten.");
  }

  return pool[Math.floor(Math.random() * pool.length)];
}
