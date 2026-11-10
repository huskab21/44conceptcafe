"use client";

import Image from "next/image";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useMemo, useState } from "react";
import { categories, type MenuItem } from "@/lib/menu-data";
import { totals } from "@/lib/promo";
import { useAuth } from "@/components/providers/auth-provider";
import { authHeader } from "@/lib/backend";
import { formatPrice, site } from "@/lib/site";
import { Logo } from "@/components/logo";

type PlacedOrder = { id: string; number: number; total: number; status: string; pay_url?: string | null; paid_at?: string | null };

const STATUS: Record<string, { label: string; step: number }> = {
  awaiting_payment: { label: "Төлбөр хүлээж байна", step: -2 },
  new: { label: "Захиалга хүлээн авлаа", step: 0 },
  preparing: { label: "Бэлтгэж байна", step: 1 },
  served: { label: "Ширээнд тань хүргэлээ", step: 2 },
  paid: { label: "Төлбөр төлөгдсөн. Баярлалаа!", step: 3 },
  cancelled: { label: "Захиалга цуцлагдсан", step: -1 },
};
const STEPS = ["Хүлээн авсан", "Бэлтгэж байна", "Хүргэсэн", "Төлсөн"];

function Stepper({ qty, onChange, name }: { qty: number; onChange: (q: number) => void; name: string }) {
  if (qty === 0) {
    return (
      <button
        type="button"
        onClick={() => onChange(1)}
        aria-label={`${name} нэмэх`}
        className="grid size-9 place-items-center rounded-full bg-gold text-lg leading-none font-bold text-ink transition-transform active:scale-90"
      >
        +
      </button>
    );
  }
  return (
    <div className="flex items-center gap-1 rounded-full border border-gold/60 bg-ink p-0.5">
      <button type="button" onClick={() => onChange(qty - 1)} aria-label={`${name} хасах`} className="grid size-8 place-items-center rounded-full text-lg text-cream active:bg-white/10">
        −
      </button>
      <span className="w-5 text-center font-mono text-sm text-cream tabular-nums" aria-live="polite">
        {qty}
      </span>
      <button type="button" onClick={() => onChange(qty + 1)} aria-label={`${name} нэмэх`} className="grid size-8 place-items-center rounded-full bg-gold text-lg text-ink active:scale-90">
        +
      </button>
    </div>
  );
}

