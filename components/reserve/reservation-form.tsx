"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { useMemo, useState, type FormEvent } from "react";
import { FormError, SubmitButton } from "@/components/auth/auth-shell";
import { useAuth } from "@/components/providers/auth-provider";
import { createReservation, type Reservation } from "@/lib/backend";
import { formatPrice, reservation as rules, timeSlots } from "@/lib/site";

const TZ = "Asia/Ulaanbaatar";
const WEEK = ["Да", "Мя", "Лх", "Пү", "Ба", "Бя", "Ня"]; // Monday first
const MONTHS = ["1-р сар", "2-р сар", "3-р сар", "4-р сар", "5-р сар", "6-р сар", "7-р сар", "8-р сар", "9-р сар", "10-р сар", "11-р сар", "12-р сар"];

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

const iso = (y: number, m: number, d: number) => new Date(Date.UTC(y, m, d)).toISOString().slice(0, 10);

/** Age in whole years on a given ISO date. */
function ageOn(birth: string, on: string) {
  const [by, bm, bd] = birth.split("-").map(Number);
  const [y, m, d] = on.split("-").map(Number);
  return y - by - (m < bm || (m === bm && d < bd) ? 1 : 0);
}

function Calendar({ today, value, onPick }: { today: string; value: string | null; onPick: (d: string) => void }) {
  const [ty, tm, td] = today.split("-").map(Number);
  const last = iso(ty, tm - 1, td + rules.maxDaysAhead);
  const [view, setView] = useState({ y: ty, m: tm - 1 });

  const first = new Date(Date.UTC(view.y, view.m, 1));
  const lead = (first.getUTCDay() + 6) % 7; // Monday-first offset
  const daysIn = new Date(Date.UTC(view.y, view.m + 1, 0)).getUTCDate();
  const cells = [...Array(lead).fill(null), ...Array.from({ length: daysIn }, (_, i) => i + 1)];
  const canPrev = view.y > ty || view.m > tm - 1;
  const canNext = iso(view.y, view.m + 1, 1) <= last;
  const shift = (n: number) => setView((v) => ({ y: v.y + Math.floor((v.m + n) / 12), m: (((v.m + n) % 12) + 12) % 12 }));

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <button type="button" onClick={() => shift(-1)} disabled={!canPrev} aria-label="Өмнөх сар" className="grid size-10 place-items-center rounded-full border border-line text-cream hover:border-gold disabled:opacity-25">
          ←
        </button>
        <p className="font-display text-2xl text-cream">
          {view.y} · {MONTHS[view.m]}
        </p>
        <button type="button" onClick={() => shift(1)} disabled={!canNext} aria-label="Дараах сар" className="grid size-10 place-items-center rounded-full border border-line text-cream hover:border-gold disabled:opacity-25">
          →
        </button>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center" role="grid" aria-label="Өдөр сонгох">
        {WEEK.map((w) => (
          <span key={w} className="pb-2 font-mono text-[0.6rem] tracking-[0.15em] text-muted uppercase">
            {w}
          </span>
        ))}
        {cells.map((d, i) => {
          if (d === null) return <span key={`e${i}`} />;
          const dayIso = iso(view.y, view.m, d);
          const disabled = dayIso < today || dayIso > last;
          const selected = value === dayIso;
          return (
            <button
              key={dayIso}
              type="button"
              disabled={disabled}
              onClick={() => onPick(dayIso)}
              aria-pressed={selected}
              aria-label={dayIso}
              className={`relative aspect-square rounded-xl font-deco text-lg tabular-nums transition-all ${
                selected ? "bg-gold text-ink" : disabled ? "text-muted/35" : "text-cream hover:bg-white/5 hover:ring-1 hover:ring-gold/60"
              }`}
            >
              {d}
              {dayIso === today && !selected && <span className="absolute bottom-1.5 left-1/2 size-1 -translate-x-1/2 rounded-full bg-gold" />}
            </button>
          );
        })}
      </div>
    </div>
  );
}

const steps = ["Өдөр", "Цаг", "Мэдээлэл"] as const;

