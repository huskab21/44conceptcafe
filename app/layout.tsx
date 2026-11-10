import type { Metadata, Viewport } from "next";
import { Caveat, Inter_Tight, JetBrains_Mono, Manrope, Unbounded } from "next/font/google";
import { AuthProvider } from "@/components/providers/auth-provider";
import { MotionProvider } from "@/components/providers/motion-provider";
import { site } from "@/lib/site";
import "./globals.css";

const manrope = Manrope({ variable: "--font-manrope", subsets: ["latin", "cyrillic"] });
const interTight = Inter_Tight({ variable: "--font-inter-tight", subsets: ["latin", "cyrillic"], weight: ["500", "700", "800"] });
const mono = JetBrains_Mono({ variable: "--font-jetbrains", subsets: ["latin", "cyrillic"], weight: ["400", "500"] });
const caveat = Caveat({ variable: "--font-caveat", subsets: ["latin", "cyrillic"], weight: ["500", "700"] });
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
  themeColor: "#0a0a0a",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="mn" className={`${manrope.variable} ${interTight.variable} ${mono.variable} ${caveat.variable} ${unbounded.variable}`}>
      <body className="min-h-svh">
        <MotionProvider>
          <AuthProvider>
            {children}
          </AuthProvider>
        </MotionProvider>
        <div className="grain" aria-hidden />
      </body>
    </html>
  );
}
