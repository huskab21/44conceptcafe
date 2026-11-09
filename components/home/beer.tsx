"use client";

import Image from "next/image";
import Link from "next/link";
import { animate, useInView } from "motion/react";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import type { BottleId, BottleScene } from "@/components/home/bottle-3d";

/* ───────────── Beer showcase ─────────────
 * A real 3D bottle (three.js lathe built from the product photo) leans toward the cursor over a warm
 * roasted-amber glow that melts into the site's dark background. A few wheat ears drift with parallax and
 * dodge the pointer; bubbles rise. Picking the other beer shifts the glow, spins the bottle 720° with motion
 * blur (swapping at the peak) and pulls the wheat into the bottle before scattering it again.
 */

const BEERS: Record<BottleId, { name: string; spec: string; img: string; w: number; h: number; inner: string; mid: string }> = {
  sapporo: { name: "Sapporo Premium", spec: "330ml · 5.0%", img: "/images/beer/sapporo.webp", w: 227, h: 879, inner: "#7a4b19", mid: "#2e1b0c" },
  kirin: { name: "Kirin Ichiban", spec: "650ml · 5.0%", img: "/images/beer/kirin.webp", w: 142, h: 540, inner: "#73301a", mid: "#2d130b" },
  corona: { name: "Corona Extra", spec: "330ml · 4.5%", img: "/images/beer/corona.webp", w: 120, h: 472, inner: "#86621b", mid: "#31220b" },
  heineken: { name: "Heineken", spec: "330ml · 5.0%", img: "/images/beer/heineken.webp", w: 231, h: 900, inner: "#3b5622", mid: "#15200d" },
};
const ORDER: BottleId[] = ["sapporo", "kirin", "corona", "heineken"];
const INK = "#120c08";

/* Just a little wheat: [top %, left %, size px, opacity, layer]. */
const WHEAT: { top: number; left: number; size: number; opacity: number; layer: "fg" | "bg" }[] = [
  { top: 22, left: 33, size: 120, opacity: 0.9, layer: "fg" },
  { top: 66, left: 61, size: 96, opacity: 0.85, layer: "fg" },
  { top: 14, left: 58, size: 64, opacity: 0.45, layer: "bg" },
  { top: 72, left: 38, size: 70, opacity: 0.4, layer: "bg" },
  { top: 44, left: 72, size: 56, opacity: 0.35, layer: "bg" },
];
const FLOAT_DUR = [5, 7, 6, 8, 5.5];

function Wheat() {
  const grains = Array.from({ length: 9 }, (_, i) => ({ y: 18 + i * 7.2, side: i % 2 ? 1 : -1 }));
  return (
    <svg viewBox="0 0 100 100" className="h-full w-full" aria-hidden>
      <defs>
        <linearGradient id="wheat-g" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0" stopColor="#f6e2b3" />
          <stop offset="0.5" stopColor="#d9a46c" />
          <stop offset="1" stopColor="#8a5a22" />
        </linearGradient>
      </defs>
      <path d="M50 96 C 49 70, 51 40, 50 12" stroke="#a87b3e" strokeWidth="2.2" fill="none" strokeLinecap="round" />
      {grains.map((g, i) => (
        <g key={i} transform={`translate(${50 + g.side * 6} ${g.y}) rotate(${g.side * 28})`}>
          <line x1="0" y1="-6" x2={g.side * 4} y2="-22" stroke="#e2c08a" strokeOpacity="0.8" strokeWidth="0.7" />
          <ellipse cx="0" cy="0" rx="5" ry="7.8" fill="url(#wheat-g)" stroke="#7a4d18" strokeOpacity="0.45" strokeWidth="0.6" />
        </g>
      ))}
      <ellipse cx="50" cy="12" rx="4" ry="6.5" fill="url(#wheat-g)" />
    </svg>
  );
}

