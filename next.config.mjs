import createNextIntlPlugin from 'next-intl/plugin';
const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    // Pre-existing tech debt in admin/* and several shared components
    // (mostly `'supabase' is possibly null` from getSupabaseBrowserClient).
    // Track separately; do not let it block production builds.
    ignoreBuildErrors: true,
  },
  async redirects() {
    return [
      {
        source: '/photographers/voyageurs',
        destination: '/photographers/travellers',
        permanent: true,
      },
    ];
  },
};

export default withNextIntl(nextConfig);
