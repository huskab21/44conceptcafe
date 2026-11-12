-- Menu categories, edited from /admin/menu → "Ангилал". Run once in Supabase → SQL Editor.
create table if not exists public.menu_categories (
  id          text primary key default substr(replace(gen_random_uuid()::text, '-', ''), 1, 10),
  label       text not null,
  en          text not null default '',
  sort_order  integer not null default 0,
  created_at  timestamptz not null default now()
);

alter table public.menu_categories enable row level security;
drop policy if exists "menu categories are public" on public.menu_categories;
create policy "menu categories are public" on public.menu_categories for select using (true);

-- The categories the site had built in (keeps their ids, so existing menu items stay where they are).
insert into public.menu_categories (id, label, en, sort_order) values
  ('signature', 'Онцлох', 'Signature', 10),
  ('hot', 'Халуун кофе', 'Hot Coffee', 20),
  ('cold', 'Хүйтэн', 'Iced', 30),
  ('gelato', 'Желато', 'Gelato', 40),
  ('dessert', 'Амттан', 'Dessert', 50),
  ('beer', 'Пиво', 'Beer', 60)
on conflict (id) do nothing;

-- Any other category already used by an item gets a row too, so the foreign key below can be added.
insert into public.menu_categories (id, label, en, sort_order)
select distinct category, category, category, 100 from public.menu_items
on conflict (id) do nothing;

-- Menu items may now use any category from the table (replaces the old fixed list).
alter table public.menu_items drop constraint if exists menu_items_category_check;
alter table public.menu_items drop constraint if exists menu_items_category_fkey;
alter table public.menu_items add constraint menu_items_category_fkey
  foreign key (category) references public.menu_categories (id) on update cascade on delete restrict;
