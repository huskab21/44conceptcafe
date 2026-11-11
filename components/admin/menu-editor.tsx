"use client";

import { useState } from "react";
import { AdminGate, type AdminHeaders } from "@/components/admin/admin-gate";
import { Field, ImageField, inputCls, PageHead, SaveBar, Toggle, useAdminList } from "@/components/admin/admin-ui";
import { categories, type MenuCategory, type MenuItem } from "@/lib/menu-data";
import { formatPrice } from "@/lib/site";
import { ReceiptSettings } from "@/components/admin/receipt-settings";

type Draft = Omit<MenuItem, "id">;

const blank = (category: MenuCategory): Draft => ({
  category,
  name: "",
  name_en: "",
  description: "",
  price: 0,
  image: "/images/latte.webp",
  is_signature: false,
  is_available: true,
  sort_order: 999,
});

function ItemForm({
  auth,
  initial,
  onSave,
  onDelete,
  isNew = false,
}: {
  auth: AdminHeaders;
  initial: Draft;
  onSave: (d: Draft) => Promise<void>;
  onDelete?: () => Promise<void>;
  isNew?: boolean;
}) {
  const [base, setBase] = useState(initial);
  const [d, setD] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const dirty = JSON.stringify(d) !== JSON.stringify(base);
  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => {
    setSaved(false);
    setD((x) => ({ ...x, [k]: v }));
  };

  async function run(fn: () => Promise<void>) {
    setBusy(true);
    setError(null);
    try {
      await fn();
      setSaved(true);
      if (isNew) setD(initial);
      else setBase(d);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <article className={`grid gap-4 rounded-3xl border p-4 sm:grid-cols-[140px_1fr] ${d.is_available ? "border-white/10 bg-ink-2/60" : "border-white/5 bg-ink-2/20 opacity-70"}`}>
      <ImageField auth={auth} folder="menu" value={d.image} onChange={(url) => set("image", url)} />
      <div className="grid gap-3">
        <Field label="Нэр (монгол эсвэл гадаад — сайт дээр яг ингэж харагдана)">
          <input className={inputCls} value={d.name} onChange={(e) => set("name", e.target.value)} maxLength={80} />
        </Field>
        <Field label="Тайлбар">
          <textarea className={`${inputCls} resize-none`} rows={2} value={d.description} onChange={(e) => set("description", e.target.value)} maxLength={300} />
        </Field>
        <div className="grid gap-3 sm:grid-cols-3">
          <Field label={`Үнэ · ${formatPrice(d.price)}`}>
            <input className={`${inputCls} tabular-nums`} type="number" min={0} step={100} value={d.price} onChange={(e) => set("price", Number(e.target.value))} />
          </Field>
          <Field label="Ангилал">
            <select className={inputCls} value={d.category} onChange={(e) => set("category", e.target.value as MenuCategory)}>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Дараалал">
            <input className={inputCls} type="number" value={d.sort_order} onChange={(e) => set("sort_order", Number(e.target.value))} />
          </Field>
        </div>
        <div className="flex flex-wrap gap-2">
          <Toggle checked={d.is_available} onChange={(v) => set("is_available", v)} label={d.is_available ? "Зарагдаж байна" : "Нуусан"} />
          <Toggle checked={d.is_signature} onChange={(v) => set("is_signature", v)} label="Онцлох" />
        </div>
        {error && <p role="alert" className="text-sm text-danger">{error}</p>}
        {saved && !dirty && !isNew && <p className="text-xs text-success">✓ Хадгалагдлаа. Сайт дээр шууд шинэчлэгдэнэ.</p>}
        <SaveBar
          dirty={isNew ? Boolean(d.name) : dirty}
          busy={busy}
          onSave={() => run(() => onSave(d))}
          onReset={isNew ? undefined : () => setD(base)}
          onDelete={onDelete ? () => run(onDelete) : undefined}
        />
      </div>
    </article>
  );
}

function Editor({ auth }: { auth: AdminHeaders }) {
  const { items, error, save, create, remove } = useAdminList<MenuItem>(auth, "menu");
  const [cat, setCat] = useState<MenuCategory | "all">("all");
  const [adding, setAdding] = useState(false);

  const shown = (items ?? []).filter((i) => cat === "all" || i.category === cat);

  return (
    <main className="mx-auto max-w-5xl px-4 py-6 sm:px-6">
      <PageHead title="Меню" sub="Зураг, нэр, тайлбар, үнийг энд засна. Хадгалмагц сайт болон ширээний QR меню шууд шинэчлэгдэнэ.">
        <button type="button" onClick={() => setAdding((v) => !v)} className="rounded-full bg-gold px-5 py-2.5 font-mono text-[0.65rem] tracking-[0.15em] text-ink uppercase">
          {adding ? "Хаах" : "+ Шинэ бүтээгдэхүүн"}
        </button>
      </PageHead>

      <ReceiptSettings auth={auth} />

      {adding && (
        <section className="mt-6">
          <ItemForm
            auth={auth}
            isNew
            initial={blank(cat === "all" ? "hot" : cat)}
            onSave={async (d) => {
              await create(d);
              setAdding(false);
            }}
          />
        </section>
      )}

      <nav className="no-scrollbar mt-6 flex gap-2 overflow-x-auto" aria-label="Ангилал">
        {[{ id: "all" as const, label: "Бүгд" }, ...categories].map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => setCat(c.id)}
            className={`shrink-0 rounded-full px-4 py-2 font-mono text-[0.62rem] tracking-[0.15em] uppercase ${cat === c.id ? "bg-cream text-ink" : "border border-white/15 text-cream"}`}
          >
            {c.label}
            <span className="ml-1.5 opacity-60">{(items ?? []).filter((i) => c.id === "all" || i.category === c.id).length}</span>
          </button>
        ))}
      </nav>

      {error && <p role="alert" className="mt-4 text-sm text-danger">{error}</p>}
      {!items && !error && <p className="mt-8 text-sm text-muted">Ачааллаж байна…</p>}

      <div className="mt-5 grid gap-4">
        {shown.map((it) => {
          const { id, ...rest } = it;
          return (
            <ItemForm
              key={id}
              auth={auth}
              initial={rest}
              onSave={(d) => save(id, d)}
              onDelete={() => remove(id)}
            />
          );
        })}
      </div>
    </main>
  );
}

export function MenuEditor() {
  return <AdminGate>{(auth) => <Editor auth={auth} />}</AdminGate>;
}
