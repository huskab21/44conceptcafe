"use client";

import Image from "next/image";
import { motion } from "motion/react";
import type { ReactNode } from "react";
import { demoMode } from "@/lib/backend";

/** Split-screen layout shared by login, signup, reserve and account pages. */
export function AuthShell({
  image,
  imageAlt,
  quote,
  children,
}: {
  image: string;
  imageAlt: string;
  quote: ReactNode;
  children: ReactNode;
}) {
  return (
    <main className="grid min-h-svh grid-cols-1 lg:grid-cols-2">
      <motion.div
        initial={{ clipPath: "inset(0 100% 0 0)" }}
        animate={{ clipPath: "inset(0 0% 0 0)" }}
        transition={{ duration: 1.2, ease: [0.76, 0, 0.24, 1] }}
        className="relative hidden lg:block"
      >
        <Image src={image} alt={imageAlt} fill priority sizes="50vw" className="object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/40 to-ink/10" />
        <div className="absolute inset-x-0 bottom-0 p-12">
          <p className="max-w-md font-display text-5xl leading-tight text-cream">{quote}</p>
        </div>
      </motion.div>

      <div className="flex min-w-0 items-center justify-center px-4 pt-28 pb-16 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.2 }}
          className="w-full max-w-md"
        >
          {demoMode && (
            <p className="mb-6 rounded-xl border border-gold/30 bg-gold/10 px-4 py-3 text-xs leading-relaxed text-gold-soft">
              <strong>Демо горим:</strong> Өгөгдлийн сан холбогдоогүй тул мэдээлэл зөвхөн энэ хөтөч дээр хадгалагдаж байна.
            </p>
          )}
          {children}
        </motion.div>
      </div>
    </main>
  );
}

export function FormError({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <motion.p
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      role="alert"
      className="rounded-xl border border-danger/40 bg-danger/10 px-4 py-3 text-sm text-danger"
    >
      {message}
    </motion.p>
  );
}

export function SubmitButton({ loading, children }: { loading: boolean; children: ReactNode }) {
  return (
    <button
      type="submit"
      disabled={loading}
      className="group relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-full bg-gold px-6 py-4 font-semibold text-ink transition-opacity disabled:opacity-60"
    >
      <span className="absolute inset-0 translate-y-full bg-cream transition-transform duration-500 group-hover:translate-y-0" />
      <span className="relative z-10 flex items-center gap-2">
        {loading && <span className="size-4 animate-spin rounded-full border-2 border-ink/30 border-t-ink" aria-hidden />}
        {children}
      </span>
    </button>
  );
}
