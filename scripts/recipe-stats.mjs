#!/usr/bin/env node
/**
 * recipe-stats.mjs — Überblick über den aktuellen Rezept-Katalog.
 *
 * Zeigt:
 *  - Anzahl Templates (konkrete Gerichts-Gerüste) + Aufschlüsselung nach
 *    Mahlzeit, Küche und "gehoben"-Anteil
 *  - geschätzte Anzahl möglicher Gerichts-KOMBINATIONEN
 *    (pro Template = Produkt über die Slots aus C(Zutaten je Kategorie, k)
 *     für k = min..max; über alle Templates summiert)
 *
 * Lauf:  node scripts/recipe-stats.mjs
 *
 * Die Kombinationszahl ist eine theoretische Obergrenze der Vielfalt
 * (ohne Allergie-/Diät-Filter) — ideal, um Wachstum über die Zeit zu sehen.
 */
import { RECIPE_TEMPLATES } from "../src/swarm/recipe-templates.js";
import { FOODS, FOOD_CATEGORIES } from "../src/data/foods.js";

// Zutaten je Kategorie zählen.
const catCount = {};
for (const c of FOOD_CATEGORIES) catCount[c.id] = 0;
for (const f of FOODS) catCount[f.category] = (catCount[f.category] || 0) + 1;

// BigInt-Binomialkoeffizient C(n, k).
function choose(n, k) {
  if (k < 0 || k > n) return 0n;
  k = Math.min(k, n - k);
  let num = 1n, den = 1n;
  for (let i = 0; i < k; i++) {
    num *= BigInt(n - i);
    den *= BigInt(i + 1);
  }
  return num / den;
}

// Anzahl Füll-Möglichkeiten eines Slots = Summe C(N, k) für k=min..max.
function slotWays(slot) {
  if (slot.fixed) return 1n;                       // fest vorgegebene Zutat
  const n = catCount[slot.category] || 0;
  const min = slot.min ?? 1;
  const max = Math.min(slot.max ?? min, n);
  let ways = 0n;
  for (let k = min; k <= max; k++) ways += choose(n, k);
  return ways < 1n ? 1n : ways;                    // mind. die Grundform
}

let total = 0n;
const byMeal = {}, byCuisine = {};
let gehoben = 0;

for (const t of RECIPE_TEMPLATES) {
  let combos = 1n;
  for (const slot of t.slots || []) combos *= slotWays(slot);
  total += combos;

  byMeal[t.mealType] = (byMeal[t.mealType] || 0) + 1;
  for (const c of t.cuisines || []) byCuisine[c] = (byCuisine[c] || 0) + 1;
  if ((t.moods || []).includes("gehoben") || (t.tags || []).includes("gehoben")) gehoben++;
}

const fmt = (n) => n.toLocaleString("de-DE");
const sortDesc = (obj) => Object.entries(obj).sort((a, b) => b[1] - a[1]);

console.log("╔══════════════════════════════════════════════════════╗");
console.log("║            SMART MEAL — Rezept-Katalog                ║");
console.log("╚══════════════════════════════════════════════════════╝");
console.log(`Templates (Gerichts-Gerüste):  ${RECIPE_TEMPLATES.length}`);
console.log(`  davon „gehoben":             ${gehoben}`);
console.log(`Zutaten gesamt:                ${FOODS.length}`);
console.log("");
console.log(`➜  Geschätzte Gerichts-Kombinationen: ${fmt(total)}`);
console.log("");
console.log("Nach Mahlzeit:");
for (const [k, v] of sortDesc(byMeal)) console.log(`  ${k.padEnd(12)} ${v}`);
console.log("Nach Küche:");
for (const [k, v] of sortDesc(byCuisine)) console.log(`  ${k.padEnd(18)} ${v}`);
console.log("Zutaten je Kategorie:");
for (const [k, v] of sortDesc(catCount)) console.log(`  ${k.padEnd(16)} ${v}`);
