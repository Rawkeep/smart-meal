#!/usr/bin/env node
/**
 * Erzeugt eindeutige Zugangscodes für Smart Meal (per-Käufer-Paywall).
 *
 * Nutzung:
 *   node scripts/gen-codes.mjs [anzahl]      # Default: 10
 *
 * Ausgabe: die Codes (einer pro Käufer) + ein fertiger `fly secrets set`-
 * Befehl. Jeder Code ist ein eigener Zugang und einzeln widerrufbar (Code aus
 * ACCESS_CODES entfernen → erneut `fly secrets set` → nur dessen Sitzungen enden).
 *
 * Beim ALLERERSTEN Mal zusätzlich ein starkes GATE_SECRET setzen (stabil halten!):
 *   fly secrets set GATE_SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
 */
import crypto from "node:crypto";

// Unverwechselbares Alphabet (kein 0/O/1/I/L) — gut vorlesbar/abtippbar.
const ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
const N = Math.max(1, Math.min(500, parseInt(process.argv[2] || "10", 10) || 10));

const group = () =>
  Array.from({ length: 4 }, () => ALPHABET[crypto.randomInt(ALPHABET.length)]).join("");
const makeCode = () => `SMEAL-${group()}-${group()}`;

const codes = new Set();
while (codes.size < N) codes.add(makeCode());
const list = [...codes];

console.log(`\n${N} Zugangscodes:\n`);
for (const c of list) console.log("  " + c);
console.log(`\nFly-Secret setzen (ergänzt bestehende Codes NICHT automatisch — komplette Liste angeben):\n`);
console.log(`  fly secrets set ACCESS_CODES="${list.join(",")}"\n`);
console.log(`Tipp: bestehende Codes vorher auslesen mit  fly secrets list  ist nicht möglich`);
console.log(`(Werte sind verborgen) — führe die Gesamtliste daher selbst (z. B. in einem`);
console.log(`Passwortmanager). Widerruf = Code aus der Liste streichen und erneut setzen.\n`);
