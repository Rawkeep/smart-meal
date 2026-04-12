/**
 * Swarm Intelligence Engine - Public API
 *
 * Drop-in offline replacement for Claude API recipe generation.
 * Returns the same JSON shape as the backend API.
 */

import { orchestrate } from "./orchestrator";

/**
 * Generate an offline recipe suggestion
 *
 * @param {Object} context
 * @param {Object} context.profile - user profile
 * @param {string} context.meal - frühstück | mittag | abend | snack
 * @param {string} context.cookTime - blitz | schnell | normal | genuss | projekt
 * @param {string} context.mood - comfort | leicht | deftig | exotisch | süß | gesund | proteinreich | random
 * @param {string} context.budget - günstig | normal | premium | egal
 * @param {number} context.persons - number of servings
 * @param {Array} context.history - recent meal history
 * @param {string[]} [context.fridgeItems] - fridge mode ingredients
 * @param {boolean} context.guestMode
 * @param {string[]} context.guestAllergies
 * @param {boolean} context.guestHistamin
 * @param {string[]} context.guestDiet
 * @returns {Promise<Object>} suggestion object matching Claude API shape
 */
export async function generateOfflineSuggestion(context) {
  try {
    const suggestion = await orchestrate(context);
    return suggestion;
  } catch (err) {
    return {
      error: true,
      message: err.message || "Offline-Vorschlag konnte nicht generiert werden.",
    };
  }
}
