# Tauri icons

This directory must contain the platform icon bundle Tauri references in
`tauri.conf.json` under `bundle.icon`:

- `32x32.png`
- `128x128.png`
- `128x128@2x.png`
- `icon.icns` (macOS)
- `icon.ico` (Windows)
- `Square*.png` and store icons (generated under `gen/` for iOS/Android)

## Generating the icon set

We do **not** check binary icon artifacts in until a real brand asset
exists. To regenerate the set from a single high-resolution source:

```bash
# from the hotseaters-ultimate root
pnpm tauri icon ./public/favicon.svg
```

This will populate `src-tauri/icons/` with every required size for
desktop + iOS + Android.

For the PWA manifest icons (`/icon-192.png`, `/icon-512.png`,
`/icon-512-maskable.png` referenced by `vite.config.ts`), see
`/public/manifest-icons-README.md`.

## Until a real brand icon exists

`pnpm tauri build` will fail without these files. The current scaffold
ships the config only; the icons are produced by the operator once a
finalized brand mark lands. See `docs/RUNBOOKS-TAURI.md`.
