"use client";

import { useEffect, useState } from "react";
import type { AdminHeaders } from "@/components/admin/admin-gate";
import { adminFetch, Field, inputCls, SaveBar } from "@/components/admin/admin-ui";
import { formatPrice } from "@/lib/site";
import type { ReceiptSettings as Settings } from "@/lib/settings-db";

/** Bottom of the home-page menu receipt: the add-on line and the thank-you line. */
export function ReceiptSettings({ auth }: { auth: AdminHeaders }) {
  const [base, setBase] = useState<Settings | null>(null);
  const [d, setD] = useState<Settings | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    adminFetch<{ settings: Settings | null }>(auth, "/api/admin/settings")
      .then(({ settings }) => {
        if (!settings) throw new Error("supabase/receipt-settings.sql-ийг ажиллуулна уу.");
        setBase(settings);
        setD(settings);
      })
      .catch((e: Error) => setError(e.message));
  }, [auth]);

  if (!d) return error ? <p className="mt-6 text-sm text-danger">{error}</p> : null;
  const dirty = JSON.stringify(d) !== JSON.stringify(base);
  const set = <K extends keyof Settings>(k: K, v: Settings[K]) => {
    setSaved(false);
    setD((x) => (x ? { ...x, [k]: v } : x));
  };

  async function save() {
    setBusy(true);
    setError(null);
    try {
      const { settings } = await adminFetch<{ settings: Settings }>(auth, "/api/admin/settings", { method: "PATCH", body: JSON.stringify(d) });
      setBase(settings);
      setD(settings);
      setSaved(true);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="mt-6 rounded-3xl border border-white/10 bg-ink-2/60 p-4 sm:p-5">
      <p className="font-mono text-[0.62rem] tracking-[0.2em] text-gold uppercase">Нүүр хуудасны меню баримтын доод хэсэг</p>
      <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_160px_1fr]">
        <Field label="Нэмэлт мөр">
          <input className={inputCls} value={d.receipt_extra_label} onChange={(e) => set("receipt_extra_label", e.target.value)} maxLength={60} placeholder="Ургамлын сүү" />
        </Field>
        <Field label={`Нэмэлт үнэ · +${formatPrice(d.receipt_extra_price)}`}>
          <input type="number" min={0} step={500} className={`${inputCls} tabular-nums`} value={d.receipt_extra_price} onChange={(e) => set("receipt_extra_price", Number(e.target.value))} />
        </Field>
        <Field label="Төгсгөлийн бичиг">
          <input className={inputCls} value={d.receipt_thanks} onChange={(e) => set("receipt_thanks", e.target.value)} maxLength={80} placeholder="Баярлалаа · Дахин ирээрэй" />
        </Field>
      </div>
      <p className="mt-2 text-xs text-muted">Нэмэлт мөрийг хоосон үлдээвэл баримт дээр харагдахгүй.</p>
      {error && <p role="alert" className="mt-2 text-sm text-danger">{error}</p>}
      {saved && !dirty && <p className="mt-2 text-xs text-success">✓ Хадгалагдлаа.</p>}
      <div className="mt-3">
        <SaveBar dirty={dirty} busy={busy} onSave={save} onReset={() => setD(base)} />
      </div>
    </section>
  );
}