export function QrMenu({ table, tableKey, items }: { table: number; tableKey: string; items: MenuItem[] }) {
  const storeKey = `h44_order_t${table}`;
  const { user } = useAuth();
  const [cart, setCart] = useState<Record<string, number>>({});
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [placed, setPlaced] = useState<PlacedOrder | null>(null);

  const groups = useMemo(
    () => categories.map((c) => ({ ...c, items: items.filter((i) => i.category === c.id) })).filter((g) => g.items.length > 0),
    [items],
  );
  const byId = useMemo(() => new Map(items.map((i) => [i.id, i])), [items]);
  const lines = Object.entries(cart)
    .filter(([id, q]) => q > 0 && byId.has(id))
    .map(([id, qty]) => ({ item: byId.get(id)!, qty }));
  const count = lines.reduce((s, l) => s + l.qty, 0);
  const t = totals(lines);
  const beerCount = lines.filter((l) => l.item.category === "beer").reduce((s, l) => s + l.qty, 0);

  const setQty = (id: string, qty: number) => setCart((c) => ({ ...c, [id]: Math.max(0, Math.min(20, qty)) }));

  // Restore an order placed from this table in this browser session (survives a reload).
  useEffect(() => {
    const id = setTimeout(() => {
      try {
        const raw = sessionStorage.getItem(storeKey);
        if (raw) setPlaced(JSON.parse(raw) as PlacedOrder);
      } catch {
        /* storage unavailable */
      }
    }, 0);
    return () => clearTimeout(id);
  }, [storeKey]);

  // Poll the order's status while it's in progress.
  useEffect(() => {
    if (!placed || placed.status === "paid" || placed.status === "cancelled") return;
    const id = setInterval(async () => {
      const res = await fetch(`/api/orders/${placed.id}`, { cache: "no-store" }).catch(() => null);
      if (!res?.ok) return;
      const { order } = (await res.json()) as { order: PlacedOrder };
      if (order.status !== placed.status) {
        const next = { ...placed, status: order.status, paid_at: order.paid_at };
        setPlaced(next);
        try {
          sessionStorage.setItem(storeKey, JSON.stringify(next));
        } catch {}
      }
    }, placed.status === "awaiting_payment" ? 3000 : 5000);
    return () => clearInterval(id);
  }, [placed, storeKey]);

  async function submit() {
    setSending(true);
    setError(null);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "content-type": "application/json", ...(await authHeader()) },
        body: JSON.stringify({ table, key: tableKey, note, items: lines.map((l) => ({ id: l.item.id, qty: l.qty })) }),
      });
      const data = (await res.json()) as { order?: PlacedOrder; error?: string };
      if (!res.ok || !data.order) throw new Error(data.error ?? "Алдаа гарлаа.");
      const p: PlacedOrder = {
        id: data.order.id,
        number: data.order.number,
        total: data.order.total,
        status: data.order.status,
        pay_url: data.order.pay_url ?? null,
        paid_at: data.order.paid_at ?? null,
      };
      setPlaced(p);
      try {
        sessionStorage.setItem(storeKey, JSON.stringify(p));
      } catch {}
      // Prepaid flow: go straight to Bonum's payment page; it redirects back to this table page afterwards.
      if (p.status === "awaiting_payment" && p.pay_url) {
        window.location.assign(p.pay_url);
        return;
      }
      setCart({});
      setNote("");
      setOpen(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Алдаа гарлаа.");
    } finally {
      setSending(false);
    }
  }

  function newOrder() {
    setPlaced(null);
    try {
      sessionStorage.removeItem(storeKey);
    } catch {}
  }

  /* ───────────── order placed: status screen ───────────── */
  if (placed) {
    const s = STATUS[placed.status] ?? STATUS.new;
    return (
      <main className="mx-auto flex min-h-svh max-w-md flex-col px-5 py-8">
        <Header table={table} />
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mt-10 flex flex-1 flex-col">
          <p className="font-mono text-[0.65rem] tracking-[0.3em] text-gold uppercase">Захиалга</p>
          <p className="mt-2 font-display text-7xl text-cream tabular-nums">#{String(placed.number).padStart(3, "0")}</p>
          <p className="mt-4 text-lg text-cream" aria-live="polite">
            {s.label}
          </p>

          {s.step >= 0 && (
            <ol className="mt-8 grid grid-cols-4 gap-1.5">
              {STEPS.map((label, i) => (
                <li key={label} className="flex flex-col gap-2">
                  <span className={`h-1 rounded-full transition-colors duration-700 ${i <= s.step ? "bg-gold" : "bg-white/10"}`} />
                  <span className={`font-mono text-[0.55rem] tracking-wider uppercase ${i <= s.step ? "text-cream" : "text-muted"}`}>{label}</span>
                </li>
              ))}
            </ol>
          )}

          <div className="mt-10 rounded-2xl border border-white/10 bg-ink-2 p-5">
            <div className="flex items-baseline justify-between">
              <span className="font-mono text-[0.65rem] tracking-[0.2em] text-cream-dim uppercase">{placed.paid_at ? "Төлсөн дүн" : "Төлөх дүн"}</span>
              <span className="font-display text-3xl text-gold-soft tabular-nums">{formatPrice(placed.total)}</span>
            </div>
            {placed.status === "awaiting_payment" ? (
              <>
                <p className="mt-3 text-sm leading-relaxed text-cream-dim">
                  Төлбөр төлөгдмөгц захиалга тань бариста руу автоматаар очно. Энэ хуудас өөрөө шинэчлэгдэнэ.
                </p>
                {placed.pay_url && (
                  <a href={placed.pay_url} className="mt-4 block rounded-full bg-gold py-3.5 text-center font-mono text-xs font-medium tracking-[0.2em] text-ink uppercase active:scale-[0.98]">
                    Төлөх →
                  </a>
                )}
              </>
            ) : placed.paid_at ? (
              <p className="mt-3 text-sm leading-relaxed text-gold-soft">✓ Bonum-оор төлөгдсөн. Баярлалаа!</p>
            ) : (
              <p className="mt-3 text-sm leading-relaxed text-cream-dim">
                Төлбөрөө кассанд эсвэл ажилтнаар QR / картаар төлнө үү. Ширээ <b className="text-cream">{table}</b> гэж хэлэхэд болно.
              </p>
            )}
          </div>

          <div className="mt-auto flex flex-col gap-3 pt-10">
            <button type="button" onClick={newOrder} className="rounded-full border border-cream/60 py-3.5 font-mono text-xs tracking-[0.2em] text-cream uppercase active:bg-white/10">
              Нэмж захиалах
            </button>
            <a href={`tel:${site.phone.replace(/\s/g, "")}`} className="text-center font-mono text-[0.65rem] tracking-[0.2em] text-muted uppercase">
              Тусламж: {site.phone}
            </a>
          </div>
        </motion.div>
      </main>
    );
  }

  /* ───────────── menu ───────────── */
  return (
    <main className="mx-auto min-h-svh max-w-md pb-32">
      <div className="px-5 pt-8">
        <Header table={table} />
        <h1 className="mt-8 font-display text-5xl leading-[0.95] text-cream">
          Юу <em>уух</em> вэ?
        </h1>
        <p className="mt-3 text-sm text-cream-dim">Сонгоод захиалаарай — ширээнд тань авчирна.</p>

        <a
          href="#beer"
          className="mt-6 flex items-center gap-4 overflow-hidden rounded-2xl border border-gold/40 bg-[radial-gradient(circle_at_85%_50%,rgba(217,164,108,0.28),transparent_60%)] p-4"
        >
          <span className="grid size-14 shrink-0 -rotate-12 place-items-center rounded-full bg-gold font-display text-xl text-ink">2+1</span>
          <span>
            <span className="block font-mono text-[0.62rem] tracking-[0.2em] text-gold uppercase">Пивоны урамшуулал</span>
            <span className="mt-1 block text-sm text-cream">2 пиво авбал 1 нь бэлэг 🍺</span>
          </span>
        </a>
      </div>

      {/* category chips */}
      <nav className="no-scrollbar sticky top-0 z-20 mt-6 flex gap-2 overflow-x-auto border-b border-white/5 bg-ink/90 px-5 py-3 backdrop-blur-md" aria-label="Ангилал">
        {groups.map((g) => (
          <a key={g.id} href={`#${g.id}`} className="shrink-0 rounded-full border border-white/15 px-4 py-2 font-mono text-[0.65rem] tracking-[0.15em] whitespace-nowrap text-cream uppercase active:border-gold">
            {g.label}
          </a>
        ))}
      </nav>

      <div className="px-5">
        {groups.map((g) => (
          <section key={g.id} id={g.id} className="scroll-mt-16 pt-8" aria-label={g.label}>
            <h2 className="flex items-baseline justify-between border-b border-white/10 pb-2">
              <span className="font-display text-2xl text-cream">{g.label}</span>
              <span className="font-mono text-[0.6rem] tracking-[0.2em] text-muted uppercase">{g.en}</span>
            </h2>
            <ul className="divide-y divide-white/5">
              {g.items.map((item) => {
                const qty = cart[item.id] ?? 0;
                const beer = item.category === "beer";
                return (
                  <li key={item.id} className="flex items-center gap-4 py-4">
                    <div className={`relative size-20 shrink-0 overflow-hidden rounded-2xl ${beer ? "bg-[radial-gradient(circle,rgba(217,164,108,0.25),transparent_70%)]" : "bg-ink-2"}`}>
                      <Image src={item.image} alt="" fill sizes="80px" className={beer ? "object-contain p-1.5" : "object-cover"} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[0.95rem] leading-tight font-semibold text-cream">{item.name}</p>
                      <p className="mt-1 line-clamp-2 text-xs leading-snug text-cream-dim">{item.description}</p>
                      <p className="mt-1.5 font-mono text-sm text-gold-soft tabular-nums">{formatPrice(item.price)}</p>
                    </div>
                    <Stepper qty={qty} name={item.name} onChange={(q) => setQty(item.id, q)} />
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
      </div>

      {/* cart bar */}
      <AnimatePresence>
        {count > 0 && (
          <motion.div
            initial={{ y: 100 }}
            animate={{ y: 0 }}
            exit={{ y: 100 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed inset-x-0 bottom-0 z-30 mx-auto max-w-md px-4 pb-[max(1rem,env(safe-area-inset-bottom))]"
          >
            <button
              type="button"
              onClick={() => setOpen(true)}
              className="flex w-full items-center justify-between rounded-full bg-gold py-2 pr-2 pl-6 text-ink shadow-[0_20px_40px_rgba(0,0,0,0.5)] active:scale-[0.98]"
            >
              <span className="font-mono text-xs font-medium tracking-[0.15em] uppercase">Сагс · {count}</span>
              <span className="flex items-center gap-3 rounded-full bg-ink px-5 py-2.5 font-mono text-sm text-cream tabular-nums">
                {formatPrice(t.total)} →
              </span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* cart sheet */}
      <AnimatePresence>
        {open && (
          <>
            <motion.button
              type="button"
              aria-label="Хаах"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
              className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-label="Сагс"
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", stiffness: 280, damping: 32 }}
              data-lenis-prevent
              className="fixed inset-x-0 bottom-0 z-50 mx-auto max-h-[88svh] max-w-md overflow-y-auto rounded-t-[28px] border-t border-white/10 bg-ink-2 px-5 pt-3 pb-[max(1.25rem,env(safe-area-inset-bottom))]"
            >
              <div className="mx-auto mb-5 h-1 w-10 rounded-full bg-white/20" />
              <div className="flex items-baseline justify-between">
                <h2 className="font-display text-3xl text-cream">Сагс</h2>
                <span className="font-mono text-[0.65rem] tracking-[0.2em] text-cream-dim uppercase">Ширээ {table}</span>
              </div>

              <ul className="mt-4 divide-y divide-white/5">
                {lines.map((l) => (
                  <li key={l.item.id} className="flex items-center gap-3 py-3">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm text-cream">{l.item.name}</p>
                      <p className="font-mono text-xs text-cream-dim tabular-nums">{formatPrice(l.item.price * l.qty)}</p>
                    </div>
                    <Stepper qty={l.qty} name={l.item.name} onChange={(q) => setQty(l.item.id, q)} />
                  </li>
                ))}
              </ul>

              {beerCount > 0 && t.free === 0 && (
                <p className="mt-3 rounded-xl bg-gold/10 px-4 py-3 text-xs text-gold-soft">
                  🍺 Дахиад {3 - (beerCount % 3)} пиво нэмбэл 1 нь бэлэг!
                </p>
              )}

              <label className="mt-4 block">
                <span className="font-mono text-[0.62rem] tracking-[0.2em] text-cream-dim uppercase">Тэмдэглэл</span>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value.slice(0, 200))}
                  rows={2}
                  placeholder="Жишээ нь: сахаргүй, овъёосны сүүтэй"
                  className="mt-2 w-full resize-none rounded-xl border border-white/10 bg-ink px-4 py-3 text-base text-cream placeholder:text-muted focus:border-gold focus:outline-none"
                />
              </label>

              <dl className="mt-4 space-y-1.5 border-t border-white/10 pt-4 font-mono text-sm tabular-nums">
                <div className="flex justify-between text-cream-dim">
                  <dt>Дүн</dt>
                  <dd>{formatPrice(t.subtotal)}</dd>
                </div>
                {t.discount > 0 && (
                  <div className="flex justify-between text-gold">
                    <dt>2+1 урамшуулал · {t.free} бэлэг</dt>
                    <dd>−{formatPrice(t.discount)}</dd>
                  </div>
                )}
                <div className="flex justify-between pt-1 text-lg text-cream">
                  <dt>Нийт</dt>
                  <dd>{formatPrice(t.total)}</dd>
                </div>
              </dl>

              {error && (
                <p role="alert" className="mt-3 text-sm text-danger">
                  {error}
                </p>
              )}

              <button
                type="button"
                disabled={sending || count === 0}
                onClick={submit}
                className="mt-5 w-full rounded-full bg-gold py-4 font-mono text-sm font-medium tracking-[0.2em] text-ink uppercase transition-opacity active:scale-[0.98] disabled:opacity-50"
              >
                {sending ? "Илгээж байна…" : "Захиалаад төлөх"}
              </button>
              {!user && (
                <p className="mt-3 text-center text-[0.7rem] text-cream-dim">
                  <a href={`/login?next=${encodeURIComponent(`/t/${table}?k=${tableKey}`)}`} className="text-gold underline underline-offset-2">
                    Нэвтэрвэл
                  </a>{" "}
                  захиалга тань “Миний захиалга” хэсэгт хадгалагдана.
                </p>
              )}
              <p className="mt-3 text-center text-[0.7rem] text-muted">QPay, банкны апп эсвэл картаар төлнө. Төлөгдмөгц бэлтгэж эхэлнэ.</p>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </main>
  );
}

function Header({ table }: { table: number }) {
  return (
    <header className="flex items-center justify-between">
      <Logo size="2rem" withText />
      <span className="rounded-full border border-gold/50 px-4 py-1.5 font-mono text-[0.65rem] tracking-[0.2em] text-gold uppercase">Ширээ {table}</span>
    </header>
  );
}
