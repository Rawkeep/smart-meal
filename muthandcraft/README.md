# MutHandCraft — Website

Fertige, suchmaschinenoptimierte Website für **MutHandCraft**, einen Full-Service-Handwerksbetrieb
in Connecticut, USA (Umbau innen & außen, Bad, Küche, Rohr verlegen / Sanitär, Terrassen, Garten —
einfach alles rund ums Haus).

Die Seite ist **rein statisch** (HTML/CSS/JS, keine Build-Tools, keine Datenbank) — sie läuft sofort
und lässt sich auf jedem Hoster veröffentlichen. Die Inhalte sind auf **Englisch**, weil die Kunden in
Connecticut englischsprachig sind (wichtig auch für die lokale Google-Suche).

---

## 📂 Aufbau

```
muthandcraft/
├── index.html          Startseite (Hero, Leistungen, Referenzen, Bewertungen)
├── services.html       Alle Leistungen im Detail + FAQ
├── projects.html       Projekte / Referenzen + Kundenstimmen
├── about.html          Über uns / Werte
├── contact.html        Kontakt + Angebotsformular
├── 404.html            Fehlerseite
├── css/styles.css      Komplettes Design
├── js/main.js          Menü, Animationen, Formular
├── images/             Platzhalter-Bilder (SVG) — durch echte Fotos ersetzen
├── assets/favicon.svg  Logo / Favicon
├── robots.txt          Suchmaschinen-Steuerung
├── sitemap.xml         Sitemap für Google
├── site.webmanifest    Web-App-Manifest
├── netlify.toml        Deploy-Konfiguration (Netlify)
└── vercel.json         Deploy-Konfiguration (Vercel)
```

## 👀 Lokal ansehen

Einfach `index.html` im Browser öffnen. Oder mit lokalem Server:

```bash
cd muthandcraft
python3 -m http.server 8080
# dann http://localhost:8080 öffnen
```

---

## ✏️ Vor dem Livegang anpassen (Platzhalter)

Bitte überall in den HTML-Dateien diese Platzhalter durch echte Daten ersetzen
(am einfachsten per Suchen-&-Ersetzen über alle Dateien):

| Platzhalter | Bedeutung | Wo |
|---|---|---|
| `(203) 555-0142` und `+12035550142` | Telefonnummer | alle Seiten + JS |
| `hello@muthandcraft.com` | E-Mail | alle Seiten + JS |
| `123 Main Street, Stamford, CT 06901` | echte Adresse | `index.html` (JSON-LD) |
| `CT HIC #0000000` | Lizenznummer | Footer aller Seiten |
| `www.muthandcraft.com` | echte Domain | alle Seiten (canonical, OG, Sitemap, robots, Schema) |
| `YOUR_FORM_ID` | Formspree-Endpunkt (siehe unten) | `contact.html` |
| Kundennamen / Zitate | echte Referenzen | `index.html`, `projects.html` |
| Bilder in `images/` | echte Projektfotos | siehe unten |

**Projektfotos:** Die Dateien `images/project-1.svg` … `project-6.svg` sind Platzhalter.
Lege echte Fotos mit denselben Namen ab (z. B. `project-1.jpg`) und passe die Dateiendung
in `projects.html`/`index.html` an — fertig.

---

## 📨 Kontaktformular aktivieren

Das Formular funktioniert **sofort** über die E-Mail-App des Besuchers (mailto-Fallback).
Für automatischen E-Mail-Versand (empfohlen):

1. Kostenloses Formular auf [formspree.io](https://formspree.io) anlegen.
2. In `contact.html` `YOUR_FORM_ID` durch den echten Endpunkt ersetzen, z. B.
   `action="https://formspree.io/f/abcwxyz"`.

---

## 🚀 Veröffentlichen ("fly fertig")

Da die Seite statisch ist, geht das überall. Drei einfache Wege:

**Netlify (am einfachsten):** Ordner `muthandcraft` auf [netlify.com/drop](https://app.netlify.com/drop)
ziehen — sofort online. `netlify.toml` ist bereits konfiguriert.

**Vercel:** Repository verbinden, Root-Verzeichnis auf `muthandcraft` setzen. `vercel.json` ist dabei.

**GitHub Pages:** In den Repo-Einstellungen Pages aktivieren und diesen Ordner als Quelle wählen
(`.nojekyll` ist enthalten).

Danach eigene Domain (z. B. `muthandcraft.com`) beim Hoster verbinden.

---

## 🔎 SEO — schon eingebaut

- Eigene `<title>` & Meta-Descriptions pro Seite, sinnvolle Keywords
- Open-Graph- & Twitter-Cards (schöne Vorschau beim Teilen)
- **LocalBusiness / GeneralContractor**-Schema (JSON-LD) mit Adresse, Öffnungszeiten, Bewertungen
- Breadcrumb-Schema auf Unterseiten
- `sitemap.xml` + `robots.txt`
- Canonical-URLs, mobilfreundlich, schnell ladend, semantisches HTML

**Nach dem Livegang:** Seite in der [Google Search Console](https://search.google.com/search-console)
eintragen, Sitemap einreichen und ein **Google-Business-Profil** anlegen — das ist für lokale
Handwerker-Suchen ("handyman near me") der wichtigste Hebel.
