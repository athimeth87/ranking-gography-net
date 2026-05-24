export function VoyageurMark({ size = 8 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 8 8" style={{ verticalAlign: 'middle' }}>
      <path d="M4 0 L8 4 L4 8 L0 4 Z" fill="currentColor" />
    </svg>
  );
}

export function CrownIcon({ withStar = false }: { withStar?: boolean }) {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
      <path d="M2 5 L4 9 L6 4 L8 9 L10 4 L12 9 L14 5 L13 12 L3 12 Z" />
      {withStar && <circle cx="8" cy="7" r="1" fill="rgba(0,0,0,.35)" />}
    </svg>
  );
}

export function EditorIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 16 16" fill="currentColor">
      <path d="M11 2 L14 5 L7 12 L3 13 L4 9 Z" />
      <path d="M3 13 L4 12" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  );
}

export function RewardIcon({ kind = 'voucher', size = 18 }: { kind?: 'voucher' | 'cashback' | 'star'; size?: number }) {
  if (kind === 'voucher') return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4">
      <path d="M3 8 V16 H21 V8 Z" />
      <path d="M3 12 H21" strokeDasharray="2 2" />
      <circle cx="8" cy="12" r="1.5" fill="currentColor" />
    </svg>
  );
  if (kind === 'cashback') return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4">
      <circle cx="12" cy="12" r="9" />
      <path d="M9 15 L15 9 M9 9.5 L9.5 9.5 M14.5 14.5 L15 14.5" strokeLinecap="round" />
    </svg>
  );
  if (kind === 'star') return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2 L14 9 L21 10 L16 15 L17 22 L12 18 L7 22 L8 15 L3 10 L10 9 Z" />
    </svg>
  );
  return null;
}

export function PickBadge({ kind = 'editor' }: { kind?: 'editor' | 'ambassador' | 'both' }) {
  const config = {
    editor: { bg: '#c0c0c0', fg: '#1a1a1a', label: 'Rank Master', icon: <CrownIcon /> },
    ambassador: { bg: '#b08e54', fg: '#fff', label: "Ambassador's Pick", icon: <CrownIcon /> },
    both: { bg: '#b08e54', fg: '#fff', label: "Rank Master + Ambassador's Pick", icon: <CrownIcon withStar /> },
  };
  const cfg = config[kind];
  return (
    <div
      className="pickbadge"
      data-kind={kind}
      style={{
        height: 32,
        minWidth: 32,
        background: cfg.bg,
        color: cfg.fg,
        display: 'inline-flex',
        flexDirection: 'row-reverse',
        alignItems: 'center',
        overflow: 'hidden',
        transition: 'min-width .25s ease, padding .25s ease',
      }}
    >
      <div style={{ width: 32, display: 'grid', placeItems: 'center', flexShrink: 0 }}>{cfg.icon}</div>
      <span
        className="pickbadge-label"
        style={{
          overflow: 'hidden',
          whiteSpace: 'nowrap',
          fontSize: 10.5,
          letterSpacing: '.14em',
          textTransform: 'uppercase',
          fontWeight: 500,
          transition: 'max-width .25s ease, padding .25s ease',
        }}
      >
        {cfg.label}
      </span>
    </div>
  );
}
