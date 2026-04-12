/**
 * Swarm Intelligence Engine - Shared Types & Constants
 *
 * @typedef {Object} ScoredIngredient
 * @property {string} id
 * @property {Object} food - full food object from IndexedDB
 * @property {number} score - 0..1 composite score
 * @property {Object} scores - per-agent breakdown
 * @property {number} scores.safety - 0 or 1 (hard gate)
 * @property {number} scores.nutrition - 0..1
 * @property {number} scores.variety - 0..1
 * @property {number} scores.season - 0..1
 * @property {number} scores.cuisine - 0..1
 * @property {number} scores.pairing - 0..1
 *
 * @typedef {Object} RecipeSlot
 * @property {string} category - food category to fill
 * @property {number} min - minimum items
 * @property {number} max - maximum items
 * @property {boolean} [optional] - can be skipped
 *
 * @typedef {Object} RecipeTemplate
 * @property {string} id
 * @property {string} name - name pattern with {PROTEIN}, {GEMUSE}, etc.
 * @property {string} beschreibung
 * @property {string[]} cuisines - matching cuisine IDs
 * @property {string} mealType - fruhstuck | mittag | abend | snack
 * @property {string[]} moods - matching mood IDs
 * @property {string} zeit
 * @property {string} schwierigkeit
 * @property {RecipeSlot[]} slots
 * @property {string[]} stepsTemplate - step templates with {SLOT} placeholders
 * @property {string} emoji
 * @property {string[]} tags
 * @property {string} herkunft
 *
 * @typedef {Object} GenerationContext
 * @property {Object} profile
 * @property {string} meal
 * @property {string} cookTime
 * @property {string} mood
 * @property {string} budget
 * @property {number} persons
 * @property {Array} history
 * @property {string[]} [fridgeItems]
 * @property {boolean} guestMode
 * @property {string[]} guestAllergies
 * @property {boolean} guestHistamin
 * @property {string[]} guestDiet
 */

// Agent weights for composite scoring
// Safety is a hard gate (0 = excluded), not weighted
export const AGENT_WEIGHTS = {
  nutrition: 0.25,
  variety: 0.15,
  season: 0.15,
  cuisine: 0.20,
  pairing: 0.25,
};

// Cook time mapping to minutes
export const COOK_TIME_MAP = {
  blitz: { min: 0, max: 10 },
  schnell: { min: 10, max: 20 },
  normal: { min: 20, max: 40 },
  genuss: { min: 40, max: 90 },
  projekt: { min: 90, max: 300 },
};

// Pantry staples assumed always available (not scored)
export const PANTRY_STAPLES = [
  "Salz", "Pfeffer", "Olivenol", "Zwiebel", "Knoblauch",
  "Wasser", "Zucker", "Mehl", "Butter",
];

// Category display names
export const CATEGORY_LABELS = {
  gemuse: "Gemuse",
  obst: "Obst",
  protein: "Protein",
  milch: "Milch & Kase",
  getreide: "Getreide & Beilagen",
  hulsenfruchte: "Hulsenfruchte",
  nusse: "Nusse & Samen",
  gewurze: "Gewurze & Saucen",
  sonstiges: "Sonstiges",
};
