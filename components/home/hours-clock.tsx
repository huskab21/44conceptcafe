"use client";

import { motion, useScroll, useTransform } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { Eyebrow } from "@/components/ui/motion";
import { site } from "@/lib/site";

/** Tall iced latte glass – espresso, milk, ice and a straw. */
function IcedLatte({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 160 300" className={className} aria-hidden>
      <defs>
        <clipPath id="glass">
          <path d="M22 40 H138 L126 286 Q80 292 34 286 Z" />
        </clipPath>
        <linearGradient id="latte" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#f3e7d4" />
          <stop offset="0.35" stopColor="#e2c7a2" />
          <stop offset="0.6" stopColor="#a26a3c" />
          <stop offset="1" stopColor="#3d200e" />
        </linearGradient>
        <linearGradient id="glass-shine" x1="0" x2="1">
          <stop offset="0" stopColor="#fff" stopOpacity="0.35" />
          <stop offset="0.2" stopColor="#fff" stopOpacity="0.05" />
          <stop offset="0.85" stopColor="#fff" stopOpacity="0.02" />
          <stop offset="1" stopColor="#fff" stopOpacity="0.25" />
        </linearGradient>
      </defs>
      {/* straw */}
      <rect x="92" y="0" width="10" height="200" rx="5" fill="#d9a46c" transform="rotate(12 97 100)" />
      <g clipPath="url(#glass)">
        <rect x="0" y="70" width="160" height="230" fill="url(#latte)" />
        {/* swirl */}
        <path d="M30 150 C 60 130, 90 175, 130 150 C 100 185, 60 165, 30 190 Z" fill="#7a4520" opacity="0.55" />
        {/* ice cubes */}
        {[
          [36, 58, -12],
          [80, 64, 18],
          [52, 98, 8],
          [96, 104, -20],
        ].map(([x, y, r], i) => (
          <rect key={i} x={x} y={y} width="34" height="32" rx="6" fill="#fff" opacity="0.45" stroke="#fff" strokeOpacity="0.7" transform={`rotate(${r} ${x + 17} ${y + 16})`} />
        ))}
        <rect x="0" y="0" width="160" height="300" fill="url(#glass-shine)" />
      </g>
      {/* glass outline + rim */}
      <path d="M22 40 H138 L126 286 Q80 292 34 286 Z" fill="none" stroke="#fff" strokeOpacity="0.55" strokeWidth="2" />
      <ellipse cx="80" cy="40" rx="58" ry="6" fill="none" stroke="#fff" strokeOpacity="0.6" strokeWidth="2" />
    </svg>
  );
}

const TZ = "Asia/Ulaanbaatar";

function useUBTime() {
  const [now, setNow] = useState<{ h: number; m: number; s: number; weekend: boolean } | null>(null);
  useEffect(() => {
    const tick = () => {
      const p = Object.fromEntries(
        new Intl.DateTimeFormat("en-GB", {
          timeZone: TZ,
          weekday: "short",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hourCycle: "h23",
        })
          .formatToParts(new Date())
          .map((x) => [x.type, x.value]),
      );
      setNow({
        h: Number(p.hour),
        m: Number(p.minute),
        s: Number(p.second),
        weekend: p.weekday === "Sat" || p.weekday === "Sun",
      });
    };
    const id = setInterval(tick, 1000);
    const first = setTimeout(tick, 0);
    return () => {
      clearInterval(id);
      clearTimeout(first);
    };
  }, []);
  return now;
}

