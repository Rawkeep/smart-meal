#!/usr/bin/env bash
# ============================================================================
# Reproduzierbarer Android-TWA-Build für Smart Meal (Bubblewrap).
#
# Erzeugt aus der gehosteten PWA eine signierte APK (+ AAB) — ohne dass das
# generierte Gradle-Projekt oder der Keystore ins Repo wandern (beide sind in
# .gitignore). Quelle der Wahrheit ist scripts/twa-manifest.pages.json.
#
# Voraussetzungen (macOS):
#   - JDK 17           (brew install openjdk@17)
#   - Android SDK      (cmdline-tools/latest, build-tools;34.0.0, platforms)
#   - Node/npx         (zieht @bubblewrap/cli bei Bedarf)
#
# Nutzung:
#   bash scripts/build-android.sh
#   → APK/AAB landen in  build/android/
#
# Keystore: wird beim ersten Lauf erzeugt (Passwort via Prompt/ENV). SICHER
# aufbewahren — ohne ihn sind keine Updates möglich. NIEMALS committen.
# ============================================================================
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
BUILD_DIR="$ROOT/build/android"
KEYSTORE="${SMARTMEAL_KEYSTORE:-$ROOT/build/android-keystore.keystore}"
KS_PASS="${BUBBLEWRAP_KEYSTORE_PASSWORD:-smartmeal}"
KEY_PASS="${BUBBLEWRAP_KEY_PASSWORD:-smartmeal}"

# --- JDK 17 / Android SDK auflösen --------------------------------------------
JDK_BUNDLE="${JDK_BUNDLE:-$(brew --prefix openjdk@17 2>/dev/null)/libexec/openjdk.jdk}"
export JAVA_HOME="$JDK_BUNDLE/Contents/Home"
export ANDROID_HOME="${ANDROID_HOME:-$HOME/Library/Android/sdk}"
export PATH="$JAVA_HOME/bin:$PATH"

[ -f "$JAVA_HOME/release" ] || { echo "JDK 17 nicht gefunden unter $JAVA_HOME"; exit 1; }
[ -d "$ANDROID_HOME/build-tools" ] || { echo "Android SDK nicht gefunden unter $ANDROID_HOME"; exit 1; }
# Bubblewrap erwartet einen top-level 'tools'-Ordner; auf neue cmdline-tools mappen.
[ -e "$ANDROID_HOME/tools" ] || ln -s cmdline-tools/latest "$ANDROID_HOME/tools"

# --- Build-Verzeichnis vorbereiten --------------------------------------------
mkdir -p "$BUILD_DIR"
cp "$ROOT/scripts/twa-manifest.pages.json" "$BUILD_DIR/twa-manifest.json"

# --- Keystore (einmalig erzeugen) ---------------------------------------------
if [ ! -f "$KEYSTORE" ]; then
  echo "Erzeuge Keystore: $KEYSTORE"
  keytool -genkeypair -v -keystore "$KEYSTORE" -alias smartmeal \
    -keyalg RSA -keysize 2048 -validity 10000 \
    -storepass "$KS_PASS" -keypass "$KEY_PASS" \
    -dname "CN=Smart Meal, OU=Rawkeep, O=Rawkeep, L=Berlin, S=Berlin, C=DE"
fi
# signingKey-Pfad im Manifest auf den tatsächlichen Keystore setzen.
node -e "const f='$BUILD_DIR/twa-manifest.json';const m=require(f);m.signingKey={path:'$KEYSTORE',alias:'smartmeal'};require('fs').writeFileSync(f,JSON.stringify(m,null,2));"

# --- Bubblewrap konfigurieren + bauen -----------------------------------------
export BUBBLEWRAP_KEYSTORE_PASSWORD="$KS_PASS"
export BUBBLEWRAP_KEY_PASSWORD="$KEY_PASS"
( cd "$BUILD_DIR"
  npx -y @bubblewrap/cli@latest updateConfig --jdkPath "$JDK_BUNDLE" --androidSdkPath "$ANDROID_HOME"
  printf '1.0.0\n\n\n\n' | npx -y @bubblewrap/cli@latest update
  npx -y @bubblewrap/cli@latest build --skipPwaValidation </dev/null
)

echo ""
echo "✓ Fertig:"
echo "  APK: $BUILD_DIR/app-release-signed.apk"
echo "  AAB: $BUILD_DIR/app-release-bundle.aab"
echo "  Keystore: $KEYSTORE  (SICHER aufbewahren!)"
echo ""
echo "SHA-256 (für assetlinks.json / Play Console):"
keytool -list -v -keystore "$KEYSTORE" -alias smartmeal -storepass "$KS_PASS" 2>/dev/null | grep -i "SHA256:" || true
