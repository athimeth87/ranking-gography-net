// Shared components: Nav, Footer, PhotoCard, PulseBadge, Lightbox, etc.
// Both visual modes (atelier / editorial) share these components and adapt via CSS data-mode attribute.

const { useState, useEffect, useRef } = React;

// ============ ROUTER (state-based) ============
const RouterContext = React.createContext(null);

function useRouter() { return React.useContext(RouterContext); }

function Link({ to, children, className, style, onClick }) {
  const router = useRouter();
  const handle = (e) => {
    e.preventDefault();
    onClick && onClick(e);
    router.go(to);
  };
  return <a href={`#${to}`} onClick={handle} className={className} style={style}>{children}</a>;
}

// ============ NAV ============
function Nav({ userState = 'guest' }) {
  const router = useRouter();
  const links = [
    { to: '/', label: 'Home' },
    { to: '/explore', label: 'Explore' },
    { to: '/hall-of-fame', label: 'Hall of Fame' },
    { to: '/for-customers', label: 'For Customers' },
    { to: '/about-ranking', label: 'Pulse Score' },
    { to: '/about', label: 'About' },
  ];
  const isActive = (to) => router.path === to || (to !== '/' && router.path.startsWith(to));
  return (
    <>
      {/* Voyageur ribbon — visible when signed-in user is a verified customer */}
      {userState === 'customer' && (
        <div style={{
          background: 'var(--fg)', color: 'var(--bg)',
          padding: '10px 40px',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          fontSize: 12, letterSpacing: '.12em', textTransform: 'uppercase', fontWeight: 500,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <VoyageurMark size={8} />
            <span>Voyageur · Pim Asanachinda</span>
            <span style={{ opacity: .6, marginLeft: 12, letterSpacing: '.1em' }} className="th">— ส่งภาพเข้าหมวด Voyageurs · ฤดูกาล Spring 2026</span>
          </div>
          <div style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
            <span style={{ opacity: .6, fontFamily: 'var(--mono)' }}>TODAY 0/1 · RESETS 00:00 ICT</span>
            <a href="#/upload" onClick={(e) => { e.preventDefault(); router.go('/upload'); }} style={{ borderBottom: '1px solid var(--bg)', paddingBottom: 1, cursor: 'pointer' }}>Upload photo →</a>
            <a href="#/for-customers" onClick={(e) => { e.preventDefault(); router.go('/for-customers'); }} style={{ opacity: .7, cursor: 'pointer' }}>Programme</a>
          </div>
        </div>
      )}
      {/* Photographer ribbon — different state for approved photographer */}
      {userState === 'photographer' && (
        <div style={{
          background: 'var(--cream)', color: 'var(--fg)',
          padding: '10px 40px',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          fontSize: 12, letterSpacing: '.12em', textTransform: 'uppercase', fontWeight: 500,
          borderBottom: '1px solid var(--rule)',
        }}>
          <div>★ Photographer · Kanthorn Aroonrat</div>
          <div style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
            <span style={{ opacity: .55, fontFamily: 'var(--mono)' }}>TODAY 0/1</span>
            <a href="#/upload" onClick={(e) => { e.preventDefault(); router.go('/upload'); }} style={{ borderBottom: '1px solid var(--fg)', paddingBottom: 1, cursor: 'pointer' }}>Upload</a>
            <a href="#/me/stats" onClick={(e) => { e.preventDefault(); }} style={{ opacity: .55 }}>Stats</a>
          </div>
        </div>
      )}
      <nav className="nav">
        <div className="nav-inner">
          <div className="nav-left">
            {links.slice(0, 3).map(l => (
              <Link key={l.to} to={l.to} className={'nav-link ' + (isActive(l.to) ? 'active' : '')}>{l.label}</Link>
            ))}
          </div>
          <Link to="/" className="logo">
            <span className="mark">G</span>
            <span>Gography</span>
            <small>Photo Awards</small>
          </Link>
          <div className="nav-right">
            {links.slice(3).map(l => (
              <Link key={l.to} to={l.to} className={'nav-link ' + (isActive(l.to) ? 'active' : '')}>{l.label}</Link>
            ))}
            <button className="nav-link" onClick={() => router.go('/search')} title="Search" style={{ cursor: 'pointer' }}>Search</button>
            {userState === 'guest' ? (
              <Link to="/login" className="btn btn-sm" style={{ marginLeft: 8 }}>Sign in</Link>
            ) : (
              <Link to={`/photographer/${userState === 'customer' ? 'pim.travels' : 'kanthorn'}`} style={{ marginLeft: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--tile)', overflow: 'hidden' }}>
                  <img src={PHOTOGRAPHERS.find(p => p.username === (userState === 'customer' ? 'pim.travels' : 'kanthorn'))?.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
              </Link>
            )}
          </div>
        </div>
      </nav>
    </>
  );
}

// ============ FOOTER ============
function Footer() {
  return (
    <footer>
      <div className="wrap">
        <div className="fgrid">
          <div>
            <div className="logo" style={{ marginBottom: 18 }}>
              <span className="mark">G</span>
              <span>Gography</span>
              <small>Photo Awards</small>
            </div>
            <p style={{ fontSize: 13, lineHeight: 1.7, maxWidth: 360, color: 'var(--fg-soft)' }} className="th">
              เวทีรวมภาพถ่ายของช่างภาพและนักเดินทาง — จัดอันดับด้วย Pulse Score ที่โปร่งใส และมอบรางวัลให้ผู้ชนะทุกฤดูกาล
            </p>
          </div>
          <div>
            <h6>Browse</h6>
            <ul>
              <li><Link to="/explore">Explore</Link></li>
              <li><Link to="/explore/landscape">Landscape</Link></li>
              <li><Link to="/explore/portrait">Portrait</Link></li>
              <li><Link to="/explore/bw">Black &amp; White</Link></li>
            </ul>
          </div>
          <div>
            <h6>Awards</h6>
            <ul>
              <li><Link to="/hall-of-fame">Hall of Fame</Link></li>
              <li><Link to="/ambassadors">Ambassadors</Link></li>
              <li><Link to="/about-ranking">Pulse Score</Link></li>
            </ul>
          </div>
          <div>
            <h6>Platform</h6>
            <ul>
              <li><Link to="/about">About</Link></li>
              <li><Link to="/apply-photographer">Become a photographer</Link></li>
              <li><a href="#">Terms</a></li>
              <li><a href="#">Privacy</a></li>
            </ul>
          </div>
          <div>
            <h6>Travel with us</h6>
            <ul>
              <li><a href="https://gography.net" target="_blank" rel="noreferrer">gography.net ↗</a></li>
              <li><a href="#">Tour calendar</a></li>
              <li><a href="#">Contact</a></li>
            </ul>
          </div>
        </div>
        <div className="colophon">
          <span>© 2026 Gography Co., Ltd.</span>
          <span>ranking.gography.net · v0.1 design preview</span>
        </div>
      </div>
    </footer>
  );
}

// Photo card — uniform aspect on leaderboard variant; natural aspect otherwise
function PhotoCard({ photo, showRank=false, showRankDelta=false, leaderTopScore=null, uniform=false, pulseLabel='Pulse', size='md' }) {
  const photographer = PHOTOGRAPHERS.find(p => p.username === photo.by);
  const router = useRouter();
  const delta = (showRankDelta && leaderTopScore != null && photo.rank > 1) ? (photo.pulse - leaderTopScore) : null;
  return (
    <div className="pcard" onClick={() => router.go(`/photo/${photo.id}`)}>
      <div className="pimg" style={{ aspectRatio: uniform ? '4/5' : `${photo.w}/${photo.h}` }}>
        <img src={photo.src} alt={photo.title} loading="lazy" />
      </div>
      <div className="pmeta">
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, flex: 1, minWidth: 0 }}>
          {showRank && <span className="rank" style={{ flexShrink: 0 }}>{String(photo.rank).padStart(2,'0')}</span>}
          <div style={{ minWidth: 0, flex: 1 }}>
            <div className="ptitle" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{photo.title}</div>
            <div className="pby">{photographer ? photographer.name : photo.by}</div>
          </div>
        </div>
        <div style={{ flexShrink: 0, marginLeft: 16, textAlign: 'right' }}>
          <div className="pulse">
            <span className="big">{photo.pulse.toFixed(0)}</span>
            <span className="lab">{pulseLabel}</span>
          </div>
          {delta !== null && (
            <div className="mono" style={{ fontSize: 10, color: 'var(--fg-soft)', marginTop: 4, letterSpacing: '.04em' }}>
              {delta.toFixed(1)} from #1
            </div>
          )}
        </div>
      </div>
      {photo.picks.length > 0 && (
        <div style={{ position: 'absolute', top: 12, right: 12, display: 'flex', gap: 6 }}>
          {photo.picks.includes('editor') && photo.picks.includes('ambassador') ? (
            <PickBadge kind="both" />
          ) : (
            <>
              {photo.picks.includes('editor') && <PickBadge kind="editor" />}
              {photo.picks.includes('ambassador') && <PickBadge kind="ambassador" />}
            </>
          )}
        </div>
      )}
    </div>
  );
}

// Grid variants:
// - default: CSS columns masonry, varying aspect (natural)
// - uniform: CSS grid 4-col, uniform 4:5 aspect (for leaderboards)
function PhotoGrid({ photos, cols=3, showRank=false, showRankDelta=false, uniform=false, pulseLabel='Pulse' }) {
  // Compute leader top score once for delta display
  const leaderTopScore = (showRankDelta && photos.length > 0) ? Math.max(...photos.map(p => p.pulse)) : null;
  if (uniform) {
    return (
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: 24 }}>
        {photos.map(p => (
          <PhotoCard key={p.id} photo={p} showRank={showRank} showRankDelta={showRankDelta} leaderTopScore={leaderTopScore} uniform={true} pulseLabel={pulseLabel} />
        ))}
      </div>
    );
  }
  return (
    <div style={{ columnCount: cols, columnGap: 24 }}>
      {photos.map(p => (
        <div key={p.id} style={{ breakInside: 'avoid', marginBottom: 32 }}>
          <PhotoCard photo={p} showRank={showRank} showRankDelta={showRankDelta} leaderTopScore={leaderTopScore} pulseLabel={pulseLabel} />
        </div>
      ))}
    </div>
  );
}

