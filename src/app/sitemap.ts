import { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://www.getchintu.com';

  const routes = [
    '',
    '/blog',
    '/faq',
    '/pricing',
    '/support',
    '/terms',
    '/privacy',
    '/about',
    '/download',
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: route === '' ? 1 : 0.8,
  }));

  return routes;
}
