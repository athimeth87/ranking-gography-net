import Link from 'next/link';

export function Footer() {
  return (
    <footer>
      <div className="wrap">
        <div className="fgrid">
          <div>
            <div className="logo mb-[18px]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo-white.png" alt="Gography" className="logo-img" />
              <small>Ranking</small>
            </div>
            <p className="th text-[13px] leading-[1.7] max-w-[360px] text-fg-soft">
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
              <li><Link href="/about-ranking">Ranking</Link></li>
            </ul>
          </div>
          <div>
            <h6>Platform</h6>
            <ul>
              <li><Link href="/about">About</Link></li>
              <li><Link href="/apply-photographer">Become a photographer</Link></li>
              <li><Link href="/terms">Terms</Link></li>
              <li><Link href="/privacy">Privacy</Link></li>
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
