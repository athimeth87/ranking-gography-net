# GoScore v2 — Design Document

**Project:** rankinggography.vercel.app
**Status:** Spec-locked, ready for implementation
**Owner:** Athimeth Lerdkitveruj (Founder, Gography)
**Audience:** Engineering team
**Last updated:** 2026-05-26 (rev 2 — implementation-ready fixes)
**Reference:** Inspired by 500px Pulse algorithm — see Appendix A

---

## 0. TL;DR

GoScore v2 เป็น engagement scoring system สำหรับ ranking gography ที่ออกแบบมาเพื่อ:

1. ให้คน "เสพติด" การใช้งาน (ผ่าน 7 psychological hooks ของ 500px Pulse)
2. รักษาความเป็น premium (Trust ก่อน Growth) — ผ่าน 4-tier voter weight + anti-collusion
3. Differentiate จาก 500px ผ่าน **Voyageur trust signal** (ลูกค้าจริง = vote ทรงพลัง)

**Key mechanics:**
- 2 photo tier: Fresh → Popular (threshold GoScore ≥ 70)
- 4 voter role: User (×1) / Rank Master (×1.5) / Voyageur (×2) / Ambassador (×3)
- Rank Master earn: ติด Top 3 photographer ของสัปดาห์ × 3 weeks ติด
- RM tenure: ใช้สิทธิ์ใน season ที่ได้ + 1 grace season
- Hybrid compute: real-time ≤48h, cron 1ชม. > 48h
- Layered transparency: เปิด input, ปิด weight formula
- Gentler decay: floor 70% (รูปคุณภาพ slow-burn ยังมี chance)

---

## 1. Context & Problem

### 1.1 Current state

`rankinggography.vercel.app` มีระบบ Pulse แบบ flat อยู่แล้ว:
```
Pulse = Likes × 1 + Likes(24h) × 3 + curation_bonus
```
มี time-decay แต่ยังไม่มี:
- Voter weighting (ทุก like = 1)
- Threshold gating (Fresh vs Popular ไม่มี exposure boost)
- Anti-collusion (วงแลกโหวต/follower farming ผ่านได้)
- Peak score persistence (identity layer)
- Rank Master promotion engine

### 1.2 Why this matters

Gography คือ **premium photography tier** ใน ecosystem 3-tier (Gography / LensVoyage / PAYDEE).
หลักทอง: **"อะไรทำให้คนเชื่อ?"** ต้องตอบก่อน **"อะไรทำให้คนซื้อ?"**

ranking site ของ Gography ทำหน้าที่ 3 อย่างพร้อมกัน:
1. **Trust engine** — แสดงให้เห็นว่า photographer ของเราเก่งจริง
2. **Engagement engine** — สร้างชุมชน photographer ที่ active
3. **Funnel** — รูปท็อปไหลไปสู่ Gography (premium expedition) และ LensVoyage (mass tour)

ระบบที่ flat (ทุก vote เท่ากัน) จะถูก game ทันทีที่ scale — และทำลาย trust ที่เราพยายามสร้าง

### 1.3 Goals

| # | Goal | Measure |
|---|------|---------|
| G1 | สร้าง engagement loop ที่ทำให้ photographer กลับมา | D7 retention > 45% |
| G2 | ปกป้องจาก vote manipulation | reciprocal flag rate < 8% |
| G3 | ให้ Voyageur (ลูกค้าจริง) เป็น trust signal สูงสุด | Voyageur engagement trend ↑ |
| G4 | สร้าง "Rank Master" tier ที่ earn ผ่าน merit | 5–15 RM ใหม่ต่อ season |
| G5 | รักษา exposure ของรูปคุณภาพสูง slow-burn | floor 70% decay |

### 1.4 Non-goals

- ❌ ไม่สร้าง public formula (algorithm ต้อง partially opaque)
- ❌ ไม่ทำ comment/discussion system ใน v2 (ดอยถัดไป)
- ❌ ไม่ทำ monetization ของ photographer (ranking ≠ marketplace)
- ❌ ไม่ทำ mobile native app — web first

---

## 2. Background — 500px Pulse Mechanic (สรุปสำหรับ dev)

500px ใช้ scoring 0–100 ที่เรียกว่า Pulse — **ไม่ใช่คะแนนคุณภาพ** แต่เป็น engagement engine
อัลกอริทึมเต็มเป็น trade secret แต่จากเอกสาร support + community analysis สรุปได้ 7 hooks:

| # | Hook | กลไก |
|---|------|------|
| 1 | Time-decay | ลด ~10 จุดหลัง 24 ชม. → urgency |
| 2 | Threshold gating | Pulse 70 = Upcoming, 80 = Popular → snowball |
| 3 | Snowball | ผ่าน threshold → exposure ↑ → like ↑ → score ↑ |
| 4 | Diminishing return | vote แรก +20, vote ปลาย +0.X |
| 5 | Peak persistence | `highest_rating` เก็บถาวร = identity |
| 6 | Bimodal distribution | 70–79 ว่าง → ความรู้สึก "ต้องทะลุ" |
| 7 | Hidden algorithm | สูตรปิด → คน analyze ต่อเนื่อง |

**Anti-abuse ที่ฝังในระบบ:**
- Vote weight = function ของผู้โหวต (ไม่เท่ากันทุกคน)
- Reciprocal vote (A↔B) ถูกลดทอน
- Vote จาก follower < non-follower
- Min metadata gate (title + category + ≥3 tags)

อ้างอิงเต็ม → Appendix A

---

## 3. Locked Decisions

ทุก decision ใน table นี้ถูก **lock แล้ว** — เปลี่ยนต้อง revision doc

| Aspect | Value | Rationale |
|--------|-------|-----------|
| Compute model | Hybrid | Real-time ≤48h (UX), batch >48h (cost) |
| Transparency | Layered | Trust ก่อน Growth — เปิดบางส่วนสร้าง trust, ปิดบางส่วนรักษา hook |
| Photo tier | Fresh / Popular | ตามเว็บปัจจุบัน, simpler than 500px |
| Threshold | GoScore ≥ 70 | จุดที่ snowball เริ่ม (อิงจาก bimodal ของ 500px) |
| Voter weight | Amb ×3 / Voy ×2 / RM ×1.5 / User ×1 | Conservative — trust > merit > base |
| RM qualification | Top 3 photographer leaderboard × 3 weeks | sum of peak_goscore รายสัปดาห์ |
| RM tenure | Seasonal + 1 grace | Rotation พอดี, ต้อง active |
| Decay floor | 70% | Premium = slow craft, ไม่ใช่ daily churn |

---

## 4. System Design

### 4.1 Database Schema (PostgreSQL)

