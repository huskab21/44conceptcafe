import { ArtWear } from "@/components/home/art-wear";
import { BeerShowcase } from "@/components/home/beer";
import { Gallery } from "@/components/home/gallery";
import { getGallery } from "@/lib/gallery-db";
import { getReceiptSettings } from "@/lib/settings-db";
import { Hero } from "@/components/home/hero";
import { HoursClock } from "@/components/home/hours-clock";
import { Marquee } from "@/components/home/marquee";
import { MenuSection } from "@/components/home/menu-section";
import { ReserveCta } from "@/components/home/reserve-cta";
import { ReviewDeal } from "@/components/home/review-deal";
import { Signature } from "@/components/home/signature";
import { Visit } from "@/components/home/visit";
import { getMenu } from "@/lib/menu";
import { getWear } from "@/lib/wear-db";

export default async function Home() {
  const [menu, wear, gallery, receipt] = await Promise.all([getMenu(), getWear(), getGallery(), getReceiptSettings()]);
  const signature = menu.filter((m) => m.is_signature);
  // Signature drinks first, then a curated pick from the rest of the menu for the horizontal showcase.
  const picks = ["Iced Latte", "Mocha Frappé", "V60 Pour Over", "Cappuccino", "44 Sundae", "Gelato · Double", "Butter Croissant", "Chocolate Cake"];
  const featured = [...signature, ...picks.map((en) => menu.find((m) => m.name_en === en && !m.is_signature)).filter((m) => m !== undefined)];

  return (
    <main>
      <Hero featured={signature[0]} />
      <Marquee />
      {featured.length > 0 && <Signature items={featured} />}
      <MenuSection items={menu} receipt={receipt} />
      <BeerShowcase />
      <HoursClock />
      {gallery.length > 0 && <Gallery images={gallery} />}
      {wear.length > 0 && <ArtWear items={wear} />}
      <ReviewDeal />
      <ReserveCta />
      <Visit />
    </main>
  );
}
