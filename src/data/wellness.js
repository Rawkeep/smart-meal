// ═══════════════════════════════════════════════════════════════
// WELLNESS / GESUNDHEITSBLOG
// Kuratierte Inhalte zu Ernährung, Sport, Hausmitteln und Tipps.
//
// Quellen-Orientierung: DGE (Deutsche Gesellschaft für Ernährung),
// BZfE (Bundeszentrum für Ernährung), WHO-Bewegungsempfehlungen.
// Alle Angaben sind allgemeine Information und ersetzen KEINE
// ärztliche Beratung. Hausmittel sind traditionelle Anwendungen.
// ═══════════════════════════════════════════════════════════════

export const WELLNESS_DISCLAIMER =
  "Diese Inhalte dienen der allgemeinen Information und ersetzen keine ärztliche oder therapeutische Beratung. Bei anhaltenden oder schweren Beschwerden bitte ärztlichen Rat einholen. Hausmittel sind traditionelle Anwendungen ohne Heilversprechen.";

// ─── Blog-Kategorien (Tabs im Gesundheits-Overlay) ───
export const WELLNESS_CATEGORIES = [
  { id: "ernährung", label: "Ernährung", emoji: "🥗" },
  { id: "sport", label: "Sport & Bewegung", emoji: "🏃" },
  { id: "hausmittel", label: "Hausmittel", emoji: "🌿" },
  { id: "tipps", label: "Gesundheitstipps", emoji: "💡" },
];

// ─── Ernährungs-Artikel ───
export const NUTRITION_ARTICLES = [
  {
    id: "teller-prinzip",
    emoji: "🍽️",
    title: "Das Teller-Prinzip (DGE)",
    summary: "So baust du jede Mahlzeit ausgewogen auf — ohne Kalorienzählen.",
    body: [
      "½ Teller Gemüse & Salat: liefert Ballaststoffe, Vitamine und sättigt mit wenig Kalorien.",
      "¼ Teller Kohlenhydrate: bevorzugt Vollkorn (Reis, Nudeln, Kartoffeln, Quinoa).",
      "¼ Teller Eiweiß: Hülsenfrüchte, Fisch, Eier, mageres Fleisch oder Tofu.",
      "Dazu eine kleine Menge gesundes Fett (Olivenöl, Nüsse, Avocado).",
      "Getränk: Wasser oder ungesüßter Tee — Kalorien aus Getränken summieren sich schnell.",
    ],
  },
  {
    id: "ballaststoffe",
    emoji: "🌾",
    title: "30 g Ballaststoffe am Tag",
    summary: "Der unterschätzte Schlüssel für Darm, Blutzucker und Sättigung.",
    body: [
      "Ballaststoffe füttern deine Darmbakterien und halten lange satt.",
      "Gute Quellen: Vollkornprodukte, Haferflocken, Hülsenfrüchte, Beeren, Nüsse, Gemüse.",
      "Steigere die Menge langsam und trinke genug Wasser — sonst gibt es Blähungen.",
      "Tipp: 2 EL Leinsamen oder Chia ins Müsli bringen schon ~5 g extra.",
    ],
  },
  {
    id: "protein-basics",
    emoji: "💪",
    title: "Wie viel Protein brauchst du wirklich?",
    summary: "Richtwerte für Alltag, Sport und Muskelaufbau.",
    body: [
      "Alltag: ca. 0,8 g Protein pro kg Körpergewicht.",
      "Aktiv / Muskelaufbau: 1,4–2,0 g pro kg, über den Tag verteilt.",
      "Verteile Protein auf 3–4 Mahlzeiten (je 20–40 g) für beste Verwertung.",
      "Pflanzlich kombinieren: Hülsenfrüchte + Getreide ergeben ein vollständiges Aminosäureprofil.",
    ],
  },
  {
    id: "zucker-reduzieren",
    emoji: "🍬",
    title: "Versteckten Zucker erkennen",
    summary: "Wo Zucker steckt, wo du ihn nicht vermutest.",
    body: [
      "Zutatenliste lesen: endet ein Wort auf -ose (Glukose, Fruktose, Dextrose) ist es Zucker.",
      "Fallen: Fruchtjoghurt, Müsliriegel, Fertigsaucen, Smoothies, „Fitness“-Produkte.",
      "Faustregel: < 5 g Zucker pro 100 g ist wenig, > 15 g ist viel.",
      "Geschmack umtrainieren: Zucker in Kaffee/Tee über 2–3 Wochen schrittweise reduzieren.",
    ],
  },
  {
    id: "hydration",
    emoji: "💧",
    title: "Richtig trinken",
    summary: "1,5–2 Liter am Tag — und warum das beim Denken hilft.",
    body: [
      "Schon 2 % Flüssigkeitsverlust senken Konzentration und Leistung.",
      "Start in den Tag: ein großes Glas Wasser direkt nach dem Aufstehen.",
      "Durst wird oft als Hunger fehlgedeutet — erst trinken, dann entscheiden.",
      "Bei Sport oder Hitze entsprechend mehr; Wasser oder ungesüßte Tees bevorzugen.",
    ],
  },
  {
    id: "meal-prep",
    emoji: "🥡",
    title: "Meal Prep für die Woche",
    summary: "Einmal kochen, mehrfach gesund essen.",
    body: [
      "Plane 2–3 Basis-Komponenten: ein Getreide, ein Protein, geröstetes Gemüse.",
      "Kombiniere sie über die Woche neu, damit keine Langeweile entsteht.",
      "Saucen & Dressings getrennt aufbewahren — hält alles länger frisch.",
      "Gekochtes 3–4 Tage im Kühlschrank, oder portionsweise einfrieren.",
    ],
  },
];

