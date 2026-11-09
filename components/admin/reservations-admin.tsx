"use client";

import { useCallback, useEffect, useState } from "react";
import { AdminGate, type AdminHeaders } from "@/components/admin/admin-gate";
import { adminFetch, PageHead } from "@/components/admin/admin-ui";
import type { Reservation } from "@/lib/backend";
import { formatPrice } from "@/lib/site";

const STATUS = {
  pending: { label: "Deposit хүлээж буй", cls: "bg-gold/20 text-gold" },
  confirmed: { label: "Баталгаажсан", cls: "bg-success/20 text-success" },
  cancelled: { label: "Цуцлагдсан", cls: "bg-danger/15 text-danger" },
} as const;

function today() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Ulaanbaatar" }).format(new Date());
}

function List({ auth }: { auth: AdminHeaders }) {
  const [items, setItems] = useState<Reservation[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [past, setPast] = useState(false);

  const load = useCallback(async () => {
    try {
      const { items } = await adminFetch<{ items: Reservation[] }>(auth, "/api/admin/reservations");
      setItems(items);
      setError(null);
    } catch (e) {
      setError((e as Error).message);
    }
  }, [auth]);

  useEffect(() => {
    const first = setTimeout(load, 0);
    const id = setInterval(load, 20000);
    return () => {
      clearTimeout(first);
      clearInterval(id);
    };
  }, [load]);

  async function patch(id: string, body: Partial<Reservation>) {
    try {
      const { item } = await adminFetch<{ item: Reservation }>(auth, `/api/admin/reservations/${id}`, { method: "PATCH", body: JSON.stringify(body) });
      setItems((l) => l?.map((r) => (r.id === id ? item : r)) ?? l);
    } catch (e) {
      setError((e as Error).message);
    }
  }

  const t = today();
  const shown = (items ?? []).filter((r) => (past ? r.date < t : r.date >= t));
  const byDate = new Map<string, Reservation[]>();
  for (const r of shown) byDate.set(r.date, [...(byDate.get(r.date) ?? []), r]);

  return (
    <main className="mx-auto max-w-5xl px-4 py-6 sm:px-6">
      <PageHead title="Ширээ захиалга" sub="18:00-оос хойш · 21+ · 50,000₮ deposit (үндсэн төлбөрөөс хасагдана). Deposit төлөгдсөнийг тэмдэглэхэд захиалга баталгаажна.">
        <div className="flex gap-1.5">
          {[
            { v: false, l: "Ирэх" },
            { v: true, l: "Өнгөрсөн 7 хоног" },
          ].map((x) => (
            <button
              key={x.l}
              type="button"
              onClick={() => setPast(x.v)}
              className={`rounded-full px-4 py-2 font-mono text-[0.62rem] tracking-[0.15em] uppercase ${past === x.v ? "bg-cream text-ink" : "border border-white/15 text-cream"}`}
            >
              {x.l}
            </button>
          ))}
        </div>
      </PageHead>

      {error && <p role="alert" className="mt-4 text-sm text-danger">{error}</p>}
      {!items && !error && <p className="mt-8 text-sm text-muted">Ачааллаж байна…</p>}
      {items && shown.length === 0 && <p className="mt-8 text-sm text-muted">Захиалга алга.</p>}

      {[...byDate].map(([date, list]) => (
        <section key={date} className="mt-8">
          <h2 className="flex items-baseline justify-between border-b border-white/10 pb-2">
            <span className="font-display text-2xl text-cream">{date === t ? "Өнөөдөр" : date}</span>
            <span className="font-mono text-[0.6rem] tracking-[0.15em] text-muted uppercase">
              {list.filter((r) => r.status !== "cancelled").reduce((s, r) => s + r.guests, 0)} зочин
            </span>
          </h2>
          <ul className="mt-3 grid gap-3">
            {list.map((r) => {
              const s = STATUS[r.status];
              return (
                <li key={r.id} className={`grid gap-3 rounded-2xl border p-4 sm:grid-cols-[5rem_1fr_auto] sm:items-center ${r.status === "cancelled" ? "border-white/5 opacity-60" : "border-white/10 bg-ink-2/60"}`}>
                  <p className="font-display text-3xl text-cream tabular-nums">{r.time.slice(0, 5)}</p>
                  <div>
                    <p className="text-cream">
                      <b>{r.full_name}</b> · {r.guests} хүн ·{" "}
                      <a href={`tel:${r.phone.replace(/\s/g, "")}`} className="text-gold-soft underline-offset-2 hover:underline">
                        {r.phone}
                      </a>
                    </p>
                    {r.note && <p className="mt-1 text-sm text-cream-dim">📝 {r.note}</p>}
                    <p className="mt-2 flex flex-wrap gap-2">
                      <span className={`rounded-full px-3 py-1 font-mono text-[0.58rem] tracking-[0.12em] uppercase ${s.cls}`}>{s.label}</span>
                      <span className={`rounded-full px-3 py-1 font-mono text-[0.58rem] tracking-[0.12em] uppercase ${r.deposit_paid ? "bg-success/20 text-success" : "bg-white/5 text-cream-dim"}`}>
                        Deposit {formatPrice(r.deposit ?? 50000)} {r.deposit_paid ? "✓ төлсөн" : "төлөөгүй"}
                      </span>
                    </p>
                  </div>
                  {r.status !== "cancelled" && (
                    <div className="flex flex-wrap gap-2 sm:justify-end">
                      <button
                        type="button"
                        onClick={() => patch(r.id, { deposit_paid: !r.deposit_paid })}
                        className={`rounded-full px-4 py-2 font-mono text-[0.6rem] tracking-[0.12em] uppercase ${r.deposit_paid ? "border border-white/15 text-cream-dim" : "bg-gold text-ink"}`}
                      >
                        {r.deposit_paid ? "Deposit буцаах" : "Deposit төлсөн ✓"}
                      </button>
                      <button type="button" onClick={() => patch(r.id, { status: "cancelled" })} className="rounded-full border border-white/10 px-3 py-2 font-mono text-[0.6rem] tracking-[0.12em] text-muted uppercase hover:border-danger hover:text-danger">
                        Цуцлах
                      </button>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </main>
  );
}

export function ReservationsAdmin() {
  return <AdminGate>{(auth) => <List auth={auth} />}</AdminGate>;
}
