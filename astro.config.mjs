import { defineConfig } from 'astro/config';
import preact from '@astrojs/preact';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://calculadoradeinteres.com',
  output: 'static',
  trailingSlash: 'always',
  build: { inlineStylesheets: 'always' },
  integrations: [
    preact(),
    // Fuera del sitemap: versiones para iframe y la 404.
    sitemap({ filter: (page) => !['/embed/', '/404'].some((x) => page.includes(x)) }),
  ],
});
