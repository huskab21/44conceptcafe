"use client";

import { useInView } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";

const GLYPHS = "ABCDEFGHJKLMNPQRSTUVWXYZ0123456789#%&*@$<>=+";

/**
 * Text that decodes from random glyphs into the real string – on first view and again on hover.
 * Renders the real text on the server so markup is stable and readable without JS.
 */
export function ScrambleText({
  text,
  className = "",
  duration = 900,
  delay = 0,
  hover = true,
}: {
  text: string;
  className?: string;
  duration?: number;
  delay?: number;
  hover?: boolean;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-10% 0px" });
  const [out, setOut] = useState(text);
  const raf = useRef(0);

  const run = useCallback(() => {
    cancelAnimationFrame(raf.current);
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const revealed = Math.floor(t * text.length);
      setOut(
        text
          .split("")
          .map((ch, i) => (i < revealed || ch === " " || ch === "\n" ? ch : GLYPHS[Math.floor(Math.random() * GLYPHS.length)]))
          .join(""),
      );
      if (t < 1) raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
  }, [text, duration]);

  useEffect(() => {
    if (!inView) return;
    const id = window.setTimeout(run, delay);
    return () => window.clearTimeout(id);
  }, [inView, run, delay]);

  useEffect(() => () => cancelAnimationFrame(raf.current), []);

  return (
    <span ref={ref} className={`whitespace-pre-line ${className}`} aria-label={text} onPointerEnter={hover ? run : undefined}>
      <span aria-hidden>{out}</span>
    </span>
  );
}
