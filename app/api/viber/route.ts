/**
 * Viber Channel webhook. Viber only requires that this URL answers 200 (it's needed before the Channel
 * accepts posts); we don't act on anything Viber sends here.
 */
export function POST() {
  return Response.json({ ok: true });
}
