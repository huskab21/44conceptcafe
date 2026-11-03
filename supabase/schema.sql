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
