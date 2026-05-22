# ranking-gography-net

Photo ranking + voting platform — **"Gography Photo Awards"**.
Domain: `ranking.gography.net`

> **Active project: [`web/`](./web/)** — a TypeScript rebuild (Next.js 14 App Router + TypeScript + Tailwind + shadcn/ui). The earlier JavaScript scaffold in [`nextjs/`](./nextjs/) and the static `.jsx`/`.html` preview at the repo root are kept for reference only — they are not the deploy target.

---

## Repo layout

```
.
├── nextjs/                          ← Active project (Next.js 14 + App Router)
│   ├── app/                         ← 17 routes
│   ├── components/                  ← Nav, Footer, PhotoCard, Icons, AppProvider
│   ├── lib/data.js                  ← Mock data — replace with Supabase queries
│   ├── bin/setup-routes.js          ← Renames -id- → [id] on postinstall
│   └── README.md                    ← Dev quick start
│
├── supabase/                        ← DB schema + migrations
│   └── migrations/                  ← Apply in order via Supabase SQL editor or CLI
│       ├── 0001_init_schema.sql     ← Tables, indexes, RLS policies
│       ├── 0002_triggers.sql        ← Counters, pick_type, handle_new_user
│       ├── 0003_materialized_views.sql ← photo_scores, photographer_stats
│       ├── 0004_functions.sql       ← Cashback eligibility, helpers
│       └── 0005_seed_data.sql       ← Initial categories + dev super admin
│
└── (root .jsx + .html + pages/ + uploads/)
    ↑ Legacy design preview. Open `Gography Photo Awards.html` via `python -m http.server`
       to view. Will be removed once the Next.js port reaches feature parity.
```

---

## Quick start

```powershell
cd nextjs
npm install              # postinstall renames -id-/-username-/--...section-- → [id]/[username]/[[...section]]
cp .env.example .env.local   # then fill Supabase URL + keys
npm run dev              # http://localhost:3000
```

See [`nextjs/README.md`](./nextjs/README.md) for details.

---

## Supabase setup

1. Create a Supabase project (already done — paste URL + keys into `nextjs/.env.local`)
2. Apply migrations **in order**:
   - Dashboard: SQL Editor → paste each file from `supabase/migrations/` → Run
   - Or CLI: `supabase db push` (after `supabase link --project-ref <ref>`)
3. Enable Google OAuth provider in `Authentication → Providers`
4. Add redirect URL: `http://localhost:3000/auth/callback` (dev) + `https://ranking.gography.net/auth/callback` (prod)

The full schema spec is in the NotebookLM notebook (`LOGIC.md` section 3).

---

## Roadmap (priority order)

| # | Step | Status |
|---|---|---|
| 1 | Supabase project + apply schema migrations | 🟡 schema files ready, apply pending |
| 2 | Google OAuth → `/login` working end-to-end | ⬜ |
| 3 | Replace `lib/data.js` with Supabase queries (page by page) | ⬜ |
| 4 | Photographer upload flow → Supabase Storage | ⬜ |
| 5 | Pulse score materialized view + 5-min refresh cron | ⬜ |
| 6 | Port `/admin/*` (10 pages — not in design preview) | ⬜ |
| 7 | Mobile responsive pass (currently desktop 1440px only) | ⬜ |
| 8 | Production deploy to Vercel | ⬜ |

---

## License

© 2026 Gography Co., Ltd.
