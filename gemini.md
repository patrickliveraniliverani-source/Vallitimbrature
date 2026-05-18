# GEMINI.md — Rendiconto IT Tracker

## Contesto progetto

App web personale per **Patrick Liverani**, responsabile IT & Cybersecurity di una Holding italiana (Valli Holding SpA) che presta servizio a più società del Gruppo. L'app sostituisce un prototipo React con `window.storage` locale — obiettivo: portarla su Next.js + Supabase con sincronizzazione reale tra dispositivi.

Il codice React di partenza è nella cartella `/reference/tracker-prototype.jsx`. Contiene tutta la logica UI, i tipi di dati e le costanti di default. **Non riscrivere da zero: porta quella UI su Next.js adattando solo lo strato di persistenza.**

---

## Stack target

- **Framework**: Next.js 14 App Router
- **Database**: Supabase (PostgreSQL)
- **Deploy**: Vercel
- **Stile**: Tailwind CSS — ma rispetta fedelmente l'estetica del prototipo (vedi sezione Design)
- **Autenticazione**: Supabase Auth con magic link via email (uso monoutente)
- **Grafici**: recharts (già usato nel prototipo)
- **Export Excel**: SheetJS / xlsx (già usato nel prototipo)

---

## Schema database Supabase

Crea queste tabelle. Esegui le migration con Supabase CLI.

```sql
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
```

**RLS (Row Level Security)**: abilita RLS su tutte e tre le tabelle. Policy: `user_id = auth.uid()` per SELECT, INSERT, UPDATE, DELETE.

---

## Struttura cartelle Next.js

```
/app
  /api
    /presenze/route.ts          -- GET (per data o range), POST (upsert giornata)
    /interventi/route.ts        -- GET (filtro periodo), POST (nuovo), DELETE (per id)
    /config/route.ts            -- GET, PUT
  /(app)
    /layout.tsx                 -- AuthGuard: redirect a /login se non autenticato
    /page.tsx                   -- redirect a /marcatempo
    /marcatempo/page.tsx
    /interventi/page.tsx
    /report/page.tsx
    /impostazioni/page.tsx
  /login/page.tsx               -- magic link form
/components
  /marcatempo/                  -- componenti estratti dal prototipo
  /interventi/
  /report/
  /impostazioni/
  /ui/                          -- Chip, BigBtn, Card, Toast (componenti atomici dal prototipo)
/lib
  /supabase.ts                  -- client browser + server
  /types.ts                     -- tipi TypeScript per Presenza, Intervento, Config
  /utils.ts                     -- fmtTime, fmtDate, netMins, minsToHHMM (dal prototipo)
/reference
  /tracker-prototype.jsx        -- prototipo React originale (non modificare)
```

---

## API routes — comportamento atteso

### `GET /api/presenze?from=YYYY-MM-DD&to=YYYY-MM-DD`
Restituisce array di presenze nel range. Se mancano `from`/`to`, restituisce oggi.

### `POST /api/presenze`
Body: `{ data: "YYYY-MM-DD", ...campi }`. Upsert sulla coppia `(user_id, data)`.

### `GET /api/interventi?from=YYYY-MM-DD&to=YYYY-MM-DD`
Restituisce interventi ordinati per `ts DESC`.

### `POST /api/interventi`
Body: oggetto intervento. Restituisce la riga creata con `id`.

### `DELETE /api/interventi?id=UUID`
Elimina il record. Verifica che `user_id` corrisponda.

### `GET /api/config` / `PUT /api/config`
Upsert su `config` per l'utente autenticato.

---

## Gestione stato lato client

Usa **SWR** per il fetching e la revalidazione. Pattern:

```typescript
const { data: presenze, mutate } = useSWR('/api/presenze?from=...&to=...', fetcher)

// dopo una modifica ottimistica:
await mutate(updatedData, { revalidate: false })
await fetch('/api/presenze', { method: 'POST', body: JSON.stringify(patch) })
await mutate() // revalida dal server
```

L'aggiornamento deve essere **ottimistico**: l'UI risponde immediatamente, la chiamata API è in background. Il marcatempo deve funzionare bene anche con latenza di rete.

---

## Design — rispetta fedelmente il prototipo

Palette colori (usa CSS variables in `globals.css`):

```css
:root {
  --bg: #f5f2eb;
  --card: #ffffff;
  --border: #e0dccf;
  --text: #1c1c1c;
  --muted: #6b6560;
  --accent: #b8451f;
  --accent-light: #f9ece7;
  --chip: #eae7e0;
}
```

Font (carica via `next/font/google`):
- `IBM Plex Sans` — UI generale
- `IBM Plex Mono` — orari e numeri (`font-variant-numeric: tabular-nums`)
- `Fraunces` — titoli sezioni

Il bottone principale del marcatempo deve restare **grande e cliccabile con il pollice** (padding minimo 20px verticale, font 18px+). Layout mobile-first.

---

## Login — magic link

Pagina `/login`:
- Form con campo email
- Chiama `supabase.auth.signInWithOtp({ email })`
- Dopo submit mostra: "Controlla la tua email — ti abbiamo inviato il link di accesso"
- Redirect post-login a `/marcatempo`

Non serve registrazione: Patrick è l'unico utente. Puoi pre-impostare l'email autorizzata come env variable `ALLOWED_EMAIL` e rifiutare magic link per altre email.

---

## Variabili d'ambiente richieste

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=       # solo per le API routes server-side
ALLOWED_EMAIL=                   # email autorizzata al login
```

Configura le stesse variabili su Vercel nelle impostazioni del progetto.

---

## Funzionalità da preservare integralmente dal prototipo

1. **Marcatempo**: stati (fuori / in_servizio / pausa / uscito), bottone contestuale, cambio sede con sessioni, modifica orario entrata/uscita inline
2. **Interventi IT**: chip per categoria/società/canale/durata, autocomplete richiedente, timer opzionale, "Salva e nuovo"
3. **Report**: filtro periodo (oggi / settimana / mese / mese precedente / tutto), KPI, grafico barre 14 giorni, torta società, barre categorie, tabella presenze
4. **Export Excel**: tre fogli (Presenze, Interventi IT, Riepilogo mensile), nome file `Rendiconto_Patrick_AAAA-MM.xlsx`
5. **Impostazioni**: CRUD su sedi, società, categorie (con color picker), canali — tutto persistito in `config` su Supabase

---

## Note operative

- Il campo `sessioni` in `presenze` traccia gli spostamenti di sede durante la giornata. Il calcolo ore nette è: `(uscita - entrata) - somma_pause`. Il cambio sede non sottrae tempo.
- I timestamp sono sempre in **UTC** nel database. La conversione a ora locale (Europe/Rome) avviene solo a display, usando `Intl.DateTimeFormat` o `date-fns-tz`.
- L'autocomplete del richiedente si popola dai valori distinti già presenti in `interventi.richiedente` per quell'utente.
- La configurazione default (sedi, società, categorie) viene scritta in `config` al primo accesso se la riga non esiste ancora.