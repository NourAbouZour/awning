import type { DayHours } from "@/lib/types";

/**
 * Opening hours are stored as a JSON array of DayHours in Store.hours. These
 * helpers build defaults, parse the stored value, and format times for display.
 */
export const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;

export function defaultHours(): DayHours[] {
  return DAYS.map((day) => ({
    day,
    closed: day === "Sun",
    open: "09:00",
    close: "18:00",
  }));
}

/** Parse the stored hours string. Returns null when it isn't structured JSON. */
export function parseHours(raw: string | undefined | null): DayHours[] | null {
  if (!raw) return null;
  try {
    const v = JSON.parse(raw);
    if (
      Array.isArray(v) &&
      v.length > 0 &&
      v.every((d) => d && typeof d.day === "string")
    ) {
      return v as DayHours[];
    }
  } catch {
    /* legacy free-text value */
  }
  return null;
}

/** "09:00" -> "9:00 AM". Falls back to the raw value if it can't be parsed. */
export function formatTime(t: string): string {
  const m = /^(\d{1,2}):(\d{2})$/.exec(t);
  if (!m) return t;
  let h = Number(m[1]);
  const min = m[2];
  const ampm = h >= 12 ? "PM" : "AM";
  h = h % 12 || 12;
  return `${h}:${min} ${ampm}`;
}

export function formatDayRange(d: DayHours): string {
  return d.closed ? "Closed" : `${formatTime(d.open)} – ${formatTime(d.close)}`;
}
