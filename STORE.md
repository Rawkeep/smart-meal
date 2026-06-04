# Store-Veröffentlichung — Smart Meal

Schritt-für-Schritt zu Google Play (Android, via TWA) und Apple App Store (iOS, via Capacitor).
Die Web-/PWA-Seite ist bereits store-tauglich vorbereitet — die Punkte unten sind das, was **du** (Accounts, Signing, Upload) erledigen musst.

---

## 0. Was schon erledigt ist ✅

- **PWA-Manifest** vollständig: Icons (192/512/maskable), Screenshots, Shortcuts, `display_override`, Kategorien, Theme-/Background-Color.
- **Meta-Tags**: viewport-fit (iOS-Notch), Apple-Touch-Icon, OG/Twitter, echte Domain.
- **Service Worker** (Offline-Fähigkeit, App-Shell-Precache) via vite-plugin-pwa.
- **Datenschutzerklärung** öffentlich unter `https://smartmeal.rawkeep.com/privacy` (Store-Pflicht).
- **Digital Asset Links**-Endpoint unter `/.well-known/assetlinks.json` (für Android TWA), konfigurierbar per Fly-Secret.
- **Konfigs im Repo**: `twa-manifest.json` (Bubblewrap), `capacitor.config.json` (iOS).
- **Fehler-Monitoring** (Sentry) opt-in — siehe Abschnitt 4.

---

## 1. Voraussetzungen (einmalig)

| | Android | iOS |
|---|---|---|
| Account | Google Play Console (25 $ einmalig) | Apple Developer Program (99 $/Jahr) |
| Rechner | beliebig (Linux/Mac/Win) | **macOS mit Xcode** zwingend |
| Tooling | Node + JDK 17 + Android SDK | Xcode + CocoaPods |

---

## 2. Android — Google Play (TWA via Bubblewrap)

Eine TWA lädt die **Live-Site** in einem Vollbild-Chrome. Damit kein Adress-Balken erscheint, muss `assetlinks.json` den Signatur-Fingerprint deiner App enthalten.

### 2.1 TWA-Projekt erzeugen
```bash
npm i -g @bubblewrap/cli
npx @bubblewrap/cli init --manifest=https://smartmeal.rawkeep.com/smart-meal/manifest.json
# oder: vorhandene twa-manifest.json nutzen → bubblewrap fragt nach Keystore
```
Beim ersten Build legt Bubblewrap einen **Signing-Keystore** an (`android-keystore.keystore`).
> ⚠️ Keystore + Passwörter sicher aufbewahren — ohne sie kannst du nie wieder ein Update veröffentlichen.

### 2.2 Bauen
```bash
npx @bubblewrap/cli build      # erzeugt app-release-bundle.aab + app-release-signed.apk
```

