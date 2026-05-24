# Likes + Comments + Realtime Notifications

**Date:** 2026-05-24
**Status:** Approved
**Scope:** Wire persistent likes + complete comment CRUD on `/photo/[id]`, plus realtime in-app notifications (bell dropdown + toast) for both events.

---

## Summary

Today the photo detail page has a heart toggle that only updates local state, and a comments list that reads from mock data with no posting. The Supabase schema (likes via `votes`, `comments` with `parent_id`, `notifications`) is already migrated, including counter triggers — but no notification triggers, no realtime subscription, and no UI surface.

This spec wires the missing pieces:

1. **Likes** persist to `votes`. The old `prototype_likes` table (1 row, used only by `MobilePhoto.tsx`) is dropped.
2. **Comments** become full CRUD: post, reply (1 nested level), edit own, delete own.
3. **Notifications** are created by Postgres triggers on `votes`/`comments` inserts, surfaced to the user via:
   - A bell icon + dropdown in `Nav` (badge for unread count).
   - A toast popup (sonner) when a new notification arrives in realtime.
4. **Realtime** updates flow through Supabase Realtime channels for `notifications`, `comments`, and the current `photos` row (cheap live `likes_count` / `comments_count`).

---

## Decisions (recap of brainstorm)

| Topic | Decision | Why |
|---|---|---|
| Notification source | DB triggers on `votes`/`comments` | Atomic, can't be bypassed by future writers, fits the project's existing trigger pattern (`update_photo_likes_count` etc.) |
| Likes table | Migrate to `votes` (drop `prototype_likes`) | `votes` is the spec'd source of truth and already has counter triggers; `prototype_likes` was placeholder |
| Notification UI | Bell dropdown + toast (no `/me/notifications` page yet, no email) | Smallest surface that satisfies "see new notifications live" |
| Comments | Post, reply (1 level), edit own, delete own | Matches typical photo-platform feature set |
| Realtime | Notifications + comment thread + like/comment count | Single channel per photo via `photos` row covers counts cheaply |
| Auth-gating | Click → redirect to `/login?next=<current-path>` | Buttons stay clickable; redirect preserves return path |
| Toast library | `sonner` (new dep, ~5KB, shadcn-native) | Polished animations, themable to monochrome |

---

## Architecture

```
┌─────────── Browser (Next.js client) ───────────┐
│                                                │
│  /photo/[id]                                   │
│  ├── LikeButton ─────► votes (insert/delete)  │
│  ├── CommentSection ─► comments (CRUD)        │
│  ├── useLikeState ◄── realtime: photos row    │
│  └── useComments  ◄── realtime: comments      │
│                                                │
│  Root layout (every page, if logged in)        │
│  ├── <NotificationsBell />                     │
│  ├── <NotificationsListener />                 │
│  └── <Toaster />                               │
│      └─ subscribes notifications WHERE user=me │
│                                                │
└────────────────────┬───────────────────────────┘
                     │ Supabase JS (anon key, RLS-enforced)
                     ▼
┌──────────────────── Supabase ────────────────────┐
│                                                  │
│  Triggers:                                       │
│   • notify_on_vote     INSERT votes      ──► +1  │
│   • notify_on_comment  INSERT comments   ──► +1  │
│   • (existing)         counter updates           │
│                                                  │
│  Realtime publication adds: notifications,       │
│                             comments, votes      │
│                                                  │
└──────────────────────────────────────────────────┘
```

---

## Section 1 — Database

**Migration file:** `supabase/migrations/0006_likes_comments_notifications.sql`

### Drop `prototype_likes`
```sql
drop table if exists public.prototype_likes;
```
The 1 existing row is for the dev's own test — fine to lose.

### Notification triggers

```sql
-- on vote insert: notify photo owner (skip self-like)
create or replace function public.notify_on_vote()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_owner uuid;
  v_actor_username text;
  v_photo_title text;
begin
  select photographer_id, title into v_owner, v_photo_title
    from public.photos where id = new.photo_id;

  if v_owner = new.user_id then return new; end if;

  select username into v_actor_username from public.users where id = new.user_id;

  insert into public.notifications (user_id, type, related_photo_id, related_user_id, body, related_url)
  values (
    v_owner,
    'like_received',
    new.photo_id,
    new.user_id,
    coalesce(v_actor_username, 'someone') || ' liked your photo',
    '/photo/' || new.photo_id::text
  );

  return new;
end;
$$;

drop trigger if exists tr_notify_on_vote on public.votes;
create trigger tr_notify_on_vote after insert on public.votes
  for each row execute function public.notify_on_vote();

-- on comment insert: notify owner + parent author (with dedup)
create or replace function public.notify_on_comment()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_owner uuid;
  v_actor_username text;
  v_parent_author uuid;
begin
  select photographer_id into v_owner from public.photos where id = new.photo_id;
  select username into v_actor_username from public.users where id = new.user_id;

  -- Notify parent comment author (if this is a reply)
  if new.parent_id is not null then
    select user_id into v_parent_author from public.comments where id = new.parent_id;
    if v_parent_author is not null and v_parent_author <> new.user_id then
      insert into public.notifications (user_id, type, related_photo_id, related_user_id, body, related_url)
      values (
        v_parent_author,
        'comment_reply',
        new.photo_id,
        new.user_id,
        coalesce(v_actor_username, 'someone') || ' replied to your comment',
        '/photo/' || new.photo_id::text
      );
    end if;
  end if;

  -- Notify photo owner (skip self-comment AND skip if owner == parent author already notified above)
  if v_owner <> new.user_id
     and (new.parent_id is null or v_parent_author is null or v_owner <> v_parent_author) then
    insert into public.notifications (user_id, type, related_photo_id, related_user_id, body, related_url)
    values (
      v_owner,
      'comment_received',
      new.photo_id,
      new.user_id,
      coalesce(v_actor_username, 'someone') || ' commented on your photo',
      '/photo/' || new.photo_id::text
    );
  end if;

  return new;
end;
$$;

drop trigger if exists tr_notify_on_comment on public.comments;
create trigger tr_notify_on_comment after insert on public.comments
  for each row execute function public.notify_on_comment();
```

