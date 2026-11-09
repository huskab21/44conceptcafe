"use client";

import { motion, useScroll, useTransform, type MotionValue } from "motion/react";
import { useRef } from "react";
import { Eyebrow, Reveal } from "@/components/ui/motion";

/**
 * "Toy Room" — the café as a designer-toy / streetwear hangout: coffee camo, die-cut stickers and
 * the house mascot "Cuppy 44" (an original vinyl-toy style cup character).
 */

function Cuppy({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 260 340" className={className} role="img" aria-label="44 Concept Café-ийн маскот Cuppy 44">
      <defs>
        <linearGradient id="cuppy-body" x1="0" x2="1">
          <stop offset="0" stopColor="#f6efe4" />
          <stop offset="0.7" stopColor="#e9dcc8" />
          <stop offset="1" stopColor="#cdb89b" />
        </linearGradient>
        <linearGradient id="cuppy-lid" x1="0" x2="1">
          <stop offset="0" stopColor="#6b4528" />
          <stop offset="1" stopColor="#3b2617" />
        </linearGradient>
        <pattern id="cuppy-camo" width="80" height="80" patternUnits="userSpaceOnUse">
          <rect width="80" height="80" fill="#5c3b22" />
          <path d="M-5 15c10-12 28-8 32 2s-6 20-18 20-24-10-14-22z" fill="#8a5a33" />
          <path d="M45 40c10-8 26-2 28 8s-10 18-22 16-16-16-6-24z" fill="#2a1a0f" />
          <path d="M30 62c6-4 15 0 15 6s-8 10-14 8-7-10-1-14z" fill="#c48a52" />
        </pattern>
      </defs>

      {/* shadow */}
      <ellipse cx="130" cy="326" rx="78" ry="10" fill="#000" opacity="0.35" />

      {/* legs + sneakers */}
      <rect x="92" y="262" width="26" height="40" rx="10" fill="#e9dcc8" />
      <rect x="142" y="262" width="26" height="40" rx="10" fill="#e9dcc8" />
      <path d="M78 300c0-10 10-14 26-14h20c6 0 8 6 8 12v8H84c-4 0-6-2-6-6z" fill="#120c08" />
      <path d="M128 300c0-10 10-14 26-14h20c6 0 8 6 8 12v8h-48c-4 0-6-2-6-6z" fill="#120c08" />
      <path d="M84 302h46M134 302h46" stroke="#d9a46c" strokeWidth="3" strokeLinecap="round" />

      {/* arms */}
      <path d="M58 170c-22 8-30 34-22 52" stroke="#e9dcc8" strokeWidth="20" fill="none" strokeLinecap="round" />
      <path d="M202 170c26 0 38 -18 36 -44" stroke="#e9dcc8" strokeWidth="20" fill="none" strokeLinecap="round" />
      {/* peace-sign hand */}
      <path d="M232 118l-6-26M242 120l4-26" stroke="#e9dcc8" strokeWidth="9" strokeLinecap="round" />
      <circle cx="238" cy="126" r="11" fill="#e9dcc8" />
      <circle cx="36" cy="226" r="12" fill="#e9dcc8" />

      {/* cup body */}
      <path d="M54 92h152l-16 178c-1 10-8 16-18 16H88c-10 0-17-6-18-16z" fill="url(#cuppy-body)" />
      {/* camo sleeve */}
      <path d="M62 170h136l-5 56H67z" fill="url(#cuppy-camo)" />
      <path d="M62 170h136M67 226h126" stroke="#120c08" strokeWidth="3" />
      {/* 44 patch */}
      <g transform="rotate(-6 130 198)">
        <rect x="104" y="180" width="52" height="36" rx="6" fill="#d9a46c" stroke="#120c08" strokeWidth="3" />
        <text x="130" y="207" textAnchor="middle" fontFamily="system-ui, sans-serif" fontWeight="900" fontSize="24" fill="#120c08">
          44
        </text>
      </g>

      {/* lid as a cap */}
      <path d="M40 92c0-20 20-30 40-30h100c20 0 40 10 40 30z" fill="url(#cuppy-lid)" />
      <rect x="34" y="88" width="192" height="14" rx="7" fill="#2a1a0f" />
      <rect x="112" y="40" width="36" height="26" rx="8" fill="#3b2617" />
      {/* steam */}
      <path d="M120 34c-8-10 8-14 0-26M140 34c-8-10 8-14 0-26" stroke="#f4ede3" strokeWidth="4" fill="none" strokeLinecap="round" opacity="0.6" />

      {/* face */}
      <circle cx="104" cy="132" r="17" fill="#120c08" />
      <circle cx="156" cy="132" r="17" fill="#120c08" />
      <circle cx="98" cy="125" r="6" fill="#fff" />
      <circle cx="150" cy="125" r="6" fill="#fff" />
      <circle cx="109" cy="139" r="2.5" fill="#fff" opacity="0.7" />
      <circle cx="161" cy="139" r="2.5" fill="#fff" opacity="0.7" />
      <ellipse cx="82" cy="156" rx="10" ry="6" fill="#d98c7a" opacity="0.55" />
      <ellipse cx="178" cy="156" rx="10" ry="6" fill="#d98c7a" opacity="0.55" />
      <path d="M114 156c8 9 24 9 32 0" stroke="#120c08" strokeWidth="4" fill="none" strokeLinecap="round" />
      <rect x="126" y="158" width="8" height="7" rx="1.5" fill="#fff" stroke="#120c08" strokeWidth="1.5" />

      {/* vinyl gloss */}
      <path d="M72 104c-2 30 0 70 6 104" stroke="#fff" strokeWidth="7" strokeLinecap="round" opacity="0.35" fill="none" />
    </svg>
  );
}

