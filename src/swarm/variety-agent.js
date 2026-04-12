/**
 * Variety Agent
 *
 * Penalizes recently used ingredients/meals to ensure diversity.
 * Adds controlled randomness for surprise factor.
 */

/**
 * Score variety for a food item
 * @param {Object} food
 * @param {Object} context - must include context.history
 * @returns {number} 0..1
 */
export function scoreVariety(food, context) {
  const { history } = context;
  if (!history || history.length === 0) return 0.8 + jitter();

  const foodName = food.name.toLowerCase();
  const foodId = food.id.toLowerCase();

  // Check how recently this food appeared in meal history
  const recentNames = history.slice(-30).map((h) => h.name?.toLowerCase() || "");

  // Last 3 meals - heavy penalty
  const last3 = recentNames.slice(-3);
  if (last3.some((name) => name.includes(foodName) || name.includes(foodId))) {
    return 0.1 + jitter();
  }

  // Last 8 meals - moderate penalty
  const last8 = recentNames.slice(-8);
  if (last8.some((name) => name.includes(foodName) || name.includes(foodId))) {
    return 0.4 + jitter();
  }

  // Last 30 meals - mild penalty
  if (recentNames.some((name) => name.includes(foodName) || name.includes(foodId))) {
    return 0.7 + jitter();
  }

  // Never seen - full score with jitter
  return 0.9 + jitter();
}

/**
 * Random jitter to break ties and add surprise
 * @returns {number} -0.1..0.1
 */
function jitter() {
  return (Math.random() - 0.5) * 0.2;
}
