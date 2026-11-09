/**
 * 44 Concept Café wordmark: big "44", then "concept" in script with a wide-tracked "CAFÉ" centred beneath it,
 * so the two words read as one balanced lockup.
 * `size` is the font size of "44" (and CAFÉ scales from it). `tone="dark"` for light backgrounds (printed QR cards).
 */
export function Logo({ size = "1.5rem", tone = "light", className = "" }: { size?: string; tone?: "light" | "dark"; className?: string }) {
  const main = tone === "light" ? "text-cream" : "text-[#120c08]";
  const accent = tone === "light" ? "text-gold-soft" : "text-[#8a5a22]";
  return (
    <span className={`inline-flex items-center gap-[0.22em] leading-none ${className}`} style={{ fontSize: size }}>
      <span className={`font-deco text-[1.15em] font-semibold tracking-[-0.06em] ${main}`}>44</span>
      <span className="flex flex-col items-center">
        <span className={`font-script text-[0.82em] leading-[0.8] ${accent}`}>concept</span>
        <span className={`mt-[0.08em] font-deco text-[0.42em] font-bold tracking-[0.42em] uppercase ${main}`} style={{ marginRight: "-0.42em" }}>
          Café
        </span>
      </span>
    </span>
  );
}