### Realtime publication

```sql
alter publication supabase_realtime add table public.notifications;
alter publication supabase_realtime add table public.comments;
alter publication supabase_realtime add table public.photos;
```

`votes` row events not needed by client (count comes from `photos.likes_count` via existing trigger).

### RLS verify

Existing policies (from `0001_init_schema.sql`) already cover:
- `votes`: insert own, delete own, select public.
- `comments`: insert own, update own, delete own-or-admin, select public.
- `notifications`: select own, update own. No insert policy needed (trigger is `SECURITY DEFINER`).

No RLS changes required.

---

## Section 2 — Data Layer & Hooks

### New files

```
src/lib/data/likes.ts            ← getLikeState, toggleLike
src/lib/data/comments-db.ts      ← listComments, createComment, updateComment, deleteComment
src/lib/data/notifications.ts    ← listNotifications, markRead, markAllRead
src/hooks/useNotifications.ts    ← fetch + subscribe (for current user)
src/hooks/useComments.ts         ← fetch + subscribe (for one photo)
src/hooks/useLikeState.ts        ← fetch + subscribe via photos row
```

### Existing files kept

- `src/lib/data/comments.ts` (mock) stays for seed-id photos (non-UUID). Real `/photo/[id]` flow detects UUID and uses `comments-db.ts`.
- `src/lib/data/index.ts` re-exports new modules.

### Auth gating

Each mutation helper accepts the `authUser` and returns `{ kind: 'unauth' }` when missing. Callers map that to `router.push('/login?next=' + encodeURIComponent(pathname))`.

```ts
async function toggleLike(photoId: string, authUser: User | null) {
  if (!authUser) return { kind: 'unauth' as const };
  // ...
}
```

### Hook pattern

All three realtime hooks follow the same shape:

```ts
useEffect(() => {
  // 1. initial fetch
  const channel = supabase.channel(`scope-${id}`)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'X', filter: '...' },
        (payload) => { /* update local state */ })
    .subscribe();
  return () => { supabase.removeChannel(channel); };
}, [id]);
```

---

## Section 3 — Frontend UI

### New components

```
src/components/photo/LikeButton.tsx          ← extracted from page.tsx, persistent
src/components/photo/CommentSection.tsx      ← list + new-comment form
src/components/photo/CommentItem.tsx         ← single row + reply form + edit/delete dropdown
src/components/layout/NotificationsBell.tsx  ← bell icon, badge, dropdown
src/components/layout/NotificationsListener.tsx ← subscribes + dispatches toasts
src/components/layout/Toaster.tsx            ← sonner Toaster, monochrome themed
```

### Updates to existing files

- `src/app/photo/[id]/page.tsx` — replace inline `LikeButton`, swap mock comments → `<CommentSection photoId={...} />`
- `src/components/layout/Nav.tsx` — mount `<NotificationsBell />` (only when `authUser`)
- `src/app/layout.tsx` — mount `<Toaster />` and `<NotificationsListener />` inside `<AppProvider>`
- `src/components/mobile/MobilePhoto.tsx` — switch from `prototype_likes` to `votes` (same shape, different table)
- `package.json` — add `sonner` dependency

### Bell dropdown layout

```
[ 🔔(3) ]
   ╭───────────────────────────────────╮
   │ Notifications      [Mark all read] │
   ├───────────────────────────────────┤
   │ • somnuk liked your photo "หิมะ"   │
   │   2m ago                          │
   │ • piti commented: "ภาพสวยมาก"      │
   │   12m ago                         │
   ╰───────────────────────────────────╯
```

- Show 10 most recent.
- Click an item → navigate to `related_url`, then `markRead(id)`.
- "Mark all read" → bulk update + close.
- Empty state: "No notifications yet."

### Comment thread layout

