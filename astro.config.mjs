import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import VitePWA from '@vite-pwa/astro';
import mdx from '@mdx-js/rollup';

// Deployed on GitHub Pages under the /havruta/ subpath. Havruta is a true
// multi-page Astro site: every route (/, /learn, /why, /find, /start, /terms,
// /journey, /shas, /today is the same as /, /settings, /archive) is its own
// .astro page under src/pages/, sharing src/layouts/Layout.astro, and Astro
// server-renders each page's real, route-specific content (title,
// description, and static copy) at build time. The old single-page
// HashRouter build (one index.html, one client-only React app, every route a
// client-side view inside it) is gone; navigation between routes is now
// ordinary full-page browser navigation between separately built HTML files.
//
// Interactive, stateful screens (Today, Shas, Settings, Archive, and the
// static MDX-content pages) mount as React islands with client:load, never
// client:only, so Astro's React integration still server-renders their real
// markup; client:load only adds hydration on top of markup that already
// exists in the page.
//
// BYOK privacy is unaffected by this restructuring: nothing here introduces a
// server route, a proxy, or server-side logging of anything. The user's AI
// provider API key and all study/conversation content still live only in the
// browser's localStorage and are exchanged only directly between the browser
// and the provider (see src/lib/providers.js, src/lib/anthropic.js,
// src/lib/partner.js), none of which this conversion touches.
//
// The /learn, /why, /find, /start, /terms, and /journey pages are authored in
// MDX and imported into .jsx wrappers as React components that take a
// `components` prop. @mdx-js/rollup (enforce: 'pre') compiles those .mdx files
// with the React automatic runtime, exactly as the old Vite build did. The
// Astro MDX integration is deliberately not used: it would render .mdx as Astro
// components and break the React `components`-prop pattern these pages rely on.
//
// Astro emits the static, multi-page site to dist/ (one HTML file per route),
// which the GitHub Pages workflow uploads unchanged, and which
// scripts/postbuild-cf.mjs repackages unchanged (a recursive copy) for the
// Cloudflare Workers preview target.
// Two build modes share this one config. The default build (`npm run build`,
// invoked by the existing GitHub Actions workflow at
// .github/workflows/deploy.yml) must keep emitting the GitHub Pages shape:
// assets under the '/havruta/' base path, written to ./dist, exactly as
// before this change. That workflow and its output must not change behavior.
//
// A second, new build mode serves the same app from a Cloudflare Workers
// Build project named "havruta" at havruta.oranburg.law, a root domain with
// no path prefix. That target needs a root base ('/') and root-relative
// asset paths, so it cannot reuse '/havruta/'. It also writes to a
// distinctly named output directory (./dist-subdomain) rather than ./dist,
// because scripts/smoke.mjs and the GitHub Pages workflow both read ./dist
// and assert it carries the '/havruta/' prefix; if the subdomain build
// overwrote ./dist with root-relative paths, it would silently break that
// check and the Pages deploy.
//
// The CF_SUBDOMAIN_BUILD environment variable selects the subdomain mode. It
// is set only by the new `npm run build:subdomain` script (see package.json)
// and is never set by the default `npm run build` or by the GitHub Actions
// workflow.
const isSubdomainBuild = Boolean(process.env.CF_SUBDOMAIN_BUILD);
// Shared by base, the PWA manifest, and the service worker config below so
// every hardcoded path prefix in this file moves together.
const base = isSubdomainBuild ? '/' : '/havruta/';

export default defineConfig({
  base,
  output: 'static',
  outDir: isSubdomainBuild ? './dist-subdomain' : './dist',
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
        start_url: base,
        scope: base,
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
        // Every route is precached as its own real HTML file by the
        // '**/*.{html,css}' globPattern below (learn/index.html, shas/index.html,
        // and so on), so an offline visit to an already-visited route is served
        // its own page, not a generic shell. This fallback only covers a route
        // that was never precached (offline-first visit to an unfetched page),
        // where the home shell is the best available offline response.
        navigateFallback: `${base}index.html`,
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
              url.pathname.startsWith(base),
            handler: 'StaleWhileRevalidate',
            options: { cacheName: 'app-scripts', expiration: { maxEntries: 80 } }
          },
          // Local image assets (same origin, public/ directory).
          {
            urlPattern: ({ request, url }) =>
              request.destination === 'image' &&
              url.pathname.startsWith(base),
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
