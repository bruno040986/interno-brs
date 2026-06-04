-- Links configuráveis que aparecem no cartão digital.
-- Mantém ordem manual, ícone escolhido e status ativo/inativo.

create table if not exists public.commercial_card_links (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  destination_url text not null,
  icon_key text not null default 'link',
  position integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists commercial_card_links_is_active_idx
  on public.commercial_card_links (is_active);

create index if not exists commercial_card_links_position_idx
  on public.commercial_card_links (position);

notify pgrst, 'reload schema';
