# Zugang & Demo — Smart Meal

> Kurz-Referenz: Adresse, Zugang, Verteilen, Store-Plan.
> **Passwörter/Keys stehen NICHT hier** (Git-History) — sie liegen im
> Passwort-Manager bzw. als Fly-Secret.

## Adresse
- **https://smart-meal.fly.dev** (Custom-Domain geplant: https://smartmeal.rawkeep.com)
- App läuft unter Basis-Pfad `/smart-meal/` (`/` leitet dorthin um).

## Zugangs-Modell (anders als EIS/Sales — KEIN Magic-Link)
1. **Türsteher** (optional, geteiltes Passwort) — als Fly-Secret `ACCESS_GATE_PASS`. Aktiv nur wenn gesetzt.
2. **Freemium**: pro IP `FREE_DAILY_LIMIT` kostenlose KI-Anfragen/Tag (Server-Key).
3. **BYOK**: Nutzer kann eigenen Anthropic-Key eingeben → unbegrenzt (Header `x-user-api-key`).

## Secrets (Fly)
- `ACCESS_GATE_PASS` — Türsteher-Passwort (optional). **Setzen/rotieren:**
  ```
  fly secrets set ACCESS_GATE_PASS='NEUES_PW' -a smart-meal
  ```
  **Türsteher ausschalten** (für öffentlich/Store): Secret entfernen →
  ```
  fly secrets unset ACCESS_GATE_PASS -a smart-meal
  ```
- `GATE_SECRET` — HMAC-Signierschlüssel fürs Gate-Cookie (random, gesetzt).
- `ANTHROPIC_API_KEY` — treibt die Freemium-KI. Ohne ihn läuft nur BYOK.
  ```
  fly secrets set ANTHROPIC_API_KEY='sk-ant-...' -a smart-meal
  ```

## Zugang verteilen
**A) Geschlossene Demo (aktuell):** URL + Türsteher-Passwort weitergeben. Danach kann jeder die App nutzen (Freemium-Limit greift; eigener Key für mehr).

**B) Öffentlich (für Store/Launch):** Türsteher AUS (`ACCESS_GATE_PASS` unset) → App frei erreichbar, Freemium + BYOK regeln den KI-Zugang.

## App-Store (später)
PWA ist die Basis. Realistisch:
- **Google Play**: via TWA (PWABuilder/Bubblewrap, ~$25 einmalig) — braucht `assetlinks.json` (Digital Asset Links) auf der Domain.
- **Apple App Store**: schwieriger ($99/J, Review-Risiko bei reinem Web-Wrapper).
- **Voraussetzung:** Türsteher AUS (Reviewer/Nutzer brauchen öffentlichen Zugang), Privacy-Policy-URL, Icons 192/512+maskable, Screenshots; Ernährungs-Disclaimer (Legal-Safeguards) wichtig.

---
*Schwester-Apps: EIS (eis.rawkeep.com), RAQ Sales (sales.rawkeep.com) — dort Magic-Link-Login statt Freemium.*
