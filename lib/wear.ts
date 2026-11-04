// 44 Art Wear catalogue – one-of-one upcycled & hand-painted pieces (photos from the @44.hype "ART WEAR" highlight).
// Prices are the ones shown on the stories; the two jackets without a price use a 500,000₮ demo price.
// TODO: size / height / weight / gender are DEMO values – replace with the real measurements.
export type Gender = "Унисекс" | "Эрэгтэй" | "Эмэгтэй";

export type WearItem = {
  id: string;
  name: string;
  kind: string;
  price: number;
  image: string;
  w: number;
  h: number;
  sizes: string[];
  height: [number, number]; // cm
  weight: [number, number]; // kg
  gender: Gender;
};

export const wear: WearItem[] = [
  { id: "cobain", name: "Nevermind Denim", kind: "Гар зурагтай жинсэн хүрэм", price: 700000, image: "/images/wear/cobain-denim.webp", w: 633, h: 751, sizes: ["L"], height: [172, 188], weight: [62, 88], gender: "Унисекс" },
  { id: "chucky", name: "Chucky Hand-painted", kind: "Гар зурагтай хүрэм", price: 750000, image: "/images/wear/chucky-jacket.webp", w: 633, h: 700, sizes: ["XL"], height: [175, 192], weight: [70, 100], gender: "Эрэгтэй" },
  { id: "patchwork", name: "Patchwork Denim", kind: "Upcycle жинсэн хүрэм", price: 500000, image: "/images/wear/patchwork-denim.webp", w: 726, h: 672, sizes: ["L", "XL"], height: [170, 188], weight: [60, 90], gender: "Унисекс" },
  { id: "aztec", name: "Aztec Denim", kind: "Хээтэй жинсэн хүрэм", price: 500000, image: "/images/wear/aztec-denim.webp", w: 633, h: 669, sizes: ["M", "L"], height: [165, 182], weight: [55, 80], gender: "Унисекс" },
  { id: "vest", name: "Fringe Denim Vest", kind: "Upcycle хантааз", price: 350000, image: "/images/wear/patchwork-vest.webp", w: 520, h: 702, sizes: ["S", "M"], height: [158, 175], weight: [45, 65], gender: "Эмэгтэй" },
  { id: "hoodie", name: "Looney Patch Hoodie", kind: "Нөхөөстэй hoodie", price: 250000, image: "/images/wear/looney-hoodie.webp", w: 633, h: 606, sizes: ["M", "L", "XL"], height: [165, 190], weight: [55, 95], gender: "Унисекс" },
  { id: "skirt", name: "Denim Long Skirt", kind: "Урт жинсэн банзал", price: 400000, image: "/images/wear/denim-long-skirt.webp", w: 601, h: 750, sizes: ["S", "M"], height: [155, 175], weight: [45, 68], gender: "Эмэгтэй" },
  { id: "patches", name: "Patch Work Jacket", kind: "Шошготой хар хүрэм", price: 350000, image: "/images/wear/patch-jacket.webp", w: 633, h: 553, sizes: ["M", "L"], height: [165, 185], weight: [55, 85], gender: "Унисекс" },
  { id: "blazer", name: "Splatter Blazer", kind: "Будгаар цацсан пиджак", price: 400000, image: "/images/wear/splatter-blazer.webp", w: 593, h: 532, sizes: ["M"], height: [165, 182], weight: [55, 78], gender: "Унисекс" },
  { id: "jeans", name: "Patchwork Jeans", kind: "Upcycle жинсэн өмд", price: 400000, image: "/images/wear/patchwork-jeans.webp", w: 570, h: 759, sizes: ["30", "32"], height: [168, 185], weight: [58, 80], gender: "Эрэгтэй" },
  { id: "racing", name: "Racing Jacket", kind: "Хатгамалтай бомбер", price: 400000, image: "/images/wear/sponge-racing.webp", w: 633, h: 485, sizes: ["L", "XL"], height: [170, 190], weight: [65, 95], gender: "Унисекс" },
  { id: "tiger", name: "Tiger Shirt", kind: "Хээтэй цамц", price: 120000, image: "/images/wear/tiger-shirt.webp", w: 630, h: 900, sizes: ["M", "L", "XL"], height: [160, 188], weight: [50, 95], gender: "Унисекс" },
];

export const features = [
  { title: "Гараар зурсан", body: "Зураг, бичиг бүрийг\nуран бүтээлч гараар будсан.", icon: "brush" },
  { title: "Нэг л ширхэг", body: "Upcycle хийсэн бүтээл бүр\nдавтагдашгүй — one of one.", icon: "one" },
  { title: "Өмсөж үзээрэй", body: "Meru Tower, 2-р давхар —\n44-т ирж өмсөж үзээд аваарай.", icon: "hanger" },
] as const;
