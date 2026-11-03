# 44 Concept Café — вэбсайт

Улаанбаатар дахь **44 Concept Café** ([@44.hype](https://www.instagram.com/44.hype/)) кафены вэбсайт.
Next.js 16 · Tailwind CSS 4 · Motion · Lenis · Supabase.

## Боломжууд

- Хөдөлгөөнт нүүр хуудас: preloader, parallax hero, marquee, scroll-оор гэрэлтэх текст, хэвтээ scroll-той онцлох бүтээгдэхүүн, меню, галерей, байршил
- Меню ба үнэ: Supabase-ийн `menu_items` хүснэгтээс уншина (холбогдоогүй үед `lib/menu-data.ts`)
- Бүртгүүлэх / нэвтрэх (Supabase Auth)
- Ширээ захиалах: өдөр → цаг → мэдээлэл гэсэн 3 алхам. Захиалгаа харах, цуцлах боломжтой (`/account`)
- Desktop болон mobile-д бүрэн тохирсон. Custom cursor зөвхөн хулганатай төхөөрөмж дээр ажиллана. `prefers-reduced-motion` тохиргоог дагана

## Ажиллуулах

```bash
npm install
npm run dev        # http://localhost:3000
```

`.env.local` файлгүй үед сайт **демо горимд** ажиллана. Энэ үед бүртгэл болон захиалга зөвхөн тухайн хөтчийн localStorage-д хадгалагдана.

## Supabase холбох

1. [supabase.com](https://supabase.com)-д шинэ project үүсгэнэ (region: Singapore эсвэл Tokyo)
2. **SQL Editor** → `supabase/schema.sql` файлын агуулгыг хуулж буулгаад **Run** дарна. Хүснэгт, RLS дүрэм болон менюгийн анхны өгөгдөл үүснэ
3. **Project Settings → API**-аас URL болон publishable key-г хуулна
4. `.env.example`-ийг `.env.local` нэрээр хуулж, утгуудыг бөглөнө
5. **Authentication → URL Configuration** хэсэгт Site URL-ээ (жишээ нь `https://44cafe.mn`) болон `http://localhost:3000`-г нэмнэ

### Менюгийн үнэ өөрчлөх
Supabase → **Table Editor → menu_items** хэсэгт үнэ, нэр, зургийг шууд засна. Сайт хэдхэн минутын дотор шинэчлэгдэнэ.

### Захиалга баталгаажуулах
Supabase → **Table Editor → reservations** хэсэгт `status` баганыг `confirmed` болгоно. Дараагийн шатанд admin самбар нэмж болно.

## Зураг солих
`public/images/` доторх зургууд нь Unsplash-ийн **түр** зургууд. Кафены жинхэнэ зургийг ижил нэрээр (`.webp`) сольж тавихад хангалттай.

## Deploy (Vercel)
1. GitHub руу push хийнэ
2. [vercel.com/new](https://vercel.com/new) → repo-гоо import хийнэ
3. Environment Variables хэсэгт `.env.local`-ийн гурван утгыг нэмнэ → Deploy
4. Domain: Vercel → Settings → Domains

## Бүтэц
```
app/              хуудсууд (/, /login, /signup, /reserve, /account)
components/home/  нүүр хуудасны хэсгүүд
components/ui/    анимейшны туслах компонентууд (Reveal, SplitText, Magnetic)
lib/site.ts       хаяг, утас, цагийн хуваарь, захиалгын дүрэм  ← энд засна
lib/menu-data.ts  менюгийн нөөц өгөгдөл
lib/backend.ts    auth + захиалга (Supabase / демо горим)
supabase/         өгөгдлийн сангийн schema
```
