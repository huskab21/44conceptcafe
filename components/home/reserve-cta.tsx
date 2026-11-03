"use client";

import Image from "next/image";
import Link from "next/link";
import { motion, useScroll, useTransform } from "motion/react";
import { useRef } from "react";
import { Magnetic, SplitText } from "@/components/ui/motion";

export function ReserveCta() {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "center center"] });
  const radius = useTransform(scrollYProgress, [0, 1], ["50%", "2rem"]);
  const scale = useTransform(scrollYProgress, [0, 1], [0.8, 1]);

  return (
    <section ref={ref} className="px-4 py-16 sm:px-6 sm:py-24">
      <motion.div
        style={{ borderRadius: radius, scale }}
        className="relative mx-auto max-w-7xl overflow-hidden"
      >
        <Image src="/images/lattes.webp" alt="" fill sizes="100vw" className="object-cover" />
        <div className="absolute inset-0 bg-ink/75" />
        

        <div className="relative flex flex-col items-center px-6 py-24 text-center sm:py-36">
          <p className="text-xs tracking-[0.4em] text-gold uppercase">Reservation</p>
          <h2 className="mt-6 max-w-3xl font-display text-5xl leading-[1.02] text-cream sm:text-7xl">
            <SplitText text="Таны ширээ" className="block" />
            <SplitText text="бэлэн байна." className="block italic text-gold" delay={0.15} />
          </h2>
          <p className="mt-6 max-w-md text-cream-dim">
            Бүртгүүлээд 30 секундэд ширээгээ захиалаарай. Бид баталгаажуулалтыг шууд мэдэгдэнэ.
          </p>
          <div className="mt-10">
            <Magnetic>
              <Link
                href="/reserve"
                className="group relative grid size-36 place-items-center overflow-hidden rounded-full bg-gold font-semibold text-ink sm:size-44"
              >
                <span className="relative z-10 text-center leading-tight">
                  Ширээ
                  <br />
                  захиалах →
                </span>
                <span className="absolute inset-0 scale-0 rounded-full bg-cream transition-transform duration-500 group-hover:scale-100" />
              </Link>
            </Magnetic>
          </div>
        </div>
      </motion.div>
    </section>
  );
}
