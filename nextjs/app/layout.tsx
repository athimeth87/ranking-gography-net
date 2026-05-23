import './globals.css';
import { Nav } from '@/components/Nav';
import { SideMenu } from '@/components/SideMenu';
import { AppProvider } from '@/components/AppProvider';

export const metadata = {
  title: 'GOGRAPHY Photo Awards — Ranking',
  description: 'A photography ranking platform by photographers and travellers',
};

export default function RootLayout({ children }) {
  return (
    <html lang="th" data-theme="light">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=IBM+Plex+Mono:wght@400;500&family=Noto+Sans+Thai:wght@300;400;500;600;700&family=Playfair+Display:wght@700;800;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <AppProvider>
          <Nav />
          <SideMenu />
          <main>{children}</main>
        </AppProvider>
      </body>
    </html>
  );
}
