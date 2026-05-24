import './globals.css';
import type { Metadata } from 'next';
import { Inter, IBM_Plex_Mono, Noto_Sans_Thai, Playfair_Display } from 'next/font/google';
import { AppProvider } from '@/providers/AppProvider';
import { Nav } from '@/components/layout/Nav';
import { TweaksPanel } from '@/components/layout/TweaksPanel';
import { SideMenu } from '@/components/layout/SideMenu';
import { cn } from "@/lib/utils";

const inter = Inter({ subsets: ['latin'], weight: ['300', '400', '500', '600', '700'], variable: '--font-inter', display: 'swap' });
const plexMono = IBM_Plex_Mono({ subsets: ['latin'], weight: ['400', '500'], variable: '--font-plex-mono', display: 'swap' });
const notoThai = Noto_Sans_Thai({ subsets: ['thai'], weight: ['300', '400', '500', '600', '700'], variable: '--font-noto-thai', display: 'swap' });
const playfair = Playfair_Display({ subsets: ['latin'], weight: ['400', '500', '600', '700', '800', '900'], variable: '--font-playfair', display: 'swap' });

export const metadata: Metadata = {
  title: 'GOGRAPHY Photo Awards — Ranking',
  description: 'A photography ranking platform by photographers and travellers',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="th" data-theme="light" className={cn(inter.variable, plexMono.variable, notoThai.variable, playfair.variable, "font-sans")}>
      <body>
        <AppProvider>
          <Nav />
          <main>{children}</main>
          <SideMenu />
          <TweaksPanel />
        </AppProvider>
      </body>
    </html>
  );
}
