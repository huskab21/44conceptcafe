"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion, useMotionValueEvent, useScroll } from "motion/react";
import { useEffect, useState } from "react";
import { useLenis } from "lenis/react";
import { useAuth } from "@/components/providers/auth-provider";
import { Magnetic } from "@/components/ui/motion";
import { site } from "@/lib/site";

const links = [
  { href: "/#menu", label: "Меню" },
  { href: "/#about", label: "Бидний тухай" },
  { href: "/#gallery", label: "Галерей" },
  { href: "/#visit", label: "Байршил" },
];

export function Navbar() {
  const { user, loading } = useAuth();
  const pathname = usePathname();
  const { scrollY } = useScroll();
  const [hidden, setHidden] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useMotionValueEvent(scrollY, "change", (y) => {
    const prev = scrollY.getPrevious() ?? 0;
    setScrolled(y > 40);
    setHidden(y > prev && y > 300 && !open);
  });

  // Close the mobile menu on navigation (state adjusted during render, no effect needed)
  const [lastPath, setLastPath] = useState(pathname);
  if (lastPath !== pathname) {
    setLastPath(pathname);
    setOpen(false);
  }

  // Lock page scroll while the mobile menu is open
  const lenis = useLenis();
  useEffect(() => {
    if (!open) return;
    lenis?.stop();
    document.documentElement.style.overflow = "hidden";
    return () => {
      lenis?.start();
      document.documentElement.style.overflow = "";
    };
  }, [open, lenis]);

  return (
    <>
      <motion.header
        className="fixed inset-x-0 top-0 z-50"
        animate={{ y: hidden ? "-110%" : "0%" }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      >
        <div
          className={`mx-auto flex max-w-7xl items-center justify-between px-4 transition-all duration-500 sm:px-6 ${
            scrolled ? "mt-3 rounded-full border border-line/80 bg-ink/70 py-2.5 backdrop-blur-xl sm:mx-4 lg:mx-auto" : "py-5"
          }`}
        >
          <Link href="/" className="group flex items-center gap-2.5" aria-label={`${site.name} — нүүр`}>
            <span className="grid size-10 place-items-center rounded-full border border-gold/60 font-deco text-sm font-semibold text-gold transition-colors group-hover:bg-gold group-hover:text-ink">
              44
            </span>
            <span className="hidden text-[0.68rem] leading-tight tracking-[0.3em] text-cream-dim uppercase sm:block">
              Concept
              <br />
              Café
            </span>
          </Link>

          <nav className="hidden items-center gap-8 lg:flex" aria-label="Үндсэн цэс">
            {links.map((l) => (
              <Link key={l.href} href={l.href} className="group relative text-sm text-cream-dim transition-colors hover:text-cream">
                {l.label}
                <span className="absolute -bottom-1 left-0 h-px w-full origin-right scale-x-0 bg-gold transition-transform duration-500 group-hover:origin-left group-hover:scale-x-100" />
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2 sm:gap-3">
            {!loading && (
              <Link
                href={user ? "/account" : "/login"}
                className="hidden rounded-full px-4 py-2 text-sm text-cream-dim transition-colors hover:text-cream sm:block"
              >
                {user ? "Миний захиалга" : "Нэвтрэх"}
              </Link>
            )}
            <Magnetic>
              <Link
                href="/reserve"
                className="group relative inline-flex items-center gap-2 overflow-hidden rounded-full bg-gold px-4 py-2.5 text-sm font-semibold text-ink sm:px-5"
              >
                <span className="relative z-10">Ширээ захиалах</span>
                <span className="absolute inset-0 translate-y-full rounded-full bg-cream transition-transform duration-500 group-hover:translate-y-0" />
              </Link>
            </Magnetic>
            <button
              onClick={() => setOpen((o) => !o)}
              className="relative grid size-11 place-items-center rounded-full border border-line lg:hidden"
              aria-label={open ? "Цэс хаах" : "Цэс нээх"}
              aria-expanded={open}
            >
              <span className={`absolute h-px w-5 bg-cream transition-transform duration-300 ${open ? "rotate-45" : "-translate-y-1"}`} />
              <span className={`absolute h-px w-5 bg-cream transition-transform duration-300 ${open ? "-rotate-45" : "translate-y-1"}`} />
            </button>
          </div>
        </div>
      </motion.header>

      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed inset-0 z-40 flex flex-col bg-ink px-6 pt-28 pb-10 lg:hidden"
            initial={{ clipPath: "circle(0% at 100% 0%)" }}
            animate={{ clipPath: "circle(150% at 100% 0%)" }}
            exit={{ clipPath: "circle(0% at 100% 0%)" }}
            transition={{ duration: 0.7, ease: [0.76, 0, 0.24, 1] }}
          >
            <div className="deco-rays pointer-events-none absolute inset-x-0 bottom-0 h-1/2 opacity-60" aria-hidden />
            <nav className="relative flex flex-col gap-1" aria-label="Гар утасны цэс">
              {[...links, user ? { href: "/account", label: "Миний захиалга" } : { href: "/login", label: "Нэвтрэх" }].map(
                (l, i) => (
                  <motion.div
                    key={l.href}
                    initial={{ y: 60, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.15 + i * 0.07, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                  >
                    <Link
                      href={l.href}
                      onClick={() => setOpen(false)}
                      className="flex items-baseline gap-4 border-b border-line py-4 font-display text-4xl text-cream"
                    >
                      <span className="font-sans text-xs text-gold">0{i + 1}</span>
                      {l.label}
                    </Link>
                  </motion.div>
                ),
              )}
            </nav>
            <motion.div
              className="relative mt-auto flex items-end justify-between text-sm text-cream-dim"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
            >
              <div>
                <p>{site.hours[0].days}</p>
                <p className="text-cream">{site.hours[0].time}</p>
              </div>
              <a href={site.instagram} target="_blank" rel="noreferrer" className="text-gold">
                {site.instagramHandle}
              </a>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
