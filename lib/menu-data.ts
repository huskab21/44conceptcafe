// Menu types + fallback seed data.
// When Supabase is connected, the live menu comes from the `menu_items` table
// (see supabase/schema.sql – it seeds the same items). Prices are in MNT.
// NOTE: Names and prices below are placeholders until the café confirms its real menu.

/** Category id (e.g. "hot"). Categories are edited on /admin/menu and stored in Supabase `menu_categories`. */
export type MenuCategory = string;

export type Category = { id: MenuCategory; label: string; en: string; sort_order: number };

export type MenuItem = {
  id: string;
  category: MenuCategory;
  name: string;
  name_en: string;
  description: string;
  price: number;
  image: string;
  is_signature: boolean;
  is_available: boolean;
  sort_order: number;
};

/** Built-in categories, used until supabase/menu-categories.sql is run (or if Supabase is unreachable). */
export const fallbackCategories: Category[] = [
  { id: "signature", label: "Онцлох", en: "Signature", sort_order: 10 },
  { id: "hot", label: "Халуун кофе", en: "Hot Coffee", sort_order: 20 },
  { id: "cold", label: "Хүйтэн", en: "Iced", sort_order: 30 },
  { id: "gelato", label: "Желато", en: "Gelato", sort_order: 40 },
  { id: "dessert", label: "Амттан", en: "Dessert", sort_order: 50 },
  { id: "beer", label: "Пиво", en: "Beer", sort_order: 60 },
];

type Seed = Omit<MenuItem, "id" | "is_available" | "sort_order" | "is_signature"> & {
  is_signature?: boolean;
};

const seed: Seed[] = [
  // Signature
  { category: "signature", name: "44 Signature", name_en: "44 Signature Latte", description: "Давсалсан карамель, ванилийн крем, давхар эспрессо", price: 13900, image: "/images/flat-white.webp", is_signature: true },
  { category: "signature", name: "Матча латте", name_en: "Ceremonial Matcha", description: "Японы церемониал матча, овъёосны сүү", price: 11900, image: "/images/matcha.webp", is_signature: true },
  { category: "signature", name: "Аффогато", name_en: "Affogato", description: "Ванилийн желато дээр халуун эспрессо", price: 12500, image: "/images/sundae.webp", is_signature: true },
  { category: "signature", name: "Deco Cold Brew", name_en: "Deco Cold Brew", description: "18 цаг исгэсэн, жүржийн хальстай", price: 11500, image: "/images/iced-americano.webp", is_signature: true },

  // Hot
  { category: "hot", name: "Эспрессо", name_en: "Espresso", description: "Давхар шот, шоколад ба самрын амт", price: 6500, image: "/images/espresso.webp" },
  { category: "hot", name: "Американо", name_en: "Americano", description: "Эспрессо + халуун ус", price: 7500, image: "/images/americano.webp" },
  { category: "hot", name: "Капучино", name_en: "Cappuccino", description: "Өтгөн хөөстэй сонгодог", price: 9500, image: "/images/cappuccino.webp" },
  { category: "hot", name: "Латте", name_en: "Caffè Latte", description: "Зөөлөн, сүүтэй", price: 9900, image: "/images/latte.webp" },
  { category: "hot", name: "Флэт уайт", name_en: "Flat White", description: "Нимгэн микрофоам, хүчтэй амт", price: 9900, image: "/images/lattes.webp" },
  { category: "hot", name: "V60 Пур овер", name_en: "V60 Pour Over", description: "Улирлын single-origin үр", price: 12500, image: "/images/pourover.webp" },

  // Cold
  { category: "cold", name: "Айс американо", name_en: "Iced Americano", description: "Сэрүүн, цэвэр амт", price: 8500, image: "/images/black-coffee.webp" },
  { category: "cold", name: "Айс латте", name_en: "Iced Latte", description: "Мөстэй, зөөлөн сүүтэй", price: 10500, image: "/images/iced-latte.webp" },
  { category: "cold", name: "Мокко фраппе", name_en: "Mocha Frappé", description: "Шоколад, эспрессо, цөцгий", price: 12900, image: "/images/frappe.webp" },

  // Gelato
  { category: "gelato", name: "Желато · 1 бөмбөг", name_en: "Gelato · Single", description: "Өдөр бүр шинээр хийсэн", price: 6900, image: "/images/gelato.webp" },
  { category: "gelato", name: "Желато · 2 бөмбөг", name_en: "Gelato · Double", description: "Дуртай хоёр амтаа хослуул", price: 11900, image: "/images/gelato.webp" },
  { category: "gelato", name: "44 Санде", name_en: "44 Sundae", description: "Желато, брауни, шоколадан соус", price: 14900, image: "/images/sundae.webp" },

  // Dessert
  { category: "dessert", name: "Цөцгийн тосон круассан", name_en: "Butter Croissant", description: "Франц аргаар, өдөр бүр шинэ", price: 7500, image: "/images/croissant.webp" },
  { category: "dessert", name: "Шоколадтай күүки", name_en: "Chocolate Cookie", description: "Гаднаа шаржигнуур, дотроо зөөлөн", price: 4900, image: "/images/cookies.webp" },
  { category: "dessert", name: "Шоколадан бялуу", name_en: "Chocolate Cake", description: "Бельги шоколад, ганаш", price: 11500, image: "/images/cake.webp" },

  // Beer — 2+1 promo is switched by BEER_PROMO in lib/promo.ts. Prices are placeholders.
  { category: "beer", name: "Sapporo Premium", name_en: "Sapporo Premium", description: "Япон лагер · 330ml · 5.0%", price: 9900, image: "/images/beer/sapporo.webp" },
  { category: "beer", name: "Kirin Ichiban", name_en: "Kirin Ichiban", description: "Япон лагер · 650ml · 5.0%", price: 14900, image: "/images/beer/kirin.webp" },
  { category: "beer", name: "Corona Extra", name_en: "Corona Extra", description: "Мексик лагер · 330ml · 4.5%", price: 9900, image: "/images/beer/corona.webp" },
  { category: "beer", name: "Heineken", name_en: "Heineken", description: "Голланд лагер · 330ml · 5.0%", price: 8900, image: "/images/beer/heineken.webp" },
];

export const fallbackMenu: MenuItem[] = seed.map((item, i) => ({
  id: `seed-${i + 1}`,
  is_signature: false,
  is_available: true,
  sort_order: i + 1,
  ...item,
}));
