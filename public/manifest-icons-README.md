# PWA manifest & splash icons

The PWA manifest (configured in `vite.config.ts` via `VitePWA`) references:

- `/icon-192.png` — 192×192 standard
- `/icon-512.png` — 512×512 standard
- `/icon-512-maskable.png` — 512×512 maskable (safe-zone aware)
- `/apple-icon-180.png` — 180×180 (iOS home-screen)
- `/favicon.svg` — vector favicon (currently the only checked-in asset)
- `/splash/*.png` — Apple touch startup images for each iPhone / iPad
  device family (see commented-out `<link rel="apple-touch-startup-image">`
  tags in `index.html`)

## Generating the icon set

Until a finalized brand mark exists, none of the PNGs above are committed
(except `favicon.svg`). Generate them from a single source SVG with
`pwa-asset-generator`:

```bash
npm install -g pwa-asset-generator
# from the hotseaters-ultimate root
pwa-asset-generator ./public/brand-source.svg ./public \
  --background "#f6fbfe" \
  --theme-color "#06B6D4" \
  --opaque false \
  --icon-only false \
  --favicon false \
  --maskable true \
  --type png \
  --padding "20%"
```

This produces:
- Standard PWA icons in `public/`
- Apple touch startup splash images in `public/splash/`
- Updated `<link>` tags printed to stdout — paste them into `index.html`

## Maskable icon safe zone

The `maskable` purpose icon must keep all critical visual elements inside
the inner 80% (safe zone). Use https://maskable.app to preview before
shipping.

## Why these aren't checked in

We do not have a finalized brand asset yet. Shipping placeholder PNGs
would (a) waste binary bytes in the repo and (b) bake a stale mark into
caches when the real one lands. Generate at the point the brand asset is
delivered, then commit the produced PNGs in a single dedicated commit.