// ============ LIKE BUTTON ============
function LikeButton({ photoId, baseLikes }) {
  const [liked, setLiked] = useState(() => {
    try { return JSON.parse(localStorage.getItem('gpa-liked') || '{}')[photoId] || false; } catch { return false; }
  });
  const toggle = (e) => {
    e && e.stopPropagation();
    const next = !liked;
    setLiked(next);
    try {
      const map = JSON.parse(localStorage.getItem('gpa-liked') || '{}');
      map[photoId] = next;
      localStorage.setItem('gpa-liked', JSON.stringify(map));
    } catch {}
  };
  return (
    <button className={'heart ' + (liked ? 'on' : '')} onClick={toggle} title="โหวตภาพนี้ — 1 ภาพต่อ 1 ครั้ง (โหวตภาพอื่นได้ไม่จำกัด)">
      <svg viewBox="0 0 24 24" fill={liked ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
        <path d="M12 21s-7-4.5-9.5-9.5C0 6 4 2 7.5 2c2 0 3.5 1 4.5 2.5C13 3 14.5 2 16.5 2 20 2 24 6 21.5 11.5 19 16.5 12 21 12 21z" />
      </svg>
      <span style={{ fontVariantNumeric: 'tabular-nums' }}>{(baseLikes + (liked ? 1 : 0)).toLocaleString()}</span>
    </button>
  );
}

// ============ LIGHTBOX ============
function Lightbox({ photo, onClose }) {
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => { window.removeEventListener('keydown', onKey); document.body.style.overflow = ''; };
  }, [onClose]);
  if (!photo) return null;
  const photographer = PHOTOGRAPHERS.find(p => p.username === photo.by);
  return (
    <div className="lbox-overlay" onClick={onClose}>
      <button onClick={onClose} style={{ position: 'fixed', top: 24, right: 32, color: '#fff', fontFamily: 'var(--mono)', fontSize: 12, letterSpacing: '.16em', textTransform: 'uppercase' }}>Close [Esc]</button>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 0, maxWidth: '90vw', maxHeight: '88vh', alignItems: 'stretch' }} onClick={e => e.stopPropagation()}>
        <div style={{ background: '#000', display: 'grid', placeItems: 'center' }}>
          <img src={photo.src} alt={photo.title} style={{ maxWidth: '100%', maxHeight: '88vh', objectFit: 'contain' }} />
        </div>
        <div style={{ background: '#fff', padding: '32px 28px', color: '#000', fontFamily: 'var(--sans)', fontSize: 13 }}>
          <div style={{ fontSize: 11, letterSpacing: '.16em', textTransform: 'uppercase', opacity: .5 }}>{photo.cat}</div>
          <div style={{ fontSize: 22, fontWeight: 500, marginTop: 8, letterSpacing: '-.01em' }}>{photo.title}</div>
          <div style={{ fontSize: 12, opacity: .65, marginTop: 6 }}>{photographer?.name}</div>
          <div style={{ marginTop: 24, fontFamily: 'var(--mono)', fontSize: 11, lineHeight: 1.9 }}>
            <div><span style={{ opacity: .5 }}>CAMERA</span>  {photo.exif.camera}</div>
            <div><span style={{ opacity: .5 }}>LENS</span>  {photo.exif.lens}</div>
            <div><span style={{ opacity: .5 }}>ISO</span>  {photo.exif.iso}  ·  <span style={{ opacity: .5 }}>F</span> {photo.exif.aperture}  ·  <span style={{ opacity: .5 }}>S</span> {photo.exif.shutter}</div>
            <div><span style={{ opacity: .5 }}>FOCAL</span>  {photo.exif.focal}</div>
          </div>
          <div style={{ marginTop: 24, paddingTop: 20, borderTop: '1px solid rgba(0,0,0,.1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <div className="pulse"><span className="big" style={{ fontSize: 28 }}>{photo.pulse.toFixed(0)}</span><span className="lab">Pulse</span></div>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 11, opacity: .55 }}>#{String(photo.rank).padStart(3,'0')}</div>
            </div>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 11, marginTop: 12, lineHeight: 1.7, opacity: .65 }}>
              {photo.likes.toLocaleString()} likes · {photo.favorites} favorites · {photo.comments} comments
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============ SECTION HEADER ============
function SectionHeader({ eyebrow, title, link, linkLabel }) {
  const router = useRouter();
  return (
    <div className="section-h">
      <div>
        {eyebrow && <div className="caps" style={{ marginBottom: 14, opacity: .55 }}>{eyebrow}</div>}
        <h2 className="th">{title}</h2>
      </div>
      {link && (
        <button className="caps" onClick={() => router.go(link)} style={{ cursor: 'pointer', borderBottom: '1px solid var(--fg)', paddingBottom: 4 }}>
          {linkLabel} →
        </button>
      )}
    </div>
  );
}

