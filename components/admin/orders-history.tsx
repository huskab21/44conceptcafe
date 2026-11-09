"use client";

import { useCallback, useEffect, useState } from "react";
import { AdminGate, type AdminHeaders } from "@/components/admin/admin-gate";
import { adminFetch, PageHead } from "@/components/admin/admin-ui";
import { formatPrice } from "@/lib/site";

type Order = {
  id: string;
  number: number;
  table_no: number;
  lines: { id: string; name: string; price: number; qty: number }[];
  note: string | null;
  total: number;
  discount: number;
  status: "new" | "preparing" | "served" | "paid" | "cancelled";
  created_at: string;
  paid_at: string | null;
};

const STATUS_LABEL: Record<Order["status"], { label: string; cls: string }> = {
  new: { label: "Шинэ", cls: "bg-gold text-ink" },
  preparing: { label: "Бэлтгэж байна", cls: "bg-gold/20 text-gold" },
  served: { label: "Хүргэсэн", cls: "bg-white/10 text-cream" },
  paid: { label: "Биелэгдсэн", cls: "bg-success/20 text-success" },
  cancelled: { label: "Цуцлагдсан", cls: "bg-danger/15 text-danger" },
};

const FILTERS = [
  { id: "all", label: "Бүгд", match: () => true },
  { id: "done", label: "Биелэгдсэн", match: (o: Order) => o.status === "paid" },
  { id: "open", label: "Биелэгдээгүй", match: (o: Order) => o.status === "new" || o.status === "preparing" || o.status === "served" },
  { id: "cancelled", label: "Цуцлагдсан", match: (o: Order) => o.status === "cancelled" },
] as const;

const RANGES = [
  { days: 1, label: "Өнөөдөр" },
  { days: 7, label: "7 хоног" },
  { days: 30, label: "30 хоног" },
  { days: 90, label: "90 хоног" },
];

function when(iso: string) {
  return new Date(iso).toLocaleString("mn-MN", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hour12: false });
}

function History({ auth }: { auth: AdminHeaders }) {
  const [days, setDays] = useState(1);
  const [filter, setFilter] = useState<(typeof FILTERS)[number]["id"]>("all");
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const { orders } = await adminFetch<{ orders: Order[] }>(auth, `/api/orders?days=${days}`);
      setOrders(orders);
      setError(null);
    } catch (e) {
      setError((e as Error).message);
    }
  }, [auth, days]);

  useEffect(() => {
    const first = setTimeout(load, 0);
    const id = setInterval(load, 15000);
    return () => {
      clearTimeout(first);
      clearInterval(id);
    };
  }, [load]);

  const all = orders ?? [];
  const f = FILTERS.find((x) => x.id === filter)!;
  const shown = all.filter(f.match);
  const sum = (list: Order[]) => list.reduce((s, o) => s + o.total, 0);
  const done = all.filter(FILTERS[1].match);
  const pending = all.filter(FILTERS[2].match);

  return (
    <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
      <PageHead title="Захиалгын түүх" sub="Биелэгдсэн = бүрэн дууссан (төлөгдсөн). Биелэгдээгүй = шинэ, бэлтгэж буй эсвэл хүргэсэн ч дуусаагүй.">
        <div className="flex gap-1.5">
          {RANGES.map((r) => (
            <button
              key={r.days}
              type="button"
              onClick={() => setDays(r.days)}
              className={`rounded-full px-4 py-2 font-mono text-[0.62rem] tracking-[0.15em] uppercase ${days === r.days ? "bg-cream text-ink" : "border border-white/15 text-cream"}`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </PageHead>

      <dl className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { k: "Нийт захиалга", v: String(all.length) },
          { k: "Биелэгдсэн", v: `${done.length} · ${formatPrice(sum(done))}` },
          { k: "Биелэгдээгүй", v: `${pending.length} · ${formatPrice(sum(pending))}` },
          { k: "Цуцлагдсан", v: String(all.filter(FILTERS[3].match).length) },
        ].map((s) => (
          <div key={s.k} className="rounded-2xl border border-white/10 bg-ink-2/60 p-4">
            <dt className="font-mono text-[0.58rem] tracking-[0.18em] text-cream-dim uppercase">{s.k}</dt>
            <dd className="mt-2 font-display text-2xl text-cream tabular-nums">{s.v}</dd>
          </div>
        ))}
      </dl>

      <nav className="no-scrollbar mt-6 flex gap-2 overflow-x-auto" aria-label="Шүүлтүүр">
        {FILTERS.map((x) => (
          <button
            key={x.id}
            type="button"
            onClick={() => setFilter(x.id)}
            className={`shrink-0 rounded-full px-4 py-2 font-mono text-[0.62rem] tracking-[0.15em] uppercase ${filter === x.id ? "bg-gold text-ink" : "border border-white/15 text-cream"}`}
          >
            {x.label} <span className="opacity-60">{all.filter(x.match).length}</span>
          </button>
        ))}
      </nav>

      {error && <p role="alert" className="mt-4 text-sm text-danger">{error}</p>}
      {!orders && !error && <p className="mt-8 text-sm text-muted">Ачааллаж байна…</p>}
      {orders && shown.length === 0 && <p className="mt-8 text-sm text-muted">Энэ хугацаанд захиалга алга.</p>}

      <ul className="mt-4 divide-y divide-white/5 rounded-3xl border border-white/10 bg-ink-2/40">
        {shown.map((o) => {
          const s = STATUS_LABEL[o.status];
          const expanded = open === o.id;
          return (
            <li key={o.id}>
              <button type="button" onClick={() => setOpen(expanded ? null : o.id)} aria-expanded={expanded} className="grid w-full grid-cols-[auto_1fr_auto] items-center gap-x-4 gap-y-1 px-4 py-3 text-left hover:bg-white/[0.03] sm:grid-cols-[5rem_6rem_1fr_8rem_7rem]">
                <span className="font-mono text-sm text-cream tabular-nums">#{String(o.number).padStart(3, "0")}</span>
                <span className="font-mono text-xs text-cream-dim tabular-nums">{when(o.created_at)}</span>
                <span className="col-span-3 truncate text-sm text-cream sm:col-span-1">
                  <b className="text-gold-soft">Ширээ {o.table_no}</b> · {o.lines.map((l) => `${l.qty}× ${l.name}`).join(", ")}
                </span>
                <span className={`justify-self-start rounded-full px-3 py-1 font-mono text-[0.58rem] tracking-[0.12em] uppercase sm:justify-self-center ${s.cls}`}>{s.label}</span>
                <span className="justify-self-end font-mono text-sm text-cream tabular-nums">{formatPrice(o.total)}</span>
              </button>
              {expanded && (
                <div className="border-t border-white/5 px-4 py-3 text-sm text-cream-dim">
                  <ul className="space-y-1">
                    {o.lines.map((l) => (
                      <li key={l.id} className="flex justify-between">
                        <span>
                          {l.qty}× {l.name}
                        </span>
                        <span className="font-mono tabular-nums">{formatPrice(l.price * l.qty)}</span>
                      </li>
                    ))}
                  </ul>
                  {o.discount > 0 && <p className="mt-2 text-gold">2+1 урамшуулал −{formatPrice(o.discount)}</p>}
                  {o.note && <p className="mt-2">📝 {o.note}</p>}
                  {o.paid_at && <p className="mt-2 text-gold">✓ Bonum-оор төлөгдсөн · {when(o.paid_at)}</p>}
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </main>
  );
}

export function OrdersHistory() {
  return <AdminGate>{(auth) => <History auth={auth} />}</AdminGate>;
}
