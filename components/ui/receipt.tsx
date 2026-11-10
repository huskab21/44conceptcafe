"use client";

import { motion } from "motion/react";
import type { ReactNode } from "react";

/** Dark thermal-printer body with a paper slot. Children (the receipt) feed out below the slot. */
export function Printer({ children, printing = false }: { children: ReactNode; printing?: boolean }) {
  return (
    <div className="relative mx-auto w-full max-w-[26rem]">
      <div className="relative z-10 rounded-t-[1.6rem] rounded-b-lg border border-white/10 bg-gradient-to-b from-[#262626] to-[#0d0d0d] px-6 pt-5 pb-4 shadow-[0_30px_60px_rgba(0,0,0,0.6),inset_0_1px_0_rgba(255,255,255,0.08)]">
        <div className="flex items-center justify-between font-mono text-[0.6rem] tracking-[0.25em] text-cream-dim uppercase">
          <span>44 · Thermal</span>
          <span className="flex items-center gap-2">
            {printing ? "Хэвлэж байна" : "Бэлэн"}
            <span className={`size-2 rounded-full ${printing ? "animate-pulse bg-gold" : "bg-success"}`} />
          </span>
        </div>
        {/* slot */}
        <div className="mt-4 h-2.5 rounded-full bg-black shadow-[inset_0_2px_4px_rgba(0,0,0,0.9)]" />
      </div>
      {/* paper exits from under the slot */}
      <div className="relative mx-auto -mt-3 w-[88%] overflow-hidden pt-3">{children}</div>
    </div>
  );
}

/** Thermal receipt paper with zig-zag bottom edge. Animate `printKey` to re-print. */
export function ReceiptPaper({
  children,
  printKey,
  duration = 1.6,
  start = true,
  onPrinted,
}: {
  children: ReactNode;
  printKey: string | number;
  duration?: number;
  start?: boolean;
  onPrinted?: () => void;
}) {
  return (
    <motion.div
      key={printKey}
      initial={{ y: "-100%" }}
      animate={start ? { y: "0%" } : { y: "-100%" }}
      transition={{ duration, ease: [0.45, 0.05, 0.35, 1] }}
      onAnimationComplete={() => start && onPrinted?.()}
      className="receipt-edge relative bg-[#f5f0e6] px-6 pt-6 pb-10 font-mono text-[0.78rem] leading-relaxed text-[#1c1611] shadow-[0_20px_40px_rgba(0,0,0,0.45)]"
    >
      {/* subtle thermal fade at the top where paper leaves the slot */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-6 bg-gradient-to-b from-black/15 to-transparent" />
      {children}
    </motion.div>
  );
}

export function Dashed() {
  return <div className="my-3 border-t border-dashed border-[#1c1611]/40" />;
}

/** Decorative barcode. Deterministic so server and client markup match. */
export function Barcode({ seed = "44" }: { seed?: string }) {
  const bars = Array.from({ length: 46 }, (_, i) => {
    const c = seed.charCodeAt(i % seed.length) + i * 7;
    return 1 + (c % 3);
  });
  let x = 0;
  return (
    <svg viewBox="0 0 110 36" preserveAspectRatio="none" className="mx-auto mt-4 h-9 w-40" aria-hidden>
      {bars.map((w, i) => {
        const rect = i % 2 === 0 ? <rect key={i} x={x} y={0} width={w} height={36} fill="#1c1611" /> : null;
        x += w + (i % 2 === 0 ? 0 : 0.6);
        return rect;
      })}
    </svg>
  );
}
