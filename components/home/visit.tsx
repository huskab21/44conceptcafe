import { Eyebrow, Reveal } from "@/components/ui/motion";
import { site } from "@/lib/site";

export function Visit() {
  return (
    <section id="visit" className="scroll-mt-20 py-24 sm:py-32">
      <div className="mx-auto grid max-w-7xl gap-12 px-4 sm:px-6 lg:grid-cols-12">
        <div className="lg:col-span-5">
          <Eyebrow>Visit us</Eyebrow>
          <Reveal>
            <h2 className="mt-5 font-display text-5xl text-cream sm:text-6xl">
              Бидэн дээр <em className="text-gold">ирээрэй</em>
            </h2>
          </Reveal>

          <Reveal delay={0.1}>
            <dl className="mt-10 space-y-8">
              <div>
                <dt className="field-label">Хаяг</dt>
                <dd className="text-lg text-cream">{site.address}</dd>
              </div>
              <div>
                <dt className="field-label">Цагийн хуваарь</dt>
                <dd>
                  {site.hours.map((h) => (
                    <p key={h.days} className="flex max-w-xs justify-between text-lg text-cream">
                      <span className="text-cream-dim">{h.days}</span>
                      <span className="tabular-nums">{h.time}</span>
                    </p>
                  ))}
                </dd>
              </div>
              <div>
                <dt className="field-label">Утас</dt>
                <dd>
                  <a href={`tel:${site.phone.replace(/\s/g, "")}`} className="text-lg text-cream hover:text-gold">
                    {site.phone}
                  </a>
                </dd>
              </div>
            </dl>
          </Reveal>

          <a
            href={site.mapsUrl}
            target="_blank"
            rel="noreferrer"
            className="mt-10 inline-flex items-center gap-2 rounded-full border border-line px-6 py-3 text-cream transition-colors hover:border-gold"
          >
            Google Maps-д нээх ↗
          </a>
        </div>

        <Reveal className="lg:col-span-7" delay={0.15}>
          <div className="deco-frame relative h-[420px] overflow-hidden rounded-3xl border border-line sm:h-[520px]">
            <iframe
              title="44 Concept Café байршил"
              src={site.mapsEmbed}
              className="absolute inset-0 size-full [filter:grayscale(1)_invert(0.92)_contrast(0.9)_sepia(0.25)]"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
        </Reveal>
      </div>
    </section>
  );
}
