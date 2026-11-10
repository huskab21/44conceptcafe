import { cacheLife } from "next/cache";
import Link from "next/link";
import { site } from "@/lib/site";
import { Logo, LogoMark } from "@/components/logo";

export function Footer() {
  return (
    <footer className="relative overflow-hidden border-t border-line bg-ink-2">
      {/* oversized mark as a quiet watermark */}
      <LogoMark className="pointer-events-none absolute -right-16 -bottom-24 h-[26rem] text-white/[0.03] sm:h-[34rem]" />
      <div className="relative mx-auto grid max-w-7xl gap-12 px-4 pt-20 pb-10 sm:px-6 md:grid-cols-12">
        <div className="relative md:col-span-5">
          <Logo size="3.5rem" withText className="mb-8" />
          <p className="font-display text-4xl leading-tight text-cream sm:text-5xl">
            Selling
            <br />
            <em className="text-gold">the vibe.</em>
          </p>
          <p className="mt-3 text-sm text-cream-dim">Нэг аяга кофе, нэг урлагийн мөч.</p>
          <a
            href={site.instagram}
            target="_blank"
            rel="noreferrer"
            className="mt-8 inline-flex items-center gap-3 rounded-full border border-line px-5 py-3 text-sm text-cream-dim transition-colors hover:border-gold hover:text-cream"
          >
            <InstagramIcon /> {site.instagramHandle}
          </a>
        </div>

        <div className="md:col-span-3 md:col-start-7">
          <h3 className="field-label">Цагийн хуваарь</h3>
          <ul className="space-y-2 text-sm">
            {site.hours.map((h) => (
              <li key={h.days} className="flex justify-between gap-6 text-cream-dim">
                <span>{h.days}</span>
                <span className="text-cream tabular-nums">{h.time}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="md:col-span-3">
          <h3 className="field-label">Холбоо барих</h3>
          <address className="space-y-2 text-sm text-cream-dim not-italic">
            <p>{site.address}</p>
            <p>
              <a href={`tel:${site.phone.replace(/\s/g, "")}`} className="text-cream hover:text-gold">
                {site.phone}
              </a>
            </p>
          </address>
          <nav className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-sm" aria-label="Footer">
            <Link href="/#menu" className="text-cream-dim hover:text-cream">Меню</Link>
            <Link href="/reserve" className="text-cream-dim hover:text-cream">Захиалга</Link>
            <Link href="/account" className="text-cream-dim hover:text-cream">Миний бүртгэл</Link>
          </nav>
        </div>
      </div>


      <div className="border-t border-line">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-6 text-xs text-muted sm:flex-row sm:justify-between sm:px-6">
          <p>© <Year /> {site.name}. Бүх эрх хуулиар хамгаалагдсан.</p>
          <p>Улаанбаатар, Монгол</p>
        </div>
      </div>
    </footer>
  );
}

function InstagramIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="1" fill="currentColor" />
    </svg>
  );
}

/** Current year, cached so the footer stays part of the static shell. */
async function Year() {
  "use cache";
  cacheLife("days");
  return <>{new Date().getFullYear()}</>;
}
