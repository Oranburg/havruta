import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import mdx from '@mdx-js/rollup';
import { VitePWA } from 'vite-plugin-pwa';

// Deployed on GitHub Pages under the /havruta/ subpath. Uses HashRouter, so deep links
// resolve client-side and no SPA 404 rewrite is needed.
export default defineConfig({
  base: '/havruta/',
  plugins: [
    // MDX runs before the React plugin (enforce: 'pre') so the .mdx that backs
    // the /learn page compiles with the React automatic runtime, the same way
    // .jsx files do. The /learn page is authored in MDX.
    { enforce: 'pre', ...mdx({ jsxImportSource: 'react' }) },
    react({ include: /\.(jsx|js|mdx|md|tsx|ts)$/ }),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'icons/apple-touch-icon.png'],
      manifest: {
        name: 'Havruta',
        short_name: 'Havruta',
        description: 'A daf yomi study partner that challenges your reading.',
        theme_color: '#0A3255',
        background_color: '#000000',
        display: 'standalone',
        start_url: '/havruta/',
        scope: '/havruta/',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icons/icon-512-maskable.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }
        ]
      },
      workbox: {
        // Cache Sefaria text and the manuscript page images so a studied daf reopens offline.
        runtimeCaching: [
          {
            urlPattern: ({ url }) => url.hostname === 'www.sefaria.org',
            handler: 'StaleWhileRevalidate',
            options: { cacheName: 'sefaria-api', expiration: { maxEntries: 600 } }
          },
          {
            urlPattern: ({ url }) => url.hostname === 'manuscripts.sefaria.org',
            handler: 'CacheFirst',
            options: { cacheName: 'sefaria-images', expiration: { maxEntries: 400 } }
          }
        ]
      }
    })
  ]
});
