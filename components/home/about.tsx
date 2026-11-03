"use client";

import { motion, useScroll, useTransform, type MotionValue } from "motion/react";
import { useRef } from "react";
import { CupMockup } from "@/components/home/mockups";
import { Eyebrow, Reveal } from "@/components/ui/motion";

/** A single roasted coffee bean. */
function Bean({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 56" className={className} aria-hidden>
      <defs>
        <radialGradient id="bean" cx="35%" cy="30%" r="80%">
          <stop offset="0" stopColor="#8a5530" />
          <stop offset="0.55" stopColor="#4b2a15" />
          <stop offset="1" stopColor="#24130a" />
        </radialGradient>
      </defs>
      <ellipse cx="20" cy="28" rx="18" ry="26" fill="url(#bean)" />
      <path d="M20 4 C 12 18, 28 36, 20 52" stroke="#1a0d06" strokeWidth="3" fill="none" strokeLinecap="round" />
      <ellipse cx="13" cy="16" rx="4" ry="8" fill="#fff" opacity="0.08" />
    </svg>
  );
}

// Deterministic layout so server and client render identically.
const beans = [
  { x: 8, y: 12, s: 46, r: 20, d: 7, depth: 0.6 },
  { x: 22, y: 68, s: 34, r: -40, d: 9, depth: 0.3 },
  { x: 38, y: 6, s: 26, r: 70, d: 8, depth: 0.2 },
  { x: 74, y: 10, s: 54, r: -15, d: 10, depth: 0.8 },
  { x: 88, y: 42, s: 30, r: 110, d: 7.5, depth: 0.35 },
  { x: 80, y: 78, s: 44, r: 35, d: 9.5, depth: 0.7 },
  { x: 54, y: 88, s: 24, r: -80, d: 8.5, depth: 0.25 },
  { x: 4, y: 44, s: 28, r: 140, d: 11, depth: 0.4 },
  { x: 60, y: 30, s: 20, r: 10, d: 6.5, depth: 0.15 },
  { x: 30, y: 36, s: 18, r: -120, d: 7, depth: 0.1 },
  { x: 94, y: 16, s: 22, r: 60, d: 9, depth: 0.2 },
  { x: 16, y: 90, s: 38, r: -10, d: 10.5, depth: 0.55 },
];

function FloatingBean({ b, progress }: { b: (typeof beans)[number]; progress: MotionValue<number> }) {
  const y = useTransform(progress, [0, 1], [`${b.depth * 160}px`, `${-b.depth * 160}px`]);
  return (
    <motion.div
      className="absolute"
      style={{ left: `${b.x}%`, top: `${b.y}%`, width: b.s, y, filter: b.depth < 0.25 ? "blur(1.5px)" : undefined }}
    >
      <motion.div
        animate={{ y: [0, -18, 0], rotate: [b.r, b.r + 25, b.r] }}
        transition={{ duration: b.d, repeat: Infinity, ease: "easeInOut" }}
      >
        <Bean className="w-full drop-shadow-[0_12px_18px_rgba(0,0,0,0.5)]" />
      </motion.div>
    </motion.div>
  );
}

const stats = [
  { value: "18ц", label: "Cold brew исгэлт" },
  { value: "250г", label: "Жижиг багц шаралт" },
  { value: "100%", label: "Өдөр бүр шинэ желато" },
];

export function About() {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const cupRotate = useTransform(scrollYProgress, [0, 1], [-24, -6]);
  const cupY = useTransform(scrollYProgress, [0, 1], ["12%", "-12%"]);

  return (
    <section id="about" ref={ref} className="relative scroll-mt-20 overflow-hidden py-24 sm:py-32">
      <div className="mx-auto grid max-w-[1400px] items-center gap-16 px-5 sm:px-8 lg:grid-cols-12 lg:px-10">
        <div className="lg:col-span-5">
          <Eyebrow>Бидний тухай · About</Eyebrow>
          <Reveal>
            <h2 className="mt-6 font-display text-6xl text-cream sm:text-7xl xl:text-8xl">
              Жингүй
              <br />
              <em>хөнгөн</em> өглөө
            </h2>
          </Reveal>
          <Reveal delay={0.1}>
            <p className="mt-8 max-w-md text-sm leading-relaxed font-bold tracking-tight text-cream uppercase">
              44 бол зүгээр нэг кафе биш. Шинэхэн шарсан үр, гараар хийсэн желато, урлагийн хувцас нэг дор уулзсан
              орон зай.
            </p>
            <p className="mt-5 max-w-md text-cream-dim">
              Ажлын уулзалт, найзуудтайгаа өнгөрүүлэх орой, эсвэл ганцаараа ном уншиж суух — танд зориулсан ширээ
              үргэлж бий.
            </p>
          </Reveal>

          <dl className="mt-12 grid grid-cols-3 gap-4 border-t border-line pt-8">
            {stats.map((s, i) => (
              <Reveal key={s.label} delay={0.15 + i * 0.08}>
                <dt className="font-display text-3xl text-cream sm:text-4xl">{s.value}</dt>
                <dd className="mt-2 font-mono text-[0.65rem] leading-snug tracking-wide text-cream-dim uppercase">{s.label}</dd>
              </Reveal>
            ))}
          </dl>
        </div>

        <div className="relative h-[70vh] min-h-[420px] lg:col-span-7">
          <div className="brew-glow absolute inset-[10%] rounded-full blur-2xl" aria-hidden />
          {beans.map((b, i) => (
            <FloatingBean key={i} b={b} progress={scrollYProgress} />
          ))}
          <motion.div
            style={{ rotate: cupRotate, y: cupY }}
            className="absolute top-1/2 left-1/2 w-[46%] max-w-[300px] -translate-x-1/2 -translate-y-1/2"
          >
            <motion.div animate={{ y: [0, -12, 0] }} transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}>
              <CupMockup className="w-full drop-shadow-[0_50px_70px_rgba(0,0,0,0.65)]" />
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
