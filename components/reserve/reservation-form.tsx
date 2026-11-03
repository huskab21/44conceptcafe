"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { useMemo, useState, type FormEvent } from "react";
import { FormError, SubmitButton } from "@/components/auth/auth-shell";
import { useAuth } from "@/components/providers/auth-provider";
import { createReservation, type Reservation } from "@/lib/backend";
import { reservation as rules, timeSlots } from "@/lib/site";

const TZ = "Asia/Ulaanbaatar";
const weekday = ["Ням", "Дав", "Мяг", "Лха", "Пүр", "Баа", "Бям"];

/** Current date/time in Ulaanbaatar, regardless of the visitor's device timezone. */
function nowInUB() {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-CA", {
      timeZone: TZ,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    })
      .formatToParts(new Date())
      .map((p) => [p.type, p.value]),
  );
  return { date: `${parts.year}-${parts.month}-${parts.day}`, time: `${parts.hour}:${parts.minute}` };
}

function upcomingDays(count: number) {
  const { date } = nowInUB();
  const [y, m, d] = date.split("-").map(Number);
  return Array.from({ length: count }, (_, i) => {
    const dt = new Date(Date.UTC(y, m - 1, d + i));
    return {
      iso: dt.toISOString().slice(0, 10),
      day: dt.getUTCDate(),
      month: dt.getUTCMonth() + 1,
      weekday: i === 0 ? "Өнөөдөр" : i === 1 ? "Маргааш" : weekday[dt.getUTCDay()],
    };
  });
}

const steps = ["Өдөр", "Цаг", "Мэдээлэл"] as const;

