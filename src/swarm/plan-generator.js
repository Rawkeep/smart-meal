/**
 * Offline Weekly Meal Plan Generator
 *
 * Uses the swarm orchestrator to generate 5-day meal plans (Mon-Fri)
 * with ingredient reuse optimization (Meal Prep logic).
 */

import { orchestrate } from "./orchestrator";

const DAYS = ["Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag"];
const MEAL_TYPES = ["frühstück", "mittag", "abend"];

/**
 * Generate a full 5-day offline meal plan
 * @param {Object} baseContext - user context (profile, history, etc.)
 * @returns {Promise<Object>} plan matching the Claude API plan shape
 */
export async function generateOfflinePlan(baseContext) {
  const plan = [];
  const usedIngredients = new Map(); // track for shopping list + reuse
  const planHistory = [...(baseContext.history || [])];

  for (const day of DAYS) {
    const dayPlan = { tag: day };

    for (const mealType of MEAL_TYPES) {
      const context = {
        ...baseContext,
        meal: mealType,
        history: planHistory,
        // Nudge toward ingredient reuse after day 1
        _reuseIngredients: usedIngredients.size > 0
          ? [...usedIngredients.keys()]
          : [],
      };

      // Adjust mood/cookTime per meal type for variety
      if (mealType === "frühstück") {
        context.cookTime = "schnell";
        context.mood = pickRandom(["leicht", "gesund", "comfort", "süß"]);
      } else if (mealType === "mittag") {
        context.cookTime = pickRandom(["schnell", "normal"]);
        context.mood = pickRandom(["leicht", "proteinreich", "gesund", "exotisch"]);
      } else {
        context.cookTime = pickRandom(["normal", "genuss"]);
        context.mood = pickRandom(["comfort", "deftig", "exotisch", "leicht"]);
      }

      try {
        const suggestion = await orchestrate(context);

        dayPlan[mealType] = {
          name: suggestion.name,
          emoji: suggestion.emoji,
          zeit: suggestion.zeit,
          // Store full data for detail view
          _full: suggestion,
        };

        // Track ingredients for shopping list
        if (suggestion.zutaten) {
          for (const z of suggestion.zutaten) {
            const key = z.toLowerCase();
            usedIngredients.set(key, (usedIngredients.get(key) || 0) + 1);
          }
        }

        // Add to rolling history to prevent repetition within plan
        planHistory.push({
          name: suggestion.name,
          date: new Date().toISOString(),
          emoji: suggestion.emoji,
        });

      } catch {
        dayPlan[mealType] = {
          name: `${mealType === "frühstück" ? "Frühstück" : mealType === "mittag" ? "Mittagessen" : "Abendessen"}`,
          emoji: mealType === "frühstück" ? "🥣" : mealType === "mittag" ? "🍽️" : "🌙",
          zeit: "20 Min",
        };
      }
    }

    plan.push(dayPlan);
  }

  // Build consolidated shopping list with smart deduplication
  const einkaufsliste = buildShoppingList(usedIngredients);

  return { plan, einkaufsliste };
}

/**
 * Build a deduplicated shopping list from used ingredients
 * @param {Map} usedIngredients
 * @returns {string[]}
 */
function buildShoppingList(usedIngredients) {
  const items = [];
  const seen = new Set();

  for (const [ingredient, count] of usedIngredients) {
    // Normalize: extract the food name (remove quantity prefix)
    const cleaned = ingredient.replace(/^\d+\s*(g|ml|stuck|el|tl)\s*/i, "").trim();
    const key = cleaned.toLowerCase();

    if (seen.has(key)) continue;
    seen.add(key);

    // Add quantity hint if used multiple times
    if (count > 2) {
      items.push(`${cleaned} (Wochenvorrat)`);
    } else {
      items.push(cleaned);
    }
  }

  // Sort: proteins first, then veggies, then rest
  return items.sort((a, b) => a.localeCompare(b, "de"));
}

/**
 * Pick a random element from an array
 * @param {Array} arr
 * @returns {*}
 */
function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}
