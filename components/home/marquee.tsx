const words = ["Espresso", "Gelato", "44 Hype", "Selling the vibe", "Art Wear", "Designer Toys", "Cold Brew", "Street Art", "44 Concept Café", "Meru Tower · 2 Floor"];

function Row({ reverse = false }: { reverse?: boolean }) {
  const items = [...words, ...words];
  return (
    <div aria-hidden className={`flex w-max shrink-0 ${reverse ? "animate-marquee-rev" : "animate-marquee"}`}>
      {items.map((w, i) => (
        <span key={i} className="flex items-center gap-8 px-4 font-display text-4xl whitespace-nowrap italic sm:text-6xl">
          {w}
          <span className="font-sans text-xl not-italic" aria-hidden>✦</span>
        </span>
      ))}
    </div>
  );
}

/** Two crossing marquee ribbons. Pure CSS animation. */
export function Marquee() {
  return (
    <section className="relative overflow-hidden py-16 sm:py-24" aria-label="44 Concept Café">
      <div className="-rotate-3 bg-gold py-4 text-ink sm:py-5">
        <Row />
      </div>
      <div className="camo mt-[-1.75rem] rotate-2 border-y-4 border-ink py-4 text-cream [text-shadow:2px_2px_0_#0a0a0a] sm:mt-[-2.5rem] sm:py-5">
        <Row reverse />
      </div>
    </section>
  );
}
