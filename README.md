# Patrick Loic — Portfolio

Next.js 16 (App Router) · Tailwind CSS v4 · Motion (Framer Motion) · next-intl (EN/FR) · Lenis ·
Supabase (Postgres, Auth, Storage) + Drizzle.

## Getting started

Requires Docker (for the local Supabase).

```bash
npm install
npm run db:start      # local Supabase (first run downloads the images)
npx supabase status   # copy the keys into .env.local (see .env.example)
npm run db:seed       # subjects, notes, projects, sample games, admin account, storage bucket
npm run dev
```

The Studio lives at `/studio` (single admin: `ADMIN_EMAIL` / `ADMIN_PASSWORD` from `.env.local`).

| Script | What it does |
| --- | --- |
| `db:start` / `db:stop` | Start / stop the local Supabase stack |
| `db:generate` | Generate a SQL migration from `src/db/schema.ts` (into `supabase/migrations`) |
| `db:migrate` | Apply pending migrations to the local database |
| `db:seed` | Idempotent seed (never overwrites existing rows) |

## Where things live

| What | Where |
| --- | --- |
| Blog notes, subjects, projects, games, music | Database — edit them in the Studio |
| Database schema | `src/db/schema.ts`, migrations in `supabase/migrations` |
| Data access (public site + Studio) | `src/lib/notes.ts`, `src/lib/portfolio.ts` |
| Studio server actions | `src/app/studio/actions.ts`, `src/app/studio/portfolio-actions.ts` |
| Design tokens (colours, type, buttons, chips…) | `src/app/globals.css` |
| UI copy, EN + FR | `messages/en.json`, `messages/fr.json` |
| Links, email, CV, experience, toolkit | `src/content/site.ts` |
| Initial content imported by the seed | `scripts/seed/*` |
| Motion primitives | `src/components/motion/*` |

## Integrations

- **Steam** — set `STEAM_API_KEY` (free: https://steamcommunity.com/dev/apikey), then link your
  account in Studio → Passions → Jeux vidéo. The profile and its game details must be public.
  `vercel.json` schedules a nightly sync on `/api/cron/steam` (needs `CRON_SECRET`).
- **Music** — paste an Apple Music link (title, artist, album and artwork filled via the iTunes
  Lookup API) or a Spotify link (title and artwork via oEmbed). No key needed.
- **Contact form** — sends through [Resend](https://resend.com) when `RESEND_API_KEY` is set;
  otherwise submissions are logged. The newsletter action is a stub.

## Motion system

All motion follows the design system: ease `cubic-bezier(.2,.7,.2,1)`, media 600 ms, UI 200–250 ms.

- `Reveal` — fade + 24 px rise when scrolled into view.
- `Stagger` / `StaggerItem` — children reveal 60 ms apart.
- `SplitHeadline` — display headlines reveal line by line (`\n` in the copy = new line).
- Nav pill, tabs and filters animate with shared `layoutId`s and `AnimatePresence`.
- `MotionConfig reducedMotion="user"` + Lenis disabled when the OS asks for reduced motion.

## Still to fill in

- Real social profile URLs (`src/content/site.ts`).
- Project screenshots (Studio → Projets → Médias).
- Steam account + `STEAM_API_KEY`; the song of the moment and music profiles.
- Bodies for the six articles other than "Idempotent transfers".
