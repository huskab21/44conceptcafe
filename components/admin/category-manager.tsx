"use client";

import { useState } from "react";
import { inputCls, SaveBar } from "@/components/admin/admin-ui";
import type { Category } from "@/lib/menu-data";

type Draft = Omit<Category, "id">;

function Row({
  initial,
  count,
  onSave,
  onDelete,
  isNew = false,
}: {
  initial: Draft;
  count?: number;
  onSave: (d: Draft) => Promise<void>;
  onDelete?: () => Promise<void>;
  isNew?: boolean;
}) {
  const [base, setBase] = useState(initial);
  const [d, setD] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const dirty = JSON.stringify(d) !== JSON.stringify(base);
  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => setD((x) => ({ ...x, [k]: v }));

  async function run(fn: () => Promise<void>) {
    setBusy(true);
    setError(null);
    try {
      await fn();
      if (isNew) setD(initial);
      else setBase(d);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <li className="grid gap-2 border-b border-white/5 py-3 last:border-0">
      <div className="grid grid-cols-[1fr_1fr_72px] gap-2">
        <input className={inputCls} placeholder="Нэр (ж: Цай)" aria-label="Ангиллын нэр" value={d.label} maxLength={40} onChange={(e) => set("label", e.target.value)} />
        <input className={inputCls} placeholder="Англи (ж: Tea)" aria-label="Англи нэр" value={d.en} maxLength={40} onChange={(e) => set("en", e.target.value)} />
        <input className={`${inputCls} tabular-nums`} type="number" aria-label="Дараалал" title="Дараалал (бага нь түрүүлж харагдана)" value={d.sort_order} onChange={(e) => set("sort_order", Number(e.target.value))} />
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {count !== undefined && <span className="font-mono text-[0.6rem] tracking-[0.12em] text-muted uppercase">{count} бүтээгдэхүүн</span>}
        <div className="flex-1">
          <SaveBar
            dirty={isNew ? Boolean(d.label.trim()) : dirty}
            busy={busy}
            onSave={() => run(() => onSave(d))}
            onReset={isNew ? undefined : () => setD(base)}
            onDelete={onDelete ? () => run(onDelete) : undefined}
          />
        </div>
      </div>
      {error && <p role="alert" className="text-xs text-danger">{error}</p>}
    </li>
  );
}

/** Add / rename / reorder / delete menu categories. */
export function CategoryManager({
  categories,
  counts,
  error,
  save,
  create,
  remove,
}: {
  categories: Category[] | null;
  counts: Record<string, number>;
  error: string | null;
  save: (id: string, d: Partial<Category>) => Promise<void>;
  create: (d: Partial<Category>) => Promise<void>;
  remove: (id: string) => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const nextOrder = Math.max(0, ...(categories ?? []).map((c) => c.sort_order)) + 10;

  return (
    <section className="mt-6 rounded-3xl border border-white/10 bg-ink-2/60 p-4">
      <button type="button" onClick={() => setOpen((v) => !v)} className="flex w-full items-center justify-between text-left" aria-expanded={open}>
        <span>
          <span className="block font-mono text-[0.62rem] tracking-[0.2em] text-gold uppercase">Ангилал</span>
          <span className="mt-1 block text-sm text-cream-dim">Менюгийн ангиллыг нэмэх, нэрийг нь засах, дараалал солих, устгах.</span>
        </span>
        <span className="font-mono text-lg text-cream">{open ? "−" : "+"}</span>
      </button>

      {open && (
        <div className="mt-4">
          {error && <p role="alert" className="mb-3 text-sm text-danger">{error}</p>}
          {categories && (
            <ul>
              {categories.map(({ id, ...rest }) => (
                <Row key={id} initial={rest} count={counts[id] ?? 0} onSave={(d) => save(id, d)} onDelete={() => remove(id)} />
              ))}
              <Row key={`new-${nextOrder}`} isNew initial={{ label: "", en: "", sort_order: nextOrder }} onSave={(d) => create(d)} />
            </ul>
          )}
          <p className="mt-3 text-xs text-muted">Бүтээгдэхүүнтэй ангиллыг устгах боломжгүй — эхлээд бүтээгдэхүүнийг нь өөр ангилал руу шилжүүлнэ үү. Хоосон ангилал сайт дээр харагдахгүй.</p>
        </div>
      )}
    </section>
  );
}
