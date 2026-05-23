import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-6 py-24">
      <p className="caps text-[var(--fg-faint)] mb-6">Error 404</p>
      <h1 className="text-[120px] leading-none font-light tracking-[-0.04em] mb-8">
        404
      </h1>
      <p className="th text-[22px] font-light text-[var(--fg-soft)] mb-2">
        ขออภัย — ไม่พบหน้าที่คุณค้นหา
      </p>
      <p className="text-sm tracking-wide text-[var(--fg-faint)] mb-12">
        We couldn&apos;t find that page.
      </p>
      <Link href="/" className="btn">
        กลับหน้าแรก
      </Link>
    </div>
  );
}