/** Opening hours as a clock face; the iced latte turns like a hand as you scroll. */
export function HoursClock() {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const rotate = useTransform(scrollYProgress, [0, 1], [-150, 210]);
  const now = useUBTime();

  // Open 08:00–22:00 weekdays, 10:00–22:00 weekend (matches site.hours)
  const isOpen = now ? now.h >= (now.weekend ? 10 : 8) && now.h < 22 : null;

  const hourAngle = now ? ((now.h % 12) + now.m / 60) * 30 : 0;
  const minuteAngle = now ? (now.m + now.s / 60) * 6 : 0;

  return (
    <section ref={ref} className="relative overflow-hidden py-24 sm:py-32" aria-label="Цагийн хуваарь">
      <div className="mx-auto grid max-w-[1400px] items-center gap-16 px-5 sm:px-8 lg:grid-cols-12 lg:px-10">
        <div className="order-2 lg:order-1 lg:col-span-5">
          <Eyebrow>Цагийн хуваарь · Hours</Eyebrow>
          <h2 className="mt-6 font-display text-6xl text-cream sm:text-8xl">
            Цаг <em>бүр</em>
            <br />
            кофены цаг
          </h2>

          <ul className="mt-10 border-t border-line">
            {site.hours.map((h) => (
              <li key={h.days} className="flex items-center justify-between border-b border-line py-5">
                <span className="font-mono text-xs tracking-widest text-cream-dim uppercase">{h.days}</span>
                <span className="font-display text-3xl text-cream tabular-nums">{h.time}</span>
              </li>
            ))}
          </ul>

          <p className="mt-6 flex items-center gap-3 font-mono text-xs tracking-widest text-cream-dim uppercase" aria-live="polite">
            {isOpen === null ? (
              <span>&nbsp;</span>
            ) : (
              <>
                <span className={`size-2 rounded-full ${isOpen ? "animate-pulse bg-success" : "bg-danger"}`} />
                {isOpen ? "Одоо нээлттэй" : "Одоо хаалттай"} · УБ{" "}
                {String(now!.h).padStart(2, "0")}:{String(now!.m).padStart(2, "0")}
              </>
            )}
          </p>
        </div>

        {/* Clock */}
        <div className="order-1 lg:order-2 lg:col-span-6 lg:col-start-7">
          <div className="relative mx-auto aspect-square w-full max-w-[560px] [container-type:inline-size]">
            <div className="brew-glow absolute inset-0 rounded-full border border-white/10" />
            {/* ticks */}
            {Array.from({ length: 60 }, (_, i) => (
              <span
                key={i}
                className="absolute top-1/2 left-1/2 origin-[0_0]"
                style={{ transform: `rotate(${i * 6}deg) translate(-50%, -46cqw)` }}
              >
                <span className={`block w-px ${i % 5 === 0 ? "h-4 bg-cream/70" : "h-2 bg-cream/25"}`} />
              </span>
            ))}
            {/* numerals */}
            {[12, 3, 6, 9].map((n, i) => (
              <span
                key={n}
                className="absolute font-display text-2xl text-cream/80 sm:text-3xl"
                style={{
                  left: `${50 + Math.sin((i * Math.PI) / 2) * 36}%`,
                  top: `${50 - Math.cos((i * Math.PI) / 2) * 36}%`,
                  transform: "translate(-50%, -50%)",
                }}
              >
                {n}
              </span>
            ))}
            {/* live hands */}
            {now && (
              <>
                <span className="absolute top-1/2 left-1/2 h-[24%] w-1 origin-bottom -translate-x-1/2 -translate-y-full rounded-full bg-cream/40" style={{ rotate: `${hourAngle}deg` }} />
                <span className="absolute top-1/2 left-1/2 h-[34%] w-0.5 origin-bottom -translate-x-1/2 -translate-y-full rounded-full bg-gold/70" style={{ rotate: `${minuteAngle}deg` }} />
              </>
            )}
            {/* the latte, turning with scroll */}
            <motion.div style={{ rotate }} className="absolute inset-0 flex items-center justify-center">
              <IcedLatte className="h-[62%] -translate-y-[6%] drop-shadow-[0_30px_40px_rgba(0,0,0,0.6)]" />
            </motion.div>
            <span className="absolute top-1/2 left-1/2 size-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-gold" />
          </div>
        </div>
      </div>
    </section>
  );
}
