"use client";

import Image from "next/image";
import Link from "next/link";
import { motion, useScroll, useSpring, useTransform } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { Typewriter } from "@/components/ui/typewriter";
import { site } from "@/lib/site";

const ink = "#161616";

/** Wide receipt barcode – clustered bars with the odd gap. Built once, deterministic for SSR. */
const BARS = (() => {
  let seed = 44;
  const rand = () => {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };
  const bars: { x: number; w: number }[] = [];
  let x = 0;
  while (x < 200) {
    const w = 0.5 + Math.floor(rand() * 4) * 0.55;
    if (x + w <= 200) bars.push({ x, w });
    x += w + (rand() < 0.08 ? 3.4 : 0.55 + Math.floor(rand() * 3) * 0.45);
  }
  return bars;
})();

function ReceiptBarcode() {
  return (
    <svg viewBox="0 0 200 30" preserveAspectRatio="none" className="block h-[3.4em] w-full" aria-hidden>
      {BARS.map((b, i) => (
        <rect key={i} x={b.x} y={0} width={b.w} height={30} fill={ink} />
      ))}
    </svg>
  );
}

function Dashes() {
  return <div className="h-px w-full bg-[repeating-linear-gradient(90deg,#3a3a3a_0_5px,transparent_5px_9px)]" />;
}

function useOrderStamp() {
  const [stamp, setStamp] = useState({ date: "--/--/----", time: "--:--" });
  useEffect(() => {
    const fmt = () => {
      const p = Object.fromEntries(
        new Intl.DateTimeFormat("en-GB", {
          timeZone: "Asia/Ulaanbaatar",
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
          hourCycle: "h23",
        })
          .formatToParts(new Date())
          .map((x) => [x.type, x.value]),
      );
      setStamp({ date: `${p.day}/${p.month}/${p.year}`, time: `${p.hour}:${p.minute}` });
    };
    const first = setTimeout(fmt, 0);
    const id = setInterval(fmt, 30_000);
    return () => {
      clearTimeout(first);
      clearInterval(id);
    };
  }, []);
  return stamp;
}

/** Thermal receipt with the product printed inside. Sized in em so everything scales with the paper. */
function Receipt() {
  const { date, time } = useOrderStamp();
  return (
    <div className="receipt-edge relative bg-[#f1f0ec] px-[1.75em] pb-[2.4em] text-[clamp(9px,0.72vw,12px)] leading-[1.75] tracking-[0.06em] text-[#1f1f1f] uppercase shadow-[0_30px_60px_rgba(0,0,0,0.45)] [--tooth:0.85em]">
      {/* product */}
      <div className="relative -mx-[1.75em] flex h-[17em] flex-col items-center justify-end overflow-hidden pb-[1.2em]">
        <p className="mb-[0.3em] font-deco text-[3em] leading-none font-semibold tracking-[-0.06em] text-[#161616] normal-case">
          44<span className="ml-[0.2em] align-top font-script text-[0.45em] font-bold tracking-normal">concept</span>
        </p>
        <Image
          src="/images/cutouts/matcha.webp"
          alt="Matcha latte"
          width={900}
          height={607}
          sizes="(min-width: 1024px) 26vw, 80vw"
          className="w-[64%] drop-shadow-[0_14px_14px_rgba(0,0,0,0.22)]"
        />
      </div>

      <Dashes />
      <div className="mt-[1.3em] flex justify-between gap-4">
        <p>
          Сайн кофе.
          <br />
          Таны өдрийн төлөө.
        </p>
        <p className="text-right tabular-nums">
          Захиалга #00044
          <br />
          {date}
          <br />
          {time}
        </p>
      </div>
      <p className="mt-[1.6em] mb-[1.4em]">
        44-ийг сонгосонд баярлалаа.
        <br />
        Дахин уулзъя!
      </p>

      <Dashes />
      <div className="mt-[1.3em] flex items-stretch gap-[1.2em]">
        <p className="flex-1 font-display text-[1.5em] leading-[1.2] font-extrabold tracking-[-0.01em] normal-case">
          ДАРААЛАЛГҮЙ.
          <br />
          ШИРЭЭГЭЭ ЗАХИАЛ.
        </p>
        <span className="w-px bg-[#1f1f1f]/70" />
        <div className="flex w-[13.5em] flex-col justify-between gap-[0.8em]">
          <p className="text-[0.82em] leading-[1.6]">
            Цагаа хэмнэ.
            <br />
            Ирэхэд ширээ бэлэн.
          </p>
          <Link
            href="/reserve"
            className="group flex items-center justify-between bg-[#111] px-[1em] py-[0.7em] text-[0.82em] font-bold tracking-[0.12em] text-white transition-colors hover:bg-[#3a2416]"
            data-cursor="Захиалах"
          >
            Захиалах
            <span className="transition-transform group-hover:translate-x-1">→</span>
          </Link>
        </div>
      </div>

      <div className="mt-[1.4em]">
        <ReceiptBarcode />
      </div>
      <p className="mt-[1.1em] text-center text-[0.78em] tracking-[0.25em]">{site.instagramHandle}</p>
    </div>
  );
}

