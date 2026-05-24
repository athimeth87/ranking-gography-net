/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL || 'https://ranking.gography.net',
  generateRobotsTxt: true,
  exclude: ['/admin', '/admin/*', '/me', '/me/*', '/login', '/auth/*'],
  robotsTxtOptions: {
    policies: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin', '/admin/*', '/me', '/me/*', '/login', '/auth/*'],
      },
    ],
  },
}
