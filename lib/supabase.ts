import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

/** True once both Supabase env vars are set. Without them the site runs in demo mode. */
export const isSupabaseConfigured = Boolean(url && key);

let browserClient: SupabaseClient | null = null;

/** Browser client: keeps the auth session in localStorage. */
export function getBrowserSupabase(): SupabaseClient | null {
  if (!isSupabaseConfigured) return null;
  if (!browserClient) {
    browserClient = createClient(url!, key!, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
    });
  }
  return browserClient;
}

/** Stateless server client for public reads (menu). */
export function getServerSupabase(): SupabaseClient | null {
  if (!isSupabaseConfigured) return null;
  return createClient(url!, key!, { auth: { persistSession: false } });
}
