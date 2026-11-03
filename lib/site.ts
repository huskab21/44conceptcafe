// Business info used across the site. Update here when details change.
export const site = {
  name: "44 Concept Café",
  shortName: "44",
  tagline: "Кофе · Желато · Art Deco",
  instagram: "https://www.instagram.com/44.hype/",
  instagramHandle: "@44.hype",
  address: "Жамъянгүний гудамж 18/1, СБД 1-р хороо, Улаанбаатар",
  mapsUrl: "https://maps.app.goo.gl/pk18Yr8ha83U7hoU6",
  mapsEmbed:
    "https://www.google.com/maps?q=44+Concept+Cafe,+Jamyan+gun+street+18/1,+Ulaanbaatar&output=embed",
  phone: "+976 9944 4444", // TODO: replace with the real number
  hours: [
    { days: "Даваа – Баасан", time: "08:00 – 22:00" },
    { days: "Бямба – Ням", time: "10:00 – 22:00" },
  ],
} as const;

// Reservation rules
export const reservation = {
  openHour: 10,
  closeHour: 21, // last seating starts at 21:00
  slotMinutes: 30,
  maxGuests: 10,
  maxDaysAhead: 30,
} as const;

export function timeSlots(): string[] {
  const slots: string[] = [];
  const first = reservation.openHour * 60;
  const last = reservation.closeHour * 60;
  for (let t = first; t <= last; t += reservation.slotMinutes) {
    slots.push(`${String(Math.floor(t / 60)).padStart(2, "0")}:${String(t % 60).padStart(2, "0")}`);
  }
  return slots;
}

export function formatPrice(mnt: number): string {
  return `₮${mnt.toLocaleString("en-US")}`;
}
