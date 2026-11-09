import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const secret = process.env.SUPABASE_SECRET_KEY;

/** Server-only client with the secret key — bypasses RLS. Only use behind an admin check. */
export const adminDb: SupabaseClient | null = url && secret ? createClient(url, secret, { auth: { persistSession: false } }) : null;

export const MEDIA_BUCKET = "media";
