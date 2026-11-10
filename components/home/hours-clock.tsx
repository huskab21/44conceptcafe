"use client";

import Image from "next/image";
import { motion, useMotionValue, useScroll, useSpring, useTransform } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { Typewriter } from "@/components/ui/typewriter";
import { LogoMark } from "@/components/logo";

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

/* Clock face geometry, in a 1000×1000 viewBox (R = 500). */
const C = 500;
const TICK_OUT = 473;
const TICK_IN_MAJOR = 430;
const TICK_IN_MINOR = 452;
const NUM_R = 355;

function polar(r: number, deg: number) {
  const a = ((deg - 90) * Math.PI) / 180;
  // Rounded so server and client render identical attributes (float trig can differ in the last digit).
  const round = (n: number) => Math.round(n * 100) / 100;
  return [round(C + r * Math.cos(a)), round(C + r * Math.sin(a))] as const;
}

function ClockFace() {
  return (
    <svg viewBox="0 0 1000 1000" className="absolute inset-0 h-full w-full" aria-hidden>
      <circle cx={C} cy={C} r={500} fill="#f6f6f4" />
      {Array.from({ length: 60 }, (_, i) => {
        const major = i % 5 === 0;
        const [x1, y1] = polar(TICK_OUT, i * 6);
        const [x2, y2] = polar(major ? TICK_IN_MAJOR : TICK_IN_MINOR, i * 6);
        return (
          <line
            key={i}
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
            stroke="#141414"
            strokeWidth={major ? 4.4 : 2.2}
            strokeLinecap="butt"
          />
        );
      })}
      {Array.from({ length: 12 }, (_, i) => {
        const n = i + 1;
        const [x, y] = polar(NUM_R, n * 30);
        return (
          <text
            key={n}
            x={x}
            y={y}
            textAnchor="middle"
            dominantBaseline="central"
            fill="#161616"
            fontSize={66}
            fontWeight={400}
            style={{ fontFamily: "var(--font-inter-tight), sans-serif", letterSpacing: "-0.02em" }}
          >
            {n}
          </text>
        );
      })}
    </svg>
  );
}

/** The straw doubles as the minute hand. Drawn pointing to 12 and rotated about the clock centre. */
function Straw() {
  return (
    <svg viewBox="0 0 1000 1000" className="absolute inset-0 h-full w-full" aria-hidden>
      <defs>
        <linearGradient id="straw" x1="0" x2="1">
          <stop offset="0" stopColor="#000" />
          <stop offset="0.35" stopColor="#2a2a2a" />
          <stop offset="0.55" stopColor="#0c0c0c" />
          <stop offset="1" stopColor="#000" />
        </linearGradient>
      </defs>
      <rect x={C - 11} y={C - 392} width={22} height={392} rx={4} fill="url(#straw)" />
      {/* cut tip */}
      <ellipse cx={C} cy={C - 392} rx={11} ry={3.5} fill="#3a3a3a" />
    </svg>
  );
}

