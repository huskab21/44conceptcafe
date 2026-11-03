"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { FormError } from "@/components/auth/auth-shell";
import { useAuth } from "@/components/providers/auth-provider";
import { cancelReservation, listMyReservations, signOut, type Reservation } from "@/lib/backend";

const statusLabel: Record<Reservation["status"], { text: string; className: string }> = {
  pending: { text: "Хүлээгдэж буй", className: "border-gold/40 text-gold" },
  confirmed: { text: "Баталгаажсан", className: "border-success/40 text-success" },
  cancelled: { text: "Цуцалсан", className: "border-line text-muted" },
};

export function AccountView() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [items, setItems] = useState<Reservation[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);

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

  async function cancel(id: string) {
    setConfirmId(null);
    const res = await cancelReservation(id);
    if (!res.ok) return setError(res.error);
    setItems((list) => list?.map((r) => (r.id === id ? { ...r, status: "cancelled" } : r)) ?? null);
  }

  if (loading || !user) {
    return <div className="h-96 animate-pulse rounded-3xl bg-ink-2" aria-busy />;
  }

  const today = new Date().toISOString().slice(0, 10);

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

      <h2 className="mt-14 mb-5 field-label">Миний захиалгууд</h2>
      <FormError message={error} />

      {items === null ? (
        <div className="space-y-3">
          {[0, 1].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-2xl bg-ink-2" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-line p-10 text-center">
          <p className="font-display text-3xl text-cream">Захиалга алга байна</p>
          <p className="mt-2 text-cream-dim">Анхны ширээгээ захиалаарай ☕</p>
        </div>
      ) : (
        <ul className="space-y-3">
          <AnimatePresence initial={false}>
            {items.map((r, i) => {
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
