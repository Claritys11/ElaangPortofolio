import type { MetadataRoute } from 'next';
import { SITE_BASE_URL } from '@/lib/seo-utils';

export default function robots(): MetadataRoute.Robots {
  const privatePaths = [
    '/admin',
    '/admin/',
    '/inbox',
    '/inbox/',
    '/assistant',
    '/assistant/',
    '/api/admin/',
    '/api/auth/',
  ];

  return {
    rules: [
      {
        userAgent: [
          'Googlebot',
          'Bingbot',
          'GPTBot',
          'OAI-SearchBot',
          'ChatGPT-User',
          'ClaudeBot',
          'Claude-SearchBot',
          'PerplexityBot',
          'Google-Extended',
        ],
        allow: ['/', '/api/public/uploads/'],
        disallow: privatePaths,
      },
      {
        userAgent: '*',
        allow: ['/', '/api/public/uploads/'],
        disallow: privatePaths,
      },
    ],
    sitemap: `${SITE_BASE_URL}/sitemap.xml`,
  };
}
