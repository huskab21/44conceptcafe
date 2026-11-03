import type { Metadata } from "next";
import { AuthShell } from "@/components/auth/auth-shell";
import { ReservationForm } from "@/components/reserve/reservation-form";
import { site } from "@/lib/site";

export const metadata: Metadata = { title: "Ширээ захиалах" };

export default function ReservePage() {
  return (
    <AuthShell
      image="/images/terrace.webp"
      imageAlt="44 кафены дэнж"
      quote={<>Таны дуртай ширээ <em className="text-gold">хүлээж байна.</em></>}
    >
      <p className="text-xs tracking-[0.35em] text-gold uppercase">Reservation</p>
      <h1 className="mt-3 mb-8 font-display text-5xl text-cream">Ширээ захиалах</h1>
      <ReservationForm />
      <p className="mt-6 text-center text-xs text-muted">
        Яаралтай бол: <a href={`tel:${site.phone.replace(/\s/g, "")}`} className="text-cream-dim hover:text-gold">{site.phone}</a>
      </p>
    </AuthShell>
  );
}
