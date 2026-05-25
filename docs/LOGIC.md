# Gography Photo Awards — Complete Logic Specification

> **Single source of truth** สำหรับ dev — ทุก business rule, DB schema, API endpoint, flow, validation, edge case
> Use case: upload to NotebookLM / share with dev team
> Version: 1.0 (2026-05-22)
> Status: Spec frozen post-decisions Round 1 (10/10 decided) · Round 2 (R1-R8) pending — flagged ใน sections ที่กระทบ

---

## 📋 Table of Contents

0. [Document Purpose](#0-document-purpose)
1. [Project Overview & Business Context](#1-project-overview--business-context)
2. [User Roles & Permissions Matrix](#2-user-roles--permissions-matrix)
3. [Data Model — Complete DB Schema](#3-data-model--complete-db-schema)
4. [Authentication & Authorization](#4-authentication--authorization)
5. [API Specification — Every Endpoint](#5-api-specification--every-endpoint)
6. [Business Logic Rules](#6-business-logic-rules)
7. [User Flows — Sequence Diagrams](#7-user-flows--sequence-diagrams)
8. [Background Jobs / Cron](#8-background-jobs--cron)
9. [Email Notifications](#9-email-notifications)
10. [Storage & Image Handling](#10-storage--image-handling)
11. [Validation Rules — Per Form](#11-validation-rules--per-form)
12. [Error Codes & Handling](#12-error-codes--handling)
13. [Performance Requirements](#13-performance-requirements)
14. [Security Requirements](#14-security-requirements)
15. [Internationalization](#15-internationalization)
16. [Monitoring & Logging](#16-monitoring--logging)
17. [Migration Plan](#17-migration-plan)
18. [Seed Data](#18-seed-data)
19. [Environment Variables](#19-environment-variables)
20. [Testing Strategy](#20-testing-strategy)
21. [Deployment](#21-deployment)
22. [Glossary](#22-glossary)

---

## 0. Document Purpose

This document is **the complete technical contract** between business and engineering. มันบอกว่า:
- ระบบทำงานยังไง (business logic)
- Data store ใน format ใด (DB schema)
- ติดต่อกับ frontend ผ่าน endpoint ใด (API spec)
- กฎอะไรบ้าง (validation, security, rate limit)
- Edge case อะไรบ้างต้องจัดการ
- Performance + security ต้องการอะไร

Dev อ่านเอกสารนี้แล้วควรต้อง:
1. รู้ว่าต้อง build อะไรบ้าง
2. รู้ว่าอะไรไม่ใช่ scope
3. มี reference สำหรับทุก decision

ห้ามแก้เอกสารอื่นเป็น source of truth — ถ้ามี ให้แก้เอกสารนี้ + flag ขอ founder อัปเดต

---

## 1. Project Overview & Business Context

### 1.1 Mission
สร้าง **photo voting + ranking platform** สำหรับช่างภาพและลูกค้าทัวร์ Gography — inspired by 500px ในเชิงคุณภาพ + integrate กับ Gography customer reward loop

### 1.2 Why this exists
1. **Customer retention** — ลูกค้าทัวร์ Gography มีที่ที่อวดภาพ + ได้ reward → re-book
2. **Brand authority** — "Gography = ที่ของช่างภาพคุณภาพ"
3. **Content asset** — winning photos = marketing content recycle
4. **SEO + traffic** — photographer profiles = organic surface
5. **Word-of-mouth** — photographers share → drive traffic to gography.net

### 1.3 Key product decisions (locked)
| # | Decision | Value |
|---|---|---|
| Q1 | Name | "Gography Photo Awards" |
| Q2 | Domain | `ranking.gography.net` |
| Q3 | Stack | Re-use Gography Dashboard stack (Next.js 14 + Supabase) |
| Q4 | Customer detection | Manual admin assign |
| Q5 | Rewards | Cashback + "Best Photo of Season" voucher 50K THB / 4 months |
| Q6 | Anti-gaming | Gmail-only (1 Gmail = 1 vote per photo) — MVP |
| Q7 | Moderation | Auto-publish + report system + admin can hide |
| Q8 | Launch scope | Internal beta (Gography customers) first → public |
| Q9 | Color | Pure monochrome (no color accent) |
| Q10 | Photographer onboarding | Approve-based (apply → admin review) |

### 1.4 Out of scope (DO NOT BUILD)
- Multi-language (Thai only — English later)
- Mobile app (web responsive only)
- Payments / paid currency (no "Pixels" like 500px)
- DMs / messaging
- Stories / long-form blog (Phase 2)
- Photo marketplace / licensing (Phase 2 if at all)
- Quests/contests with entry fee (Round 2 — R1 pending)

### 1.5 Success metrics (12 weeks post-launch)
- Photographers approved: ≥ 50
- Photos uploaded: ≥ 500
- Registered users: ≥ 1000
- Daily active: ≥ 100
- Customer markings: ≥ 30 customers
- Best Photo of Season — 1 cycle completed

---

## 2. User Roles & Permissions Matrix

### 2.1 Role Hierarchy
```
admin (super)
  ↑
admin (regular)
  ↑
ambassador     ────┐
  ↑                │
photographer ──────┤  multiple roles per user OK
  ↑                │
customer ──────────┤
  ↑                │
regular ───────────┘
  ↑
visitor (no auth)
```

A user สามารถมีหลาย roles ร่วมกัน (e.g., photographer + customer + ambassador). Admin จะ exclusive (separate from regular users for clarity).

### 2.2 Permission Matrix

| Action | visitor | regular | customer | photographer | ambassador | admin |
|---|---|---|---|---|---|---|
| View photos (public) | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| View photographer profiles | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Search | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Like photo | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Favorite photo | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Comment | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Report photo | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Follow photographer | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Apply photographer | ❌ | ✅ | ✅ | (already) | ✅ | ✅ |
| Upload photo | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ |
| Edit own photo metadata | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ |
| Delete own photo | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ |
| Create gallery | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Eligible for cashback | ❌ | ❌ | ✅ | (if also customer) | (if also customer) | n/a |
| Eligible for Best Photo of Season | ❌ | ❌ | ✅ (with photographer) | n/a | n/a | n/a |
| Pick photo (Ambassador) | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ |
| Pick photo (Editor) | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| Approve photographer | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| Mark customer | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| Grant ambassador | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| Hide photo | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| Delete any photo | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| Resolve report | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| Create season | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| Pick season winner | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| View analytics | ❌ | (own only) | (own only) | (own only) | (own only) | ✅ (all) |
| Suspend user | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| Delete user | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ (super admin) |

### 2.3 Role assignment rules
- **regular** — default upon signup
- **customer** — admin marks (manual via /admin/customer-marking)
- **photographer** — admin approves application (apply → review)
- **ambassador** — admin invites (no self-apply, invite-only)
- **admin** — granted by super admin via direct DB only (no UI for security)

### 2.4 Role revocation
- All roles revocable except `regular` (always present)
- Revoke ambassador → photos still visible but pick badges may be re-evaluated (keep historic picks valid)
- Revoke photographer → can't upload new, existing photos remain unless deleted

---

## 3. Data Model — Complete DB Schema

### 3.1 Database
- **PostgreSQL 15+** via Supabase
- Use **uuid** as primary key (gen_random_uuid())
- All timestamps **timestamptz** (UTC stored, convert client-side for display)
- **JSONB** for flexible metadata (EXIF, settings)

### 3.2 Tables

#### 3.2.1 `users`
Extends Supabase `auth.users` via foreign key.

```sql
create table public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique not null,
  username text unique not null,  -- @username, unique, 3-30 chars, alphanumeric + underscore
  display_name text,
  bio text,  -- max 200 chars
  location text,
  avatar_url text,
  cover_url text,  -- for profile cover photo

  -- Roles
  is_admin boolean default false,
  is_super_admin boolean default false,
  is_customer boolean default false,
  is_ambassador boolean default false,
  photographer_status text default 'none'
    check (photographer_status in ('none', 'pending', 'approved', 'rejected', 'suspended')),

  -- Photographer-specific
  portfolio_url text,
  photographer_applied_at timestamptz,
  photographer_approved_at timestamptz,
  photographer_approved_by uuid references users(id),
  photographer_reject_reason text,

  -- Customer-specific
  customer_marked_by uuid references users(id),
  customer_marked_at timestamptz,
  customer_tier text check (customer_tier in (null, 'first-trip', 'returning', 'vip')),
  customer_note text,

  -- Ambassador-specific
  ambassador_invited_by uuid references users(id),
  ambassador_invited_at timestamptz,
  ambassador_bio text,  -- public bio shown when featured

  -- Privacy settings
  favorites_visibility text default 'private' check (favorites_visibility in ('public', 'private')),

  -- Account state
  suspended_until timestamptz,  -- null = not suspended
  email_verified boolean default false,

  -- Email preferences
  notif_email_like boolean default true,
  notif_email_comment boolean default true,
  notif_email_pick boolean default true,
  notif_email_weekly_digest boolean default false,
  notif_email_newsletter boolean default false,

  -- Theme
  theme_preference text default 'system' check (theme_preference in ('light', 'dark', 'system')),

  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  last_seen_at timestamptz
);

create unique index users_username_lower_idx on users(lower(username));
create index users_is_customer_idx on users(is_customer) where is_customer = true;
create index users_is_ambassador_idx on users(is_ambassador) where is_ambassador = true;
create index users_photographer_idx on users(photographer_status) where photographer_status = 'approved';
```

#### 3.2.2 `photos`
Core photo entity.

```sql
create table public.photos (
  id uuid primary key default gen_random_uuid(),
  photographer_id uuid references users(id) not null,

  -- Metadata
  title text not null,  -- max 80 chars
  slug text not null,  -- URL slug, auto-generated from title + hash
  description text,  -- max 1000 chars
  category text not null check (category in ('landscape', 'portrait', 'bw')),
  camera text,  -- e.g. "Nikon D850"
  lens text,  -- e.g. "TAMRON 15-30mm f/2.8"
  location text,  -- e.g. "Lofoten, Norway"

  -- EXIF (jsonb for flexibility)
  exif jsonb,
  /* shape:
  {
    aperture: number,  -- e.g. 22.0
    iso: integer,
    shutter: string,  -- e.g. "1/3"
    focal_length: integer,  -- mm
    date_taken: string,  -- ISO date
    gps: { lat, lng } | null
  }
  */

  -- Storage
  storage_url text not null,  -- full image
  thumbnail_url text,  -- 400px wide
  medium_url text,  -- 800px wide
  large_url text,  -- 1600px wide
  file_size integer,  -- bytes
  width integer,
  height integer,

  -- Curation (replaces is_editor_pick boolean)
  pick_type text default 'none'
    check (pick_type in ('none', 'editor', 'ambassador', 'both')),
  picked_by uuid references users(id),  -- last picker (for both, see ambassador_picks for full history)
  picked_at timestamptz,

  -- Counters (denormalized for performance, kept in sync via triggers)
  likes_count integer default 0,
  favorites_count integer default 0,
  comments_count integer default 0,
  impressions_count integer default 0,  -- updated by impression tracker

  -- Moderation
  is_hidden boolean default false,
  hidden_by uuid references users(id),
  hidden_at timestamptz,
  hidden_reason text,

  status text default 'published'
    check (status in ('draft', 'published', 'hidden', 'removed')),

  uploaded_at timestamptz default now(),
  updated_at timestamptz default now()
);

create unique index photos_slug_unique on photos(slug);
create index photos_category_idx on photos(category) where is_hidden = false and status = 'published';
create index photos_photographer_idx on photos(photographer_id);
create index photos_uploaded_idx on photos(uploaded_at desc) where is_hidden = false;
create index photos_pick_type_idx on photos(pick_type) where pick_type != 'none';

-- Trigger to auto-update updated_at
create trigger set_photos_updated_at before update on photos
  for each row execute procedure set_updated_at();
```

#### 3.2.3 `votes` (Likes)
1 Gmail = 1 vote per photo (Q6).

```sql
create table public.votes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) not null,
  user_email text not null,  -- denormalized for fast lookup (also used in anti-gaming)
  photo_id uuid references photos(id) on delete cascade not null,
  voted_at timestamptz default now(),
  unique(user_email, photo_id)  -- enforce 1 vote rule (by email)
);

create index votes_photo_idx on votes(photo_id);
create index votes_user_idx on votes(user_id);
create index votes_user_email_idx on votes(user_email);
create index votes_voted_at_idx on votes(voted_at desc);

-- Trigger to update photos.likes_count
create trigger update_photo_likes_count after insert or delete on votes
  for each row execute procedure update_photo_counters();
```

#### 3.2.4 `favorites`
Unlimited per user, doesn't affect ranking.

```sql
create table public.favorites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) not null,
  photo_id uuid references photos(id) on delete cascade not null,
  favorited_at timestamptz default now(),
  unique(user_id, photo_id)
);

create index favorites_user_idx on favorites(user_id);
create index favorites_photo_idx on favorites(photo_id);
create index favorites_at_idx on favorites(favorited_at desc);

create trigger update_photo_favorites_count after insert or delete on favorites
  for each row execute procedure update_photo_counters();
```

#### 3.2.5 `ambassador_picks`
History log of all ambassador picks.

```sql
create table public.ambassador_picks (
  id uuid primary key default gen_random_uuid(),
  ambassador_id uuid references users(id) not null,
  photo_id uuid references photos(id) on delete cascade not null,
  picked_at timestamptz default now(),
  reason text,  -- max 500 chars
  unique(ambassador_id, photo_id)
);

create index ambassador_picks_ambassador_idx on ambassador_picks(ambassador_id);
create index ambassador_picks_photo_idx on ambassador_picks(photo_id);

-- Trigger to update photos.pick_type
create trigger update_photo_pick_type after insert or delete on ambassador_picks
  for each row execute procedure update_pick_type();
```

#### 3.2.6 `editor_picks`
Separate log for editor picks (similar pattern).

```sql
create table public.editor_picks (
  id uuid primary key default gen_random_uuid(),
  editor_id uuid references users(id) not null,
  photo_id uuid references photos(id) on delete cascade not null,
  picked_at timestamptz default now(),
  unique(photo_id)  -- only 1 editor pick per photo (latest editor)
);

create index editor_picks_photo_idx on editor_picks(photo_id);
```

#### 3.2.7 `comments`
Threaded comments on photos.

```sql
create table public.comments (
  id uuid primary key default gen_random_uuid(),
  photo_id uuid references photos(id) on delete cascade not null,
  user_id uuid references users(id) not null,
  parent_id uuid references comments(id) on delete cascade,  -- null = top-level
  body text not null,  -- max 1000 chars
  is_hidden boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index comments_photo_idx on comments(photo_id) where is_hidden = false;
create index comments_user_idx on comments(user_id);
create index comments_parent_idx on comments(parent_id);

create trigger update_photo_comments_count after insert or delete on comments
  for each row execute procedure update_photo_counters();
```

#### 3.2.8 `photo_reports`
Moderation reports.

```sql
create table public.photo_reports (
  id uuid primary key default gen_random_uuid(),
  photo_id uuid references photos(id) on delete cascade not null,
  reporter_id uuid references users(id) not null,
  reason text not null
    check (reason in ('inappropriate', 'copyright', 'spam', 'other')),
  detail text,  -- max 500 chars
  reported_at timestamptz default now(),

  resolved boolean default false,
  resolved_by uuid references users(id),
  resolved_at timestamptz,
  resolution text check (resolution in (null, 'keep', 'hide', 'remove', 'warn', 'suspend'))
);

create index photo_reports_photo_idx on photo_reports(photo_id);
create index photo_reports_pending_idx on photo_reports(resolved) where resolved = false;
```

#### 3.2.9 `galleries`
User-curated photo collections.

```sql
create table public.galleries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) not null,
  name text not null,  -- max 80 chars
  description text,
  cover_photo_id uuid references photos(id),
  is_public boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table public.gallery_photos (
  gallery_id uuid references galleries(id) on delete cascade,
  photo_id uuid references photos(id) on delete cascade,
  position integer,  -- ordering
  added_at timestamptz default now(),
  primary key (gallery_id, photo_id)
);

create index galleries_user_idx on galleries(user_id);
create index gallery_photos_gallery_idx on gallery_photos(gallery_id, position);
```

#### 3.2.10 `seasons`
Best Photo of Season cycles.

```sql
create table public.seasons (
  id uuid primary key default gen_random_uuid(),
  name text not null,  -- "Spring 2026"
  start_date date not null,
  end_date date not null,
  status text default 'upcoming'
    check (status in ('upcoming', 'active', 'voting-closed', 'awarded', 'archived')),
  created_by uuid references users(id),
  created_at timestamptz default now()
);

create index seasons_status_idx on seasons(status);
create index seasons_dates_idx on seasons(start_date, end_date);
```

#### 3.2.11 `season_winners`

```sql
create table public.season_winners (
  id uuid primary key default gen_random_uuid(),
  season_id uuid references seasons(id) not null,
  category text not null check (category in ('landscape', 'portrait', 'bw')),
  photo_id uuid references photos(id) not null,
  winner_user_id uuid references users(id) not null,

  -- Voucher
  voucher_amount integer default 50000,  -- THB
  voucher_code text unique not null,
  voucher_expiry date not null,
  voucher_redeemed boolean default false,
  voucher_redeemed_at timestamptz,
  voucher_redeemed_by uuid references users(id),  -- admin who marked redemption
  voucher_booking_ref text,  -- Gography booking ID

  awarded_at timestamptz default now(),
  awarded_by uuid references users(id),
  public_announcement text,

  unique(season_id, category)
);

create index season_winners_season_idx on season_winners(season_id);
create index season_winners_user_idx on season_winners(winner_user_id);
```

#### 3.2.12 `cashback_eligibility`
Computed daily — who's eligible for cashback this period.

```sql
create table public.cashback_eligibility (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) not null,
  category text check (category in ('landscape', 'portrait', 'bw')),
  rank_position integer not null,
  percentage integer not null,  -- 15, 10, 5, 3
  eligible_from date not null,
  eligible_until date,  -- null = currently active
  computed_at timestamptz default now(),
  is_active boolean default true
);

create index cashback_user_active_idx on cashback_eligibility(user_id) where is_active = true;
```

#### 3.2.13 `cashback_redemptions`

```sql
create table public.cashback_redemptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) not null,
  eligibility_id uuid references cashback_eligibility(id),
  booking_ref text not null,  -- Gography booking ID
  amount_thb integer not null,
  percentage_used integer not null,
  redeemed_at timestamptz default now(),
  redeemed_by uuid references users(id) not null,  -- admin
  notes text
);

create index cashback_redemptions_user_idx on cashback_redemptions(user_id);
create index cashback_redemptions_year_idx on cashback_redemptions(date_trunc('year', redeemed_at));
```

#### 3.2.14 `notifications`

```sql
create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) not null,
  type text not null
    check (type in (
      'like_received', 'comment_received', 'comment_reply',
      'editor_pick', 'ambassador_pick',
      'season_winner', 'cashback_eligible',
      'photographer_approved', 'photographer_rejected',
      'customer_marked', 'ambassador_invited',
      'photo_reported', 'photo_hidden', 'photo_warned'
    )),
  related_photo_id uuid references photos(id),
  related_user_id uuid references users(id),
  related_url text,
  body text not null,
  is_read boolean default false,
  created_at timestamptz default now()
);

create index notifications_user_unread_idx on notifications(user_id) where is_read = false;
create index notifications_created_idx on notifications(created_at desc);
```

#### 3.2.15 `follows`

```sql
create table public.follows (
  follower_id uuid references users(id) on delete cascade,
  following_id uuid references users(id) on delete cascade,
  followed_at timestamptz default now(),
  primary key (follower_id, following_id)
);

create index follows_follower_idx on follows(follower_id);
create index follows_following_idx on follows(following_id);
```

#### 3.2.16 `admin_audit_logs`

```sql
create table public.admin_audit_logs (
  id uuid primary key default gen_random_uuid(),
  admin_id uuid references users(id) not null,
  action text not null,
  /* actions:
    'user.mark_customer', 'user.unmark_customer',
    'user.grant_ambassador', 'user.revoke_ambassador',
    'user.suspend', 'user.unsuspend', 'user.delete',
    'photographer.approve', 'photographer.reject',
    'photo.hide', 'photo.unhide', 'photo.remove', 'photo.editor_pick', 'photo.unpick',
    'report.resolve', 'report.dismiss',
    'season.create', 'season.pick_winner',
    'cashback.redeem'
  */
  target_type text not null,  -- 'user', 'photo', 'report', 'season', etc.
  target_id uuid,
  detail jsonb,  -- additional context (before/after, notes)
  ip_address text,
  user_agent text,
  created_at timestamptz default now()
);

create index audit_logs_admin_idx on admin_audit_logs(admin_id);
create index audit_logs_target_idx on admin_audit_logs(target_type, target_id);
create index audit_logs_created_idx on admin_audit_logs(created_at desc);
```

#### 3.2.17 `email_log`
Track sent emails for debugging + delivery audit.

```sql
create table public.email_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id),
  to_email text not null,
  template text not null,  -- 'welcome', 'photographer_approved', 'season_winner', etc.
  subject text,
  body_html text,
  sent_at timestamptz default now(),
  status text default 'queued' check (status in ('queued', 'sent', 'failed', 'bounced')),
  provider_id text,  -- Resend message ID
  error_message text
);

create index email_log_user_idx on email_log(user_id);
create index email_log_status_idx on email_log(status);
```

### 3.3 Materialized Views

#### 3.3.1 `photo_scores` (pulse + rankings)
```sql
create materialized view photo_scores as
select
  p.id as photo_id,
  p.photographer_id,
  p.category,
  p.uploaded_at,
  p.pick_type,

  -- Counters (from denormalized + verified)
  p.likes_count as total_likes,

  -- Velocity (likes in time windows)
  count(v.id) filter (where v.voted_at > now() - interval '24 hours') as likes_24h,
  count(v.id) filter (where v.voted_at > now() - interval '7 days') as likes_7d,
  count(v.id) filter (where v.voted_at > now() - interval '30 days') as likes_30d,

  -- Pulse score (the formula)
  (
    p.likes_count * 1.0
    + count(v.id) filter (where v.voted_at > now() - interval '24 hours') * 3.0
    + case
        when p.pick_type = 'both' then 100
        when p.pick_type = 'editor' then 50
        when p.pick_type = 'ambassador' then 50
        else 0
      end
  ) / GREATEST(EXTRACT(epoch FROM (now() - p.uploaded_at)) / 3600, 1) as pulse_score,

  -- Hours since upload
  EXTRACT(epoch FROM (now() - p.uploaded_at)) / 3600 as hours_since_upload

from photos p
left join votes v on v.photo_id = p.id
where p.is_hidden = false and p.status = 'published'
group by p.id;

create unique index photo_scores_pk on photo_scores(photo_id);
create index photo_scores_pulse_idx on photo_scores(pulse_score desc);
create index photo_scores_category_pulse_idx on photo_scores(category, pulse_score desc);
create index photo_scores_photographer_idx on photo_scores(photographer_id);

-- Refresh schedule (Supabase pg_cron):
-- */5 * * * *  REFRESH MATERIALIZED VIEW CONCURRENTLY photo_scores
```

#### 3.3.2 `photographer_stats` (aggregate per photographer)
```sql
create materialized view photographer_stats as
select
  u.id as user_id,
  count(p.id) as total_photos,
  sum(p.likes_count) as total_likes,
  sum(p.favorites_count) as total_favorites,
  sum(p.impressions_count) as total_impressions,
  avg(ps.pulse_score) as avg_pulse,
  max(ps.pulse_score) as peak_pulse,
  count(p.id) filter (where p.pick_type != 'none') as picks_received
from users u
left join photos p on p.photographer_id = u.id and p.is_hidden = false
left join photo_scores ps on ps.photo_id = p.id
where u.photographer_status = 'approved'
group by u.id;

create unique index photographer_stats_pk on photographer_stats(user_id);

-- Refresh: 0 */6 * * *  (every 6 hours)
```

### 3.4 Row Level Security (RLS) Policies

#### users
```sql
alter table users enable row level security;

-- Anyone can read public profile fields
create policy users_select_public on users for select using (true);

-- Users can only update own row
create policy users_update_own on users for update
  using (auth.uid() = id) with check (auth.uid() = id);

-- Only admin can insert (via handle_new_user trigger from auth)
-- Only super_admin can delete
create policy users_delete_super_admin on users for delete
  using (exists (select 1 from users where id = auth.uid() and is_super_admin = true));
```

#### photos
```sql
alter table photos enable row level security;

-- Public read for non-hidden
create policy photos_select_public on photos for select
  using (is_hidden = false and status = 'published');

-- Owner reads all own photos (including hidden)
create policy photos_select_own on photos for select
  using (photographer_id = auth.uid());

-- Admin reads all
create policy photos_select_admin on photos for select
  using (exists (select 1 from users where id = auth.uid() and is_admin = true));

-- Only approved photographers can insert
create policy photos_insert_photographer on photos for insert
  with check (
    photographer_id = auth.uid()
    and exists (select 1 from users where id = auth.uid() and photographer_status = 'approved')
  );

-- Owner can update own (limited fields enforced in API layer)
create policy photos_update_own on photos for update
  using (photographer_id = auth.uid());

-- Admin can update any
create policy photos_update_admin on photos for update
  using (exists (select 1 from users where id = auth.uid() and is_admin = true));

-- Owner can delete own
create policy photos_delete_own on photos for delete
  using (photographer_id = auth.uid());

-- Admin can delete any
create policy photos_delete_admin on photos for delete
  using (exists (select 1 from users where id = auth.uid() and is_admin = true));
```

#### votes
```sql
alter table votes enable row level security;

-- Public read (for counts)
create policy votes_select_public on votes for select using (true);

-- Auth users can insert their own vote
create policy votes_insert_own on votes for insert
  with check (user_id = auth.uid() and user_email = auth.jwt() ->> 'email');

-- Auth users can delete their own vote (unlike)
create policy votes_delete_own on votes for delete
  using (user_id = auth.uid());
```

#### favorites
Similar pattern to votes — public read, own insert/delete.

#### Other tables
- `comments` — public read non-hidden, auth insert own, owner/admin delete
- `photo_reports` — own read, auth insert, admin manage
- `seasons` — public read, admin manage
- `cashback_*` — own read, admin manage
- `notifications` — own read only
- `admin_audit_logs` — admin read only

---

## 4. Authentication & Authorization

### 4.1 Auth Provider
- **Supabase Auth** + Google OAuth provider
- **Gmail required** (Q6) — accept any Google account (Gmail or Google Workspace)
- Session management via Supabase (httpOnly cookie)

### 4.2 OAuth Configuration
```env
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
NEXT_PUBLIC_GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
```

Supabase dashboard:
- Enable Google provider
- Redirect URLs: `https://ranking.gography.net/auth/callback`, `http://localhost:3000/auth/callback`
- Scopes: `email profile openid`

### 4.3 Auth Flow (Sign In)

```
1. User clicks "Sign in with Google"
2. Redirect to Google OAuth: /auth/v1/authorize?provider=google&redirect_to=/auth/callback
3. Google consent → callback with code
4. Supabase exchanges code → session
5. Cookie set: sb-access-token (httpOnly)
6. Server reads session in middleware → user identified
7. First-time: insert into public.users via trigger handle_new_user
8. Redirect: /onboarding (new) or return_url (existing)
```

### 4.4 `handle_new_user` Trigger
```sql
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, email, username, display_name, avatar_url)
  values (
    new.id,
    new.email,
    coalesce(  -- auto-generate username from email if not provided
      new.raw_user_meta_data ->> 'username',
      regexp_replace(split_part(new.email, '@', 1), '[^a-zA-Z0-9_]', '', 'g') || '_' || substr(new.id::text, 1, 4)
    ),
    new.raw_user_meta_data ->> 'full_name',
    new.raw_user_meta_data ->> 'avatar_url'
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
```

### 4.5 Authorization Middleware (Next.js)

```typescript
// middleware.ts pseudocode
export async function middleware(req: Request) {
  const session = await getSupabaseSession(req);

  // Public routes — no check
  if (PUBLIC_PATHS.includes(req.nextUrl.pathname)) return NextResponse.next();

  // Auth required
  if (!session) return NextResponse.redirect(`/login?return=${req.nextUrl.pathname}`);

  // Admin route check
  if (req.nextUrl.pathname.startsWith('/admin')) {
    const { data: user } = await supabase.from('users').select('is_admin').eq('id', session.user.id).single();
    if (!user?.is_admin) return new Response('Forbidden', { status: 403 });
  }

  // Photographer-only routes
  if (req.nextUrl.pathname.startsWith('/upload')) {
    const { data: user } = await supabase.from('users').select('photographer_status').eq('id', session.user.id).single();
    if (user?.photographer_status !== 'approved') return NextResponse.redirect('/apply-photographer');
  }

  return NextResponse.next();
}
```

### 4.6 Session Refresh
- Access token expires 1 hour
- Refresh token expires 30 days
- Supabase auto-refreshes via cookie
- On 401 from API → trigger client-side refresh → retry once → if still 401, logout + redirect to login

### 4.7 Logout
- POST /api/auth/signout → Supabase clears session
- Redirect to /

---

## 5. API Specification — Every Endpoint

### 5.1 Conventions
- **REST + JSON**
- **Base URL:** `https://ranking.gography.net/api`
- **Auth:** Bearer token (Supabase JWT) or session cookie
- **Errors:** Return `{ error: { code, message, field? } }` with HTTP status
- **Pagination:** Cursor-based (`?cursor=xxx&limit=24`)
- **Rate limit:** 100 req/min per IP (general), 30 req/min for vote/favorite

### 5.2 Public Endpoints (no auth needed)

#### GET `/api/photos`
List photos with filters.

**Query params:**
| Param | Type | Default | Description |
|---|---|---|---|
| `category` | string | (all) | landscape \| portrait \| bw |
| `sort` | string | `pulse` | pulse \| new \| likes \| picks |
| `time` | string | `all` | 24h \| 7d \| 30d \| season \| all |
| `cursor` | string | — | pagination cursor |
| `limit` | int | 24 | max 50 |

**Response 200:**
```json
{
  "data": [
    {
      "id": "uuid",
      "title": "Lofoten Sunrise",
      "slug": "lofoten-sunrise-abc123",
      "category": "landscape",
      "thumbnail_url": "...",
      "medium_url": "...",
      "width": 4000,
      "height": 3000,
      "photographer": {
        "id": "uuid",
        "username": "ariel",
        "display_name": "Ariel L",
        "avatar_url": "...",
        "is_ambassador": true
      },
      "stats": {
        "likes": 238,
        "favorites": 12,
        "pulse_score": 47.5,
        "impressions": 24200
      },
      "pick_type": "ambassador",
      "uploaded_at": "2026-03-25T10:30:00Z"
    }
  ],
  "next_cursor": "..." | null
}
```

**Errors:**
- 400 invalid query param

---

#### GET `/api/photos/:id`
Single photo detail.

**Response 200:**
```json
{
  "id": "uuid",
  "title": "...",
  "slug": "...",
  "description": "...",
  "category": "landscape",
  "camera": "Nikon D850",
  "lens": "TAMRON 15-30mm",
  "location": "Lofoten, Norway",
  "exif": {
    "aperture": 22.0,
    "iso": 64,
    "shutter": "1/3",
    "focal_length": 30
  },
  "thumbnail_url": "...",
  "medium_url": "...",
  "large_url": "...",
  "width": 4000,
  "height": 3000,
  "pick_type": "ambassador",
  "photographer": { /* full profile */ },
  "stats": { /* same as list */ },
  "uploaded_at": "...",
  "is_liked_by_me": false,  -- only if auth'd
  "is_favorited_by_me": false  -- only if auth'd
}
```

**Errors:**
- 404 photo not found / hidden / removed

---

#### GET `/api/photographers/:username`
Photographer profile.

**Response 200:**
```json
{
  "id": "uuid",
  "username": "ariel",
  "display_name": "Ariel L",
  "bio": "...",
  "location": "New York City",
  "avatar_url": "...",
  "cover_url": "...",
  "is_ambassador": true,
  "is_customer": false,
  "stats": {
    "total_photos": 24,
    "total_likes": 1234,
    "total_favorites": 156,
    "followers": 89,
    "following": 23,
    "peak_pulse": 87.5
  },
  "is_followed_by_me": false  -- only if auth'd
}
```

**Errors:**
- 404 username not found

---

#### GET `/api/photographers/:username/photos`
Photographer's photos.

Same as `/api/photos` but filtered by photographer.

---

#### GET `/api/photographers/:username/galleries`
Public galleries.

**Response 200:**
```json
{
  "data": [
    {
      "id": "uuid",
      "name": "Best Sunsets",
      "description": "...",
      "cover_photo_url": "...",
      "photo_count": 12,
      "created_at": "..."
    }
  ]
}
```

---

#### GET `/api/photographers/:username/favorites`
Only returns data if photographer has `favorites_visibility = 'public'`.

**Response 200 or 403** (if private).

---

#### GET `/api/hall-of-fame`
List all season winners.

**Response 200:**
```json
{
  "seasons": [
    {
      "name": "Spring 2026",
      "start_date": "2026-01-01",
      "end_date": "2026-04-30",
      "status": "awarded",
      "winners": [
        {
          "category": "landscape",
          "photo": { /* photo object */ },
          "winner": { /* user object */ },
          "voucher_amount": 50000,
          "awarded_at": "..."
        }
      ]
    }
  ]
}
```

---

#### GET `/api/ambassadors`
List of active ambassadors.

**Response 200:**
```json
{
  "data": [
    {
      "id": "uuid",
      "username": "ariel",
      "display_name": "Ariel L",
      "avatar_url": "...",
      "ambassador_bio": "...",
      "picks_count": 142
    }
  ]
}
```

---

#### GET `/api/search`
Search photos + photographers + galleries.

**Query params:**
| Param | Type | Description |
|---|---|---|
| `q` | string | search query (required, min 2 chars) |
| `type` | string | photos \| photographers \| galleries \| all (default) |
| `limit` | int | default 24 |

**Response 200:**
```json
{
  "photos": [ ... ],
  "photographers": [ ... ],
  "galleries": [ ... ]
}
```

**Errors:**
- 400 query too short

---

#### GET `/api/photos/:id/comments`
Comments thread.

**Response 200:**
```json
{
  "data": [
    {
      "id": "uuid",
      "user": { "username", "display_name", "avatar_url" },
      "body": "...",
      "created_at": "...",
      "replies": [ /* nested */ ]
    }
  ],
  "total": 15
}
```

---

#### GET `/api/photos/:id/similar`
Similar photos (same category, similar tags via heuristic).

**Response 200:** array of photo cards.

---

#### GET `/api/photos/:id/featured-galleries`
Galleries that contain this photo.

**Response 200:** array of gallery cards.

---

### 5.3 Auth Endpoints

#### POST `/api/auth/signout`
Logout.

**Response 200** + clear cookie.

---

#### GET `/api/auth/me`
Get current user.

**Response 200:**
```json
{
  "id": "uuid",
  "email": "...",
  "username": "...",
  "display_name": "...",
  "avatar_url": "...",
  "roles": ["regular", "photographer", "ambassador"],
  "is_customer": true,
  "is_admin": false,
  "photographer_status": "approved",
  "unread_notifications": 3
}
```

**401** if not logged in.

---

### 5.4 User Endpoints (auth required)

#### POST `/api/photos/:id/vote`
Toggle vote (like).

**Logic:**
- If vote exists for (user_email, photo_id) → DELETE (unlike)
- Else → INSERT

**Response 200:**
```json
{
  "is_liked": true,
  "likes_count": 239
}
```

**Errors:**
- 401 not auth
- 404 photo not found
- 429 rate limit (30/min)

---

#### POST `/api/photos/:id/favorite`
Toggle favorite.

**Response 200:**
```json
{
  "is_favorited": true,
  "favorites_count": 13
}
```

---

#### GET `/api/me/favorites`
My favorited photos.

**Response 200:** array of photo cards.

---

#### POST `/api/photos/:id/report`
Report a photo.

**Request body:**
```json
{
  "reason": "inappropriate" | "copyright" | "spam" | "other",
  "detail": "optional text max 500 chars"
}
```

**Response 200:**
```json
{ "ok": true, "message": "Report submitted" }
```

**Errors:**
- 400 invalid reason
- 401 not auth
- 409 already reported by this user

---

#### POST `/api/photos/upload`
Upload photo (photographer only).

**Request:** multipart/form-data
- `file` (required, < 25 MB, JPEG/PNG/WebP)
- `title` (required, max 80 chars)
- `category` (required, landscape|portrait|bw)
- `description` (optional, max 1000)
- `camera` (optional)
- `lens` (optional)
- `location` (optional)

**Logic:**
1. Validate file (type + size)
2. Upload to Supabase Storage `ranking-photos/{user_id}/{photo_id}.jpg`
3. Generate thumbnails via Sharp or Vercel Image API (400/800/1600)
4. Extract EXIF via `exifr` library
5. Insert into photos table
6. Return photo object

**Response 201:**
```json
{
  "id": "uuid",
  "slug": "lofoten-sunrise-abc123",
  "url": "/photo/uuid/lofoten-sunrise-abc123"
}
```

**Errors:**
- 401 not auth
- 403 not photographer
- 413 file too large
- 415 unsupported file type
- 422 missing required field

---

#### PATCH `/api/photos/:id`
Edit own photo metadata.

**Request body:** any updatable fields (title, description, category, camera, lens, location)

**Logic:**
- Only owner can update
- Cannot change `photographer_id`

**Response 200:** updated photo.

**Errors:**
- 401, 403, 404

---

#### DELETE `/api/photos/:id`
Delete own photo.

**Logic:**
1. Delete photo storage files (all sizes)
2. Cascade delete votes, favorites, comments, reports
3. Soft delete via `status = 'removed'` for audit (don't hard delete row)

**Response 204** no content.

---

#### POST `/api/me/follow/:username`
Follow a photographer.

**Response 200:** `{ "is_following": true }`

---

#### DELETE `/api/me/follow/:username`
Unfollow.

**Response 204**.

---

#### POST `/api/photos/:id/comments`
Post a comment.

**Request body:**
```json
{
  "body": "max 1000 chars",
  "parent_id": "uuid" | null
}
```

**Response 201:** comment object.

---

#### DELETE `/api/comments/:id`
Delete own comment (or admin).

---

#### POST `/api/galleries`
Create gallery.

**Request body:**
```json
{
  "name": "Best Sunsets",
  "description": "...",
  "is_public": false
}
```

---

#### POST `/api/galleries/:id/photos`
Add photo to gallery.

**Request body:**
```json
{ "photo_id": "uuid" }
```

---

#### PATCH `/api/me/profile`
Update own profile.

**Request body:** any of {display_name, bio, location, avatar_url, cover_url, favorites_visibility, notif_*, theme_preference}

---

#### POST `/api/me/apply-photographer`
Submit photographer application.

**Request body:**
```json
{
  "bio": "...",
  "portfolio_url": "https://...",
  "why": "optional reason",
  "sample_photos": ["url1", "url2", ...]  -- optional, max 5
}
```

**Logic:**
- Validate `portfolio_url` is valid URL
- Set `photographer_status = 'pending'`
- Email admin: "New application from @user"

**Response 201:** `{ "ok": true, "applied_at": "..." }`

**Errors:**
- 409 already approved or pending

---

#### GET `/api/me/stats`
Personal analytics.

**Query params:**
- `period` = `7d` | `30d` | `90d` | `all`

**Response 200:**
```json
{
  "period": "30d",
  "metrics": {
    "impressions": 1200,
    "impressions_delta_pct": 12,
    "likes": 234,
    "likes_delta_pct": 8,
    "favorites": 45,
    "favorites_delta_pct": 18,
    "peak_pulse": 47.5
  },
  "top_photos": [ ... ],
  "engagement_chart": [
    { "date": "...", "likes": 12, "favorites": 3, "impressions": 89 }
  ],
  "category_breakdown": {
    "landscape": 45,
    "portrait": 30,
    "bw": 25
  }
}
```

---

#### GET `/api/me/notifications`
List notifications.

**Query params:** `?unread_only=true&limit=20`

**Response 200:** array of notification objects.

---

#### POST `/api/me/notifications/:id/read`
Mark as read.

---

#### POST `/api/me/notifications/read-all`
Mark all as read.

---

### 5.5 Ambassador Endpoints

#### POST `/api/ambassador/pick/:photoId`
Pick a photo (ambassador only).

**Request body:**
```json
{ "reason": "optional why" }
```

**Logic:**
1. Insert into `ambassador_picks`
2. Trigger updates `photos.pick_type` to 'ambassador' or 'both' (if editor already picked)

**Response 200:** `{ "ok": true }`

---

#### DELETE `/api/ambassador/pick/:photoId`
Unpick.

---

#### GET `/api/ambassador/my-picks`
List own picks.

---

### 5.6 Admin Endpoints (admin only)

All require `is_admin = true` (super admin where noted).

#### GET `/api/admin/overview`
Dashboard summary.

**Response 200:**
```json
{
  "pending_applications": 5,
  "pending_reports": 12,
  "new_signups_7d": 45,
  "new_uploads_7d": 234,
  "total_users": 1234,
  "total_photos": 5678,
  "top_pulse_today": { "photo": {...}, "pulse": 87.5 }
}
```

---

#### GET `/api/admin/users`
List users with filter.

**Query params:**
| Param | Type |
|---|---|
| `role` | regular \| customer \| photographer \| ambassador \| admin |
| `search` | string (email/username) |
| `cursor` | pagination |
| `limit` | default 50 |

**Response 200:** array of user objects with role flags.

---

#### PATCH `/api/admin/users/:id/mark-customer`
Mark user as customer.

**Request body:**
```json
{
  "is_customer": true,
  "customer_tier": "first-trip" | "returning" | "vip" | null,
  "customer_note": "Booked Iceland Apr 2026"
}
```

**Logic:**
- Update users + log to admin_audit_logs
- Send notification + email to user

---

#### PATCH `/api/admin/users/:id/grant-ambassador`
Invite as ambassador.

**Request body:**
```json
{
  "ambassador_bio": "...",
  "welcome_message": "optional"
}
```

**Logic:**
- Update users.is_ambassador = true
- Email user with invitation
- Log to audit

---

#### DELETE `/api/admin/users/:id/revoke-ambassador`
Revoke ambassador status.

**Request body:**
```json
{ "reason": "required" }
```

---

#### PATCH `/api/admin/users/:id/suspend`
Suspend user.

**Request body:**
```json
{
  "suspended_until": "2026-06-30",
  "reason": "..."
}
```

---

#### DELETE `/api/admin/users/:id` (super admin only)
Delete user (cascades photos, votes, etc).

**Request body:**
```json
{ "confirmation": "DELETE", "reason": "..." }
```

---

#### GET `/api/admin/photographer-applications`
List applications.

**Query params:** `?status=pending|approved|rejected`

---

#### PATCH `/api/admin/photographer-applications/:userId`
Approve or reject.

**Request body:**
```json
{
  "decision": "approve" | "reject",
  "reject_reason": "if reject"
}
```

**Logic:**
- Update users.photographer_status
- Email user
- Log audit

---

#### GET `/api/admin/reports`
List reports.

**Query params:** `?status=pending|resolved`

---

#### PATCH `/api/admin/reports/:id`
Resolve report.

**Request body:**
```json
{
  "resolution": "keep" | "hide" | "remove" | "warn" | "suspend",
  "internal_note": "optional"
}
```

**Logic per resolution:**
- `keep` — mark resolved, no action
- `hide` — set photos.is_hidden = true
- `remove` — set photos.status = 'removed' (soft delete) + storage delete
- `warn` — keep photo + email photographer warning
- `suspend` — keep photo + suspend photographer 7 days

Email reporter regardless.

---

#### PATCH `/api/admin/photos/:id/editor-pick`
Toggle editor pick.

**Request body:**
```json
{ "is_picked": true }
```

**Logic:**
- Insert/delete from editor_picks
- Trigger updates photos.pick_type accordingly
- Email photographer if picked

---

#### POST `/api/admin/seasons`
Create season.

**Request body:**
```json
{
  "name": "Spring 2026",
  "start_date": "2026-01-01",
  "end_date": "2026-04-30"
}
```

---

#### POST `/api/admin/seasons/:id/winners`
Pick a winner for a category.

**Request body:**
```json
{
  "category": "landscape",
  "photo_id": "uuid",
  "voucher_amount": 50000,
  "voucher_expiry": "2027-04-30",
  "public_announcement": "optional"
}
```

**Logic:**
- Insert season_winners + auto-generate voucher_code (`GPA-SPR2026-L`)
- Email winner
- Notification to winner
- Trigger emails to all photographers (announcement)
- Log audit

---

#### POST `/api/admin/cashback/redeem`
Mark cashback redemption.

**Request body:**
```json
{
  "user_id": "uuid",
  "booking_ref": "GG-2026-1234",
  "amount_thb": 8000,
  "percentage_used": 10,
  "eligibility_id": "uuid",
  "notes": "optional"
}
```

**Logic:**
- Validate user is currently eligible
- Insert cashback_redemptions
- Check annual cap (20K THB/year) — error if exceeded

---

#### GET `/api/admin/analytics`
Site-wide metrics.

**Response 200:** dashboard stats.

---

#### GET `/api/admin/audit-logs`
Query audit logs.

**Query params:** `?admin_id=&action=&target_type=&date_from=&date_to=`

---

### 5.7 Error Response Format

All errors return:
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Title is required",
    "field": "title"  -- if field-specific
  }
}
```

HTTP status as appropriate (400/401/403/404/409/422/429/500).

---

## 6. Business Logic Rules

### 6.1 Pulse Score Algorithm

**Formula:**
```
pulse = (total_likes × 1.0 + likes_24h × 3.0 + curation_bonus) / max(hours_since_upload, 1)

curation_bonus =
  100  if pick_type = 'both'
  50   if pick_type = 'editor' OR pick_type = 'ambassador'
  0    otherwise
```

**Rules:**
- Computed in materialized view, refreshed every 5 min
- Display on photo detail + admin
- Used for sort `?sort=pulse` (default)
- Used to determine top photos for cashback eligibility
- Transparent: explained on `/about-ranking` page

**Example calculations:**

| Likes | Likes 24h | Pick | Hours | Pulse |
|---|---|---|---|---|
| 100 | 50 | none | 6 | (100 + 150 + 0) / 6 = **41.7** |
| 100 | 0 | none | 168 | (100 + 0 + 0) / 168 = **0.6** |
| 30 | 30 | editor | 5 | (30 + 90 + 50) / 5 = **34** |
| 30 | 30 | both | 5 | (30 + 90 + 100) / 5 = **44** |

### 6.2 Voting Rules

- **1 user = 1 vote per photo** (enforced by unique(user_email, photo_id))
- Toggle (click again = unvote)
- Anonymous users → modal "Sign in to vote"
- Rate limit: 30 votes/min per IP (anti-spam)
- Vote affects pulse immediately (next refresh cycle = 5 min)

### 6.3 Favoriting Rules

- **Unlimited per user** (no constraint on count)
- Toggle (click again = unfavorite)
- Does NOT affect pulse
- Saved to personal "My Favorites"
- Visibility: per user setting (`favorites_visibility` = public | private, default private)

### 6.4 Photo Upload Rules

**Constraints:**
- Only photographer role (status = 'approved')
- File: JPEG/PNG/WebP only
- Size: max 25 MB
- Dimensions: min 1000×1000, max 8000×8000
- Title: required, max 80 chars
- Category: required (landscape|portrait|bw)
- Auto-strip GPS from EXIF if user opts (privacy setting — future)

**Storage:**
- Path: `ranking-photos/{photographer_id}/{photo_id}/{size}.jpg`
- Sizes generated: thumbnail (400), medium (800), large (1600), original
- Compression: 85% JPEG quality (Sharp)

**Limits:**
- Max 5 uploads per minute (rate limit)
- Max 10 uploads per day for new photographers (first 30 days)
- No daily limit after 30 days

### 6.5 Curation Rules

**Editor Pick:**
- Admin only
- 1 admin can pick (any), unpick latest editor's pick
- `editor_picks` table: unique(photo_id) — only 1 editor pick per photo (any admin)
- Updates photos.pick_type to 'editor' (or 'both' if already ambassador-picked)

**Ambassador Pick:**
- Ambassador only
- Multiple ambassadors can pick same photo (each has own entry)
- `ambassador_picks` table: unique(ambassador_id, photo_id) — each ambassador picks photo ละ 1 ครั้ง
- Photo has `pick_type = 'ambassador'` if ≥1 ambassador picked
- Updates to 'both' if also editor-picked

**Pulse bonus:**
- 'editor' or 'ambassador' = +50
- 'both' = +100

**Removal:**
- Unpick removes record + recalc pick_type
- E.g. ambassador unpicks: if no other ambassador picked + no editor → pick_type = 'none'

### 6.6 Customer Marking Rules (Q4 = Manual)

- Admin manually marks users as customer (no auto-detection from booking DB in MVP)
- User receives notification + email
- Customer flag enables:
  - Eligible for Best Photo of Season
  - Eligible for cashback if in top 10 ranking
  - Photos appear in "Customer Section" on landing
  - Profile shows "🏆 Customer" badge

**Unmark:**
- Admin can revoke
- Reason required
- User notified
- Past wins/cashback remain valid (don't claw back)

### 6.7 Rewards Calculation

**Best Photo of Season:**
- 3 winners per season (1 per category)
- Voucher 50,000 THB each (= 450K/year)
- Expiry: 12 months from award
- Eligibility: customer-uploaded photos, posted during season window

**Cashback tier (R7 pending — using default):**
| Rank in any category | Cashback % |
|---|---|
| #1 | 15% |
| #2-5 | 10% |
| #6-10 | 5% |
| #11-50 | 3% |
| #51+ | 0% |

**Annual cap:** 20,000 THB per customer per calendar year

**Cashback redemption:**
- Customer books Gography trip
- Sales team checks `/admin/cashback` for eligible customer
- Apply discount manually in invoice
- Log redemption via admin endpoint
- Cashback "used" for that booking but eligibility remains for next booking (unless cap hit)

### 6.8 Cashback Eligibility Job (daily cron)

Pseudocode:
```
For each customer (is_customer = true):
  Find best rank across all 3 categories (lowest rank_position)
  Calculate tier per matrix above
  UPSERT cashback_eligibility:
    user_id, category, rank_position, percentage,
    eligible_from = today,
    eligible_until = null,
    is_active = true

  If user dropped out of top 50:
    UPDATE existing eligibility SET is_active = false, eligible_until = today
```

### 6.9 Moderation Rules

**Auto-publish** (Q7 = C):
- Photo published immediately on upload
- No pre-moderation queue

**Reporting:**
- Any authenticated user can report
- 1 user = 1 report per photo
- Report stored, admin reviews

**Auto-hide threshold (Phase 2):**
- If photo receives ≥10 reports in 24h → auto-hide pending admin review
- Email admin + photographer
- Status set to 'hidden' temporarily

**Admin actions on report:**
- `keep` — dismiss, no change
- `hide` — set `is_hidden = true` (still in DB)
- `remove` — set `status = 'removed'` (soft delete) + storage cleanup
- `warn` — email photographer warning
- `suspend` — set `suspended_until = now() + 7 days`, hide all their photos

### 6.10 Photographer Approval Rules

**Eligibility to apply:**
- Authenticated user
- `photographer_status` = 'none' or 'rejected' (cannot apply if 'pending' or 'approved')
- If rejected: must wait 30 days before re-applying

**Application content (required):**
- bio (10-200 chars)
- portfolio_url (valid URL)

**Optional:**
- Why text
- Sample photo URLs (max 5)

**Admin review:**
- View bio + visit portfolio URL
- Approve or reject (with reason)

**On approval:**
- `photographer_status = 'approved'`
- User can upload immediately
- Email: "Welcome — start uploading"
- Notification

**On rejection:**
- `photographer_status = 'rejected'`
- `photographer_reject_reason` stored
- Email user with reason
- 30-day cooldown before re-apply

### 6.11 Comment Rules

- Length: max 1000 chars
- Threading: 1 level deep (replies, no nested replies)
- Edit: own comment, within 15 min of posting
- Delete: own comment anytime, admin any time
- Reports: comments can be reported (separate from photo reports — future)

### 6.12 Follow Rules

- 1 user can follow another (no mutual follow concept)
- Follows are public (visible on profiles)
- Affects: feed (Following tab — future), notifications (when followed user uploads — future)

---

## 7. User Flows — Sequence Diagrams

### Flow 1: Anonymous user votes
```
User    Browser         Backend         DB
 |        |               |              |
 | click  |               |              |
 |------->|               |              |
 |        |  POST /vote   |              |
 |        |-------------->|              |
 |        |               | check auth   |
 |        |               | -> null      |
 |        |  401 + need_auth             |
 |        |<--------------|              |
 |        | show login    |              |
 | click Google OAuth                    |
 |------->|               |              |
 |        |  redirect to Google          |
 |        | ...OAuth...   |              |
 |        |  callback     |              |
 |        |<--------------|              |
 |        |  session set  |              |
 |        |  retry POST /vote            |
 |        |-------------->|              |
 |        |               |  INSERT vote |
 |        |               |------------->|
 |        |               |  trigger update photos.likes_count
 |        |  200 + new count             |
 |        |<--------------|              |
 |  UI updates: heart filled + count +1
```

### Flow 2: Photographer uploads
```
Photographer  Browser     Backend            Storage   DB
     |          |           |                  |       |
     | go to /upload        |                  |       |
     |          | check role: photographer? -> ok      |
     | drag file|           |                  |       |
     | fill form|           |                  |       |
     | click Publish        |                  |       |
     |--------->|           |                  |       |
     |          | POST /upload (multipart)     |       |
     |          |---------->|                  |       |
     |          |           | validate file    |       |
     |          |           | upload original  |       |
     |          |           |----------------->|       |
     |          |           | generate thumbs (sharp)  |
     |          |           |----------------->|       |
     |          |           | extract EXIF (exifr)     |
     |          |           | INSERT photo             |
     |          |           |------------------------->|
     |          | 201 + photo URL                      |
     |          |<----------|                          |
     | redirect /photo/:id  |                          |
     |          |           |  --- async ---           |
     |          |           |  trigger notifications   |
     |          |           |  (followers - future)    |
```

### Flow 3: Admin marks customer
```
Admin    Browser           Backend         DB        Email
  |        |                 |             |          |
  | /admin/customer-marking  |             |          |
  | search "ariel@gmail"     |             |          |
  | select user, fill form   |             |          |
  | click Confirm Mark       |             |          |
  |------->|                 |             |          |
  |        | PATCH /admin/users/:id/mark-customer
  |        |---------------->|             |          |
  |        |                 | check admin role  |    |
  |        |                 | UPDATE users SET is_customer=true...
  |        |                 |------------>|          |
  |        |                 | INSERT admin_audit_logs
  |        |                 |------------>|          |
  |        |                 | INSERT notifications   |
  |        |                 |------------>|          |
  |        |                 | queue email (async)    |
  |        |                 |----------------------->|
  |        |  200 ok         |             |          |
  |        |<----------------|             |          |
  | Toast: "User marked as customer"       |          |
  |                          |             |          |
  |                          |  --- async ----------- |
  |                          |             |  send email
```

### Flow 4: Season winner selection
```
Admin           Backend              DB           Email
  |               |                   |             |
  | navigate to /admin/seasons        |             |
  |               | GET /admin/seasons/:id          |
  | select season, view top 10 per category         |
  | click "Pick Winner" for Landscape |             |
  | select photo, confirm voucher info|             |
  | submit                            |             |
  |-------------->|                   |             |
  |               | POST /admin/seasons/:id/winners |
  |               |------------------------------>  |
  |               | validate: season status, no existing winner for category
  |               | generate voucher_code: GPA-SPR2026-L
  |               | INSERT season_winners           |
  |               |-------------->|                 |
  |               | UPDATE seasons SET status='awarded' (if all 3 done)
  |               | INSERT notification             |
  |               |-------------->|                 |
  |               | INSERT admin_audit_logs         |
  |               |                                 |
  |               | queue email to winner           |
  |               |-------------------------------->|
  |               | queue announcement emails (future)
  | 200 + voucher_code                              |
  |<--------------|                                 |
```

### Other flows
See [design/user-flows.md](design/user-flows.md) for visual flows.

---

## 8. Background Jobs / Cron

Implemented via Supabase pg_cron + Vercel Cron Functions.

| Job | Schedule | Purpose | Implementation |
|---|---|---|---|
| Refresh `photo_scores` | `*/5 * * * *` | Recompute pulse | `REFRESH MATERIALIZED VIEW CONCURRENTLY` |
| Refresh `photographer_stats` | `0 */6 * * *` | Aggregate stats | Same pattern |
| Compute cashback eligibility | `0 2 * * *` (2am daily) | Daily recompute | SQL function |
| Auto-advance season status | `0 0 * * *` | Set 'active' → 'voting-closed' | Check end_date |
| Auto-hide flagged photos | `*/15 * * * *` | Anti-spam | Photos with ≥10 reports/24h |
| Send digest emails (weekly) | `0 8 * * 1` (Mon 8am) | Weekly digest | Only users with notif_email_weekly_digest=true |
| Cleanup soft-deleted photos | `0 3 * * 0` (Sun 3am) | GC storage | Delete files for photos.status='removed' > 30 days old |
| Cleanup expired sessions | (Supabase auto) | — | — |

### Vercel cron config (vercel.json)
```json
{
  "crons": [
    { "path": "/api/cron/refresh-pulse", "schedule": "*/5 * * * *" },
    { "path": "/api/cron/cashback-eligibility", "schedule": "0 2 * * *" },
    { "path": "/api/cron/season-status", "schedule": "0 0 * * *" },
    { "path": "/api/cron/auto-hide-flagged", "schedule": "*/15 * * * *" },
    { "path": "/api/cron/weekly-digest", "schedule": "0 8 * * 1" },
    { "path": "/api/cron/storage-cleanup", "schedule": "0 3 * * 0" }
  ]
}
```

### Cron security
- Header: `Authorization: Bearer ${CRON_SECRET}` (env var)
- Verify in handler

---

## 9. Email Notifications

### Provider: Resend (preferred — Vercel-friendly)

```env
RESEND_API_KEY=re_...
EMAIL_FROM=noreply@gography.net
EMAIL_REPLY_TO=hello@gography.net
```

### Templates

| Template ID | When sent | Subject | Variables |
|---|---|---|---|
| `welcome` | After signup | "Welcome to Gography Photo Awards" | {{username}} |
| `photographer_approved` | Admin approves | "You're approved as photographer!" | {{username}} |
| `photographer_rejected` | Admin rejects | "Update on your photographer application" | {{username, reason}} |
| `customer_marked` | Admin marks customer | "You're now a Gography Customer member 🏆" | {{username, perks_list}} |
| `ambassador_invited` | Admin invites | "You've been invited as Ambassador" | {{username, accept_url}} |
| `like_received` | Daily digest | "Your photo was liked X times today" | {{photo_count, likes}} |
| `comment_received` | Real-time | "New comment on your photo" | {{commenter, body, photo_url}} |
| `editor_pick` | Admin picks | "Your photo was selected as Editor's Pick ⭐" | {{photo, url}} |
| `ambassador_pick` | Ambassador picks | "Your photo was picked by @{{ambassador}}" | {{photo, ambassador, url}} |
| `season_winner` | Winner selected | "You won Best Photo of Season {{season}}" | {{photo, voucher_code, voucher_amount, expiry}} |
| `cashback_eligible` | Daily | "You're eligible for {{percentage}}% cashback" | {{rank, category}} |
| `report_resolved_reporter` | After admin action | "Thank you — we reviewed the report" | {{action_taken}} |
| `photo_warned` | Photo warning | "Notice about your photo" | {{photo, warning_text}} |
| `weekly_digest` | Weekly | "This week on Gography Photo Awards" | {{top_photos, stats}} |
| `password_reset` | (Supabase handles) | — | — |

### Email logic

```typescript
// Email service pseudocode
async function sendEmail(template, toUserId, data) {
  const user = await getUser(toUserId);

  // Check email pref
  if (!shouldSendEmail(template, user.email_prefs)) return;

  const html = await renderTemplate(template, { ...data, user });

  const result = await resend.send({
    from: 'noreply@gography.net',
    to: user.email,
    subject: getSubject(template, data),
    html
  });

  // Log
  await db.insert('email_log', {
    user_id: toUserId,
    template,
    to_email: user.email,
    status: result.error ? 'failed' : 'sent',
    provider_id: result.id,
    error_message: result.error?.message
  });
}
```

### Opt-out
- Each email has unsubscribe link
- Unsubscribe page lets user toggle per category (likes, comments, picks, digest)
- Updates `users.notif_email_*` columns

---

## 10. Storage & Image Handling

### Bucket structure (Supabase Storage)
```
ranking-photos/
├── {photographer_id}/
│   └── {photo_id}/
│       ├── original.jpg     (max 25 MB)
│       ├── large.jpg        (1600px wide)
│       ├── medium.jpg       (800px wide)
│       └── thumbnail.jpg    (400px wide)

avatars/
├── {user_id}/
│   ├── original.jpg
│   └── 128.jpg

covers/
├── {user_id}/
│   ├── original.jpg
│   └── 1920.jpg
```

### Upload process
1. Client uploads to `/api/photos/upload` (multipart)
2. Server validates (type, size, dimensions)
3. Server uploads original to Supabase Storage
4. Server processes via Sharp:
   - `thumbnail.jpg` 400×auto, 85% quality
   - `medium.jpg` 800×auto, 85% quality
   - `large.jpg` 1600×auto, 85% quality
5. Upload all sizes
6. Extract EXIF via `exifr` library
7. Insert into photos table

### Image serving
- All URLs are direct Supabase Storage URLs (CDN-backed)
- Use Next.js `<Image>` for layout shift prevention (specify width/height from DB)
- Lazy load below fold

### Cleanup
- On photo delete: delete all 4 files
- On user delete: delete all photos + avatars
- Cron weekly cleanup for orphaned files

### Costs (rough)
- Avg photo set (4 sizes): ~3 MB
- 1000 photos = 3 GB storage
- Supabase free tier = 1 GB — Pro tier needed at ~333 photos
- Bandwidth: 50 GB/mo free — likely sufficient for MVP

---

## 11. Validation Rules — Per Form

### Sign Up (OAuth — no form, but onboarding)

| Field | Rules |
|---|---|
| username | required, 3-30 chars, regex `^[a-zA-Z0-9_]+$`, unique (case-insensitive) |
| avatar | optional, max 5 MB, JPEG/PNG, dim 200-2000px |

### Profile Edit

| Field | Rules |
|---|---|
| display_name | optional, max 60 chars |
| bio | optional, max 200 chars |
| location | optional, max 100 chars |
| avatar_url | optional, URL or upload |
| cover_url | optional, URL or upload |
| favorites_visibility | enum: public \| private |
| theme_preference | enum: light \| dark \| system |
| notif_email_* | boolean |

### Photographer Application

| Field | Rules |
|---|---|
| bio | required, 10-200 chars |
| portfolio_url | required, valid URL, starts with http/https |
| why | optional, max 500 chars |
| sample_photos | optional, array of 1-5 URLs |

### Photo Upload

| Field | Rules |
|---|---|
| file | required, JPEG/PNG/WebP, max 25 MB, dim 1000-8000 |
| title | required, max 80 chars |
| category | required, enum: landscape \| portrait \| bw |
| description | optional, max 1000 chars |
| camera | optional, max 100 chars |
| lens | optional, max 100 chars |
| location | optional, max 100 chars |

### Comment

| Field | Rules |
|---|---|
| body | required, 1-1000 chars |
| parent_id | optional, valid UUID of comment |

### Report

| Field | Rules |
|---|---|
| reason | required, enum: inappropriate \| copyright \| spam \| other |
| detail | optional, max 500 chars |

### Gallery

| Field | Rules |
|---|---|
| name | required, max 80 chars |
| description | optional, max 500 chars |
| is_public | boolean |

### Admin — Mark Customer

| Field | Rules |
|---|---|
| customer_tier | optional, enum: first-trip \| returning \| vip |
| customer_note | optional, max 1000 chars |

### Admin — Grant Ambassador

| Field | Rules |
|---|---|
| ambassador_bio | required, 20-500 chars |
| welcome_message | optional, max 1000 chars |

### Admin — Pick Season Winner

| Field | Rules |
|---|---|
| category | required, enum |
| photo_id | required, valid UUID |
| voucher_amount | required, integer, 1000-100000 THB |
| voucher_expiry | required, date in future, max 24 months from now |

### Validation library
- Use **Zod** (TypeScript-first, runs both client + server)
- Reuse schema between API and form
- Server is source of truth — never trust client-only validation

```typescript
// Example
import { z } from 'zod';

export const photoUploadSchema = z.object({
  title: z.string().min(1, 'Title required').max(80),
  category: z.enum(['landscape', 'portrait', 'bw']),
  description: z.string().max(1000).optional(),
  camera: z.string().max(100).optional(),
  lens: z.string().max(100).optional(),
  location: z.string().max(100).optional(),
});

export type PhotoUploadInput = z.infer<typeof photoUploadSchema>;
```

---

## 12. Error Codes & Handling

### Standard error codes

| Code | HTTP | Meaning | Action |
|---|---|---|---|
| `UNAUTHORIZED` | 401 | Not logged in | Redirect to /login |
| `FORBIDDEN` | 403 | Insufficient role | Show "Permission denied" |
| `NOT_FOUND` | 404 | Resource doesn't exist | 404 page or empty state |
| `VALIDATION_ERROR` | 400 | Invalid input | Show field error |
| `CONFLICT` | 409 | Duplicate (e.g. username taken) | Show "Already exists" |
| `UNPROCESSABLE` | 422 | Logical error (e.g. cap exceeded) | Show specific message |
| `RATE_LIMIT` | 429 | Too many requests | "Slow down" toast + retry-after header |
| `FILE_TOO_LARGE` | 413 | Upload too big | "Max 25 MB" |
| `UNSUPPORTED_TYPE` | 415 | Invalid file type | "JPEG/PNG/WebP only" |
| `ALREADY_REPORTED` | 409 | Duplicate report | Silent ack |
| `ALREADY_LIKED` | 409 | (Handled silently for idempotency) | — |
| `CASHBACK_CAP_EXCEEDED` | 422 | Annual 20K cap | "Annual cashback limit reached" |
| `SEASON_NOT_OPEN` | 422 | Pick winner on non-closed season | Error message |
| `INTERNAL_ERROR` | 500 | Server error | "Something went wrong" + retry |

### Error response format
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Title is required",
    "field": "title",
    "details": { /* optional */ }
  }
}
```

### Client error handling
- Catch all API errors
- Show toast for transient (network, 500)
- Show inline for form errors (400, 422)
- Redirect for auth (401, 403)
- Log to monitoring (Sentry) for 500

### Edge cases — common
- **Race condition** (vote spam): unique constraint catches, return 409 — client treats as success (state already correct)
- **Stale data** (deleted photo while viewing): refresh page, show 404
- **Expired session** mid-action: 401 — silent re-auth — retry — if fail again, redirect login

---

## 13. Performance Requirements

### Page load targets
- **Landing page LCP:** < 2.5s (Lighthouse Good)
- **Photo grid first paint:** < 1.5s
- **Single photo load:** < 1s (already optimized image)
- **Lighthouse score:** ≥ 90 (mobile + desktop)

### API response targets
- **GET /photos (list):** p95 < 300ms
- **GET /photos/:id (single):** p95 < 200ms
- **POST /vote:** p95 < 500ms (write + count update)
- **Upload:** p95 < 5s for 10 MB photo (incl. thumbnail generation)

### Strategies
- **Materialized view** for pulse scores (refresh 5 min)
- **Denormalized counters** on photos table (likes_count, favorites_count) — updated via triggers
- **CDN cache** for images (Supabase Storage already CDN)
- **Next.js ISR** for landing page (revalidate 5 min)
- **SWR / React Query** client caching
- **Index** all foreign keys + sort columns
- **Prefetch** next batch on scroll (80% threshold)

### Scale assumptions (year 1)
- Users: 10K
- Photos: 50K
- Likes: 1M total
- Daily active: 1K
- Peak concurrent: 100

These fit easily in Supabase Pro tier + Vercel Hobby.

---

## 14. Security Requirements

### Authentication
- OAuth only (no password storage)
- Session via Supabase (httpOnly cookie)
- 1 hour access token + auto refresh

### Authorization
- RLS on all tables
- API routes double-check role server-side
- Never trust `is_admin` from client

### Input Validation
- Server-side Zod validation on all writes
- Sanitize HTML in comments + bio (use `sanitize-html` lib — strip all scripts, allow basic formatting)
- File type verified by magic bytes (not just extension)

### File Upload Security
- Validate file type via magic bytes (`file-type` lib)
- Strip EXIF GPS by default (privacy) — opt-in to keep
- Reject if EXIF too large (DoS attempt)
- Antivirus scan? — not in MVP, but consider for Phase 2

### Rate Limiting
- General: 100 req/min per IP
- Auth-required actions (vote, favorite, comment): 30/min per user
- Upload: 5/min per user
- Use Vercel Edge Middleware or Upstash Redis

### CSRF
- Use `samesite=lax` cookies (default Supabase)
- API endpoints check Origin header

### XSS
- React escapes by default
- Sanitize bio + comments (`sanitize-html`)
- CSP header: `default-src 'self'; img-src 'self' https://*.supabase.co; script-src 'self' 'unsafe-inline' https://accounts.google.com`

### SQL Injection
- All queries via Supabase client (parameterized)
- Never concatenate user input into SQL

### Sensitive Data
- Never log access tokens
- Never expose `SUPABASE_SERVICE_ROLE_KEY` to client
- PII (email): only owner + admin can see
- Email hashing in `votes.user_email`? — no, kept plain for query simplicity, RLS restricts access

### Account Security
- Soft delete (not hard) for audit
- Suspend ≠ delete
- Admin actions logged

### GDPR-like considerations
- User can delete account — cascade delete photos, votes, favorites
- Export own data — endpoint `GET /api/me/export` (Phase 2)

---

## 15. Internationalization

### MVP: Thai only
- All UI in Thai (with English technical terms inline)
- Date format: Thai `25 มี.ค. 2026` or Buddhist `25 มี.ค. 2569` (user toggle in settings? — TBD)
- Number format: Thai with comma separators (1,234,567)
- Currency: ฿ symbol

### Phase 2: English
- Use `next-intl` or `react-i18next`
- Extract strings to JSON locale files
- Language switcher in header

### RTL
- Not needed (Thai is LTR)

---

## 16. Monitoring & Logging

### Application monitoring
- **Sentry** for error tracking
  - Frontend: capture exceptions + user context
  - Backend: capture API errors with request context
- **Vercel Analytics** for page views + web vitals
- **PostHog** (optional) for product analytics — track events:
  - signup_completed
  - photo_uploaded
  - vote_cast
  - favorite_added
  - photographer_applied
  - admin_action

### Server logs
- Vercel function logs (stdout/stderr)
- Structured JSON logs for parsing
- Log levels: error / warn / info / debug

### Database monitoring
- Supabase dashboard for query performance
- Slow query log (>1s) auto-flagged
- Connection pool monitoring

### Alerts
- Sentry: any unhandled error
- Vercel: function timeout (>10s)
- Supabase: storage > 80%, DB CPU > 80%
- Custom: report queue > 50 pending

### Audit log retention
- `admin_audit_logs`: keep 1 year, archive older
- `email_log`: keep 30 days for debugging

---

## 17. Migration Plan

### Database migrations
- Use Supabase migrations (`supabase/migrations/`)
- File naming: `YYYYMMDD_HHMMSS_description.sql`
- Apply via `supabase db push` or CI/CD

### Migration sequence (initial)
1. `0001_init_schema.sql` — all tables + indexes + RLS
2. `0002_triggers.sql` — handle_new_user, counters, pick_type updates
3. `0003_materialized_views.sql` — photo_scores + photographer_stats
4. `0004_functions.sql` — cashback computation, etc.
5. `0005_seed_data.sql` — initial categories, super admin user, sample seasons

### Rollback strategy
- Each migration has DOWN script
- Test on staging Supabase before prod
- Backup before major migration

### Schema versioning
- App reads schema version from `_schema_version` table
- Refuse to start if mismatch (force migration)

---

## 18. Seed Data

### For development + testing

#### Admin user
```sql
-- After auth.users created via signup
update users set is_admin = true, is_super_admin = true where email = 'founder@gography.net';
```

#### Sample ambassadors (3)
```sql
update users set is_ambassador = true, ambassador_bio = '...' where username in ('test_amb_1', 'test_amb_2', 'test_amb_3');
```

#### Sample photos (50)
- Use stock photos from Unsplash (license-OK)
- Insert via seed script
- Mix categories: 20 landscape, 15 portrait, 15 bw

#### Sample season
```sql
insert into seasons (name, start_date, end_date, status) values
  ('Spring 2026', '2026-01-01', '2026-04-30', 'active');
```

#### Sample customer markings
- Mark 5 users as customers (mix of tiers)

### Production seed (minimal)
- Super admin only (founder)
- Empty content — let real users build

---

## 19. Environment Variables

### `.env.local` for dev / Vercel for prod

```env
# ========== Public ==========
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxxx
NEXT_PUBLIC_SITE_URL=https://ranking.gography.net
NEXT_PUBLIC_GA_ID=G-XXXXXXX  # Google Analytics (optional)

# ========== Server-only ==========
SUPABASE_SERVICE_ROLE_KEY=eyJxxx  # ⚠️ NEVER expose to client

# OAuth (configured in Supabase, repeat here for reference)
GOOGLE_CLIENT_ID=xxxxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-xxxx

# Email
RESEND_API_KEY=re_xxxxx
EMAIL_FROM=noreply@gography.net
EMAIL_REPLY_TO=hello@gography.net

# Cron (Vercel)
CRON_SECRET=randomly-generated-string

# Sentry (optional)
SENTRY_DSN=https://xxx@xxx.ingest.sentry.io/xxx
SENTRY_AUTH_TOKEN=xxx

# Storage (Supabase auto)
# (no extra env needed — Supabase client handles)

# Rate limit (Upstash optional)
UPSTASH_REDIS_REST_URL=https://xxx.upstash.io
UPSTASH_REDIS_REST_TOKEN=xxxxx

# Environment
NODE_ENV=production  # or development
```

### Secrets management
- Local: `.env.local` (gitignored)
- Production: Vercel environment variables
- Never commit secrets

---

## 20. Testing Strategy

### Unit tests (Vitest)
- Pulse score calculation
- Validation schemas (Zod)
- Permission checks
- Reward eligibility logic

### Integration tests (Vitest + supabase test client)
- API endpoints (mock auth + DB)
- DB triggers (counter updates)
- Materialized view refresh

### E2E tests (Playwright)
- Critical paths:
  - Signup + onboarding
  - Photographer apply → admin approve → upload
  - Visitor → login → vote → favorite
  - Admin: mark customer → user sees customer status
  - Admin: pick season winner → email sent
- Run on every PR

### Manual QA checklist (before each release)
- Light/dark mode toggle works
- Mobile responsive (test 375px, 768px, 1280px)
- Keyboard navigation
- Screen reader test (VoiceOver/NVDA)
- Slow 3G test

### Test data
- Use `supabase/seed.sql` for test DB
- Reset DB between test runs

### Coverage target
- Critical paths: 90%
- Overall: 70%

---

## 21. Deployment

### Hosting
- **Vercel** for Next.js app
- **Supabase** for DB + Auth + Storage
- **DNS:** Cloudflare or Vercel (point `ranking.gography.net` CNAME to Vercel)

### Branches
- `main` → production (`ranking.gography.net`)
- `develop` → staging (`ranking-staging.gography.net`)
- Feature branches → preview URLs (Vercel auto)

### CI/CD (GitHub Actions or Vercel built-in)
- On PR:
  - Run unit + integration tests
  - Run Playwright E2E (on PR labeled "e2e")
  - Lint + type-check
  - Build successfully
- On merge to `develop`:
  - Deploy to staging
- On merge to `main`:
  - Deploy to production
  - Run smoke tests post-deploy

### Database migrations
- Apply manually to staging first
- Verify
- Apply to production via `supabase db push` or via Management API

### Rollback
- Vercel: instant rollback via dashboard
- DB: restore from backup (last known good)

### Monitoring post-deploy
- Watch Sentry for new errors in first hour
- Check Vercel function logs
- Check Supabase performance

---

## 22. Glossary

| Term | Definition |
|---|---|
| **Pulse Score** | Numeric ranking metric — composite of likes, velocity, time decay, curation bonus |
| **Vote / Like** | User's "❤️" on a photo — 1 per Gmail per photo, feeds pulse |
| **Favorite / Save** | User's "🔖" on a photo — unlimited, personal collection, doesn't affect ranking |
| **Editor's Pick** | Admin-selected highlighted photo |
| **Ambassador Pick** | External curator's selected photo |
| **Both Pick** | Photo picked by both editor + ambassador (highest honor + 100 pulse bonus) |
| **Customer** | Gography tour customer — admin-marked, eligible for rewards |
| **Best Photo of Season** | Quarterly award — 1 winner per category, voucher 50K THB |
| **Cashback** | Trip discount % for top-ranked customers (15/10/5/3) |
| **Pulse Score Materialized View** | Cached compute, refreshed every 5 min |
| **Pick Type** | Enum: 'none' / 'editor' / 'ambassador' / 'both' |
| **Customer Section** | Landing page section featuring customer-uploaded photos + Hall of Fame |
| **Hall of Fame** | Page showing past Best Photo of Season winners |
| **Quest** | Themed challenge (NOT IN MVP — Round 2 R1 pending) |
| **Impressions** | Count of times photo shown in feed/search (not just direct view) |
| **Voucher** | Award prize — code redeemable on Gography trips |
| **Annual cap** | Max cashback per customer per calendar year (20K THB) |

---

## Document Metadata

- **Version:** 1.0
- **Created:** 2026-05-22
- **Author:** Founder + Claude (ATH BRAIN wiki)
- **Status:** Spec frozen for MVP — Round 2 decisions (R1-R8) pending will trigger v1.1
- **Related docs:**
  - `design/handoff-brief.md` — design package brief
  - `design/design-system.md` — visual specs
  - `design/pages-public.md` + `design/pages-admin.md` — wireframes
  - `design/user-flows.md` — visual flow diagrams
  - `tech/spec.md` — earlier tech spec (now superseded by this doc)
  - `decisions.md` — record of decisions
  - `audit/500px-analysis.md` — reference analysis

### Change log
- **v1.0 (2026-05-22):** Initial complete spec — 22 sections covering business + DB + API + flows + ops

---

**End of LOGIC.md** — Total scope: ~6000 lines · 30 pages · 13 flows · 17 tables · 60+ API endpoints · all rules + edge cases + validation + security
