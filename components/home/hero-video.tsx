"use client";

import { useLenis } from "lenis/react";
import type { MotionValue } from "motion/react";
import { useEffect, useRef, useState } from "react";

export const HERO_CLIPS = [
  { src: "/videos/hero-1.mp4", poster: "/videos/hero-1.jpg", label: "Iced" },
  { src: "/videos/hero-2.mp4", poster: "/videos/hero-2.jpg", label: "Latte" },
  { src: "/videos/hero-3.mp4", poster: "/videos/hero-3.jpg", label: "Pour" },
];

const MAX_RATE = 4; // fastest playback while scrolling hard
const VELOCITY_GAIN = 0.12; // how strongly scroll speed maps to playback speed
const EASE = 0.08; // how quickly the rate follows the scroll (and settles back to 1×)

type Props = {
  /** Progress (0–1) of the clip that is playing, updated every frame. */
  progress?: MotionValue<number>;
  /** Current playback rate, updated every frame. */
  speed?: MotionValue<number>;
  /** Called when the active clip changes. */
  onIndexChange?: (index: number) => void;
  /** Jump to a clip from outside (e.g. the progress bars). */
  requestIndex?: { index: number } | null;
};

/**
 * Full-bleed background that plays the hero clips one after another with a crossfade.
 * Plays at normal speed when idle; scrolling the page speeds the footage up.
 */
export function HeroVideo({ progress, speed, onIndexChange, requestIndex }: Props) {
  const videos = useRef<(HTMLVideoElement | null)[]>([]);
  const wrap = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const activeRef = useRef(0);
  const velocity = useRef(0);
  const rate = useRef(1);
  const visible = useRef(true);

  // Lenis reports smoothed scroll velocity (px/frame) on every scroll tick.
  useLenis((lenis) => {
    velocity.current = Math.abs(lenis.velocity);
  });

  const play = (i: number) => {
    const v = videos.current[i];
    if (!v || !visible.current) return;
    v.playbackRate = rate.current;
    v.play().catch(() => {});
  };

  const goTo = (i: number) => {
    const prev = activeRef.current;
    if (i === prev) return;
    const next = videos.current[i];
    if (next) next.currentTime = 0;
    activeRef.current = i;
    setActive(i);
    onIndexChange?.(i);
    play(i);
    // Let the outgoing clip finish its fade before rewinding it.
    window.setTimeout(() => {
      const old = videos.current[prev];
      if (old && activeRef.current !== prev) {
        old.pause();
        old.currentTime = 0;
      }
    }, 1200);
  };

  useEffect(() => {
    if (requestIndex) goTo(requestIndex.index);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requestIndex]);

  // Pause when the hero is off screen.
  useEffect(() => {
    const el = wrap.current;
    if (!el) return;
    const io = new IntersectionObserver(([entry]) => {
      visible.current = entry.isIntersecting;
      const v = videos.current[activeRef.current];
      if (!v) return;
      if (entry.isIntersecting) play(activeRef.current);
      else v.pause();
    });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // Per-frame: ease the playback rate toward the scroll speed and report progress.
  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let raf = 0;
    const loop = () => {
      const target = reduced ? 1 : Math.min(MAX_RATE, 1 + velocity.current * VELOCITY_GAIN);
      rate.current += (target - rate.current) * EASE;
      if (Math.abs(rate.current - 1) < 0.01) rate.current = 1;
      velocity.current *= 0.9; // decays when Lenis stops reporting

      const v = videos.current[activeRef.current];
      if (v) {
        if (Math.abs(v.playbackRate - rate.current) > 0.02) v.playbackRate = rate.current;
        progress?.set(v.duration ? v.currentTime / v.duration : 0);
        speed?.set(rate.current);
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [progress, speed]);

  return (
    <div ref={wrap} className="absolute inset-0 overflow-hidden bg-ink" aria-hidden>
      {HERO_CLIPS.map((clip, i) => (
        <video
          key={clip.src}
          ref={(el) => {
            videos.current[i] = el;
          }}
          src={clip.src}
          poster={clip.poster}
          muted
          playsInline
          autoPlay={i === 0}
          preload="auto"
          onEnded={() => goTo((i + 1) % HERO_CLIPS.length)}
          className="absolute inset-0 h-full w-full object-cover object-[72%_50%] transition-opacity md:object-center duration-[1200ms] ease-out"
          style={{ opacity: i === active ? 1 : 0 }}
        />
      ))}
    </div>
  );
}