- Top-level form first (textarea + Post button).
- Then comments, newest first, each with: avatar, username, `2m ago`, body, action row (`Reply` / `Edit own` / `Delete own`).
- Replies indented 32px, nested 1 level only (reply-to-reply attaches to the same parent thread).
- `Edited` label on updated comments.
- Live-insert animation: subtle fade-in on new realtime rows.

### Toast (sonner) theme

- `position="top-right"`, `duration={5000}`.
- No rounded corners (override sonner default to match design system).
- White background, `border-rule` border, `font-sans` (Inter).
- Click → navigate to `related_url`, dismiss.

---

## Section 4 — Realtime Subscription Flow

| Channel | Scope | Filter | Used by |
|---|---|---|---|
| `notifications-<userId>` | global, when logged in | `user_id=eq.<userId>` | Bell + Toaster |
| `comments-<photoId>` | only on `/photo/[id]` | `photo_id=eq.<photoId>` | Comment thread |
| `photo-<photoId>` | only on `/photo/[id]` | `id=eq.<photoId>` | Like count + comment count |

`votes` is not subscribed from client; the existing counter trigger updates `photos.likes_count`, which the `photo-<photoId>` channel picks up.

### Lifecycle

- Mount: open channel, initial REST fetch.
- INSERT payload: append (comments) / increment badge (notifications) / fire toast.
- UPDATE payload: replace in list (edited comments / counter changes).
- DELETE payload: remove from list (deleted comments).
- Unmount: `supabase.removeChannel(channel)`.

---

## Section 5 — Edge Cases

1. **Self-action no notif** — trigger filters `photographer_id <> new.user_id`.
2. **Reply when owner == parent author** — dedup'd: only the parent-author notif fires.
3. **Duplicate like** — `unique(user_email, photo_id)` rejects insert; client catches error, rolls back optimistic UI.
4. **Unlike** — trigger fires on INSERT only; delete does not produce a notif.
5. **Edited comment** — trigger fires on INSERT only; edits do not re-notify.
6. **Offline** — notifications still persist; user catches up on next session via bell list.
7. **Photo owner views own photo** — UI normal; no notif sent to self.
8. **Auth race** — if `authUser` is null at click time, redirect to login; current path passed via `next=`.

---

## Section 6 — Scope

### In scope
- DB migration + triggers + Realtime publication.
- `votes` becomes the source of truth; `prototype_likes` dropped.
- `/photo/[id]` LikeButton + CommentSection wired to DB + realtime.
- `MobilePhoto.tsx` switched from `prototype_likes` → `votes`.
- Bell + dropdown in `Nav` + toast surface in root layout.
- Realtime for: notifications, comments thread, like/comment count.
- Auth gate: button click on unauth → redirect to `/login?next=...`.

### Out of scope (deferred, intentionally)
- Notification preferences UI. Schema has `notif_email_*` columns — left at defaults.
- Email notifications (no `email_log` writes added by this work).
- `/me/notifications` dedicated page (bell dropdown is sufficient for now).
- Follow / approval / pick notification types (other schema-defined types). Same pattern; add later.
- `@mention` parsing in comment body. Textarea placeholder mentions `@` but body stored as plain text.
- Like button on `PhotoCard` (grids). Only `/photo/[id]` detail page in this pass.
- Pagination of bell dropdown (10-row cap is fine until volume grows).

---

## Section 7 — Tests

### SQL (manual, via Supabase SQL editor or `psql`)
- Insert vote where actor ≠ owner → assert one row in `notifications` with `type='like_received'`.
- Insert vote where actor = owner → assert zero rows in `notifications`.
- Insert top-level comment where actor ≠ owner → assert one row, `type='comment_received'`.
- Insert reply where reply-author ≠ parent-author ≠ photo-owner → assert two rows (one `comment_reply`, one `comment_received`).
- Insert reply where parent-author = photo-owner → assert one row (`comment_reply` only, no dup).

### Vitest
- `notifications.ts`: notification body formatter (`somnuk liked your photo`) — pure function unit tests.
- `likes.ts`, `comments-db.ts`: thin wrappers, no extra unit tests beyond existing test suite.

### Manual verification (after `npm run dev`)
- Open `/photo/<uuid>` as user A in window 1; same URL as user B in window 2.
- In window 2: like the photo → window 1's bell badge increments, toast appears, like count ticks up.
- In window 2: post comment → window 1 sees new comment appear in thread + bell badge + toast.
- In window 1: edit own comment → window 2's thread updates body + shows "edited".
- In window 1: delete own comment → window 2's thread row disappears.
- Logged-out window 3: click like → redirected to `/login?next=/photo/<uuid>`.

### Type/build gates (run after every change)
```
npm run typecheck
npm run lint
npm test
npm run build
```

---

## Out-of-spec change

`MobilePhoto.tsx` switch from `prototype_likes` → `votes`. Required because we drop the table. Small change; no UX impact.

---

## Open questions

None. All decisions captured above.