// ─── Sport & Bewegung ───
export const SPORT_TIPS = [
  {
    id: "who-bewegung",
    emoji: "🏃",
    title: "WHO-Bewegungsempfehlung",
    summary: "Das Minimum für ein gesundes Herz-Kreislauf-System.",
    body: [
      "150–300 Min moderate Bewegung pro Woche (zügiges Gehen, Radfahren, Schwimmen).",
      "Oder 75–150 Min intensiv (Laufen, HIIT).",
      "Zusätzlich an 2 Tagen Krafttraining für alle großen Muskelgruppen.",
      "Jede Bewegung zählt — auch Treppen, Spaziergänge und Hausarbeit.",
    ],
  },
  {
    id: "krafttraining-start",
    emoji: "🏋️",
    title: "Krafttraining für Einsteiger",
    summary: "Stark werden ohne Studio — 3 Grundübungen.",
    body: [
      "Kniebeugen: Beine & Po. 3 Sätze à 10–15 Wiederholungen.",
      "Liegestütz (auch an der Wand/auf den Knien): Brust, Arme, Rumpf.",
      "Plank: Rumpfstabilität. Mit 20–30 Sekunden starten.",
      "2–3× pro Woche, mit mind. einem Ruhetag dazwischen. Form vor Tempo.",
    ],
  },
  {
    id: "essen-training",
    emoji: "🍌",
    title: "Essen rund ums Training",
    summary: "Was vor und nach dem Sport sinnvoll ist.",
    body: [
      "Vorher (1–2 h): leicht verdauliche Kohlenhydrate (Banane, Haferflocken, Toast).",
      "Nachher (innerhalb ~1–2 h): Protein + Kohlenhydrate für Regeneration.",
      "Beispiel danach: Quark mit Obst, Skyr, Ei-Bowl oder Linsen-Reis-Gericht.",
      "Viel trinken — beim Schwitzen gehen auch Mineralstoffe verloren.",
    ],
  },
  {
    id: "alltagsbewegung",
    emoji: "🚶",
    title: "Mehr Bewegung im Alltag",
    summary: "Kleine Hebel mit großer Wirkung.",
    body: [
      "Treppe statt Aufzug, eine Station früher aussteigen.",
      "Telefonate im Gehen führen.",
      "Stündlich kurz aufstehen und 1–2 Minuten dehnen.",
      "Ziel ~7.000–10.000 Schritte — aber jede Steigerung gegenüber heute hilft.",
    ],
  },
  {
    id: "regeneration",
    emoji: "😴",
    title: "Regeneration & Schlaf",
    summary: "Fortschritt passiert in der Erholung, nicht im Training.",
    body: [
      "7–9 Stunden Schlaf unterstützen Muskelaufbau und Hormonbalance.",
      "Mindestens ein Ruhetag pro Woche; auf Schmerzsignale hören.",
      "Leichte Aktivität (Spaziergang, Mobility) fördert Erholung an freien Tagen.",
      "Magnesiumreiche Lebensmittel (Nüsse, Vollkorn) können Muskelkrämpfen vorbeugen.",
    ],
  },
];