/** "Buy 2, get 1" sticker: a gold stamp with a slowly turning ring of text. */
function PromoStamp() {
  const ring = "2 АВБАЛ 1 БЭЛЭГ · BUY 2 GET 1 FREE · ";
  return (
    <div className="group absolute top-24 right-4 z-[115] size-[118px] sm:size-[150px] lg:top-auto lg:right-auto lg:bottom-[13%] lg:left-[calc(50%+90px)]">
      <div className="absolute inset-0 animate-[spin_18s_linear_infinite] group-hover:[animation-duration:5s]">
        <svg viewBox="0 0 200 200" className="h-full w-full" aria-hidden>
          <defs>
            <path id="promo-ring" d="M100,100 m-78,0 a78,78 0 1,1 156,0 a78,78 0 1,1 -156,0" />
          </defs>
          <circle cx="100" cy="100" r="98" fill="#d9a46c" />
          <circle cx="100" cy="100" r="62" fill="none" stroke="#120c08" strokeOpacity="0.35" strokeDasharray="2 5" />
          <text fill="#120c08" fontSize="15.5" fontWeight="500" letterSpacing="2.6" style={{ fontFamily: "var(--font-jetbrains), monospace" }}>
            <textPath href="#promo-ring">{ring}</textPath>
          </text>
        </svg>
      </div>
      <div className="absolute inset-[22%] flex -rotate-12 flex-col items-center justify-center rounded-full bg-ink text-center shadow-[inset_0_0_0_2px_rgba(217,164,108,0.5)] transition-transform duration-500 [transition-timing-function:cubic-bezier(0.34,1.56,0.64,1)] group-hover:scale-110 group-hover:rotate-0">
        <span className="font-display text-[1.9rem] leading-none text-gold sm:text-[2.4rem]">2+1</span>
        <span className="mt-1 font-mono text-[0.5rem] tracking-[0.18em] text-cream uppercase sm:text-[0.56rem]">Бүх пиво</span>
      </div>
      <span className="sr-only">Урамшуулал: 2 пиво авбал 1 пиво бэлэг.</span>
    </div>
  );
}

type FloatState = { angle: number; baseX: number; baseY: number; rx: number; ry: number; sx: number; sy: number; rot: number; scale: number; opacity: number };