export function ReservationForm({ next = "/reserve" }: { next?: string }) {
  const { user, loading } = useAuth();
  const [step, setStep] = useState(0);
  const [date, setDate] = useState<string | null>(null);
  const [time, setTime] = useState<string | null>(null);
  const [guests, setGuests] = useState(2);
  const [birth, setBirth] = useState("");
  const [agree, setAgree] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<Reservation | null>(null);
  // Client-only; the form renders after auth has loaded (post-hydration), so markup still matches.
  const [now] = useState(() => (typeof window === "undefined" ? null : nowInUB()));

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
          <Link href={`/login?next=${encodeURIComponent(next)}`} className="rounded-full bg-gold px-6 py-3 font-semibold text-ink">
            Нэвтрэх
          </Link>
          <Link href={`/signup?next=${encodeURIComponent(next)}`} className="rounded-full border border-line px-6 py-3 text-cream hover:border-gold">
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
        <p className="relative mt-4 rounded-2xl border border-gold/30 bg-gold/10 px-4 py-3 text-sm text-gold-soft">
          {formatPrice(rules.deposit)} deposit төлсний дараа захиалга баталгаажна. Deposit үндсэн төлбөрөөс хасагдана. Бид {done.phone} дугаарт холбогдоно.
        </p>
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
    if (!birth) return setError("Төрсөн өдрөө оруулна уу.");
    if (ageOn(birth, date) < rules.minAge) return setError(`Уучлаарай, ширээ захиалга зөвхөн ${rules.minAge} нас хүрсэн хүнд.`);
    if (!agree) return setError("Deposit-ийн нөхцөлийг зөвшөөрнө үү.");
    if (isPast(time)) return setError("Энэ цаг өнгөрсөн байна. Өөр цаг сонгоно уу.");

    setSubmitting(true);
    const res = await createReservation(user.id, { full_name, phone, date, time, guests, note: note || null, age_confirmed: true });
    setSubmitting(false);
    if (!res.ok) return setError(res.error);
    setDone(res.data);
  }

  const canNext = step === 0 ? Boolean(date) : step === 1 ? Boolean(time) : true;
  const freeSlots = slots.filter((t) => !isPast(t));

  return (
    <div className="rounded-3xl border border-line bg-ink-2 p-5 sm:p-8">
      {/* Stepper */}
      <ol className="mb-6 flex items-center gap-2">
        {steps.map((s, i) => (
          <li key={s} className="flex flex-1 items-center gap-2">
            <button type="button" onClick={() => i < step && setStep(i)} disabled={i > step} className={`flex items-center gap-2 text-sm ${i <= step ? "text-cream" : "text-muted"}`}>
              <span className={`grid size-7 place-items-center rounded-full border text-xs transition-colors ${i < step ? "border-gold bg-gold text-ink" : i === step ? "border-gold text-gold" : "border-line"}`}>
                {i < step ? "✓" : i + 1}
              </span>
              <span className="hidden sm:inline">{s}</span>
            </button>
            {i < steps.length - 1 && (
              <span className="relative h-px flex-1 bg-line">
                <motion.span className="absolute inset-y-0 left-0 bg-gold" animate={{ width: i < step ? "100%" : "0%" }} transition={{ duration: 0.5 }} />
              </span>
            )}
          </li>
        ))}
      </ol>

      <p className="mb-6 flex flex-wrap gap-2 font-mono text-[0.6rem] tracking-[0.15em] uppercase">
        <span className="rounded-full border border-gold/40 px-3 py-1 text-gold">18:00-оос хойш</span>
        <span className="rounded-full border border-gold/40 px-3 py-1 text-gold">{rules.minAge}+ нас</span>
        <span className="rounded-full border border-gold/40 px-3 py-1 text-gold">Deposit {formatPrice(rules.deposit)}</span>
      </p>

      <form onSubmit={onSubmit}>
        <AnimatePresence mode="wait" initial={false}>
          <motion.div key={step} initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.3 }}>
            {step === 0 && now && (
              <Calendar
                today={now.date}
                value={date}
                onPick={(d) => {
                  setDate(d);
                  setTime(null);
                  setStep(1); // straight to the time picker
                }}
              />
            )}

            {step === 1 && (
              <div className="space-y-8">
                <div>
                  <p className="field-label">Цаг сонгох · {date}</p>
                  {freeSlots.length === 0 ? (
                    <p className="rounded-2xl border border-line p-4 text-sm text-cream-dim">Өнөөдрийн захиалгын цаг дууссан. Өөр өдөр сонгоно уу.</p>
                  ) : (
                    <div className="grid grid-cols-4 gap-2">
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
                              time === t ? "border-gold bg-gold font-semibold text-ink" : past ? "border-line/50 text-muted/50 line-through" : "border-line text-cream hover:border-gold/60"
                            }`}
                          >
                            {t}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div>
                  <p className="field-label">Хүний тоо</p>
                  <div className="flex items-center justify-between rounded-2xl border border-line bg-ink-3 p-2">
                    <button type="button" onClick={() => setGuests((g) => Math.max(1, g - 1))} className="grid size-12 place-items-center rounded-xl text-2xl text-cream hover:bg-ink-2 disabled:opacity-30" disabled={guests <= 1} aria-label="Хасах">
                      −
                    </button>
                    <span className="font-deco text-3xl text-cream tabular-nums" aria-live="polite">
                      {guests}
                    </span>
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
                  <label htmlFor="birth" className="field-label">Төрсөн өдөр ({rules.minAge}+ шалгана)</label>
                  <input id="birth" type="date" value={birth} onChange={(e) => setBirth(e.target.value)} max={now?.date} className="field" required autoComplete="bday" />
                  <p className="mt-1.5 text-xs text-muted">Ирэхдээ иргэний үнэмлэхээ авчирна уу. Төрсөн өдрийг хадгалахгүй.</p>
                </div>
                <div>
                  <label htmlFor="note" className="field-label">Нэмэлт хүсэлт (заавал биш)</label>
                  <textarea id="note" name="note" rows={2} maxLength={300} className="field resize-none" placeholder="Цонхны дэргэд, төрсөн өдөр..." />
                </div>
                <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-gold/40 bg-gold/10 p-4 text-sm text-cream">
                  <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} className="mt-0.5 size-4 accent-[var(--gold)]" />
                  <span>
                    Захиалга <b className="text-gold">{formatPrice(rules.deposit)} deposit</b>-той. Deposit үндсэн төлбөрөөс хасагдана. Deposit төлөгдсөний дараа ширээ баталгаажна.
                  </span>
                </label>
                <FormError message={error} />
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {step > 0 && (
          <div className="mt-8 flex gap-3">
            <button type="button" onClick={() => setStep((s) => s - 1)} className="rounded-full border border-line px-6 py-4 text-cream hover:border-gold">
              ←
            </button>
            {step < 2 ? (
              <button type="button" disabled={!canNext} onClick={() => setStep((s) => s + 1)} className="flex-1 rounded-full bg-cream px-6 py-4 font-semibold text-ink transition-opacity disabled:opacity-40">
                Үргэлжлүүлэх
              </button>
            ) : (
              <div className="flex-1">
                <SubmitButton loading={submitting}>Захиалга илгээх</SubmitButton>
              </div>
            )}
          </div>
        )}
      </form>
    </div>
  );
}
