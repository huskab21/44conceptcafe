-- "Мөчүүд @44" gallery, edited from /admin/gallery.
create table if not exists public.gallery_items (
  id          uuid primary key default gen_random_uuid(),
  image       text not null,
  alt         text not null default '',
  sort_order  integer not null default 0,
  is_visible  boolean not null default true,
  created_at  timestamptz not null default now()
);

alter table public.gallery_items enable row level security;
drop policy if exists "gallery is public" on public.gallery_items;
create policy "gallery is public" on public.gallery_items for select using (true);

-- Start with the photos currently on the site (only if the table is empty).
insert into public.gallery_items (image, alt, sort_order)
select * from (values
  ('/images/bar.webp', 'Кофе бар', 10),
  ('/images/terrace.webp', 'Ногоон ургамалтай дэнж', 20),
  ('/images/cafe-sign.webp', 'Кафены гэрэлт хаяг', 30),
  ('/images/cheers.webp', 'Найзууд кофе уух нь', 40),
  ('/images/iced-latte.webp', 'Айс латте', 50),
  ('/images/croissant.webp', 'Круассан', 60),
  ('/images/cake.webp', 'Шоколадан бялуу', 70),
  ('/images/beans.webp', 'Шарсан кофены үр', 80),
  ('/images/interior-2.webp', 'Кафены танхим', 90)
) as v(image, alt, sort_order)
where not exists (select 1 from public.gallery_items);