export function ReservationForm() {
  const { user, loading } = useAuth();
  const [step, setStep] = useState(0);
  const [date, setDate] = useState<string | null>(null);
  const [time, setTime] = useState<string | null>(null);
  const [guests, setGuests] = useState(2);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<Reservation | null>(null);
  // Computed on the client only. The form itself renders after auth has loaded
  // (post-hydration), so server and client markup still match.
  const [now] = useState(() => (typeof window === "undefined" ? null : nowInUB()));
  const [days] = useState(() => (typeof window === "undefined" ? [] : upcomingDays(14)));

  const slots = useMemo(() => timeSlots(), []);
  const isPast = (t: string) => Boolean(now && date === now.date && t <= now.time);

  if (loading) {
    return <div className="h-96 animate-pulse rounded-3xl bg-ink-2" aria-busy />;
  }

  if (!user) {
    return (
      <div className="rounded-3xl border border-line bg-ink-2 p-8 text-center">
        <p className="font-display text-3xl text-cream">Эхлээд нэвтэрнэ үү</p>
        <p className="mt-3 text-cream-dim">Захиалгаа хянах, цуцлахын тулд бүртгэл шаардлагатай.</p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link href="/login?next=/reserve" className="rounded-full bg-gold px-6 py-3 font-semibold text-ink">
            Нэвтрэх
          </Link>
          <Link href="/signup?next=/reserve" className="rounded-full border border-line px-6 py-3 text-cream hover:border-gold">
            Бүртгүүлэх
          </Link>
        </div>
      </div>
    );
  }

  if (done) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative overflow-hidden rounded-3xl border border-gold/40 bg-ink-2 p-8 text-center sm:p-12"
      >
        <div className="deco-rays absolute inset-0" aria-hidden />
        <motion.div
          initial={{ scale: 0, rotate: -90 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 200, damping: 14, delay: 0.1 }}
          className="relative mx-auto grid size-20 place-items-center rounded-full bg-gold text-3xl text-ink"
        >
          ✓
        </motion.div>
        <h2 className="relative mt-6 font-display text-4xl text-cream">Захиалга илгээгдлээ!</h2>
        <p className="relative mt-3 text-cream-dim">
          {done.date} · {done.time} · {done.guests} хүн
        </p>
        <p className="relative mt-2 text-sm text-muted">Бид удахгүй баталгаажуулж, {done.phone} дугаарт мэдэгдэнэ.</p>
        <div className="relative mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link href="/account" className="rounded-full bg-gold px-6 py-3 font-semibold text-ink">
            Миний захиалгууд
          </Link>
          <button
            onClick={() => {
              setDone(null);
              setStep(0);
              setTime(null);
            }}
            className="rounded-full border border-line px-6 py-3 text-cream hover:border-gold"
          >
            Дахин захиалах
          </button>
        </div>
      </motion.div>
    );
  }

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!user || !date || !time) return;
    setError(null);
    const f = new FormData(e.currentTarget);
    const full_name = String(f.get("full_name") ?? "").trim();
    const phone = String(f.get("phone") ?? "").trim();
    const note = String(f.get("note") ?? "").trim();
    if (full_name.length < 2) return setError("Нэрээ оруулна уу.");
    if (!/^[+\d\s-]{8,20}$/.test(phone)) return setError("Утасны дугаараа зөв оруулна уу.");
    if (isPast(time)) return setError("Энэ цаг өнгөрсөн байна. Өөр цаг сонгоно уу.");

    setSubmitting(true);
    const res = await createReservation(user.id, { full_name, phone, date, time, guests, note: note || null });
    setSubmitting(false);
    if (!res.ok) return setError(res.error);
    setDone(res.data);
  }

  const canNext = step === 0 ? Boolean(date) : step === 1 ? Boolean(time) : true;

  return (
    <div className="rounded-3xl border border-line bg-ink-2 p-5 sm:p-8">
      {/* Stepper */}
      <ol className="mb-8 flex items-center gap-2">
        {steps.map((s, i) => (
          <li key={s} className="flex flex-1 items-center gap-2">
            <button
              type="button"
              onClick={() => i < step && setStep(i)}
              disabled={i > step}
              className={`flex items-center gap-2 text-sm ${i <= step ? "text-cream" : "text-muted"}`}
            >
              <span
                className={`grid size-7 place-items-center rounded-full border text-xs transition-colors ${
                  i < step ? "border-gold bg-gold text-ink" : i === step ? "border-gold text-gold" : "border-line"
                }`}
              >
                {i < step ? "✓" : i + 1}
              </span>
              <span className="hidden sm:inline">{s}</span>
            </button>
            {i < steps.length - 1 && (
              <span className="relative h-px flex-1 bg-line">
                <motion.span
                  className="absolute inset-y-0 left-0 bg-gold"
                  animate={{ width: i < step ? "100%" : "0%" }}
                  transition={{ duration: 0.5 }}
                />
              </span>
            )}
          </li>
        ))}
      </ol>

      <form onSubmit={onSubmit}>
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.35 }}
          >
            {step === 0 && (
              <div className="space-y-8">
                <div>
                  <p className="field-label">Өдөр сонгох</p>
                  <div className="no-scrollbar -mx-5 flex gap-2 overflow-x-auto px-5 pb-2 sm:-mx-8 sm:px-8" data-lenis-prevent>
                    {days.map((d) => (
                      <button
                        type="button"
                        key={d.iso}
                        onClick={() => {
                          setDate(d.iso);
                          setTime(null);
                        }}
                        aria-pressed={date === d.iso}
                        className={`flex w-20 shrink-0 flex-col items-center rounded-2xl border py-3 transition-all ${
                          date === d.iso ? "border-gold bg-gold text-ink" : "border-line text-cream hover:border-gold/60"
                        }`}
                      >
                        <span className={`text-[0.65rem] ${date === d.iso ? "text-ink/70" : "text-muted"}`}>{d.weekday}</span>
                        <span className="font-deco text-2xl">{d.day}</span>
                        <span className={`text-[0.65rem] ${date === d.iso ? "text-ink/70" : "text-muted"}`}>{d.month}-р сар</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="field-label">Хүний тоо</p>
                  <div className="flex items-center justify-between rounded-2xl border border-line bg-ink-3 p-2">
                    <button
                      type="button"
                      onClick={() => setGuests((g) => Math.max(1, g - 1))}
                      className="grid size-12 place-items-center rounded-xl text-2xl text-cream hover:bg-ink-2 disabled:opacity-30"
                      disabled={guests <= 1}
                      aria-label="Хасах"
                    >
                      −
                    </button>
                    <AnimatePresence mode="popLayout" initial={false}>
                      <motion.span
                        key={guests}
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: -20, opacity: 0 }}
                        className="font-deco text-3xl text-cream tabular-nums"
                        aria-live="polite"
                      >
                        {guests}
                      </motion.span>
                    </AnimatePresence>
                    <button
                      type="button"
                      onClick={() => setGuests((g) => Math.min(rules.maxGuests, g + 1))}
                      className="grid size-12 place-items-center rounded-xl text-2xl text-cream hover:bg-ink-2 disabled:opacity-30"
                      disabled={guests >= rules.maxGuests}
                      aria-label="Нэмэх"
                    >
                      +
                    </button>
                  </div>
                  <p className="mt-2 text-xs text-muted">{rules.maxGuests}-аас дээш хүнтэй бол утсаар холбогдоно уу.</p>
                </div>
              </div>
            )}

            {step === 1 && (
              <div>
                <p className="field-label">Цаг сонгох</p>
                <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                  {slots.map((t) => {
                    const past = isPast(t);
                    return (
                      <button
                        type="button"
                        key={t}
                        disabled={past}
                        onClick={() => setTime(t)}
                        aria-pressed={time === t}
                        className={`rounded-xl border py-3 text-sm tabular-nums transition-all ${
                          time === t
                            ? "border-gold bg-gold font-semibold text-ink"
                            : past
                              ? "border-line/50 text-muted/50 line-through"
                              : "border-line text-cream hover:border-gold/60"
                        }`}
                      >
                        {t}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-5">
                <div className="flex flex-wrap gap-2 text-sm">
                  {[date, time, `${guests} хүн`].map((v) => (
                    <span key={v} className="rounded-full border border-gold/40 px-3 py-1 text-gold">
                      {v}
                    </span>
                  ))}
                </div>
                <div className="grid gap-5 sm:grid-cols-2">
                  <div>
                    <label htmlFor="full_name" className="field-label">Нэр</label>
                    <input id="full_name" name="full_name" defaultValue={user.fullName} className="field" required autoComplete="name" />
                  </div>
                  <div>
                    <label htmlFor="phone" className="field-label">Утас</label>
                    <input id="phone" name="phone" type="tel" inputMode="tel" defaultValue={user.phone} className="field" required autoComplete="tel" />
                  </div>
                </div>
                <div>
                  <label htmlFor="note" className="field-label">Нэмэлт хүсэлт (заавал биш)</label>
                  <textarea id="note" name="note" rows={3} maxLength={300} className="field resize-none" placeholder="Цонхны дэргэд, төрсөн өдөр..." />
                </div>
                <FormError message={error} />
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        <div className="mt-8 flex gap-3">
          {step > 0 && (
            <button
              type="button"
              onClick={() => setStep((s) => s - 1)}
              className="rounded-full border border-line px-6 py-4 text-cream hover:border-gold"
            >
              ←
            </button>
          )}
          {step < 2 ? (
            <button
              type="button"
              disabled={!canNext}
              onClick={() => setStep((s) => s + 1)}
              className="flex-1 rounded-full bg-cream px-6 py-4 font-semibold text-ink transition-opacity disabled:opacity-40"
            >
              Үргэлжлүүлэх
            </button>
          ) : (
            <div className="flex-1">
              <SubmitButton loading={submitting}>Захиалга баталгаажуулах</SubmitButton>
            </div>
          )}
        </div>
      </form>
    </div>
  );
}
