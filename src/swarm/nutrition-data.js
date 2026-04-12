/**
 * Nutritional estimation data for offline calorie/protein calculations
 * Values are approximate per 100g unless noted otherwise
 */

// Per-food estimates (key = food ID)
export const FOOD_NUTRITION = {
  // Gemuse
  tomate: { kcal: 18, protein: 0.9, portion: 150 },
  paprika: { kcal: 26, protein: 1, portion: 150 },
  gurke: { kcal: 12, protein: 0.6, portion: 200 },
  zucchini: { kcal: 17, protein: 1.2, portion: 200 },
  kartoffel: { kcal: 77, protein: 2, portion: 200 },
  süßkartoffel: { kcal: 86, protein: 1.6, portion: 200 },
  karotte: { kcal: 41, protein: 0.9, portion: 150 },
  brokkoli: { kcal: 34, protein: 2.8, portion: 200 },
  blumenkohl: { kcal: 25, protein: 1.9, portion: 200 },
  spinat: { kcal: 23, protein: 2.9, portion: 150 },
  mangold: { kcal: 19, protein: 1.8, portion: 150 },
  kürbis: { kcal: 26, protein: 1, portion: 200 },
  aubergine: { kcal: 24, protein: 1, portion: 200 },
  zwiebel: { kcal: 40, protein: 1.1, portion: 80 },
  knoblauch: { kcal: 149, protein: 6.4, portion: 10 },
  pilze: { kcal: 22, protein: 3.1, portion: 150 },
  spargel: { kcal: 20, protein: 2.2, portion: 200 },
  mais: { kcal: 86, protein: 3.2, portion: 150 },
  bohnen_grün: { kcal: 31, protein: 1.8, portion: 150 },
  erbsen: { kcal: 81, protein: 5.4, portion: 100 },
  avocado: { kcal: 160, protein: 2, portion: 80 },
  sellerie: { kcal: 16, protein: 0.7, portion: 150 },
  fenchel: { kcal: 31, protein: 1.2, portion: 150 },
  kohlrabi: { kcal: 27, protein: 1.7, portion: 150 },
  rosenkohl: { kcal: 43, protein: 3.4, portion: 150 },
  grünkohl: { kcal: 49, protein: 4.3, portion: 150 },
  lauch: { kcal: 31, protein: 1.5, portion: 100 },
  radieschen: { kcal: 16, protein: 0.7, portion: 80 },
  rote_bete: { kcal: 43, protein: 1.6, portion: 150 },
  chinakohl: { kcal: 13, protein: 1.2, portion: 150 },
  pak_choi: { kcal: 13, protein: 1.5, portion: 150 },

  // Obst
  apfel: { kcal: 52, protein: 0.3, portion: 150 },
  banane: { kcal: 89, protein: 1.1, portion: 120 },
  erdbeere: { kcal: 32, protein: 0.7, portion: 150 },
  zitrone: { kcal: 29, protein: 1.1, portion: 30 },
  orange: { kcal: 47, protein: 0.9, portion: 150 },
  birne: { kcal: 57, protein: 0.4, portion: 150 },
  mango: { kcal: 60, protein: 0.8, portion: 150 },
  ananas: { kcal: 50, protein: 0.5, portion: 150 },
  heidelbeere: { kcal: 57, protein: 0.7, portion: 100 },
  himbeere: { kcal: 52, protein: 1.2, portion: 100 },
  weintraube: { kcal: 69, protein: 0.7, portion: 100 },
  pfirsich: { kcal: 39, protein: 0.9, portion: 150 },
  pflaume: { kcal: 46, protein: 0.7, portion: 100 },
  kirsche: { kcal: 50, protein: 1, portion: 100 },
  kiwi: { kcal: 61, protein: 1.1, portion: 80 },
  kokosnuss: { kcal: 354, protein: 3.3, portion: 30 },

  // Protein
  hähnchen: { kcal: 165, protein: 31, portion: 150 },
  hähnchen_schenkel: { kcal: 177, protein: 26, portion: 180 },
  rind: { kcal: 250, protein: 26, portion: 150 },
  hackfleisch: { kcal: 212, protein: 24, portion: 150 },
  schwein: { kcal: 242, protein: 27, portion: 150 },
  lamm: { kcal: 282, protein: 25, portion: 150 },
  lachs: { kcal: 208, protein: 20, portion: 150 },
  thunfisch: { kcal: 130, protein: 29, portion: 150 },
  garnelen: { kcal: 99, protein: 24, portion: 120 },
  kabeljau: { kcal: 82, protein: 18, portion: 150 },
  forelle: { kcal: 119, protein: 20, portion: 150 },
  tofu: { kcal: 76, protein: 8, portion: 200 },
  tempeh: { kcal: 192, protein: 19, portion: 150 },
  ei: { kcal: 155, protein: 13, portion: 120 },
  wurst: { kcal: 280, protein: 15, portion: 80 },
  speck: { kcal: 541, protein: 37, portion: 40 },
  seitan: { kcal: 370, protein: 75, portion: 100 },

  // Milch
  milch: { kcal: 64, protein: 3.3, portion: 200 },
  sahne: { kcal: 195, protein: 2.5, portion: 50 },
  butter: { kcal: 717, protein: 0.9, portion: 15 },
  joghurt: { kcal: 61, protein: 3.5, portion: 150 },
  quark: { kcal: 73, protein: 12, portion: 150 },
  frischkäse: { kcal: 250, protein: 6, portion: 30 },
  mozzarella: { kcal: 280, protein: 22, portion: 60 },
  parmesan: { kcal: 431, protein: 38, portion: 20 },
  gouda: { kcal: 356, protein: 25, portion: 30 },
  feta: { kcal: 264, protein: 14, portion: 50 },
  cheddar: { kcal: 403, protein: 25, portion: 30 },
  hafermilch: { kcal: 43, protein: 1, portion: 200 },
  kokosmilch: { kcal: 20, protein: 0.2, portion: 200 },
  sojamilch: { kcal: 33, protein: 3.3, portion: 200 },

  // Getreide
  reis: { kcal: 130, protein: 2.7, portion: 180 },
  nudeln: { kcal: 131, protein: 5, portion: 200 },
  brot: { kcal: 265, protein: 9, portion: 60 },
  couscous: { kcal: 112, protein: 3.8, portion: 180 },
  bulgur: { kcal: 83, protein: 3.1, portion: 180 },
  quinoa: { kcal: 120, protein: 4.4, portion: 180 },
  haferflocken: { kcal: 389, protein: 17, portion: 50 },
  tortilla: { kcal: 312, protein: 8, portion: 60 },
  kartoffelpüree: { kcal: 83, protein: 2, portion: 200 },
  glasnudeln: { kcal: 334, protein: 0.1, portion: 80 },
  reisnudeln: { kcal: 109, protein: 0.9, portion: 180 },
  hirse: { kcal: 119, protein: 3.5, portion: 180 },

  // Hulsenfruchte
  kichererbsen: { kcal: 164, protein: 8.9, portion: 150 },
  linsen: { kcal: 116, protein: 9, portion: 150 },
  kidneybohnen: { kcal: 127, protein: 8.7, portion: 120 },
  edamame: { kcal: 122, protein: 11, portion: 100 },
  weiße_bohnen: { kcal: 139, protein: 9.7, portion: 120 },

  // Nusse (small portions)
  erdnuss_food: { kcal: 567, protein: 26, portion: 25 },
  haselnuss_food: { kcal: 628, protein: 15, portion: 20 },
  walnuss_food: { kcal: 654, protein: 15, portion: 20 },
  mandel_food: { kcal: 579, protein: 21, portion: 20 },
  cashew_food: { kcal: 553, protein: 18, portion: 20 },
  pistazie_food: { kcal: 560, protein: 20, portion: 20 },
  macadamia_food: { kcal: 718, protein: 8, portion: 15 },
  pekan_food: { kcal: 691, protein: 9, portion: 15 },
  paranuss_food: { kcal: 656, protein: 14, portion: 15 },
  pinienkerne: { kcal: 673, protein: 14, portion: 15 },
  sesam_food: { kcal: 573, protein: 18, portion: 10 },
  sonnenblumenkerne: { kcal: 584, protein: 21, portion: 20 },
  kürbiskerne: { kcal: 559, protein: 30, portion: 20 },
  leinsamen: { kcal: 534, protein: 18, portion: 15 },
  chiasamen: { kcal: 486, protein: 17, portion: 15 },

  // Gewurze (small amounts)
  sojasauce: { kcal: 53, protein: 5, portion: 15 },
  currypaste: { kcal: 110, protein: 2, portion: 20 },
  tomatenmark: { kcal: 82, protein: 4.3, portion: 20 },
  senf_food: { kcal: 66, protein: 4, portion: 10 },
  essig: { kcal: 18, protein: 0, portion: 15 },
  miso: { kcal: 199, protein: 12, portion: 15 },
  tahini: { kcal: 595, protein: 17, portion: 20 },
  harissa: { kcal: 70, protein: 2, portion: 10 },
  kokosmilch_dose: { kcal: 197, protein: 2, portion: 100 },
  olivenöl: { kcal: 884, protein: 0, portion: 10 },
  sesamöl: { kcal: 884, protein: 0, portion: 10 },

  // Sonstiges
  honig: { kcal: 304, protein: 0.3, portion: 15 },
  ahornsirup: { kcal: 260, protein: 0, portion: 15 },
  schokolade: { kcal: 546, protein: 5, portion: 20 },
  dosentomaten: { kcal: 18, protein: 0.9, portion: 200 },
  passata: { kcal: 24, protein: 1.1, portion: 150 },
  erdnussbutter: { kcal: 588, protein: 25, portion: 20 },
  mandelmus: { kcal: 614, protein: 21, portion: 20 },
  mehl: { kcal: 364, protein: 10, portion: 50 },
  backpulver: { kcal: 53, protein: 0, portion: 5 },
};

/**
 * Estimate total kcal and protein for a set of food IDs
 * @param {string[]} foodIds
 * @param {number} persons
 * @returns {{ kcal: number, protein: number }}
 */
export function estimateNutrition(foodIds, persons = 2) {
  let totalKcal = 0;
  let totalProtein = 0;

  for (const id of foodIds) {
    const data = FOOD_NUTRITION[id];
    if (!data) continue;
    const portionKcal = (data.kcal * data.portion) / 100;
    const portionProtein = (data.protein * data.portion) / 100;
    totalKcal += portionKcal;
    totalProtein += portionProtein;
  }

  // Scale to per-person
  const perPerson = persons > 0 ? 1 : 1;
  return {
    kcal: Math.round(totalKcal * perPerson),
    protein: Math.round(totalProtein * perPerson),
  };
}
