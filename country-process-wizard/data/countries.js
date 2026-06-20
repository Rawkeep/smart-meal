/* ============================================================================
 * data/countries.js  —  QUELLDATEI (Source of Truth)  •  196 Länder
 * ----------------------------------------------------------------------------
 *  HIER direkt editieren – die App (index.html) liest window.COUNTRY_DATA.
 *
 *  Land hinzufügen / ändern:
 *    1) Eintrag in COUNTRY_DATA.countries (Verzeichnis) – meist schon vorhanden.
 *    2) Prozess in COUNTRY_DATA.processes["<ISO2>"] anlegen/bearbeiten.
 *       Fehlt ein Prozess, nutzt die App automatisch DEFAULT_PROCESS (Entwurf).
 *
 *  Mehrsprachig: Werte sind entweder "string" (gilt für alle Sprachen)
 *  oder { de:"…", en:"…", fr:"…" }.
 *
 *  Schritt-Schema (Reihenfolge = Array-Index, strikt einzuhalten):
 *    { icon:"📄", title:{…}, desc:{…}, docs:[{…}], warn:{…}|null }
 *
 *  ⚠ Inhalte sind praxisnahe Vorlagen, KEINE Rechtsberatung. Vorschriften
 *    ändern sich – vor Nutzung mit Zoll/Behörden/Reederei verifizieren.
 *
 *  Generiert von scripts/bootstrap-countries.mjs (Datum: 2026-06-20).
 *  Eigene Änderungen bleiben erhalten – Generator überschreibt nur mit --force.
 * ========================================================================== */
