/**
 * Nutrition model — per 100 g reference values.
 *
 * Fields:
 *   kcal     : energy
 *   protein  : g
 *   fat      : g (total)
 *   satFat   : g (saturated, subset of fat)
 *   carbs    : g (total)
 *   sugar    : g (subset of carbs)
 *   fiber    : g
 *   salt     : g (NaCl equivalent)
 *
 * All figures are rounded approximations (reference per 100 g edible portion,
 * BLS / USDA-aligned). The orchestrator passes actual cooked portion grams so
 * the estimate reflects what's on the plate.
 */

export const FOOD_NUTRITION = {
  // ═══ GEMÜSE ═══
  tomate:          { kcal: 18,  protein: 0.9, fat: 0.2, satFat: 0.0, carbs: 3.9, sugar: 2.6, fiber: 1.2, salt: 0.01 },
  paprika:         { kcal: 26,  protein: 1.0, fat: 0.3, satFat: 0.1, carbs: 6.0, sugar: 4.2, fiber: 2.1, salt: 0.01 },
  gurke:           { kcal: 12,  protein: 0.6, fat: 0.1, satFat: 0.0, carbs: 2.2, sugar: 1.7, fiber: 0.5, salt: 0.01 },
  zucchini:        { kcal: 17,  protein: 1.2, fat: 0.3, satFat: 0.1, carbs: 3.1, sugar: 2.5, fiber: 1.0, salt: 0.02 },
  kartoffel:       { kcal: 77,  protein: 2.0, fat: 0.1, satFat: 0.0, carbs: 17,  sugar: 0.8, fiber: 2.2, salt: 0.01 },
  süßkartoffel:    { kcal: 86,  protein: 1.6, fat: 0.1, satFat: 0.0, carbs: 20,  sugar: 4.2, fiber: 3.0, salt: 0.02 },
  karotte:         { kcal: 41,  protein: 0.9, fat: 0.2, satFat: 0.0, carbs: 9.6, sugar: 4.7, fiber: 2.8, salt: 0.17 },
  brokkoli:        { kcal: 34,  protein: 2.8, fat: 0.4, satFat: 0.1, carbs: 7.0, sugar: 1.7, fiber: 2.6, salt: 0.08 },
  blumenkohl:      { kcal: 25,  protein: 1.9, fat: 0.3, satFat: 0.1, carbs: 5.0, sugar: 2.0, fiber: 2.0, salt: 0.08 },
  spinat:          { kcal: 23,  protein: 2.9, fat: 0.4, satFat: 0.1, carbs: 3.6, sugar: 0.4, fiber: 2.2, salt: 0.19 },
  mangold:         { kcal: 19,  protein: 1.8, fat: 0.2, satFat: 0.0, carbs: 3.7, sugar: 1.1, fiber: 1.6, salt: 0.53 },
  kürbis:          { kcal: 26,  protein: 1.0, fat: 0.1, satFat: 0.0, carbs: 6.5, sugar: 2.8, fiber: 0.5, salt: 0.00 },
  aubergine:       { kcal: 24,  protein: 1.0, fat: 0.2, satFat: 0.0, carbs: 5.9, sugar: 3.5, fiber: 3.0, salt: 0.00 },
  zwiebel:         { kcal: 40,  protein: 1.1, fat: 0.1, satFat: 0.0, carbs: 9.3, sugar: 4.2, fiber: 1.7, salt: 0.00 },
  knoblauch:       { kcal: 149, protein: 6.4, fat: 0.5, satFat: 0.1, carbs: 33,  sugar: 1.0, fiber: 2.1, salt: 0.04 },
  pilze:           { kcal: 22,  protein: 3.1, fat: 0.3, satFat: 0.0, carbs: 3.3, sugar: 2.0, fiber: 1.0, salt: 0.01 },
  spargel:         { kcal: 20,  protein: 2.2, fat: 0.1, satFat: 0.0, carbs: 3.9, sugar: 1.9, fiber: 2.1, salt: 0.01 },
  mais:            { kcal: 86,  protein: 3.2, fat: 1.2, satFat: 0.2, carbs: 19,  sugar: 6.3, fiber: 2.7, salt: 0.04 },
  bohnen_grün:     { kcal: 31,  protein: 1.8, fat: 0.2, satFat: 0.0, carbs: 7.0, sugar: 3.3, fiber: 2.7, salt: 0.01 },
  erbsen:          { kcal: 81,  protein: 5.4, fat: 0.4, satFat: 0.1, carbs: 14,  sugar: 5.7, fiber: 5.1, salt: 0.01 },
  avocado:         { kcal: 160, protein: 2.0, fat: 15,  satFat: 2.1, carbs: 9.0, sugar: 0.7, fiber: 6.7, salt: 0.02 },
  sellerie:        { kcal: 16,  protein: 0.7, fat: 0.2, satFat: 0.0, carbs: 3.0, sugar: 1.8, fiber: 1.6, salt: 0.20 },
  fenchel:         { kcal: 31,  protein: 1.2, fat: 0.2, satFat: 0.0, carbs: 7.3, sugar: 3.9, fiber: 3.1, salt: 0.13 },
  kohlrabi:        { kcal: 27,  protein: 1.7, fat: 0.1, satFat: 0.0, carbs: 6.2, sugar: 2.6, fiber: 3.6, salt: 0.05 },
  rosenkohl:       { kcal: 43,  protein: 3.4, fat: 0.3, satFat: 0.1, carbs: 9.0, sugar: 2.2, fiber: 3.8, salt: 0.06 },
  grünkohl:        { kcal: 49,  protein: 4.3, fat: 0.9, satFat: 0.1, carbs: 8.8, sugar: 2.3, fiber: 3.6, salt: 0.09 },
  lauch:           { kcal: 31,  protein: 1.5, fat: 0.3, satFat: 0.0, carbs: 6.0, sugar: 1.8, fiber: 1.8, salt: 0.05 },
  radieschen:      { kcal: 16,  protein: 0.7, fat: 0.1, satFat: 0.0, carbs: 3.4, sugar: 1.9, fiber: 1.6, salt: 0.10 },
  rote_bete:       { kcal: 43,  protein: 1.6, fat: 0.2, satFat: 0.0, carbs: 10,  sugar: 6.8, fiber: 2.8, salt: 0.19 },
  chinakohl:       { kcal: 13,  protein: 1.2, fat: 0.2, satFat: 0.0, carbs: 2.2, sugar: 1.4, fiber: 1.0, salt: 0.03 },
  pak_choi:        { kcal: 13,  protein: 1.5, fat: 0.2, satFat: 0.0, carbs: 2.2, sugar: 1.2, fiber: 1.0, salt: 0.16 },
  artischocke:     { kcal: 47,  protein: 3.3, fat: 0.2, satFat: 0.0, carbs: 11,  sugar: 1.0, fiber: 5.4, salt: 0.24 },
  okra:            { kcal: 33,  protein: 1.9, fat: 0.2, satFat: 0.0, carbs: 7.0, sugar: 1.5, fiber: 3.2, salt: 0.02 },
  rucola:          { kcal: 25,  protein: 2.6, fat: 0.7, satFat: 0.1, carbs: 3.6, sugar: 2.1, fiber: 1.6, salt: 0.07 },
  feldsalat:       { kcal: 21,  protein: 2.0, fat: 0.4, satFat: 0.0, carbs: 3.6, sugar: 0.9, fiber: 1.4, salt: 0.01 },
  eisbergsalat:    { kcal: 14,  protein: 0.9, fat: 0.1, satFat: 0.0, carbs: 3.0, sugar: 2.0, fiber: 1.2, salt: 0.01 },
  endivie:         { kcal: 17,  protein: 1.3, fat: 0.2, satFat: 0.0, carbs: 3.4, sugar: 0.3, fiber: 3.1, salt: 0.05 },
  pastinake:       { kcal: 75,  protein: 1.2, fat: 0.3, satFat: 0.1, carbs: 18,  sugar: 4.8, fiber: 4.9, salt: 0.03 },
  topinambur:      { kcal: 73,  protein: 2.0, fat: 0.0, satFat: 0.0, carbs: 17,  sugar: 9.6, fiber: 1.6, salt: 0.01 },
  chinakohl_napa:  { kcal: 13,  protein: 1.2, fat: 0.2, satFat: 0.0, carbs: 2.2, sugar: 1.4, fiber: 1.0, salt: 0.02 },
  ingwer_food:     { kcal: 80,  protein: 1.8, fat: 0.8, satFat: 0.2, carbs: 18,  sugar: 1.7, fiber: 2.0, salt: 0.03 },
  kurkuma_food:    { kcal: 312, protein: 9.7, fat: 3.3, satFat: 0.9, carbs: 67,  sugar: 3.2, fiber: 23,  salt: 0.08 },
  frühlingszwiebel:{ kcal: 27,  protein: 1.5, fat: 0.2, satFat: 0.0, carbs: 6.5, sugar: 2.3, fiber: 2.6, salt: 0.04 },
  edamame:         { kcal: 122, protein: 11,  fat: 5.0, satFat: 0.6, carbs: 10,  sugar: 2.2, fiber: 5.2, salt: 0.01 },

  // ═══ OBST ═══
  apfel:           { kcal: 52,  protein: 0.3, fat: 0.2, satFat: 0.0, carbs: 14,  sugar: 10,  fiber: 2.4, salt: 0.00 },
  banane:          { kcal: 89,  protein: 1.1, fat: 0.3, satFat: 0.1, carbs: 23,  sugar: 12,  fiber: 2.6, salt: 0.00 },
  erdbeere:        { kcal: 32,  protein: 0.7, fat: 0.3, satFat: 0.0, carbs: 7.7, sugar: 4.9, fiber: 2.0, salt: 0.00 },
  zitrone:         { kcal: 29,  protein: 1.1, fat: 0.3, satFat: 0.0, carbs: 9.3, sugar: 2.5, fiber: 2.8, salt: 0.00 },
  orange:          { kcal: 47,  protein: 0.9, fat: 0.1, satFat: 0.0, carbs: 12,  sugar: 9.4, fiber: 2.4, salt: 0.00 },
  birne:           { kcal: 57,  protein: 0.4, fat: 0.1, satFat: 0.0, carbs: 15,  sugar: 9.8, fiber: 3.1, salt: 0.00 },
  mango:           { kcal: 60,  protein: 0.8, fat: 0.4, satFat: 0.1, carbs: 15,  sugar: 14,  fiber: 1.6, salt: 0.00 },
  ananas:          { kcal: 50,  protein: 0.5, fat: 0.1, satFat: 0.0, carbs: 13,  sugar: 9.9, fiber: 1.4, salt: 0.00 },
  heidelbeere:     { kcal: 57,  protein: 0.7, fat: 0.3, satFat: 0.0, carbs: 14,  sugar: 10,  fiber: 2.4, salt: 0.00 },
  himbeere:        { kcal: 52,  protein: 1.2, fat: 0.7, satFat: 0.0, carbs: 12,  sugar: 4.4, fiber: 6.5, salt: 0.00 },
  weintraube:      { kcal: 69,  protein: 0.7, fat: 0.2, satFat: 0.1, carbs: 18,  sugar: 16,  fiber: 0.9, salt: 0.00 },
  pfirsich:        { kcal: 39,  protein: 0.9, fat: 0.3, satFat: 0.0, carbs: 10,  sugar: 8.4, fiber: 1.5, salt: 0.00 },
  pflaume:         { kcal: 46,  protein: 0.7, fat: 0.3, satFat: 0.0, carbs: 11,  sugar: 9.9, fiber: 1.4, salt: 0.00 },
  kirsche:         { kcal: 50,  protein: 1.0, fat: 0.3, satFat: 0.1, carbs: 12,  sugar: 8.5, fiber: 1.6, salt: 0.00 },
  kiwi:            { kcal: 61,  protein: 1.1, fat: 0.5, satFat: 0.0, carbs: 15,  sugar: 8.9, fiber: 3.0, salt: 0.00 },
  kokosnuss:       { kcal: 354, protein: 3.3, fat: 33,  satFat: 30,  carbs: 15,  sugar: 6.2, fiber: 9.0, salt: 0.05 },
  granatapfel:     { kcal: 83,  protein: 1.7, fat: 1.2, satFat: 0.1, carbs: 19,  sugar: 14,  fiber: 4.0, salt: 0.00 },
  feige:           { kcal: 74,  protein: 0.8, fat: 0.3, satFat: 0.1, carbs: 19,  sugar: 16,  fiber: 2.9, salt: 0.00 },
  dattel:          { kcal: 277, protein: 1.8, fat: 0.2, satFat: 0.0, carbs: 75,  sugar: 66,  fiber: 6.7, salt: 0.00 },
  brombeere:       { kcal: 43,  protein: 1.4, fat: 0.5, satFat: 0.0, carbs: 10,  sugar: 4.9, fiber: 5.3, salt: 0.00 },
  johannisbeere:   { kcal: 63,  protein: 1.4, fat: 0.2, satFat: 0.0, carbs: 14,  sugar: 7.4, fiber: 4.3, salt: 0.00 },
  rhabarber:       { kcal: 21,  protein: 0.9, fat: 0.2, satFat: 0.1, carbs: 4.5, sugar: 1.1, fiber: 1.8, salt: 0.01 },
  limette:         { kcal: 30,  protein: 0.7, fat: 0.2, satFat: 0.0, carbs: 11,  sugar: 1.7, fiber: 2.8, salt: 0.00 },
  papaya:          { kcal: 43,  protein: 0.5, fat: 0.3, satFat: 0.1, carbs: 11,  sugar: 7.8, fiber: 1.7, salt: 0.02 },

  // ═══ PROTEIN ═══
  hähnchen:        { kcal: 165, protein: 31,  fat: 3.6, satFat: 1.0, carbs: 0,   sugar: 0,   fiber: 0,   salt: 0.17 },
  hähnchen_schenkel:{kcal: 177, protein: 26,  fat: 8.1, satFat: 2.3, carbs: 0,   sugar: 0,   fiber: 0,   salt: 0.22 },
  rind:            { kcal: 250, protein: 26,  fat: 15,  satFat: 6.0, carbs: 0,   sugar: 0,   fiber: 0,   salt: 0.17 },
  hackfleisch:     { kcal: 212, protein: 24,  fat: 13,  satFat: 5.0, carbs: 0,   sugar: 0,   fiber: 0,   salt: 0.20 },
  schwein:         { kcal: 242, protein: 27,  fat: 14,  satFat: 5.2, carbs: 0,   sugar: 0,   fiber: 0,   salt: 0.15 },
  lamm:            { kcal: 282, protein: 25,  fat: 21,  satFat: 8.8, carbs: 0,   sugar: 0,   fiber: 0,   salt: 0.17 },
  lachs:           { kcal: 208, protein: 20,  fat: 13,  satFat: 3.1, carbs: 0,   sugar: 0,   fiber: 0,   salt: 0.15 },
  thunfisch:       { kcal: 130, protein: 29,  fat: 1.0, satFat: 0.3, carbs: 0,   sugar: 0,   fiber: 0,   salt: 0.12 },
  garnelen:        { kcal: 99,  protein: 24,  fat: 0.3, satFat: 0.1, carbs: 0.2, sugar: 0,   fiber: 0,   salt: 0.57 },
  kabeljau:        { kcal: 82,  protein: 18,  fat: 0.7, satFat: 0.1, carbs: 0,   sugar: 0,   fiber: 0,   salt: 0.19 },
  forelle:         { kcal: 119, protein: 20,  fat: 3.5, satFat: 0.7, carbs: 0,   sugar: 0,   fiber: 0,   salt: 0.13 },
  seelachs:        { kcal: 77,  protein: 18,  fat: 0.5, satFat: 0.1, carbs: 0,   sugar: 0,   fiber: 0,   salt: 0.20 },
  miesmuschel:     { kcal: 86,  protein: 12,  fat: 2.2, satFat: 0.4, carbs: 3.7, sugar: 0,   fiber: 0,   salt: 0.75 },
  tofu:            { kcal: 76,  protein: 8.0, fat: 4.8, satFat: 0.7, carbs: 1.9, sugar: 0.6, fiber: 0.3, salt: 0.02 },
  tempeh:          { kcal: 192, protein: 19,  fat: 11,  satFat: 2.2, carbs: 9.0, sugar: 0,   fiber: 5.5, salt: 0.02 },
  seitan:          { kcal: 370, protein: 75,  fat: 2.0, satFat: 0.3, carbs: 14,  sugar: 0,   fiber: 0,   salt: 1.25 },
  halloumi:        { kcal: 316, protein: 21,  fat: 25,  satFat: 18,  carbs: 2.2, sugar: 1.0, fiber: 0,   salt: 2.7  },
  ei:              { kcal: 155, protein: 13,  fat: 11,  satFat: 3.3, carbs: 1.1, sugar: 1.1, fiber: 0,   salt: 0.36 },
  wurst:           { kcal: 280, protein: 15,  fat: 24,  satFat: 9.0, carbs: 1.0, sugar: 0.5, fiber: 0,   salt: 2.2  },
  speck:           { kcal: 541, protein: 37,  fat: 42,  satFat: 14,  carbs: 1.4, sugar: 0,   fiber: 0,   salt: 4.8  },
  räucherlachs:    { kcal: 117, protein: 18,  fat: 4.3, satFat: 0.9, carbs: 0,   sugar: 0,   fiber: 0,   salt: 4.4  },
  schinken:        { kcal: 120, protein: 19,  fat: 4.5, satFat: 1.6, carbs: 0.5, sugar: 0.3, fiber: 0,   salt: 2.4  },
  frischkäse_p:    { kcal: 233, protein: 7.0, fat: 22,  satFat: 13,  carbs: 3.8, sugar: 3.2, fiber: 0,   salt: 0.87 },
  pute:            { kcal: 104, protein: 24,  fat: 1.0, satFat: 0.3, carbs: 0,   sugar: 0,   fiber: 0,   salt: 0.15 },
  ente:            { kcal: 337, protein: 19,  fat: 28,  satFat: 9.7, carbs: 0,   sugar: 0,   fiber: 0,   salt: 0.16 },

  // ═══ MILCH ═══
  milch:           { kcal: 64,  protein: 3.3, fat: 3.5, satFat: 2.2, carbs: 4.8, sugar: 4.8, fiber: 0,   salt: 0.11 },
  sahne:           { kcal: 338, protein: 2.5, fat: 35,  satFat: 22,  carbs: 3.0, sugar: 3.0, fiber: 0,   salt: 0.08 },
  butter:          { kcal: 717, protein: 0.9, fat: 81,  satFat: 51,  carbs: 0.1, sugar: 0.1, fiber: 0,   salt: 0.02 },
  joghurt:         { kcal: 61,  protein: 3.5, fat: 3.3, satFat: 2.1, carbs: 4.7, sugar: 4.7, fiber: 0,   salt: 0.13 },
  quark:           { kcal: 73,  protein: 12,  fat: 0.2, satFat: 0.1, carbs: 4.0, sugar: 4.0, fiber: 0,   salt: 0.10 },
  frischkäse:      { kcal: 233, protein: 7.0, fat: 22,  satFat: 13,  carbs: 3.8, sugar: 3.2, fiber: 0,   salt: 0.87 },
  mozzarella:      { kcal: 280, protein: 22,  fat: 22,  satFat: 13,  carbs: 2.2, sugar: 1.0, fiber: 0,   salt: 1.5  },
  parmesan:        { kcal: 431, protein: 38,  fat: 29,  satFat: 19,  carbs: 4.1, sugar: 0.8, fiber: 0,   salt: 3.9  },
  gouda:           { kcal: 356, protein: 25,  fat: 27,  satFat: 18,  carbs: 2.2, sugar: 2.2, fiber: 0,   salt: 1.8  },
  feta:            { kcal: 264, protein: 14,  fat: 21,  satFat: 15,  carbs: 4.1, sugar: 4.1, fiber: 0,   salt: 3.0  },
  cheddar:         { kcal: 403, protein: 25,  fat: 33,  satFat: 21,  carbs: 1.3, sugar: 0.5, fiber: 0,   salt: 1.8  },
  hafermilch:      { kcal: 43,  protein: 1.0, fat: 1.5, satFat: 0.2, carbs: 6.7, sugar: 4.0, fiber: 0.8, salt: 0.10 },
  kokosmilch:      { kcal: 197, protein: 2.0, fat: 21,  satFat: 18,  carbs: 3.3, sugar: 3.3, fiber: 0.2, salt: 0.03 },
  sojamilch:       { kcal: 33,  protein: 3.3, fat: 1.8, satFat: 0.3, carbs: 0.1, sugar: 0.1, fiber: 0.4, salt: 0.05 },
  mandelmilch:     { kcal: 17,  protein: 0.5, fat: 1.1, satFat: 0.1, carbs: 1.5, sugar: 0,   fiber: 0.4, salt: 0.09 },
  ricotta:         { kcal: 174, protein: 11,  fat: 13,  satFat: 8.3, carbs: 3.0, sugar: 0.3, fiber: 0,   salt: 0.10 },
  skyr:            { kcal: 63,  protein: 11,  fat: 0.2, satFat: 0.1, carbs: 4.0, sugar: 4.0, fiber: 0,   salt: 0.13 },

  // ═══ GETREIDE (cooked where typical) ═══
  reis:            { kcal: 130, protein: 2.7, fat: 0.3, satFat: 0.1, carbs: 28,  sugar: 0.1, fiber: 0.4, salt: 0.00 },
  nudeln:          { kcal: 131, protein: 5.0, fat: 1.1, satFat: 0.2, carbs: 25,  sugar: 0.6, fiber: 1.8, salt: 0.02 },
  brot:            { kcal: 265, protein: 9.0, fat: 3.2, satFat: 0.7, carbs: 49,  sugar: 5.0, fiber: 2.7, salt: 1.2  },
  vollkornbrot:    { kcal: 247, protein: 13,  fat: 4.2, satFat: 0.9, carbs: 41,  sugar: 4.3, fiber: 7.0, salt: 1.3  },
  roggenbrot:      { kcal: 259, protein: 9.0, fat: 3.3, satFat: 0.6, carbs: 48,  sugar: 4.0, fiber: 5.8, salt: 1.4  },
  couscous:        { kcal: 112, protein: 3.8, fat: 0.2, satFat: 0.0, carbs: 23,  sugar: 0.1, fiber: 1.4, salt: 0.01 },
  bulgur:          { kcal: 83,  protein: 3.1, fat: 0.2, satFat: 0.0, carbs: 19,  sugar: 0.1, fiber: 4.5, salt: 0.01 },
  quinoa:          { kcal: 120, protein: 4.4, fat: 1.9, satFat: 0.2, carbs: 21,  sugar: 0.9, fiber: 2.8, salt: 0.01 },
  haferflocken:    { kcal: 389, protein: 17,  fat: 6.9, satFat: 1.2, carbs: 66,  sugar: 0.8, fiber: 10,  salt: 0.01 },
  müsli:           { kcal: 352, protein: 10,  fat: 5.9, satFat: 1.2, carbs: 66,  sugar: 20,  fiber: 7.0, salt: 0.12 },
  granola:         { kcal: 471, protein: 10,  fat: 20,  satFat: 3.2, carbs: 64,  sugar: 25,  fiber: 7.0, salt: 0.20 },
  tortilla:        { kcal: 312, protein: 8.0, fat: 7.7, satFat: 2.4, carbs: 51,  sugar: 2.0, fiber: 4.2, salt: 1.2  },
  kartoffelpüree:  { kcal: 83,  protein: 2.0, fat: 1.0, satFat: 0.6, carbs: 17,  sugar: 1.1, fiber: 1.4, salt: 0.35 },
  glasnudeln:      { kcal: 334, protein: 0.1, fat: 0.1, satFat: 0.0, carbs: 84,  sugar: 0,   fiber: 0.5, salt: 0.04 },
  reisnudeln:      { kcal: 109, protein: 0.9, fat: 0.2, satFat: 0.0, carbs: 25,  sugar: 0,   fiber: 1.0, salt: 0.03 },
  hirse:           { kcal: 119, protein: 3.5, fat: 1.0, satFat: 0.2, carbs: 24,  sugar: 0.1, fiber: 1.3, salt: 0.00 },
  polenta:         { kcal: 86,  protein: 2.0, fat: 0.4, satFat: 0.1, carbs: 19,  sugar: 0.2, fiber: 1.0, salt: 0.00 },
  nori:            { kcal: 35,  protein: 5.8, fat: 0.3, satFat: 0.1, carbs: 5.1, sugar: 0.5, fiber: 0.3, salt: 0.05 },

  // ═══ HÜLSENFRÜCHTE ═══
  kichererbsen:    { kcal: 164, protein: 8.9, fat: 2.6, satFat: 0.3, carbs: 27,  sugar: 4.8, fiber: 7.6, salt: 0.01 },
  linsen:          { kcal: 116, protein: 9.0, fat: 0.4, satFat: 0.1, carbs: 20,  sugar: 1.8, fiber: 7.9, salt: 0.00 },
  kidneybohnen:    { kcal: 127, protein: 8.7, fat: 0.5, satFat: 0.1, carbs: 23,  sugar: 0.3, fiber: 6.4, salt: 0.01 },
  weiße_bohnen:    { kcal: 139, protein: 9.7, fat: 0.4, satFat: 0.1, carbs: 25,  sugar: 0.3, fiber: 6.3, salt: 0.01 },
  weisse_bohnen:   { kcal: 139, protein: 9.7, fat: 0.4, satFat: 0.1, carbs: 25,  sugar: 0.3, fiber: 6.3, salt: 0.01 },
  schwarze_bohnen: { kcal: 132, protein: 8.9, fat: 0.5, satFat: 0.1, carbs: 24,  sugar: 0.3, fiber: 8.7, salt: 0.01 },
  gruene_linsen:   { kcal: 116, protein: 9.0, fat: 0.4, satFat: 0.1, carbs: 20,  sugar: 1.8, fiber: 7.9, salt: 0.00 },

  // ═══ NÜSSE & SAMEN (small portions) ═══
  erdnuss_food:    { kcal: 567, protein: 26,  fat: 49,  satFat: 6.3, carbs: 16,  sugar: 4.7, fiber: 8.5, salt: 0.05 },
  haselnuss_food:  { kcal: 628, protein: 15,  fat: 61,  satFat: 4.5, carbs: 17,  sugar: 4.3, fiber: 9.7, salt: 0.00 },
  walnuss_food:    { kcal: 654, protein: 15,  fat: 65,  satFat: 6.1, carbs: 14,  sugar: 2.6, fiber: 6.7, salt: 0.01 },
  mandel_food:     { kcal: 579, protein: 21,  fat: 50,  satFat: 3.8, carbs: 22,  sugar: 4.4, fiber: 12,  salt: 0.00 },
  cashew_food:     { kcal: 553, protein: 18,  fat: 44,  satFat: 7.8, carbs: 30,  sugar: 5.9, fiber: 3.3, salt: 0.03 },
  pistazie_food:   { kcal: 560, protein: 20,  fat: 45,  satFat: 5.5, carbs: 28,  sugar: 7.7, fiber: 10,  salt: 0.00 },
  macadamia_food:  { kcal: 718, protein: 8.0, fat: 76,  satFat: 12,  carbs: 14,  sugar: 4.6, fiber: 8.6, salt: 0.01 },
  pekan_food:      { kcal: 691, protein: 9.0, fat: 72,  satFat: 6.2, carbs: 14,  sugar: 4.0, fiber: 9.6, salt: 0.00 },
  paranuss_food:   { kcal: 656, protein: 14,  fat: 66,  satFat: 16,  carbs: 12,  sugar: 2.3, fiber: 7.5, salt: 0.01 },
  pinienkerne:     { kcal: 673, protein: 14,  fat: 68,  satFat: 4.9, carbs: 13,  sugar: 3.6, fiber: 3.7, salt: 0.01 },
  sesam_food:      { kcal: 573, protein: 18,  fat: 50,  satFat: 7.0, carbs: 23,  sugar: 0.3, fiber: 12,  salt: 0.03 },
  sonnenblumenkerne:{kcal: 584, protein: 21,  fat: 51,  satFat: 4.5, carbs: 20,  sugar: 2.6, fiber: 8.6, salt: 0.02 },
  kürbiskerne:     { kcal: 559, protein: 30,  fat: 49,  satFat: 8.7, carbs: 11,  sugar: 1.4, fiber: 6.0, salt: 0.02 },
  leinsamen:       { kcal: 534, protein: 18,  fat: 42,  satFat: 3.7, carbs: 29,  sugar: 1.6, fiber: 27,  salt: 0.07 },
  chiasamen:       { kcal: 486, protein: 17,  fat: 31,  satFat: 3.3, carbs: 42,  sugar: 0,   fiber: 34,  salt: 0.04 },

  // ═══ GEWÜRZE & SAUCEN (very small portions) ═══
  sojasauce:       { kcal: 53,  protein: 5.0, fat: 0.1, satFat: 0.0, carbs: 4.9, sugar: 0.4, fiber: 0.8, salt: 14   },
  currypaste:      { kcal: 110, protein: 2.0, fat: 9.0, satFat: 3.0, carbs: 6.0, sugar: 3.0, fiber: 2.0, salt: 3.0  },
  tomatenmark:     { kcal: 82,  protein: 4.3, fat: 0.5, satFat: 0.1, carbs: 19,  sugar: 12,  fiber: 4.1, salt: 0.10 },
  senf_food:       { kcal: 66,  protein: 4.0, fat: 4.0, satFat: 0.3, carbs: 6.0, sugar: 2.0, fiber: 2.0, salt: 5.3  },
  essig:           { kcal: 18,  protein: 0,   fat: 0,   satFat: 0,   carbs: 0.6, sugar: 0.4, fiber: 0,   salt: 0.02 },
  miso:            { kcal: 199, protein: 12,  fat: 6.0, satFat: 1.0, carbs: 26,  sugar: 6.2, fiber: 5.4, salt: 10   },
  tahini:          { kcal: 595, protein: 17,  fat: 53,  satFat: 7.5, carbs: 21,  sugar: 0.5, fiber: 9.3, salt: 0.30 },
  harissa:         { kcal: 70,  protein: 2.0, fat: 3.0, satFat: 0.4, carbs: 8.0, sugar: 4.0, fiber: 3.0, salt: 3.0  },
  kokosmilch_dose: { kcal: 197, protein: 2.0, fat: 21,  satFat: 18,  carbs: 3.3, sugar: 3.3, fiber: 0.2, salt: 0.03 },
  olivenöl:        { kcal: 884, protein: 0,   fat: 100, satFat: 14,  carbs: 0,   sugar: 0,   fiber: 0,   salt: 0.00 },
  sesamöl:         { kcal: 884, protein: 0,   fat: 100, satFat: 14,  carbs: 0,   sugar: 0,   fiber: 0,   salt: 0.00 },

  // ═══ SONSTIGES ═══
  honig:           { kcal: 304, protein: 0.3, fat: 0,   satFat: 0,   carbs: 82,  sugar: 82,  fiber: 0.2, salt: 0.02 },
  ahornsirup:      { kcal: 260, protein: 0,   fat: 0.2, satFat: 0.0, carbs: 67,  sugar: 60,  fiber: 0,   salt: 0.03 },
  schokolade:      { kcal: 546, protein: 5.0, fat: 31,  satFat: 19,  carbs: 59,  sugar: 52,  fiber: 7.0, salt: 0.06 },
  dosentomaten:    { kcal: 18,  protein: 0.9, fat: 0.2, satFat: 0.0, carbs: 3.9, sugar: 2.6, fiber: 1.2, salt: 0.18 },
  passata:         { kcal: 24,  protein: 1.1, fat: 0.2, satFat: 0.0, carbs: 5.0, sugar: 4.0, fiber: 1.2, salt: 0.20 },
  erdnussbutter:   { kcal: 588, protein: 25,  fat: 50,  satFat: 10,  carbs: 20,  sugar: 9.0, fiber: 6.0, salt: 0.45 },
  mandelmus:       { kcal: 614, protein: 21,  fat: 56,  satFat: 4.4, carbs: 19,  sugar: 4.4, fiber: 10,  salt: 0.01 },
  mehl:            { kcal: 364, protein: 10,  fat: 1.0, satFat: 0.2, carbs: 76,  sugar: 0.3, fiber: 2.7, salt: 0.00 },
  backpulver:      { kcal: 53,  protein: 0,   fat: 0,   satFat: 0,   carbs: 28,  sugar: 0,   fiber: 0,   salt: 27   },
};