export function BeerShowcase() {
  const section = useRef<HTMLElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const canvasWrap = useRef<HTMLDivElement>(null);
  const fgLayer = useRef<HTMLDivElement>(null);
  const bgLayer = useRef<HTMLDivElement>(null);
  const bubbles = useRef<HTMLDivElement>(null);
  const wheatEls = useRef<(HTMLDivElement | null)[]>([]);
  const wheat = useRef<FloatState[]>(WHEAT.map(() => ({ angle: 0, baseX: 0, baseY: 0, rx: 0, ry: 0, sx: 0, sy: 0, rot: 0, scale: 1, opacity: 1 })));
  const switching = useRef(false);
  const spin = useRef({ val: 0, blur: 0 });
  const mouse = useRef({ x: 0, y: 0, px: -9999, py: -9999 });
  const current = useRef({ x: 0, y: 0 });
  const bottle = useRef<BottleScene | null>(null);

  const [beer, setBeer] = useState<BottleId>("sapporo");
  const [ready, setReady] = useState(false);
  const inView = useInView(section, { margin: "10% 0px" });

  // three.js scene – loaded lazily so it stays out of the main bundle.
  useEffect(() => {
    let disposed = false;
    let ro: ResizeObserver | null = null;
    import("@/components/home/bottle-3d").then(({ createBottleScene }) => {
      if (disposed || !canvas.current) return;
      const b = createBottleScene(canvas.current);
      b.preload(ORDER);
      b.setBottle("sapporo");
      b.resize();
      ro = new ResizeObserver(() => b.resize());
      ro.observe(canvas.current);
      bottle.current = b;
      setReady(true);
    });
    return () => {
      disposed = true;
      ro?.disconnect();
      bottle.current?.dispose();
      bottle.current = null;
    };
  }, []);

  useEffect(() => {
    wheat.current.forEach((s) => (s.angle = Math.random() * 360));
    const el = section.current;
    if (!el) return;
    const move = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      mouse.current.x = (e.clientX - r.left) / r.width - 0.5;
      mouse.current.y = (e.clientY - r.top) / r.height - 0.5;
      mouse.current.px = e.clientX;
      mouse.current.py = e.clientY;
    };
    el.addEventListener("pointermove", move);
    return () => el.removeEventListener("pointermove", move);
  }, []);

  // Per frame: bottle turn, parallax, wheat repulsion + float.
  useEffect(() => {
    if (!inView) return;
    let raf = 0;
    const loop = () => {
      const time = Date.now() * 0.001;
      const m = mouse.current;
      const c = current.current;
      c.x += (m.x - c.x) * 0.05;
      c.y += (m.y - c.y) * 0.05;

      bottle.current?.render(c.x * 40 + spin.current.val, c.y * 20);
      if (canvasWrap.current) canvasWrap.current.style.filter = spin.current.blur > 0.05 ? `blur(${spin.current.blur}px)` : "none";
      if (fgLayer.current) fgLayer.current.style.transform = `translate(${c.x * 60}px, ${c.y * 60}px)`;
      if (bgLayer.current) bgLayer.current.style.transform = `translate(${c.x * -30}px, ${c.y * -30}px)`;

      wheatEls.current.forEach((el, i) => {
        if (!el) return;
        const s = wheat.current[i];
        const base = WHEAT[i].opacity;
        if (switching.current) {
          el.style.transform = `translate(${s.sx}px, ${s.sy}px) rotate(${s.rot}deg) scale(${s.scale})`;
          el.style.opacity = String(s.opacity * base);
          return;
        }
        const r = el.getBoundingClientRect();
        const dx = m.px - (r.left + r.width / 2);
        const dy = m.py - (r.top + r.height / 2);
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        let tx = 0;
        let ty = 0;
        let speed = 1;
        if (dist < 400) {
          const force = (400 - dist) / 400;
          tx = (dx / dist) * force * -80;
          ty = (dy / dist) * force * -80;
          speed = 1 + force * 5;
        }
        s.rx += (tx - s.rx) * 0.1;
        s.ry += (ty - s.ry) * 0.1;
        s.angle += 0.12 * speed;
        const phase = (time + i * 0.7) * ((Math.PI * 2) / FLOAT_DUR[i % FLOAT_DUR.length]);
        el.style.transform = `translate(${s.rx + s.baseX}px, ${s.ry + s.baseY + Math.sin(phase) * 15}px) rotate(${s.angle + Math.cos(phase) * 6}deg)`;
        el.style.opacity = String(base);
      });
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [inView]);

  // A few bubbles.
  useEffect(() => {
    if (!inView || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const box = bubbles.current;
    if (!box) return;
    const id = window.setInterval(() => {
      const b = document.createElement("span");
      const size = Math.random() * 14 + 6;
      const duration = Math.random() * 6 + 5;
      Object.assign(b.style, {
        position: "absolute",
        left: `${30 + Math.random() * 40}%`,
        bottom: "-40px",
        width: `${size}px`,
        height: `${size}px`,
        borderRadius: "50%",
        border: "1px solid rgba(246,226,179,0.35)",
        background: "radial-gradient(circle at 32% 30%, rgba(255,240,210,0.8) 0 8%, rgba(255,240,210,0.08) 30%, transparent 70%)",
        animation: `beer-bubble ${duration}s linear forwards`,
      });
      b.style.setProperty("--o", String(Math.random() * 0.3 + 0.15));
      box.appendChild(b);
      window.setTimeout(() => b.remove(), duration * 1000);
    }, 650);
    return () => window.clearInterval(id);
  }, [inView]);

  function choose(next: BottleId) {
    if (switching.current || next === beer) return;
    switching.current = true;
    setBeer(next);

    const s = spin.current;
    animate(s, { val: 360, blur: 15 }, { duration: 0.6, ease: "easeIn" }).then(() => {
      bottle.current?.setBottle(next);
      animate(s, { val: 720, blur: 0 }, { duration: 1.5, ease: [0.34, 1.36, 0.64, 1] }).then(() => {
        s.val = 0;
        s.blur = 0;
      });
    });

    let done = 0;
    wheatEls.current.forEach((el, i) => {
      if (!el) return;
      const st = wheat.current[i];
      const layer = el.parentElement!;
      const cx = layer.clientWidth / 2 - el.offsetLeft - el.offsetWidth / 2;
      const cy = layer.clientHeight / 2 - el.offsetTop - el.offsetHeight / 2;
      const startAngle = st.angle;
      const nextX = (Math.random() - 0.5) * 200;
      const nextY = (Math.random() - 0.5) * 200;
      Object.assign(st, { sx: st.baseX + st.rx, sy: st.baseY + st.ry, rot: startAngle, scale: 1, opacity: 1 });
      animate(st, { sx: cx, sy: cy, rot: startAngle + 45, scale: 0.1, opacity: 0 }, { duration: 0.5, ease: "easeIn" })
        .then(() => new Promise((r) => setTimeout(r, 300)))
        .then(() => animate(st, { sx: nextX, sy: nextY, rot: startAngle + 90, scale: 1, opacity: 1 }, { duration: 0.9, ease: [0.34, 1.7, 0.64, 1] }))
        .then(() => {
          Object.assign(st, { angle: startAngle + 90, baseX: nextX, baseY: nextY, rx: 0, ry: 0 });
          if (++done === WHEAT.length) switching.current = false;
        });
    });
  }

  const step = (dir: 1 | -1) => choose(ORDER[(ORDER.indexOf(beer) + dir + ORDER.length) % ORDER.length]);
  const theme = BEERS[beer];

  const wheatNodes = (layer: "fg" | "bg") =>
    WHEAT.map((w, i) =>
      w.layer === layer ? (
        <div
          key={i}
          ref={(el) => {
            wheatEls.current[i] = el;
          }}
          className="absolute drop-shadow-[0_10px_20px_rgba(0,0,0,0.35)]"
          style={{ top: `${w.top}%`, left: `${w.left}%`, width: w.size, height: w.size, opacity: w.opacity }}
        >
          <Wheat />
        </div>
      ) : null,
    );

  return (
    <section
      ref={section}
      id="beer"
      aria-label="Пиво"
      className="relative h-[100svh] min-h-[720px] overflow-hidden text-cream"
      style={
        {
          "--beer-inner": theme.inner,
          "--beer-mid": theme.mid,
          "--beer-outer": INK,
          background: "radial-gradient(ellipse 60% 70% at 50% 50%, var(--beer-inner) 0%, var(--beer-mid) 48%, var(--beer-outer) 100%)",
          transition: "--beer-inner 1.5s cubic-bezier(0.4,0,0.2,1), --beer-mid 1.5s cubic-bezier(0.4,0,0.2,1)",
        } as CSSProperties
      }
    >
      {/* melt into the neighbouring sections */}
      <div className="pointer-events-none absolute inset-x-0 top-0 z-[2] h-40 bg-linear-to-b from-ink to-transparent" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-[2] h-40 bg-linear-to-t from-ink to-transparent" />

      <div ref={bubbles} className="pointer-events-none absolute inset-0 z-0 overflow-hidden" aria-hidden />

      <div className="relative mx-auto h-full max-w-[1400px] px-5 pt-20 sm:px-8 lg:px-10">
        <div className="relative flex h-full items-stretch justify-between">
          {/* left */}
          <div className="relative z-[100] flex h-full flex-col gap-8 py-24">
            <p className="font-mono text-[0.68rem] tracking-[0.25em] text-gold uppercase">{"// Пиво · Beer"}</p>
            <h2 className="font-display text-[clamp(4rem,8vw,8.5rem)] text-cream">
              Импорт
              <br />
              <em>лагер</em>
            </h2>
            <p className="max-w-[24rem] text-sm leading-relaxed font-bold tracking-tight text-cream uppercase">
              Кофены дараах орой бүрт — <span className="text-cream-dim">хүйтэн, тунгалаг, шинэхэн импорт пиво 44-т.</span>
            </p>
            <Link
              href="/reserve"
              className="flex w-fit items-center gap-6 rounded-full border border-white/10 bg-black/40 py-1.5 pr-1.5 pl-6 text-sm font-bold tracking-wide uppercase transition-all duration-300 hover:-translate-y-[3px] hover:bg-black/60"
            >
              Ширээ захиалах
              <span className="flex size-[38px] items-center justify-center rounded-full bg-gold pb-0.5 text-[1.4rem] leading-none font-black text-ink">+</span>
            </Link>
            <div className="mt-auto flex items-center gap-4">
              <div className="flex size-12 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-gold">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden>
                  <path d="M12 15L15 18L19 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M7 10L12 15L17 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <div className="flex flex-col font-mono uppercase">
                <span className="text-[0.62rem] tracking-[0.2em] text-cream-dim">Japan · Mexico · Holland</span>
                <span className="text-[0.75rem] tracking-[0.1em] text-cream">Premium lager · N°44</span>
              </div>
            </div>
          </div>

          <div ref={bgLayer} className="pointer-events-none absolute inset-0 z-0" aria-hidden>
            {wheatNodes("bg")}
          </div>

          {/* 3D bottle */}
          <div
            className="pointer-events-none absolute inset-0 z-[1] transition-opacity duration-[1500ms]"
            style={{ opacity: ready && inView ? 1 : 0, animation: "beer-float 6s ease-in-out infinite" }}
          >
            <div className="absolute top-1/2 left-1/2 size-[62%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(217,164,108,0.18),transparent_65%)]" />
            <div ref={canvasWrap} className="absolute inset-0">
              <canvas ref={canvas} className="h-full w-full" aria-label={BEERS[beer].name} />
            </div>
          </div>

          <div ref={fgLayer} className="pointer-events-none absolute inset-0 z-[110]" aria-hidden>
            {wheatNodes("fg")}
          </div>

          {/* right */}
          <div className="pointer-events-none relative z-[100] hidden h-full w-[460px] flex-col items-end justify-between py-24 text-right lg:flex">
            <div className="pointer-events-auto flex flex-col items-end gap-6">
              <div className="flex gap-3">
                {ORDER.map((id) => {
                  const b = BEERS[id];
                  const active = beer === id;
                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => choose(id)}
                      aria-pressed={active}
                      className={`group relative flex w-[104px] flex-col items-center gap-5 rounded-[24px] border p-3 pt-16 text-center backdrop-blur-[10px] transition-all duration-[400ms] [transition-timing-function:cubic-bezier(0.175,0.885,0.32,1.275)] hover:border-white/40 hover:bg-white/[0.08] ${
                        active ? "border-gold bg-white/[0.04]" : "border-white/10 bg-white/[0.03]"
                      }`}
                    >
                      <Image
                        src={b.img}
                        alt=""
                        width={b.w}
                        height={b.h}
                        sizes="60px"
                        className="pointer-events-none -mt-28 h-[128px] w-auto drop-shadow-[0_20px_35px_rgba(0,0,0,0.5)] transition-transform duration-500 [transition-timing-function:cubic-bezier(0.34,1.56,0.64,1)] group-hover:-translate-y-[30px] group-hover:scale-[1.15] group-hover:-rotate-12"
                        style={{ filter: active ? undefined : "brightness(0.7)" }}
                      />
                      <span className="absolute -top-2.5 -right-2.5 grid size-8 rotate-12 place-items-center rounded-full bg-gold font-mono text-[0.6rem] font-bold text-ink shadow-[0_6px_14px_rgba(0,0,0,0.4)] transition-transform duration-500 group-hover:rotate-[372deg]">
                        2+1
                      </span>
                      <span className="flex w-full flex-col font-mono text-[0.58rem] tracking-wide uppercase">
                        <span className="text-cream">{b.name}</span>
                        <span className="text-cream-dim">{b.spec}</span>
                      </span>
                    </button>
                  );
                })}
              </div>
              <div className="flex gap-3">
                {([-1, 1] as const).map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => step(d)}
                    aria-label={d < 0 ? "Өмнөх" : "Дараах"}
                    className="flex size-9 items-center justify-center rounded-full border border-white/10 bg-white/5 transition-colors hover:border-gold hover:text-gold"
                  >
                    {d < 0 ? "←" : "→"}
                  </button>
                ))}
              </div>
            </div>
            <p className="font-display text-[clamp(4rem,8vw,8.5rem)] text-cream" aria-hidden>
              Ice
              <br />
              <em>cold</em>
            </p>
          </div>
        </div>
      </div>

      <PromoStamp />

      {/* mobile switcher */}
      <div className="absolute inset-x-0 bottom-8 z-[120] flex flex-wrap justify-center gap-2 px-4 lg:hidden">
        {ORDER.map((id) => (
          <button
            key={id}
            type="button"
            onClick={() => choose(id)}
            className={`rounded-full border px-4 py-2 font-mono text-[0.65rem] tracking-widest uppercase backdrop-blur-md ${beer === id ? "border-gold text-cream" : "border-white/20 text-cream-dim"}`}
          >
            {BEERS[id].name}
          </button>
        ))}
      </div>
    </section>
  );
}
