"use client";

import { useState } from "react";
import { AdminGate, type AdminHeaders } from "@/components/admin/admin-gate";
import { Field, ImageField, inputCls, PageHead, SaveBar, Toggle, useAdminList } from "@/components/admin/admin-ui";
import type { GalleryRow } from "@/lib/gallery-db";

type Draft = Omit<GalleryRow, "id">;

const blank: Draft = { image: "", alt: "", sort_order: 999, is_visible: true };

function PhotoForm({ auth, initial, onSave, onDelete, isNew = false }: { auth: AdminHeaders; initial: Draft; onSave: (d: Draft) => Promise<void>; onDelete?: () => Promise<void>; isNew?: boolean }) {
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
    <article className={`grid content-start gap-3 rounded-3xl border p-4 ${d.is_visible ? "border-white/10 bg-ink-2/60" : "border-white/5 bg-ink-2/20 opacity-70"}`}>
      <ImageField auth={auth} folder="gallery" value={d.image} onChange={(url) => set("image", url)} />
      <Field label="Тайлбар (заавал биш)">
        <input className={inputCls} value={d.alt} onChange={(e) => set("alt", e.target.value)} maxLength={120} placeholder="Кофе бар" />
      </Field>
      <Field label="Дараалал (бага нь эхэнд)">
        <input type="number" className={`${inputCls} tabular-nums`} value={d.sort_order} onChange={(e) => set("sort_order", Number(e.target.value))} />
      </Field>
      <Toggle checked={d.is_visible} onChange={(v) => set("is_visible", v)} label={d.is_visible ? "Сайт дээр харагдана" : "Нуусан"} />
      {error && <p role="alert" className="text-sm text-danger">{error}</p>}
      {saved && !dirty && !isNew && <p className="text-xs text-success">✓ Хадгалагдлаа.</p>}
      <SaveBar
        dirty={isNew ? Boolean(d.image) : dirty}
        busy={busy}
        onSave={() => run(() => onSave(d))}
        onReset={isNew ? undefined : () => setD(base)}
        onDelete={onDelete ? () => run(onDelete) : undefined}
      />
    </article>
  );
}

function Editor({ auth }: { auth: AdminHeaders }) {
  const { items, error, save, create, remove } = useAdminList<GalleryRow>(auth, "gallery");
  const [adding, setAdding] = useState(false);

  return (
    <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
      <PageHead title="44 Мөчүүд" sub="Нүүр хуудасны “Мөчүүд @44” галерей — зураг нэмэх, солих, дараалал өөрчлөх, нуух, устгах. Босоо (3:4) зураг хамгийн гоё харагдана.">
        <button type="button" onClick={() => setAdding((v) => !v)} className="rounded-full bg-gold px-5 py-2.5 font-mono text-[0.65rem] tracking-[0.15em] text-ink uppercase">
          {adding ? "Хаах" : "+ Шинэ зураг"}
        </button>
      </PageHead>

      {adding && (
        <section className="mt-6 max-w-sm">
          <PhotoForm
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

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {(items ?? []).map(({ id, ...rest }) => (
          <PhotoForm key={id} auth={auth} initial={rest} onSave={(d) => save(id, d)} onDelete={() => remove(id)} />
        ))}
      </div>
    </main>
  );
}

export function GalleryEditor() {
  return <AdminGate>{(auth) => <Editor auth={auth} />}</AdminGate>;
}
