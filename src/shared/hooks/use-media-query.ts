import { useEffect, useState } from 'react';

/**
 * Subscribe to a CSS media query. Breakpoint logic lives here (a shared hook)
 * rather than inline in components — per the layering rules, components consume
 * responsive state through this hook.
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia(query).matches : false,
  );

  useEffect(() => {
    const mql = window.matchMedia(query);
    const onChange = (e: MediaQueryListEvent) => setMatches(e.matches);
    setMatches(mql.matches);
    mql.addEventListener('change', onChange);
    return () => mql.removeEventListener('change', onChange);
  }, [query]);

  return matches;
}

/** True when the viewport is at mobile width (native-PWA layout territory). */
export function useIsMobile(): boolean {
  return useMediaQuery('(max-width: 767px)');
}
