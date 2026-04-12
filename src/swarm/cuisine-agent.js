/**
 * Cuisine Agent
 *
 * Scores foods based on cuisine affinity.
 * Maps food IDs to cuisine affinities.
 */

// Cuisine affinity map: foodId -> { cuisineId: affinity }
const CUISINE_MAP = {
  // Asian staples
  tofu: { asiatisch: 0.9, japanisch: 0.9, koreanisch: 0.8, thai: 0.8 },
  tempeh: { asiatisch: 0.9, japanisch: 0.7 },
  sojasauce: { asiatisch: 0.95, japanisch: 0.95, koreanisch: 0.9, thai: 0.8 },
  sesamöl: { asiatisch: 0.9, japanisch: 0.9, koreanisch: 0.9 },
  sesam_food: { asiatisch: 0.9, japanisch: 0.9, koreanisch: 0.8 },
  miso: { japanisch: 0.95, asiatisch: 0.8 },
  reis: { asiatisch: 0.9, japanisch: 0.9, koreanisch: 0.9, thai: 0.9, indisch: 0.8 },
  glasnudeln: { asiatisch: 0.9, thai: 0.9, koreanisch: 0.8 },
  reisnudeln: { asiatisch: 0.9, thai: 0.95, koreanisch: 0.7 },
  pak_choi: { asiatisch: 0.95, japanisch: 0.8, koreanisch: 0.7 },
  chinakohl: { asiatisch: 0.9, koreanisch: 0.95 },
  edamame: { japanisch: 0.9, asiatisch: 0.8 },

  // Indian
  currypaste: { indisch: 0.95, thai: 0.9, asiatisch: 0.7, ostafrikanisch: 0.6 },
  kokosmilch_dose: { indisch: 0.8, thai: 0.9, westafrikanisch: 0.7, karibisch: 0.7 },
  linsen: { indisch: 0.9, orientalisch: 0.7, nordafrikanisch: 0.7, deutsch: 0.6 },
  kichererbsen: { indisch: 0.8, orientalisch: 0.9, nordafrikanisch: 0.8, mediterran: 0.7 },

  // Mexican / Caribbean
  tortilla: { mexikanisch: 0.95, karibisch: 0.7 },
  kidneybohnen: { mexikanisch: 0.9, karibisch: 0.8, westafrikanisch: 0.6 },
  mais: { mexikanisch: 0.9, karibisch: 0.7, westafrikanisch: 0.6 },
  avocado: { mexikanisch: 0.9, karibisch: 0.7 },

  // Mediterranean / Italian
  nudeln: { italienisch: 0.95, mediterran: 0.7, deutsch: 0.7 },
  olivenöl: { italienisch: 0.9, mediterran: 0.95, orientalisch: 0.7 },
  mozzarella: { italienisch: 0.95, mediterran: 0.7 },
  parmesan: { italienisch: 0.95, mediterran: 0.6 },
  tomatenmark: { italienisch: 0.8, mediterran: 0.7, orientalisch: 0.6 },
  dosentomaten: { italienisch: 0.85, mediterran: 0.7, nordafrikanisch: 0.6 },
  passata: { italienisch: 0.9, mediterran: 0.7 },
  pinienkerne: { italienisch: 0.9, mediterran: 0.8 },

  // North African / Oriental
  couscous: { nordafrikanisch: 0.95, orientalisch: 0.8, mediterran: 0.6 },
  bulgur: { orientalisch: 0.9, nordafrikanisch: 0.7, mediterran: 0.6 },
  harissa: { nordafrikanisch: 0.95, orientalisch: 0.7 },
  tahini: { orientalisch: 0.95, nordafrikanisch: 0.8, mediterran: 0.6 },
  feta: { mediterran: 0.9, orientalisch: 0.7 },

  // German
  kartoffel: { deutsch: 0.95, französisch: 0.7 },
  rosenkohl: { deutsch: 0.9 },
  grünkohl: { deutsch: 0.95 },
  kohlrabi: { deutsch: 0.9 },
  lauch: { deutsch: 0.8, französisch: 0.7 },
  rote_bete: { deutsch: 0.8 },
  senf_food: { deutsch: 0.9, französisch: 0.7 },
  wurst: { deutsch: 0.95 },
  speck: { deutsch: 0.9 },
  kartoffelpüree: { deutsch: 0.95, französisch: 0.7 },
  brot: { deutsch: 0.9, französisch: 0.8 },

  // French
  sahne: { französisch: 0.9, deutsch: 0.7, italienisch: 0.6 },
  butter: { französisch: 0.95, deutsch: 0.7 },
  frischkäse: { französisch: 0.8, deutsch: 0.7 },
  spargel: { deutsch: 0.9, französisch: 0.8 },

  // Universal proteins
  hähnchen: { deutsch: 0.7, asiatisch: 0.7, indisch: 0.7, orientalisch: 0.7, mexikanisch: 0.7 },
  lachs: { japanisch: 0.8, deutsch: 0.7, mediterran: 0.7 },
  lamm: { orientalisch: 0.9, nordafrikanisch: 0.9, indisch: 0.7, mediterran: 0.7 },
  garnelen: { asiatisch: 0.8, thai: 0.9, mediterran: 0.7 },

  // West/East African
  süßkartoffel: { westafrikanisch: 0.9, ostafrikanisch: 0.8, karibisch: 0.7 },
  erdnuss_food: { westafrikanisch: 0.9, asiatisch: 0.6 },
  erdnussbutter: { westafrikanisch: 0.9 },
  kokosmilch: { thai: 0.8, karibisch: 0.7, westafrikanisch: 0.6 },
  weiße_bohnen: { westafrikanisch: 0.7, mediterran: 0.7, deutsch: 0.6 },

  // Breakfast
  haferflocken: { deutsch: 0.8, mediterran: 0.5 },
  joghurt: { deutsch: 0.7, orientalisch: 0.7, mediterran: 0.7 },
  quark: { deutsch: 0.9 },
  honig: { orientalisch: 0.7, deutsch: 0.6 },
  ei: { deutsch: 0.8, französisch: 0.8 },
};

/**
 * Score cuisine match for a food
 * @param {Object} food
 * @param {Object} context
 * @param {string} [templateCuisine] - cuisine of the selected template
 * @returns {number} 0..1
 */
export function scoreCuisine(food, context, templateCuisine) {
  const { profile } = context;
  const preferredCuisines = profile.cuisines || [];
  const affinities = CUISINE_MAP[food.id];

  if (!affinities) return 0.5; // neutral for unmapped foods

  let bestScore = 0;

  // Match against template cuisine (highest priority)
  if (templateCuisine && affinities[templateCuisine]) {
    bestScore = Math.max(bestScore, affinities[templateCuisine]);
  }

  // Match against user preferred cuisines
  for (const cuisine of preferredCuisines) {
    if (affinities[cuisine]) {
      bestScore = Math.max(bestScore, affinities[cuisine] * 0.9);
    }
  }

  return bestScore > 0 ? bestScore : 0.4;
}
