"use client";

import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { AdminGate, type AdminHeaders } from "@/components/admin/admin-gate";
import { printReceipt } from "@/components/admin/print-receipt";
import { btPrinterName, btSupported, connectBtPrinter, onBtChange } from "@/components/admin/bt-printer";
import { formatPrice } from "@/lib/site";

type Order = {
  id: string;
  number: number;
  table_no: number;
  lines: { id: string; name: string; price: number; qty: number }[];
  note: string | null;
  subtotal: number;
  discount: number;
  total: number;
  status: "new" | "preparing" | "served" | "paid" | "cancelled";
  created_at: string;
  paid_at: string | null;
};

const COLUMNS: { status: Order["status"]; label: string; next?: { status: Order["status"]; label: string } }[] = [
  { status: "new", label: "Шинэ", next: { status: "preparing", label: "Бэлтгэж эхлэх" } },
  { status: "preparing", label: "Бэлтгэж байна", next: { status: "served", label: "Хүргэсэн" } },
  { status: "served", label: "Хүргэсэн · Төлбөр хүлээж буй", next: { status: "paid", label: "Төлсөн ✓" } },
  { status: "paid", label: "Төлсөн" },
];

/** Short two-tone chime for new orders (no audio file needed). */
function chime() {
  try {
    const ctx = new AudioContext();
    [880, 1320].forEach((f, i) => {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.frequency.value = f;
      g.gain.setValueAtTime(0.0001, ctx.currentTime + i * 0.18);
      g.gain.exponentialRampToValueAtTime(0.25, ctx.currentTime + i * 0.18 + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + i * 0.18 + 0.35);
      o.connect(g).connect(ctx.destination);
      o.start(ctx.currentTime + i * 0.18);
      o.stop(ctx.currentTime + i * 0.18 + 0.4);
    });
  } catch {}
}

function ago(iso: string, now: number) {
  const m = Math.max(0, Math.floor((now - new Date(iso).getTime()) / 60000));
  return m < 1 ? "дөнгөж сая" : m < 60 ? `${m} мин` : `${Math.floor(m / 60)} цаг`;
}

