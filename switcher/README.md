# 🌍 Switcher — Import / Export (196 Länder)

Eine **kompakte, bildliche, Schritt-für-Schritt-Anleitung** für Import- und
Export-Abläufe **pro Land** – klar, strikt einzuhalten, offline lauffähig und
direkt in einer Datei pflegbar.

> ⚠️ **Kein Rechtsrat.** Inhalte sind praxisnahe Vorlagen. Vorschriften ändern
> sich – vor Nutzung immer mit Zoll, Behörden und Reederei gegenprüfen.

---

## Was es kann

| Feature | Beschreibung |
|---|---|
| **Wizard (strikt)** | Nummerierte Schritte in fixer Reihenfolge. „Weiter“ ist **gesperrt**, bis alle Pflicht-Dokumente des Schritts abgehakt sind. Fortschritt wird lokal gespeichert. |
| **Übersicht** | Land-Steckbrief (Flagge, Region, Hauptstadt, Währung, ISO), Behörde, Vorlauf, wichtige Hinweise + Reihenfolge auf einen Blick. |
| **Karte / Standort** | Offline-Locator (Koordinaten-Marker) + Geo-Infos. |
| **Folie** | Teilbare, **druckbare** Folien (eine pro Schritt). Jede Folie einzeln druckbar – ideal, wenn über einen Schritt diskutiert wird. |
| **Import & Export** | Pro Land beide Richtungen umschaltbar. |
| **Mehrsprachig** | DE / EN / FR per Klick. |
| **Teilen** | „Link teilen“ (Deep-Link `#/TG/import/wizard`), „Als Text kopieren“, „JSON exportieren“, „Drucken/PDF“. |
| **Offline · 0-CDN** | Reines HTML/JS, keine externen Abhängigkeiten. `index.html` doppelklicken genügt. |
| **196 Länder** | Vollständiges Verzeichnis. 5 Muster-Länder sind voll ausgearbeitet, der Rest nutzt einen generischen Standardablauf, bis er gepflegt wird. |

**Voll ausgearbeitete Muster-Länder:** 🇹🇬 Togo · 🇩🇪 Deutschland (EU) · 🇳🇬 Nigeria · 🇨🇮 Côte d’Ivoire · 🇨🇳 China.

---

## Starten

```
switcher/index.html   ← einfach im Browser öffnen (Doppelklick)
```

Kein Build, kein Server nötig. (Optional lokaler Server, falls der Browser
`file://`-Skripte blockiert: `python3 -m http.server` im Ordner.)

---

## Bearbeiten & Erweitern — alles in **`data/countries.js`**

`data/countries.js` ist die **Quelldatei**. Die App liest `window.COUNTRY_DATA`.

### 1. Prozess für ein Land anlegen/ändern

Eintrag unter `processes["<ISO2>"]` hinzufügen oder bearbeiten:

```js
processes["GH"] = {
  status: "complete",
  authority: { de:"Ghana Revenue Authority (Customs)", en:"…", fr:"…" },
  leadtime:  { de:"…", en:"…", fr:"…" },
  notes: [ { de:"…", en:"…", fr:"…" } ],     // wichtige Hinweise / Achtung
  import: { summary:{…}, steps:[ /* siehe unten */ ] },
  export: { summary:{…}, steps:[ … ] }
};
```

Fehlt ein Prozess, zeigt die App automatisch einen **generischen Standardablauf**
(Status „Entwurf“) – jedes der 196 Länder funktioniert also sofort.

### 2. Schritt-Schema (Reihenfolge = Array-Index, strikt)

```js
{
  icon: "📄",                                   // Emoji = bildlicher Anker
  title: { de:"BSC beantragen", en:"…", fr:"…" },
  desc:  { de:"Kurz erklärt, was zu tun ist.", en:"…", fr:"…" },
  docs:  [ { de:"Entwurf-B/L", en:"…", fr:"…" } ],   // Pflicht-Dokumente (Checkliste)
  warn:  { de:"Was unbedingt beachten?", en:"…", fr:"…" }   // optional, null möglich
}
```

- **Reihenfolge** ergibt sich aus der Position im `steps`-Array.
- **`docs`** werden im Wizard zu Pflicht-Häkchen – ohne sie geht es nicht weiter.
- **`warn`** erscheint als gelbe Achtung-Box.

### 3. Mehrsprachigkeit

Jeder Text ist entweder ein `"string"` (gilt für alle Sprachen) **oder**
`{ de:"…", en:"…", fr:"…" }`. Fehlt eine Sprache, wird EN als Fallback genutzt.

### 4. Gesetzesänderung integrieren

Einfach den betroffenen Schritt in `data/countries.js` anpassen – Text ändern,
Schritt einfügen/entfernen, Dokument ergänzen. Keine Code-Änderung nötig.
Tipp: in `notes` ein Datum/Quelle vermerken, z.B. `"Stand 06/2026: …"`.

### 5. Neues Land ins Verzeichnis

Normalerweise schon vorhanden (alle 196). Falls nicht, zu
`COUNTRY_DATA.countries` hinzufügen:

```js
{ code:"GH", iso3:"GHA", name:{de:"Ghana",en:"Ghana",fr:"Ghana"},
  flag:"🇬🇭", region:"west-africa", capital:"Accra", lat:5.60, lng:-0.19, currency:"GHS" }
```

Region-Schlüssel (Labels in `index.html → REGIONS`): `north-africa`,
`west-africa`, `central-africa`, `east-africa`, `southern-africa`,
`north-america`, `central-america`, `caribbean`, `south-america`,
`western-europe`, `northern-europe`, `southern-europe`, `eastern-europe`,
`west-asia`, `central-asia`, `south-asia`, `east-asia`, `southeast-asia`,
`oceania`.

---

## Aufbau

```
switcher/
├── index.html                     # komplette App (UI, Engine, i18n, Print) – 0-CDN
├── data/
│   └── countries.js               # ← QUELLE: 196 Länder + Prozesse (hier editieren)
├── scripts/
│   └── bootstrap-countries.mjs     # Einmal-Generator des Verzeichnisses (Flaggen/ISO)
└── README.md
```

Der Generator ist nur zum **erstmaligen** Erzeugen gedacht. Danach ist
`data/countries.js` die Source of Truth; der Generator überschreibt nur mit
`--force`.

---

## Als eigenes Repo auskoppeln

Dieses Projekt ist self-contained. Für ein eigenes Repository genügt:

```bash
cp -r switcher /pfad/zum/neuen/repo
cd /pfad/zum/neuen/repo && git init && git add . && git commit -m "init"
```

(Es hängt von keiner Datei außerhalb des Ordners ab.)

---

## Lizenz

MIT – frei nutz- und anpassbar.
