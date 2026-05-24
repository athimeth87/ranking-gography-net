import { Metadata } from 'next';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import { PhotoDetailClient } from './PhotoDetailClient';
import type { ImageObject, WithContext } from 'schema-dts';

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const supabase = getSupabaseServerClient();
  const { data } = await supabase.from('photos').select('title, description, storage_url, category').eq('id', params.id).single();

  if (!data) return { title: 'Photo Not Found' };

  return {
    title: data.title,
    description: data.description || `A ${data.category} photo on Gography Photo Awards`,
    openGraph: {
      title: data.title,
      description: data.description || `A ${data.category} photo on Gography Photo Awards`,
      images: [
        {
          url: data.storage_url,
          width: 1200,
          height: 800,
          alt: data.title,
        }
      ],
      type: 'article',
    },
    twitter: {
      card: 'summary_large_image',
      title: data.title,
      description: data.description || `A ${data.category} photo on Gography Photo Awards`,
      images: [data.storage_url],
    }
  };
}

export default async function PhotoPage({ params }: { params: { id: string } }) {
  const supabase = getSupabaseServerClient();
  // Fetch just enough data for the JSON-LD schema
  const { data } = await supabase.from('photos').select('title, description, storage_url, photographer_id').eq('id', params.id).single();
  let username = 'unknown';

  if (data?.photographer_id) {
    const { data: uData } = await supabase.from('users').select('username').eq('id', data.photographer_id).single();
    if (uData?.username) username = uData.username;
  }

  let schemaJson = null;
  if (data) {
    const jsonLd: WithContext<ImageObject> = {
      '@context': 'https://schema.org',
      '@type': 'ImageObject',
      contentUrl: data.storage_url,
      name: data.title,
      description: data.description || '',
      creator: {
        '@type': 'Person',
        name: username,
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
      <PhotoDetailClient id={params.id} />
    </>
  );
}
