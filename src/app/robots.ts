import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/api/',       // Sembunyikan endpoint API internal
        '/_next/',     // Sembunyikan folder build Next.js
        '/public/',    // Sembunyikan direktori aset statis jika tidak perlu
      ],
    },
    sitemap: 'https://agen-lpg.netlify.app/sitemap.xml',
  }
}
