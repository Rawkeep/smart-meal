/**
 * Learning Engine
 *
 * Tracks user preferences and adjusts scoring over time.
 * Stores: liked/disliked ingredients, favorite cuisines, preferred templates,
 * time-of-day patterns, and rating history.
 *
 * All data persists in localStorage - fully offline.
 */

const STORAGE_KEY = "wei-learning-v1";

// Default learning state
const DEFAULT_STATE = {
  ingredientScores: {},   // { foodId: { likes: 0, dislikes: 0, score: 0.5 } }
  templateScores: {},     // { templateId: { uses: 0, likes: 0, score: 0.5 } }
  cuisineScores: {},      // { cuisineId: { uses: 0, likes: 0, score: 0.5 } }
  mealTimePatterns: {},   // { "frühstück": { sweet: 3, deftig: 1 } }
  ratingHistory: [],      // [{ date, recipeId, rating, ingredients, template }]
  totalGenerations: 0,
  totalRatings: 0,
};

/**
 * Load learning state from localStorage
 * @returns {Object} learning state
 */
function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_STATE };
    return { ...DEFAULT_STATE, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULT_STATE };
  }
}

/**
 * Save learning state
 * @param {Object} state
 */
function saveState(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Storage full - trim old ratings
    const trimmed = {
      ...state,
      ratingHistory: state.ratingHistory.slice(-50),
    };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
    } catch {
      // Give up silently
    }
  }
}

/**
 * Record that a recipe was generated (implicit signal)
 * @param {Object} suggestion - the generated recipe
 * @param {string} templateId - template used
 * @param {string[]} foodIds - ingredient IDs used
 */
export function recordGeneration(suggestion, templateId, foodIds) {
  const state = loadState();
  state.totalGenerations += 1;

  // Track template usage
  if (templateId) {
    if (!state.templateScores[templateId]) {
      state.templateScores[templateId] = { uses: 0, likes: 0, score: 0.5 };
    }
    state.templateScores[templateId].uses += 1;
  }

  saveState(state);
}

/**
 * Record a positive signal (saved to favorites, generated again)
 * @param {Object} suggestion
 * @param {string[]} foodIds - ingredient IDs
 * @param {string} templateId
 */
export function recordLike(suggestion, foodIds, templateId) {
  const state = loadState();
  state.totalRatings += 1;

  // Boost ingredients
  for (const id of foodIds) {
    if (!state.ingredientScores[id]) {
      state.ingredientScores[id] = { likes: 0, dislikes: 0, score: 0.5 };
    }
    state.ingredientScores[id].likes += 1;
    state.ingredientScores[id].score = computeScore(state.ingredientScores[id]);
  }

  // Boost template
  if (templateId && state.templateScores[templateId]) {
    state.templateScores[templateId].likes += 1;
    state.templateScores[templateId].score = computeScore(state.templateScores[templateId]);
  }

  // Boost cuisines from suggestion tags/herkunft
  if (suggestion.herkunft) {
    const cuisineKey = suggestion.herkunft.toLowerCase();
    if (!state.cuisineScores[cuisineKey]) {
      state.cuisineScores[cuisineKey] = { uses: 0, likes: 0, score: 0.5 };
    }
    state.cuisineScores[cuisineKey].likes += 1;
    state.cuisineScores[cuisineKey].score = computeScore(state.cuisineScores[cuisineKey]);
  }

  // Rating history
  state.ratingHistory.push({
    date: new Date().toISOString(),
    name: suggestion.name,
    rating: 1,
    ingredients: foodIds,
    templateId,
  });

  // Keep history bounded
  if (state.ratingHistory.length > 100) {
    state.ratingHistory = state.ratingHistory.slice(-100);
  }

  saveState(state);
}

/**
 * Record a negative signal (skipped, "Anderer Vorschlag" clicked)
 * @param {Object} suggestion
 * @param {string[]} foodIds
 * @param {string} templateId
 */
export function recordDislike(suggestion, foodIds, templateId) {
  const state = loadState();

  // Mild penalty for ingredients (skipping is weak signal)
  for (const id of foodIds) {
    if (!state.ingredientScores[id]) {
      state.ingredientScores[id] = { likes: 0, dislikes: 0, score: 0.5 };
    }
    state.ingredientScores[id].dislikes += 1;
    state.ingredientScores[id].score = computeScore(state.ingredientScores[id]);
  }

  saveState(state);
}

/**
 * Get learned preference score for a food
 * @param {string} foodId
 * @returns {number} 0..1 (0.5 = neutral, >0.5 = preferred, <0.5 = avoided)
 */
export function getIngredientPreference(foodId) {
  const state = loadState();
  const entry = state.ingredientScores[foodId];
  if (!entry) return 0.5;
  return entry.score;
}

/**
 * Get learned preference score for a template
 * @param {string} templateId
 * @returns {number} 0..1
 */
export function getTemplatePreference(templateId) {
  const state = loadState();
  const entry = state.templateScores[templateId];
  if (!entry) return 0.5;
  return entry.score;
}

/**
 * Get learning stats for UI display
 * @returns {Object}
 */
export function getLearningStats() {
  const state = loadState();
  const topIngredients = Object.entries(state.ingredientScores)
    .sort(([, a], [, b]) => b.score - a.score)
    .slice(0, 10)
    .map(([id, data]) => ({ id, ...data }));

  const avoidedIngredients = Object.entries(state.ingredientScores)
    .filter(([, data]) => data.score < 0.4)
    .map(([id, data]) => ({ id, ...data }));

  return {
    totalGenerations: state.totalGenerations,
    totalRatings: state.totalRatings,
    topIngredients,
    avoidedIngredients,
    learnedTemplates: Object.keys(state.templateScores).length,
  };
}

/**
 * Reset all learning data
 */
export function resetLearning() {
  saveState({ ...DEFAULT_STATE });
}

/**
 * Compute a Bayesian-ish preference score
 * Prior: 0.5, moves toward 1 with likes, toward 0 with dislikes
 * @param {Object} entry - { likes, dislikes }
 * @returns {number} 0..1
 */
function computeScore(entry) {
  const total = entry.likes + entry.dislikes;
  if (total === 0) return 0.5;
  // Wilson score lower bound (simplified)
  const pos = entry.likes / total;
  const confidence = Math.min(total / 10, 1); // full confidence after 10 ratings
  return 0.5 + (pos - 0.5) * confidence;
}
