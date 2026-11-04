"use client";

import { useInView } from "motion/react";
import { useEffect, useRef, useState } from "react";

/**
 * Mono lines that type themselves in when scrolled into view.
 * The full text is laid out invisibly underneath so nothing shifts while typing.
 */
export function Typewriter({
  lines,
  className = "",
  speed = 28,
  delay = 0,
}: {
  lines: string[];
  className?: string;
  /** ms per character */
  speed?: number;
  /** ms before typing starts */
  delay?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-10% 0px" });
  const total = lines.reduce((n, l) => n + l.length, 0);
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!inView) return;
    let id = 0;
    const start = window.setTimeout(() => {
      id = window.setInterval(() => {
        setCount((c) => {
          if (c >= total) {
            window.clearInterval(id);
            return c;
          }
          return c + 1;
        });
      }, speed);
    }, delay);
    return () => {
      window.clearTimeout(start);
      window.clearInterval(id);
    };
  }, [inView, total, speed, delay]);

  // Characters typed before each line starts.
  const starts = lines.map((_, i) => lines.slice(0, i).reduce((n, l) => n + l.length, 0));
  return (
    <div ref={ref} className={`relative ${className}`} aria-label={lines.join(" ")}>
      <div className="invisible" aria-hidden>
        {lines.map((l, i) => (
          <p key={i}>{l || " "}</p>
        ))}
      </div>
      <div className="absolute inset-0" aria-hidden>
        {lines.map((l, i) => {
          const left = count - starts[i];
          const shown = l.slice(0, Math.max(0, left));
          const typing = left > 0 && left < l.length;
          return (
            <p key={i}>
              {shown || " "}
              {typing && <span className="ml-px inline-block h-[0.9em] w-[0.55em] translate-y-[0.1em] bg-current opacity-70" />}
            </p>
          );
        })}
      </div>
    </div>
  );
}
