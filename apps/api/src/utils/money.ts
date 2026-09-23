/**
 * Converts a major-unit money value (e.g. 100.5 EUR) into the smallest currency
 * unit expected by Stripe (e.g. 10050). Values are stored as 2-decimal Prisma
 * decimals, so scaling by 100 and rounding is safe and avoids float drift.
 */
export function toMinorUnits(amount: number): number {
  return Math.round(amount * 100);
}
