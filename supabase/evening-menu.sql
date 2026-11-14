-- Evening menu: from 18:00 only items with evening = true can be ordered from the table QR menu.
-- Toggled per item on /admin/menu ("☾ Орой ч зарна"). Run once in Supabase → SQL Editor.
alter table public.menu_items add column if not exists evening boolean not null default false;

-- Starting point: everything in the beer / cocktail / shot categories, plus soda and soft drinks.
update public.menu_items m
set evening = true
from public.menu_categories c
where c.id = m.category
  and (
    upper(c.label) in ('BEER', 'COCKTAIL', 'SHOT')
    or upper(m.name) similar to '%(COLA|SODA|TONIC|LEMONADE)%'
  );
