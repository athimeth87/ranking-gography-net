import Link from 'next/link';

export function Footer() {
  return (
    <footer className="footer-mini">
      <Link href="/" className="footer-logo" aria-label="Gography Ranking">
        <span className="footer-lockup">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo-white.png" alt="Gography" className="logo-img" />
          <small>Ranking</small>
        </span>
        <span className="footer-word">GOGRAPHY</span>
      </Link>
      <p className="footer-tag">Ranking · Season 04</p>
    </footer>
  );
}
