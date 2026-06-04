/**
 * Step-detail enrichment for offline recipes.
 *
 * The 100+ skeleton templates carry deliberately terse steps. This layer
 * augments them at generation time based on the user's cooking experience
 * (profile.cookSkill), so beginners get technique explanations, heat and
 * timing cues, and a little mise-en-place / final-check framing — without
 * having to hand-rewrite every template.
 *
 *   profi    → steps untouched (assumes basics are known)
 *   normal   → adds a heat/time cue where a technique step has none
 *   anfänger → as "normal", plus a one-time plain-language glossary per
 *              technique and intro/closing guidance
 */

// Cooking techniques recognised in step text. `hint` is a concrete heat/time
// cue; `gloss` is a beginner-friendly explanation (shown once per recipe).
const TECHNIQUES = [
  { re: /anschwitz/i,            hint: "bei mittlerer Hitze ca. 2–3 Min, bis es glasig ist", gloss: "anschwitzen = bei mittlerer Hitze sanft garen, bis es glasig und weich wird, ohne Farbe zu nehmen" },
  { re: /anbrat|angebraten|anzubraten/i, hint: "bei mittlerer bis hoher Hitze ca. 3–5 Min, bis es goldbraun ist", gloss: "anbraten = in heißem Öl bei kräftiger Hitze rundum Farbe nehmen lassen" },
  { re: /\bbraten\b|brate\b/i,   hint: "bei mittlerer bis hoher Hitze, ab und zu wenden", gloss: "braten = in der Pfanne mit etwas Fett garen, bis es goldbraun ist" },
  { re: /köchel/i,               hint: "bei niedriger Hitze leicht köcheln lassen", gloss: "köcheln = knapp unter dem Siedepunkt halten, es sollten nur kleine Bläschen aufsteigen" },
  { re: /quellen/i,              hint: "vom Herd ziehen und abgedeckt ca. 5 Min nachziehen lassen", gloss: "quellen lassen = abgedeckt ruhen lassen, damit die Flüssigkeit aufgesogen wird" },
  { re: /verquirl|verrühr/i,     hint: "mit Gabel oder Schneebesen kräftig verrühren", gloss: "verquirlen = mit Gabel/Schneebesen schaumig schlagen, bis alles vermengt ist" },
  { re: /stocken/i,              hint: "bei mittlerer Hitze unter Rühren langsam fest werden lassen", gloss: "stocken lassen = die Eimasse durch sanfte Hitze fest werden lassen" },
  { re: /blanchier/i,            hint: "1–2 Min in sprudelnd kochendem Salzwasser, dann kalt abschrecken", gloss: "blanchieren = sehr kurz in kochendem Wasser garen und sofort in kaltem Wasser abkühlen" },
  { re: /ablösch/i,              hint: "Hitze kurz erhöhen und Flüssigkeit angießen, dabei den Bratensatz lösen", gloss: "ablöschen = mit Flüssigkeit aufgießen, um die Röststoffe vom Pfannenboden zu lösen" },
  { re: /düns/i,                 hint: "zugedeckt bei niedriger Hitze mit wenig Flüssigkeit ca. 5–8 Min garen", gloss: "dünsten = schonend im eigenen Saft bzw. wenig Flüssigkeit bei geschlossenem Deckel garen" },
  { re: /püriere/i,              hint: "mit Stab- oder Standmixer glatt mixen", gloss: "pürieren = fein zerkleinern, bis es cremig und glatt ist" },
  { re: /abschmeck/i,            hint: "mit Salz, Pfeffer und etwas Säure (Zitrone/Essig) abschmecken", gloss: "abschmecken = vor dem Servieren probieren und gezielt nachwürzen" },
  { re: /marinier/i,             hint: "mind. 15–30 Min ziehen lassen (gern länger im Kühlschrank)", gloss: "marinieren = in einer Würzmischung ziehen lassen, damit Geschmack einzieht" },
  { re: /backofen|im ofen|backen/i, hint: "im vorgeheizten Ofen bei 180–200 °C (Ober-/Unterhitze)", gloss: null },
  { re: /aufkochen|zum kochen/i, hint: "bei hoher Hitze sprudelnd aufkochen", gloss: null },
  { re: /\bkochen\b/i,           hint: "in reichlich Salzwasser garen (Packungsangabe beachten)", gloss: null },
];

// Does the step already give a concrete time/temperature cue?
const hasTimingCue = (s) => /\bmin\b|minute|°|sekunden|std\b|stunde/i.test(s);

const TRAILING_PUNCT = /[.!]+\s*$/;

// Append an extra clause to a step, keeping sentence punctuation tidy. Uses an
// em-dash (not parentheses) so clauses that themselves contain "(...)" don't
// produce ugly nested parentheses.
function appendClause(step, clause) {
  const core = step.replace(TRAILING_PUNCT, "").trim();
  return `${core} — ${clause}.`;
}

/**
 * Enrich a list of recipe steps for the given cooking-skill level.
 * @param {string[]} steps - filled step sentences
 * @param {Object} [profile] - user profile (uses profile.cookSkill)
 * @returns {string[]} possibly longer, more detailed steps
 */
export function enrichSteps(steps, profile = {}) {
  const skill = profile.cookSkill || "normal";
  if (skill === "profi" || !Array.isArray(steps) || steps.length === 0) return steps;

  const beginner = skill === "anfänger";
  const explained = new Set(); // techniques already glossed (beginner only)

  const out = steps.map((step) => {
    let s = step;
    for (const tech of TECHNIQUES) {
      if (!tech.re.test(s)) continue;
      // Beginner: explain the technique in plain language the first time.
      if (beginner && tech.gloss && !explained.has(tech.gloss)) {
        explained.add(tech.gloss);
        s = appendClause(s, tech.gloss);
      } else if (!hasTimingCue(s)) {
        // Otherwise add a concrete heat/time cue, but only if none present.
        s = appendClause(s, tech.hint);
      }
      break; // one enrichment per step keeps sentences readable
    }
    return s;
  });

  if (beginner) {
    // Frame the recipe with a prep tip and a serving check so true beginners
    // are never left guessing.
    out.unshift("Tipp vorab: Lies alle Schritte einmal durch und stelle dir Zutaten und Werkzeuge bereit (Mise en place) – so wird's entspannt.");
    const last = out[out.length - 1] || "";
    if (!/serv|anricht|teller|genieß/i.test(last)) {
      out.push("Zum Schluss alles hübsch anrichten und sofort genießen.");
    }
  }

  return out;
}