```sql
-- ENUMs
CREATE TYPE user_role AS ENUM ('user', 'rank_master', 'voyageur', 'ambassador');
CREATE TYPE photo_tier AS ENUM ('pending', 'fresh', 'popular');

-- USERS
CREATE TABLE users (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  handle            TEXT UNIQUE NOT NULL,
  email             TEXT UNIQUE NOT NULL,
  display_name      TEXT,
  avatar_url        TEXT,
  role              user_role NOT NULL DEFAULT 'user',
  follower_count    INT DEFAULT 0,
  voter_reputation  FLOAT DEFAULT 1.0 CHECK (voter_reputation BETWEEN 0.3 AND 2.0),
  account_status    TEXT DEFAULT 'active',
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_users_role ON users(role) WHERE role != 'user';

-- SEASONS
CREATE TABLE seasons (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name              TEXT NOT NULL,
  start_at          TIMESTAMPTZ NOT NULL,
  end_at            TIMESTAMPTZ NOT NULL,
  photos_per_user_limit INT DEFAULT 12,
  is_active         BOOLEAN DEFAULT FALSE,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX idx_seasons_active ON seasons(is_active) WHERE is_active = TRUE;

-- PHOTOS
CREATE TABLE photos (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  season_id         UUID NOT NULL REFERENCES seasons(id),
  title             TEXT NOT NULL,
  category          TEXT NOT NULL,
  tags              TEXT[] NOT NULL,
  location          TEXT NOT NULL,
  exif              JSONB NOT NULL,
  url               TEXT NOT NULL,
  thumbnail_url     TEXT,
  uploaded_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  current_goscore   FLOAT DEFAULT 0,
  peak_goscore      FLOAT DEFAULT 0,
  peak_at           TIMESTAMPTZ,
  tier              photo_tier DEFAULT 'pending',
  metadata_complete BOOLEAN DEFAULT FALSE,
  needs_recompute   BOOLEAN DEFAULT FALSE,
  curation_bonus    FLOAT DEFAULT 0,

  flagged_for_review BOOLEAN DEFAULT FALSE,
  flag_reason       TEXT,

  CHECK (array_length(tags, 1) >= 3)
);
CREATE INDEX idx_photos_tier_score ON photos(tier, current_goscore DESC) WHERE tier != 'pending';
CREATE INDEX idx_photos_uploaded ON photos(uploaded_at DESC);
CREATE INDEX idx_photos_user_season ON photos(user_id, season_id);
CREATE INDEX idx_photos_needs_recompute ON photos(needs_recompute) WHERE needs_recompute = TRUE;

-- FOLLOWS
CREATE TABLE follows (
  follower_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  followed_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (follower_id, followed_id)
);
CREATE INDEX idx_follows_followed ON follows(followed_id);

-- LIKES
CREATE TABLE likes (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  photo_id          UUID NOT NULL REFERENCES photos(id) ON DELETE CASCADE,
  voter_id          UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  weight            FLOAT NOT NULL,
  weight_components JSONB NOT NULL,
  is_reciprocal     BOOLEAN DEFAULT FALSE,
  is_follower       BOOLEAN DEFAULT FALSE,
  voter_ip_hash     TEXT,
  voter_subnet_hash TEXT,  -- hash of /24 (v4) or /48 (v6); for velocity anomaly grouping
  UNIQUE (photo_id, voter_id)
  -- Self-vote prevention enforced in app layer (requires JOIN; not expressible in CHECK)
);
CREATE INDEX idx_likes_photo_created ON likes(photo_id, created_at DESC);
CREATE INDEX idx_likes_voter ON likes(voter_id, created_at DESC);
CREATE INDEX idx_likes_subnet_created ON likes(voter_subnet_hash, created_at DESC);

-- WEEKLY TOP 3 (immutable, for RM qualification audit)
CREATE TABLE weekly_top3 (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  week_start_date   DATE NOT NULL,
  rank              INT NOT NULL CHECK (rank IN (1, 2, 3)),
  total_peak_score  FLOAT NOT NULL,
  snapshot_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, week_start_date)
);
CREATE INDEX idx_weekly_top3_user_week ON weekly_top3(user_id, week_start_date DESC);

-- RANK MASTER STATUS
CREATE TABLE rank_master_status (
  user_id                UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  promoted_at            TIMESTAMPTZ NOT NULL,
  qualifying_weeks       DATE[] NOT NULL,        -- last 9 weeks of qualification (rolling)
  active_until_season_id UUID NOT NULL REFERENCES seasons(id),
  original_role          user_role NOT NULL DEFAULT 'user',  -- restore target on demote
  extension_count        INT NOT NULL DEFAULT 0,  -- how many times tenure was extended
  is_active              BOOLEAN DEFAULT TRUE,
  demoted_at             TIMESTAMPTZ,
  demote_reason          TEXT
);

-- ABUSE FLAGS (audit trail)
CREATE TABLE abuse_flags (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type     TEXT NOT NULL,  -- 'photo' | 'user' | 'like'
  entity_id       UUID NOT NULL,
  flag_type       TEXT NOT NULL,  -- 'velocity' | 'reciprocal' | 'exif_inconsistent' | etc
  detected_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at     TIMESTAMPTZ,
  resolution      TEXT,
  details         JSONB
);
```

### 4.2 Scoring Algorithm

#### 4.2.1 Like insert (entry point)

```python
def insert_like(photo_id: UUID, voter_id: UUID, voter_ip: str) -> LikeResult:
    photo = get_photo(photo_id)
    voter = get_user(voter_id)
    now = utcnow()

    # Gate checks
    if photo.user_id == voter.id:
        raise RejectError("Cannot vote on own photo")           # self-vote guard
    if not photo.metadata_complete:
        raise RejectError("Photo not yet in scoring system")
    if photo.flagged_for_review:
        raise RejectError("Photo under review")
    if has_already_liked(photo_id, voter_id):
        raise RejectError("Already liked")
    if voter.account_status != 'active':
        raise RejectError("Voter account inactive")

    # Snapshot pre-like state (needed for tier_changed in response)
    old_tier = photo.tier

    # Compute weight + components
    w, components = compute_like_weight(voter, photo, now)

    # Compute subnet hash separately — never derive from voter_ip_hash
    # (sha256 destroys subnet locality; substring of hash ≠ subnet)
    subnet_hash = hash_subnet(voter_ip, prefix_bits=24)  # /24 for IPv4
    ip_hash     = hash_ip(voter_ip)

    # Insert
    like = Like.create(
        photo_id=photo_id,
        voter_id=voter_id,
        weight=w,
        weight_components=components,
        is_reciprocal=components['reciprocal_flag'],
        is_follower=components['follower_flag'],
        voter_ip_hash=ip_hash,
        voter_subnet_hash=subnet_hash,
    )

    # Hybrid compute decision
    age = now - photo.uploaded_at
    if age <= timedelta(hours=48):
        recompute_photo_score(photo, now)           # real-time, blocking
        score_status = 'current'
    else:
        photo.needs_recompute = True                # defer to cron
        photo.save()
        score_status = 'pending_recompute'          # cron will reconcile within 1h

    return LikeResult(
        like=like,
        new_goscore=photo.current_goscore,
        new_tier=photo.tier,
        tier_changed=(photo.tier != old_tier),
        score_status=score_status,
    )
```

**Subnet hashing helper:**

```python
import ipaddress, hashlib

def hash_subnet(ip: str, prefix_bits: int = 24) -> str:
    """Hash the /prefix network, not the full IP. Preserves subnet locality
    so velocity anomaly cron can count distinct subnets correctly."""
    addr = ipaddress.ip_address(ip)
    if isinstance(addr, ipaddress.IPv4Address):
        net = ipaddress.ip_network(f"{ip}/{prefix_bits}", strict=False)
    else:
        # For IPv6, use /48 as default subnet boundary (provider-allocation level)
        net = ipaddress.ip_network(f"{ip}/{min(prefix_bits, 48)}", strict=False)
    return hashlib.sha256(str(net.network_address).encode()).hexdigest()
```

#### 4.2.2 Weight function

