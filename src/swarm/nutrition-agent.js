/**
 * Nutrition Agent
 *
 * Scores foods based on nutrient deficiencies and health goals.
 * Returns 0..1 (0 = not helpful, 1 = excellent match).
 */

import { NUTRIENT_DEFICIENCIES, HEALTH_GOALS } from "../data/health";

// Map food IDs to keywords for fuzzy matching against deficiency food lists
function matchesFoodList(food, foodNames) {
  const name = food.name.toLowerCase();
  const id = food.id.toLowerCase();

  return foodNames.some((fn) => {
    const lower = fn.toLowerCase();
    return (
      name.includes(lower) ||
      lower.includes(name) ||
      id.includes(lower.replace(/\s+/g, "_")) ||
      lower.includes(id)
    );
  });
}

// Goal-based scoring rules
const GOAL_SCORERS = {
  abnehmen: (food) => {
    // Prefer low-cal, high-protein, high-fiber
    if (["gemüse", "hülsenfrüchte"].includes(food.category)) return 0.9;
    if (food.category === "protein" && food.tags?.includes("lowcarb")) return 0.8;
    if (food.category === "obst") return 0.6;
    if (["getreide", "nüsse"].includes(food.category)) return 0.3;
    if (food.category === "sonstiges") return 0.2;
    return 0.5;
  },
  zunehmen: (food) => {
    if (["nüsse", "getreide"].includes(food.category)) return 0.9;
    if (food.category === "protein") return 0.8;
    if (food.category === "milch") return 0.7;
    return 0.5;
  },
  muskelaufbau: (food) => {
    if (food.category === "protein") return 0.95;
    if (food.category === "hülsenfrüchte") return 0.8;
    if (food.tags?.includes("keto") || food.tags?.includes("lowcarb")) return 0.7;
    if (food.category === "milch") return 0.7;
    if (food.category === "nüsse") return 0.6;
    return 0.4;
  },
  energie: (food) => {
    if (["getreide", "hülsenfrüchte", "nüsse"].includes(food.category)) return 0.8;
    if (food.category === "obst") return 0.7;
    return 0.5;
  },
  darmgesundheit: (food) => {
    if (food.category === "hülsenfrüchte") return 0.9;
    if (food.category === "gemüse") return 0.8;
    if (food.category === "getreide") return 0.7;
    return 0.4;
  },
  entzündung: (food) => {
    // Anti-inflammatory: fish, berries, greens, nuts
    if (["lachs", "forelle", "kabeljau"].includes(food.id)) return 0.95;
    if (["heidelbeere", "himbeere"].includes(food.id)) return 0.9;
    if (food.category === "gemüse") return 0.7;
    if (food.category === "nüsse") return 0.7;
    return 0.4;
  },
  haut: (food) => {
    if (["lachs", "forelle"].includes(food.id)) return 0.9;
    if (food.category === "nüsse") return 0.8;
    if (["karotte", "süßkartoffel", "paprika"].includes(food.id)) return 0.85;
    return 0.5;
  },
  schlaf: (food) => {
    if (["banane", "kirsche", "mandel_food", "walnuss_food"].includes(food.id)) return 0.9;
    if (food.category === "milch") return 0.7;
    return 0.5;
  },
  immunsystem: (food) => {
    if (["paprika", "brokkoli", "spinat", "orange", "kiwi"].includes(food.id)) return 0.9;
    if (food.category === "gemüse") return 0.7;
    if (food.category === "obst") return 0.7;
    return 0.4;
  },
  konzentration: (food) => {
    if (["lachs", "walnuss_food", "heidelbeere"].includes(food.id)) return 0.9;
    if (food.category === "nüsse") return 0.7;
    if (food.category === "protein") return 0.6;
    return 0.4;
  },
  schwangerschaft: (food) => {
    if (["spinat", "brokkoli", "linsen", "kichererbsen"].includes(food.id)) return 0.9;
    if (food.category === "gemüse") return 0.7;
    if (["lachs", "ei"].includes(food.id)) return 0.8;
    return 0.5;
  },
  cholesterin: (food) => {
    if (food.category === "hülsenfrüchte") return 0.9;
    if (["haferflocken"].includes(food.id)) return 0.9;
    if (food.category === "gemüse") return 0.7;
    if (["lachs", "forelle"].includes(food.id)) return 0.8;
    return 0.4;
  },
};

/**
 * Score nutrition relevance for a food
 * @param {Object} food
 * @param {Object} context
 * @returns {number} 0..1
 */
export function scoreNutrition(food, context) {
  const { profile } = context;
  const scores = [];

  // Deficiency matching
  const deficiencies = profile.deficiencies || [];
  for (const defId of deficiencies) {
    const nd = NUTRIENT_DEFICIENCIES.find((d) => d.id === defId);
    if (!nd) continue;
    if (matchesFoodList(food, nd.foods)) {
      scores.push(0.9);
    }
  }

  // Goal matching
  const goals = profile.goals || [];
  for (const goalId of goals) {
    const scorer = GOAL_SCORERS[goalId];
    if (scorer) scores.push(scorer(food));
  }

  // No deficiencies or goals: return neutral
  if (scores.length === 0) return 0.5;

  // Return average
  return scores.reduce((a, b) => a + b, 0) / scores.length;
}
