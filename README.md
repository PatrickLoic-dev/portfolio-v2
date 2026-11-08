# Patrick Loic — Portfolio

Next.js 16 (App Router) · Tailwind CSS v4 · Motion (Framer Motion) · next-intl (EN/FR) · Lenis · MDX.

```bash
npm install
npm run dev        # http://localhost:3000
npm run build
```

## Where things live

| What | Where |
| --- | --- |
| Design tokens (colours, type, buttons, chips…) | `src/app/globals.css` |
| UI copy, EN + FR | `messages/en.json`, `messages/fr.json` |
| Links, email, CV, experience, toolkit | `src/content/site.ts` |
| Projects (+ FR/EN case-study text) | `src/content/projects.ts`, `src/content/projects.data.json` |
| Blog posts (metadata) | `src/content/posts.ts` |
| Blog post bodies | `src/content/blog/<slug>.<locale>.mdx` (set `hasBody: true`) |
| Passions (games, music) | `src/content/passions.ts` |
| Motion primitives | `src/components/motion/*` |

## Motion system

All motion follows the design system: ease `cubic-bezier(.2,.7,.2,1)`, media 600 ms, UI 200–250 ms.

- `Reveal` — fade + 24 px rise when scrolled into view.
- `Stagger` / `StaggerItem` — children reveal 60 ms apart.
- `SplitHeadline` — display headlines reveal line by line (`\n` in the copy = new line).
- Nav pill, process tabs and filters animate with shared `layoutId`s and `AnimatePresence`.
- `MotionConfig reducedMotion="user"` + Lenis disabled when the OS asks for reduced motion.

## Contact form

`src/app/actions.ts` sends through [Resend](https://resend.com) when `RESEND_API_KEY` is set
(optional `CONTACT_FROM`). Without a key, submissions are logged to the server console.
The newsletter action is a stub — wire it to your provider.

## Still to fill in

- Real social profile URLs (`src/content/site.ts`).
- Project screenshots (the media panels are stylised frames for now).
- Steam / PSN IDs, game stats and the song of the moment (`src/content/passions.ts`).
- Bodies for the six articles other than "Idempotent transfers".