/** Opening hours as a clock: the iced latte sits in the middle and its straw tells the time. */
export function HoursClock() {
  const ref = useRef<HTMLElement>(null);
  const now = useUBTime();

  // Open 08:00–22:00 weekdays, 10:00–22:00 weekend (matches site.hours)
  const isOpen = now ? now.h >= (now.weekend ? 10 : 8) && now.h < 22 : null;
  const minuteAngle = now ? (now.m + now.s / 60) * 6 : 0;

  // Scrolling sweeps the straw round; it settles on the real time mid-section.
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const sweep = useTransform(scrollYProgress, [0, 0.5, 1], [-300, 0, 300]);
  const sweepSmooth = useSpring(sweep, { stiffness: 70, damping: 20 });
  const minute = useMotionValue(0);
  useEffect(() => minute.set(minuteAngle), [minute, minuteAngle]);
  const straw = useTransform(() => sweepSmooth.get() + minute.get());
  const scriptX = useTransform(scrollYProgress, [0, 1], ["-6%", "6%"]);
  const cupY = useTransform(scrollYProgress, [0, 1], ["4%", "-4%"]);

  const clock = now ? `${String(now.h).padStart(2, "0")}:${String(now.m).padStart(2, "0")}` : "--:--";

  return (
    <section ref={ref} className="relative overflow-hidden bg-[#efefed] text-[#151515]" aria-label="Цагийн хуваарь ба байршил">
      {/* Giant script mark in the background */}
      <motion.span
        style={{ x: scriptX }}
        className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-[54%] -rotate-[8deg] font-script text-[78vw] leading-none whitespace-nowrap text-[#e4e3e0] select-none lg:text-[64vw]"
        aria-hidden
      >
        44
      </motion.span>

      <div className="relative mx-auto flex min-h-[100svh] max-w-[1600px] flex-col px-4 py-6 sm:px-5">
        {/* top-left label */}
        <p className="flex items-center gap-2 font-mono text-[13px] tracking-[0.02em] uppercase">
          <span className="size-[5px] rounded-full bg-gold" />
          Цагийн хуваарь
        </p>

        {/* Clock */}
        <div className="flex flex-1 items-center justify-center py-10 lg:py-4">
          <div className="relative aspect-square w-[min(92vw,80svh)] lg:w-[min(48vw,82svh)]">
            <ClockFace />
            <motion.div style={{ rotate: straw }} className="absolute inset-0">
              <Straw />
            </motion.div>
            <motion.div style={{ y: cupY }} className="absolute inset-0 flex items-center justify-center">
              <motion.div
                animate={{ y: ["-1%", "1%", "-1%"] }}
                transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                className="relative h-[50%] translate-y-[2%]"
              >
                <Image
                  src="/images/cutouts/iced-latte.webp"
                  alt="44 iced latte"
                  width={452}
                  height={833}
                  sizes="(min-width: 1024px) 24vw, 46vw"
                  className="h-full w-auto drop-shadow-[0_22px_18px_rgba(60,35,15,0.22)]"
                />
                {/* print on the glass */}
                <div className="pointer-events-none absolute inset-x-0 top-[44%] text-center mix-blend-multiply">
                  <LogoMark className="mx-auto h-[clamp(1.4rem,2.8vw,2.6rem)] text-[#1d140d]" />
                  <p className="mt-[0.5em] text-[clamp(0.4rem,0.62vw,0.62rem)] font-bold tracking-[0.18em] text-[#1d140d] uppercase">
                    Iced latte
                  </p>
                  <p className="mt-[0.4em] text-[clamp(0.35rem,0.5vw,0.5rem)] leading-tight text-[#1d140d]/80">
                    Зөөлөн. Хүчтэй.
                    <br />
                    Үргэлж зөв сонголт.
                  </p>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>

        {/* bottom-left: address + hours, typed */}
        <div className="grid gap-6 pb-4 font-mono text-[13px] leading-[1.45] tracking-[0.02em] uppercase sm:grid-cols-[auto_auto_1fr] sm:gap-14 lg:absolute lg:bottom-[13%] lg:left-5 lg:block lg:space-y-6 lg:pb-0">
          <Typewriter lines={["Meru Tower, 2-р давхар", "44 Concept Café"]} />
          <Typewriter lines={["Даваа – Баасан  08:00–22:00", "Бямба – Ням     10:00–22:00"]} delay={900} className="whitespace-pre" />
          <p className="flex items-center gap-2" aria-live="polite">
            <span
              className={`size-[5px] rounded-full ${isOpen === null ? "bg-[#151515]/30" : isOpen ? "animate-pulse bg-[#2f9e44]" : "bg-danger"}`}
            />
            {isOpen === null ? "УБ" : isOpen ? "Одоо нээлттэй" : "Одоо хаалттай"} · {clock}
          </p>
        </div>
      </div>
    </section>
  );
}
