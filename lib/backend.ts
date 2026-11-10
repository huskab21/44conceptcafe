"use client";

/**
 * Client-side data layer for auth + reservations.
 *
 * - With Supabase env vars set → uses Supabase Auth + the `reservations` table (RLS-protected).
 * - Without them → DEMO MODE: everything is stored in this browser's localStorage so the
 *   flows can be clicked through before the database is connected. Never use demo mode in production.
 */

import { getBrowserSupabase, isSupabaseConfigured } from "./supabase";

export type AppUser = {
  id: string;
  email: string;
  fullName: string;
  phone: string;
  /** app_metadata.role === "admin" — set only from the Supabase dashboard / SQL. */
  isAdmin: boolean;
};

export type ReservationStatus = "pending" | "confirmed" | "cancelled";

export type Reservation = {
  id: string;
  user_id: string;
  full_name: string;
  phone: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  guests: number;
  note: string | null;
  status: ReservationStatus;
  created_at: string;
  /** ₮ deposit, deducted from the final bill. */
  deposit: number;
  deposit_paid: boolean;
  /** Guest confirmed they are 21+ (checked again at the door). */
  age_confirmed: boolean;
};

export type NewReservation = Pick<Reservation, "full_name" | "phone" | "date" | "time" | "guests" | "note" | "age_confirmed">;

export const demoMode = !isSupabaseConfigured;

/* ───────────── helpers ───────────── */

const translate: Record<string, string> = {
  "Invalid login credentials": "Имэйл эсвэл нууц үг буруу байна.",
  "User already registered": "Энэ имэйлээр бүртгэл үүссэн байна.",
  "Email not confirmed": "Имэйлээ баталгаажуулна уу. Танд холбоос илгээсэн.",
  "Password should be at least 6 characters.": "Нууц үг хамгийн багадаа 6 тэмдэгт байна.",
};
function friendly(message: string): string {
  return translate[message] ?? message;
}

/* ───────────── demo storage ───────────── */

type DemoUser = AppUser & { password: string };
const K = { users: "h44_demo_users", session: "h44_demo_session", res: "h44_demo_reservations" };

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}
function write(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage unavailable – ignore */
  }
}
const listeners = new Set<(u: AppUser | null) => void>();
function emit(u: AppUser | null) {
  listeners.forEach((l) => l(u));
}
function strip(u: DemoUser): AppUser {
  return { id: u.id, email: u.email, fullName: u.fullName, phone: u.phone, isAdmin: false };
}

/* ───────────── auth ───────────── */

type Result<T = undefined> = { ok: true; data: T } | { ok: false; error: string };

export async function signUp(input: {
  email: string;
  password: string;
  fullName: string;
  phone: string;
}): Promise<Result<{ needsConfirmation: boolean }>> {
  const sb = getBrowserSupabase();
  if (sb) {
    const { data, error } = await sb.auth.signUp({
      email: input.email,
      password: input.password,
      options: {
        data: { full_name: input.fullName, phone: input.phone },
        emailRedirectTo: `${window.location.origin}/account`,
      },
    });
    if (error) return { ok: false, error: friendly(error.message) };
    return { ok: true, data: { needsConfirmation: !data.session } };
  }

  const users = read<DemoUser[]>(K.users, []);
  if (users.some((u) => u.email.toLowerCase() === input.email.toLowerCase())) {
    return { ok: false, error: translate["User already registered"] };
  }
  const user: DemoUser = { id: crypto.randomUUID(), ...input, isAdmin: false };
  write(K.users, [...users, user]);
  write(K.session, user.id);
  emit(strip(user));
  return { ok: true, data: { needsConfirmation: false } };
}

export async function signIn(email: string, password: string): Promise<Result> {
  const sb = getBrowserSupabase();
  if (sb) {
    const { error } = await sb.auth.signInWithPassword({ email, password });
    return error ? { ok: false, error: friendly(error.message) } : { ok: true, data: undefined };
  }
  const user = read<DemoUser[]>(K.users, []).find(
    (u) => u.email.toLowerCase() === email.toLowerCase() && u.password === password,
  );
  if (!user) return { ok: false, error: translate["Invalid login credentials"] };
  write(K.session, user.id);
  emit(strip(user));
  return { ok: true, data: undefined };
}

export async function signOut(): Promise<void> {
  const sb = getBrowserSupabase();
  if (sb) {
    await sb.auth.signOut();
    return;
  }
  try {
    localStorage.removeItem(K.session);
  } catch {}
  emit(null);
}

