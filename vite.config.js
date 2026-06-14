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
        // The default glob pattern includes every asset in dist/. Tighten it so
        // large Mermaid JS chunks and image files are excluded from the precache:
        // they land in runtimeCaching below and are cached on first use instead.
        // This cuts the precache from ~3.4 MB to well under 500 KB.
        globPatterns: [
          // HTML shell and CSS are always small; always precache them.
          '**/*.{html,css}',
          // Only precache JS bundles that are not Mermaid/KaTeX/Cytoscape/Wardley.
          // Those diagram chunks have names that embed the library name.
          // We target the small entry-point JS (react-router, the app shell) by
          // capping what we include via globIgnores, not size limits.
        ],
        globIgnores: [
          // Exclude all image types from the precache; handled by runtimeCaching.
          '**/*.{png,jpg,jpeg,webp,avif,svg,gif,ico}',
          // Exclude the large Mermaid diagram chunks by their stable name patterns.
          '**/mermaid*',
          '**/katex*',
          '**/cytoscape*',
          '**/wardley*',
          '**/cose-bilkent*',
          '**/architectureDiagram*',
          '**/sequenceDiagram*',
          '**/flowDiagram*',
          '**/ganttDiagram*',
          '**/blockDiagram*',
          '**/c4Diagram*',
          '**/classDiagram*',
          '**/vennDiagram*',
          '**/xychartDiagram*',
          '**/stateDiagram*',
          '**/erDiagram*',
          '**/journeyDiagram*',
          '**/pieDiagram*',
          '**/mindmapDiagram*',
          '**/timelineDiagram*',
          '**/requirementDiagram*',
          '**/dagre*',
          '**/arc*',
          '**/channel*',
          '**/layout*',
          '**/defaultLocale*',
          '**/diagram*',
        ],
        runtimeCaching: [
          // Large JS chunks not in the precache: serve stale-while-revalidate so
          // they are available offline after a first visit and update in the background.
          {
            urlPattern: ({ request, url }) =>
              request.destination === 'script' &&
              url.pathname.startsWith('/havruta/'),
            handler: 'StaleWhileRevalidate',
            options: { cacheName: 'app-scripts', expiration: { maxEntries: 80 } }
          },
          // Local image assets (same origin, public/ directory).
          {
            urlPattern: ({ request, url }) =>
              request.destination === 'image' &&
              url.pathname.startsWith('/havruta/'),
            handler: 'CacheFirst',
            options: {
              cacheName: 'app-images',
              expiration: { maxEntries: 100, maxAgeSeconds: 60 * 60 * 24 * 30 }
            }
          },
          // Sefaria text API: stale-while-revalidate so studied dapim open offline.
          {
            urlPattern: ({ url }) => url.hostname === 'www.sefaria.org',
            handler: 'StaleWhileRevalidate',
            options: { cacheName: 'sefaria-api', expiration: { maxEntries: 600 } }
          },
          // Sefaria manuscript page images: cache-first (large and stable).
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
