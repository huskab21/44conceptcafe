"use client";

import Image from "next/image";
import { motion, useScroll, useTransform, type MotionValue } from "motion/react";
import { useRef } from "react";
import { Eyebrow, Reveal } from "@/components/ui/motion";

const statement =
  "44 бол зүгээр нэг кафе биш. Энэ бол Art Deco-гийн алтан шугам, шинэхэн шарсан кофены үнэр, гараар хийсэн желатогийн амт, урлагийн хувцас нийлсэн орон зай юм.";

function Word({ children, progress, range }: { children: string; progress: MotionValue<number>; range: [number, number] }) {
  const opacity = useTransform(progress, range, [0.15, 1]);
  return (
    <span className="relative mr-[0.25em] inline-block">
      <motion.span style={{ opacity }}>{children}</motion.span>
    </span>
  );
}

const stats = [
  { value: "44", label: "Онцгой жор" },
  { value: "18ц", label: "Cold brew исгэлт" },
  { value: "100%", label: "Өдөр бүр шинэ желато" },
];

export function About() {
  const textRef = useRef<HTMLParagraphElement>(null);
  const { scrollYProgress } = useScroll({ target: textRef, offset: ["start 85%", "end 45%"] });

  const imgRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress: imgProgress } = useScroll({ target: imgRef, offset: ["start end", "end start"] });
  const y1 = useTransform(imgProgress, [0, 1], ["10%", "-10%"]);
  const y2 = useTransform(imgProgress, [0, 1], ["-5%", "15%"]);

  const words = statement.split(" ");

  return (
    <section id="about" className="relative scroll-mt-24 py-24 sm:py-36">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <Eyebrow>Бидний тухай · About</Eyebrow>

        <p ref={textRef} className="mt-10 max-w-5xl font-display text-[2rem] leading-[1.15] text-cream sm:text-5xl lg:text-6xl">
          {words.map((w, i) => (
            <Word key={i} progress={scrollYProgress} range={[i / words.length, (i + 1) / words.length]}>
              {w}
            </Word>
          ))}
        </p>

        <div ref={imgRef} className="mt-20 grid gap-6 sm:mt-28 md:grid-cols-12">
          <motion.div style={{ y: y1 }} className="relative aspect-[4/5] overflow-hidden rounded-3xl md:col-span-5" data-cursor="Vibe">
            <Image src="/images/interior.webp" alt="Кафены дотор орчин" fill sizes="(min-width: 768px) 40vw, 100vw" className="object-cover transition-transform duration-[1.5s] hover:scale-105" />
          </motion.div>

          <div className="flex flex-col justify-between gap-10 md:col-span-6 md:col-start-7">
            <motion.div style={{ y: y2 }} className="relative aspect-[16/10] overflow-hidden rounded-3xl">
              <Image src="/images/pourover.webp" alt="Пур овер кофе бэлдэж буй нь" fill sizes="(min-width: 768px) 45vw, 100vw" className="object-cover" />
            </motion.div>

            <Reveal>
              <p className="max-w-md leading-relaxed text-cream-dim">
                Бид үр бүрийг анхааралтай сонгож, жижиг багцаар шарж, бариста бүр гараараа бэлддэг. Ажлын уулзалт,
                найзуудтайгаа өнгөрүүлэх орой, эсвэл ганцаараа ном уншиж суух — танд зориулсан ширээ үргэлж бий.
              </p>
            </Reveal>

            <dl className="grid grid-cols-3 gap-4 border-t border-line pt-8">
              {stats.map((s, i) => (
                <Reveal key={s.label} delay={i * 0.1}>
                  <dt className="font-deco text-3xl text-gold sm:text-4xl">{s.value}</dt>
                  <dd className="mt-2 text-xs leading-snug text-cream-dim sm:text-sm">{s.label}</dd>
                </Reveal>
              ))}
            </dl>
          </div>
        </div>
      </div>
    </section>
  );
}
