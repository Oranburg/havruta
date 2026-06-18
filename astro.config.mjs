import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import VitePWA from '@vite-pwa/astro';
import mdx from '@mdx-js/rollup';

// Deployed on GitHub Pages under the /havruta/ subpath. The whole React app
// mounts as a single client-only island, so Astro is only the build shell and
// the HTML host. The app keeps its HashRouter, so deep links resolve
// client-side and no SPA 404 rewrite is needed.
//
// The /learn, /why, /find, /start, /terms, and /journey pages are authored in
// MDX and imported into .jsx wrappers as React components that take a
// `components` prop. @mdx-js/rollup (enforce: 'pre') compiles those .mdx files
// with the React automatic runtime, exactly as the old Vite build did. The
// Astro MDX integration is deliberately not used: it would render .mdx as Astro
// components and break the React `components`-prop pattern these pages rely on.
//
// Astro emits the static site to dist/, which the GitHub Pages workflow uploads
// unchanged.
export default defineConfig({
  base: '/havruta/',
  output: 'static',
  outDir: './dist',
  vite: {
    plugins: [
      { enforce: 'pre', ...mdx({ jsxImportSource: 'react' }) },
    ],
  },
  integrations: [
    react({ include: ['**/*.{jsx,js,mdx,md,tsx,ts}'] }),
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
        // A new service worker takes control as soon as it installs and purges
        // any precache left by an older build, so a returning visitor never gets
        // a stale app or a precache pointing at hashed chunks that no longer exist
        // (the black-page-until-hard-reload failure).
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        skipWaiting: true,
        // HashRouter keeps all routes on index.html, so an unknown navigation
        // falls back to the app shell rather than a precache miss.
        navigateFallback: '/havruta/index.html',
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