const EMPTY_NUTRITION = { kcal: 0, protein: 0, fat: 0, satFat: 0, carbs: 0, sugar: 0, fiber: 0, salt: 0 };

/**
 * Estimate total macros for a list of (food, grams) pairs. Pass the actual
 * cooked portion grams used in the recipe so the result matches the plate
 * and isn't capped at the 100 g reference value.
 *
 * @param {Array<{ id: string, grams: number }>} portions
 * @param {number} persons
 * @returns {{ kcal: number, protein: number, fat: number, satFat: number, carbs: number, sugar: number, fiber: number, salt: number, kcalPerPerson: number, proteinPerPerson: number, coverage: number }}
 */
export function estimateNutrition(portions, persons = 2) {
  const totals = { ...EMPTY_NUTRITION };
  let matchedCount = 0;

  for (const { id, grams } of portions) {
    const ref = FOOD_NUTRITION[id];
    if (!ref) continue;
    matchedCount++;
    const factor = grams / 100;
    totals.kcal    += ref.kcal    * factor;
    totals.protein += ref.protein * factor;
    totals.fat     += ref.fat     * factor;
    totals.satFat  += ref.satFat  * factor;
    totals.carbs   += ref.carbs   * factor;
    totals.sugar   += ref.sugar   * factor;
    totals.fiber   += ref.fiber   * factor;
    totals.salt    += ref.salt    * factor;
  }

  const p = Math.max(1, persons);
  const round1 = (n) => Math.round(n * 10) / 10;

  return {
    kcal:     Math.round(totals.kcal),
    protein:  round1(totals.protein),
    fat:      round1(totals.fat),
    satFat:   round1(totals.satFat),
    carbs:    round1(totals.carbs),
    sugar:    round1(totals.sugar),
    fiber:    round1(totals.fiber),
    salt:     round1(totals.salt),
    kcalPerPerson:    Math.round(totals.kcal / p),
    proteinPerPerson: round1(totals.protein / p),
    fatPerPerson:     round1(totals.fat / p),
    carbsPerPerson:   round1(totals.carbs / p),
    fiberPerPerson:   round1(totals.fiber / p),
    saltPerPerson:    round1(totals.salt / p),
    coverage: portions.length > 0 ? matchedCount / portions.length : 0,
  };
}
