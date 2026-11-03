import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Manrope, Unbounded } from "next/font/google";
import { Cursor } from "@/components/cursor";
import { Footer } from "@/components/footer";
import { Navbar } from "@/components/navbar";
import { Preloader } from "@/components/preloader";
import { AuthProvider } from "@/components/providers/auth-provider";
import { MotionProvider } from "@/components/providers/motion-provider";
import { site } from "@/lib/site";
import "./globals.css";

const manrope = Manrope({ variable: "--font-manrope", subsets: ["latin", "cyrillic"] });
const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin", "cyrillic"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
});
const unbounded = Unbounded({ variable: "--font-unbounded", subsets: ["latin", "cyrillic"], weight: ["400", "600"] });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: {
    default: `${site.name} — ${site.tagline}`,
    template: `%s · ${site.name}`,
  },
  description:
    "Улаанбаатар дахь Art Deco концепт кафе. Гараар бэлдсэн кофе, өдөр бүр шинэ желато, онлайн ширээ захиалга.",
  openGraph: {
    title: site.name,
    description: "Кофе · Желато · Art Deco — Улаанбаатар",
    images: ["/images/latte.webp"],
    locale: "mn_MN",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#0c0a08",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="mn" className={`${manrope.variable} ${cormorant.variable} ${unbounded.variable}`}>
      <body className="min-h-svh">
        <MotionProvider>
          <AuthProvider>
            <Preloader />
            <Navbar />
            {children}
            <Footer />
            <Cursor />
          </AuthProvider>
        </MotionProvider>
        <div className="grain" aria-hidden />
      </body>
    </html>
  );
}
