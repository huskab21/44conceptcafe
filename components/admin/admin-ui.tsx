"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import type { AdminHeaders } from "@/components/admin/admin-gate";

/* ───────────── data ───────────── */

export async function adminFetch<T>(auth: AdminHeaders, url: string, init: RequestInit = {}): Promise<T> {
  const headers = { ...(init.body && !(init.body instanceof FormData) ? { "content-type": "application/json" } : {}), ...(await auth()) };
  const res = await fetch(url, { ...init, headers: { ...headers, ...(init.headers as Record<string, string>) }, cache: "no-store" });
  const data = (await res.json().catch(() => ({}))) as T & { error?: string };
  if (!res.ok) throw new Error(data.error ?? `Алдаа (${res.status})`);
  return data;
}

/** CRUD list for /api/admin/<kind>. */
export function useAdminList<T extends { id: string }>(auth: AdminHeaders, kind: "menu" | "wear") {
  const [items, setItems] = useState<T[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const base = `/api/admin/${kind}`;

  const load = useCallback(async () => {
    try {
      const { items } = await adminFetch<{ items: T[] }>(auth, base);
      setItems(items);
      setError(null);
    } catch (e) {
      setError((e as Error).message);
    }
  }, [auth, base]);

  useEffect(() => {
    const id = setTimeout(load, 0);
    return () => clearTimeout(id);
  }, [load]);

  const save = async (id: string, patch: Partial<T>) => {
    const { item } = await adminFetch<{ item: T }>(auth, `${base}/${id}`, { method: "PATCH", body: JSON.stringify(patch) });
    setItems((l) => l?.map((x) => (x.id === id ? item : x)) ?? l);
  };
  const create = async (input: Partial<T>) => {
    const { item } = await adminFetch<{ item: T }>(auth, base, { method: "POST", body: JSON.stringify(input) });
    setItems((l) => [...(l ?? []), item]);
  };
  const remove = async (id: string) => {
    await adminFetch(auth, `${base}/${id}`, { method: "DELETE" });
    setItems((l) => l?.filter((x) => x.id !== id) ?? l);
  };
  return { items, error, save, create, remove, reload: load };
}

/* ───────────── form bits ───────────── */

export const inputCls =
  "w-full rounded-xl border border-white/10 bg-ink px-3 py-2.5 text-sm text-cream placeholder:text-muted focus:border-gold focus:outline-none";

export function Field({ label, children, className = "" }: { label: string; children: ReactNode; className?: string }) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1.5 block font-mono text-[0.58rem] tracking-[0.18em] text-cream-dim uppercase">{label}</span>
      {children}
    </label>
  );
}

export function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`flex items-center gap-2 rounded-full border px-3 py-1.5 font-mono text-[0.6rem] tracking-[0.12em] uppercase transition-colors ${checked ? "border-gold bg-gold/15 text-gold" : "border-white/15 text-muted"}`}
    >
      <span className={`size-2 rounded-full ${checked ? "bg-gold" : "bg-white/20"}`} />
      {label}
    </button>
  );
}

/** Image preview + upload to Supabase storage. */
export function ImageField({ auth, value, onChange, folder }: { auth: AdminHeaders; value: string; onChange: (url: string) => void; folder: "menu" | "wear" }) {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function pick(file: File | undefined) {
    if (!file) return;
    setBusy(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.set("file", file);
      fd.set("folder", folder);
      const { url } = await adminFetch<{ url: string }>(auth, "/api/admin/upload", { method: "POST", body: fd });
      onChange(url);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
      if (input.current) input.current.value = "";
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => input.current?.click()}
        className="group relative block aspect-square w-full overflow-hidden rounded-2xl border border-dashed border-white/20 bg-ink-2 hover:border-gold"
        aria-label="Зураг солих"
      >
        {value && <Image src={value} alt="" fill sizes="200px" className="object-cover" />}
        <span className={`absolute inset-0 grid place-items-center bg-black/55 font-mono text-[0.6rem] tracking-[0.15em] text-cream uppercase transition-opacity ${busy || !value ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`}>
          {busy ? "Хуулж байна…" : value ? "Зураг солих" : "+ Зураг"}
        </span>
      </button>
      <input ref={input} type="file" accept="image/jpeg,image/png,image/webp,image/avif" className="hidden" onChange={(e) => pick(e.target.files?.[0])} />
      {error && <p role="alert" className="mt-1.5 text-xs text-danger">{error}</p>}
    </div>
  );
}

export function SaveBar({ dirty, busy, onSave, onDelete, onReset }: { dirty: boolean; busy: boolean; onSave: () => void; onDelete?: () => void; onReset?: () => void }) {
  const [confirm, setConfirm] = useState(false);
  return (
    <div className="flex flex-wrap items-center gap-2">
      <button type="button" disabled={!dirty || busy} onClick={onSave} className="rounded-full bg-gold px-5 py-2 font-mono text-[0.62rem] tracking-[0.15em] text-ink uppercase disabled:opacity-40">
        {busy ? "Хадгалж байна…" : "Хадгалах"}
      </button>
      {dirty && onReset && (
        <button type="button" onClick={onReset} className="px-2 py-2 font-mono text-[0.6rem] tracking-[0.12em] text-muted uppercase hover:text-cream">
          Болих
        </button>
      )}
      {onDelete &&
        (confirm ? (
          <span className="ml-auto flex items-center gap-2 text-xs text-cream-dim">
            Устгах уу?
            <button type="button" onClick={onDelete} className="rounded-full bg-danger px-3 py-1.5 font-mono text-[0.6rem] tracking-[0.12em] text-cream uppercase">
              Тийм
            </button>
            <button type="button" onClick={() => setConfirm(false)} className="font-mono text-[0.6rem] tracking-[0.12em] text-muted uppercase">
              Үгүй
            </button>
          </span>
        ) : (
          <button type="button" onClick={() => setConfirm(true)} className="ml-auto rounded-full border border-white/10 px-3 py-1.5 font-mono text-[0.6rem] tracking-[0.12em] text-muted uppercase hover:border-danger hover:text-danger">
            Устгах
          </button>
        ))}
    </div>
  );
}

export function PageHead({ title, sub, children }: { title: string; sub?: string; children?: ReactNode }) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-4 border-b border-white/10 pb-5">
      <div>
        <p className="font-mono text-[0.62rem] tracking-[0.3em] text-gold uppercase">44 concept café · Admin</p>
        <h1 className="mt-1 font-display text-4xl text-cream">{title}</h1>
        {sub && <p className="mt-2 max-w-xl text-sm text-cream-dim">{sub}</p>}
      </div>
      {children}
    </header>
  );
}
