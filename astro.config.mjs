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
    // Fuera del sitemap: versiones para iframe, la 404 y las páginas marcadas noindex.
    // TODO(titular): quita '/inversion/' de esta lista cuando publiques su primera calculadora.
    sitemap({ filter: (page) => !['/embed/', '/404', '/inversion/'].some((x) => page.includes(x)) }),
  ],
});
