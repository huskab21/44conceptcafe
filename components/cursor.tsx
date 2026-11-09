"use client";

import { useEffect, useRef, useState } from "react";
import { useMediaQuery } from "@/lib/use-media-query";

/**
 * Custom cursor for mouse users. Grows over links/buttons; shows a label over
 * elements with `data-cursor="Text"`. Disabled on touch devices and reduced motion.
 *
 * Position is written straight to the element's transform on every pointer event (no spring, no React render),
 * so it sits exactly under the pointer. React only re-renders when the hover state actually changes.
 */
export function Cursor() {
  const enabled = useMediaQuery("(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)");
  const ref = useRef<HTMLDivElement>(null);
  const [hover, setHover] = useState(false);
  const [label, setLabel] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled) return;
    document.documentElement.classList.add("has-cursor");
    let lastTarget: EventTarget | null = null;

    const move = (e: PointerEvent) => {
      const el = ref.current;
      if (el) el.style.transform = `translate3d(${e.clientX}px, ${e.clientY}px, 0) translate(-50%, -50%)`;
      if (e.target === lastTarget) return; // hover state only changes when the element under the pointer does
      lastTarget = e.target;
      const t = e.target as HTMLElement | null;
      const next = t?.closest<HTMLElement>("[data-cursor]")?.dataset.cursor ?? null;
      setLabel((l) => (l === next ? l : next));
      const h = Boolean(t?.closest("a, button, [role=button], input, select, textarea, label"));
      setHover((v) => (v === h ? v : h));
    };
    const leave = () => {
      if (ref.current) ref.current.style.transform = "translate3d(-100px, -100px, 0)";
      lastTarget = null;
    };
    window.addEventListener("pointermove", move, { passive: true });
    document.addEventListener("pointerleave", leave);
    return () => {
      window.removeEventListener("pointermove", move);
      document.removeEventListener("pointerleave", leave);
      document.documentElement.classList.remove("has-cursor");
    };
  }, [enabled]);

  if (!enabled) return null;

  const size = label ? 96 : hover ? 48 : 12;

  return (
    <div
      ref={ref}
      aria-hidden
      className={`pointer-events-none fixed top-0 left-0 z-[100] flex items-center justify-center rounded-full transition-[width,height,background-color] duration-150 ease-out will-change-transform ${label ? "bg-gold" : "bg-cream mix-blend-difference"}`}
      style={{ width: size, height: size, transform: "translate3d(-100px, -100px, 0)" }}
    >
      {label && <span className="text-[0.62rem] font-semibold tracking-[0.2em] text-ink uppercase">{label}</span>}
    </div>
  );
}