window.COUNTRY_DATA = {
  meta: {
    version: '1.0.0',
    generated: '2026-06-20T21:18:22.769Z',
    total: 196,
    disclaimer: {
      de: 'Praxisnahe Vorlage, keine Rechtsberatung. Vorschriften ändern sich – stets aktuell prüfen.',
      en: 'Practical template, not legal advice. Regulations change – always verify the current rules.',
      fr: 'Modèle pratique, pas un conseil juridique. Les règles changent – vérifiez toujours.'
    }
  },

  /* ---- Verzeichnis aller Länder ------------------------------------------ */
  countries: [
  {
    "code": "DZ",
    "iso3": "DZA",
    "name": "Algeria",
    "flag": "🇩🇿",
    "region": "north-africa",
    "capital": "Algiers",
    "lat": 36.75,
    "lng": 3.06,
    "currency": "DZD"
  },
  {
    "code": "EG",
    "iso3": "EGY",
    "name": {
      "de": "Ägypten",
      "en": "Egypt",
      "fr": "Égypte"
    },
    "flag": "🇪🇬",
    "region": "north-africa",
    "capital": "Cairo",
    "lat": 30.04,
    "lng": 31.24,
    "currency": "EGP"
  },
  {
    "code": "LY",
    "iso3": "LBY",
    "name": "Libya",
    "flag": "🇱🇾",
    "region": "north-africa",
    "capital": "Tripoli",
    "lat": 32.89,
    "lng": 13.19,
    "currency": "LYD"
  },
  {
    "code": "MA",
    "iso3": "MAR",
    "name": {
      "de": "Marokko",
      "en": "Morocco",
      "fr": "Maroc"
    },
    "flag": "🇲🇦",
    "region": "north-africa",
    "capital": "Rabat",
    "lat": 34.02,
    "lng": -6.84,
    "currency": "MAD"
  },
  {
    "code": "SD",
    "iso3": "SDN",
    "name": "Sudan",
    "flag": "🇸🇩",
    "region": "north-africa",
    "capital": "Khartoum",
    "lat": 15.5,
    "lng": 32.56,
    "currency": "SDG"
  },
  {
    "code": "TN",
    "iso3": "TUN",
    "name": "Tunisia",
    "flag": "🇹🇳",
    "region": "north-africa",
    "capital": "Tunis",
    "lat": 36.81,
    "lng": 10.18,
    "currency": "TND"
  },
  {
    "code": "BJ",
    "iso3": "BEN",
    "name": {
      "de": "Benin",
      "en": "Benin",
      "fr": "Bénin"
    },
    "flag": "🇧🇯",
    "region": "west-africa",
    "capital": "Porto-Novo",
    "lat": 6.5,
    "lng": 2.6,
    "currency": "XOF"
  },
  {
    "code": "BF",
    "iso3": "BFA",
    "name": {
      "de": "Burkina Faso",
      "en": "Burkina Faso",
      "fr": "Burkina Faso"
    },
    "flag": "🇧🇫",
    "region": "west-africa",
    "capital": "Ouagadougou",
    "lat": 12.37,
    "lng": -1.52,
    "currency": "XOF"
  },
  {
    "code": "CV",
    "iso3": "CPV",
    "name": "Cabo Verde",
    "flag": "🇨🇻",
    "region": "west-africa",
    "capital": "Praia",
    "lat": 14.93,
    "lng": -23.51,
    "currency": "CVE"
  },
  {
    "code": "CI",
    "iso3": "CIV",
    "name": {
      "de": "Elfenbeinküste",
      "en": "Côte d'Ivoire",
      "fr": "Côte d'Ivoire"
    },
    "flag": "🇨🇮",
    "region": "west-africa",
    "capital": "Yamoussoukro",
    "lat": 6.83,
    "lng": -5.29,
    "currency": "XOF"
  },
  {
    "code": "GM",
    "iso3": "GMB",
    "name": "Gambia",
    "flag": "🇬🇲",
    "region": "west-africa",
    "capital": "Banjul",
    "lat": 13.45,
    "lng": -16.58,
    "currency": "GMD"
  },
  {
    "code": "GH",
    "iso3": "GHA",
    "name": {
      "de": "Ghana",
      "en": "Ghana",
      "fr": "Ghana"
    },
    "flag": "🇬🇭",
    "region": "west-africa",
    "capital": "Accra",
    "lat": 5.6,
    "lng": -0.19,
    "currency": "GHS"
  },
  {
    "code": "GN",
    "iso3": "GIN",
    "name": "Guinea",
    "flag": "🇬🇳",
    "region": "west-africa",
    "capital": "Conakry",
    "lat": 9.64,
    "lng": -13.58,
    "currency": "GNF"
  },
  {
    "code": "GW",
    "iso3": "GNB",
    "name": "Guinea-Bissau",
    "flag": "🇬🇼",
    "region": "west-africa",
    "capital": "Bissau",
    "lat": 11.86,
    "lng": -15.6,
    "currency": "XOF"
  },
  {
    "code": "LR",
    "iso3": "LBR",
    "name": "Liberia",
    "flag": "🇱🇷",
    "region": "west-africa",
    "capital": "Monrovia",
    "lat": 6.3,
    "lng": -10.8,
    "currency": "LRD"
  },
  {
    "code": "ML",
    "iso3": "MLI",
    "name": {
      "de": "Mali",
      "en": "Mali",
      "fr": "Mali"
    },
    "flag": "🇲🇱",
    "region": "west-africa",
    "capital": "Bamako",
    "lat": 12.64,
    "lng": -8,
    "currency": "XOF"
  },
  {
    "code": "MR",
    "iso3": "MRT",
    "name": "Mauritania",
    "flag": "🇲🇷",
    "region": "west-africa",
    "capital": "Nouakchott",
    "lat": 18.08,
    "lng": -15.98,
    "currency": "MRU"
  },
  {
    "code": "NE",
    "iso3": "NER",
    "name": {
      "de": "Niger",
      "en": "Niger",
      "fr": "Niger"
    },
    "flag": "🇳🇪",
    "region": "west-africa",
    "capital": "Niamey",
    "lat": 13.51,
    "lng": 2.11,
    "currency": "XOF"
  },
  {
    "code": "NG",
    "iso3": "NGA",
    "name": {
      "de": "Nigeria",
      "en": "Nigeria",
      "fr": "Nigéria"
    },
    "flag": "🇳🇬",
    "region": "west-africa",
    "capital": "Abuja",
    "lat": 9.07,
    "lng": 7.49,
    "currency": "NGN"
  },
  {
    "code": "SN",
    "iso3": "SEN",
    "name": {
      "de": "Senegal",
      "en": "Senegal",
      "fr": "Sénégal"
    },
    "flag": "🇸🇳",
    "region": "west-africa",
    "capital": "Dakar",
    "lat": 14.69,
    "lng": -17.45,
    "currency": "XOF"
  },
  {
    "code": "SL",
    "iso3": "SLE",
    "name": "Sierra Leone",
    "flag": "🇸🇱",
    "region": "west-africa",
    "capital": "Freetown",
    "lat": 8.48,
    "lng": -13.23,
    "currency": "SLE"
  },
  {
    "code": "TG",
    "iso3": "TGO",
    "name": {
      "de": "Togo",
      "en": "Togo",
      "fr": "Togo"
    },
    "flag": "🇹🇬",
    "region": "west-africa",
    "capital": "Lomé",
    "lat": 6.13,
    "lng": 1.22,
    "currency": "XOF"
  },
  {
    "code": "CM",
    "iso3": "CMR",
    "name": {
      "de": "Kamerun",
      "en": "Cameroon",
      "fr": "Cameroun"
    },
    "flag": "🇨🇲",
    "region": "central-africa",
    "capital": "Yaoundé",
    "lat": 3.85,
    "lng": 11.5,
    "currency": "XAF"
  },
  {
    "code": "CF",
    "iso3": "CAF",
    "name": "Central African Republic",
    "flag": "🇨🇫",
    "region": "central-africa",
    "capital": "Bangui",
    "lat": 4.39,
    "lng": 18.56,
    "currency": "XAF"
  },
  {
    "code": "TD",
    "iso3": "TCD",
    "name": "Chad",
    "flag": "🇹🇩",
    "region": "central-africa",
    "capital": "N'Djamena",
    "lat": 12.13,
    "lng": 15.06,
    "currency": "XAF"
  },
  {
    "code": "CG",
    "iso3": "COG",
    "name": "Congo (Republic)",
    "flag": "🇨🇬",
    "region": "central-africa",
    "capital": "Brazzaville",
    "lat": -4.27,
    "lng": 15.27,
    "currency": "XAF"
  },
  {
    "code": "CD",
    "iso3": "COD",
    "name": "Congo (DR)",
    "flag": "🇨🇩",
    "region": "central-africa",
    "capital": "Kinshasa",
    "lat": -4.32,
    "lng": 15.31,
    "currency": "CDF"
  },
  {
    "code": "GQ",
    "iso3": "GNQ",
    "name": "Equatorial Guinea",
    "flag": "🇬🇶",
    "region": "central-africa",
    "capital": "Malabo",
    "lat": 3.75,
    "lng": 8.78,
    "currency": "XAF"
  },
  {
    "code": "GA",
    "iso3": "GAB",
    "name": "Gabon",
    "flag": "🇬🇦",
    "region": "central-africa",
    "capital": "Libreville",
    "lat": 0.42,
    "lng": 9.47,
    "currency": "XAF"
  },
  {
    "code": "ST",
    "iso3": "STP",
    "name": "São Tomé and Príncipe",
    "flag": "🇸🇹",
    "region": "central-africa",
    "capital": "São Tomé",
    "lat": 0.34,
    "lng": 6.73,
    "currency": "STN"
  },
  {
    "code": "BI",
    "iso3": "BDI",
    "name": "Burundi",
    "flag": "🇧🇮",
    "region": "east-africa",
    "capital": "Gitega",
    "lat": -3.43,
    "lng": 29.93,
    "currency": "BIF"
  },
  {
    "code": "KM",
    "iso3": "COM",
    "name": "Comoros",
    "flag": "🇰🇲",
    "region": "east-africa",
    "capital": "Moroni",
    "lat": -11.7,
    "lng": 43.26,
    "currency": "KMF"
  },
  {
    "code": "DJ",
    "iso3": "DJI",
    "name": "Djibouti",
    "flag": "🇩🇯",
    "region": "east-africa",
    "capital": "Djibouti",
    "lat": 11.59,
    "lng": 43.15,
    "currency": "DJF"
  },
  {
    "code": "ER",
    "iso3": "ERI",
    "name": "Eritrea",
    "flag": "🇪🇷",
    "region": "east-africa",
    "capital": "Asmara",
    "lat": 15.34,
    "lng": 38.93,
    "currency": "ERN"
  },
  {
    "code": "ET",
    "iso3": "ETH",
    "name": {
      "de": "Äthiopien",
      "en": "Ethiopia",
      "fr": "Éthiopie"
    },
    "flag": "🇪🇹",
    "region": "east-africa",
    "capital": "Addis Ababa",
    "lat": 9.03,
    "lng": 38.74,
    "currency": "ETB"
  },
  {
    "code": "KE",
    "iso3": "KEN",
    "name": {
      "de": "Kenia",
      "en": "Kenya",
      "fr": "Kenya"
    },
    "flag": "🇰🇪",
    "region": "east-africa",
    "capital": "Nairobi",
    "lat": -1.29,
    "lng": 36.82,
    "currency": "KES"
  },
  {
    "code": "MG",
    "iso3": "MDG",
    "name": "Madagascar",
    "flag": "🇲🇬",
    "region": "east-africa",
    "capital": "Antananarivo",
    "lat": -18.88,
    "lng": 47.51,
    "currency": "MGA"
  },
  {
    "code": "MW",
    "iso3": "MWI",
    "name": "Malawi",
    "flag": "🇲🇼",
    "region": "east-africa",
    "capital": "Lilongwe",
    "lat": -13.96,
    "lng": 33.77,
    "currency": "MWK"
  },
  {
    "code": "MU",
    "iso3": "MUS",
    "name": "Mauritius",
    "flag": "🇲🇺",
    "region": "east-africa",
    "capital": "Port Louis",
    "lat": -20.16,
    "lng": 57.5,
    "currency": "MUR"
  },
  {
    "code": "MZ",
    "iso3": "MOZ",
    "name": "Mozambique",
    "flag": "🇲🇿",
    "region": "east-africa",
    "capital": "Maputo",
    "lat": -25.97,
    "lng": 32.58,
    "currency": "MZN"
  },
  {
    "code": "RW",
    "iso3": "RWA",
    "name": "Rwanda",
    "flag": "🇷🇼",
    "region": "east-africa",
    "capital": "Kigali",
    "lat": -1.94,
    "lng": 30.06,
    "currency": "RWF"
  },
  {
    "code": "SC",
    "iso3": "SYC",
    "name": "Seychelles",
    "flag": "🇸🇨",
    "region": "east-africa",
    "capital": "Victoria",
    "lat": -4.62,
    "lng": 55.45,
    "currency": "SCR"
  },
  {
    "code": "SO",
    "iso3": "SOM",
    "name": "Somalia",
    "flag": "🇸🇴",
    "region": "east-africa",
    "capital": "Mogadishu",
    "lat": 2.05,
    "lng": 45.32,
    "currency": "SOS"
  },
  {
    "code": "SS",
    "iso3": "SSD",
    "name": "South Sudan",
    "flag": "🇸🇸",
    "region": "east-africa",
    "capital": "Juba",
    "lat": 4.85,
    "lng": 31.58,
    "currency": "SSP"
  },
  {
    "code": "TZ",
    "iso3": "TZA",
    "name": "Tanzania",
    "flag": "🇹🇿",
    "region": "east-africa",
    "capital": "Dodoma",
    "lat": -6.16,
    "lng": 35.75,
    "currency": "TZS"
  },
  {
    "code": "UG",
    "iso3": "UGA",
    "name": "Uganda",
    "flag": "🇺🇬",
    "region": "east-africa",
    "capital": "Kampala",
    "lat": 0.35,
    "lng": 32.58,
    "currency": "UGX"
  },
  {
    "code": "ZM",
    "iso3": "ZMB",
    "name": "Zambia",
    "flag": "🇿🇲",
    "region": "east-africa",
    "capital": "Lusaka",
    "lat": -15.39,
    "lng": 28.32,
    "currency": "ZMW"
  },
  {
    "code": "ZW",
    "iso3": "ZWE",
    "name": "Zimbabwe",
    "flag": "🇿🇼",
    "region": "east-africa",
    "capital": "Harare",
    "lat": -17.83,
    "lng": 31.05,
    "currency": "ZWL"
  },
  {
    "code": "AO",
    "iso3": "AGO",
    "name": "Angola",
    "flag": "🇦🇴",
    "region": "southern-africa",
    "capital": "Luanda",
    "lat": -8.84,
    "lng": 13.23,
    "currency": "AOA"
  },
  {
    "code": "BW",
    "iso3": "BWA",
    "name": "Botswana",
    "flag": "🇧🇼",
    "region": "southern-africa",
    "capital": "Gaborone",
    "lat": -24.65,
    "lng": 25.91,
    "currency": "BWP"
  },
  {
    "code": "SZ",
    "iso3": "SWZ",
    "name": "Eswatini",
    "flag": "🇸🇿",
    "region": "southern-africa",
    "capital": "Mbabane",
    "lat": -26.32,
    "lng": 31.13,
    "currency": "SZL"
  },
  {
    "code": "LS",
    "iso3": "LSO",
    "name": "Lesotho",
    "flag": "🇱🇸",
    "region": "southern-africa",
    "capital": "Maseru",
    "lat": -29.31,
    "lng": 27.48,
    "currency": "LSL"
  },
  {
    "code": "NA",
    "iso3": "NAM",
    "name": "Namibia",
    "flag": "🇳🇦",
    "region": "southern-africa",
    "capital": "Windhoek",
    "lat": -22.56,
    "lng": 17.08,
    "currency": "NAD"
  },
  {
    "code": "ZA",
    "iso3": "ZAF",
    "name": {
      "de": "Südafrika",
      "en": "South Africa",
      "fr": "Afrique du Sud"
    },
    "flag": "🇿🇦",
    "region": "southern-africa",
    "capital": "Pretoria",
    "lat": -25.75,
    "lng": 28.19,
    "currency": "ZAR"
  },
  {
    "code": "CA",
    "iso3": "CAN",
    "name": {
      "de": "Kanada",
      "en": "Canada",
      "fr": "Canada"
    },
    "flag": "🇨🇦",
    "region": "north-america",
    "capital": "Ottawa",
    "lat": 45.42,
    "lng": -75.7,
    "currency": "CAD"
  },
  {
    "code": "US",
    "iso3": "USA",
    "name": {
      "de": "Vereinigte Staaten",
      "en": "United States",
      "fr": "États-Unis"
    },
    "flag": "🇺🇸",
    "region": "north-america",
    "capital": "Washington, D.C.",
    "lat": 38.9,
    "lng": -77.04,
    "currency": "USD"
  },
  {
    "code": "MX",
    "iso3": "MEX",
    "name": {
      "de": "Mexiko",
      "en": "Mexico",
      "fr": "Mexique"
    },
    "flag": "🇲🇽",
    "region": "north-america",
    "capital": "Mexico City",
    "lat": 19.43,
    "lng": -99.13,
    "currency": "MXN"
  },
  {
    "code": "BZ",
    "iso3": "BLZ",
    "name": "Belize",
    "flag": "🇧🇿",
    "region": "central-america",
    "capital": "Belmopan",
    "lat": 17.25,
    "lng": -88.77,
    "currency": "BZD"
  },
  {
    "code": "CR",
    "iso3": "CRI",
    "name": "Costa Rica",
    "flag": "🇨🇷",
    "region": "central-america",
    "capital": "San José",
    "lat": 9.93,
    "lng": -84.08,
    "currency": "CRC"
  },
  {
    "code": "SV",
    "iso3": "SLV",
    "name": "El Salvador",
    "flag": "🇸🇻",
    "region": "central-america",
    "capital": "San Salvador",
    "lat": 13.69,
    "lng": -89.22,
    "currency": "USD"
  },
  {
    "code": "GT",
    "iso3": "GTM",
    "name": "Guatemala",
    "flag": "🇬🇹",
    "region": "central-america",
    "capital": "Guatemala City",
    "lat": 14.63,
    "lng": -90.51,
    "currency": "GTQ"
  },
  {
    "code": "HN",
    "iso3": "HND",
    "name": "Honduras",
    "flag": "🇭🇳",
    "region": "central-america",
    "capital": "Tegucigalpa",
    "lat": 14.07,
    "lng": -87.19,
    "currency": "HNL"
  },
  {
    "code": "NI",
    "iso3": "NIC",
    "name": "Nicaragua",
    "flag": "🇳🇮",
    "region": "central-america",
    "capital": "Managua",
    "lat": 12.11,
    "lng": -86.24,
    "currency": "NIO"
  },
  {
    "code": "PA",
    "iso3": "PAN",
    "name": "Panama",
    "flag": "🇵🇦",
    "region": "central-america",
    "capital": "Panama City",
    "lat": 8.98,
    "lng": -79.52,
    "currency": "PAB"
  },
  {
    "code": "AG",
    "iso3": "ATG",
    "name": "Antigua and Barbuda",
    "flag": "🇦🇬",
    "region": "caribbean",
    "capital": "St. John's",
    "lat": 17.12,
    "lng": -61.85,
    "currency": "XCD"
  },
  {
    "code": "BS",
    "iso3": "BHS",
    "name": "Bahamas",
    "flag": "🇧🇸",
    "region": "caribbean",
    "capital": "Nassau",
    "lat": 25.06,
    "lng": -77.35,
    "currency": "BSD"
  },
  {
    "code": "BB",
    "iso3": "BRB",
    "name": "Barbados",
    "flag": "🇧🇧",
    "region": "caribbean",
    "capital": "Bridgetown",
    "lat": 13.1,
    "lng": -59.62,
    "currency": "BBD"
  },
  {
    "code": "CU",
    "iso3": "CUB",
    "name": "Cuba",
    "flag": "🇨🇺",
    "region": "caribbean",
    "capital": "Havana",
    "lat": 23.11,
    "lng": -82.37,
    "currency": "CUP"
  },
  {
    "code": "DM",
    "iso3": "DMA",
    "name": "Dominica",
    "flag": "🇩🇲",
    "region": "caribbean",
    "capital": "Roseau",
    "lat": 15.3,
    "lng": -61.39,
    "currency": "XCD"
  },
  {
    "code": "DO",
    "iso3": "DOM",
    "name": "Dominican Republic",
    "flag": "🇩🇴",
    "region": "caribbean",
    "capital": "Santo Domingo",
    "lat": 18.49,
    "lng": -69.93,
    "currency": "DOP"
  },
  {
    "code": "GD",
    "iso3": "GRD",
    "name": "Grenada",
    "flag": "🇬🇩",
    "region": "caribbean",
    "capital": "St. George's",
    "lat": 12.06,
    "lng": -61.75,
    "currency": "XCD"
  },
  {
    "code": "HT",
    "iso3": "HTI",
    "name": "Haiti",
    "flag": "🇭🇹",
    "region": "caribbean",
    "capital": "Port-au-Prince",
    "lat": 18.59,
    "lng": -72.31,
    "currency": "HTG"
  },
  {
    "code": "JM",
    "iso3": "JAM",
    "name": "Jamaica",
    "flag": "🇯🇲",
    "region": "caribbean",
    "capital": "Kingston",
    "lat": 18.01,
    "lng": -76.79,
    "currency": "JMD"
  },
  {
    "code": "KN",
    "iso3": "KNA",
    "name": "Saint Kitts and Nevis",
    "flag": "🇰🇳",
    "region": "caribbean",
    "capital": "Basseterre",
    "lat": 17.3,
    "lng": -62.72,
    "currency": "XCD"
  },
  {
    "code": "LC",
    "iso3": "LCA",
    "name": "Saint Lucia",
    "flag": "🇱🇨",
    "region": "caribbean",
    "capital": "Castries",
    "lat": 14.01,
    "lng": -60.99,
    "currency": "XCD"
  },
  {
    "code": "VC",
    "iso3": "VCT",
    "name": "Saint Vincent and the Grenadines",
    "flag": "🇻🇨",
    "region": "caribbean",
    "capital": "Kingstown",
    "lat": 13.16,
    "lng": -61.22,
    "currency": "XCD"
  },
  {
    "code": "TT",
    "iso3": "TTO",
    "name": "Trinidad and Tobago",
    "flag": "🇹🇹",
    "region": "caribbean",
    "capital": "Port of Spain",
    "lat": 10.65,
    "lng": -61.5,
    "currency": "TTD"
  },
  {
    "code": "AR",
    "iso3": "ARG",
    "name": "Argentina",
    "flag": "🇦🇷",
    "region": "south-america",
    "capital": "Buenos Aires",
    "lat": -34.6,
    "lng": -58.38,
    "currency": "ARS"
  },
  {
    "code": "BO",
    "iso3": "BOL",
    "name": "Bolivia",
    "flag": "🇧🇴",
    "region": "south-america",
    "capital": "Sucre",
    "lat": -19.03,
    "lng": -65.26,
    "currency": "BOB"
  },
  {
    "code": "BR",
    "iso3": "BRA",
    "name": {
      "de": "Brasilien",
      "en": "Brazil",
      "fr": "Brésil"
    },
    "flag": "🇧🇷",
    "region": "south-america",
    "capital": "Brasília",
    "lat": -15.79,
    "lng": -47.88,
    "currency": "BRL"
  },
  {
    "code": "CL",
    "iso3": "CHL",
    "name": "Chile",
    "flag": "🇨🇱",
    "region": "south-america",
    "capital": "Santiago",
    "lat": -33.45,
    "lng": -70.67,
    "currency": "CLP"
  },
  {
    "code": "CO",
    "iso3": "COL",
    "name": "Colombia",
    "flag": "🇨🇴",
    "region": "south-america",
    "capital": "Bogotá",
    "lat": 4.71,
    "lng": -74.07,
    "currency": "COP"
  },
  {
    "code": "EC",
    "iso3": "ECU",
    "name": "Ecuador",
    "flag": "🇪🇨",
    "region": "south-america",
    "capital": "Quito",
    "lat": -0.18,
    "lng": -78.47,
    "currency": "USD"
  },
  {
    "code": "GY",
    "iso3": "GUY",
    "name": "Guyana",
    "flag": "🇬🇾",
    "region": "south-america",
    "capital": "Georgetown",
    "lat": 6.8,
    "lng": -58.16,
    "currency": "GYD"
  },
  {
    "code": "PY",
    "iso3": "PRY",
    "name": "Paraguay",
    "flag": "🇵🇾",
    "region": "south-america",
    "capital": "Asunción",
    "lat": -25.26,
    "lng": -57.58,
    "currency": "PYG"
  },
  {
    "code": "PE",
    "iso3": "PER",
    "name": "Peru",
    "flag": "🇵🇪",
    "region": "south-america",
    "capital": "Lima",
    "lat": -12.05,
    "lng": -77.04,
    "currency": "PEN"
  },
  {
    "code": "SR",
    "iso3": "SUR",
    "name": "Suriname",
    "flag": "🇸🇷",
    "region": "south-america",
    "capital": "Paramaribo",
    "lat": 5.85,
    "lng": -55.2,
    "currency": "SRD"
  },
  {
    "code": "UY",
    "iso3": "URY",
    "name": "Uruguay",
    "flag": "🇺🇾",
    "region": "south-america",
    "capital": "Montevideo",
    "lat": -34.9,
    "lng": -56.16,
    "currency": "UYU"
  },
  {
    "code": "VE",
    "iso3": "VEN",
    "name": "Venezuela",
    "flag": "🇻🇪",
    "region": "south-america",
    "capital": "Caracas",
    "lat": 10.49,
    "lng": -66.88,
    "currency": "VES"
  },
  {
    "code": "AT",
    "iso3": "AUT",
    "name": {
      "de": "Österreich",
      "en": "Austria",
      "fr": "Autriche"
    },
    "flag": "🇦🇹",
    "region": "western-europe",
    "capital": "Vienna",
    "lat": 48.21,
    "lng": 16.37,
    "currency": "EUR"
  },
  {
    "code": "BE",
    "iso3": "BEL",
    "name": {
      "de": "Belgien",
      "en": "Belgium",
      "fr": "Belgique"
    },
    "flag": "🇧🇪",
    "region": "western-europe",
    "capital": "Brussels",
    "lat": 50.85,
    "lng": 4.35,
    "currency": "EUR"
  },
  {
    "code": "FR",
    "iso3": "FRA",
    "name": {
      "de": "Frankreich",
      "en": "France",
      "fr": "France"
    },
    "flag": "🇫🇷",
    "region": "western-europe",
    "capital": "Paris",
    "lat": 48.86,
    "lng": 2.35,
    "currency": "EUR"
  },
  {
    "code": "DE",
    "iso3": "DEU",
    "name": {
      "de": "Deutschland",
      "en": "Germany",
      "fr": "Allemagne"
    },
    "flag": "🇩🇪",
    "region": "western-europe",
    "capital": "Berlin",
    "lat": 52.52,
    "lng": 13.4,
    "currency": "EUR"
  },
  {
    "code": "IE",
    "iso3": "IRL",
    "name": "Ireland",
    "flag": "🇮🇪",
    "region": "western-europe",
    "capital": "Dublin",
    "lat": 53.35,
    "lng": -6.26,
    "currency": "EUR"
  },
  {
    "code": "LI",
    "iso3": "LIE",
    "name": "Liechtenstein",
    "flag": "🇱🇮",
    "region": "western-europe",
    "capital": "Vaduz",
    "lat": 47.14,
    "lng": 9.52,
    "currency": "CHF"
  },
  {
    "code": "LU",
    "iso3": "LUX",
    "name": "Luxembourg",
    "flag": "🇱🇺",
    "region": "western-europe",
    "capital": "Luxembourg",
    "lat": 49.61,
    "lng": 6.13,
    "currency": "EUR"
  },
  {
    "code": "MC",
    "iso3": "MCO",
    "name": "Monaco",
    "flag": "🇲🇨",
    "region": "western-europe",
    "capital": "Monaco",
    "lat": 43.74,
    "lng": 7.42,
    "currency": "EUR"
  },
  {
    "code": "NL",
    "iso3": "NLD",
    "name": {
      "de": "Niederlande",
      "en": "Netherlands",
      "fr": "Pays-Bas"
    },
    "flag": "🇳🇱",
    "region": "western-europe",
    "capital": "Amsterdam",
    "lat": 52.37,
    "lng": 4.9,
    "currency": "EUR"
  },
  {
    "code": "CH",
    "iso3": "CHE",
    "name": {
      "de": "Schweiz",
      "en": "Switzerland",
      "fr": "Suisse"
    },
    "flag": "🇨🇭",
    "region": "western-europe",
    "capital": "Bern",
    "lat": 46.95,
    "lng": 7.45,
    "currency": "CHF"
  },
  {
    "code": "GB",
    "iso3": "GBR",
    "name": {
      "de": "Vereinigtes Königreich",
      "en": "United Kingdom",
      "fr": "Royaume-Uni"
    },
    "flag": "🇬🇧",
    "region": "western-europe",
    "capital": "London",
    "lat": 51.51,
    "lng": -0.13,
    "currency": "GBP"
  },
  {
    "code": "DK",
    "iso3": "DNK",
    "name": "Denmark",
    "flag": "🇩🇰",
    "region": "northern-europe",
    "capital": "Copenhagen",
    "lat": 55.68,
    "lng": 12.57,
    "currency": "DKK"
  },
  {
    "code": "EE",
    "iso3": "EST",
    "name": "Estonia",
    "flag": "🇪🇪",
    "region": "northern-europe",
    "capital": "Tallinn",
    "lat": 59.44,
    "lng": 24.75,
    "currency": "EUR"
  },
  {
    "code": "FI",
    "iso3": "FIN",
    "name": "Finland",
    "flag": "🇫🇮",
    "region": "northern-europe",
    "capital": "Helsinki",
    "lat": 60.17,
    "lng": 24.94,
    "currency": "EUR"
  },
  {
    "code": "IS",
    "iso3": "ISL",
    "name": "Iceland",
    "flag": "🇮🇸",
    "region": "northern-europe",
    "capital": "Reykjavík",
    "lat": 64.15,
    "lng": -21.94,
    "currency": "ISK"
  },
  {
    "code": "LV",
    "iso3": "LVA",
    "name": "Latvia",
    "flag": "🇱🇻",
    "region": "northern-europe",
    "capital": "Riga",
    "lat": 56.95,
    "lng": 24.11,
    "currency": "EUR"
  },
  {
    "code": "LT",
    "iso3": "LTU",
    "name": "Lithuania",
    "flag": "🇱🇹",
    "region": "northern-europe",
    "capital": "Vilnius",
    "lat": 54.69,
    "lng": 25.28,
    "currency": "EUR"
  },
  {
    "code": "NO",
    "iso3": "NOR",
    "name": "Norway",
    "flag": "🇳🇴",
    "region": "northern-europe",
    "capital": "Oslo",
    "lat": 59.91,
    "lng": 10.75,
    "currency": "NOK"
  },
  {
    "code": "SE",
    "iso3": "SWE",
    "name": "Sweden",
    "flag": "🇸🇪",
    "region": "northern-europe",
    "capital": "Stockholm",
    "lat": 59.33,
    "lng": 18.07,
    "currency": "SEK"
  },
  {
    "code": "AL",
    "iso3": "ALB",
    "name": "Albania",
    "flag": "🇦🇱",
    "region": "southern-europe",
    "capital": "Tirana",
    "lat": 41.33,
    "lng": 19.82,
    "currency": "ALL"
  },
  {
    "code": "AD",
    "iso3": "AND",
    "name": "Andorra",
    "flag": "🇦🇩",
    "region": "southern-europe",
    "capital": "Andorra la Vella",
    "lat": 42.51,
    "lng": 1.52,
    "currency": "EUR"
  },
  {
    "code": "BA",
    "iso3": "BIH",
    "name": "Bosnia and Herzegovina",
    "flag": "🇧🇦",
    "region": "southern-europe",
    "capital": "Sarajevo",
    "lat": 43.86,
    "lng": 18.41,
    "currency": "BAM"
  },
  {
    "code": "HR",
    "iso3": "HRV",
    "name": "Croatia",
    "flag": "🇭🇷",
    "region": "southern-europe",
    "capital": "Zagreb",
    "lat": 45.81,
    "lng": 15.98,
    "currency": "EUR"
  },
  {
    "code": "GR",
    "iso3": "GRC",
    "name": "Greece",
    "flag": "🇬🇷",
    "region": "southern-europe",
    "capital": "Athens",
    "lat": 37.98,
    "lng": 23.73,
    "currency": "EUR"
  },
  {
    "code": "IT",
    "iso3": "ITA",
    "name": {
      "de": "Italien",
      "en": "Italy",
      "fr": "Italie"
    },
    "flag": "🇮🇹",
    "region": "southern-europe",
    "capital": "Rome",
    "lat": 41.9,
    "lng": 12.5,
    "currency": "EUR"
  },
  {
    "code": "MT",
    "iso3": "MLT",
    "name": "Malta",
    "flag": "🇲🇹",
    "region": "southern-europe",
    "capital": "Valletta",
    "lat": 35.9,
    "lng": 14.51,
    "currency": "EUR"
  },
  {
    "code": "ME",
    "iso3": "MNE",
    "name": "Montenegro",
    "flag": "🇲🇪",
    "region": "southern-europe",
    "capital": "Podgorica",
    "lat": 42.44,
    "lng": 19.26,
    "currency": "EUR"
  },
  {
    "code": "MK",
    "iso3": "MKD",
    "name": "North Macedonia",
    "flag": "🇲🇰",
    "region": "southern-europe",
    "capital": "Skopje",
    "lat": 41.99,
    "lng": 21.43,
    "currency": "MKD"
  },
  {
    "code": "PT",
    "iso3": "PRT",
    "name": "Portugal",
    "flag": "🇵🇹",
    "region": "southern-europe",
    "capital": "Lisbon",
    "lat": 38.72,
    "lng": -9.14,
    "currency": "EUR"
  },
  {
    "code": "SM",
    "iso3": "SMR",
    "name": "San Marino",
    "flag": "🇸🇲",
    "region": "southern-europe",
    "capital": "San Marino",
    "lat": 43.94,
    "lng": 12.45,
    "currency": "EUR"
  },
  {
    "code": "RS",
    "iso3": "SRB",
    "name": "Serbia",
    "flag": "🇷🇸",
    "region": "southern-europe",
    "capital": "Belgrade",
    "lat": 44.79,
    "lng": 20.45,
    "currency": "RSD"
  },
  {
    "code": "SI",
    "iso3": "SVN",
    "name": "Slovenia",
    "flag": "🇸🇮",
    "region": "southern-europe",
    "capital": "Ljubljana",
    "lat": 46.06,
    "lng": 14.51,
    "currency": "EUR"
  },
  {
    "code": "ES",
    "iso3": "ESP",
    "name": {
      "de": "Spanien",
      "en": "Spain",
      "fr": "Espagne"
    },
    "flag": "🇪🇸",
    "region": "southern-europe",
    "capital": "Madrid",
    "lat": 40.42,
    "lng": -3.7,
    "currency": "EUR"
  },
  {
    "code": "VA",
    "iso3": "VAT",
    "name": "Vatican City",
    "flag": "🇻🇦",
    "region": "southern-europe",
    "capital": "Vatican City",
    "lat": 41.9,
    "lng": 12.45,
    "currency": "EUR"
  },
  {
    "code": "BY",
    "iso3": "BLR",
    "name": "Belarus",
    "flag": "🇧🇾",
    "region": "eastern-europe",
    "capital": "Minsk",
    "lat": 53.9,
    "lng": 27.57,
    "currency": "BYN"
  },
  {
    "code": "BG",
    "iso3": "BGR",
    "name": "Bulgaria",
    "flag": "🇧🇬",
    "region": "eastern-europe",
    "capital": "Sofia",
    "lat": 42.7,
    "lng": 23.32,
    "currency": "BGN"
  },
  {
    "code": "CZ",
    "iso3": "CZE",
    "name": "Czechia",
    "flag": "🇨🇿",
    "region": "eastern-europe",
    "capital": "Prague",
    "lat": 50.08,
    "lng": 14.44,
    "currency": "CZK"
  },
  {
    "code": "HU",
    "iso3": "HUN",
    "name": "Hungary",
    "flag": "🇭🇺",
    "region": "eastern-europe",
    "capital": "Budapest",
    "lat": 47.5,
    "lng": 19.04,
    "currency": "HUF"
  },
  {
    "code": "MD",
    "iso3": "MDA",
    "name": "Moldova",
    "flag": "🇲🇩",
    "region": "eastern-europe",
    "capital": "Chișinău",
    "lat": 47.01,
    "lng": 28.86,
    "currency": "MDL"
  },
  {
    "code": "PL",
    "iso3": "POL",
    "name": {
      "de": "Polen",
      "en": "Poland",
      "fr": "Pologne"
    },
    "flag": "🇵🇱",
    "region": "eastern-europe",
    "capital": "Warsaw",
    "lat": 52.23,
    "lng": 21.01,
    "currency": "PLN"
  },
  {
    "code": "RO",
    "iso3": "ROU",
    "name": "Romania",
    "flag": "🇷🇴",
    "region": "eastern-europe",
    "capital": "Bucharest",
    "lat": 44.43,
    "lng": 26.1,
    "currency": "RON"
  },
  {
    "code": "RU",
    "iso3": "RUS",
    "name": {
      "de": "Russland",
      "en": "Russia",
      "fr": "Russie"
    },
    "flag": "🇷🇺",
    "region": "eastern-europe",
    "capital": "Moscow",
    "lat": 55.75,
    "lng": 37.62,
    "currency": "RUB"
  },
  {
    "code": "SK",
    "iso3": "SVK",
    "name": "Slovakia",
    "flag": "🇸🇰",
    "region": "eastern-europe",
    "capital": "Bratislava",
    "lat": 48.15,
    "lng": 17.11,
    "currency": "EUR"
  },
  {
    "code": "UA",
    "iso3": "UKR",
    "name": "Ukraine",
    "flag": "🇺🇦",
    "region": "eastern-europe",
    "capital": "Kyiv",
    "lat": 50.45,
    "lng": 30.52,
    "currency": "UAH"
  },
  {
    "code": "AM",
    "iso3": "ARM",
    "name": "Armenia",
    "flag": "🇦🇲",
    "region": "west-asia",
    "capital": "Yerevan",
    "lat": 40.18,
    "lng": 44.51,
    "currency": "AMD"
  },
  {
    "code": "AZ",
    "iso3": "AZE",
    "name": "Azerbaijan",
    "flag": "🇦🇿",
    "region": "west-asia",
    "capital": "Baku",
    "lat": 40.41,
    "lng": 49.87,
    "currency": "AZN"
  },
  {
    "code": "BH",
    "iso3": "BHR",
    "name": "Bahrain",
    "flag": "🇧🇭",
    "region": "west-asia",
    "capital": "Manama",
    "lat": 26.23,
    "lng": 50.59,
    "currency": "BHD"
  },
  {
    "code": "CY",
    "iso3": "CYP",
    "name": "Cyprus",
    "flag": "🇨🇾",
    "region": "west-asia",
    "capital": "Nicosia",
    "lat": 35.17,
    "lng": 33.36,
    "currency": "EUR"
  },
  {
    "code": "GE",
    "iso3": "GEO",
    "name": "Georgia",
    "flag": "🇬🇪",
    "region": "west-asia",
    "capital": "Tbilisi",
    "lat": 41.72,
    "lng": 44.79,
    "currency": "GEL"
  },
  {
    "code": "IR",
    "iso3": "IRN",
    "name": "Iran",
    "flag": "🇮🇷",
    "region": "west-asia",
    "capital": "Tehran",
    "lat": 35.69,
    "lng": 51.39,
    "currency": "IRR"
  },
  {
    "code": "IQ",
    "iso3": "IRQ",
    "name": "Iraq",
    "flag": "🇮🇶",
    "region": "west-asia",
    "capital": "Baghdad",
    "lat": 33.32,
    "lng": 44.36,
    "currency": "IQD"
  },
  {
    "code": "IL",
    "iso3": "ISR",
    "name": "Israel",
    "flag": "🇮🇱",
    "region": "west-asia",
    "capital": "Jerusalem",
    "lat": 31.77,
    "lng": 35.21,
    "currency": "ILS"
  },
  {
    "code": "JO",
    "iso3": "JOR",
    "name": "Jordan",
    "flag": "🇯🇴",
    "region": "west-asia",
    "capital": "Amman",
    "lat": 31.95,
    "lng": 35.93,
    "currency": "JOD"
  },
  {
    "code": "KW",
    "iso3": "KWT",
    "name": "Kuwait",
    "flag": "🇰🇼",
    "region": "west-asia",
    "capital": "Kuwait City",
    "lat": 29.38,
    "lng": 47.99,
    "currency": "KWD"
  },
  {
    "code": "LB",
    "iso3": "LBN",
    "name": "Lebanon",
    "flag": "🇱🇧",
    "region": "west-asia",
    "capital": "Beirut",
    "lat": 33.89,
    "lng": 35.5,
    "currency": "LBP"
  },
  {
    "code": "OM",
    "iso3": "OMN",
    "name": "Oman",
    "flag": "🇴🇲",
    "region": "west-asia",
    "capital": "Muscat",
    "lat": 23.59,
    "lng": 58.38,
    "currency": "OMR"
  },
  {
    "code": "PS",
    "iso3": "PSE",
    "name": "Palestine",
    "flag": "🇵🇸",
    "region": "west-asia",
    "capital": "Ramallah",
    "lat": 31.9,
    "lng": 35.2,
    "currency": "ILS"
  },
  {
    "code": "QA",
    "iso3": "QAT",
    "name": "Qatar",
    "flag": "🇶🇦",
    "region": "west-asia",
    "capital": "Doha",
    "lat": 25.29,
    "lng": 51.53,
    "currency": "QAR"
  },
  {
    "code": "SA",
    "iso3": "SAU",
    "name": {
      "de": "Saudi-Arabien",
      "en": "Saudi Arabia",
      "fr": "Arabie saoudite"
    },
    "flag": "🇸🇦",
    "region": "west-asia",
    "capital": "Riyadh",
    "lat": 24.71,
    "lng": 46.68,
    "currency": "SAR"
  },
  {
    "code": "SY",
    "iso3": "SYR",
    "name": "Syria",
    "flag": "🇸🇾",
    "region": "west-asia",
    "capital": "Damascus",
    "lat": 33.51,
    "lng": 36.29,
    "currency": "SYP"
  },
  {
    "code": "TR",
    "iso3": "TUR",
    "name": {
      "de": "Türkei",
      "en": "Turkey",
      "fr": "Turquie"
    },
    "flag": "🇹🇷",
    "region": "west-asia",
    "capital": "Ankara",
    "lat": 39.93,
    "lng": 32.86,
    "currency": "TRY"
  },
  {
    "code": "AE",
    "iso3": "ARE",
    "name": {
      "de": "Vereinigte Arabische Emirate",
      "en": "United Arab Emirates",
      "fr": "Émirats arabes unis"
    },
    "flag": "🇦🇪",
    "region": "west-asia",
    "capital": "Abu Dhabi",
    "lat": 24.45,
    "lng": 54.38,
    "currency": "AED"
  },
  {
    "code": "YE",
    "iso3": "YEM",
    "name": "Yemen",
    "flag": "🇾🇪",
    "region": "west-asia",
    "capital": "Sana'a",
    "lat": 15.37,
    "lng": 44.19,
    "currency": "YER"
  },
  {
    "code": "KZ",
    "iso3": "KAZ",
    "name": "Kazakhstan",
    "flag": "🇰🇿",
    "region": "central-asia",
    "capital": "Astana",
    "lat": 51.17,
    "lng": 71.45,
    "currency": "KZT"
  },
  {
    "code": "KG",
    "iso3": "KGZ",
    "name": "Kyrgyzstan",
    "flag": "🇰🇬",
    "region": "central-asia",
    "capital": "Bishkek",
    "lat": 42.87,
    "lng": 74.59,
    "currency": "KGS"
  },
  {
    "code": "TJ",
    "iso3": "TJK",
    "name": "Tajikistan",
    "flag": "🇹🇯",
    "region": "central-asia",
    "capital": "Dushanbe",
    "lat": 38.56,
    "lng": 68.79,
    "currency": "TJS"
  },
  {
    "code": "TM",
    "iso3": "TKM",
    "name": "Turkmenistan",
    "flag": "🇹🇲",
    "region": "central-asia",
    "capital": "Ashgabat",
    "lat": 37.95,
    "lng": 58.38,
    "currency": "TMT"
  },
  {
    "code": "UZ",
    "iso3": "UZB",
    "name": "Uzbekistan",
    "flag": "🇺🇿",
    "region": "central-asia",
    "capital": "Tashkent",
    "lat": 41.3,
    "lng": 69.24,
    "currency": "UZS"
  },
  {
    "code": "AF",
    "iso3": "AFG",
    "name": "Afghanistan",
    "flag": "🇦🇫",
    "region": "south-asia",
    "capital": "Kabul",
    "lat": 34.53,
    "lng": 69.17,
    "currency": "AFN"
  },
  {
    "code": "BD",
    "iso3": "BGD",
    "name": "Bangladesh",
    "flag": "🇧🇩",
    "region": "south-asia",
    "capital": "Dhaka",
    "lat": 23.81,
    "lng": 90.41,
    "currency": "BDT"
  },
  {
    "code": "BT",
    "iso3": "BTN",
    "name": "Bhutan",
    "flag": "🇧🇹",
    "region": "south-asia",
    "capital": "Thimphu",
    "lat": 27.47,
    "lng": 89.64,
    "currency": "BTN"
  },
  {
    "code": "IN",
    "iso3": "IND",
    "name": {
      "de": "Indien",
      "en": "India",
      "fr": "Inde"
    },
    "flag": "🇮🇳",
    "region": "south-asia",
    "capital": "New Delhi",
    "lat": 28.61,
    "lng": 77.21,
    "currency": "INR"
  },
  {
    "code": "MV",
    "iso3": "MDV",
    "name": "Maldives",
    "flag": "🇲🇻",
    "region": "south-asia",
    "capital": "Malé",
    "lat": 4.17,
    "lng": 73.51,
    "currency": "MVR"
  },
  {
    "code": "NP",
    "iso3": "NPL",
    "name": "Nepal",
    "flag": "🇳🇵",
    "region": "south-asia",
    "capital": "Kathmandu",
    "lat": 27.72,
    "lng": 85.32,
    "currency": "NPR"
  },
  {
    "code": "PK",
    "iso3": "PAK",
    "name": "Pakistan",
    "flag": "🇵🇰",
    "region": "south-asia",
    "capital": "Islamabad",
    "lat": 33.69,
    "lng": 73.06,
    "currency": "PKR"
  },
  {
    "code": "LK",
    "iso3": "LKA",
    "name": "Sri Lanka",
    "flag": "🇱🇰",
    "region": "south-asia",
    "capital": "Colombo",
    "lat": 6.93,
    "lng": 79.85,
    "currency": "LKR"
  },
  {
    "code": "CN",
    "iso3": "CHN",
    "name": {
      "de": "China",
      "en": "China",
      "fr": "Chine"
    },
    "flag": "🇨🇳",
    "region": "east-asia",
    "capital": "Beijing",
    "lat": 39.9,
    "lng": 116.41,
    "currency": "CNY"
  },
  {
    "code": "JP",
    "iso3": "JPN",
    "name": {
      "de": "Japan",
      "en": "Japan",
      "fr": "Japon"
    },
    "flag": "🇯🇵",
    "region": "east-asia",
    "capital": "Tokyo",
    "lat": 35.68,
    "lng": 139.69,
    "currency": "JPY"
  },
  {
    "code": "MN",
    "iso3": "MNG",
    "name": "Mongolia",
    "flag": "🇲🇳",
    "region": "east-asia",
    "capital": "Ulaanbaatar",
    "lat": 47.89,
    "lng": 106.91,
    "currency": "MNT"
  },
  {
    "code": "KP",
    "iso3": "PRK",
    "name": "North Korea",
    "flag": "🇰🇵",
    "region": "east-asia",
    "capital": "Pyongyang",
    "lat": 39.04,
    "lng": 125.76,
    "currency": "KPW"
  },
  {
    "code": "KR",
    "iso3": "KOR",
    "name": "South Korea",
    "flag": "🇰🇷",
    "region": "east-asia",
    "capital": "Seoul",
    "lat": 37.57,
    "lng": 126.98,
    "currency": "KRW"
  },
  {
    "code": "TW",
    "iso3": "TWN",
    "name": "Taiwan",
    "flag": "🇹🇼",
    "region": "east-asia",
    "capital": "Taipei",
    "lat": 25.03,
    "lng": 121.57,
    "currency": "TWD"
  },
  {
    "code": "BN",
    "iso3": "BRN",
    "name": "Brunei",
    "flag": "🇧🇳",
    "region": "southeast-asia",
    "capital": "Bandar Seri Begawan",
    "lat": 4.89,
    "lng": 114.94,
    "currency": "BND"
  },
  {
    "code": "KH",
    "iso3": "KHM",
    "name": "Cambodia",
    "flag": "🇰🇭",
    "region": "southeast-asia",
    "capital": "Phnom Penh",
    "lat": 11.56,
    "lng": 104.92,
    "currency": "KHR"
  },
  {
    "code": "ID",
    "iso3": "IDN",
    "name": "Indonesia",
    "flag": "🇮🇩",
    "region": "southeast-asia",
    "capital": "Jakarta",
    "lat": -6.21,
    "lng": 106.85,
    "currency": "IDR"
  },
  {
    "code": "LA",
    "iso3": "LAO",
    "name": "Laos",
    "flag": "🇱🇦",
    "region": "southeast-asia",
    "capital": "Vientiane",
    "lat": 17.97,
    "lng": 102.6,
    "currency": "LAK"
  },
  {
    "code": "MY",
    "iso3": "MYS",
    "name": "Malaysia",
    "flag": "🇲🇾",
    "region": "southeast-asia",
    "capital": "Kuala Lumpur",
    "lat": 3.14,
    "lng": 101.69,
    "currency": "MYR"
  },
  {
    "code": "MM",
    "iso3": "MMR",
    "name": "Myanmar",
    "flag": "🇲🇲",
    "region": "southeast-asia",
    "capital": "Naypyidaw",
    "lat": 19.76,
    "lng": 96.08,
    "currency": "MMK"
  },
  {
    "code": "PH",
    "iso3": "PHL",
    "name": "Philippines",
    "flag": "🇵🇭",
    "region": "southeast-asia",
    "capital": "Manila",
    "lat": 14.6,
    "lng": 120.98,
    "currency": "PHP"
  },
  {
    "code": "SG",
    "iso3": "SGP",
    "name": "Singapore",
    "flag": "🇸🇬",
    "region": "southeast-asia",
    "capital": "Singapore",
    "lat": 1.35,
    "lng": 103.82,
    "currency": "SGD"
  },
  {
    "code": "TH",
    "iso3": "THA",
    "name": "Thailand",
    "flag": "🇹🇭",
    "region": "southeast-asia",
    "capital": "Bangkok",
    "lat": 13.76,
    "lng": 100.5,
    "currency": "THB"
  },
  {
    "code": "TL",
    "iso3": "TLS",
    "name": "Timor-Leste",
    "flag": "🇹🇱",
    "region": "southeast-asia",
    "capital": "Dili",
    "lat": -8.56,
    "lng": 125.56,
    "currency": "USD"
  },
  {
    "code": "VN",
    "iso3": "VNM",
    "name": "Vietnam",
    "flag": "🇻🇳",
    "region": "southeast-asia",
    "capital": "Hanoi",
    "lat": 21.03,
    "lng": 105.85,
    "currency": "VND"
  },
  {
    "code": "AU",
    "iso3": "AUS",
    "name": "Australia",
    "flag": "🇦🇺",
    "region": "oceania",
    "capital": "Canberra",
    "lat": -35.28,
    "lng": 149.13,
    "currency": "AUD"
  },
  {
    "code": "FJ",
    "iso3": "FJI",
    "name": "Fiji",
    "flag": "🇫🇯",
    "region": "oceania",
    "capital": "Suva",
    "lat": -18.14,
    "lng": 178.44,
    "currency": "FJD"
  },
  {
    "code": "KI",
    "iso3": "KIR",
    "name": "Kiribati",
    "flag": "🇰🇮",
    "region": "oceania",
    "capital": "Tarawa",
    "lat": 1.33,
    "lng": 172.98,
    "currency": "AUD"
  },
  {
    "code": "MH",
    "iso3": "MHL",
    "name": "Marshall Islands",
    "flag": "🇲🇭",
    "region": "oceania",
    "capital": "Majuro",
    "lat": 7.09,
    "lng": 171.38,
    "currency": "USD"
  },
  {
    "code": "FM",
    "iso3": "FSM",
    "name": "Micronesia",
    "flag": "🇫🇲",
    "region": "oceania",
    "capital": "Palikir",
    "lat": 6.92,
    "lng": 158.16,
    "currency": "USD"
  },
  {
    "code": "NR",
    "iso3": "NRU",
    "name": "Nauru",
    "flag": "🇳🇷",
    "region": "oceania",
    "capital": "Yaren",
    "lat": -0.55,
    "lng": 166.92,
    "currency": "AUD"
  },
  {
    "code": "NZ",
    "iso3": "NZL",
    "name": "New Zealand",
    "flag": "🇳🇿",
    "region": "oceania",
    "capital": "Wellington",
    "lat": -41.29,
    "lng": 174.78,
    "currency": "NZD"
  },
  {
    "code": "PW",
    "iso3": "PLW",
    "name": "Palau",
    "flag": "🇵🇼",
    "region": "oceania",
    "capital": "Ngerulmud",
    "lat": 7.5,
    "lng": 134.62,
    "currency": "USD"
  },
  {
    "code": "PG",
    "iso3": "PNG",
    "name": "Papua New Guinea",
    "flag": "🇵🇬",
    "region": "oceania",
    "capital": "Port Moresby",
    "lat": -9.44,
    "lng": 147.18,
    "currency": "PGK"
  },
  {
    "code": "WS",
    "iso3": "WSM",
    "name": "Samoa",
    "flag": "🇼🇸",
    "region": "oceania",
    "capital": "Apia",
    "lat": -13.83,
    "lng": -171.77,
    "currency": "WST"
  },
  {
    "code": "SB",
    "iso3": "SLB",
    "name": "Solomon Islands",
    "flag": "🇸🇧",
    "region": "oceania",
    "capital": "Honiara",
    "lat": -9.43,
    "lng": 159.95,
    "currency": "SBD"
  },
  {
    "code": "TO",
    "iso3": "TON",
    "name": "Tonga",
    "flag": "🇹🇴",
    "region": "oceania",
    "capital": "Nuku'alofa",
    "lat": -21.14,
    "lng": -175.2,
    "currency": "TOP"
  },
  {
    "code": "TV",
    "iso3": "TUV",
    "name": "Tuvalu",
    "flag": "🇹🇻",
    "region": "oceania",
    "capital": "Funafuti",
    "lat": -8.52,
    "lng": 179.2,
    "currency": "AUD"
  },
  {
    "code": "VU",
    "iso3": "VUT",
    "name": "Vanuatu",
    "flag": "🇻🇺",
    "region": "oceania",
    "capital": "Port Vila",
    "lat": -17.73,
    "lng": 168.32,
    "currency": "VUV"
  }
],

  /* ---- Ausführlich gepflegte Prozesse (Muster-Länder) -------------------- */
  processes: {
  "TG": {
    "status": "complete",
    "authority": {
      "de": "Office Togolais des Recettes (OTR) – Zollverwaltung",
      "en": "Togolese Revenue Authority (OTR) – Customs",
      "fr": "Office Togolais des Recettes (OTR) – Douanes"
    },
    "leadtime": {
      "de": "Seefracht ab EU ~14–25 Tage + 3–7 Tage Verzollung",
      "en": "Sea freight from EU ~14–25 days + 3–7 days clearance",
      "fr": "Fret maritime depuis UE ~14–25 jours + 3–7 jours dédouanement"
    },
    "notes": [
      {
        "de": "BSC/ECTN (Bordereau de Suivi des Cargaisons) ist VOR Verschiffung zwingend – ohne validierten BSC keine Löschung im Hafen Lomé.",
        "en": "BSC/ECTN cargo tracking note is mandatory BEFORE shipment – no BSC, no discharge at the Port of Lomé.",
        "fr": "Le BSC/ECTN est obligatoire AVANT expédition – sans BSC validé, pas de déchargement au Port de Lomé."
      },
      {
        "de": "Lomé ist Transit-Hub für Burkina Faso, Niger, Mali – bei Transitware Korridor-/Begleitpapiere beachten.",
        "en": "Lomé is a transit hub for Burkina Faso, Niger, Mali – for transit goods mind corridor/escort documents.",
        "fr": "Lomé est un hub de transit pour le Burkina, Niger, Mali – prévoir les documents de corridor pour le transit."
      },
      {
        "de": "Werte in XOF, Einfuhrabgaben nach CEDEAO/UEMOA-Außenzolltarif (TEC).",
        "en": "Values in XOF, import duties per ECOWAS/UEMOA common external tariff (CET).",
        "fr": "Valeurs en XOF, droits selon le tarif extérieur commun CEDEAO/UEMOA (TEC)."
      }
    ],
    "import": {
      "summary": {
        "de": "Standardablauf Seefracht-Import über den Hafen Lomé.",
        "en": "Standard sea-freight import via the Port of Lomé.",
        "fr": "Procédure standard import maritime via le Port de Lomé."
      },
      "steps": [
        {
          "icon": "📝",
          "title": {
            "de": "Kaufvertrag & Proforma",
            "en": "Sales contract & proforma",
            "fr": "Contrat & proforma"
          },
          "desc": {
            "de": "Bestellung bestätigen, Incoterm (z.B. CIF Lomé) und Zahlungsart fixieren.",
            "en": "Confirm order, fix Incoterm (e.g. CIF Lomé) and payment terms.",
            "fr": "Confirmer la commande, fixer l’Incoterm (ex. CIF Lomé) et le paiement."
          },
          "docs": [
            {
              "de": "Proforma-Rechnung",
              "en": "Proforma invoice",
              "fr": "Facture proforma"
            },
            {
              "de": "Auftragsbestätigung",
              "en": "Order confirmation",
              "fr": "Confirmation de commande"
            }
          ],
          "warn": null
        },
        {
          "icon": "🧾",
          "title": {
            "de": "Handelsdokumente erstellen",
            "en": "Prepare trade documents",
            "fr": "Documents commerciaux"
          },
          "desc": {
            "de": "Handelsrechnung, Packliste und Ursprungszeugnis vorbereiten.",
            "en": "Prepare commercial invoice, packing list and certificate of origin.",
            "fr": "Préparer facture commerciale, liste de colisage et certificat d’origine."
          },
          "docs": [
            {
              "de": "Handelsrechnung",
              "en": "Commercial invoice",
              "fr": "Facture commerciale"
            },
            {
              "de": "Packliste",
              "en": "Packing list",
              "fr": "Liste de colisage"
            },
            {
              "de": "Ursprungszeugnis",
              "en": "Certificate of origin",
              "fr": "Certificat d’origine"
            }
          ],
          "warn": null
        },
        {
          "icon": "📑",
          "title": {
            "de": "BSC / ECTN beantragen",
            "en": "Apply for BSC / ECTN",
            "fr": "Demande BSC / ECTN"
          },
          "desc": {
            "de": "BSC online beantragen und VOR Abfahrt des Schiffs validieren lassen.",
            "en": "Apply for the BSC online and have it validated BEFORE vessel departure.",
            "fr": "Demander le BSC en ligne et le faire valider AVANT le départ du navire."
          },
          "docs": [
            {
              "de": "Entwurf-B/L",
              "en": "Draft B/L",
              "fr": "B/L provisoire"
            },
            {
              "de": "Handelsrechnung",
              "en": "Commercial invoice",
              "fr": "Facture commerciale"
            },
            {
              "de": "Fracht-/Freight-Nachweis",
              "en": "Freight invoice",
              "fr": "Facture de fret"
            }
          ],
          "warn": {
            "de": "Validierung NACH Abfahrt verursacht Strafzuschläge.",
            "en": "Validation AFTER departure triggers penalties.",
            "fr": "Une validation APRÈS départ entraîne des pénalités."
          }
        },
        {
          "icon": "🚢",
          "title": {
            "de": "Verschiffung & Transportpapiere",
            "en": "Shipment & transport docs",
            "fr": "Expédition & transport"
          },
          "desc": {
            "de": "Reederei bucht; B/L mit BSC-Nummer ausstellen lassen.",
            "en": "Carrier books; issue B/L showing the BSC number.",
            "fr": "Réservation; émettre le B/L mentionnant le numéro BSC."
          },
          "docs": [
            {
              "de": "Konnossement (B/L)",
              "en": "Bill of Lading",
              "fr": "Connaissement (B/L)"
            },
            {
              "de": "Versicherungspolice",
              "en": "Insurance certificate",
              "fr": "Police d’assurance"
            }
          ],
          "warn": null
        },
        {
          "icon": "🏛️",
          "title": {
            "de": "Einfuhrzollanmeldung",
            "en": "Import customs declaration",
            "fr": "Déclaration en douane"
          },
          "desc": {
            "de": "Über zugelassenen Spediteur/Commissionnaire die Anmeldung im OTR-System abgeben.",
            "en": "File the declaration in the OTR system via a licensed broker.",
            "fr": "Déposer la déclaration dans le système OTR via un commissionnaire agréé."
          },
          "docs": [
            {
              "de": "Vollständiges Dokumentenset",
              "en": "Full document set",
              "fr": "Dossier complet"
            },
            {
              "de": "BSC-Validierung",
              "en": "BSC validation",
              "fr": "Validation BSC"
            }
          ],
          "warn": null
        },
        {
          "icon": "💶",
          "title": {
            "de": "Abgaben zahlen",
            "en": "Pay duties & taxes",
            "fr": "Paiement des droits"
          },
          "desc": {
            "de": "Zoll, MwSt und Gebühren laut Bescheid begleichen.",
            "en": "Pay duties, VAT and fees as assessed.",
            "fr": "Régler droits, TVA et redevances selon liquidation."
          },
          "docs": [],
          "warn": null
        },
        {
          "icon": "🔍",
          "title": {
            "de": "Kontrolle & Freigabe",
            "en": "Inspection & release",
            "fr": "Contrôle & mainlevée"
          },
          "desc": {
            "de": "Ggf. Scanner/physische Kontrolle, danach Freigabe (Bon à enlever).",
            "en": "Possible scan/physical inspection, then release (bon à enlever).",
            "fr": "Scan/contrôle physique éventuel, puis mainlevée (bon à enlever)."
          },
          "docs": [],
          "warn": null
        },
        {
          "icon": "🚚",
          "title": {
            "de": "Auslieferung",
            "en": "Delivery",
            "fr": "Livraison"
          },
          "desc": {
            "de": "Container abholen, Demurrage vermeiden, zustellen.",
            "en": "Pick up container, avoid demurrage, deliver.",
            "fr": "Enlever le conteneur, éviter les surestaries, livrer."
          },
          "docs": [],
          "warn": null
        }
      ]
    },
    "export": {
      "summary": {
        "de": "Export aus Togo (z.B. Agrarrohstoffe) über Lomé.",
        "en": "Export from Togo (e.g. agricultural commodities) via Lomé.",
        "fr": "Export depuis le Togo (ex. matières agricoles) via Lomé."
      },
      "steps": [
        {
          "icon": "📝",
          "title": {
            "de": "Vertrag & Incoterm",
            "en": "Contract & Incoterm",
            "fr": "Contrat & Incoterm"
          },
          "desc": {
            "de": "Käufer, Incoterm (FOB Lomé üblich) und Zahlung fixieren.",
            "en": "Fix buyer, Incoterm (FOB Lomé common) and payment.",
            "fr": "Fixer acheteur, Incoterm (FOB Lomé fréquent) et paiement."
          },
          "docs": [],
          "warn": null
        },
        {
          "icon": "🧾",
          "title": {
            "de": "Handelsdokumente",
            "en": "Trade documents",
            "fr": "Documents commerciaux"
          },
          "desc": {
            "de": "Rechnung, Packliste, Ursprungszeugnis (CCIT) + ggf. Phytosanitär.",
            "en": "Invoice, packing list, certificate of origin (CCIT) + phytosanitary if needed.",
            "fr": "Facture, colisage, certificat d’origine (CCIT) + phytosanitaire si besoin."
          },
          "docs": [
            {
              "de": "Ursprungszeugnis",
              "en": "Certificate of origin",
              "fr": "Certificat d’origine"
            },
            {
              "de": "Pflanzengesundheitszeugnis",
              "en": "Phytosanitary certificate",
              "fr": "Certificat phytosanitaire"
            }
          ],
          "warn": null
        },
        {
          "icon": "🏛️",
          "title": {
            "de": "Ausfuhranmeldung",
            "en": "Export declaration",
            "fr": "Déclaration d’exportation"
          },
          "desc": {
            "de": "Ausfuhranmeldung beim OTR; Devisenzusage/Domiciliation bei Bank.",
            "en": "Export declaration at OTR; FX domiciliation at the bank.",
            "fr": "Déclaration d’export à l’OTR; domiciliation bancaire des devises."
          },
          "docs": [],
          "warn": null
        },
        {
          "icon": "🚢",
          "title": {
            "de": "Verladung & B/L",
            "en": "Loading & B/L",
            "fr": "Chargement & B/L"
          },
          "desc": {
            "de": "Ware verladen, Konnossement ausstellen.",
            "en": "Load goods, issue bill of lading.",
            "fr": "Charger, émettre le connaissement."
          },
          "docs": [
            {
              "de": "Konnossement (B/L)",
              "en": "Bill of Lading",
              "fr": "Connaissement"
            }
          ],
          "warn": null
        },
        {
          "icon": "💶",
          "title": {
            "de": "Zahlungseingang",
            "en": "Payment collection",
            "fr": "Encaissement"
          },
          "desc": {
            "de": "Akkreditiv/Überweisung abwickeln, Devisen domizilieren.",
            "en": "Settle L/C or transfer, domicile FX proceeds.",
            "fr": "Régler L/C ou virement, domicilier les devises."
          },
          "docs": [],
          "warn": null
        }
      ]
    }
  },
  "DE": {
    "status": "complete",
    "authority": {
      "de": "Generalzolldirektion / örtliches Hauptzollamt (ATLAS)",
      "en": "German Customs (ATLAS system)",
      "fr": "Douane allemande (système ATLAS)"
    },
    "leadtime": {
      "de": "Ausfuhranmeldung i.d.R. taggleich; EU-Binnenmarkt zollfrei.",
      "en": "Export declaration usually same-day; EU single market duty-free.",
      "fr": "Déclaration d’export souvent le jour même; marché unique UE sans droits."
    },
    "notes": [
      {
        "de": "Innerhalb der EU keine Zollanmeldung – nur Intrastat/USt-Meldungen.",
        "en": "Within the EU no customs declaration – only Intrastat/VAT reporting.",
        "fr": "Au sein de l’UE pas de douane – seulement Intrastat/TVA."
      },
      {
        "de": "Dual-Use/Sanktionen: Exportkontrolle (BAFA) und Embargo-/Endverbleibsprüfung beachten.",
        "en": "Dual-use/sanctions: mind export control (BAFA) and embargo/end-use checks.",
        "fr": "Double usage/sanctions: contrôle export (BAFA) et vérif. embargo/destination finale."
      },
      {
        "de": "Ausfuhr ab 1.000 € / 1.000 kg grundsätzlich elektronisch via ATLAS-Ausfuhr.",
        "en": "Exports above €1,000 / 1,000 kg generally e-filed via ATLAS export.",
        "fr": "Exports au-delà de 1 000 € / 1 000 kg via ATLAS export."
      }
    ],
    "import": {
      "summary": {
        "de": "Import in die EU über einen deutschen Eingangshafen/Flughafen.",
        "en": "Import into the EU via a German port/airport of entry.",
        "fr": "Import dans l’UE via un point d’entrée allemand."
      },
      "steps": [
        {
          "icon": "🔢",
          "title": {
            "de": "EORI & Einreihung",
            "en": "EORI & classification",
            "fr": "EORI & classement"
          },
          "desc": {
            "de": "EORI-Nummer sicherstellen, Ware in den Zolltarif (HS/TARIC) einreihen.",
            "en": "Ensure EORI number, classify goods (HS/TARIC).",
            "fr": "Vérifier l’EORI, classer la marchandise (SH/TARIC)."
          },
          "docs": [
            {
              "de": "EORI-Nummer",
              "en": "EORI number",
              "fr": "Numéro EORI"
            }
          ],
          "warn": null
        },
        {
          "icon": "🧾",
          "title": {
            "de": "Dokumente prüfen",
            "en": "Check documents",
            "fr": "Vérifier documents"
          },
          "desc": {
            "de": "Rechnung, Packliste, Ursprungsnachweis (Präferenz?), Transportpapier.",
            "en": "Invoice, packing list, proof of origin (preference?), transport doc.",
            "fr": "Facture, colisage, preuve d’origine (préférence?), titre de transport."
          },
          "docs": [
            {
              "de": "Handelsrechnung",
              "en": "Commercial invoice",
              "fr": "Facture commerciale"
            },
            {
              "de": "Präferenznachweis (EUR.1/Ursprungserkl.)",
              "en": "Preferential origin (EUR.1/decl.)",
              "fr": "Origine préférentielle (EUR.1)"
            }
          ],
          "warn": null
        },
        {
          "icon": "🏛️",
          "title": {
            "de": "Einfuhranmeldung (ATLAS)",
            "en": "Import declaration (ATLAS)",
            "fr": "Déclaration import (ATLAS)"
          },
          "desc": {
            "de": "Zollanmeldung zur Überlassung zum freien Verkehr abgeben.",
            "en": "File declaration for release into free circulation.",
            "fr": "Déposer la déclaration de mise en libre pratique."
          },
          "docs": [],
          "warn": null
        },
        {
          "icon": "💶",
          "title": {
            "de": "EUSt & Zoll",
            "en": "Import VAT & duty",
            "fr": "TVA import & droits"
          },
          "desc": {
            "de": "Einfuhrumsatzsteuer und Zoll entrichten/aufschieben.",
            "en": "Pay or defer import VAT and customs duty.",
            "fr": "Payer/différer la TVA import et les droits."
          },
          "docs": [],
          "warn": null
        },
        {
          "icon": "✅",
          "title": {
            "de": "Überlassung",
            "en": "Release",
            "fr": "Mainlevée"
          },
          "desc": {
            "de": "Nach Freigabe Ware entnehmen; Unterlagen 10 Jahre aufbewahren.",
            "en": "After release take goods; keep records 10 years.",
            "fr": "Après mainlevée, retirer; conserver 10 ans."
          },
          "docs": [],
          "warn": null
        }
      ]
    },
    "export": {
      "summary": {
        "de": "Ausfuhr aus DE/EU in ein Drittland (z.B. Westafrika).",
        "en": "Export from DE/EU to a third country (e.g. West Africa).",
        "fr": "Export depuis DE/UE vers un pays tiers (ex. Afrique de l’Ouest)."
      },
      "steps": [
        {
          "icon": "🔢",
          "title": {
            "de": "EORI & Exportkontrolle",
            "en": "EORI & export control",
            "fr": "EORI & contrôle export"
          },
          "desc": {
            "de": "EORI prüfen; Sanktions-/Dual-Use-Check (BAFA, Embargolisten).",
            "en": "Check EORI; sanctions/dual-use screening (BAFA, embargo lists).",
            "fr": "Vérifier EORI; criblage sanctions/double usage (BAFA)."
          },
          "docs": [
            {
              "de": "EORI-Nummer",
              "en": "EORI number",
              "fr": "Numéro EORI"
            },
            {
              "de": "Ggf. Ausfuhrgenehmigung",
              "en": "Export licence if required",
              "fr": "Licence si requise"
            }
          ],
          "warn": null
        },
        {
          "icon": "🧾",
          "title": {
            "de": "Exportdokumente",
            "en": "Export documents",
            "fr": "Documents export"
          },
          "desc": {
            "de": "Handelsrechnung, Packliste, Ursprungszeugnis (IHK), Präferenznachweis.",
            "en": "Commercial invoice, packing list, certificate of origin (CCI), preference proof.",
            "fr": "Facture, colisage, certificat d’origine (CCI), preuve de préférence."
          },
          "docs": [
            {
              "de": "Handelsrechnung",
              "en": "Commercial invoice",
              "fr": "Facture commerciale"
            },
            {
              "de": "Packliste",
              "en": "Packing list",
              "fr": "Liste de colisage"
            },
            {
              "de": "Ursprungszeugnis (IHK)",
              "en": "Certificate of origin (Chamber)",
              "fr": "Certificat d’origine (CCI)"
            }
          ],
          "warn": null
        },
        {
          "icon": "🏛️",
          "title": {
            "de": "ATLAS-Ausfuhranmeldung",
            "en": "ATLAS export declaration",
            "fr": "Déclaration ATLAS"
          },
          "desc": {
            "de": "Ausfuhranmeldung abgeben → MRN; Ausgangsvermerk nach Gestellung.",
            "en": "File export declaration → MRN; exit confirmation after presentation.",
            "fr": "Déposer la déclaration → MRN; certification de sortie après présentation."
          },
          "docs": [
            {
              "de": "MRN / Ausfuhrbegleitdokument (ABD)",
              "en": "MRN / Export Accompanying Doc",
              "fr": "MRN / DAE"
            }
          ],
          "warn": null
        },
        {
          "icon": "🚢",
          "title": {
            "de": "Transport & Verladung",
            "en": "Transport & loading",
            "fr": "Transport & chargement"
          },
          "desc": {
            "de": "Reederei/Spediteur buchen; ggf. BSC/ECTN des Ziellands beachten!",
            "en": "Book carrier/forwarder; mind destination BSC/ECTN if required!",
            "fr": "Réserver transitaire; prévoir BSC/ECTN du pays destinataire!"
          },
          "docs": [
            {
              "de": "Konnossement (B/L)",
              "en": "Bill of Lading",
              "fr": "Connaissement"
            }
          ],
          "warn": {
            "de": "Für viele afrik. Länder muss der BSC VOR Abfahrt validiert sein.",
            "en": "For many African countries the BSC must be validated BEFORE departure.",
            "fr": "Pour de nombreux pays africains, le BSC doit être validé AVANT le départ."
          }
        },
        {
          "icon": "📁",
          "title": {
            "de": "Nachweise sichern",
            "en": "Secure proofs",
            "fr": "Sécuriser preuves"
          },
          "desc": {
            "de": "Ausgangsvermerk für USt-Befreiung archivieren (10 Jahre).",
            "en": "Archive exit note for VAT exemption (10 years).",
            "fr": "Archiver la certification de sortie pour l’exonération TVA (10 ans)."
          },
          "docs": [],
          "warn": null
        }
      ]
    }
  },
  "NG": {
    "status": "complete",
    "authority": {
      "de": "Nigeria Customs Service (NCS) / NAFDAC / SON",
      "en": "Nigeria Customs Service (NCS) / NAFDAC / SON",
      "fr": "Nigeria Customs Service (NCS) / NAFDAC / SON"
    },
    "leadtime": {
      "de": "Form M & PAAR vor Verschiffung – Vorlauf 1–3 Wochen einplanen.",
      "en": "Form M & PAAR before shipment – allow 1–3 weeks lead time.",
      "fr": "Form M & PAAR avant expédition – prévoir 1–3 semaines."
    },
    "notes": [
      {
        "de": "SONCAP-Zertifikat (Product Certificate) für regulierte Produkte zwingend.",
        "en": "SONCAP certificate mandatory for regulated products.",
        "fr": "Certificat SONCAP obligatoire pour les produits réglementés."
      },
      {
        "de": "Form M (über Bank/Single Window) ist Pflicht VOR Verschiffung; danach PAAR.",
        "en": "Form M (via bank/Single Window) required BEFORE shipment; then PAAR.",
        "fr": "Form M (via banque/guichet unique) obligatoire AVANT expédition; puis PAAR."
      },
      {
        "de": "NAFDAC-Registrierung für Lebensmittel, Arznei, Kosmetik, Chemikalien.",
        "en": "NAFDAC registration for food, drugs, cosmetics, chemicals.",
        "fr": "Enregistrement NAFDAC pour aliments, médicaments, cosmétiques, produits chimiques."
      }
    ],
    "import": {
      "summary": {
        "de": "Import nach Nigeria über Apapa/Tin Can (Lagos) mit Form M / PAAR / SONCAP.",
        "en": "Import into Nigeria via Apapa/Tin Can (Lagos) with Form M / PAAR / SONCAP.",
        "fr": "Import au Nigéria via Apapa/Tin Can (Lagos) avec Form M / PAAR / SONCAP."
      },
      "steps": [
        {
          "icon": "🏦",
          "title": {
            "de": "Form M eröffnen",
            "en": "Open Form M",
            "fr": "Ouvrir le Form M"
          },
          "desc": {
            "de": "Über die autorisierte Bank im Trade-Portal Form M beantragen.",
            "en": "Apply for Form M via authorised dealer bank on the trade portal.",
            "fr": "Demander le Form M via la banque agréée sur le portail."
          },
          "docs": [
            {
              "de": "Proforma-Rechnung",
              "en": "Proforma invoice",
              "fr": "Facture proforma"
            },
            {
              "de": "Eingetragener Importeur (TIN)",
              "en": "Registered importer (TIN)",
              "fr": "Importateur enregistré (TIN)"
            }
          ],
          "warn": {
            "de": "Ohne genehmigtes Form M keine Verschiffung möglich.",
            "en": "No shipment without an approved Form M.",
            "fr": "Pas d’expédition sans Form M approuvé."
          }
        },
        {
          "icon": "🛡️",
          "title": {
            "de": "SONCAP / NAFDAC",
            "en": "SONCAP / NAFDAC",
            "fr": "SONCAP / NAFDAC"
          },
          "desc": {
            "de": "Produktzertifizierung (SONCAP) bzw. NAFDAC-Freigabe einholen.",
            "en": "Obtain product certification (SONCAP) and/or NAFDAC clearance.",
            "fr": "Obtenir la certification produit (SONCAP) et/ou l’aval NAFDAC."
          },
          "docs": [
            {
              "de": "SONCAP-Zertifikat",
              "en": "SONCAP certificate",
              "fr": "Certificat SONCAP"
            }
          ],
          "warn": null
        },
        {
          "icon": "🧾",
          "title": {
            "de": "Versanddokumente",
            "en": "Shipping documents",
            "fr": "Documents d’expédition"
          },
          "desc": {
            "de": "Endrechnung, Packliste, B/L, Versicherung; Daten = Form M.",
            "en": "Final invoice, packing list, B/L, insurance; data must match Form M.",
            "fr": "Facture finale, colisage, B/L, assurance; données = Form M."
          },
          "docs": [
            {
              "de": "Handelsrechnung",
              "en": "Commercial invoice",
              "fr": "Facture commerciale"
            },
            {
              "de": "Konnossement (B/L)",
              "en": "Bill of Lading",
              "fr": "Connaissement"
            },
            {
              "de": "Versicherung (lokal)",
              "en": "Insurance (local)",
              "fr": "Assurance (locale)"
            }
          ],
          "warn": null
        },
        {
          "icon": "📑",
          "title": {
            "de": "PAAR erhalten",
            "en": "Obtain PAAR",
            "fr": "Obtenir le PAAR"
          },
          "desc": {
            "de": "NCS stellt PAAR (Risk Assessment Report) als Basis der Verzollung aus.",
            "en": "NCS issues PAAR (Risk Assessment Report) as basis for clearance.",
            "fr": "NCS émet le PAAR (rapport d’évaluation) base du dédouanement."
          },
          "docs": [],
          "warn": null
        },
        {
          "icon": "🏛️",
          "title": {
            "de": "Zollanmeldung (SAD)",
            "en": "Customs declaration (SAD)",
            "fr": "Déclaration (SAD)"
          },
          "desc": {
            "de": "Lizenzierter Agent reicht SAD/Entry ein.",
            "en": "Licensed agent files SAD/entry.",
            "fr": "L’agent agréé dépose la déclaration."
          },
          "docs": [],
          "warn": null
        },
        {
          "icon": "💶",
          "title": {
            "de": "Abgaben zahlen",
            "en": "Pay duties",
            "fr": "Payer les droits"
          },
          "desc": {
            "de": "Zoll, VAT, Levies (z.B. ETLS, NAC) begleichen.",
            "en": "Pay duty, VAT and levies (e.g. ETLS, NAC).",
            "fr": "Régler droits, TVA et taxes (ETLS, NAC)."
          },
          "docs": [],
          "warn": null
        },
        {
          "icon": "🔍",
          "title": {
            "de": "Inspektion & Freigabe",
            "en": "Inspection & release",
            "fr": "Inspection & mainlevée"
          },
          "desc": {
            "de": "Examination (oft physisch), dann Release Order.",
            "en": "Examination (often physical), then release order.",
            "fr": "Examen (souvent physique), puis mainlevée."
          },
          "docs": [],
          "warn": null
        },
        {
          "icon": "🚚",
          "title": {
            "de": "Auslieferung",
            "en": "Delivery",
            "fr": "Livraison"
          },
          "desc": {
            "de": "Container ausgaten; Demurrage/Terminal-Gebühren beachten.",
            "en": "Gate out container; mind demurrage/terminal charges.",
            "fr": "Sortir le conteneur; attention surestaries/frais terminal."
          },
          "docs": [],
          "warn": null
        }
      ]
    },
    "export": {
      "summary": {
        "de": "Export aus Nigeria mit NXP-Formular und NEPC-Registrierung.",
        "en": "Export from Nigeria with NXP form and NEPC registration.",
        "fr": "Export du Nigéria avec formulaire NXP et enregistrement NEPC."
      },
      "steps": [
        {
          "icon": "🪪",
          "title": {
            "de": "Exporteur registrieren",
            "en": "Register as exporter",
            "fr": "Enregistrer exportateur"
          },
          "desc": {
            "de": "NEPC-Registrierung + Bankkonto für Exporterlöse.",
            "en": "NEPC registration + bank account for export proceeds.",
            "fr": "Enregistrement NEPC + compte pour les recettes."
          },
          "docs": [
            {
              "de": "NEPC-Zertifikat",
              "en": "NEPC certificate",
              "fr": "Certificat NEPC"
            }
          ],
          "warn": null
        },
        {
          "icon": "🏦",
          "title": {
            "de": "NXP-Formular",
            "en": "NXP form",
            "fr": "Formulaire NXP"
          },
          "desc": {
            "de": "NXP über die Bank eröffnen (Exporterlös-Erfassung).",
            "en": "Open NXP via the bank (export proceeds monitoring).",
            "fr": "Ouvrir le NXP via la banque."
          },
          "docs": [
            {
              "de": "NXP-Formular",
              "en": "NXP form",
              "fr": "Formulaire NXP"
            }
          ],
          "warn": null
        },
        {
          "icon": "🧾",
          "title": {
            "de": "Dokumente & Inspektion",
            "en": "Documents & inspection",
            "fr": "Documents & inspection"
          },
          "desc": {
            "de": "Rechnung, Packliste, Ursprungszeugnis, ggf. Phytosanitär; Pre-Shipment-Inspektion.",
            "en": "Invoice, packing list, certificate of origin, phytosanitary; pre-shipment inspection.",
            "fr": "Facture, colisage, origine, phytosanitaire; inspection avant embarquement."
          },
          "docs": [
            {
              "de": "Ursprungszeugnis",
              "en": "Certificate of origin",
              "fr": "Certificat d’origine"
            }
          ],
          "warn": null
        },
        {
          "icon": "🏛️",
          "title": {
            "de": "Zoll & Verladung",
            "en": "Customs & loading",
            "fr": "Douane & chargement"
          },
          "desc": {
            "de": "Export-Entry, Verladung, B/L mit NXP-Bezug.",
            "en": "Export entry, loading, B/L referencing NXP.",
            "fr": "Déclaration export, chargement, B/L lié au NXP."
          },
          "docs": [],
          "warn": null
        },
        {
          "icon": "💶",
          "title": {
            "de": "Devisenrückführung",
            "en": "Repatriate proceeds",
            "fr": "Rapatriement des devises"
          },
          "desc": {
            "de": "Exporterlöse fristgerecht über die Bank zurückführen.",
            "en": "Repatriate export proceeds via bank within deadline.",
            "fr": "Rapatrier les recettes via la banque dans les délais."
          },
          "docs": [],
          "warn": null
        }
      ]
    }
  },
  "CI": {
    "status": "complete",
    "authority": {
      "de": "Direction Générale des Douanes (DGD) / Guichet Unique (GUCE)",
      "en": "Customs Directorate (DGD) / Single Window (GUCE)",
      "fr": "Direction Générale des Douanes (DGD) / Guichet Unique (GUCE)"
    },
    "leadtime": {
      "de": "FDI/FRI vor Verschiffung; Hafen Abidjan/San-Pédro.",
      "en": "FDI/FRI before shipment; Port Abidjan/San-Pédro.",
      "fr": "FDI/FRI avant expédition; Port d’Abidjan/San-Pédro."
    },
    "notes": [
      {
        "de": "FDI (Fiche de Déclaration à l’Importation) über GUCE VOR Verschiffung.",
        "en": "FDI import declaration sheet via GUCE BEFORE shipment.",
        "fr": "FDI à établir via le GUCE AVANT expédition."
      },
      {
        "de": "BSC/ECTN für Tracking; Werte in XOF, TEC der UEMOA/CEDEAO.",
        "en": "BSC/ECTN for tracking; values in XOF, UEMOA/ECOWAS CET.",
        "fr": "BSC/ECTN pour le suivi; valeurs en XOF, TEC UEMOA/CEDEAO."
      }
    ],
    "import": {
      "summary": {
        "de": "Import nach Côte d’Ivoire über das Guichet Unique (GUCE).",
        "en": "Import into Côte d’Ivoire via the Single Window (GUCE).",
        "fr": "Import en Côte d’Ivoire via le Guichet Unique (GUCE)."
      },
      "steps": [
        {
          "icon": "📝",
          "title": {
            "de": "Proforma & FDI",
            "en": "Proforma & FDI",
            "fr": "Proforma & FDI"
          },
          "desc": {
            "de": "FDI auf Basis der Proforma im GUCE anlegen.",
            "en": "Create FDI based on proforma in GUCE.",
            "fr": "Créer la FDI sur base proforma dans le GUCE."
          },
          "docs": [
            {
              "de": "Proforma-Rechnung",
              "en": "Proforma invoice",
              "fr": "Facture proforma"
            }
          ],
          "warn": {
            "de": "FDI muss vor Verschiffung vorliegen.",
            "en": "FDI must exist before shipment.",
            "fr": "La FDI doit précéder l’expédition."
          }
        },
        {
          "icon": "📑",
          "title": {
            "de": "BSC / ECTN",
            "en": "BSC / ECTN",
            "fr": "BSC / ECTN"
          },
          "desc": {
            "de": "BSC beantragen und validieren lassen.",
            "en": "Apply for and validate BSC.",
            "fr": "Demander et valider le BSC."
          },
          "docs": [],
          "warn": null
        },
        {
          "icon": "🧾",
          "title": {
            "de": "Handelsdokumente",
            "en": "Trade documents",
            "fr": "Documents commerciaux"
          },
          "desc": {
            "de": "Rechnung, Packliste, Ursprungszeugnis, B/L.",
            "en": "Invoice, packing list, certificate of origin, B/L.",
            "fr": "Facture, colisage, origine, B/L."
          },
          "docs": [
            {
              "de": "Handelsrechnung",
              "en": "Commercial invoice",
              "fr": "Facture commerciale"
            },
            {
              "de": "Konnossement (B/L)",
              "en": "Bill of Lading",
              "fr": "Connaissement"
            }
          ],
          "warn": null
        },
        {
          "icon": "🏛️",
          "title": {
            "de": "Zollanmeldung",
            "en": "Customs declaration",
            "fr": "Déclaration en douane"
          },
          "desc": {
            "de": "Commissionnaire reicht Anmeldung im SYDAM/GUCE ein.",
            "en": "Broker files declaration in SYDAM/GUCE.",
            "fr": "Commissionnaire dépose via SYDAM/GUCE."
          },
          "docs": [],
          "warn": null
        },
        {
          "icon": "💶",
          "title": {
            "de": "Abgaben",
            "en": "Duties",
            "fr": "Droits"
          },
          "desc": {
            "de": "Zoll/MwSt/Gebühren zahlen.",
            "en": "Pay duty/VAT/fees.",
            "fr": "Payer droits/TVA/redevances."
          },
          "docs": [],
          "warn": null
        },
        {
          "icon": "🔍",
          "title": {
            "de": "Kontrolle & Freigabe",
            "en": "Inspection & release",
            "fr": "Contrôle & mainlevée"
          },
          "desc": {
            "de": "Kontrolle, dann Bon à enlever.",
            "en": "Inspection, then release note.",
            "fr": "Contrôle, puis bon à enlever."
          },
          "docs": [],
          "warn": null
        },
        {
          "icon": "🚚",
          "title": {
            "de": "Auslieferung",
            "en": "Delivery",
            "fr": "Livraison"
          },
          "desc": {
            "de": "Container abholen und zustellen.",
            "en": "Pick up and deliver container.",
            "fr": "Enlever et livrer le conteneur."
          },
          "docs": [],
          "warn": null
        }
      ]
    },
    "export": {
      "summary": {
        "de": "Export (Kakao/Cashew u.a.) aus Côte d’Ivoire.",
        "en": "Export (cocoa/cashew etc.) from Côte d’Ivoire.",
        "fr": "Export (cacao/anacarde etc.) de Côte d’Ivoire."
      },
      "steps": [
        {
          "icon": "📝",
          "title": {
            "de": "Vertrag & Agrément",
            "en": "Contract & approval",
            "fr": "Contrat & agrément"
          },
          "desc": {
            "de": "Bei Agrarrohstoffen Branchen-Agrément (z.B. Conseil Café-Cacao) prüfen.",
            "en": "For commodities check sector approval (e.g. Conseil Café-Cacao).",
            "fr": "Pour matières agricoles, vérifier l’agrément (Conseil Café-Cacao)."
          },
          "docs": [],
          "warn": null
        },
        {
          "icon": "🧾",
          "title": {
            "de": "Dokumente",
            "en": "Documents",
            "fr": "Documents"
          },
          "desc": {
            "de": "Rechnung, Packliste, Ursprungszeugnis, Phytosanitär.",
            "en": "Invoice, packing list, origin, phytosanitary.",
            "fr": "Facture, colisage, origine, phytosanitaire."
          },
          "docs": [
            {
              "de": "Pflanzengesundheitszeugnis",
              "en": "Phytosanitary certificate",
              "fr": "Certificat phytosanitaire"
            }
          ],
          "warn": null
        },
        {
          "icon": "🏛️",
          "title": {
            "de": "Ausfuhranmeldung",
            "en": "Export declaration",
            "fr": "Déclaration d’export"
          },
          "desc": {
            "de": "Export-Entry im GUCE; Domiciliation der Devisen.",
            "en": "Export entry in GUCE; FX domiciliation.",
            "fr": "Déclaration GUCE; domiciliation devises."
          },
          "docs": [],
          "warn": null
        },
        {
          "icon": "🚢",
          "title": {
            "de": "Verladung & B/L",
            "en": "Loading & B/L",
            "fr": "Chargement & B/L"
          },
          "desc": {
            "de": "Verladen, Konnossement ausstellen.",
            "en": "Load, issue B/L.",
            "fr": "Charger, émettre le B/L."
          },
          "docs": [],
          "warn": null
        },
        {
          "icon": "💶",
          "title": {
            "de": "Zahlungseingang",
            "en": "Payment",
            "fr": "Encaissement"
          },
          "desc": {
            "de": "Erlöse domizilieren/zurückführen.",
            "en": "Domicile/repatriate proceeds.",
            "fr": "Domicilier/rapatrier les recettes."
          },
          "docs": [],
          "warn": null
        }
      ]
    }
  },
  "CN": {
    "status": "complete",
    "authority": {
      "de": "General Administration of Customs (GACC) / CIQ",
      "en": "General Administration of Customs (GACC) / CIQ",
      "fr": "Administration générale des douanes (GACC) / CIQ"
    },
    "leadtime": {
      "de": "Seefracht nach EU ~30–40 Tage; CCC-Prüfung ggf. vorab.",
      "en": "Sea freight to EU ~30–40 days; check CCC in advance.",
      "fr": "Fret maritime vers UE ~30–40 jours; vérifier CCC en amont."
    },
    "notes": [
      {
        "de": "Exporteur/Importeur müssen bei GACC registriert sein (China Customs).",
        "en": "Exporter/importer must be registered with GACC (China Customs).",
        "fr": "Exportateur/importateur doivent être enregistrés auprès du GACC."
      },
      {
        "de": "CCC-Zertifizierung (China Compulsory Certification) für viele Produktgruppen.",
        "en": "CCC certification required for many product groups.",
        "fr": "Certification CCC requise pour de nombreuses catégories."
      },
      {
        "de": "VAT-Rückerstattung (Export Rebate) korrekt anmelden.",
        "en": "Declare VAT export rebate correctly.",
        "fr": "Déclarer correctement le remboursement de TVA export."
      }
    ],
    "import": {
      "summary": {
        "de": "Import nach China (Registrierung + ggf. CCC + Inspektion).",
        "en": "Import into China (registration + CCC + inspection).",
        "fr": "Import en Chine (enregistrement + CCC + inspection)."
      },
      "steps": [
        {
          "icon": "🪪",
          "title": {
            "de": "Registrierung",
            "en": "Registration",
            "fr": "Enregistrement"
          },
          "desc": {
            "de": "Importeur bei GACC registrieren (Customs/Single Window).",
            "en": "Register importer with GACC (customs/single window).",
            "fr": "Enregistrer l’importateur au GACC."
          },
          "docs": [],
          "warn": null
        },
        {
          "icon": "🛡️",
          "title": {
            "de": "CCC / Lizenzen",
            "en": "CCC / licences",
            "fr": "CCC / licences"
          },
          "desc": {
            "de": "Produktgebundene CCC bzw. Einfuhrlizenzen prüfen.",
            "en": "Check product CCC and/or import licences.",
            "fr": "Vérifier CCC et/ou licences."
          },
          "docs": [
            {
              "de": "CCC-Zertifikat (falls nötig)",
              "en": "CCC certificate (if required)",
              "fr": "Certificat CCC (si requis)"
            }
          ],
          "warn": null
        },
        {
          "icon": "🧾",
          "title": {
            "de": "Dokumente",
            "en": "Documents",
            "fr": "Documents"
          },
          "desc": {
            "de": "Rechnung, Packliste, B/L, Ursprung, ggf. Kontrakt.",
            "en": "Invoice, packing list, B/L, origin, contract if needed.",
            "fr": "Facture, colisage, B/L, origine, contrat si besoin."
          },
          "docs": [
            {
              "de": "Handelsrechnung",
              "en": "Commercial invoice",
              "fr": "Facture commerciale"
            },
            {
              "de": "Konnossement (B/L)",
              "en": "Bill of Lading",
              "fr": "Connaissement"
            }
          ],
          "warn": null
        },
        {
          "icon": "🏛️",
          "title": {
            "de": "Zollanmeldung",
            "en": "Customs declaration",
            "fr": "Déclaration en douane"
          },
          "desc": {
            "de": "Anmeldung über Single Window; HS-Code & Wert prüfen.",
            "en": "Declare via single window; verify HS code & value.",
            "fr": "Déclarer via guichet unique; vérifier code SH & valeur."
          },
          "docs": [],
          "warn": null
        },
        {
          "icon": "🔬",
          "title": {
            "de": "Inspektion (CIQ)",
            "en": "Inspection (CIQ)",
            "fr": "Inspection (CIQ)"
          },
          "desc": {
            "de": "Qualitäts-/Quarantänekontrolle bei regulierter Ware.",
            "en": "Quality/quarantine inspection for regulated goods.",
            "fr": "Contrôle qualité/quarantaine si réglementé."
          },
          "docs": [],
          "warn": null
        },
        {
          "icon": "💶",
          "title": {
            "de": "Abgaben",
            "en": "Duties",
            "fr": "Droits"
          },
          "desc": {
            "de": "Zoll + Einfuhr-VAT (+ ggf. Verbrauchsteuer) zahlen.",
            "en": "Pay duty + import VAT (+ consumption tax if any).",
            "fr": "Payer droits + TVA import (+ taxe conso éventuelle)."
          },
          "docs": [],
          "warn": null
        },
        {
          "icon": "🚚",
          "title": {
            "de": "Freigabe & Lieferung",
            "en": "Release & delivery",
            "fr": "Mainlevée & livraison"
          },
          "desc": {
            "de": "Nach Freigabe Ware abholen.",
            "en": "Take goods after release.",
            "fr": "Retirer après mainlevée."
          },
          "docs": [],
          "warn": null
        }
      ]
    },
    "export": {
      "summary": {
        "de": "Export aus China in die EU/Afrika.",
        "en": "Export from China to EU/Africa.",
        "fr": "Export de Chine vers UE/Afrique."
      },
      "steps": [
        {
          "icon": "🪪",
          "title": {
            "de": "Exporteur-Registrierung",
            "en": "Exporter registration",
            "fr": "Enregistrement exportateur"
          },
          "desc": {
            "de": "GACC-Registrierung des Versenders.",
            "en": "GACC registration of shipper.",
            "fr": "Enregistrement GACC de l’expéditeur."
          },
          "docs": [],
          "warn": null
        },
        {
          "icon": "🧾",
          "title": {
            "de": "Dokumente",
            "en": "Documents",
            "fr": "Documents"
          },
          "desc": {
            "de": "Rechnung, Packliste, Ursprung (CCPIT/Form A/CO), ggf. CIQ.",
            "en": "Invoice, packing list, origin (CCPIT/Form A/CO), CIQ if needed.",
            "fr": "Facture, colisage, origine (CCPIT/Form A), CIQ si besoin."
          },
          "docs": [
            {
              "de": "Ursprungszeugnis (CO/Form A)",
              "en": "Certificate of origin (CO/Form A)",
              "fr": "Certificat d’origine (CO)"
            }
          ],
          "warn": null
        },
        {
          "icon": "🏛️",
          "title": {
            "de": "Ausfuhranmeldung",
            "en": "Export declaration",
            "fr": "Déclaration d’export"
          },
          "desc": {
            "de": "Export-Deklaration; VAT-Rebate-Daten erfassen.",
            "en": "Export declaration; capture VAT rebate data.",
            "fr": "Déclaration export; données de remboursement TVA."
          },
          "docs": [],
          "warn": null
        },
        {
          "icon": "🚢",
          "title": {
            "de": "Verladung & B/L",
            "en": "Loading & B/L",
            "fr": "Chargement & B/L"
          },
          "desc": {
            "de": "Booking, Verladung, B/L; Zielland-BSC/ECTN nicht vergessen.",
            "en": "Booking, loading, B/L; don’t forget destination BSC/ECTN.",
            "fr": "Réservation, chargement, B/L; ne pas oublier le BSC/ECTN du pays cible."
          },
          "docs": [
            {
              "de": "Konnossement (B/L)",
              "en": "Bill of Lading",
              "fr": "Connaissement"
            }
          ],
          "warn": null
        },
        {
          "icon": "💶",
          "title": {
            "de": "VAT-Rebate",
            "en": "VAT rebate",
            "fr": "Remboursement TVA"
          },
          "desc": {
            "de": "Export-VAT-Rückerstattung beantragen.",
            "en": "Claim export VAT rebate.",
            "fr": "Demander le remboursement TVA export."
          },
          "docs": [],
          "warn": null
        }
      ]
    }
  }
}
};
