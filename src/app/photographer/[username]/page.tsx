import { Metadata } from 'next';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import { PhotographerClient } from './PhotographerClient';
import type { ProfilePage, Person, WithContext } from 'schema-dts';

export async function generateMetadata({ params }: { params: { username: string } }): Promise<Metadata> {
  const supabase = getSupabaseServerClient();
  const { data } = await supabase.from('users').select('display_name, bio, avatar_url, cover_url').eq('username', params.username).single();

  if (!data) return { title: 'Photographer Not Found' };

  const name = data.display_name || params.username;
  const description = data.bio || `Check out ${name}'s photography portfolio on GOGRAPHY Photo Awards.`;

  return {
    title: name,
    description,
    openGraph: {
      title: `${name} | GOGRAPHY Ranking`,
      description,
      images: [
        {
          url: data.cover_url || data.avatar_url || 'https://ranking.gography.net/cover-of-the-week.jpg',
          width: 1200,
          height: 630,
          alt: `${name} Profile Cover`,
        }
      ],
      type: 'profile',
    },
    twitter: {
      card: 'summary_large_image',
      title: `${name} | GOGRAPHY Ranking`,
      description,
      images: [data.cover_url || data.avatar_url || 'https://ranking.gography.net/cover-of-the-week.jpg'],
    }
  };
}

export default async function PhotographerPage({ params }: { params: { username: string } }) {
  const supabase = getSupabaseServerClient();
  // Fetch data for the JSON-LD schema
  const { data } = await supabase.from('users').select('display_name, bio, avatar_url, username').eq('username', params.username).single();

  let schemaJson = null;
  if (data) {
    const jsonLd: WithContext<ProfilePage> = {
      '@context': 'https://schema.org',
      '@type': 'ProfilePage',
      mainEntity: {
        '@type': 'Person',
        name: data.display_name || data.username,
        alternateName: data.username,
        description: data.bio || '',
        image: data.avatar_url || '',
        url: `https://ranking.gography.net/photographer/${data.username}`
      }
    };
    schemaJson = jsonLd;
  }

  return (
    <>
      {schemaJson && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaJson) }}
        />
      )}
      <PhotographerClient username={params.username} />
    </>
  );
}
