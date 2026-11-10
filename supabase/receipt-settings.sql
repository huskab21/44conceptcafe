-- Editable bottom of the home-page menu receipt (/admin/menu → "Баримтын доод хэсэг").
create table if not exists public.site_settings (
  id                   integer primary key default 1 check (id = 1),
  receipt_extra_label  text not null default 'Ургамлын сүү',
  receipt_extra_price  integer not null default 1500,
  receipt_thanks       text not null default 'Баярлалаа · Дахин ирээрэй',
  updated_at           timestamptz not null default now()
);
insert into public.site_settings (id) values (1) on conflict (id) do nothing;

alter table public.site_settings enable row level security;
drop policy if exists "settings are public" on public.site_settings;
create policy "settings are public" on public.site_settings for select using (true);
