"use client";

import { motion } from "motion/react";
import { Eyebrow, Reveal } from "@/components/ui/motion";
import { site } from "@/lib/site";

/** "Leave a Google review → 50% off your coffee" promo. Review link: site.googleReviewUrl. */
export function ReviewDeal() {
  return (
    <section id="review" aria-label="Google review урамшуулал" className="relative py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <div className="relative grid items-center gap-10 overflow-hidden rounded-[2.5rem] border-4 border-ink-3 bg-gold p-8 text-ink sm:p-14 lg:grid-cols-[1fr_auto]">
          <div className="camo absolute inset-y-0 right-0 hidden w-1/3 opacity-90 lg:block" aria-hidden />
          <div className="relative">
            <Eyebrow className="!text-ink/70">Google review</Eyebrow>
            <Reveal>
              <h2 className="mt-4 font-display text-5xl leading-[0.95] sm:text-7xl">
                Review үлдээ,
                <br />
                <em className="!text-ink">кофе 50% off.</em>
              </h2>
            </Reveal>
            <ol className="mt-8 grid gap-3 text-sm font-semibold sm:grid-cols-3">
              {["Google дээр 44 Concept Café-д review бичнэ", "Review-гээ баристад үзүүлнэ", "Уух кофе тань 50% хямдарна"].map((step, i) => (
                <li key={step} className="flex items-start gap-3 rounded-2xl bg-ink/10 p-4">
                  <span className="grid size-7 shrink-0 place-items-center rounded-full bg-ink font-mono text-xs text-gold">{i + 1}</span>
                  {step}
                </li>
              ))}
            </ol>
            <p className="mt-4 text-xs text-ink/60">* Нэг review — нэг кофе. Бусад урамшуулалтай давхцахгүй.</p>
          </div>

          <motion.a
            href={site.googleReviewUrl}
            target="_blank"
            rel="noreferrer"
            whileHover={{ rotate: -6, scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            initial={{ rotate: 8 }}
            className="sticker relative mx-auto grid size-48 place-items-center rounded-full bg-ink text-center text-cream sm:size-56"
          >
            <span>
              <span className="block font-display text-6xl text-gold">50%</span>
              <span className="mt-1 block font-mono text-[0.65rem] tracking-[0.2em] uppercase">Review бичих ↗</span>
              <span className="mt-2 block text-lg tracking-[0.2em] text-gold" aria-label="5 од">
                ★★★★★
              </span>
            </span>
          </motion.a>
        </div>
      </div>
    </section>
  );
}
