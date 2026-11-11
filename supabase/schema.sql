-- ════════════════════════════════════════════════════════════════
-- 44 Concept Café — Supabase schema
-- Run once in Supabase Dashboard → SQL Editor → New query → Run.
-- Safe to re-run: it drops/recreates policies and upserts the seed menu.
-- ════════════════════════════════════════════════════════════════

-- ───────────── MENU ─────────────
create table if not exists public.menu_items (
  id            uuid primary key default gen_random_uuid(),
  category      text not null check (category in ('hot','cold','signature','gelato','dessert')),
  name          text not null,
  name_en       text not null,
  description   text not null default '',
  price         integer not null check (price >= 0),        -- MNT
  image         text not null default '/images/latte.webp',
  is_signature  boolean not null default false,
  is_available  boolean not null default true,
  sort_order    integer not null default 0,
  created_at    timestamptz not null default now(),
  unique (name_en, category)
);

alter table public.menu_items enable row level security;

drop policy if exists "menu is public" on public.menu_items;
create policy "menu is public" on public.menu_items
  for select using (true);
-- Edits are done from the Supabase dashboard (service role), so no write policies.

-- ───────────── RESERVATIONS ─────────────
create table if not exists public.reservations (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  full_name   text not null check (char_length(full_name) between 2 and 80),
  phone       text not null check (char_length(phone) between 6 and 20),
  date        date not null,
  time        time not null,
  guests      integer not null check (guests between 1 and 10),
  note        text check (note is null or char_length(note) <= 300),
  status      text not null default 'pending' check (status in ('pending','confirmed','cancelled')),
  created_at  timestamptz not null default now()
);

create index if not exists reservations_user_idx on public.reservations (user_id);
create index if not exists reservations_slot_idx on public.reservations (date, time);

alter table public.reservations enable row level security;

drop policy if exists "read own reservations" on public.reservations;
create policy "read own reservations" on public.reservations
  for select to authenticated using (auth.uid() = user_id);

drop policy if exists "create own reservations" on public.reservations;
create policy "create own reservations" on public.reservations
  for insert to authenticated
  with check (auth.uid() = user_id and status = 'pending');

drop policy if exists "cancel own reservations" on public.reservations;
create policy "cancel own reservations" on public.reservations
  for update to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id and status = 'cancelled');

-- Customers may only change the status column (to 'cancelled', per policy above).
revoke update on public.reservations from authenticated;
grant update (status) on public.reservations to authenticated;

-- Capacity + date guard: max 30 guests per 30-min slot, no past dates, max 30 days ahead.
create or replace function public.check_reservation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  booked integer;
  capacity constant integer := 30;
begin
  if new.status = 'cancelled' then
    return new;
  end if;

  if new.date < (now() at time zone 'Asia/Ulaanbaatar')::date
     or new.date > (now() at time zone 'Asia/Ulaanbaatar')::date + 30 then
    raise exception 'reservation_invalid_date';
  end if;

  select coalesce(sum(guests), 0) into booked
  from public.reservations
  where date = new.date and time = new.time and status <> 'cancelled'
    and id <> new.id;

  if booked + new.guests > capacity then
    raise exception 'reservation_slot_full';
  end if;
  return new;
end;
$$;

drop trigger if exists reservations_check on public.reservations;
create trigger reservations_check
  before insert on public.reservations
  for each row execute function public.check_reservation();

-- ───────────── SEED MENU (placeholder items – edit prices in Table Editor) ─────────────
insert into public.menu_items (category, name, name_en, description, price, image, is_signature, sort_order) values
  ('signature','44 Signature','44 Signature Latte','Давсалсан карамель, ванилийн крем, давхар эспрессо',13900,'/images/flat-white.webp',true,1),
  ('signature','Матча латте','Ceremonial Matcha','Японы церемониал матча, овъёосны сүү',11900,'/images/matcha.webp',true,2),
  ('signature','Аффогато','Affogato','Ванилийн желато дээр халуун эспрессо',12500,'/images/sundae.webp',true,3),
  ('signature','Deco Cold Brew','Deco Cold Brew','18 цаг исгэсэн, жүржийн хальстай',11500,'/images/iced-americano.webp',true,4),
  ('hot','Эспрессо','Espresso','Давхар шот, шоколад ба самрын амт',6500,'/images/espresso.webp',false,5),
  ('hot','Американо','Americano','Эспрессо + халуун ус',7500,'/images/americano.webp',false,6),
  ('hot','Капучино','Cappuccino','Өтгөн хөөстэй сонгодог',9500,'/images/cappuccino.webp',false,7),
  ('hot','Латте','Caffè Latte','Зөөлөн, сүүтэй',9900,'/images/latte.webp',false,8),
  ('hot','Флэт уайт','Flat White','Нимгэн микрофоам, хүчтэй амт',9900,'/images/lattes.webp',false,9),
  ('hot','V60 Пур овер','V60 Pour Over','Улирлын single-origin үр',12500,'/images/pourover.webp',false,10),
  ('cold','Айс американо','Iced Americano','Сэрүүн, цэвэр амт',8500,'/images/black-coffee.webp',false,11),
  ('cold','Айс латте','Iced Latte','Мөстэй, зөөлөн сүүтэй',10500,'/images/iced-latte.webp',false,12),
  ('cold','Мокко фраппе','Mocha Frappé','Шоколад, эспрессо, цөцгий',12900,'/images/frappe.webp',false,13),
  ('gelato','Желато · 1 бөмбөг','Gelato · Single','Өдөр бүр шинээр хийсэн',6900,'/images/gelato.webp',false,14),
  ('gelato','Желато · 2 бөмбөг','Gelato · Double','Дуртай хоёр амтаа хослуул',11900,'/images/gelato.webp',false,15),
  ('gelato','44 Санде','44 Sundae','Желато, брауни, шоколадан соус',14900,'/images/sundae.webp',false,16),
  ('dessert','Цөцгийн тосон круассан','Butter Croissant','Франц аргаар, өдөр бүр шинэ',7500,'/images/croissant.webp',false,17),
  ('dessert','Шоколадтай күүки','Chocolate Cookie','Гаднаа шаржигнуур, дотроо зөөлөн',4900,'/images/cookies.webp',false,18),
  ('dessert','Шоколадан бялуу','Chocolate Cake','Бельги шоколад, ганаш',11500,'/images/cake.webp',false,19)
