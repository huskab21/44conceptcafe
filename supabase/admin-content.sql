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