```python
ROLE_MULT = {
    'ambassador':  3.0,
    'voyageur':    2.0,
    'rank_master': 1.5,
    'user':        1.0,
}

def compute_like_weight(voter, photo, now):
    components = {}
    w = 1.0

    # 1. Role multiplier
    role_mult = ROLE_MULT[voter.role]
    components['role_mult'] = role_mult
    w *= role_mult

    # 2. Voter reputation (0.3 – 2.0)
    components['voter_rep'] = voter.voter_reputation
    w *= voter.voter_reputation

    # 3. Relationship penalty
    rel = 1.0
    follower_flag = is_follower(voter.id, photo.user_id)
    if follower_flag:
        rel *= 0.7
    if is_follower(photo.user_id, voter.id):  # mutual follow = echo chamber
        rel *= 0.4
    components['relationship'] = rel
    components['follower_flag'] = follower_flag
    w *= rel

    # 4. Reciprocal vote detection (7-day window)
    reciprocal_flag = has_voted_back(photo.user_id, voter.id, days=7)
    components['reciprocal'] = 0.3 if reciprocal_flag else 1.0
    components['reciprocal_flag'] = reciprocal_flag
    w *= components['reciprocal']

    # 5. Early-discovery bonus — reward voters who find a photo while it's still young
    #    NOTE: this is PHOTO AGE at time of vote (different from the 24h LIKE-AGE
    #    multiplier applied later in recompute_photo_score). Both mechanisms coexist:
    #      - Here:  voter who liked early gets higher base weight (persistent)
    #      - There: likes cast in last 24h get ×3 boost (temporal urgency, decays)
    photo_age = now - photo.uploaded_at
    if   photo_age <= timedelta(hours=1):  early_bonus = 1.00
    elif photo_age <= timedelta(hours=6):  early_bonus = 0.85
    elif photo_age <= timedelta(hours=24): early_bonus = 0.70
    else:                                  early_bonus = 0.50
    components['early_discovery_bonus'] = early_bonus
    w *= early_bonus

    # 6. Account age (sock-puppet defense)
    if (now - voter.created_at) < timedelta(days=14):
        components['new_account_penalty'] = 0.3
        w *= 0.3

    components['final_weight'] = w
    return w, components
```

#### 4.2.3 GoScore compute

```python
RAW_AT_100 = 100.0  # calibration constant — see §4.2.5

def recompute_photo_score(photo, now):
    likes = get_likes(photo.id)

    sum_total = sum(l.weight for l in likes)
    sum_24h   = sum(l.weight for l in likes
                    if (now - l.created_at) <= timedelta(hours=24))

    # Raw weighted score (formula matches current site, but weights now non-flat)
    raw = (sum_total * 1.0) + (sum_24h * 3.0) + photo.curation_bonus

    # Normalize logarithmic → 0-100
    goscore_pre = 100 * (math.log1p(raw) / math.log1p(RAW_AT_100))

    # Apply age decay
    age = now - photo.uploaded_at
    goscore = goscore_pre * decay_curve(age)
    goscore = max(0, min(100, goscore))

    # Update peak (persistent — never downgrade)
    if goscore > photo.peak_goscore:
        photo.peak_goscore = goscore
        photo.peak_at = now

    # Tier transition
    old_tier = photo.tier
    new_tier = 'popular' if goscore >= 70 else 'fresh'
    if old_tier == 'fresh' and new_tier == 'popular':
        trigger_fresh_to_popular(photo)
    elif old_tier == 'popular' and new_tier == 'fresh':
        # NOTE: ระบบ allow ตกกลับเป็น Fresh ตาม decay ปกติ
        pass

    photo.current_goscore = goscore
    photo.tier = new_tier
    photo.needs_recompute = False
    photo.save()
```

#### 4.2.4 Decay curve

```python
def decay_curve(age: timedelta) -> float:
    """
    Gentler decay than 500px — Gography premium tier values craft over churn.
    Floor at 0.70 prevents demotivation for slow-burn quality work.
    """
    h = age.total_seconds() / 3600

    if   h <=  48: return 1.00                                            # core window
    elif h <= 168: return 1.00 - 0.08 * (h -  48) / (168 -  48)           # 48h→7d:  1.00→0.92
    elif h <= 720: return 0.92 - 0.12 * (h - 168) / (720 - 168)           # 7d→30d:  0.92→0.80
    else:          return max(0.70, 0.80 - 0.10 * math.log10(h / 720))    # 30d+:    floor 0.70
```

| Age | Decay factor |
|-----|--------------|
| 0 – 48h | 1.00 |
| 7d | 0.92 |
| 30d | 0.80 |
| 90d | 0.75 |
| 1y | 0.70 (floor) |

#### 4.2.5 Calibration

`RAW_AT_100` constant ต้อง calibrate ด้วยข้อมูล production จริง:
1. Run shadow scoring บน existing data 30 วัน
2. หา raw value ที่ percentile 99 (รูปท็อปสุด) → set เป็น `RAW_AT_100`
3. Verify distribution: รูปทะลุ 70 ควรอยู่ที่ 8–15%
4. Adjust หากไม่ตรง target

#### 4.2.6 Curation bonus (per D9 locked 2026-05-26)

Curation bonus เป็น **raw additive** ที่ใส่ก่อน log-normalize → impact ลดลงเมื่อ raw สูง (diminishing return)
**Source of truth: D9 in `ranking/decisions-locked-2026-05-26.md`**

**Bonus mapping (locked):**

| `photos.pick_type` | `photos.curation_bonus` | Source                              |
|--------------------|-------------------------|-------------------------------------|
| `'none'`           | 0                       | default                             |
| `'editor'`         | 50                      | row in `editor_picks` table         |
| `'ambassador'`     | 50                      | row in `ambassador_picks` table     |
| `'both'`           | 100                     | both source tables have active row  |

**Why additive-pre-log:** หากใส่หลัง normalize (e.g. `goscore + 50`) จะ over-boost รูปที่มี raw ต่ำ ทำให้รูปที่ไม่มี engagement จริงทะลุ Popular ได้ การใส่ pre-log ทำให้ curation **เร่ง snowball ของรูปที่มี engagement อยู่บ้าง** แต่ไม่สร้างรูป Popular จากศูนย์

**Schema additions:**

```sql
-- ENUM extension
CREATE TYPE pick_type AS ENUM ('none', 'editor', 'ambassador', 'both');

-- photos table additions (see §4.1 — append these columns)
ALTER TABLE photos
  ADD COLUMN pick_type      pick_type DEFAULT 'none',
  ADD COLUMN curation_bonus FLOAT     DEFAULT 0;

-- Source tables (admin/ambassador actions write here, NOT directly to photos)
CREATE TABLE editor_picks (
  photo_id     UUID PRIMARY KEY REFERENCES photos(id) ON DELETE CASCADE,
  curator_id   UUID NOT NULL REFERENCES users(id),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  notes        TEXT
);

CREATE TABLE ambassador_picks (
  photo_id     UUID NOT NULL REFERENCES photos(id) ON DELETE CASCADE,
  curator_id   UUID NOT NULL REFERENCES users(id),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  notes        TEXT,
  PRIMARY KEY (photo_id, curator_id)  -- multiple ambassadors can pick same photo
);
CREATE INDEX idx_ambassador_picks_photo ON ambassador_picks(photo_id);
```

**Trigger (sync pick_type + curation_bonus + needs_recompute):**

