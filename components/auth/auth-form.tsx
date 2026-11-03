"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { useAuth } from "@/components/providers/auth-provider";
import { signIn, signUp } from "@/lib/backend";
import { FormError, SubmitButton } from "./auth-shell";

/** Only allow redirects to local paths. */
function safeNext(next: string | null): string {
  return next && next.startsWith("/") && !next.startsWith("//") ? next : "/account";
}

export function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const router = useRouter();
  const params = useSearchParams();
  const next = safeNext(params.get("next"));
  const { user, loading: authLoading } = useAuth();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  // Already signed in → go straight on
  useEffect(() => {
    if (!authLoading && user) router.replace(next);
  }, [authLoading, user, next, router]);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setInfo(null);
    const f = new FormData(e.currentTarget);
    const email = String(f.get("email") ?? "").trim();
    const password = String(f.get("password") ?? "");

    if (mode === "signup") {
      const fullName = String(f.get("fullName") ?? "").trim();
      const phone = String(f.get("phone") ?? "").trim();
      if (fullName.length < 2) return setError("Нэрээ оруулна уу.");
      if (!/^[+\d\s-]{8,20}$/.test(phone)) return setError("Утасны дугаараа зөв оруулна уу.");
      if (password.length < 6) return setError("Нууц үг хамгийн багадаа 6 тэмдэгт байна.");
      if (password !== f.get("confirm")) return setError("Нууц үг таарахгүй байна.");

      setLoading(true);
      const res = await signUp({ email, password, fullName, phone });
      setLoading(false);
      if (!res.ok) return setError(res.error);
      if (res.data.needsConfirmation) {
        setInfo("Бүртгэл үүслээ! Имэйл рүү тань баталгаажуулах холбоос илгээлээ.");
        return;
      }
      router.replace(next);
      return;
    }

    setLoading(true);
    const res = await signIn(email, password);
    setLoading(false);
    if (!res.ok) return setError(res.error);
    router.replace(next);
  }

  const isSignup = mode === "signup";
  const otherHref = `${isSignup ? "/login" : "/signup"}${params.get("next") ? `?next=${encodeURIComponent(next)}` : ""}`;

  return (
    <div>
      <p className="text-xs tracking-[0.35em] text-gold uppercase">{isSignup ? "Sign up" : "Welcome back"}</p>
      <h1 className="mt-3 font-display text-5xl text-cream">{isSignup ? "Бүртгүүлэх" : "Нэвтрэх"}</h1>
      <p className="mt-3 text-cream-dim">
        {isSignup ? "Бүртгэлтэй бол ширээ захиалгаа нэг дороос удирдана." : "Ширээ захиалах бол нэвтэрнэ үү."}
      </p>

      <form onSubmit={onSubmit} className="mt-10 space-y-5" noValidate>
        {isSignup && (
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label htmlFor="fullName" className="field-label">Нэр</label>
              <input id="fullName" name="fullName" autoComplete="name" required className="field" placeholder="Бат-Эрдэнэ" />
            </div>
            <div>
              <label htmlFor="phone" className="field-label">Утас</label>
              <input id="phone" name="phone" type="tel" autoComplete="tel" inputMode="tel" required className="field" placeholder="9911 2233" />
            </div>
          </div>
        )}
        <div>
          <label htmlFor="email" className="field-label">Имэйл</label>
          <input id="email" name="email" type="email" autoComplete="email" required className="field" placeholder="you@example.com" />
        </div>
        <div>
          <label htmlFor="password" className="field-label">Нууц үг</label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete={isSignup ? "new-password" : "current-password"}
            required
            minLength={6}
            className="field"
            placeholder="••••••••"
          />
        </div>
        {isSignup && (
          <div>
            <label htmlFor="confirm" className="field-label">Нууц үг давтах</label>
            <input id="confirm" name="confirm" type="password" autoComplete="new-password" required className="field" placeholder="••••••••" />
          </div>
        )}

        <FormError message={error} />
        {info && (
          <p role="status" className="rounded-xl border border-success/40 bg-success/10 px-4 py-3 text-sm text-success">
            {info}
          </p>
        )}

        <SubmitButton loading={loading}>{isSignup ? "Бүртгүүлэх" : "Нэвтрэх"}</SubmitButton>
      </form>

      <p className="mt-8 text-center text-sm text-cream-dim">
        {isSignup ? "Бүртгэлтэй юу?" : "Бүртгэлгүй юу?"}{" "}
        <Link href={otherHref} className="text-gold underline-offset-4 hover:underline">
          {isSignup ? "Нэвтрэх" : "Бүртгүүлэх"}
        </Link>
      </p>
    </div>
  );
}
