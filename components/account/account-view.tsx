"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { FormError } from "@/components/auth/auth-shell";
import { useAuth } from "@/components/providers/auth-provider";
import { authHeader, cancelReservation, listMyReservations, signOut, type Reservation } from "@/lib/backend";
import { formatPrice } from "@/lib/site";

const statusLabel: Record<Reservation["status"], { text: string; className: string }> = {
  pending: { text: "Deposit хүлээж буй", className: "border-gold/40 text-gold" },
  confirmed: { text: "Баталгаажсан", className: "border-success/40 text-success" },
  cancelled: { text: "Цуцалсан", className: "border-line text-muted" },
};

type MyOrder = {
  id: string;
  number: number;
  table_no: number;
  lines: { id: string; name: string; qty: number; price: number }[];
  total: number;
  status: "awaiting_payment" | "new" | "preparing" | "served" | "paid" | "cancelled";
  created_at: string;
};

const ORDER_STEPS = ["Хүлээн авсан", "Бэлтгэж байна", "Хүргэсэн", "Дууссан"];
const orderStep: Record<MyOrder["status"], number> = { awaiting_payment: -1, new: 0, preparing: 1, served: 2, paid: 3, cancelled: -2 };

function OrderCard({ o }: { o: MyOrder }) {
  const step = orderStep[o.status];
  return (
    <li className={`rounded-2xl border border-line bg-ink-2 p-5 ${o.status === "cancelled" ? "opacity-60" : ""}`}>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="font-display text-2xl text-cream">
          #{String(o.number).padStart(3, "0")} <span className="text-base text-cream-dim">· Ширээ {o.table_no}</span>
        </p>
        <p className="font-mono text-sm text-gold-soft tabular-nums">{formatPrice(o.total)}</p>
      </div>
      <p className="mt-1 text-sm text-cream-dim">{o.lines.map((l) => `${l.qty}× ${l.name}`).join(", ")}</p>
      <p className="mt-1 font-mono text-[0.65rem] text-muted">{new Date(o.created_at).toLocaleString("mn-MN", { hour12: false, month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" })}</p>
      {step >= 0 ? (
        <ol className="mt-4 grid grid-cols-4 gap-1.5">
          {ORDER_STEPS.map((label, i) => (
            <li key={label} className="flex flex-col gap-1.5">
              <span className={`h-1 rounded-full ${i <= step ? "bg-gold" : "bg-white/10"}`} />
              <span className={`font-mono text-[0.55rem] tracking-wider uppercase ${i <= step ? "text-cream" : "text-muted"}`}>{label}</span>
            </li>
          ))}
        </ol>
      ) : (
        <p className={`mt-3 inline-block rounded-full border px-3 py-1 text-xs ${o.status === "cancelled" ? "border-line text-muted" : "border-gold/40 text-gold"}`}>
          {o.status === "cancelled" ? "Цуцлагдсан" : "Төлбөр хүлээж байна"}
        </p>
      )}
    </li>
  );
}

export function AccountView() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [items, setItems] = useState<Reservation[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [orders, setOrders] = useState<MyOrder[] | null>(null);
  const [tab, setTab] = useState<"reservations" | "orders">("reservations");
  const [showPast, setShowPast] = useState(false);

  useEffect(() => {
    if (!loading && !user) router.replace("/login?next=/account");
  }, [loading, user, router]);

  useEffect(() => {
    if (!user) return;
    let alive = true;
    listMyReservations(user.id).then((res) => {
      if (!alive) return;
      if (res.ok) setItems(res.data);
      else setError(res.error);
    });
    return () => {
      alive = false;
    };
  }, [user]);

  // QR-menu orders placed while signed in; refreshed while any is still in progress.
  useEffect(() => {
    if (!user) return;
    let alive = true;
    const load = async () => {
      const res = await fetch("/api/my/orders", { headers: await authHeader(), cache: "no-store" }).catch(() => null);
      if (!alive) return;
      if (res?.ok) setOrders(((await res.json()) as { orders: MyOrder[] }).orders);
      else setOrders((o) => o ?? []);
    };
    load();
    const id = setInterval(load, 10000);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, [user]);

  async function cancel(id: string) {
    setConfirmId(null);
    const res = await cancelReservation(id);
    if (!res.ok) return setError(res.error);
    setItems((list) => list?.map((r) => (r.id === id ? { ...r, status: "cancelled" } : r)) ?? null);
  }

  if (loading || !user) {
    return <div className="h-96 animate-pulse rounded-3xl bg-ink-2" aria-busy />;
  }

  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Ulaanbaatar" }).format(new Date());

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div>
          <p className="text-xs tracking-[0.35em] text-gold uppercase">My account</p>
          <h1 className="mt-3 font-display text-5xl text-cream sm:text-6xl">
            Сайн уу, <em className="text-gold">{user.fullName.split(" ")[0] || "зочин"}</em>
          </h1>
          <p className="mt-2 text-cream-dim">{user.email}</p>
        </div>
        <div className="flex gap-3">
          <Link href="/reserve" className="rounded-full bg-gold px-5 py-3 text-sm font-semibold text-ink">
            + Шинэ захиалга
          </Link>
          <button
            onClick={async () => {
              await signOut();
              router.replace("/");
            }}
            className="rounded-full border border-line px-5 py-3 text-sm text-cream hover:border-danger hover:text-danger"
          >
            Гарах
          </button>
        </div>
      </div>

      <div className="mt-14 mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-1.5" role="tablist">
          {[
            { id: "reservations" as const, label: "Ширээ захиалга" },
            { id: "orders" as const, label: "Захиалга (QR)" },
          ].map((t) => (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={tab === t.id}
              onClick={() => setTab(t.id)}
              className={`rounded-full px-4 py-2 text-sm ${tab === t.id ? "bg-gold font-semibold text-ink" : "border border-line text-cream hover:border-gold"}`}
            >
              {t.label}
            </button>
          ))}
        </div>
        <div className="flex gap-1.5 text-xs">
          {[
            { v: false, l: "Идэвхтэй" },
            { v: true, l: "Өнгөрсөн" },
          ].map((x) => (
            <button key={x.l} type="button" onClick={() => setShowPast(x.v)} className={`rounded-full px-3 py-1.5 ${showPast === x.v ? "bg-cream text-ink" : "text-cream-dim hover:text-cream"}`}>
              {x.l}
            </button>
          ))}
        </div>
      </div>
      <FormError message={error} />

      {tab === "orders" ? (
        orders === null ? (
          <div className="h-24 animate-pulse rounded-2xl bg-ink-2" />
        ) : (() => {
          const list = orders.filter((o) => (showPast ? o.status === "paid" || o.status === "cancelled" : o.status !== "paid" && o.status !== "cancelled"));
          return list.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-line p-10 text-center">
              <p className="font-display text-3xl text-cream">{showPast ? "Өнгөрсөн захиалга алга" : "Идэвхтэй захиалга алга"}</p>
              <p className="mt-2 text-cream-dim">Ширээн дээрх QR-ийг уншуулж, нэвтэрсэн үедээ захиалбал энд харагдана.</p>
            </div>
          ) : (
            <ul className="space-y-3">
              {list.map((o) => (
                <OrderCard key={o.id} o={o} />
              ))}
            </ul>
          );
        })()
      ) : items === null ? (
        <div className="space-y-3">
          {[0, 1].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-2xl bg-ink-2" />
          ))}
        </div>
      ) : items.filter((r) => (showPast ? r.date < today || r.status === "cancelled" : r.date >= today && r.status !== "cancelled")).length === 0 ? (
        <div className="rounded-3xl border border-dashed border-line p-10 text-center">
          <p className="font-display text-3xl text-cream">{showPast ? "Өнгөрсөн захиалга алга" : "Ирэх захиалга алга"}</p>
          <p className="mt-2 text-cream-dim">Анхны ширээгээ захиалаарай ☕</p>
        </div>
      ) : (
        <ul className="space-y-3">
          <AnimatePresence initial={false}>
            {items
              .filter((r) => (showPast ? r.date < today || r.status === "cancelled" : r.date >= today && r.status !== "cancelled"))
              .map((r, i) => {
              const s = statusLabel[r.status];
              const upcoming = r.status !== "cancelled" && r.date >= today;
              return (
                <motion.li
                  key={r.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0, transition: { delay: i * 0.05 } }}
                  className={`flex flex-col gap-4 rounded-2xl border border-line bg-ink-2 p-5 sm:flex-row sm:items-center ${
                    r.status === "cancelled" ? "opacity-60" : ""
                  }`}
                >
                  <div className="flex items-center gap-5">
                    <div className="grid size-16 shrink-0 place-items-center rounded-2xl border border-gold/30 text-center">
                      <span className="font-deco text-xl leading-none text-cream">{r.date.slice(8, 10)}</span>
                      <span className="text-[0.6rem] text-muted">{Number(r.date.slice(5, 7))}-р сар</span>
                    </div>
                    <div>
                      <p className="text-lg text-cream tabular-nums">
                        {r.time.slice(0, 5)} · {r.guests} хүн
                      </p>
                      <p className="text-sm text-muted">{r.note || r.full_name}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 sm:ml-auto">
                    <span className={`rounded-full border px-3 py-1 text-xs ${s.className}`}>{s.text}</span>
                    {r.status !== "cancelled" && (
                      <span className={`rounded-full border px-3 py-1 text-xs ${r.deposit_paid ? "border-success/40 text-success" : "border-line text-cream-dim"}`}>
                        Deposit {r.deposit_paid ? "✓" : formatPrice(r.deposit ?? 50000)}
                      </span>
                    )}
                    {upcoming &&
                      (confirmId === r.id ? (
                        <span className="flex gap-2">
                          <button onClick={() => cancel(r.id)} className="rounded-full bg-danger px-3 py-1 text-xs font-semibold text-ink">
                            Тийм, цуцлах
                          </button>
                          <button onClick={() => setConfirmId(null)} className="rounded-full border border-line px-3 py-1 text-xs text-cream">
                            Үгүй
                          </button>
                        </span>
                      ) : (
                        <button onClick={() => setConfirmId(r.id)} className="text-xs text-cream-dim underline-offset-4 hover:text-danger hover:underline">
                          Цуцлах
                        </button>
                      ))}
                  </div>
                </motion.li>
              );
            })}
          </AnimatePresence>
        </ul>
      )}
    </div>
  );
}
