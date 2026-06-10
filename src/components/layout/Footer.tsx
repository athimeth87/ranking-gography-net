import Link from 'next/link';

export function Footer() {
  return (
    <footer className="footer-mini">
      <nav className="flex flex-wrap justify-center gap-x-6 gap-y-2 mb-4">
        <Link href="/terms" className="th font-mono text-[11px] tracking-[.18em] uppercase text-fg-soft hover:text-fg transition-colors">
          ข้อตกลงการใช้งาน
        </Link>
        <Link href="/privacy" className="th font-mono text-[11px] tracking-[.18em] uppercase text-fg-soft hover:text-fg transition-colors">
          ความเป็นส่วนตัว
        </Link>
        <Link href="/photo-rights" className="th font-mono text-[11px] tracking-[.18em] uppercase text-fg-soft hover:text-fg transition-colors">
          ลิขสิทธิ์ภาพ
        </Link>
      </nav>
      <p className="footer-tag">Ranking - Season 01</p>
    </footer>
  );
}