on conflict (name_en, category) do update set
  name = excluded.name, description = excluded.description, price = excluded.price,
  image = excluded.image, is_signature = excluded.is_signature, sort_order = excluded.sort_order;

-- ───────────── BEER CATEGORY ─────────────
alter table public.menu_items drop constraint if exists menu_items_category_check;
alter table public.menu_items add constraint menu_items_category_check
  check (category in ('hot','cold','signature','gelato','dessert','beer'));

-- ───────────── TABLE ORDERS (QR menu) ─────────────
-- Written and read only by the server (SUPABASE_SECRET_KEY bypasses RLS); no public policies on purpose.
create table if not exists public.orders (
  id          uuid primary key default gen_random_uuid(),
  number      bigint generated always as identity,
  table_no    integer not null check (table_no between 1 and 200),
  lines       jsonb not null,
  note        text check (note is null or char_length(note) <= 200),
  subtotal    integer not null check (subtotal >= 0),
  discount    integer not null default 0 check (discount >= 0),
  total       integer not null check (total >= 0),
  status      text not null default 'new' check (status in ('awaiting_payment','new','preparing','served','paid','cancelled')),
  created_at  timestamptz not null default now(),
  payment_ref text unique,
  invoice_id  text,
  pay_url     text,
  paid_at     timestamptz
);

-- Online payments (Wire) (safe to re-run on an existing database)
alter table public.orders add column if not exists payment_ref text unique;
alter table public.orders add column if not exists invoice_id  text;
alter table public.orders add column if not exists pay_url     text;
alter table public.orders add column if not exists paid_at     timestamptz;
alter table public.orders drop constraint if exists orders_status_check;
alter table public.orders add constraint orders_status_check
  check (status in ('awaiting_payment','new','preparing','served','paid','cancelled'));
create index if not exists orders_created_idx on public.orders (created_at desc);
alter table public.orders enable row level security;

-- ───── Admin эрх олгох ─────
-- Хэрэглэгч сайтад ердийнхөөрөө бүртгүүлсний дараа энд имэйлээр нь admin болгоно (дахин нэвтэрсний дараа идэвхжинэ).
-- app_metadata-г зөвхөн энэ SQL / service key өөрчилж чадна — хэрэглэгч өөрөө өөртөө эрх олгох боломжгүй.
--
--   update auth.users
--   set raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb) || '{"role":"admin"}'
--   where email = 'name@example.com';
--
-- Эрх хасах:
--   update auth.users set raw_app_meta_data = raw_app_meta_data - 'role' where email = 'name@example.com';

-- ═════════════ ADMIN CONTENT (menu / Art Wear editing, image uploads) ═════════════
-- Writes go through the server with the secret key after an admin check, so only public-read policies are needed.

-- ───── ART WEAR ─────
create table if not exists public.wear_items (
  id          text primary key default replace(gen_random_uuid()::text, '-', ''),
  name        text not null,
  kind        text not null default '',
  price       integer not null check (price >= 0),
  image       text not null,
  w           integer not null default 600,
  h           integer not null default 750,
  sizes       text[] not null default '{}',
  height_min  integer not null default 160,
  height_max  integer not null default 185,
  weight_min  integer not null default 50,
  weight_max  integer not null default 85,
  gender      text not null default 'Унисекс' check (gender in ('Унисекс','Эрэгтэй','Эмэгтэй')),
  sort_order  integer not null default 0,
  is_available boolean not null default true,
  created_at  timestamptz not null default now()
);
alter table public.wear_items enable row level security;
drop policy if exists "wear is public" on public.wear_items;
create policy "wear is public" on public.wear_items for select using (true);