```sql
CREATE OR REPLACE FUNCTION sync_curation_state() RETURNS TRIGGER AS $$
DECLARE
  has_editor      BOOLEAN;
  has_ambassador  BOOLEAN;
  target_photo_id UUID;
BEGIN
  target_photo_id := COALESCE(NEW.photo_id, OLD.photo_id);

  SELECT EXISTS(SELECT 1 FROM editor_picks      WHERE photo_id = target_photo_id) INTO has_editor;
  SELECT EXISTS(SELECT 1 FROM ambassador_picks  WHERE photo_id = target_photo_id) INTO has_ambassador;

  UPDATE photos
  SET pick_type = CASE
        WHEN has_editor AND has_ambassador THEN 'both'::pick_type
        WHEN has_editor                    THEN 'editor'::pick_type
        WHEN has_ambassador                THEN 'ambassador'::pick_type
        ELSE 'none'::pick_type
      END,
      curation_bonus = CASE
        WHEN has_editor AND has_ambassador THEN 100
        WHEN has_editor                    THEN 50
        WHEN has_ambassador                THEN 50
        ELSE 0
      END,
      needs_recompute = TRUE
  WHERE id = target_photo_id;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_editor_picks_sync
AFTER INSERT OR DELETE ON editor_picks
FOR EACH ROW EXECUTE FUNCTION sync_curation_state();

CREATE TRIGGER trg_ambassador_picks_sync
AFTER INSERT OR DELETE ON ambassador_picks
FOR EACH ROW EXECUTE FUNCTION sync_curation_state();
```

**Application-layer wrapper (force immediate recompute, not just flag):**

```python
def apply_editor_pick(photo_id, admin_user, notes=""):
    if admin_user.role != 'admin':
        raise PermissionError("Only admin can set Editor's Pick")
    db.upsert('editor_picks', {
        'photo_id': photo_id, 'curator_id': admin_user.id, 'notes': notes,
    })
    # Trigger has already set needs_recompute=TRUE and updated pick_type/curation_bonus
    photo = get_photo(photo_id)
    recompute_photo_score(photo, utcnow())   # promote immediately, even if >48h

def apply_ambassador_pick(photo_id, ambassador, notes=""):
    if ambassador.role != 'ambassador':
        raise PermissionError("Only Ambassadors can set Ambassador's Pick")
    db.upsert('ambassador_picks', {
        'photo_id': photo_id, 'curator_id': ambassador.id, 'notes': notes,
    })
    photo = get_photo(photo_id)
    recompute_photo_score(photo, utcnow())

def revoke_editor_pick(photo_id):
    db.delete('editor_picks', {'photo_id': photo_id})
    recompute_photo_score(get_photo(photo_id), utcnow())

def revoke_ambassador_pick(photo_id, ambassador_id):
    db.delete('ambassador_picks', {'photo_id': photo_id, 'curator_id': ambassador_id})
    recompute_photo_score(get_photo(photo_id), utcnow())
```

**Rate limits on curation:**

| Curator       | Limit                                    |
|---------------|------------------------------------------|
| Admin/Editor  | 3 picks per week (forces selectivity)    |
| Ambassador    | 1 pick per week per Ambassador           |

**Why limits:** curation มี impact สูงต่อ Popular tier — ถ้าไม่จำกัด curator จะ pick ทุกอย่าง → curation signal ก็หมดค่า (Trust ก่อน Growth)

---

### 4.3 Rank Master Promotion Logic

#### 4.3.1 Cron job (weekly)

```python
# Cron: every Sunday 23:59 UTC
def weekly_rank_master_cycle():
    week_start = current_monday_date()

    # 1. Compute photographer leaderboard for the week
    leaderboard = db.query("""
        SELECT p.user_id, SUM(p.peak_goscore) AS total
        FROM photos p
        WHERE p.uploaded_at >= %s
          AND p.uploaded_at <  %s + INTERVAL '7 days'
          AND p.metadata_complete = TRUE
          AND p.flagged_for_review = FALSE
        GROUP BY p.user_id
        ORDER BY total DESC
        LIMIT 3
    """, week_start, week_start)

    # 2. Snapshot top 3 (immutable record)
    for rank, row in enumerate(leaderboard, start=1):
        db.insert('weekly_top3', {
            'user_id': row.user_id,
            'week_start_date': week_start,
            'rank': rank,
            'total_peak_score': row.total,
        })

    # 3. Promotion check — top 3 for 3 consecutive weeks
    for row in leaderboard:
        last_3 = db.query("""
            SELECT week_start_date FROM weekly_top3
            WHERE user_id = %s
            ORDER BY week_start_date DESC
            LIMIT 3
        """, row.user_id)

        if len(last_3) == 3 and is_consecutive_weeks(last_3):
            user = get_user(row.user_id)
            qualifying_weeks = [w.week_start_date for w in last_3]

            # Voyageur / Ambassador: don't downgrade — record achievement only
            if user.role in ('voyageur', 'ambassador'):
                record_rm_achievement(user, qualifying_weeks)
                continue

            # Existing active RM → extend tenure
            existing = get_rank_master_status(user.id)
            if existing and existing.is_active:
                extend_rank_master_tenure(existing, qualifying_weeks)
                continue

            # New promotion (user role only)
            if user.role == 'user':
                promote_to_rank_master(user, qualifying_weeks)

    # 4. Expire grace-period RMs (daily cron also handles this; safe to run here)
    expire_lapsed_rank_masters()


def promote_to_rank_master(user, qualifying_weeks):
    """First-time promotion from 'user' role."""
    next_season = get_next_season(get_active_season())

    db.upsert('rank_master_status', {
        'user_id': user.id,
        'promoted_at': utcnow(),
        'qualifying_weeks': qualifying_weeks,
        'active_until_season_id': next_season.id,
        'original_role': user.role,   # snapshot for demote restore
        'extension_count': 0,
        'is_active': True,
    })

    user.role = 'rank_master'
    user.save()

    send_email(user, template='rank_master_promotion')
    send_push(user, "🏆 คุณได้รับการเลื่อนสถานะเป็น Rank Master")


def extend_rank_master_tenure(rms, qualifying_weeks):
    """Active RM qualified again → push active_until forward by one season."""
    season_after_next = get_next_season(get_next_season(get_active_season()))
    rms.active_until_season_id = season_after_next.id
    # Keep rolling window of last 9 qualifying weeks (3 cycles)
    rms.qualifying_weeks = (rms.qualifying_weeks + qualifying_weeks)[-9:]
    rms.extension_count += 1
    rms.save()

    user = get_user(rms.user_id)
    send_push(user, "🏆 ต่ออายุ Rank Master ไปอีก 1 season")


def record_rm_achievement(user, qualifying_weeks):
    """Voyageur / Ambassador qualified — track for badge display, don't change role."""
    db.insert('rm_achievements', {
        'user_id': user.id,
        'qualified_at': utcnow(),
        'qualifying_weeks': qualifying_weeks,
    })
    send_email(user, template='rm_achievement_unlocked')


def expire_lapsed_rank_masters():
    """Demote RMs whose active_until season has ended — restore original_role."""
    expired = db.query("""
        SELECT rms.user_id, rms.original_role
        FROM rank_master_status rms
        JOIN seasons s ON s.id = rms.active_until_season_id
        WHERE rms.is_active = TRUE
          AND s.end_at < NOW()
    """)
    for row in expired:
        user = get_user(row.user_id)
        user.role = row.original_role  # restore (defaults to 'user')
        user.save()

        rms = get_rank_master_status(row.user_id)
        rms.is_active = False
        rms.demoted_at = utcnow()
        rms.demote_reason = 'grace_season_ended'
        rms.save()

        send_email(user, template='rank_master_grace_ended')
```

