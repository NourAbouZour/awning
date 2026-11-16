/** Report windows the analytics page offers, in days. */
export const RANGES = [7, 30, 90] as const;
export type RangeDays = (typeof RANGES)[number];

/** Read `?range=` into one of the allowed windows (30 days by default). */
export function parseRange(raw: string | string[] | null | undefined): RangeDays {
  const value = Number(Array.isArray(raw) ? raw[0] : raw);
  return (RANGES as readonly number[]).includes(value)
    ? (value as RangeDays)
    : 30;
}

/**
 * The current window (today plus the days before it, from local midnight) and
 * the previous window of the same length, used for the "vs before" changes.
 */
export function rangeWindow(days: RangeDays) {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - (days - 1));
  const prevStart = new Date(start);
  prevStart.setDate(prevStart.getDate() - days);
  return { start, prevStart, end: new Date() };
}

/** Local calendar day key, e.g. "2026-11-16". */
export function dayKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate(),
  ).padStart(2, "0")}`;
}
