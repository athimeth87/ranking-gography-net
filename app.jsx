// Main App — hash router + Tweaks panel for dark mode + visual direction

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "dark": false,
  "mode": "atelier",
  "userState": "guest",
  "showDesignNote": true
}/*EDITMODE-END*/;

function App() {
  // Hash-based routing
  const [path, setPath] = React.useState(() => {
    const h = window.location.hash.replace('#', '');
    return h || '/';
  });

  React.useEffect(() => {
    const onHash = () => setPath(window.location.hash.replace('#', '') || '/');
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  const go = React.useCallback((to) => {
    window.location.hash = to;
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, []);

  const router = { path, go };

  // Tweaks
  const [tweaks, setTweak] = useTweaks(TWEAK_DEFAULTS);

  // Apply theme + mode to <body>
  React.useEffect(() => {
    document.body.dataset.theme = tweaks.dark ? 'dark' : 'light';
    document.body.dataset.mode = tweaks.mode;
  }, [tweaks.dark, tweaks.mode]);

  // Route resolution
  let page;
  const seg = path.split('/').filter(Boolean);
  const [root, a, b] = seg;
  if (!root) page = <PageLanding />;
  else if (root === 'explore') page = <PageExplore category={a} />;
  else if (root === 'photo') page = <PagePhoto id={a} />;
  else if (root === 'photographer') page = <PagePhotographer username={a} />;
  else if (root === 'hall-of-fame') page = <PageHallOfFame />;
  else if (root === 'ambassadors') page = <PageAmbassadors />;
  else if (root === 'about-ranking') page = <PageAboutRanking />;
  else if (root === 'about') page = <PageAbout />;
  else if (root === 'search') page = <PageSearch />;
  else if (root === 'for-customers') page = <PageForCustomers />;
  else if (root === 'upload') page = <PageUpload userState={tweaks.userState} />;
  else if (root === 'photographers') page = <PagePhotographers initialFilter={a} />;
  else if (root === 'login') page = <PageLogin />;
  else page = <Page404 />;

  return (
    <RouterContext.Provider value={router}>
      <Nav userState={tweaks.userState} />
      <main>{page}</main>

      {/* Tweaks panel */}
      <TweaksPanel title="Tweaks">
        <TweakSection label="Theme">
          <TweakToggle
            label="Dark mode"
            value={tweaks.dark}
            onChange={v => setTweak('dark', v)}
          />
        </TweakSection>
        <TweakSection label="Visual direction">
          <TweakRadio
            label="Mode"
            value={tweaks.mode}
            onChange={v => setTweak('mode', v)}
            options={[
              { value: 'atelier', label: 'Atelier' },
              { value: 'editorial', label: 'Editorial' },
            ]}
          />
          <div style={{ marginTop: 12, fontSize: 11, lineHeight: 1.6, opacity: .65, fontFamily: 'var(--mono)' }}>
            <strong style={{ opacity: 1 }}>Atelier</strong> — Aesop-like restraint. Quiet rules, lighter type.<br />
            <strong style={{ opacity: 1 }}>Editorial</strong> — magazine drama. Cover numbers, heavy display, datelines.
          </div>
        </TweakSection>
        <TweakSection label="User state">
          <TweakSelect
            label="Viewing as"
            value={tweaks.userState}
            onChange={v => setTweak('userState', v)}
            options={[
              { value: 'guest', label: 'Guest (not signed in)' },
              { value: 'user', label: 'Signed-in user' },
              { value: 'customer', label: 'Voyageur ♦ (Gography customer)' },
              { value: 'photographer', label: 'Approved photographer' },
            ]}
          />
          <div style={{ marginTop: 12, fontSize: 11, lineHeight: 1.6, opacity: .65, fontFamily: 'var(--mono)' }}>
            Switch to <strong>Voyageur</strong> to see the top ribbon, profile badge, and Voyageurs-specific CTAs.
          </div>
        </TweakSection>
        <TweakSection label="Design notes">
          <TweakToggle
            label="Show design note pill"
            value={tweaks.showDesignNote}
            onChange={v => setTweak('showDesignNote', v)}
          />
        </TweakSection>
        <TweakSection label="Quick jump">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
            {[
              ['/', 'Landing'],
              ['/explore', 'Explore'],
              ['/explore/portrait', 'Portrait'],
              ['/photo/p001', 'Photo'],
              ['/photographer/kanthorn', 'Profile'],
              ['/for-customers', 'For Customers'],
              ['/upload', 'Upload'],
              ['/photographers', 'All Photographers'],
              ['/hall-of-fame', 'Hall of Fame'],
              ['/ambassadors', 'Ambassadors'],
              ['/about-ranking', 'Pulse Score'],
              ['/about', 'About'],
              ['/search', 'Search'],
              ['/login', 'Login'],
            ].map(([to, label]) => (
              <button key={to} onClick={() => router.go(to)}
                style={{
                  padding: '8px 10px',
                  border: '1px solid var(--tweaks-border, rgba(255,255,255,.12))',
                  fontSize: 11,
                  cursor: 'pointer',
                  textAlign: 'left',
                  background: 'transparent',
                  color: 'inherit',
                  letterSpacing: '.04em',
                }}>
                {label}
              </button>
            ))}
          </div>
        </TweakSection>
      </TweaksPanel>

      {/* Design note pill */}
      {tweaks.showDesignNote && (
        <DesignNote>
          <strong>Founder gaps resolved (flagged):</strong><br />
          <em>R4 Favorites:</em> Private by default; user can publish per gallery.<br />
          <em>R5 Profile tabs:</em> 4 tabs — Photos / Galleries / Favorites / About.<br />
          <em>R8 Customer section:</em> "Both" — Customer Showcase on Landing + Hall of Fame page for past winners.<br /><br />
          <em>Scope this pass:</em> 10 public pages, desktop only, light interactivity. Use Tweaks to compare visual directions and dark mode.
        </DesignNote>
      )}
    </RouterContext.Provider>
  );
}

function Page404() {
  const router = useRouter();
  return (
    <div className="page-fade" style={{ padding: '160px 0', textAlign: 'center' }}>
      <div className="mono" style={{ fontSize: 11, letterSpacing: '.16em', textTransform: 'uppercase', opacity: .55, marginBottom: 24 }}>404 · NOT FOUND</div>
      <h1 className="th" style={{ fontSize: 64, fontWeight: 400, letterSpacing: '-.025em', margin: 0 }}>หน้านี้หายไปแล้ว</h1>
      <p className="th" style={{ marginTop: 16, color: 'var(--fg-soft)' }}>หรือไม่เคยมีอยู่จริง</p>
      <button className="btn" style={{ marginTop: 40 }} onClick={() => router.go('/')}>Back to home</button>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('app')).render(<App />);