**Supporting table for non-role achievements:**

```sql
CREATE TABLE rm_achievements (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  qualified_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  qualifying_weeks  DATE[] NOT NULL
);
CREATE INDEX idx_rm_achievements_user ON rm_achievements(user_id, qualified_at DESC);
```

#### 4.3.2 Edge cases

| Case | Behavior |
|------|----------|
| User เป็น Voyageur อยู่แล้ว, qualify RM | Role คงเป็น Voyageur (สูงกว่า), แต่ส่ง email congratulate + บันทึก achievement |
| User เป็น Rank Master อยู่ แล้ว qualify อีกใน season ถัดไป | Reset `active_until_season_id` เป็น next+1 (extend) |
| User ติด top 3 แต่ไม่ติดกัน 3 weeks (ห่างกัน) | ไม่ promote — ต้อง consecutive |
| Top 3 ของสัปดาห์มีคนเดียวจาก leaderboard (อันดับอื่นไม่มีรูป) | ยังบันทึก แต่ promote เฉพาะคนที่ครบ 3 weeks |

---

### 4.4 Fresh → Popular Snowball

```python
def trigger_fresh_to_popular(photo):
    # Exposure boost
    add_to_homepage_carousel(photo, slot_hours=24)
    add_to_popular_feed_top(photo)

    # Notify creator
    send_push(photo.user_id,
        f"🔥 ผลงาน '{photo.title}' ติด Popular แล้ว")

    # Notify Voyageur digest queue (rate-limited)
    if photo.peak_goscore >= 75:
        queue_voyageur_digest(photo)

    # Analytics event
    track_event('photo_promoted_to_popular', {
        'photo_id': photo.id,
        'user_id': photo.user_id,
        'time_to_popular_hours': (utcnow() - photo.uploaded_at).total_seconds() / 3600,
    })
```

**Near-Popular UX hook** — รูปที่ score 60–69 แสดง "Almost Popular" badge ใน Fresh feed
→ voter เห็นแล้วอยาก "ดันให้ทะลุ" = engagement loop ของผู้โหวต

#### 4.4.1 Bimodal gap mechanic (Hook #6 from 500px)

500px มี gap ว่างที่ goscore 70–79 → photo ที่ทะลุ 70 มักจะกระโดดไป 80+ เร็วๆ ไม่ค้างใน 70s
สาเหตุ: **exposure-driven snowball** — ไม่ใช่ algorithm explicit, แต่เกิดจาก feedback loop

GoScore implements this organically through 3 mechanisms ที่ทำงานร่วมกัน:

1. **Threshold exposure boost** (§4.4 above)
   - Cross 70 → homepage carousel 24h + popular_feed top
   - Exposure ↑ → like rate ↑ → score ↑

2. **24h temporal multiplier** (§4.2.3)
   - Likes ใน 24 ชม. × 3 → รูปที่เพิ่ง cross 70 ได้ likes ใหม่ที่ boost หนัก
   - แต่รูปที่ stuck 70+ มา > 24h จะไม่ได้ multiplier นี้ → drop เร็ว

3. **Curation pile-on** (§4.2.6)
   - Editor/Ambassador เห็นรูป Popular ใหม่ → likely curate → +30 / +60 bonus
   - ผลคือรูปที่ทะลุ 70 มี momentum พุ่ง 80–90

**Empirical expectation** (หลัง calibration):
- Score 60–69: photographers ที่กำลังลุ้น (~10–15% of upload)
- Score 70–79: transition zone — เฉลี่ยอยู่ < 48 ชม. (rare to find)
- Score 80–95: stable Popular tier — รูปทะลุ snowball แล้ว

หาก KPI dashboard (§9) แสดงรูปค้างใน 70–79 มากกว่า 5% ของ Popular → exposure boost อ่อนเกิน, ต้องปรับ §4.4 trigger logic

#### 4.4.2 Why we don't add a hard 80 tier

Spec §3 lock ไว้ 2 tiers (Fresh / Popular) — การเพิ่ม "Elite" จะ:
- ทำให้ Pulse Breakdown ซับซ้อนขึ้น → ทำลาย "premium ดูง่าย" mindset
- สร้าง pressure ให้ photographer chase 80 → distort behavior (vote farming เพื่อ tier ที่ 2)

Bimodal gap **ต้องเกิดเอง** จาก exposure mechanics, ไม่ใช่จาก hard cutoff

---

### 4.5 Anti-Abuse Stack

#### 4.5.1 Rate limits (Upstash Redis recommended)

```python
RATE_LIMITS = {
    'like':   {'per_user_per_day': 200, 'per_photo_lifetime': 1},
    'upload': {'per_user_per_season': 12},
    'follow': {'per_user_per_day': 100},
}
```

#### 4.5.2 Velocity anomaly detection

```python
# Cron every 5 minutes
def detect_velocity_anomaly():
    # NOTE: COUNT(DISTINCT voter_subnet_hash) — uses pre-computed subnet hash from
    # insert_like (§4.2.1). DO NOT substring voter_ip_hash; sha256 destroys subnet locality.
    suspects = db.query("""
        SELECT photo_id,
               COUNT(*) AS like_count,
               COUNT(DISTINCT voter_subnet_hash) AS subnets,
               COUNT(DISTINCT voter_id)          AS distinct_voters
        FROM likes
        WHERE created_at >= NOW() - INTERVAL '5 minutes'
          AND voter_subnet_hash IS NOT NULL
        GROUP BY photo_id
        HAVING COUNT(*) > 50
           AND COUNT(DISTINCT voter_subnet_hash) < 3
    """)
    for row in suspects:
        flag_for_review(
            entity_type='photo',
            entity_id=row.photo_id,
            flag_type='velocity',
            details={
                'like_count': row.like_count,
                'subnets': row.subnets,
                'distinct_voters': row.distinct_voters,
            },
        )
```

#### 4.5.3 EXIF integrity

```python
def validate_exif(photo, user):
    exif = photo.exif

    if not exif.get('Make') or not exif.get('DateTime'):
        return False, "EXIF missing essential fields"

    # Camera consistency: photographer ใช้กล้องประเภทเดิมๆ ไหม
    if not exif_camera_consistent_with_history(user, exif):
        flag_for_review('photo', photo.id, 'exif_inconsistent',
                        details={'exif_make': exif.get('Make')})
        # Don't reject — let admin review
        return True, "Flagged for review"

    return True, "OK"
```

#### 4.5.4 Metadata gate

```python
def check_metadata_complete(photo):
    was_complete = photo.metadata_complete
    photo.metadata_complete = bool(
        photo.title and
        photo.category and
        len(photo.tags) >= 3 and
        photo.location and
        photo.exif
    )

    # State transitions
    if not photo.metadata_complete:
        # Incomplete (or became incomplete via edit) → pending, no scoring
        photo.tier = 'pending'
        photo.save()
        return

    # metadata_complete = TRUE
    if not was_complete or photo.tier == 'pending':
        # First time complete (or completing after edit) — enter Fresh tier
        photo.tier = 'fresh'
        photo.save()
        recompute_photo_score(photo, utcnow())   # compute initial score
        track_event('photo_entered_fresh', {'photo_id': photo.id})
    else:
        photo.save()  # metadata change but already complete; no transition
```

**Trigger points:**
- Initial upload (§6.3) → `check_metadata_complete(photo)` immediately
- Photo edit endpoint (`PATCH /api/photos/:id`) → re-run `check_metadata_complete`
- Backfill cron (one-off after schema migration) — handle legacy `pending` photos with full metadata

