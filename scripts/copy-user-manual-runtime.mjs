// Keeps public/htmx/*.min.js and public/alpine/*.min.js in sync with
// node_modules sources. Runs on postinstall so the Next.js segment layout
// can serve htmx/Alpine from the same origin (CSP script-src 'self').
import { copyFileSync, mkdirSync, existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');

const pairs = [
  [
    'node_modules/htmx.org/dist/htmx.min.js',
    'public/htmx/htmx.min.js',
  ],
  [
    'node_modules/alpinejs/dist/cdn.min.js',
    'public/alpine/alpine.min.js',
  ],
];

for (const [from, to] of pairs) {
  const src = resolve(root, from);
  const dst = resolve(root, to);
  if (!existsSync(src)) {
    console.warn(`[user-manual-runtime] source missing: ${from}`);
    continue;
  }
  mkdirSync(dirname(dst), { recursive: true });
  copyFileSync(src, dst);
  console.log(`[user-manual-runtime] ${from} -> ${to}`);
}
