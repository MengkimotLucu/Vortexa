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
      filter: (page) => !page.includes('/admin') && !page.includes('/workspace')
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