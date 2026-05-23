# Tauri 2 Mobile Runbook — `hotseaters-ultimate`

> Self-hosted Supabase only. HotSeatersMVP is the bible.
> Components → hooks → stores → APIs. **Mobile is the primary target.**

This runbook is the operator's step-by-step for bootstrapping, developing,
verifying, and shipping the Tauri 2 iOS + Android builds. It is the
authoritative reference for **Change 9** (`pwa-and-tauri-mobile-scaffold`)
of the `hotseaters-pglite-port` phase.

---

## 1. Prerequisites

### Common
- Node 20+ and pnpm 9+ (`corepack enable && corepack prepare pnpm@9 --activate`)
- Rust toolchain — `rustup` stable (`rustup toolchain install stable`)

### iOS
- macOS 14+ (Sonoma) on Apple Silicon recommended
- **Xcode 16+** with the iOS 17+ SDK and the Simulator runtime
- Command Line Tools (`xcode-select --install`)
- iOS Rust targets:
  ```bash
  rustup target add aarch64-apple-ios aarch64-apple-ios-sim x86_64-apple-ios
  ```
- A registered Apple developer team ID (set in `tauri.conf.json` under
  `bundle.iOS.developmentTeam` — the scaffold ships `REPLACE_ME`)

### Android
- **Android Studio** (Iguana/Koala or newer) with:
  - Platform SDK 34 (`compileSdk`) + 26 (`minSdk`)
  - **NDK r26** (`26.3.11579264` or newer)
  - Build Tools 34.x
  - One AVD (Pixel 7 / API 34 recommended)
- **JDK 21** (Temurin)
- Android Rust targets:
  ```bash
  rustup target add aarch64-linux-android armv7-linux-androideabi \
    i686-linux-android x86_64-linux-android
  ```
- Environment:
  ```bash
  export ANDROID_HOME="$HOME/Library/Android/sdk"      # macOS default
  export NDK_HOME="$ANDROID_HOME/ndk/26.3.11579264"
  export JAVA_HOME="$(/usr/libexec/java_home -v 21)"
  ```

---

## 2. First-time bootstrap

Run **once** in a fresh checkout:

```bash
# 1. JS deps + entity-management submodule link
pnpm install

# 2. Initialize the desktop Tauri project (generates desktop bundle metadata).
#    Pre-existing files in src-tauri/ are honored — Tauri merges, does not overwrite.
pnpm tauri:init

# 3. Initialize iOS project (creates src-tauri/gen/apple/)
pnpm tauri:ios:init

# 4. Initialize Android project (creates src-tauri/gen/android/)
pnpm tauri:android:init

# 5. Replace the iOS developmentTeam placeholder
$EDITOR src-tauri/tauri.conf.json   # bundle.iOS.developmentTeam = "<YOUR_TEAM_ID>"

# 6. Generate the icon set from your brand source SVG
pnpm tauri icon ./public/brand-source.svg
```

**Result:** `src-tauri/gen/` is populated with the platform projects.
`gen/` is `.gitignore`d — it is regenerated per machine and per CI run.

---

## 3. Local development loop

### iOS Simulator
```bash
pnpm tauri:ios:dev
```
Boots the Vite dev server (`http://localhost:5174`), builds the Rust
target for `aarch64-apple-ios-sim`, signs with the dev team, and launches
the Simulator. Hot-reload works for the web layer; Rust changes require
a relaunch.

### Android Emulator
```bash
pnpm tauri:android:dev
```
Same flow, against `aarch64-linux-android` for an x86_64 emulator host
running an arm64 AVD (recommended) or `x86_64-linux-android` for
emulators built on x86 hosts.

### Web preview (sanity check before mobile)
```bash
pnpm dev          # serves with COOP/COEP — must work before mobile
```

---

## 4. PGlite-in-WebView smoke test

**This is the acceptance gate for Change 9.** Mobile is not "done" until
this test passes on both iOS Simulator and Android Emulator.

### Why
PGlite needs `SharedArrayBuffer` + IndexedDB inside the WebView. iOS
WKWebView and Android WebView both gate `SharedArrayBuffer` behind
COOP=`same-origin` + COEP=`require-corp`. Those headers are set in two
places:
- `vite.config.ts` (dev server + preview)
- `src-tauri/tauri.conf.json` `app.security.headers` (Tauri-served bundle)

Both must agree. If the test fails, one of them regressed.

### Procedure

1. Boot the target:
   ```bash
   pnpm tauri:ios:dev          # opens Xcode Simulator
   # OR
   pnpm tauri:android:dev      # opens Android Emulator
   ```