### 2.3 assetlinks verknüpfen (kritisch!)
Fingerprint des Keystores holen:
```bash
keytool -list -v -keystore android-keystore.keystore -alias smartmeal | grep SHA256
```
Den SHA256 als Fly-Secret setzen (der Server liefert `assetlinks.json` dann korrekt aus):
```bash
fly secrets set ANDROID_CERT_SHA256="AA:BB:CC:...:FF" -a smart-meal
# ANDROID_PACKAGE ist bereits com.rawkeep.smartmeal (Default)
```
Prüfen: `https://smartmeal.rawkeep.com/.well-known/assetlinks.json` muss den Fingerprint zeigen.
> Play signiert standardmäßig neu („Play App Signing"). Dann **zusätzlich** den SHA256 aus der Play Console (Setup → App Integrity → App-Signing-Zertifikat) in das Secret aufnehmen (Array mehrerer Fingerprints möglich — Server-Code ggf. erweitern).

### 2.4 In Play Console hochladen
1. Neue App anlegen (Sprache: Deutsch, App, kostenlos).
2. `app-release-bundle.aab` in einem Internal-Testing-Track hochladen.
3. **Store-Eintrag**: Name, Kurz-/Langbeschreibung, Screenshots (mind. 2 Telefon — liegen in `public/screenshots/`), Feature-Grafik 1024×500, App-Icon 512×512 (`public/icons/icon-512.png`).
4. **Datenschutz**: URL `https://smartmeal.rawkeep.com/privacy`.
5. **Data Safety**: „Daten erhoben?" → KI-Eingaben gehen an Anthropic (USA); keine Konten, kein Tracking. Lokale Speicherung bleibt auf dem Gerät.
6. **Inhaltsbewertung** (Fragebogen) + Zielgruppe ausfüllen.
7. Zur Prüfung einreichen.

---

## 3. iOS — App Store (Capacitor)

Apple lehnt reine Web-Hüllen oft ab (Richtlinie 4.2). Deshalb **bündeln** wir die App (offline lauffähig dank Offline-KI) statt nur eine URL zu laden.

### 3.1 Native bauen (gebündelt, absolute API-URL)
```bash
# Backend-URL einbacken, damit die gebündelte App den Server erreicht:
VITE_API_BASE=https://smartmeal.rawkeep.com npm run build:native
```
`build:native` baut mit relativem Asset-Pfad (`--base=./`), nötig für den Capacitor-Container.

### 3.2 iOS-Projekt anlegen (auf dem Mac)
```bash
npx cap add ios       # legt das native Xcode-Projekt unter ios/ an (braucht CocoaPods)
npm run cap:ios       # build:native + cap sync + öffnet Xcode
```

### 3.3 In Xcode
- Signing-Team wählen, Bundle-ID `com.rawkeep.smartmeal`.
- App-Icon (1024×1024) + Launch-Screen setzen.
- Auf echtem Gerät testen.

### 3.4 App Store Connect
1. App anlegen, Bundle-ID registrieren.
2. Build via Xcode → Organizer → „Distribute App" hochladen.
3. **Screenshots** je Gerätegröße (6,7"/6,5" Pflicht) — aus `public/screenshots/` oder Simulator.
4. **App Privacy**: gleiche Angaben wie Play Data Safety.
5. Datenschutz-URL: `https://smartmeal.rawkeep.com/privacy`.
6. **Review-Notiz** ergänzen: „App funktioniert vollständig offline (eingebaute Rezept-Engine); KI-Anbindung optional." — entkräftet 4.2-Bedenken.

### ⚠️ Wichtig: Zugangs-Passwort & Store-Apps
Das Passwort-Gate (`ACCESS_GATE_PASS`) schützt aktuell die **gesamte** Live-Site inkl. `/api`.
- **TWA (Android)** lädt die Live-Site → würde im Store das Passwort verlangen ❌.
- **Capacitor (iOS)** bündelt zwar das Frontend, ruft aber `/api` auf → Gate blockt die Calls ❌.

**Entscheidung vor dem Store-Launch nötig — eine Option wählen:**
1. **Gate ausschalten**, wenn die App öffentlich in den Stores ist: `fly secrets unset ACCESS_GATE_PASS -a smart-meal`.
2. **Gate nur fürs Web behalten** und Store-Apps gegen einen separaten, ungegateten Backend-Host laufen lassen.
3. Gate so anpassen, dass App-Requests (eigener Header/Token) den Türsteher passieren.

> Sag Bescheid, welche Variante — Option 3 kann ich serverseitig umsetzen (z. B. ein App-Shared-Token statt Passwort für `/api`).

---

## 4. Fehler-Monitoring (Sentry) — optional

Inaktiv, solange kein DSN gesetzt ist (kein Bundle-Aufschlag). Aktivieren:
```bash
# Frontend (Build-Zeit-Env):
VITE_SENTRY_DSN="https://...ingest.sentry.io/..." npm run build
# Auf Fly als Secret, falls über Server-Build:
fly secrets set VITE_SENTRY_DSN="https://...@...ingest.sentry.io/..." -a smart-meal
```
Optional `VITE_APP_VERSION` für Release-Tracking setzen. Es werden keine PII gesendet.

---

## 5. Push / Notifications

Aktuell **nicht** eingebaut (bewusst — siehe README-Hinweis). Optionen:
- **Lokale Erinnerung** (z. B. „Was kochst du heute?"): im Web unzuverlässig (kein Hintergrund-Scheduling). Im **nativen** Build sauber via `@capacitor/local-notifications`.
- **Echte Push-Nachrichten**: brauchen VAPID-Keys + Subscription-Speicher serverseitig (Web Push) bzw. APNs/FCM (nativ).

→ Welche Variante gewünscht ist, kann ich gezielt umsetzen.

---

## 6. Schnell-Checkliste

- [ ] Google Play & Apple Developer Accounts
- [ ] Android: `bubblewrap build` → `.aab`, SHA256 als Fly-Secret, assetlinks geprüft
- [ ] iOS: `build:native` mit `VITE_API_BASE`, `cap add ios`, Signing in Xcode
- [ ] **Gate-Entscheidung** für Store-Apps getroffen (Abschnitt 3 ⚠️)
- [ ] Store-Listings: Beschreibungen, Screenshots, Feature-Grafik, Icons
- [ ] Datenschutz-URL + Data-Safety/App-Privacy ausgefüllt
- [ ] (optional) Sentry-DSN gesetzt
- [ ] Internal Testing bestanden → Produktion einreichen
