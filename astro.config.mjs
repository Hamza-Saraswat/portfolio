// @ts-check
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  site: 'https://hamza-saraswat.com',
  integrations: [
    mdx(),
    // The thank-you page and the job radar are noindex; listing them in the
    // sitemap would contradict that.
    sitemap({
      filter: (page) => !page.includes('/contact/thanks') && !page.includes('/jobs/'),
    }),
  ],
  prefetch: { prefetchAll: true, defaultStrategy: 'hover' },
  build: { format: 'directory' },
  vite: {
    plugins: [tailwindcss()],
  },
});