insert into public.wear_items (id, name, kind, price, image, w, h, sizes, height_min, height_max, weight_min, weight_max, gender, sort_order) values
  ('cobain', 'Nevermind Denim', 'Гар зурагтай жинсэн хүрэм', 700000, '/images/wear/cobain-denim.webp', 633, 751, array['L'], 172, 188, 62, 88, 'Унисекс', 0),
  ('chucky', 'Chucky Hand-painted', 'Гар зурагтай хүрэм', 750000, '/images/wear/chucky-jacket.webp', 633, 700, array['XL'], 175, 192, 70, 100, 'Эрэгтэй', 10),
  ('patchwork', 'Patchwork Denim', 'Upcycle жинсэн хүрэм', 500000, '/images/wear/patchwork-denim.webp', 726, 672, array['L','XL'], 170, 188, 60, 90, 'Унисекс', 20),
  ('aztec', 'Aztec Denim', 'Хээтэй жинсэн хүрэм', 500000, '/images/wear/aztec-denim.webp', 633, 669, array['M','L'], 165, 182, 55, 80, 'Унисекс', 30),
  ('vest', 'Fringe Denim Vest', 'Upcycle хантааз', 350000, '/images/wear/patchwork-vest.webp', 520, 702, array['S','M'], 158, 175, 45, 65, 'Эмэгтэй', 40),
  ('hoodie', 'Looney Patch Hoodie', 'Нөхөөстэй hoodie', 250000, '/images/wear/looney-hoodie.webp', 633, 606, array['M','L','XL'], 165, 190, 55, 95, 'Унисекс', 50),
  ('skirt', 'Denim Long Skirt', 'Урт жинсэн банзал', 400000, '/images/wear/denim-long-skirt.webp', 601, 750, array['S','M'], 155, 175, 45, 68, 'Эмэгтэй', 60),
  ('patches', 'Patch Work Jacket', 'Шошготой хар хүрэм', 350000, '/images/wear/patch-jacket.webp', 633, 553, array['M','L'], 165, 185, 55, 85, 'Унисекс', 70),
  ('blazer', 'Splatter Blazer', 'Будгаар цацсан пиджак', 400000, '/images/wear/splatter-blazer.webp', 593, 532, array['M'], 165, 182, 55, 78, 'Унисекс', 80),
  ('jeans', 'Patchwork Jeans', 'Upcycle жинсэн өмд', 400000, '/images/wear/patchwork-jeans.webp', 570, 759, array['30','32'], 168, 185, 58, 80, 'Эрэгтэй', 90),
  ('racing', 'Racing Jacket', 'Хатгамалтай бомбер', 400000, '/images/wear/sponge-racing.webp', 633, 485, array['L','XL'], 170, 190, 65, 95, 'Унисекс', 100),
  ('tiger', 'Tiger Shirt', 'Хээтэй цамц', 120000, '/images/wear/tiger-shirt.webp', 630, 900, array['M','L','XL'], 160, 188, 50, 95, 'Унисекс', 110)
on conflict (id) do nothing;

-- ───── IMAGE UPLOADS (public bucket) ─────
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('media', 'media', true, 5242880, array['image/jpeg','image/png','image/webp','image/avif'])
on conflict (id) do update set public = true;

-- ═════════════ RESERVATIONS: 18:00+, 21+, 50,000₮ deposit ═════════════
alter table public.reservations add column if not exists deposit       integer not null default 50000;
alter table public.reservations add column if not exists deposit_paid  boolean not null default false;
alter table public.reservations add column if not exists age_confirmed boolean not null default false;

-- Guests can only create unpaid, pending bookings; staff (server, secret key) marks the deposit paid.
drop policy if exists "create own reservations" on public.reservations;
create policy "create own reservations" on public.reservations
  for insert to authenticated
  with check (auth.uid() = user_id and status = 'pending' and deposit_paid = false and deposit = 50000);

create or replace function public.check_reservation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  booked integer;
  capacity constant integer := 30;
begin
  if new.status = 'cancelled' then
    return new;
  end if;

  if new.date < (now() at time zone 'Asia/Ulaanbaatar')::date
     or new.date > (now() at time zone 'Asia/Ulaanbaatar')::date + 30 then
    raise exception 'reservation_invalid_date';
  end if;

  if new.time < time '18:00' then
    raise exception 'reservation_invalid_time';
  end if;

  if not new.age_confirmed then
    raise exception 'reservation_age';
  end if;

  select coalesce(sum(guests), 0) into booked
  from public.reservations
  where date = new.date and time = new.time and status <> 'cancelled'
    and id <> new.id;

  if booked + new.guests > capacity then
    raise exception 'reservation_slot_full';
  end if;
  return new;
end;
$$;

-- ═════════════ ORDERS ↔ ACCOUNTS (guest sees their own QR orders on /account) ═════════════
alter table public.orders add column if not exists user_id uuid references auth.users (id) on delete set null;
create index if not exists orders_user_idx on public.orders (user_id, created_at desc);
