"use client";

import { AnimatePresence, motion } from "motion/react";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { ReservationForm } from "@/components/reserve/reservation-form";
import { site } from "@/lib/site";

/**
 * Any link to /reserve on the site opens this calendar sheet instead of navigating
 * (new-tab / modified clicks still navigate normally). The /reserve page keeps working on its own.
 */
export function ReserveDialog() {
  const [open, setOpen] = useState(false);
  const path = usePathname();

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = (e.target as HTMLElement | null)?.closest?.("a");
      if (!a || a.target === "_blank") return;
      const url = new URL(a.href, window.location.href);
      if (url.origin !== window.location.origin || url.pathname !== "/reserve") return;
      e.preventDefault();
      setOpen(true);
    };
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    document.documentElement.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.documentElement.style.overflow = "";
    };
  }, [open]);

  if (path === "/reserve") return null;

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.button
            type="button"
            aria-label="Хаах"
            className="fixed inset-0 z-[95] bg-black/70 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setOpen(false)}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Ширээ захиалах"
            data-lenis-prevent
            initial={{ opacity: 0, y: 60, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.97 }}
            transition={{ type: "spring", stiffness: 260, damping: 28 }}
            className="fixed inset-x-0 bottom-0 z-[96] mx-auto max-h-[94svh] w-full max-w-xl overflow-y-auto rounded-t-[2rem] border border-white/10 bg-ink p-4 shadow-2xl sm:top-1/2 sm:bottom-auto sm:-translate-y-1/2 sm:rounded-[2rem] sm:p-6"
          >
            <div className="mb-4 flex items-start justify-between gap-4 px-1">
              <div>
                <p className="font-mono text-[0.6rem] tracking-[0.3em] text-gold uppercase">{site.slogan}</p>
                <h2 className="mt-1 font-display text-4xl text-cream">Ширээ захиалах</h2>
              </div>
              <button type="button" onClick={() => setOpen(false)} aria-label="Хаах" className="grid size-10 shrink-0 place-items-center rounded-full border border-white/15 text-cream hover:border-gold">
                ✕
              </button>
            </div>
            <ReservationForm />
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
