import type { CSSProperties } from "react";

/**
 * 44 Concept Café mark: two "4"s, the second turned 180° and interlocked with the first.
 * The mark is point-symmetric, so it reads the same after a half turn (used by the intro animation).
 */

/** Outline of the upright "4" (the second one is the same path rotated 180° about MARK_CENTER). */
export const FOUR_PATH = "M355 82H450L255 500H407V333H491V500H538V580H491V667H407V580H162V500Z";
export const MARK_CENTER = { x: 566.5, y: 543.5 } as const;
export const MARK_VIEWBOX = "162 82 809 923";
export const MARK_FLIP = `rotate(180 ${MARK_CENTER.x} ${MARK_CENTER.y})`;

/** Just the mark, drawn in currentColor. Set its height via `className` (h-8) or `style`; width follows. */
export function LogoMark({ className = "", style, title }: { className?: string; style?: CSSProperties; title?: string }) {
  return (
    <svg
      viewBox={MARK_VIEWBOX}
      className={`w-auto ${className}`}
      style={style}
      fill="currentColor"
      role={title ? "img" : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
    >
      <path d={FOUR_PATH} />
      <path d={FOUR_PATH} transform={MARK_FLIP} />
    </svg>
  );
}

/**
 * Mark with an optional small "CONCEPT CAFÉ" label beside it.
 * `size` is the mark height. `tone="dark"` for light backgrounds (printed QR cards).
 */
export function Logo({
  size = "1.75rem",
  tone = "light",
  withText = false,
  className = "",
}: {
  size?: string;
  tone?: "light" | "dark";
  withText?: boolean;
  className?: string;
}) {
  const color = tone === "light" ? "text-cream" : "text-[#0a0a0a]";
  return (
    <span className={`inline-flex items-center gap-3 leading-none ${color} ${className}`}>
      <LogoMark className="block shrink-0" style={{ height: size }} title="44 Concept Café" />
      {withText && (
        <span className="flex flex-col gap-1 font-mono text-[0.6rem] font-bold tracking-[0.32em] uppercase">
          <span>Concept</span>
          <span>Café</span>
        </span>
      )}
    </span>
  );
}
