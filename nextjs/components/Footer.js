'use client';
import Link from 'next/link';

export function Footer() {
  return (
    <footer>
      <div className="wrap">
        <div className="fgrid">
          <div>
            <div className="logo" style={{ marginBottom: 18 }}>
              <span className="mark">G</span>
              <span>GOGRAPHY</span>
              <small>Photo Awards</small>
            </div>
            <p style={{ fontSize: 13, lineHeight: 1.7, maxWidth: 360, color: 'var(--fg-soft)' }} className="th">
              เวทีรวมภาพถ่ายของช่างภาพและนักเดินทาง — จัดอันดับด้วย Pulse Score ที่โปร่งใส และมอบรางวัลให้ผู้ชนะทุกฤดูกาล
            </p>
          </div>
          <div>
            <h6>Browse</h6>
            <ul>
              <li><Link href="/explore">Explore</Link></li>
              <li><Link href="/explore/landscape">Landscape</Link></li>
              <li><Link href="/explore/portrait">Portrait</Link></li>
              <li><Link href="/explore/bw">Black &amp; White</Link></li>
            </ul>
          </div>
          <div>
            <h6>Awards</h6>
            <ul>
              <li><Link href="/hall-of-fame">Hall of Fame</Link></li>
              <li><Link href="/ambassadors">Ambassadors</Link></li>
              <li><Link href="/about-ranking">Pulse Score</Link></li>
            </ul>
          </div>
          <div>
            <h6>Platform</h6>
            <ul>
              <li><Link href="/about">About</Link></li>
              <li><Link href="/apply-photographer">Become a photographer</Link></li>
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
          <span>© 2026 GOGRAPHY Co., Ltd.</span>
          <span>ranking.gography.net · v0.1 design preview</span>
        </div>
      </div>
    </footer>
  );
}
