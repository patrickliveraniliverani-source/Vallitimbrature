-- Configurazione utente (una sola riga per utente)
create table config (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null unique,
  nome text not null default 'Patrick',
  sedi jsonb not null default '[]',
  societa jsonb not null default '[]',
  categorie jsonb not null default '[]',
  canali jsonb not null default '[]',
  updated_at timestamptz default now()
);

-- Presenze giornaliere (una riga per giorno)
create table presenze (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  data date not null,
  entrata timestamptz,
  uscita timestamptz,
  sede_corrente text,
  sessioni jsonb default '[]',   -- [{sede, inizio, fine}]
  pause jsonb default '[]',      -- [{inizio, fine}]
  unique(user_id, data)
);

-- Interventi IT
create table interventi (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  ts timestamptz not null default now(),
  descrizione text not null,
  categoria text,
  societa text,
  canale text,
  richiedente text,
  durata_min integer not null default 0,
  note text,
  created_at timestamptz default now()
);

-- Abilitazione RLS
alter table config enable row level security;
alter table presenze enable row level security;
alter table interventi enable row level security;

-- Policy per config
create policy "Users can view own config" on config for select using (auth.uid() = user_id);
create policy "Users can insert own config" on config for insert with check (auth.uid() = user_id);
create policy "Users can update own config" on config for update using (auth.uid() = user_id);
create policy "Users can delete own config" on config for delete using (auth.uid() = user_id);

-- Policy per presenze
create policy "Users can view own presenze" on presenze for select using (auth.uid() = user_id);
create policy "Users can insert own presenze" on presenze for insert with check (auth.uid() = user_id);
create policy "Users can update own presenze" on presenze for update using (auth.uid() = user_id);
create policy "Users can delete own presenze" on presenze for delete using (auth.uid() = user_id);

-- Policy per interventi
create policy "Users can view own interventi" on interventi for select using (auth.uid() = user_id);
create policy "Users can insert own interventi" on interventi for insert with check (auth.uid() = user_id);
create policy "Users can update own interventi" on interventi for update using (auth.uid() = user_id);
create policy "Users can delete own interventi" on interventi for delete using (auth.uid() = user_id);