export async function getCurrentUser(): Promise<AppUser | null> {
  const sb = getBrowserSupabase();
  if (sb) {
    const { data } = await sb.auth.getSession();
    const u = data.session?.user;
    if (!u) return null;
    return {
      id: u.id,
      email: u.email ?? "",
      fullName: (u.user_metadata?.full_name as string) ?? "",
      phone: (u.user_metadata?.phone as string) ?? "",
      isAdmin: u.app_metadata?.role === "admin",
    };
  }
  const id = read<string | null>(K.session, null);
  const user = read<DemoUser[]>(K.users, []).find((u) => u.id === id);
  return user ? strip(user) : null;
}

export function onAuthChange(cb: (u: AppUser | null) => void): () => void {
  const sb = getBrowserSupabase();
  if (sb) {
    const { data } = sb.auth.onAuthStateChange((_event, session) => {
      const u = session?.user;
      cb(
        u
          ? {
              id: u.id,
              email: u.email ?? "",
              fullName: (u.user_metadata?.full_name as string) ?? "",
              phone: (u.user_metadata?.phone as string) ?? "",
              isAdmin: u.app_metadata?.role === "admin",
            }
          : null,
      );
    });
    return () => data.subscription.unsubscribe();
  }
  listeners.add(cb);
  return () => listeners.delete(cb);
}

/* ───────────── reservations ───────────── */

export async function createReservation(userId: string, input: NewReservation): Promise<Result<Reservation>> {
  const sb = getBrowserSupabase();
  if (sb) {
    const { data, error } = await sb
      .from("reservations")
      .insert({ ...input, user_id: userId })
      .select()
      .single();
    if (error) {
      const msg = error.message.includes("reservation_slot_full")
        ? "Энэ цагт ширээ дүүрсэн байна. Өөр цаг сонгоно уу."
        : error.message.includes("reservation_invalid_time")
          ? "Ширээ зөвхөн 18:00-оос хойш захиалагдана."
          : error.message.includes("reservation_age")
            ? "Ширээ захиалга зөвхөн 21 нас хүрсэн хүнд."
            : error.message;
      return { ok: false, error: msg };
    }
    return { ok: true, data: data as Reservation };
  }

  const all = read<Reservation[]>(K.res, []);
  const r: Reservation = {
    id: crypto.randomUUID(),
    user_id: userId,
    status: "pending",
    created_at: new Date().toISOString(),
    deposit: 50_000,
    deposit_paid: false,
    ...input,
  };
  write(K.res, [r, ...all]);
  return { ok: true, data: r };
}

export async function listMyReservations(userId: string): Promise<Result<Reservation[]>> {
  const sb = getBrowserSupabase();
  if (sb) {
    const { data, error } = await sb
      .from("reservations")
      .select("*")
      .eq("user_id", userId)
      .order("date", { ascending: false })
      .order("time", { ascending: false });
    if (error) return { ok: false, error: error.message };
    return { ok: true, data: data as Reservation[] };
  }
  const mine = read<Reservation[]>(K.res, [])
    .filter((r) => r.user_id === userId)
    .sort((a, b) => (b.date + b.time).localeCompare(a.date + a.time));
  return { ok: true, data: mine };
}

export async function cancelReservation(id: string): Promise<Result> {
  const sb = getBrowserSupabase();
  if (sb) {
    const { error } = await sb.from("reservations").update({ status: "cancelled" }).eq("id", id);
    return error ? { ok: false, error: error.message } : { ok: true, data: undefined };
  }
  const all = read<Reservation[]>(K.res, []).map((r) =>
    r.id === id ? { ...r, status: "cancelled" as const } : r,
  );
  write(K.res, all);
  return { ok: true, data: undefined };
}

/** `Authorization` header with the signed-in user's Supabase token (empty when signed out / demo mode). */
export async function authHeader(): Promise<Record<string, string>> {
  const h: Record<string, string> = {};
  const sb = getBrowserSupabase();
  if (!sb) return h;
  const { data } = await sb.auth.getSession();
  if (data.session) h.Authorization = `Bearer ${data.session.access_token}`;
  return h;
}

/** Book a table — works without an account; signed-in guests get it linked to their account. */
export async function bookTable(userId: string | null, input: NewReservation): Promise<Result<Reservation>> {
  if (!isSupabaseConfigured) return createReservation(userId ?? "guest", input);
  try {
    const res = await fetch("/api/reservations", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...(await authHeader()) },
      body: JSON.stringify(input),
    });
    const json = (await res.json().catch(() => ({}))) as { reservation?: Reservation; error?: string };
    if (!res.ok || !json.reservation) return { ok: false, error: json.error ?? "Захиалга илгээхэд алдаа гарлаа." };
    return { ok: true, data: json.reservation };
  } catch {
    return { ok: false, error: "Сүлжээний алдаа. Дахин оролдоно уу." };
  }
}
