import type { Metadata } from "next";
import { AccountView } from "@/components/account/account-view";
import { isSupabaseConfigured } from "@/lib/supabase";

export const metadata: Metadata = { title: "Миний бүртгэл" };

export default function AccountPage() {
  return (
    <main className="mx-auto min-h-svh max-w-4xl px-4 pt-32 pb-24 sm:px-6">
      {!isSupabaseConfigured && (
        <p className="mb-8 rounded-xl border border-gold/30 bg-gold/10 px-4 py-3 text-xs text-gold-soft">
          <strong>Демо горим:</strong> Өгөгдлийн сан холбогдоогүй тул мэдээлэл зөвхөн энэ хөтөч дээр хадгалагдаж байна.
        </p>
      )}
      <AccountView />
    </main>
  );
}
