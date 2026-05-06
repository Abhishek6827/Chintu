import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/api/',
        '/room/',
        '/subscription/',
        '/setup/',
        '/sign-in/',
        '/sign-up/',
      ],
    },
    sitemap: 'https://www.getchintu.com/sitemap.xml',
  };
}
