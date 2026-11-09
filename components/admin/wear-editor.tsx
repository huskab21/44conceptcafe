"use client";

import { useState } from "react";
import { AdminGate, type AdminHeaders } from "@/components/admin/admin-gate";
import { Field, ImageField, inputCls, PageHead, SaveBar, Toggle, useAdminList } from "@/components/admin/admin-ui";
import { formatPrice } from "@/lib/site";
import type { WearRow } from "@/lib/wear-db";

type Draft = Omit<WearRow, "id">;

const blank: Draft = {
  name: "",
  kind: "",
  price: 0,
  image: "",
  w: 600,
  h: 750,
  sizes: ["M"],
  height_min: 160,
  height_max: 185,
  weight_min: 50,
  weight_max: 85,
  gender: "Унисекс",
  sort_order: 999,
  is_available: true,
};

/** Read the uploaded photo's real size so the card keeps its aspect ratio. */
function measure(url: string): Promise<{ w: number; h: number } | null> {
  return new Promise((resolve) => {
    const img = new window.Image();
    img.onload = () => resolve({ w: img.naturalWidth, h: img.naturalHeight });
    img.onerror = () => resolve(null);
    img.src = url;
  });
}

function WearForm({ auth, initial, onSave, onDelete, isNew = false }: { auth: AdminHeaders; initial: Draft; onSave: (d: Draft) => Promise<void>; onDelete?: () => Promise<void>; isNew?: boolean }) {
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
  const num = (k: "price" | "sort_order") => ({
    type: "number" as const,
    value: d[k],
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => set(k, Number(e.target.value)),
    className: `${inputCls} tabular-nums`,
  });

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
    <article className={`grid gap-4 rounded-3xl border p-4 sm:grid-cols-[160px_1fr] ${d.is_available ? "border-white/10 bg-ink-2/60" : "border-white/5 bg-ink-2/20 opacity-70"}`}>
      <ImageField
        auth={auth}
        folder="wear"
        value={d.image}
        onChange={async (url) => {
          set("image", url);
          const size = await measure(url);
          if (size) setD((x) => ({ ...x, w: size.w, h: size.h }));
        }}
      />
      <div className="grid gap-3">
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Нэр (хувцас дээрх бичиг)">
            <input className={inputCls} value={d.name} onChange={(e) => set("name", e.target.value)} maxLength={80} placeholder="Nevermind Denim" />
          </Field>
          <Field label="Тайлбар">
            <input className={inputCls} value={d.kind} onChange={(e) => set("kind", e.target.value)} maxLength={120} placeholder="Гар зурагтай жинсэн хүрэм" />
          </Field>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label={`Үнэ · ${formatPrice(d.price)}`}>
            <input {...num("price")} min={0} step={1000} />
          </Field>
          <Field label="Дараалал">
            <input {...num("sort_order")} />
          </Field>
        </div>
        <div>
          <Toggle checked={d.is_available} onChange={(v) => set("is_available", v)} label={d.is_available ? "Сайт дээр харагдана" : "Нуусан / зарагдсан"} />
        </div>
        {error && <p role="alert" className="text-sm text-danger">{error}</p>}
        {saved && !dirty && !isNew && <p className="text-xs text-success">✓ Хадгалагдлаа. Сайт дээр шууд шинэчлэгдэнэ.</p>}
        <SaveBar
          dirty={isNew ? Boolean(d.name && d.image) : dirty}
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
  const { items, error, save, create, remove } = useAdminList<WearRow>(auth, "wear");
  const [adding, setAdding] = useState(false);

  return (
    <main className="mx-auto max-w-5xl px-4 py-6 sm:px-6">
      <PageHead title="Art Wear" sub="Сайт дээр байгаа хувцаснууд — зураг, нэр, тайлбар, үнийг засна. Зарагдсан хувцсыг устгалгүйгээр “Нуусан” болгож болно.">
        <button type="button" onClick={() => setAdding((v) => !v)} className="rounded-full bg-gold px-5 py-2.5 font-mono text-[0.65rem] tracking-[0.15em] text-ink uppercase">
          {adding ? "Хаах" : "+ Шинэ хувцас"}
        </button>
      </PageHead>

      {adding && (
        <section className="mt-6">
          <WearForm
            auth={auth}
            isNew
            initial={blank}
            onSave={async (d) => {
              await create(d);
              setAdding(false);
            }}
          />
        </section>
      )}

      {error && <p role="alert" className="mt-4 text-sm text-danger">{error}</p>}
      {!items && !error && <p className="mt-8 text-sm text-muted">Ачааллаж байна…</p>}

      <div className="mt-6 grid gap-4">
        {(items ?? []).map(({ id, ...rest }) => (
          <WearForm key={id} auth={auth} initial={rest} onSave={(d) => save(id, d)} onDelete={() => remove(id)} />
        ))}
      </div>
    </main>
  );
}

export function WearEditor() {
  return <AdminGate>{(auth) => <Editor auth={auth} />}</AdminGate>;
}
