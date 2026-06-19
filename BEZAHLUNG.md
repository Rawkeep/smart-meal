# Bezahlung & Zugangscodes — Smart Meal

> Kurz-Referenz: wie der Bezahl→Code-Flow live geht und gewartet wird.
> **Keys/Secrets stehen NICHT hier** (Git-History) — sie liegen im
> Passwort-Manager bzw. als Fly-Secret.

## Wie es funktioniert (Überblick)

1. Käufer zahlt über einen **Stripe Checkout** (Payment-Link oder Checkout-Session).
2. Stripe ruft den **Webhook** `POST /api/stripe/webhook` auf → der Server prägt
   einen persönlichen, 1 Jahr gültigen Zugangscode (`SMP.…`), **speichert** den
   Kauf in SQLite und **mailt** den Code an die Käufer-Adresse (falls Resend gesetzt).
3. Die **Erfolgsseite** `/buy/success?session_id=…` (als Stripe `success_url`)
   zeigt denselben Code sofort an — egal ob der Webhook schon durch ist (idempotent).
4. **Erstattung/Chargeback** in Stripe → Webhook `charge.refunded` /
   `charge.dispute.created` → der Code wird in der DB **widerrufen** und beim
   nächsten Einlösen abgewiesen.

Wahrheitsquelle ist der **Webhook** (kommt auch an, wenn der Käufer den Tab
schließt). Die Erfolgsseite ist nur der bequeme Sofort-Pfad.

## Einmalig einrichten

### 1. Datenbank-Volume (hält Käufe/Codes/Zähler)
```bash
fly volumes create sm_data --region fra --size 1 -a smart-meal
```
> Liegt unter `/data` (siehe `fly.toml` → `[[mounts]]`, `DB_PATH=/data/smartmeal.db`).
> Die App bindet sich damit an **eine** Maschine — für eine kleine Paywall ok.

### 2. Stripe-Secrets
```bash
fly secrets set \
  STRIPE_SECRET_KEY=sk_live_… \
  STRIPE_WEBHOOK_SECRET=whsec_… \
  -a smart-meal
```
- `STRIPE_SECRET_KEY` — verifiziert die Session auf der Erfolgsseite.
- `STRIPE_WEBHOOK_SECRET` — signiert den Webhook (bekommst du beim Anlegen des
  Endpoints, s. u.). Ohne diesen Wert ist der Webhook inert (503).

### 3. Webhook in Stripe anlegen
Stripe-Dashboard → **Developers → Webhooks → Add endpoint**:
- **URL:** `https://smartmeal.rawkeep.com/api/stripe/webhook`
- **Events:** `checkout.session.completed`, `charge.refunded`, `charge.dispute.created`
- Den angezeigten **Signing secret** (`whsec_…`) als `STRIPE_WEBHOOK_SECRET` setzen (Schritt 2).

### 4. E-Mail-Versand (optional, empfohlen)
```bash
fly secrets set \
  RESEND_API_KEY=re_… \
  MAIL_FROM="Smart Meal <hi@deine-domain>" \
  -a smart-meal
```
- Account bei [resend.com](https://resend.com), Domain verifizieren, API-Key erzeugen.
- Ohne `RESEND_API_KEY` wird **keine** Mail verschickt — der Code erscheint dann
  nur auf der Erfolgsseite (kein Fehler).
- `MAIL_FROM`-Domain muss bei Resend verifiziert sein (`onboarding@resend.dev`
  geht nur an die eigene Account-Adresse — nur zum Testen).

### 5. Checkout/Payment-Link konfigurieren
Beim Stripe **Payment-Link** oder bei der Checkout-Session als **success_url** setzen:
```
https://smartmeal.rawkeep.com/buy/success?session_id={CHECKOUT_SESSION_ID}
```
> `{CHECKOUT_SESSION_ID}` lässt Stripe wörtlich so stehen — es wird zur Laufzeit ersetzt.
> Wenn die Käufer-E-Mail erfasst wird (Checkout „E-Mail anfordern“), geht der Code automatisch raus.

## Deploy
```bash
fly deploy -a smart-meal
```
> Deploy ist **manuell** (kein CI→Fly). Erst nach Schritt 1–2 deployen, sonst
> startet die App ohne Volume/Secrets.

## Testen (Stripe Testmodus)
1. Test-Keys + Test-Webhook-Secret setzen (oder lokal `stripe listen`).
2. Lokal weiterleiten:
   ```bash
   stripe listen --forward-to localhost:3001/api/stripe/webhook
   ```
   Das ausgegebene `whsec_…` als `STRIPE_WEBHOOK_SECRET` in `.env` setzen.
3. Test-Kauf auslösen → Code erscheint auf `/buy/success` und kommt per Mail.
4. In Stripe eine **Erstattung** anstoßen → Code lässt sich nicht mehr einlösen.

## Codes manuell ausgeben (ohne Stripe)
Weiter möglich wie bisher — feste Codes als Fly-Secret:
```bash
node scripts/gen-codes.mjs 20
fly secrets set ACCESS_CODES="SMEAL-AAAA-BBBB,…" -a smart-meal
```
Diese Codes sind **nicht** in der DB; Widerruf = aus der Liste streichen + neu setzen.
Stripe-Codes (`SMP.…`) liegen dagegen in der DB und werden bei Erstattung automatisch gesperrt.

## Wartung / Gut zu wissen
- **DB ansehen:** `fly ssh console -a smart-meal` → `sqlite3 /data/smartmeal.db "SELECT created_at,email,revoked FROM purchases;"`
- **Widerrufene Codes:** ein bereits eingeloggtes Cookie bleibt bis `GATE_TTL` (30 Tage)
  gültig; der Widerruf greift beim **Einlösen** des Codes. Für eine kleine Paywall vertretbar.
- **GATE_SECRET stabil halten** — ändert es sich, werden alle `SMP.…`-Codes ungültig
  (sie sind damit signiert). Siehe `ZUGANG.md`.
- **Backup:** das Volume `sm_data` sichert Fly automatisch (Snapshots); bei Bedarf
  `fly volumes snapshots list`.
