"use client";

import Link from "next/link";
import { useCallback, useEffect, useState, type ReactNode } from "react";
import { useAuth } from "@/components/providers/auth-provider";
import { signOut } from "@/lib/backend";
import { getBrowserSupabase } from "@/lib/supabase";

const STORE = "h44_admin_key";

/** Returns the headers that authenticate an admin API request. */
export type AdminHeaders = () => Promise<Record<string, string>>;

/**
 * Opens the staff pages for
 *  - a signed-in user with the admin role (Supabase app_metadata.role = "admin"), or
 *  - anyone with the shared ADMIN_KEY (kept on this device, e.g. a bar tablet).
 * The API re-checks on every request.
 */
export function AdminGate({ children }: { children: (headers: AdminHeaders, logout: () => void) => ReactNode }) {
  const { user, loading } = useAuth();
  const [key, setKey] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [input, setInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    // Deferred a tick: localStorage only exists in the browser.
    const id = setTimeout(() => {
      try {
        setKey(localStorage.getItem(STORE));
      } catch {}
      setReady(true);
    }, 0);
    return () => clearTimeout(id);
  }, []);

  const sessionHeaders = useCallback<AdminHeaders>(async () => {
    const h: Record<string, string> = {};
    const { data } = (await getBrowserSupabase()?.auth.getSession()) ?? { data: { session: null } };
    if (data.session) h.Authorization = `Bearer ${data.session.access_token}`;
    return h;
  }, []);
  const keyHeaders = useCallback<AdminHeaders>(async () => {
    const h: Record<string, string> = {};
    if (key) h["x-admin-key"] = key;
    return h;
  }, [key]);

  async function login(e: React.FormEvent) {
    e.preventDefault();
    setChecking(true);
    setError(null);
    const res = await fetch("/api/orders", { headers: { "x-admin-key": input } }).catch(() => null);
    setChecking(false);
    if (!res?.ok) {
      setError("Түлхүүр буруу байна.");
      return;
    }
    try {
      localStorage.setItem(STORE, input);
    } catch {}
    setKey(input);
  }

  const logoutKey = useCallback(() => {
    try {
      localStorage.removeItem(STORE);
    } catch {}
    setKey(null);
    setInput("");
  }, []);

  if (!ready || loading) return null;
  if (user?.isAdmin) return <>{children(sessionHeaders, () => void signOut())}</>;
  if (key) return <>{children(keyHeaders, logoutKey)}</>;

  return (
    <main className="grid min-h-svh place-items-center px-5">
      <form onSubmit={login} className="w-full max-w-sm rounded-3xl border border-white/10 bg-ink-2 p-8">
        <p className="font-mono text-[0.65rem] tracking-[0.3em] text-gold uppercase">44 · Staff</p>
        <h1 className="mt-3 font-display text-4xl text-cream">Admin</h1>

        {user ? (
          <p className="mt-4 text-sm text-cream-dim">
            <b className="text-cream">{user.email}</b> бүртгэлд admin эрх байхгүй байна.
          </p>
        ) : (
          <Link href="/login?next=/admin" className="mt-6 block rounded-full bg-gold py-3.5 text-center font-mono text-xs tracking-[0.2em] text-ink uppercase">
            Бүртгэлээрээ нэвтрэх
          </Link>
        )}

        <p className="mt-8 font-mono text-[0.6rem] tracking-[0.2em] text-muted uppercase">эсвэл</p>
        <label className="mt-3 block">
          <span className="font-mono text-[0.62rem] tracking-[0.2em] text-cream-dim uppercase">Админ түлхүүр</span>
          <input
            type="password"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            autoComplete="current-password"
            className="mt-2 w-full rounded-xl border border-white/10 bg-ink px-4 py-3 text-cream focus:border-gold focus:outline-none"
          />
        </label>
        {error && <p role="alert" className="mt-3 text-sm text-danger">{error}</p>}
        <button disabled={checking || !input} className="mt-6 w-full rounded-full border border-cream/60 py-3.5 font-mono text-xs tracking-[0.2em] text-cream uppercase disabled:opacity-50">
          {checking ? "Шалгаж байна…" : "Түлхүүрээр нэвтрэх"}
        </button>
      </form>
    </main>
  );
}