// ─── Hausmittel (traditionelle Anwendungen) ───
export const HOME_REMEDIES = [
  {
    id: "erkältung",
    emoji: "🤧",
    title: "Erkältung & Halsschmerzen",
    remedies: [
      "Ingwertee: frischen Ingwer in Scheiben 10 Min kochen, mit Honig & Zitrone.",
      "Salbei- oder Kamillentee zum Gurgeln bei Halsschmerzen.",
      "Hühnersuppe wirkt wärmend und liefert Flüssigkeit & Elektrolyte.",
      "Ausreichend trinken und ruhen — Inhalieren mit warmem Wasserdampf befeuchtet die Schleimhäute.",
    ],
    warn: "Bei hohem Fieber, Atemnot oder Beschwerden über 1 Woche zum Arzt.",
  },
  {
    id: "verdauung",
    emoji: "🫃",
    title: "Blähungen & Verdauung",
    remedies: [
      "Fenchel-, Anis- oder Kümmeltee entspannt den Magen-Darm-Trakt.",
      "Pfefferminztee kann krampflösend wirken (nicht bei Reflux).",
      "Ein kurzer Spaziergang nach dem Essen regt die Verdauung an.",
      "Langsam essen und gut kauen reduziert verschluckte Luft.",
    ],
    warn: "Bei starken oder anhaltenden Bauchschmerzen ärztlich abklären lassen.",
  },
  {
    id: "schlaf",
    emoji: "🌙",
    title: "Einschlafhilfen",
    remedies: [
      "Warme Milch mit Honig (Tryptophan) als Abendritual.",
      "Lavendel- oder Melissentee zur Entspannung.",
      "Bildschirme 1 h vor dem Schlafen meiden, Raum abdunkeln.",
      "Feste Schlafenszeiten stabilisieren den Rhythmus.",
    ],
    warn: "Bei chronischen Schlafstörungen ärztlichen Rat suchen.",
  },
  {
    id: "kopfschmerzen",
    emoji: "🤕",
    title: "Kopfschmerzen",
    remedies: [
      "Ein großes Glas Wasser — Kopfschmerz ist oft ein Durstsignal.",
      "Pfefferminzöl verdünnt auf Schläfen einmassieren.",
      "Frische Luft und eine kurze Pause vom Bildschirm.",
      "Koffein in Maßen kann manchen helfen, zu viel verschlimmert es.",
    ],
    warn: "Plötzliche, sehr starke oder neuartige Kopfschmerzen sofort ärztlich abklären.",
  },
  {
    id: "immunsystem",
    emoji: "🛡️",
    title: "Immunsystem unterstützen",
    remedies: [
      "Bunte Gemüse- & Obstvielfalt (Vitamin C, sekundäre Pflanzenstoffe).",
      "Zinkreiche Lebensmittel: Kürbiskerne, Haferflocken, Linsen.",
      "Fermentiertes (Joghurt, Sauerkraut) für die Darmflora.",
      "Ausreichend Schlaf, Bewegung an der frischen Luft, Stress reduzieren.",
    ],
    warn: "Nahrungsergänzung nur gezielt und idealerweise nach Blutbild.",
  },
  {
    id: "muskelkater",
    emoji: "🦵",
    title: "Muskelkater & Krämpfe",
    remedies: [
      "Magnesiumreiche Lebensmittel: Nüsse, Bananen, Vollkorn, dunkle Schokolade.",
      "Warmes Bad oder Wärmflasche entspannt die Muskulatur.",
      "Leichte Bewegung und Dehnen fördern die Durchblutung.",
      "Ausreichend trinken — Flüssigkeitsmangel begünstigt Krämpfe.",
    ],
    warn: "Häufige nächtliche Krämpfe können auf Mineralstoffmangel hindeuten.",
  },
];

// ─── Schnelle Gesundheitstipps ───
export const HEALTH_TIPS = [
  { emoji: "🌅", text: "Starte mit einem Glas Wasser in den Tag — kurbelt den Kreislauf an." },
  { emoji: "🥦", text: "Iss den Regenbogen: je mehr Farben auf dem Teller, desto breiter das Nährstoffspektrum." },
  { emoji: "🧂", text: "Würze mit Kräutern statt Salz — die DGE empfiehlt max. 6 g Salz pro Tag." },
  { emoji: "🚶", text: "Nach dem Essen 10 Min spazieren senkt nachweislich die Blutzuckerspitze." },
  { emoji: "🍽️", text: "Iss langsam: das Sättigungsgefühl setzt erst nach ~20 Minuten ein." },
  { emoji: "☀️", text: "Tageslicht am Morgen stabilisiert deinen Schlaf-Wach-Rhythmus." },
  { emoji: "🥜", text: "Eine Handvoll Nüsse täglich liefert gesunde Fette und Magnesium." },
  { emoji: "📵", text: "Bildschirmpause vor dem Schlafen verbessert die Einschlafzeit." },
  { emoji: "🫖", text: "Ungesüßter Tee zählt zur Flüssigkeitsbilanz und liefert Antioxidantien." },
  { emoji: "🐟", text: "1–2× pro Woche fetter Fisch deckt deinen Omega-3-Bedarf." },
];