2. Attach devtools:
   - **iOS:** Safari → *Develop* → *Simulator* → *HotSeaters* → *Inspect*
   - **Android:** Open Chrome on host → `chrome://inspect/#devices` →
     find `WebView in ai.prometheusags.hotseaters.ultimate` → *inspect*

3. In the devtools **Console**, paste the body of
   `verifyPGliteWebViewEnv` from
   `scripts/verify-pglite-in-webview.mjs` (the block between
   `// ---8<---` and `// --->8---`), then invoke:
   ```js
   await verifyPGliteWebViewEnv()
   ```

4. **Expected output:**
   ```json
   {
     "sharedArrayBuffer": true,
     "crossOriginIsolated": true,
     "indexedDB": true,
     "pgliteOk": true,
     "selectOne": 1,
     "error": null
   }
   ```

5. **Any `false`** = a header / config regression. See § 7.

---

## 5. Production build

### iOS (Ad-hoc or App Store)
```bash
pnpm tauri:ios:build \
  --target aarch64-apple-ios \
  --export-method app-store-connect
```
Produces an `.ipa` under `src-tauri/gen/apple/build/`. Signing requires
the team ID and a configured provisioning profile in Xcode.

### Android (release APK / AAB)
```bash
# APK (sideload)
pnpm tauri:android:build --apk

# AAB (Play Store)
pnpm tauri:android:build --aab
```
Output under `src-tauri/gen/android/app/build/outputs/`. Signing config
lives in `src-tauri/gen/android/keystore.properties` — generate the
keystore once with `keytool` and never commit it.

### Desktop (sanity)
```bash
pnpm tauri build
```
Produces `.dmg` / `.AppImage` / `.deb` / `.msi`. Desktop is downstream
of mobile per RULE 4.

---

## 6. CI

**Tauri mobile is local-only — no CI builds iOS or Android.**

The web build that ships to GKE goes through
`.github/workflows/deploy.yml` (web-only, `linux/amd64` nginx image,
no Rust/Tauri toolchain involvement). Mobile validation is a manual
local task: run § 4 on your own machine when you want to verify a
change works inside the WebView.

If you want CI mobile builds back later, add a new workflow that
mirrors the example-app build's tag + Artifact Registry pattern but
targets iOS Simulator + Android Emulator. The scaffold under
`src-tauri/` is ready when that day comes.

---

## 7. Known issues

### `SharedArrayBuffer is not defined` in WKWebView
- Confirm `app.security.headers` in `tauri.conf.json` includes both COOP
  and COEP exactly as set in this scaffold.
- iOS Simulator caches the WebView's CORP decision; cold-boot the
  Simulator (`Device → Erase All Content and Settings`).

### `crossOriginIsolated === false` in Android WebView
- Android WebView requires the response headers on the loaded HTML
  itself, not just on subresources. Tauri serves the bundle via its
  internal protocol handler which honors `app.security.headers`. If
  this is `false`, you are on an older Tauri 2 release — bump
  `@tauri-apps/cli` to ≥ 2.1.

### `Cannot find module @electric-sql/pglite` in devtools paste
- The paste-target snippet uses dynamic `import()` which only resolves
  inside the bundled app, not from a blank devtools page. Make sure the
  app is loaded in the WebView first; reload if needed.

### CSP blocks dev server WebSocket
- The shipped CSP in `tauri.conf.json` allows `ws://localhost:8000` and
  `ws://localhost:3133` for Electric. If you change Electric's port,
  update both the CSP and `vite.config.ts` proxy targets.

### `developmentTeam = "REPLACE_ME"` causes signing failure
- Replace with your real 10-character Apple team ID *before* the first
  `pnpm tauri:ios:dev`. Tauri caches the team ID into
  `gen/apple/project.yml`; if you change it later, delete `gen/apple/`
  and re-run `pnpm tauri:ios:init`.

### Self-hosted Supabase only
- The CSP **does not** allow `*.supabase.co`. Any code that tries to
  reach Supabase Cloud will be blocked at the WebView layer in mobile
  builds — this is by design (RULE 1). Production targets:
  - Local dev: `http://localhost:8000`
  - Hosted: `https://hotbase.prometheusags.ai`
  - Electric local: `http://localhost:3133`
  - Electric hosted: `https://electricsql.prometheusags.ai`

---

## 8. References

- Tauri 2 mobile docs: https://v2.tauri.app/start/prerequisites/#mobile
- PGlite + SharedArrayBuffer: https://pglite.dev/docs/multi-tab-worker
- COOP/COEP cross-origin isolation: https://web.dev/cross-origin-isolation-guide/
- Constraints (canonical): `latest-data/.kbd-orchestrator/constraints.md`
- Phase plan: `latest-data/.kbd-orchestrator/phases/hotseaters-pglite-port/plan.md`
