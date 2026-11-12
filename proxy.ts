import { NextResponse, type NextRequest } from "next/server";
import { clientIp, hit, limitHeaders, tooMany } from "@/lib/rate-limit";

/**
 * Per-IP rate limits for /api/*. Guests inside the café share one public IP (the Wi-Fi), and the staff board
 * polls every 4s, so the general limit is generous; writes that cost money / notify staff are tighter.
 * Payment & Viber webhooks are excluded in `config.matcher` (they come from Wire/Viber servers).
 */
const MIN = 60_000;
const rules: { test: (method: string, path: string) => boolean; name: string; limit: number; windowMs: number }[] = [
  // Placing a table order (creates a payment invoice + staff alert). 12 tables behind one Wi-Fi IP.
  { name: "order", test: (m, p) => m === "POST" && p === "/api/orders", limit: 20, windowMs: MIN },
  // Admin image uploads.
  { name: "upload", test: (m, p) => m !== "GET" && p.startsWith("/api/admin/upload"), limit: 30, windowMs: MIN },
  // Every other write.
  { name: "write", test: (m) => m !== "GET" && m !== "HEAD" && m !== "OPTIONS", limit: 60, windowMs: MIN },
  // Reads (status polling, admin board, …).
  { name: "read", test: () => true, limit: 300, windowMs: MIN },
];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const rule = rules.find((r) => r.test(request.method, pathname))!;
  const result = hit(`${rule.name}:${clientIp(request)}`, rule.limit, rule.windowMs);
  if (!result.ok) return tooMany(result);

  const res = NextResponse.next();
  for (const [k, v] of Object.entries(limitHeaders(result))) res.headers.set(k, v);
  return res;
}

export const config = {
  // All API routes except the Wire payment webhook and the Viber callback.
  matcher: ["/api/((?!payments/wire|viber).*)"],
};
