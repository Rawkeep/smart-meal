/**
 * Flavor Pairing Rules - Defines which foods work well together
 *
 * Category-level defaults provide a baseline, specific pairings override.
 * Affinity: 0..1 (0 = bad combo, 1 = perfect pairing)
 */

// Default affinities between categories
export const CATEGORY_AFFINITIES = {
  "protein+gemüse": 0.7,
  "protein+getreide": 0.7,
  "protein+gewürze": 0.6,
  "protein+milch": 0.5,
  "protein+hülsenfrüchte": 0.5,
  "gemüse+getreide": 0.65,
  "gemüse+gewürze": 0.7,
  "gemüse+hülsenfrüchte": 0.7,
  "gemüse+milch": 0.55,
  "gemüse+nüsse": 0.5,
  "getreide+gewürze": 0.6,
  "getreide+milch": 0.55,
  "getreide+hülsenfrüchte": 0.65,
  "obst+milch": 0.6,
  "obst+nüsse": 0.7,
  "obst+getreide": 0.55,
  "hülsenfrüchte+gewürze": 0.7,
  "nüsse+gewürze": 0.5,
  "milch+gewürze": 0.4,
  "sonstiges+gemüse": 0.5,
  "sonstiges+protein": 0.5,
};

// Specific high-affinity pairings
export const SPECIFIC_PAIRINGS = [
  // Protein + Gemuse classics
  { a: "hähnchen", b: "paprika", affinity: 0.95 },
  { a: "hähnchen", b: "brokkoli", affinity: 0.9 },
  { a: "hähnchen", b: "süßkartoffel", affinity: 0.85 },
  { a: "hähnchen", b: "zucchini", affinity: 0.85 },
  { a: "lachs", b: "spargel", affinity: 0.95 },
  { a: "lachs", b: "spinat", affinity: 0.85 },
  { a: "lachs", b: "brokkoli", affinity: 0.85 },
  { a: "rind", b: "pilze", affinity: 0.95 },
  { a: "rind", b: "kartoffel", affinity: 0.9 },
  { a: "rind", b: "karotte", affinity: 0.8 },
  { a: "lamm", b: "kürbis", affinity: 0.85 },
  { a: "lamm", b: "aubergine", affinity: 0.9 },
  { a: "hackfleisch", b: "kartoffel", affinity: 0.85 },
  { a: "hackfleisch", b: "paprika", affinity: 0.85 },
  { a: "kabeljau", b: "kartoffel", affinity: 0.9 },
  { a: "kabeljau", b: "erbsen", affinity: 0.8 },
  { a: "forelle", b: "mandel_food", affinity: 0.85 },
  { a: "garnelen", b: "knoblauch", affinity: 0.95 },
  { a: "garnelen", b: "zucchini", affinity: 0.8 },
  { a: "schwein", b: "kürbis", affinity: 0.8 },
  { a: "schwein", b: "kartoffel", affinity: 0.85 },

  // Protein + Getreide
  { a: "hähnchen", b: "reis", affinity: 0.9 },
  { a: "hähnchen", b: "couscous", affinity: 0.85 },
  { a: "lachs", b: "reis", affinity: 0.9 },
  { a: "rind", b: "nudeln", affinity: 0.8 },
  { a: "hackfleisch", b: "nudeln", affinity: 0.9 },
  { a: "hackfleisch", b: "tortilla", affinity: 0.85 },
  { a: "tofu", b: "reis", affinity: 0.9 },
  { a: "tofu", b: "glasnudeln", affinity: 0.9 },
  { a: "tofu", b: "reisnudeln", affinity: 0.9 },
  { a: "ei", b: "brot", affinity: 0.9 },
  { a: "ei", b: "reis", affinity: 0.85 },

  // Asian pairings
  { a: "tofu", b: "pak_choi", affinity: 0.95 },
  { a: "tofu", b: "sojasauce", affinity: 0.95 },
  { a: "tofu", b: "sesamöl", affinity: 0.9 },
  { a: "tofu", b: "chinakohl", affinity: 0.85 },
  { a: "reis", b: "sojasauce", affinity: 0.9 },
  { a: "glasnudeln", b: "sojasauce", affinity: 0.9 },
  { a: "reisnudeln", b: "currypaste", affinity: 0.9 },
  { a: "edamame", b: "sesamöl", affinity: 0.85 },
  { a: "hähnchen", b: "sojasauce", affinity: 0.85 },
  { a: "garnelen", b: "reisnudeln", affinity: 0.9 },

  // Mediterranean
  { a: "mozzarella", b: "tomate", affinity: 0.95 },
  { a: "feta", b: "gurke", affinity: 0.9 },
  { a: "feta", b: "paprika", affinity: 0.85 },
  { a: "parmesan", b: "nudeln", affinity: 0.95 },
  { a: "olivenöl", b: "tomate", affinity: 0.9 },
  { a: "olivenöl", b: "knoblauch", affinity: 0.9 },

  // Middle Eastern / North African
  { a: "kichererbsen", b: "tahini", affinity: 0.95 },
  { a: "kichererbsen", b: "couscous", affinity: 0.85 },
  { a: "linsen", b: "reis", affinity: 0.85 },
  { a: "linsen", b: "karotte", affinity: 0.85 },
  { a: "lamm", b: "couscous", affinity: 0.9 },
  { a: "harissa", b: "kichererbsen", affinity: 0.9 },
  { a: "harissa", b: "couscous", affinity: 0.85 },
  { a: "bulgur", b: "tomate", affinity: 0.8 },

  // Indian
  { a: "linsen", b: "currypaste", affinity: 0.95 },
  { a: "kichererbsen", b: "currypaste", affinity: 0.9 },
  { a: "reis", b: "currypaste", affinity: 0.9 },
  { a: "kokosmilch_dose", b: "currypaste", affinity: 0.95 },
  { a: "hähnchen", b: "currypaste", affinity: 0.9 },
  { a: "süßkartoffel", b: "currypaste", affinity: 0.85 },

  // Mexican
  { a: "kidneybohnen", b: "tortilla", affinity: 0.9 },
  { a: "hackfleisch", b: "kidneybohnen", affinity: 0.85 },
  { a: "mais", b: "kidneybohnen", affinity: 0.85 },
  { a: "avocado", b: "tortilla", affinity: 0.9 },
  { a: "paprika", b: "tortilla", affinity: 0.8 },

  // German classics
  { a: "kartoffel", b: "rosenkohl", affinity: 0.85 },
  { a: "kartoffel", b: "grünkohl", affinity: 0.85 },
  { a: "kartoffel", b: "lauch", affinity: 0.8 },
  { a: "speck", b: "kartoffel", affinity: 0.9 },
  { a: "senf_food", b: "wurst", affinity: 0.9 },
  { a: "rote_bete", b: "feta", affinity: 0.85 },

  // Breakfast / Sweet
  { a: "haferflocken", b: "banane", affinity: 0.95 },
  { a: "haferflocken", b: "heidelbeere", affinity: 0.9 },
  { a: "haferflocken", b: "apfel", affinity: 0.85 },
  { a: "joghurt", b: "heidelbeere", affinity: 0.9 },
  { a: "joghurt", b: "honig", affinity: 0.9 },
  { a: "quark", b: "himbeere", affinity: 0.85 },
  { a: "banane", b: "erdnussbutter", affinity: 0.95 },
  { a: "apfel", b: "haselnuss_food", affinity: 0.85 },

  // Nut pairings
  { a: "pinienkerne", b: "spinat", affinity: 0.9 },
  { a: "pinienkerne", b: "nudeln", affinity: 0.85 },
  { a: "cashew_food", b: "hähnchen", affinity: 0.85 },
  { a: "erdnuss_food", b: "reisnudeln", affinity: 0.85 },
  { a: "walnuss_food", b: "rote_bete", affinity: 0.85 },
  { a: "mandel_food", b: "brokkoli", affinity: 0.8 },
  { a: "kürbiskerne", b: "kürbis", affinity: 0.9 },
  { a: "sesam_food", b: "hähnchen", affinity: 0.8 },

  // Gewurze universal
  { a: "tomatenmark", b: "hackfleisch", affinity: 0.9 },
  { a: "tomatenmark", b: "nudeln", affinity: 0.85 },
  { a: "dosentomaten", b: "nudeln", affinity: 0.85 },
  { a: "dosentomaten", b: "hackfleisch", affinity: 0.85 },
  { a: "passata", b: "nudeln", affinity: 0.9 },
  { a: "miso", b: "tofu", affinity: 0.9 },
  { a: "kokosmilch_dose", b: "süßkartoffel", affinity: 0.85 },
  { a: "kokosmilch_dose", b: "hähnchen", affinity: 0.85 },
];

/**
 * Get affinity between two foods
 * @param {string} idA - food ID
 * @param {string} idB - food ID
 * @param {string} catA - category of food A
 * @param {string} catB - category of food B
 * @returns {number} 0..1 affinity score
 */
export function getAffinity(idA, idB, catA, catB) {
  // Check specific pairings (both directions)
  const specific = SPECIFIC_PAIRINGS.find(
    (p) =>
      (p.a === idA && p.b === idB) || (p.a === idB && p.b === idA)
  );
  if (specific) return specific.affinity;

  // Fall back to category defaults
  const key1 = `${catA}+${catB}`;
  const key2 = `${catB}+${catA}`;
  return CATEGORY_AFFINITIES[key1] ?? CATEGORY_AFFINITIES[key2] ?? 0.4;
}
