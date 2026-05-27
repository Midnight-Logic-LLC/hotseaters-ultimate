/**
 * retainer-formula.ts — pure business rule from the bible's
 * `HotSeatersMVP/src/components/settings/BillingSettingsTab.jsx`
 * "Test Your Formula" calculator (lines ~165–172).
 *
 * Formula: max(minimum, floor(budget / divisor) * multiplier).
 *
 * Pure — no I/O, no side-effects (RULE 6). Safe to import from
 * components, hooks, stores, or tests.
 */

export interface RetainerCalcParams {
  budget: number;
  divisor: number;
  multiplier: number;
  minimum: number;
}

export function calculateRetainer(params: RetainerCalcParams): number {
  const { budget, divisor, multiplier, minimum } = params;
  const safeDivisor = divisor > 0 ? divisor : 1;
  const safeBudget = Number.isFinite(budget) && budget > 0 ? budget : 0;
  const safeMultiplier = Number.isFinite(multiplier) ? multiplier : 0;
  const safeMinimum = Number.isFinite(minimum) ? minimum : 0;
  const tieredContribution =
    Math.floor(safeBudget / safeDivisor) * safeMultiplier;
  return Math.max(safeMinimum, tieredContribution);
}