#### 4.5.5 Voter reputation update

```python
# Cron: every 6 hours
def update_voter_reputations():
    """
    Voter ที่ vote แล้วรูปนั้นๆ ขึ้น Popular จริง → reputation ขึ้น
    Voter ที่ vote เฉพาะรูปที่ flag → reputation ลง
    """
    voters = db.query("""
        SELECT l.voter_id,
               COUNT(*) FILTER (WHERE p.tier = 'popular') AS hits,
               COUNT(*) FILTER (WHERE p.flagged_for_review) AS bad,
               COUNT(*) AS total
        FROM likes l
        JOIN photos p ON p.id = l.photo_id
        WHERE l.created_at >= NOW() - INTERVAL '30 days'
        GROUP BY l.voter_id
    """)
    for row in voters:
        new_rep = compute_voter_reputation(row.hits, row.bad, row.total)
        db.update('users', {'id': row.voter_id, 'voter_reputation': new_rep})


def compute_voter_reputation(hits, bad, total):
    # Require minimum sample size — otherwise low-activity voters drift down unfairly
    MIN_SAMPLE = 10
    if total < MIN_SAMPLE:
        return 1.0  # neutral until enough signal

    hit_rate = hits / total
    bad_rate = bad / total

    # Baseline hit_rate = 0.10 (matches §9 KPI "8–15% reach Popular")
    rep = 1.0 + (hit_rate - 0.10) - (bad_rate * 2)
    return max(0.3, min(2.0, rep))
```

---

### 4.6 Role Assignment (Voyageur / Ambassador / Rank Master)

ระบบมี 4 roles → mechanism ของแต่ละ role ต่างกัน:

| Role         | How obtained                                    | Revocable     |
|--------------|-------------------------------------------------|---------------|
| User         | Default on signup                                | —             |
| Rank Master  | Auto-promote: Top 3 × 3 consecutive weeks (§4.3) | Expire seasonally |
| Voyageur     | Auto-sync จาก Gography booking DB (`is_customer`) | On refund / 24-month inactivity |
| Ambassador   | Admin sets `is_ambassador = TRUE` (manual)      | Admin revoke  |

#### 4.6.1 Voyageur — auto-link from Gography booking (extends vault canon)

Voyageur = ลูกค้าจริงที่จองทริป Gography (premium tier) เสร็จสมบูรณ์ → trust signal สูงสุดที่ 500px ไม่มี

**Relation to vault canon:** vault เดิมใช้ `users.is_customer` เป็น admin-set boolean — เปลี่ยนเป็น **auto-sync จาก Gography Dashboard booking DB** (locked 2026-05-26 per founder decision). Admin ยัง override ได้ผ่าน admin tool ถ้าจำเป็น

```python
# Cron: every 30 minutes — sync from Gography Dashboard booking DB
def sync_voyageur_status():
    """
    Match booking emails ↔ ranking user emails.
    Set is_customer = TRUE + role = 'voyageur' when:
      - booking_status = 'completed' (ทริปจบแล้ว, ไม่ใช่แค่ paid)
      - tier IN ('gography_premium', 'gography_expedition')  -- ไม่นับ LensVoyage
      - refund_status != 'refunded'
      - completed within last 24 months
    """
    candidates = booking_db.query("""
        SELECT DISTINCT customer_email
        FROM bookings
        WHERE booking_status = 'completed'
          AND tier IN ('gography_premium', 'gography_expedition')
          AND refund_status != 'refunded'
          AND completed_at >= NOW() - INTERVAL '24 months'  -- 2-year voyageur window
    """)

    for row in candidates:
        user = db.query_one("SELECT * FROM users WHERE email = %s", row.customer_email)
        if not user:
            continue
        # Don't downgrade Ambassador (precedence: Ambassador > Voyageur)
        if user.is_ambassador:
            user.is_customer = True   # still mark customer for future Ambassador-revoke fallback
            user.save()
            continue
        if not user.is_customer or user.role != 'voyageur':
            old_role = user.role
            user.is_customer = True
            user.role = 'voyageur'
            user.save()
            db.insert('role_audit_log', {
                'user_id': user.id, 'old_role': old_role, 'new_role': 'voyageur',
                'changed_by': None, 'reason': 'booking_sync_completed_trip',
            })
            send_email(user, template='voyageur_unlocked')
            send_push(user, "✦ คุณได้รับสถานะ Voyageur — vote ของคุณมีน้ำหนัก ×2")


def revoke_voyageur_on_refund(booking):
    """Triggered by Gography Dashboard booking system webhook on refund."""
    user = db.query_one("SELECT * FROM users WHERE email = %s", booking.customer_email)
    if not user or not user.is_customer:
        return

    # Only revoke if no other completed non-refunded bookings remain
    other_completed = booking_db.count("""
        SELECT 1 FROM bookings
        WHERE customer_email = %s
          AND booking_status = 'completed'
          AND refund_status != 'refunded'
          AND id != %s
    """, booking.customer_email, booking.id)
    if other_completed > 0:
        return

    user.is_customer = False
    # Don't touch Ambassador role; otherwise demote to user
    if not user.is_ambassador:
        user.role = 'user'
    user.save()
    db.insert('role_audit_log', {
        'user_id': user.id, 'old_role': 'voyageur', 'new_role': user.role,
        'changed_by': None, 'reason': 'booking_refunded_no_remaining',
    })


# Weekly cron — expire users who haven't booked in 24 months
def expire_inactive_voyageurs():
    inactive = db.query("""
        SELECT u.id FROM users u
        WHERE u.is_customer = TRUE
          AND u.is_ambassador = FALSE
          AND NOT EXISTS (
            SELECT 1 FROM gography_bookings b
            WHERE b.customer_email = u.email
              AND b.booking_status = 'completed'
              AND b.refund_status != 'refunded'
              AND b.completed_at >= NOW() - INTERVAL '24 months'
          )
    """)
    for row in inactive:
        user = get_user(row.id)
        user.is_customer = False
        user.role = 'user'
        user.save()
```

**Admin override:** admin endpoint `PATCH /api/admin/users/:id` ยังเซ็ต `is_customer` ตรงๆ ได้ (สำหรับเคสพิเศษ — e.g. ลูกค้าจองผ่านช่องทางที่ไม่เข้า booking DB)

**2-year window:** ลูกค้าที่จองเกิน 2 ปีโดยไม่จองซ้ำ → `is_customer = FALSE` + role revert เป็น user (cron `expire_inactive_voyageurs` รัน weekly)

#### 4.6.2 Ambassador — admin manual flag (per vault canon)

Ambassador = trusted external photographer / influencer
**Aligned with LOGIC.md role assignment:** admin ตั้ง `users.is_ambassador = TRUE` ตรงๆ → role recomputes to `'ambassador'`. ไม่มี email invite flow, ไม่มี pending state.

