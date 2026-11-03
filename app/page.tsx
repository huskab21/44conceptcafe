import { About } from "@/components/home/about";
import { Gallery } from "@/components/home/gallery";
import { Hero } from "@/components/home/hero";
import { Marquee } from "@/components/home/marquee";
import { MenuSection } from "@/components/home/menu-section";
import { ReserveCta } from "@/components/home/reserve-cta";
import { Signature } from "@/components/home/signature";
import { Visit } from "@/components/home/visit";
import { getMenu } from "@/lib/menu";

export default async function Home() {
  const menu = await getMenu();
  const signature = menu.filter((m) => m.is_signature);

  return (
    <main>
      <Hero />
      <Marquee />
      <About />
      {signature.length > 0 && <Signature items={signature} />}
      <MenuSection items={menu} />
      <Gallery />
      <ReserveCta />
      <Visit />
    </main>
  );
}
