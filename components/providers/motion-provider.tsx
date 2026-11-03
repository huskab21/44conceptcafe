"use client";

import { ReactLenis } from "lenis/react";
import { MotionConfig, useReducedMotion } from "motion/react";
import type { ReactNode } from "react";

/** Smooth scrolling (Lenis) + global motion settings. Both respect prefers-reduced-motion. */
export function MotionProvider({ children }: { children: ReactNode }) {
  const reduced = useReducedMotion();

  return (
    <MotionConfig reducedMotion="user" transition={{ ease: [0.22, 1, 0.36, 1] }}>
      <ReactLenis root options={{ lerp: reduced ? 1 : 0.09, smoothWheel: !reduced, autoRaf: true }}>
        {children}
      </ReactLenis>
    </MotionConfig>
  );
}
