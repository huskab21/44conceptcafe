"use client";

import { motion, useMotionValue, useSpring } from "motion/react";
import { useEffect, useState } from "react";
import { useMediaQuery } from "@/lib/use-media-query";

/**
 * Custom cursor for mouse users. Grows over links/buttons; shows a label over
 * elements with `data-cursor="Text"`. Disabled on touch devices and reduced motion.
 */
export function Cursor() {
  const enabled = useMediaQuery("(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)");
  const [hover, setHover] = useState(false);
  const [label, setLabel] = useState<string | null>(null);
  const x = useMotionValue(-100);
  const y = useMotionValue(-100);
  const sx = useSpring(x, { stiffness: 500, damping: 40, mass: 0.5 });
  const sy = useSpring(y, { stiffness: 500, damping: 40, mass: 0.5 });

  useEffect(() => {
    if (!enabled) return;
    document.documentElement.classList.add("has-cursor");

    const move = (e: PointerEvent) => {
      x.set(e.clientX);
      y.set(e.clientY);
      const t = e.target as HTMLElement | null;
      const labelled = t?.closest<HTMLElement>("[data-cursor]");
      setLabel(labelled?.dataset.cursor ?? null);
      setHover(Boolean(t?.closest("a, button, [role=button], input, select, textarea, label")));
    };
    const leave = () => {
      x.set(-100);
      y.set(-100);
    };
    window.addEventListener("pointermove", move);
    document.addEventListener("pointerleave", leave);
    return () => {
      window.removeEventListener("pointermove", move);
      document.removeEventListener("pointerleave", leave);
      document.documentElement.classList.remove("has-cursor");
    };
  }, [enabled, x, y]);

  if (!enabled) return null;

  const size = label ? 96 : hover ? 48 : 12;

  return (
    <motion.div
      aria-hidden
      className={`pointer-events-none fixed top-0 left-0 z-[90] flex items-center justify-center rounded-full ${label ? "" : "mix-blend-difference"}`}
      style={{ x: sx, y: sy, translateX: "-50%", translateY: "-50%" }}
      animate={{ width: size, height: size, backgroundColor: label ? "#c9a35b" : "#f2e9d8" }}
      transition={{ type: "spring", stiffness: 300, damping: 26 }}
    >
      {label && (
        <span className="text-[0.62rem] font-semibold tracking-[0.2em] text-ink uppercase">{label}</span>
      )}
    </motion.div>
  );
}