// ============ DESIGN NOTE BADGE ============
function DesignNote({ children }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="dnote" style={{ flexDirection: 'column', alignItems: 'flex-start', maxWidth: open ? 360 : 'auto' }}>
      <button style={{ display: 'flex', gap: 8, alignItems: 'center', cursor: 'pointer' }} onClick={() => setOpen(!open)}>
        <span className="dot"></span>
        <span>Design note {open ? '−' : '+'}</span>
      </button>
      {open && (
        <div style={{ marginTop: 10, lineHeight: 1.6, fontSize: 10.5 }}>{children}</div>
      )}
    </div>
  );
}

// Photographer card — 2x2 photo grid + avatar overlap + name/location
// Variant: 'general' (regular photographers) or 'voyageur' (customer photographers, premium treatment)
function PhotographerCard({ photographer, variant = 'general' }) {
  const router = useRouter();
  const theirPhotos = PHOTOS.filter(p => p.by === photographer.username).slice(0, 4);
  // Pad to 4 if fewer
  while (theirPhotos.length < 4) {
    theirPhotos.push(PHOTOS.find(p => p.by !== photographer.username && !theirPhotos.includes(p)) || PHOTOS[0]);
  }
  const lastTrip = photographer.customerTrips?.[0];

  return (
    <div
      onClick={() => router.go(`/photographer/${photographer.username}`)}
      style={{
        cursor: 'pointer',
        background: variant === 'voyageur' ? 'var(--cream)' : 'transparent',
        border: '1px solid var(--rule)',
        padding: 16,
        display: 'flex', flexDirection: 'column',
        transition: 'border-color .2s ease',
      }}
      onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--fg)'}
      onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--rule)'}
    >
      {/* 2x2 photo grid */}
      <div style={{ position: 'relative', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>
        {theirPhotos.slice(0, 4).map((p, i) => (
          <div key={p.id + i} style={{ aspectRatio: '1', background: 'var(--tile)', overflow: 'hidden' }}>
            <img src={p.src} alt={p.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} loading="lazy" />
          </div>
        ))}
        {/* Avatar overlapping bottom-center */}
        <div style={{
          position: 'absolute',
          left: '50%', bottom: -28,
          transform: 'translateX(-50%)',
          width: 56, height: 56, borderRadius: '50%', overflow: 'hidden',
          border: '3px solid ' + (variant === 'voyageur' ? 'var(--cream)' : 'var(--bg)'),
          background: 'var(--tile)',
        }}>
          <img src={photographer.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </div>
      </div>

      {/* Name block */}
      <div style={{ paddingTop: 40, textAlign: 'center', flex: 1, display: 'flex', flexDirection: 'column' }}>
        {variant === 'voyageur' && (
          <div className="caps" style={{ opacity: .7, fontSize: 10, marginBottom: 10, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 6 }}>
            <VoyageurMark />
            <span>Voyageur</span>
          </div>
        )}
        <div style={{ fontSize: 15, fontWeight: 500, letterSpacing: '-.005em', marginBottom: 4 }}>{photographer.name}</div>
        <div className="caps" style={{ opacity: .55, fontSize: 10 }}>{photographer.loc}</div>

        {variant === 'voyageur' && lastTrip && (
          <div className="mono" style={{ marginTop: 14, fontSize: 10, letterSpacing: '.06em', opacity: .55, lineHeight: 1.5 }}>
            ◇ {lastTrip}
          </div>
        )}

        <div style={{ marginTop: 'auto', paddingTop: 20 }}>
          {variant === 'voyageur' ? (
            <button className="btn btn-sm" style={{ width: '100%', justifyContent: 'center' }}
              onClick={(e) => { e.stopPropagation(); router.go(`/photographer/${photographer.username}`); }}>
              View collection
            </button>
          ) : (
            <button className="btn btn-sm btn-ghost" style={{ width: '100%', justifyContent: 'center' }}
              onClick={(e) => { e.stopPropagation(); }}>
              Follow
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// Curation pick badge — round icon that expands on hover to reveal label
// Editor → black with quill/E mark; Ambassador → gold with crown; Both → combined
function PickBadge({ kind = 'editor' }) {
  const config = {
    editor: { bg: 'var(--fg)', fg: 'var(--bg)', label: "Editor's Pick", icon: <EditorIcon /> },
    ambassador: { bg: '#b08e54', fg: '#fff', label: "Ambassador's Pick", icon: <CrownIcon /> },
    both: { bg: '#b08e54', fg: '#fff', label: "Editor's + Ambassador's Pick", icon: <CrownIcon withStar /> },
  };
  const cfg = config[kind];
  return (
    <div
      className="pickbadge"
      data-kind={kind}
      style={{
        height: 32, minWidth: 32,
        background: cfg.bg, color: cfg.fg,
        display: 'inline-flex', alignItems: 'center',
        overflow: 'hidden',
        transition: 'min-width .25s ease, padding .25s ease',
        padding: '0 0 0 0',
        boxShadow: kind !== 'editor' ? '0 0 0 1px rgba(0,0,0,.08)' : 'none',
      }}>
      <div style={{ width: 32, display: 'grid', placeItems: 'center', flexShrink: 0 }}>
        {cfg.icon}
      </div>
      <span
        className="pickbadge-label"
        style={{
          maxWidth: 0, overflow: 'hidden', whiteSpace: 'nowrap',
          fontSize: 10.5, letterSpacing: '.14em', textTransform: 'uppercase', fontWeight: 500,
          transition: 'max-width .25s ease, padding .25s ease',
        }}>
        {cfg.label}
      </span>
    </div>
  );
}

function CrownIcon({ withStar }) {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
      <path d="M2 5 L4 9 L6 4 L8 9 L10 4 L12 9 L14 5 L13 12 L3 12 Z" />
      {withStar && <circle cx="8" cy="7" r="1" fill="rgba(0,0,0,.35)" />}
    </svg>
  );
}

function EditorIcon() {
  // Quill / nib mark
  return (
    <svg width="13" height="13" viewBox="0 0 16 16" fill="currentColor">
      <path d="M11 2 L14 5 L7 12 L3 13 L4 9 Z" />
      <path d="M3 13 L4 12" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  );
}

Object.assign(window, { PickBadge, CrownIcon, EditorIcon });
function VoyageurMark({ size = 8 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 8 8" style={{ verticalAlign: 'middle' }}>
      <path d="M4 0 L8 4 L4 8 L0 4 Z" fill="currentColor" />
    </svg>
  );
}

// Reward icon — small luxury voucher mark
function RewardIcon({ kind = 'voucher', size = 18 }) {
  if (kind === 'voucher') {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4">
        <path d="M3 8 V16 H21 V8 Z" />
        <path d="M3 12 H21" strokeDasharray="2 2" />
        <circle cx="8" cy="12" r="1.5" fill="currentColor" />
      </svg>
    );
  }
  if (kind === 'cashback') {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4">
        <circle cx="12" cy="12" r="9" />
        <path d="M9 15 L15 9 M9 9.5 L9.5 9.5 M14.5 14.5 L15 14.5" strokeLinecap="round" />
      </svg>
    );
  }
  if (kind === 'star') {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2 L14 9 L21 10 L16 15 L17 22 L12 18 L7 22 L8 15 L3 10 L10 9 Z" />
      </svg>
    );
  }
  return null;
}

Object.assign(window, { PhotographerCard, VoyageurMark, RewardIcon });
Object.assign(window, {
  Nav, Footer, PhotoCard, PhotoGrid, LikeButton, Lightbox, SectionHeader,
  RouterContext, useRouter, Link, DesignNote,
});
