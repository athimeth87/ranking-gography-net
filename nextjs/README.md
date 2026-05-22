# ranking.gography.net

Photography ranking platform — Next.js 14 (App Router) + React 18.

## Quick start

```bash
cd nextjs
npm install     # runs postinstall → renames placeholder folders to [param]
npm run dev     # open http://localhost:3000
```

If you skip `npm install`, run the setup manually once:

```bash
npm run setup
```

## Structure

```
nextjs/
├─ app/                              # App Router routes
│  ├─ layout.js                      # Root layout — fonts + AppProvider + Nav
│  ├─ page.js                        # Landing (/)
│  ├─ globals.css                    # CSS variables + base styles
│  ├─ explore/page.js
│  ├─ explore/[category]/page.js    # see note below ↓
│  ├─ photo/[id]/page.js
│  ├─ photographer/[username]/page.js
│  ├─ photographers/page.js
│  ├─ photographers/[filter]/page.js
│  ├─ hall-of-fame/page.js
│  ├─ ambassadors/page.js
│  ├─ about-ranking/page.js
│  ├─ about/page.js
│  ├─ search/page.js
│  ├─ login/page.js
│  ├─ for-customers/page.js
│  ├─ upload/page.js
│  ├─ apply-photographer/page.js
│  └─ me/[[...section]]/page.js
├─ components/
│  ├─ AppProvider.js                 # theme / userState / banner / hero context
│  ├─ Nav.js                         # top nav + customer/photographer ribbons
│  ├─ Footer.js
│  ├─ PhotoCard.js                   # PhotoCard + PhotoGrid
│  └─ Icons.js                       # PickBadge, VoyageurMark, CrownIcon, RewardIcon
├─ lib/
│  └─ data.js                        # Mock data (photographers, photos, seasons)
├─ bin/
│  └─ setup-routes.js                # Renames `-id-` placeholders → `[id]`
├─ package.json
├─ next.config.js
├─ tailwind.config.js                # Tailwind ready, but inline styles are used
└─ jsconfig.json                     # `@/*` path alias
```

### Placeholder folder names

This project's source bundle uses `-id-`, `-username-`, `--...section--` in
place of `[id]`, `[username]`, `[[...section]]` because the upstream design
tool cannot write square brackets in folder paths.

The `bin/setup-routes.js` script renames them on first `npm install` (via
`postinstall` script). After that, the folders are normal Next.js dynamic
segments and you can edit them like any other Next.js project.

## Design system

- **Mono palette** — pure white/black (toggle dark mode by switching `data-theme`)
- **Visual modes** — `atelier` (Aesop-restraint) vs `editorial` (magazine drama). Toggle via `data-mode` on `<html>`.
- **Accent color** — warm gold `#b08e54` reserved for Ambassador and Voyageur cues.
- **Typography** — Inter (sans), Noto Sans Thai (`.th` class), IBM Plex Mono (`.mono`)
- **Inline styles** dominate; Tailwind is wired up but unused — refactor at your pace.

## User personas

The app supports 4 user states (set via `AppProvider`):

- `guest` — not signed in
- `user` — signed-in regular user
- `customer` — verified GOGRAPHY customer (Voyageur)
- `photographer` — approved photographer

Switch in code: `useApp().setUserState('customer')` to preview.

## Mock data → real data

Replace `lib/data.js` with API calls / Supabase queries. The shape:

```js
// Photo
{ id, slug, title, by /* username */, cat /* 'Landscape'|'Portrait'|'BW' */,
  w, h, src, caption, exif, likes, likes24h, comments, favorites, hours,
  picks /* ['editor', 'ambassador'] */, date, pulse, rank }

// Photographer
{ username, name, loc, bio, avatar, cover, followers, photos,
  isAmbassador, isCustomer, customerTrips, joined, cameras }
```

`pulseScore(photo)` returns the calculated Pulse value (see /about-ranking).

## Next steps for production

1. **Auth** — wire `AppProvider.userState` to Supabase auth + role-based gating
2. **Image hosting** — replace picsum.photos placeholders with Supabase Storage / CDN URLs
3. **Pages** — port `/admin/*` routes (not in this design preview)
4. **Tailwind migration** — if desired, refactor inline styles to utility classes
5. **Real Pulse calc** — move from client-side to a Supabase function / cron

## License

© 2026 GOGRAPHY Co., Ltd.
