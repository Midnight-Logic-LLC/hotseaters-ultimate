import {
  createClient,
  type Session,
  type SupabaseClient,
} from '@supabase/supabase-js';

/**
 * supabase-client.ts — singleton browser Supabase client.
 *
 * Part of `shared/db`. **The ONLY module that may import
 * `@supabase/supabase-js`** outside of `features/<x>/stores/*`. Components and
 * hooks must reach auth and data through stores; the ESLint
 * `boundaries/external` rule enforces this (RULE 3).
 *
 * Hard constraints (from `constraints.md`):
 *   - RULE 1: Self-hosted Supabase only. The factory refuses to construct a
 *     client whose `VITE_SUPABASE_URL` matches `*.supabase.co` — this is the
 *     last line of defence against accidentally pointing at Supabase Cloud.
 *   - Hosted production target: `https://hotbase.prometheusags.ai`.
 *   - Local dev target: `http://localhost:8000` (docker-compose stack).
 *
 * SPA-only — no SSR. We rely on `@supabase/supabase-js@2`'s browser-default
 * `localStorage`-backed session with PKCE.
 */

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error(
    'Missing VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY. ' +
      'Copy .env.example to .env and fill them in.',
  );
}

// RULE 1 guardrail: never let Supabase Cloud sneak in.
if (/\.supabase\.co(\/|$)/i.test(SUPABASE_URL)) {
  throw new Error(
    `Refusing to use Supabase Cloud URL "${SUPABASE_URL}". ` +
      'Self-hosted Supabase only — use http://localhost:8000 or ' +
      'https://hotbase.prometheusags.ai (RULE 1).',
  );
}

// Always call the configured upstream directly — never proxy through the
// dev server origin. The browser hits Envoy at VITE_SUPABASE_URL
// (http://localhost:8000 in dev, https://hotbase.prometheusags.ai in prod)
// using the same code path in both environments. CORS is wide-open on the
// Envoy gateway (see latest-data/volumes/api/envoy/lds.template.yaml).
export const supabase: SupabaseClient = createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: false,
    },
  },
);

/** Convenience: read the current session, or null if not signed in. */
export async function getCurrentSession(): Promise<Session | null> {
  const { data, error } = await supabase.auth.getSession();
  if (error) {
    throw error;
  }
  return data.session;
}