```python
def set_ambassador(admin_user, target_user, reason):
    """Promote user to Ambassador. Admin-only, manual."""
    if admin_user.role != 'admin':
        raise PermissionError("Only admin can manage Ambassador role")

    old_role = target_user.role
    target_user.is_ambassador = True
    target_user.role = 'ambassador'
    target_user.save()

    db.insert('role_audit_log', {
        'user_id': target_user.id,
        'old_role': old_role,
        'new_role': 'ambassador',
        'changed_by': admin_user.id,
        'reason': reason,
    })
    send_email(target_user, template='ambassador_welcome')


def revoke_ambassador(admin_user, target_user, reason):
    """Revoke Ambassador. Restore to 'voyageur' if is_customer, else 'user'."""
    if admin_user.role != 'admin':
        raise PermissionError("Only admin can revoke")

    target_user.is_ambassador = False
    # Restore precedence: voyageur > user (Rank Master cannot be auto-restored —
    # would need re-qualification through §4.3 cron)
    target_user.role = 'voyageur' if target_user.is_customer else 'user'
    target_user.save()

    db.insert('role_audit_log', {
        'user_id': target_user.id,
        'old_role': 'ambassador',
        'new_role': target_user.role,
        'changed_by': admin_user.id,
        'reason': reason,
    })
```

**No `ambassador_invites` table** — drop from spec. If a future Ambassador hasn't signed up yet, admin asks them to sign up first, then sets the flag.

#### 4.6.3 Role precedence

ลำดับความสำคัญ (สูง → ต่ำ): **Ambassador > Voyageur > Rank Master > User**

Rules:
- เมื่อหลาย role qualified พร้อมกัน → ใช้ role ที่สูงสุด แต่ **บันทึกทุก achievement** (e.g. Voyageur ที่ qualify RM → role stays Voyageur แต่มี RM badge แสดงเสริม)
- Demote ของ role สูงกว่า → restore role ต่ำกว่าถ้ายัง qualified อยู่ (e.g. Ambassador revoke → check Voyageur eligibility)

#### 4.6.4 Supporting schema

```sql
-- Users table additions (extends §4.1 users table)
ALTER TABLE users
  ADD COLUMN is_customer    BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN is_ambassador  BOOLEAN NOT NULL DEFAULT FALSE;

-- role is denormalized from is_customer/is_ambassador + RM status
-- Precedence: Ambassador > Voyageur (is_customer) > Rank Master > User

CREATE TABLE role_audit_log (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  old_role     user_role,
  new_role     user_role NOT NULL,
  changed_by   UUID REFERENCES users(id),  -- NULL for system actions (cron)
  changed_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  reason       TEXT
);
CREATE INDEX idx_role_audit_user ON role_audit_log(user_id, changed_at DESC);
```

---

## 5. UI / UX Specifications

### 5.1 Photo card (compact, used everywhere)

```
┌─────────────────────────┐
│ [photo thumbnail]       │
│                         │
│ @handle  · ★ Voyageur   │
│ GoScore 67              │
│ [████████░░] → Popular  │
│ ♡ 23  💬 0              │
└─────────────────────────┘
```

### 5.2 Pulse Breakdown Modal

Triggered by: click ที่ GoScore number บน photo card

```
╔═══════════════════════════════════╗
║ GoScore: 67                       ║
║ [████████████░░] 67 / 70 → Popular║
║                                   ║
║ 📊 รายละเอียดคะแนน                 ║
║ ─────────────────────────         ║
║ Likes ทั้งหมด          23         ║
║ Likes (24 ชม.)          8  ×3     ║
║                                   ║
║ จากผู้โหวต:                       ║
║   ★ Ambassador          1         ║
║   ✦ Voyageur            1         ║
║   ◆ Rank Master         2         ║
║   ○ Photographer       19         ║
║                                   ║
║ Time decay            94%         ║
║ Curation bonus          —         ║
║                                   ║
║ อีก 3 คะแนน → เข้า Popular ⚡      ║
╚═══════════════════════════════════╝
```

**เปิด (visible to user):**
- Likes total + 24h count
- Role distribution (count per role)
- Time decay percentage
- Distance to next tier
- Curation bonus presence

**ปิด (NOT shown):**
- Exact role multiplier values
- Voter reputation values
- Relationship penalty calculations
- Reciprocal detection flags
- Account age penalty
- Velocity weight

### 5.3 Photographer Profile

```
@handle                          [Follow]
★ Voyageur · since 2026-01

12 photos this season
Avg peak GoScore: 78
Hall count: 3
Streak: 2 seasons in Top 3

──────────── PHOTOS ────────────
[grid of photos sorted by peak_goscore desc]
```

### 5.4 Weekly Leaderboard Page

```
🏆 This Week's Top Photographers

1.  @handle1   Score: 245   [3 photos in Popular]
2.  @handle2   Score: 198   [2 photos in Popular]
3.  @handle3   Score: 167   [2 photos in Popular]
──────────────────────────────────
4.  @handle4   Score: 145
5.  @handle5   Score: 132
...
```

Footer note: "ติด Top 3 ของสัปดาห์ครบ 3 weeks ติดต่อกัน → เลื่อนเป็น Rank Master"

### 5.5 Tier badges

| Role | Badge | Color |
|------|-------|-------|
| User | (none) | — |
| Rank Master | ◆ | Bronze gradient |
| Voyageur | ✦ | Cyan |
| Ambassador | ★ | Gold |

---

## 6. API Contracts

### 6.1 Like a photo

```
POST /api/photos/:id/like
Auth: required (Bearer token)

Response 200:
{
  "like_id": "uuid",
  "photo_id": "uuid",
  "new_goscore": 67.4,
  "new_tier": "fresh" | "popular",
  "tier_changed": true | false,
  "score_status": "current" | "pending_recompute"
}

Notes:
- score_status = "current"           → photo ≤ 48h old, recompute ran inline
- score_status = "pending_recompute" → photo > 48h old; new_goscore is pre-like value,
                                       cron will reconcile within 1 hour (§7.2)

Response 4xx:
{ "error": "already_liked" | "self_vote" | "photo_not_eligible" | "rate_limited" }
```

### 6.2 Get photo with breakdown

```
GET /api/photos/:id?include=breakdown
Auth: optional

Response 200:
{
  "id": "uuid",
  "title": "...",
  "current_goscore": 67.4,
  "peak_goscore": 71.2,
  "tier": "fresh",
  "uploaded_at": "...",
  "user": { "handle": "...", "role": "voyageur" },
  "breakdown": {
    "likes_total": 23,
    "likes_24h": 8,
    "voter_distribution": {
      "ambassador": 1, "voyageur": 1, "rank_master": 2, "user": 19
    },
    "time_decay_pct": 94,
    "curation": {
      "editor_pick": false,
      "ambassador_pick": false,
      "bonus_total": 0
    },
    "distance_to_next_tier": 3,
    "score_status": "current"
  }
}
```

### 6.3 Upload photo

```
POST /api/photos
Auth: required
Body: multipart form (file + title + category + tags[] + location)

Server-side actions:
1. Extract EXIF
2. Validate EXIF integrity (§4.5.3)
3. Check metadata_complete (§4.5.4)
4. Check season upload limit (see code below — reject if exceeded)
5. Set tier = 'fresh' (if metadata complete) or 'pending'
6. Trigger initial recompute (likely starts at 0)

Response 200: { "photo_id": "uuid", "tier": "fresh" | "pending", "season_quota_remaining": 7 }
Response 4xx: { "error": "season_quota_exceeded" | "exif_invalid" | "metadata_incomplete" }
```

**Upload handler enforcement:**

