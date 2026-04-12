/**
 * Combination Agent
 *
 * Scores how well a candidate food pairs with already-selected ingredients.
 * Also penalizes over-representation of a single category.
 */

import { getAffinity } from "./pairing-rules";

const MAX_SAME_CATEGORY = 2;

/**
 * Score pairing quality for a candidate food
 * @param {Object} food - candidate food
 * @param {Object[]} selectedFoods - already selected foods for this recipe
 * @param {Object} _context - generation context (unused, kept for interface)
 * @returns {number} 0..1
 */
export function scorePairing(food, selectedFoods, _context) {
  // No selections yet - neutral score
  if (selectedFoods.length === 0) return 0.6;

  // Category diversity penalty
  const sameCatCount = selectedFoods.filter(
    (s) => s.category === food.category
  ).length;
  if (sameCatCount >= MAX_SAME_CATEGORY) return 0.1;

  // Average affinity with all selected foods
  let totalAffinity = 0;
  for (const selected of selectedFoods) {
    totalAffinity += getAffinity(
      food.id,
      selected.id,
      food.category,
      selected.category
    );
  }
  const avgAffinity = totalAffinity / selectedFoods.length;

  // Slight bonus for category diversity
  const uniqueCategories = new Set(selectedFoods.map((s) => s.category));
  const diversityBonus = uniqueCategories.has(food.category) ? 0 : 0.05;

  return Math.min(1, avgAffinity + diversityBonus);
}
