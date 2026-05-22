'use client';
import { useApp } from '@/providers/AppProvider';
import { getPhotographer, getPhotos } from '@/lib/data';
import { MeSidebar } from '@/components/account/MeSidebar';
import { MeDashboard } from '@/components/account/MeDashboard';
import { MePhotos } from '@/components/account/MePhotos';
import { MeFavorites } from '@/components/account/MeFavorites';
import { MeGalleries } from '@/components/account/MeGalleries';
import { MeStats } from '@/components/account/MeStats';
import { MeSettings } from '@/components/account/MeSettings';

interface PageProps {
  params: { section?: string[] };
}

export default function Page({ params }: PageProps) {
  const { userState } = useApp();
  const section = params.section?.[0] ?? 'dashboard';

  // Map userState → persona username (faithful to source persona-mapping logic)
  const personaUsername =
    userState === 'customer' ? 'pim.travels' : userState === 'photographer' ? 'kanthorn' : 'pim.travels';

  const persona = getPhotographer(personaUsername);
  if (!persona) return null;

  const isVoyageur = !!persona.isCustomer;
  const isPhotographer = userState === 'photographer';

  const myPhotos = getPhotos({ by: persona.username });

  const sections = [
    { id: 'dashboard', label: 'Dashboard', path: '/me' },
    {
      id: 'photos',
      label: 'My Photos',
      path: '/me/photos',
      count: myPhotos.length,
    },
    { id: 'favorites', label: 'Favorites', path: '/me/favorites', count: 28 },
    { id: 'galleries', label: 'Galleries', path: '/me/galleries', count: 3 },
    { id: 'stats', label: 'Stats', path: '/me/stats' },
    { id: 'settings', label: 'Settings', path: '/me/settings' },
  ];

  return (
    <div className="page-fade">
      <div
        className="wrap grid items-start"
        style={{
          padding: '48px 40px 96px',
          gridTemplateColumns: '240px 1fr',
          gap: 56,
        }}
      >
        <MeSidebar
          persona={persona}
          isVoyageur={isVoyageur}
          isPhotographer={isPhotographer}
          sections={sections}
          activeSection={section}
        />

        <main>
          {section === 'dashboard' && (
            <MeDashboard
              persona={persona}
              isVoyageur={isVoyageur}
              isPhotographer={isPhotographer}
              myPhotos={myPhotos}
            />
          )}
          {section === 'photos' && (
            <MePhotos
              persona={persona}
              myPhotos={myPhotos}
              isPhotographer={isPhotographer || isVoyageur}
            />
          )}
          {section === 'favorites' && <MeFavorites />}
          {section === 'galleries' && (
            <MeGalleries persona={persona} myPhotos={myPhotos} />
          )}
          {section === 'stats' && <MeStats persona={persona} myPhotos={myPhotos} />}
          {section === 'settings' && (
            <MeSettings persona={persona} isVoyageur={isVoyageur} />
          )}
        </main>
      </div>
    </div>
  );
}