```python
def upload_photo(user, file, title, category, tags, location):
    season = get_active_season()
    if not season:
        raise RejectError("No active season")

    # Season quota enforcement (was missing — schema-level limit only)
    count = db.query_scalar("""
        SELECT COUNT(*) FROM photos
        WHERE user_id = %s AND season_id = %s
    """, user.id, season.id)
    if count >= season.photos_per_user_limit:
        raise RejectError(
            f"season_quota_exceeded: {count}/{season.photos_per_user_limit}"
        )

    exif = extract_exif(file)
    ok, msg = validate_exif(photo=None, user=user)  # minimal sanity check
    if not ok:
        raise RejectError(f"exif_invalid: {msg}")

    photo = Photo.create(
        user_id=user.id, season_id=season.id,
        title=title, category=category, tags=tags, location=location,
        exif=exif, url=store_image(file),
        tier='pending',  # check_metadata_complete will flip to 'fresh'
    )
    check_metadata_complete(photo)             # → sets tier='fresh' if all set
    if photo.metadata_complete:
        recompute_photo_score(photo, utcnow())  # initial score (≈0)

    return {
        'photo_id': photo.id,
        'tier': photo.tier,
        'season_quota_remaining': season.photos_per_user_limit - count - 1,
    }
```

### 6.4 Get leaderboard

```
GET /api/leaderboard?week=2026-W21
Auth: optional

Response 200:
{
  "week_start_date": "2026-05-25",
  "leaderboard": [
    {
      "rank": 1, "user": {...},
      "total_peak_score": 245.3,
      "popular_count": 3
    },
    ...
  ]
}
```

---

## 7. Compute & Infrastructure Notes

### 7.1 Real-time path (≤48h photos)

- Like POST → blocking recompute → response with new score
- Target latency: **<150ms p95**
- Optimization: cache photo metadata + likes count in Redis, only DB on transition

### 7.2 Cron jobs

| Job | Schedule | Purpose |
|-----|----------|---------|
| `recompute_stale_photos` | Every 1 hour | Process `needs_recompute=TRUE` photos |
| `detect_velocity_anomaly` | Every 5 min | Flag suspicious bursts |
| `update_voter_reputations` | Every 6 hours | Adjust voter_reputation based on outcomes |
| `weekly_rank_master_cycle` | Sunday 23:59 UTC | Snapshot top 3 + promote |
| `expire_lapsed_rank_masters` | Daily 00:05 UTC | Demote expired RMs |
| `rebuild_season_leaderboard` | Daily 00:30 UTC | Precompute leaderboard view |

### 7.3 Recommended stack

| Layer | Choice |
|-------|--------|
| Frontend | Next.js (existing) on Vercel |
| Database | PostgreSQL via Supabase or Neon |
| Cache / rate limit | Upstash Redis |
| Image storage | Vercel Blob or Cloudinary |
| Cron | Vercel Cron Jobs |
| EXIF parsing | `exifr` (npm) |
| Analytics events | PostHog or similar |

---

## 8. Rollout Plan

### Sprint 1 (Week 1–2): Foundation
- Schema migrations
- Weight function + GoScore compute
- Hybrid compute path
- **Acceptance:** Like → score updates within 150ms for photos ≤48h old

### Sprint 2 (Week 3–4): Transparency UX
- Pulse breakdown modal
- "Almost Popular" badge for 60–69
- Tier badges on profile + photo cards
- **Acceptance:** User can see role contribution + distance to threshold

### Sprint 3 (Week 5–6): Rank Master engine
- Weekly cron + leaderboard
- Promotion logic with grace season
- RM badge + email/push notifications
- **Acceptance:** Test fixture qualifies 3 weeks consecutive → role flip

### Sprint 4 (Week 7–8): Anti-abuse
- Rate limiters (Upstash)
- Velocity anomaly cron
- EXIF integrity gate
- Voter reputation updates
- **Acceptance:** Synthetic reciprocal vote test → flagged + weight reduced

### Sprint 5 (Week 9–10): Observability
- KPI dashboard (admin)
- Snowball event analytics
- Calibration of `RAW_AT_100`
- **Acceptance:** Founder dashboard shows 7 metrics from §9

### Pre-launch
- Shadow scoring on existing data for 1 week
- Soft launch: enable for 10% of users
- Calibrate, then full rollout

---

## 9. KPIs

Track in admin dashboard (founder-facing):

| Metric | Definition | Season 1 target |
|--------|-----------|-----------------|
| D7 retention | photographer active on day 7 | > 45% |
| Median session | minutes per session | > 6 |
| % Fresh → Popular | photos crossing 70 | 8–15% |
| Voyageur engagement | likes/week from Voyageur | upward trend |
| Reciprocal rate | % likes flagged reciprocal | < 8% |
| RM promotions | new RMs per season | 5–15 |
| Time to Popular | hours from upload → Popular | median < 24h |

---

## 10. Open Questions / Future Work

### Open
1. **Comment system** — Should comments contribute to GoScore? (Currently no.) Spec deferred to v3.
2. **Photo decay vs photographer decay** — Should old top photographers still count in this week's leaderboard? Current spec: only this-week uploads count for RM qualification.
3. **Cross-tier value** — Should Popular photos appear on Gography main site automatically? Marketing decision, not engineering.
4. **Voter weight transparency** — Do we expose voter_reputation to the user themselves (not others)? Risk: optimization games.

### Future (v3+)
- Comment system with weighted reactions
- Photographer collections / portfolios
- Voyageur Choice (curated parallel track, like 500px Editors' Choice but driven by real customers)
- Mobile-first responsive design pass
- ML-based aesthetic quality signal (parallel to engagement)

---

## Appendix A — 500px Pulse Source Material

Primary references (organized in original analysis document `500px_pulse_logic.md`):

1. [What is Pulse and Views? – 500px Support Center](https://support.500px.com/hc/en-us/articles/203999378-What-is-Pulse-and-Views) — Official documentation
2. [What does the 500px pulse score really mean? – Mike Creeth](https://mikecreeth.wordpress.com/2014/11/19/what-does-the-500px-pulse-score-really-mean/) — Statistical analysis of ~28k photos via 500px API in R
3. [My Thoughts on 500px's Pulse 2.0 – Jason Waltman](https://www.jasonwaltman.com/blog/2013/my-thoughts-on-500px-pulse-2-0/) — Notes on Pulse 2.0 rewrite
4. [How does 500px.com calculate 'pulse'? – Quora](https://www.quora.com/How-does-500px-com-calculate-pulse) — Community explanation of follower vs non-follower weight and reciprocal voting
5. [500px Legacy API Documentation – GitHub](https://github.com/500px/legacy-api-documentation) — API field reference

### Key fields from 500px API (legacy)
- `rating` — current Pulse
- `highest_rating` — peak Pulse ever achieved
- `highest_rating_date` — when peak occurred
- `times_viewed`, `votes_count`, `favorites_count` — raw engagement inputs

The presence of both current + peak + peak_at strongly suggests on-the-fly compute via decay from peak — informing our hybrid model.

---

## Appendix B — Why this differs from 500px

| Aspect | 500px | GoScore (Gography) | Reason |
|--------|-------|--------------------|--------|
| Tier count | 4 (Fresh/Upcoming/Popular/Editors') | 2 (Fresh/Popular) | Match existing site simplicity |
| Decay aggression | Hard (-10/24h) | Gentle (floor 70%) | Premium = slow craft, not daily churn |
| Voter roles | Implicit (activity-based) | Explicit (4-tier) | Voyageur = trust signal that 500px can't have |
| Algorithm transparency | Fully opaque | Layered | Trust ก่อน Growth — partial transparency builds belief |
| Promotion path | None (just badges) | Rank Master via merit | Engagement loop for active community members |
| Customer signal | None | Voyageur ×2 weight | Differentiator: real customer voice > general public |

---

**End of document.**
