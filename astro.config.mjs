// @ts-check
import { defineConfig } from 'astro/config';
import vercel from '@astrojs/vercel';

import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';
import react from '@astrojs/react';

// https://astro.build/config
export default defineConfig({
  site: 'https://www.lumovelo.com',
  adapter: vercel(),
  integrations: [
    sitemap({
      filter: (page) =>
        !page.includes('/admin') &&
        !page.includes('/workspace') &&
        !page.endsWith('/layanan/website/'),
      customPages: [
        'https://www.lumovelo.com/blog/',
        'https://www.lumovelo.com/en/blog/',
        'https://www.lumovelo.com/blog/otomatisasi-leads-ai-whatsapp/',
        'https://www.lumovelo.com/blog/keunggulan-website-headless-modern/',
        'https://www.lumovelo.com/blog/strategi-technical-seo-lokal/',
        'https://www.lumovelo.com/blog/peran-video-creative-landing-page/',
        'https://www.lumovelo.com/blog/analisis-performa-web-lighthouse/',
        'https://www.lumovelo.com/blog/tren-desain-web-minimalis/',
        'https://www.lumovelo.com/en/blog/otomatisasi-leads-ai-whatsapp/',
        'https://www.lumovelo.com/en/blog/keunggulan-website-headless-modern/',
        'https://www.lumovelo.com/en/blog/strategi-technical-seo-lokal/',
        'https://www.lumovelo.com/en/blog/peran-video-creative-landing-page/',
        'https://www.lumovelo.com/en/blog/analisis-performa-web-lighthouse/',
        'https://www.lumovelo.com/en/blog/tren-desain-web-minimalis/'
      ]
    }),
    react()
  ],
  i18n: {
    defaultLocale: 'id',
    locales: ['id', 'en'],
    routing: {
      prefixDefaultLocale: false
    }
  },
  vite: {
    plugins: [tailwindcss()],
    build: {
      sourcemap: false
    }
  }
});
