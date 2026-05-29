/**
 * use-venue-search.ts — venue / court / judge typeahead state for the deal
 * wizard's "Venue & Court" column.
 *
 * Port adaptation (RULE 0 / RULE C):
 *   The bible's `useVenueSearch.jsx` populates its suggestion lists by calling
 *   `base44.integrations.Core.InvokeLLM(...)` with `add_context_from_internet`
 *   — an AI-assisted internet lookup that returns a list of courthouses /
 *   courts / judges for a city+state. The port has NO equivalent of that
 *   base44 integration (no LLM-with-internet seam in this app), so the search
 *   functions here resolve to the existing-value-seeded list only.
 *
 *   The USER-VISIBLE behaviour preserved:
 *     • The courthouse / court / judge inputs exist and are wired.
 *     • When editing an existing deal, the saved courthouse / court / judge is
 *       seeded into its suggestion list so the field shows the saved value
 *       (the bible seeds `{ ..., isExisting: true }` the same way).
 *     • "+ Enter custom courthouse/court/judge" lets the user type any value —
 *       this path is fully functional and is the primary entry mechanism in
 *       the port until an AI-venue-lookup seam lands.
 *
 *   TODO(venue-lookup): when an AI/internet venue-lookup seam is added to the
 *   port, replace the empty `searchVenues` / `searchCourts` / `searchJudges`
 *   bodies with calls to it (keeping the existing-value de-dupe + sort).
 *
 * HotSeatersMVP is the bible.
 */

import { useCallback, useState } from 'react';

export interface VenueSuggestion {
  courthouse: string;
  isExisting?: boolean;
}
export interface CourtSuggestion {
  court: string;
  isExisting?: boolean;
}
export interface JudgeSuggestion {
  judge: string;
  isExisting?: boolean;
}

export interface UseVenueSearchResult {
  venueSuggestions: VenueSuggestion[];
  setVenueSuggestions: React.Dispatch<React.SetStateAction<VenueSuggestion[]>>;
  isSearchingVenue: boolean;
  courtSuggestions: CourtSuggestion[];
  setCourtSuggestions: React.Dispatch<React.SetStateAction<CourtSuggestion[]>>;
  isSearchingCourts: boolean;
  judgeSuggestions: JudgeSuggestion[];
  setJudgeSuggestions: React.Dispatch<React.SetStateAction<JudgeSuggestion[]>>;
  isSearchingJudges: boolean;
  searchVenues: (city: string, state: string, existingValue?: string | null) => void;
  searchCourts: (courthouse: string, existingValue?: string | null) => void;
  searchJudges: (
    courthouse: string,
    court: string,
    existingValue?: string | null,
  ) => void;
}

export function useVenueSearch(): UseVenueSearchResult {
  const [venueSuggestions, setVenueSuggestions] = useState<VenueSuggestion[]>([]);
  const [courtSuggestions, setCourtSuggestions] = useState<CourtSuggestion[]>([]);
  const [judgeSuggestions, setJudgeSuggestions] = useState<JudgeSuggestion[]>([]);
  // Always false in the port — there is no async lookup in flight (see header).
  // TODO(venue-lookup): drive these from real loading state when the AI/internet
  // venue-lookup seam lands.
  const isSearchingVenue = false;
  const isSearchingCourts = false;
  const isSearchingJudges = false;

  // Each "search" simply seeds the existing value (when editing) and sorts.
  // The bible's online lookup is unavailable in the port (see header).
  const searchVenues = useCallback(
    (city: string, state: string, existingValue: string | null = null) => {
      if (!city || !state) {
        setVenueSuggestions([]);
        return;
      }
      setVenueSuggestions((prev) => {
        const next = existingValue
          ? [...prev.filter((v) => v.courthouse !== existingValue), { courthouse: existingValue, isExisting: true }]
          : [...prev];
        return next.sort((a, b) => a.courthouse.localeCompare(b.courthouse));
      });
    },
    [],
  );

  const searchCourts = useCallback(
    (courthouse: string, existingValue: string | null = null) => {
      if (!courthouse) {
        setCourtSuggestions([]);
        return;
      }
      setCourtSuggestions((prev) => {
        const next = existingValue
          ? [...prev.filter((c) => c.court !== existingValue), { court: existingValue, isExisting: true }]
          : [...prev];
        return next.sort((a, b) => a.court.localeCompare(b.court));
      });
    },
    [],
  );

  const searchJudges = useCallback(
    (courthouse: string, court: string, existingValue: string | null = null) => {
      if (!courthouse || !court) {
        setJudgeSuggestions([]);
        return;
      }
      setJudgeSuggestions((prev) => {
        const next = existingValue
          ? [...prev.filter((j) => j.judge !== existingValue), { judge: existingValue, isExisting: true }]
          : [...prev];
        return next.sort((a, b) => a.judge.localeCompare(b.judge));
      });
    },
    [],
  );

  return {
    venueSuggestions,
    setVenueSuggestions,
    isSearchingVenue,
    courtSuggestions,
    setCourtSuggestions,
    isSearchingCourts,
    judgeSuggestions,
    setJudgeSuggestions,
    isSearchingJudges,
    searchVenues,
    searchCourts,
    searchJudges,
  };
}
