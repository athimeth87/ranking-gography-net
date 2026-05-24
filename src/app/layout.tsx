import './globals.css';
import type { Metadata, Viewport } from 'next';
import type { Organization, WithContext } from 'schema-dts';
import { Inter, IBM_Plex_Mono, Noto_Sans_Thai, Playfair_Display } from 'next/font/google';
import { AppProvider } from '@/providers/AppProvider';
import { Nav } from '@/components/layout/Nav';
import { SideMenu } from '@/components/layout/SideMenu';
import { BottomNav } from '@/components/mobile/MobileShared';
import { GlobalPopup } from '@/components/shared/GlobalPopup';
import { CookieConsent } from '@/components/shared/CookieConsent';
import { Toaster } from '@/components/layout/Toaster';
import { NotificationsListener } from '@/components/layout/NotificationsListener';
import { cn } from "@/lib/utils";

const inter = Inter({ subsets: ['latin'], weight: ['300', '400', '500', '600', '700'], variable: '--font-inter', display: 'swap' });
const plexMono = IBM_Plex_Mono({ subsets: ['latin'], weight: ['400', '500'], variable: '--font-plex-mono', display: 'swap' });
const notoThai = Noto_Sans_Thai({ subsets: ['thai'], weight: ['300', '400', '500', '600', '700'], variable: '--font-noto-thai', display: 'swap' });
const playfair = Playfair_Display({ subsets: ['latin'], weight: ['400', '500', '600', '700', '800', '900'], variable: '--font-playfair', display: 'swap' });

export const viewport: Viewport = {
  themeColor: '#0a0a0a',
};

export const metadata: Metadata = {
  title: {
    default: 'GOGRAPHY Photo Awards — Ranking',
    template: '%s | GOGRAPHY Ranking'
  },
  description: 'A photography ranking platform by photographers and travellers. Discover top-tier photography from the GOGRAPHY community.',
  openGraph: {
    title: 'GOGRAPHY Photo Awards — Ranking',
    description: 'A photography ranking platform by photographers and travellers. Discover top-tier photography from the GOGRAPHY community.',
    url: 'https://ranking.gography.net',
    siteName: 'GOGRAPHY Ranking',
    images: [
      {
        url: 'https://ranking.gography.net/cover-of-the-week.jpg', // Using the cover as default OG
        width: 1200,
        height: 630,
        alt: 'GOGRAPHY Photo Awards',
      }
    ],
    locale: 'th_TH',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'GOGRAPHY Photo Awards — Ranking',
    description: 'A photography ranking platform by photographers and travellers.',
    images: ['https://ranking.gography.net/cover-of-the-week.jpg'],
  }
};

const organizationSchema: WithContext<Organization> = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'GOGRAPHY',
  url: 'https://ranking.gography.net',
  logo: 'https://ranking.gography.net/cover-of-the-week.jpg',
  sameAs: [
    'https://www.facebook.com/Gography',
    'https://www.instagram.com/gography',
  ]
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="th" data-theme="light" className={cn(inter.variable, plexMono.variable, notoThai.variable, playfair.variable, "font-sans")} suppressHydrationWarning>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
        />
      </head>
      <body suppressHydrationWarning>
        <AppProvider>
          <Nav />
          <main>{children}</main>
          <SideMenu />
          <BottomNav />
          <NotificationsListener />
          <Toaster />
        </AppProvider>
        <GlobalPopup />
        <CookieConsent />
      </body>
    </html>
  );
}
