// Evening menu: from 18:00 (Ulaanbaatar time) only items marked `evening` — alcohol, soda, soft drinks — can be ordered.
// Coffee, matcha and the rest come back in the morning. Shared by the QR menu (to hide them) and the orders API (which enforces it).
import type { MenuItem } from "./menu-data";

export const EVENING = {
  fromHour: 18, // evening menu starts
  untilHour: 6, // …and ends (before the café opens at 08:00)
} as const;

/** Current hour in Ulaanbaatar (UTC+8 all year, no DST), whatever timezone the server or phone is in. */
export function ubHour(now = new Date()): number {
  return (now.getUTCHours() + 8) % 24;
}

export function isEvening(now = new Date()): boolean {
  const h = ubHour(now);
  return h >= EVENING.fromHour || h < EVENING.untilHour;
}

/**
 * Whether an item can be ordered right now. Items without the `evening` field (database column not added yet)
 * are never restricted, so the menu keeps working until supabase/evening-menu.sql is run.
 */
export function orderableNow(item: Pick<MenuItem, "evening">, evening: boolean): boolean {
  return !evening || item.evening !== false;
}

export const pad = (h: number) => `${String(h).padStart(2, "0")}:00`;