const stickers = [
  { text: "44 HYPE", className: "left-[4%] top-[8%] -rotate-12 bg-gold text-ink", depth: -60 },
  { text: "ONE OF ONE", className: "right-[6%] top-[4%] rotate-6 bg-cream text-ink", depth: -110 },
  { text: "★ BOARD GAMES ★", className: "left-[2%] bottom-[18%] rotate-6 bg-ink text-gold-soft", depth: -40 },
  { text: "COFFEE CLUB", className: "right-[3%] bottom-[10%] -rotate-6 bg-rose text-ink", depth: -90 },
];

const shelf = [
  { title: "Board games", body: "Олон төрлийн board game үнэгүй — кофе, пивоныхоо хажуугаар тоглоорой.", icon: "●" },
  { title: "Designer toys", body: "Тавиур дүүрэн art toy, vinyl figure — кофегоо уунгаа сонирхоорой.", icon: "◉" },
  { title: "Art furniture", body: "Гар будсан сандал, ширээ — нэг ч давтагдахгүй интерьер.", icon: "▲" },
  { title: "Street art", body: "Хана бүр graffiti, sticker, poster — зураг авахад бэлэн.", icon: "✦" },
];

export function ToyRoom() {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const lift = useTransform(scrollYProgress, [0, 1], [60, -60]);

  return (
    <section ref={ref} id="toy-room" aria-label="44 Toy Room" className="relative overflow-hidden py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="camo relative overflow-hidden rounded-[2.5rem] border-4 border-ink-3 shadow-[0_40px_80px_rgba(0,0,0,0.45)]">
          <div className="absolute inset-0 bg-gradient-to-br from-ink/70 via-ink/30 to-ink/80" aria-hidden />

          <div className="relative grid items-center gap-10 px-6 py-14 sm:px-12 lg:grid-cols-[1.1fr_1fr] lg:py-20">
            <div>
              <Eyebrow className="text-cream">44 Toy Room</Eyebrow>
              <Reveal>
                <h2 className="mt-5 font-display text-5xl leading-[0.95] text-cream sm:text-7xl">
                  Кофегоо уугаад
                  <br />
                  <em className="text-gold-soft">board game-ээ тоглоорой.</em>
                </h2>
              </Reveal>
              <Reveal delay={0.1}>
                <p className="mt-6 max-w-md text-base leading-relaxed text-cream/85">
                  44 бол зүгээр нэг кафе биш — board game, designer toy, street art-аар дүүрсэн бяцхан ертөнц. Найзуудаа дагуулаад ирээрэй, тоглоом нь бэлэн.
                </p>
              </Reveal>

              <ul className="mt-10 grid gap-3 sm:grid-cols-2">
                {shelf.map((s, i) => (
                  <motion.li
                    key={s.title}
                    initial={{ opacity: 0, y: 30, rotate: i % 2 ? 4 : -4 }}
                    whileInView={{ opacity: 1, y: 0, rotate: i % 2 ? 1.5 : -1.5 }}
                    whileHover={{ rotate: 0, scale: 1.03 }}
                    viewport={{ once: true }}
                    transition={{ type: "spring", stiffness: 200, damping: 18, delay: i * 0.08 }}
                    className="sticker rounded-2xl bg-ink/85 p-4 backdrop-blur-sm"
                  >
                    <p className="flex items-center gap-2 font-mono text-[0.7rem] font-bold tracking-[0.18em] text-gold uppercase">
                      <span aria-hidden>{s.icon}</span>
                      {s.title}
                    </p>
                    <p className="mt-2 text-sm leading-snug text-cream-dim">{s.body}</p>
                  </motion.li>
                ))}
              </ul>
            </div>

            <div className="relative mx-auto aspect-[4/5] w-full max-w-md">
              <div className="absolute inset-[12%] rounded-full bg-gold/25 blur-3xl" aria-hidden />
              {stickers.map((s) => (
                <Sticker key={s.text} progress={scrollYProgress} {...s} />
              ))}
              <motion.div style={{ y: lift }} className="relative h-full">
                <div className="animate-toy-bob h-full">
                  <Cuppy className="h-full w-full drop-shadow-[0_30px_40px_rgba(0,0,0,0.5)]" />
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Sticker({ text, className, depth, progress }: (typeof stickers)[number] & { progress: MotionValue<number> }) {
  const y = useTransform(progress, [0, 1], [-depth / 2, depth / 2]);
  return (
    <motion.span
      aria-hidden
      style={{ y }}
      className={`sticker absolute z-10 rounded-full px-4 py-2 font-mono text-[0.68rem] font-black tracking-[0.15em] whitespace-nowrap uppercase ${className}`}
    >
      {text}
    </motion.span>
  );
}