/** Reservation CTA: a receipt prints down over a dark coffee table as you scroll in. */
export function ReserveCta() {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end end"] });
  const print = useSpring(useTransform(scrollYProgress, [0.15, 0.85], ["-62%", "0%"]), { stiffness: 80, damping: 22 });
  const bgScale = useTransform(scrollYProgress, [0, 1], [1.15, 1]);

  return (
    <section ref={ref} className="relative min-h-[100svh] overflow-hidden bg-ink lg:min-h-[54rem]" aria-label="Ширээ захиалах">
      {/* dark coffee table */}
      <motion.div style={{ scale: bgScale }} className="absolute inset-0">
        <Image src="/images/receipt-bg.webp" alt="" fill sizes="100vw" className="object-cover" />
      </motion.div>
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_30%,rgba(0,0,0,0.45))]" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 bg-linear-to-t from-black/70 to-transparent" />

      {/* receipt hanging from the top edge */}
      <motion.div
        style={{ y: print }}
        className="relative z-10 mx-auto w-[min(88vw,26rem)] lg:w-[clamp(22rem,24vw,28rem)]"
      >
        <Receipt />
      </motion.div>

      {/* bottom copy */}
      <div className="relative z-10 mx-auto mt-14 grid max-w-[1600px] gap-10 px-4 pb-14 sm:px-5 lg:absolute lg:inset-x-0 lg:bottom-0 lg:mt-0 lg:grid-cols-2 lg:items-end lg:pb-12">
        <Typewriter
          lines={["Бид кофегоо", "хариуцъя. Та", "өдрөө хариуц."]}
          className="font-mono text-[clamp(15px,1.25vw,22px)] leading-[1.15] tracking-[0.02em] text-white uppercase"
          speed={45}
        />
        <div className="max-w-[26rem] lg:justify-self-end lg:pr-[3vw]">
          <p className="font-display text-[clamp(16px,1.15vw,20px)] leading-[1.24] font-extrabold tracking-[-0.025em] text-white uppercase">
            Бид ганц хуваариар ажилладаг: таных. Ширээгээ урьдчилж захиалбал таныг ирэхэд суудал бэлэн,
            кофе тань шууд гарч эхэлнэ. Хүлээлгүй, яаралгүй — яг таны цагт.
          </p>
          <Link
            href="/reserve"
            className="group mt-10 inline-flex items-center gap-3 border-b-2 border-white pb-1 font-display text-[clamp(16px,1.15vw,20px)] font-extrabold tracking-[-0.01em] text-white uppercase"
          >
            Одоо захиалах
            <span className="transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5">↗</span>
          </Link>
        </div>
      </div>
    </section>
  );
}
