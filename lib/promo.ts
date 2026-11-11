// "2+1" on beer: for every 3 beers in one order, the cheapest one is free.
// Shared by the QR menu (to preview the discount) and the orders API (which recomputes it — never trusts the client).
import type { MenuItem } from "./menu-data";

/** Beer "2+1" promotion. Set to true to bring back the discount and every 2+1 sign on the site. */
export const BEER_PROMO = false;

export type Line = { item: Pick<MenuItem, "id" | "category" | "price">; qty: number };

export function beerDiscount(lines: Line[]): { free: number; discount: number } {
  if (!BEER_PROMO) return { free: 0, discount: 0 };
  const units = lines
    .filter((l) => l.item.category === "beer")
    .flatMap((l) => Array.from({ length: l.qty }, () => l.item.price))
    .sort((a, b) => a - b);
  const free = Math.floor(units.length / 3);
  return { free, discount: units.slice(0, free).reduce((s, p) => s + p, 0) };
}

export function totals(lines: Line[]) {
  const subtotal = lines.reduce((s, l) => s + l.item.price * l.qty, 0);
  const { free, discount } = beerDiscount(lines);
  return { subtotal, free, discount, total: subtotal - discount };
}