function Board({ auth, logout }: { auth: AdminHeaders; logout: () => void }) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const [autoPrint, setAutoPrint] = useState(false);
  const autoPrintRef = useRef(false);
  useEffect(() => {
    const id = setTimeout(() => {
      try {
        const v = localStorage.getItem("h44_autoprint") === "1";
        setAutoPrint(v);
        autoPrintRef.current = v;
      } catch {}
    }, 0);
    return () => clearTimeout(id);
  }, []);
  function toggleAutoPrint() {
    const v = !autoPrint;
    setAutoPrint(v);
    autoPrintRef.current = v;
    try {
      localStorage.setItem("h44_autoprint", v ? "1" : "0");
    } catch {}
  }
  const seen = useRef<Set<string> | null>(null);

  const [notifyMsg, setNotifyMsg] = useState<string | null>(null);
  async function testNotify() {
    setNotifyMsg("Илгээж байна…");
    const res = await fetch("/api/admin/notify-test", { method: "POST", headers: await auth() }).catch(() => null);
    const data = (await res?.json().catch(() => null)) as { ok?: boolean; error?: string } | null;
    setNotifyMsg(data?.ok ? "✓ Viber руу тест мессеж илгээлээ." : `Viber: ${data?.error ?? "алдаа гарлаа"}`);
  }

  const btName = useSyncExternalStore(onBtChange, btPrinterName, () => null);
  const canBt = useSyncExternalStore(onBtChange, btSupported, () => false);
  const [btError, setBtError] = useState<string | null>(null);
  async function connectPrinter() {
    setBtError(null);
    try {
      await connectBtPrinter();
      if (!autoPrintRef.current) toggleAutoPrint();
    } catch (e) {
      if (e instanceof Error && e.name !== "NotFoundError") setBtError(e.message); // NotFoundError = picker closed
    }
  }
  // Keep the screen on while a printer is connected — a sleeping phone stops polling and printing.
  useEffect(() => {
    if (!btName || !("wakeLock" in navigator)) return;
    let lock: { release(): Promise<void> } | null = null;
    const take = () =>
      (navigator as Navigator & { wakeLock: { request(t: "screen"): Promise<{ release(): Promise<void> }> } }).wakeLock
        .request("screen")
        .then((l) => (lock = l))
        .catch(() => null);
    take();
    const onVis = () => document.visibilityState === "visible" && take();
    document.addEventListener("visibilitychange", onVis);
    return () => {
      document.removeEventListener("visibilitychange", onVis);
      lock?.release().catch(() => null);
    };
  }, [btName]);

  const load = useCallback(async () => {
    const res = await fetch("/api/orders", { headers: await auth(), cache: "no-store" }).catch(() => null);
    if (!res) return setError("Сервертэй холбогдож чадсангүй.");
    if (res.status === 401) return logout();
    const { orders: list } = (await res.json()) as { orders: Order[] };
    setError(null);
    setNow(Date.now());
    const ids = new Set(list.map((o) => o.id));
    if (seen.current && list.some((o) => o.status === "new" && !seen.current!.has(o.id))) {
      chime();
      if (autoPrintRef.current) list.filter((o) => o.status === "new" && !seen.current!.has(o.id)).forEach((o) => printReceipt(o));
      if ("Notification" in window && Notification.permission === "granted") {
        const fresh = list.find((o) => !seen.current!.has(o.id))!;
        new Notification(`Ширээ ${fresh.table_no} — шинэ захиалга`, { body: fresh.lines.map((l) => `${l.qty}× ${l.name}`).join(", ") });
      }
    }
    seen.current = ids;
    setOrders(list);
  }, [auth, logout]);

  useEffect(() => {
    const first = setTimeout(load, 0);
    const id = setInterval(load, 4000);
    return () => {
      clearTimeout(first);
      clearInterval(id);
    };
  }, [load]);

  async function move(id: string, status: Order["status"]) {
    setOrders((list) => list.map((o) => (o.id === id ? { ...o, status } : o)));
    await fetch(`/api/orders/${id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json", ...(await auth()) },
      body: JSON.stringify({ status }),
    }).catch(() => null);
    load();
  }

  const paidToday = orders.filter((o) => o.status === "paid").reduce((s, o) => s + o.total, 0);
  const open = orders.filter((o) => o.status !== "paid" && o.status !== "cancelled").reduce((s, o) => s + o.total, 0);

  return (
    <main className="min-h-svh px-4 py-6 sm:px-6">
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-5">
        <div>
          <p className="font-mono text-[0.62rem] tracking-[0.3em] text-gold uppercase">44 concept café · Staff</p>
          <h1 className="mt-1 font-display text-4xl text-cream">Захиалгууд</h1>
        </div>
        <div className="flex flex-wrap items-center gap-2 font-mono text-[0.65rem] tracking-[0.15em] uppercase">
          <span className="rounded-full border border-white/10 px-4 py-2 text-cream-dim">
            Төлөгдөөгүй <b className="text-cream tabular-nums">{formatPrice(open)}</b>
          </span>
          <span className="rounded-full border border-gold/40 px-4 py-2 text-cream-dim">
            Өнөөдөр орсон <b className="text-gold tabular-nums">{formatPrice(paidToday)}</b>
          </span>
          {typeof Notification !== "undefined" && Notification.permission === "default" && (
            <button type="button" onClick={() => Notification.requestPermission()} className="rounded-full border border-white/20 px-4 py-2 text-cream hover:border-gold">
              🔔 Мэдэгдэл асаах
            </button>
          )}
          <button
            type="button"
            onClick={toggleAutoPrint}
            aria-pressed={autoPrint}
            title="Шинэ захиалга ирэхэд автоматаар хэвлэнэ"
            className={`rounded-full px-4 py-2 ${autoPrint ? "bg-gold text-ink" : "border border-white/20 text-cream hover:border-gold"}`}
          >
            🖨 Авто хэвлэх {autoPrint ? "ON" : "OFF"}
          </button>
          {btName ? (
            <span className="rounded-full border border-gold/40 px-4 py-2 text-gold">🔵 {btName}</span>
          ) : (
            canBt && (
              <button type="button" onClick={connectPrinter} className="rounded-full border border-white/20 px-4 py-2 text-cream hover:border-gold">
                🔵 Принтер холбох
              </button>
            )
          )}
          <button type="button" onClick={testNotify} title="Viber channel руу тест мессеж илгээнэ" className="rounded-full border border-white/20 px-4 py-2 text-cream hover:border-gold">
            💬 Viber тест
          </button>
          <button type="button" onClick={logout} className="rounded-full px-3 py-2 text-muted hover:text-cream">
            Гарах
          </button>
        </div>
      </header>

      {error && <p role="alert" className="mt-4 text-sm text-danger">{error}</p>}
      {btError && <p role="alert" className="mt-4 text-sm text-danger">{btError}</p>}
      {notifyMsg && <p role="status" className="mt-4 text-sm text-cream-dim">{notifyMsg}</p>}

      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {COLUMNS.map((col) => {
          const list = orders.filter((o) => o.status === col.status);
          return (
            <section key={col.status} className="flex flex-col gap-3 rounded-3xl border border-white/5 bg-ink-2/50 p-3" aria-label={col.label}>
              <h2 className="flex items-center justify-between px-2 pt-1 font-mono text-[0.65rem] tracking-[0.2em] text-cream-dim uppercase">
                {col.label}
                <span className={`grid min-w-6 place-items-center rounded-full px-2 py-0.5 ${col.status === "new" && list.length ? "bg-gold text-ink" : "bg-white/5"}`}>{list.length}</span>
              </h2>
              <AnimatePresence initial={false}>
                {list.map((o) => (
                  <motion.article
                    key={o.id}
                    layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className={`rounded-2xl border bg-ink p-4 ${o.status === "new" ? "border-gold/70 shadow-[0_0_0_3px_rgba(217,164,108,0.12)]" : "border-white/10"}`}
                  >
                    <div className="flex items-baseline justify-between">
                      <p className="font-display text-3xl text-cream">Ширээ {o.table_no}</p>
                      <p className="font-mono text-[0.62rem] text-muted">
                        #{String(o.number).padStart(3, "0")} · {ago(o.created_at, now)}
                      </p>
                    </div>
                    <ul className="mt-3 space-y-1 text-sm text-cream">
                      {o.lines.map((l) => (
                        <li key={l.id} className="flex justify-between gap-2">
                          <span>
                            <b className="text-gold-soft">{l.qty}×</b> {l.name}
                          </span>
                          <span className="font-mono text-xs text-cream-dim tabular-nums">{formatPrice(l.price * l.qty)}</span>
                        </li>
                      ))}
                    </ul>
                    {o.paid_at && (
                      <p className="mt-2 inline-block rounded-full bg-gold/15 px-3 py-1 font-mono text-[0.6rem] tracking-[0.15em] text-gold uppercase">✓ Онлайнаар төлөгдсөн</p>
                    )}
                    {o.note && <p className="mt-3 rounded-lg bg-white/5 px-3 py-2 text-xs text-cream-dim">📝 {o.note}</p>}
                    <div className="mt-3 flex items-baseline justify-between border-t border-white/10 pt-3 font-mono text-sm tabular-nums">
                      <span className="text-[0.62rem] tracking-[0.15em] text-cream-dim uppercase">{o.discount > 0 ? `2+1 −${formatPrice(o.discount)}` : "Нийт"}</span>
                      <span className="text-lg text-cream">{formatPrice(o.total)}</span>
                    </div>
                    <div className="mt-3 flex gap-2">
                      {col.next && (
                        <button type="button" onClick={() => move(o.id, col.next!.status)} className="flex-1 rounded-full bg-gold py-2.5 font-mono text-[0.65rem] tracking-[0.15em] text-ink uppercase active:scale-[0.98]">
                          {o.paid_at && col.next.status === "paid" ? "Дуусгах ✓" : col.next.label}
                        </button>
                      )}
                      <button type="button" onClick={() => printReceipt(o)} aria-label={`Ширээ ${o.table_no} захиалга хэвлэх`} className="rounded-full border border-white/15 px-3 font-mono text-[0.6rem] tracking-[0.1em] text-cream uppercase hover:border-gold">
                        🖨 Хэвлэх
                      </button>
                      {o.status !== "paid" && (
                        <button type="button" onClick={() => move(o.id, "cancelled")} className="rounded-full border border-white/10 px-3 font-mono text-[0.6rem] tracking-[0.1em] text-muted uppercase hover:border-danger hover:text-danger">
                          Цуцлах
                        </button>
                      )}
                    </div>
                  </motion.article>
                ))}
              </AnimatePresence>
              {list.length === 0 && <p className="px-2 pb-2 text-xs text-muted">—</p>}
            </section>
          );
        })}
      </div>
    </main>
  );
}

export function OrdersBoard() {
  return <AdminGate>{(auth, logout) => <Board auth={auth} logout={logout} />}</AdminGate>;
}
